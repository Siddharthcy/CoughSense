import os
import tempfile
import torch
import torch.nn as nn
import librosa
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])


class CoughSenseModel(nn.Module):
    def __init__(self, metadata_dim=6, num_targets=1):
        super().__init__()

        self.cnn = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
        )

        self.audio_projection = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
        )

        self.metadata_mlp = nn.Sequential(
            nn.Linear(metadata_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 32),
            nn.ReLU(),
        )

        self.fusion = nn.Sequential(
            nn.Linear(128 + 32, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
        )

        self.heads = nn.ModuleList([
            nn.Linear(64, 1) for _ in range(num_targets)
        ])

    def forward(self, spectrogram, metadata):
        audio_features = self.cnn(spectrogram)
        audio_features = self.audio_projection(audio_features)
        metadata_features = self.metadata_mlp(metadata)
        combined = torch.cat([audio_features, metadata_features], dim=1)
        fused = self.fusion(combined)
        outputs = torch.cat([head(fused) for head in self.heads], dim=1)
        return outputs


def load_model():
    model = CoughSenseModel(metadata_dim=6, num_targets=1) 
    model.load_state_dict(torch.load('coughsense_screening_model.pth', map_location=torch.device('cpu')))
    model.eval()
    return model

model = load_model()


def process_audio(file_path: str):
    # Safely load the temporary file from the disk
    y, sr = librosa.load(file_path, sr=22050)
    melspec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
    melspec_db = librosa.power_to_db(melspec, ref=np.max)
    
    max_length = 200
    if melspec_db.shape[1] < max_length:
        pad_width = max_length - melspec_db.shape[1]
        melspec_db = np.pad(melspec_db, pad_width=((0, 0), (0, pad_width)), mode='constant')
    else:
        melspec_db = melspec_db[:, :max_length]
        
    tensor = torch.tensor(melspec_db, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
    return tensor

def process_metadata(age: int, gender: str, smoker_status: str):
    # Age
    age_val = float(age) / 100.0 
    
    # Gender (One-Hot Encoded)
    gender = gender.lower()
    gender_male = 1.0 if gender == 'male' else 0.0
    gender_female = 1.0 if gender == 'female' else 0.0
    gender_other = 1.0 if gender not in ['male', 'female'] else 0.0
    
    # Smoking Status
    smoker_status = smoker_status.lower()
    smoker_value = 1.0 if smoker_status == 'yes' else 0.0
    smoker_missing = 1.0 if smoker_status not in ['yes', 'no'] else 0.0

    metadata_array = [
        age_val, 
        gender_male, 
        gender_female, 
        gender_other, 
        smoker_value, 
        smoker_missing
    ]
    
    return torch.tensor([metadata_array], dtype=torch.float32)


@app.post("/predict")
async def predict_cough(
    age: int = Form(...),
    gender: str = Form(...),
    smoker_status: str = Form("unknown"),
    audio: UploadFile = File(...)
):
    try:
        audio_bytes = await audio.read()
        
        # 1. Save audio to a temporary file safely
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            # 2. Process inputs
            audio_tensor = process_audio(tmp_path)
            metadata_tensor = process_metadata(age, gender, smoker_status)
            
            # 3. Run prediction
            with torch.no_grad():
                outputs = model(audio_tensor, metadata_tensor)
                probability = torch.sigmoid(outputs).item()

            return {
                "concerning": bool(probability > 0.50),
                "confidence": int(probability * 100)
            }
        
        finally:
            # 4. ALWAYS delete the temp file, even if the model crashes
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        
    except Exception as e:
        print(f"Error: {e}")
        return {"concerning": False, "confidence": 0, "error": str(e)}