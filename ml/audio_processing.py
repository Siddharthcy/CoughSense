"""
Audio preprocessing utilities for inference.
The function audio_to_melspectrogram below reproduces the exact preprocessing used at
training time (copied from the working notebook). It accepts either:
 - a parquet-style audio dictionary with a "bytes" key (audio bytes),
 - raw WAV bytes,
 - or a file-like object (e.g. Flask uploaded file) and returns a 128x256 float32
   Mel spectrogram (dB) suitable as model input.

Do NOT change the signal processing parameters: n_mels=128, fmax=sr//2, ref=np.max.
"""

import io
import numpy as np
import soundfile as sf
import librosa


def audio_to_melspectrogram(audio_input, target_frames=256):
    """
    Convert WAV audio bytes or uploaded file into a fixed-size Mel spectrogram.

    Parameters
    - audio_input: one of
        * dict with key "bytes" containing WAV bytes (parquet audio dict),
        * bytes containing WAV data,
        * file-like object with .read() (Flask FileStorage),
        * path-like string to a file.
    - target_frames: number of time frames (default 256) to pad/crop to.

    Returns
    - mel_db: np.ndarray shape (128, target_frames), dtype float32
    """

    # Extract raw bytes depending on input type
    if isinstance(audio_input, dict):
        # Parquet audio representation: audio_input["bytes"]
        audio_bytes = audio_input.get("bytes")
        if audio_bytes is None:
            raise ValueError("audio dict did not contain key 'bytes'")
        bio = io.BytesIO(audio_bytes)
    elif isinstance(audio_input, (bytes, bytearray)):
        bio = io.BytesIO(audio_input)
    elif hasattr(audio_input, "read"):
        # File-like (e.g., Flask FileStorage)
        data = audio_input.read()
        bio = io.BytesIO(data)
    elif isinstance(audio_input, str):
        # Path to file on disk
        bio = audio_input
    else:
        raise ValueError("Unsupported audio_input type")

    # Decode WAV using soundfile. soundfile accepts file-like objects as buffer.
    if isinstance(bio, str):
        waveform, sample_rate = sf.read(bio)
    else:
        waveform, sample_rate = sf.read(bio)

    # Convert stereo to mono if necessary
    if waveform.ndim > 1:
        waveform = waveform.mean(axis=1)

    # Compute mel spectrogram using librosa with the same parameters used in training
    mel = librosa.feature.melspectrogram(
        y=waveform.astype(np.float32),
        sr=sample_rate,
        n_mels=128,
        fmax=sample_rate // 2,
    )

    mel_db = librosa.power_to_db(
        mel,
        ref=np.max,
    ).astype(np.float32)

    current_frames = mel_db.shape[1]

    if current_frames < target_frames:
        pad_width = target_frames - current_frames
        mel_db = np.pad(
            mel_db,
            ((0, 0), (0, pad_width)),
            mode="constant",
            constant_values=mel_db.min(),
        )
    elif current_frames > target_frames:
        mel_db = mel_db[:, :target_frames]

    return mel_db
