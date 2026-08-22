# Model

Summary of the model and preprocessing used for the CoughSense screening model.

Preprocessing
- Audio: WAV bytes decoded with soundfile, stereo→mono by averaging channels when needed, Mel spectrogram computed using librosa.feature.melspectrogram with n_mels=128 and fmax=sr//2. Power spectrogram converted to dB via librosa.power_to_db(ref=np.max). Spectrograms are padded or cropped to 256 time frames and returned as float32.

Model architecture
- CNN branch: Conv2d 1→16 → BN → ReLU → MaxPool, Conv2d 16→32 → BN → ReLU → MaxPool, Conv2d 32→64 → BN → ReLU → AdaptiveAvgPool → Linear(64→128)
- MLP branch: Linear(6→32) → ReLU → Dropout → Linear(32→32) → ReLU
- Fusion: concat(128,32) → Linear(160→64) → ReLU → Dropout
- Output: Linear(64→1) single screening head.

Output
- The model produces a single logit. At inference a sigmoid is applied to obtain a probability for "respiratory_concern".

Limitations
- Single-output screening only. The model does not identify causes and is not a clinical diagnostic tool.

