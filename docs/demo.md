# Demo flow

1. Start the application: `python app.py`.
2. Open the web app in a browser (http://127.0.0.1:5000).
3. Enter an age, select gender, select smoking status.
4. Upload a cough recording (WAV recommended) and press "Run Screening".
5. Wait for the analysis to complete — the page displays a probability and a short recommendation.
6. Read the disclaimer: CoughSense is a screening aid and not a medical diagnosis; cause cannot be determined from the screening.

Notes
- For local testing use short cough recordings. The preprocessing expects WAV data that soundfile can decode.
- The model weights are loaded from models/coughsense_screening_model.pth. If the file is missing, the server will fail to start.

