from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import traceback

from ml.inference import predict_from_input

app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024


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
        smoker = request.form.get("smoker")

        try:
            _ = float(age)
        except Exception:
            return jsonify({"error": "Age must be a number."}), 400

        if gender not in ("male", "female", "other"):
            return jsonify({"error": "Gender must be 'male', 'female' or 'other'."}), 400

        result = predict_from_input(audio_file, age, gender, smoker)

        return jsonify({"result": result})

    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred processing the request."}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

