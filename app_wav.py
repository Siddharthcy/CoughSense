from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import io
import os
import shutil
import subprocess
import tempfile
import traceback

import numpy as np
import soundfile as sf

from ml.inference import predict_from_input

app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")
CORS(app, resources={r"/predict": {"origins": "*"}})

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

FFMPEG_TIMEOUT_SECONDS = 60

SMOKER_VALUES = {
    "smoker": "yes",
    "non-smoker": "no",
    "prefer-not-to-say": None,
}


class AudioConversionError(Exception):
    pass


def normalize_smoker(value):
    if value is None:
        return None
    key = value.strip().lower()
    if key in SMOKER_VALUES:
        return SMOKER_VALUES[key]
    return value


def find_ffmpeg():
    path = shutil.which("ffmpeg")
    if path:
        return path
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def decode_with_ffmpeg(data, filename):
    ffmpeg = find_ffmpeg()
    if ffmpeg is None:
        raise RuntimeError("FFmpeg is not available. Install FFmpeg or the imageio-ffmpeg package.")

    suffix = os.path.splitext(filename or "")[1] or ".bin"
    fd, input_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        result = subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-i", input_path,
             "-vn", "-ac", "1", "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"],
            capture_output=True,
            timeout=FFMPEG_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        raise AudioConversionError("Audio conversion took too long.")
    finally:
        os.remove(input_path)

    if result.returncode != 0 or not result.stdout:
        raise AudioConversionError("Unsupported or corrupted audio file.")

    return sf.read(io.BytesIO(result.stdout), dtype="float32")


def convert_to_wav(data, filename):
    if not data:
        raise AudioConversionError("The audio file is empty.")

    try:
        waveform, sample_rate = sf.read(io.BytesIO(data), dtype="float32")
    except Exception:
        waveform, sample_rate = decode_with_ffmpeg(data, filename)

    if waveform.ndim > 1:
        waveform = waveform.mean(axis=1)

    if waveform.size == 0:
        raise AudioConversionError("The audio file contains no sound.")

    waveform = np.clip(waveform, -1.0, 1.0)

    buffer = io.BytesIO()
    sf.write(buffer, waveform, sample_rate, format="WAV", subtype="PCM_16")
    return buffer.getvalue()


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided."}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No selected file."}), 400

        age = request.form.get("age")
        gender = request.form.get("gender")
        smoker = normalize_smoker(request.form.get("smoker"))

        try:
            _ = float(age)
        except Exception:
            return jsonify({"error": "Age must be a number."}), 400

        if gender not in ("male", "female", "other"):
            return jsonify({"error": "Gender must be 'male', 'female' or 'other'."}), 400

        try:
            wav_bytes = convert_to_wav(audio_file.read(), audio_file.filename)
        except AudioConversionError as e:
            return jsonify({"error": str(e)}), 400

        result = predict_from_input(wav_bytes, age, gender, smoker)

        return jsonify({"result": result})

    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred processing the request."}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
