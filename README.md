# CoughSense

CoughSense is a hackathon prototype that performs AI-assisted respiratory pre-screening from a recorded cough. It uses a Mel spectrogram processed by a small convolutional network and contextual metadata (age, gender, smoking) processed by an MLP. The two branches are fused to produce a probabilistic screening score for "respiratory_concern".

Important: This is a prototype and not a medical diagnostic tool. See the disclaimer in the web app.

Quick start
-----------

1. Install dependencies:

   pip install -r requirements.txt

2. Run the application locally:

   python app.py

3. Open http://127.0.0.1:5000 in a browser and try the demo.

Model
-----

The trained model weights are loaded from models/coughsense_screening_model.pth at runtime. The model class is implemented in ml/model.py and the exact preprocessing logic is implemented in ml/audio_processing.py. Inference utilities are available in ml/inference.py.

Design notes
------------

- Audio is converted to a 128x256 Mel spectrogram (dB) using librosa, matching the training preprocessing.
- Metadata is encoded as a 6-dimensional vector: [age/100, gender_male, gender_female, gender_other, smoker_value, smoker_missing].
- The model outputs a single logit which is passed through a sigmoid to obtain a probability of "respiratory_concern".

Limitations
-----------

- Prototype / hackathon quality code. Not for clinical use.
- The model was trained on a curated dataset derived from Coswara; labels contain missing/limited annotations.
- This app does not retrain the model and does not alter the dataset methodology.

