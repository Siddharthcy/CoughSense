# Architecture

CoughSense uses a multimodal architecture composed of two branches:

- CNN branch (audio): processes 128x256 Mel spectrogram inputs produced by librosa. The CNN consists of three Conv2d blocks (1→16, 16→32, 32→64) with BatchNorm, ReLU and pooling, followed by an AdaptiveAvgPool and a Linear projection to a 128-d audio embedding.

- MLP branch (metadata): processes a 6-dimensional contextual vector (age/100, one-hot gender (male/female/other), smoker value, smoker missing flag). The MLP projects this input to a 32-d embedding.

- Fusion: The 128-d audio embedding and 32-d metadata embedding are concatenated to a 160-d vector, passed through a linear layer (160→64), ReLU and Dropout.

- Output: A single linear head (64→1) that produces a logit for "respiratory_concern". During inference the logit is passed through a sigmoid to obtain a probability.

This design mirrors the training code used to create the provided model weights.

