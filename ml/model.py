import torch
import torch.nn as nn


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

        combined = torch.cat(
            [audio_features, metadata_features],
            dim=1,
        )

        fused = self.fusion(combined)

        outputs = torch.cat(
            [head(fused) for head in self.heads],
            dim=1,
        )

        return outputs
