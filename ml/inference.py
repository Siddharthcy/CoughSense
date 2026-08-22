"""
Inference utilities: load the trained model and run a screening prediction.

Functions:
 - load_model(weights_path): returns (model, device)
 - predict_from_input(audio_input, age, gender, smoker): returns dict with probability and recommendation

This module selects CUDA if available, otherwise CPU. The model is loaded with
CoughSenseModel(metadata_dim=6, num_targets=1) and weights from models/coughsense_screening_model.pth

Do NOT retrain or alter the model during inference.
"""

import os
import torch
import torch.nn.functional as F
from ml.model import CoughSenseModel
from ml.audio_processing import audio_to_melspectrogram
import numpy as np


_MODEL = None
_DEVICE = None


def load_model(weights_path=None):
    """
    Load the model and return (model, device). Uses a module-level cache.
    """
    global _MODEL, _DEVICE

    if _MODEL is not None:
        return _MODEL, _DEVICE

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = CoughSenseModel(metadata_dim=6, num_targets=1)

    if weights_path is None:
        # repository-relative models folder
        base = os.path.dirname(os.path.dirname(__file__))
        weights_path = os.path.join(base, "models", "coughsense_screening_model.pth")

    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Model weights not found at: {weights_path}")

    state = torch.load(weights_path, map_location=device)

    # Support direct state_dict or full checkpoint
    if isinstance(state, dict) and "state_dict" in state:
        state_dict = state["state_dict"]
    else:
        state_dict = state

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    _MODEL = model
    _DEVICE = device
    return _MODEL, _DEVICE


def _encode_metadata(age, gender, smoker):
    """
    Encode contextual inputs into the 6-element vector used by the model.

    Order:
    [age/100.0, gender_male, gender_female, gender_other, smoker_value, smoker_missing]
    """
    # Age: ensure numeric
    try:
        age_val = float(age)
    except Exception:
        raise ValueError("Age must be a number")

    age_norm = age_val / 100.0

    gender = (gender or "").lower()
    if gender == "male":
        gender_encoded = [1.0, 0.0, 0.0]
    elif gender == "female":
        gender_encoded = [0.0, 1.0, 0.0]
    else:
        gender_encoded = [0.0, 0.0, 1.0]

    # Smoking: accept 'y','yes','true',1 as smoker; 'n','no','false',0 as non-smoker; None/'' missing
    smoker_missing = 0.0
    smoker_value = 0.0
    if smoker is None:
        smoker_missing = 1.0
    else:
        sval = str(smoker).strip().lower()
        if sval in ("", "nan"):
            smoker_missing = 1.0
        elif sval in ("y", "yes", "true", "1", "t"): 
            smoker_value = 1.0
            smoker_missing = 0.0
        elif sval in ("n", "no", "false", "0", "f"):
            smoker_value = 0.0
            smoker_missing = 0.0
        else:
            # treat unknown strings as missing
            smoker_missing = 1.0
            smoker_value = 0.0

    vec = [age_norm, *gender_encoded, smoker_value, smoker_missing]
    return np.array(vec, dtype=np.float32)


def predict_from_input(audio_input, age, gender, smoker):
    """
    Run a single prediction.

    Parameters:
    - audio_input: passed to audio_to_melspectrogram (see that function docstring)
    - age: numeric
    - gender: 'male'|'female'|'other' (case-insensitive)
    - smoker: string/boolean/None

    Returns:
    dict with keys: probability (float 0-1), recommendation (string), message (string)
    """
    model, device = load_model()

    # Preprocess audio
    mel = audio_to_melspectrogram(audio_input, target_frames=256)

    # Convert to tensor: shape (1, 1, 128, 256)
    import torch

    mel_tensor = torch.tensor(mel, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)

    # Metadata encoding
    metadata_vec = _encode_metadata(age, gender, smoker)
    metadata_tensor = torch.tensor(metadata_vec, dtype=torch.float32).unsqueeze(0).to(device)

    # Forward
    with torch.no_grad():
        logits = model(mel_tensor, metadata_tensor)
        # logits shape (1, num_targets) — our model has one target
        prob = torch.sigmoid(logits)[0, 0].item()

    # Recommendation rules (simple, non-medical language)
    if prob < 0.5:
        recommendation = "No strong recorded respiratory indicators detected."
    else:
        recommendation = "Further medical evaluation is recommended."

    message = (
        f"Probability of recorded respiratory concern: {prob:.3f}. "
        "Cause cannot be determined from this screening."
    )

    return {
        "probability": float(prob),
        "recommendation": recommendation,
        "message": message,
        "disclaimer": "CoughSense is a screening aid, not a medical diagnosis.",
    }
