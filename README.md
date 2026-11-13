# CoughSense

AI-assisted respiratory pre-screening from a recorded cough.

CoughSense takes a short cough recording plus a few contextual answers (age, gender, smoking status) and returns a probability for a single target, **respiratory concern**. A small CNN reads the cough's Mel spectrogram, an MLP reads the contextual features, and the two are fused into one score.

> **Disclaimer:** CoughSense is a hackathon prototype and a screening aid, **not a medical diagnosis**. It cannot determine the cause of a signal, and a low score is not a clearance. It must not be used for clinical decisions. Always consult a qualified healthcare professional about respiratory symptoms.

---

## Table of contents

- [Live demo](#live-demo)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [API reference](#api-reference)
- [WebM to WAV conversion](#webm-to-wav-conversion)
- [Model details](#model-details)
- [Dataset and training](#dataset-and-training)
- [Known limitations](#known-limitations)
- [Documentation](#documentation)

---

## Live demo

**[coughsense-frontendv2.onrender.com](https://coughsense-frontendv2.onrender.com/)**

The deployed web app lets you try a screening in the browser:

1. **Record** a cough with the microphone, or **upload** an audio file (WAV, MP3, M4A, OGG or WebM, up to 15 MB). A 2–8 second recording works best.
2. Enter your **age**, **gender** and **smoking status**.
3. Press **Analyze Cough** to get a respiratory-concern probability, a short recommendation and the disclaimer.

The page also explains how the model works, shows the prototype's test-set results, and describes the architecture and tech stack.

**Hosting:**
- The Next.js front-end and the model service are both hosted on [Render](https://render.com/), on separate services.
- The browser sends each screening as one `POST /predict` request to the model service. The model never runs in the browser.
- Both services can go to sleep when idle, so the first screening after a quiet period can take from about 20 seconds to over a minute while the server wakes up.

---

## How it works

```
User records / uploads a cough
        │
        ▼
Next.js front-end  ── POST /predict (multipart/form-data: audio, age, gender, smoker)
        │
        ▼
Flask service
   ├─ Audio conversion     → mono 16-bit WAV (from WebM, M4A, MP3, OGG, FLAC or WAV)
   ├─ Audio preprocessing  → Mel spectrogram (dB)
   ├─ Metadata encoding    → 6-dim vector
   └─ CoughSense model     → CNN (audio) + MLP (metadata) → fusion → 1 logit
        │
        ▼
sigmoid → probability of "respiratory_concern"
        │
        ▼
Front-end result view (animated screening result + disclaimer)
```

The browser never runs the model. Every screening is a single request to the Python service that owns preprocessing and inference.

## Project structure

```
CoughSense-main/
├── front-end/                          # Next.js 16 + React 19 web app (Tailwind CSS 4)
│   ├── app/                            # layout, page, global styles
│   ├── components/                     # hero, audio input, screening card, result card, ...
│   └── lib/utils.ts
├── ml/                                 # Reusable model + inference code
│   ├── model.py                        # CoughSenseModel (PyTorch)
│   ├── audio_processing.py             # WAV → fixed-size Mel spectrogram
│   └── inference.py                    # Model loading, metadata encoding, predict_from_input()
├── models/
│   └── coughsense_screening_model.pth  # Weights loaded by ml/inference.py
├── notebooks/
│   └── 01_dataset_inspection.ipynb     # Dataset preparation, training and evaluation code
├── docs/                               # architecture, dataset and model notes
├── app.py                              # Flask server built on ml/inference.py (WAV/FLAC/OGG/MP3 only)
├── app_wav.py                          # app.py plus WebM/M4A → WAV conversion and CORS for the front-end
└── requirements.txt
```

## Tech stack

| Layer | Technologies |
| --- | --- |
| Front-end | Next.js, React, Tailwind CSS, Framer Motion, shadcn/ui, Lucide icons |
| Back-end | Python, Flask, Flask-CORS |
| AI / audio | PyTorch, librosa, soundfile, FFmpeg, NumPy |
| Data / training | Coswara-derived dataset (Parquet), pandas, scikit-learn |

## API reference

### `POST /predict` (Flask, `app.py`)

Content type: `multipart/form-data`, with form fields `audio`, `age`, `gender` (`male`/`female`/`other`) and `smoker`.

`smoker` accepts `yes`/`no` (also `y`/`n`, `true`/`false`, `1`/`0`). Anything else, or a missing field, counts as unknown.

Responds with:

```json
{
  "result": {
    "probability": 0.72,
    "recommendation": "Further medical evaluation is recommended.",
    "message": "Probability of recorded respiratory concern: 0.720. Cause cannot be determined from this screening.",
    "disclaimer": "CoughSense is a screening aid, not a medical diagnosis."
  }
}
```

Invalid input returns HTTP 400 with an `error` message, for example `"Age must be a number."` or `"No audio file provided."`.

## WebM to WAV conversion

Browsers record audio as **WebM** (Chrome, Firefox) or **M4A** (Safari). The model's preprocessing in `ml/audio_processing.py` reads audio with soundfile, which cannot open those formats, so `app.py` rejects browser recordings.

`app_wav.py` fixes this. It is a copy of `app.py` that converts every upload to WAV before prediction, and it serves the same `POST /predict` route with the same fields and response.

**How the conversion works**

1. **soundfile** tries to read the upload first. It handles WAV, FLAC, OGG and MP3 in a few milliseconds.
2. If soundfile can't read it (WebM, M4A), **FFmpeg** decodes it. The file extension doesn't matter, so a browser upload named `blob` works too.
3. The audio is mixed down to mono and written as a **16-bit PCM WAV at its original sample rate**, matching how the training data was processed.
4. The WAV is kept in memory and passed straight to the model. FFmpeg's temporary input file is always deleted.

**Other differences from `app.py`**

- **FFmpeg lookup:** it uses FFmpeg from your `PATH` if installed, and otherwise the copy bundled with the `imageio-ffmpeg` package in `requirements.txt`.
- **CORS:** it is enabled on `/predict`, so the Next.js front-end can call it from the browser.
- **Smoking values:** it translates the front-end's values: `smoker` → yes, `non-smoker` → no, `prefer-not-to-say` → unknown.
- **Clearer errors:** unreadable or empty uploads return HTTP 400 with `"Unsupported or corrupted audio file."` or `"The audio file is empty."`.

**Test results** (synthetic cough sound, Windows PC)

| Upload | Result | Time per request |
| --- | --- | --- |
| WebM (Opus), M4A (AAC) | ✓ converted | ~0.6 s, mostly FFmpeg start-up |
| MP3, OGG, FLAC, WAV, stereo WAV | ✓ converted | ~20–30 ms |
| Non-audio file, empty file | Rejected with HTTP 400 | — |

The first request takes a few extra seconds while the model loads.

## Model details

**Input**

- A Mel spectrogram: 128 mel bands, shaped `(1, 1, 128, T)`, with power converted to dB (`ref=np.max`).
- A 6-element metadata vector: `[age/100, gender_male, gender_female, gender_other, smoker_value, smoker_missing]`.

**Architecture (`CoughSenseModel`)**

| Branch | Layers |
| --- | --- |
| CNN (audio) | 3 × [Conv2d 3×3 → BatchNorm → ReLU] with channels 1→16→32→64, MaxPool after the first two, then AdaptiveAvgPool → Linear(64→128) → ReLU → Dropout(0.3) |
| MLP (metadata) | Linear(6→32) → ReLU → Dropout(0.2) → Linear(32→32) → ReLU |
| Fusion | Concat (128 + 32) → Linear(160→64) → ReLU → Dropout(0.3) |
| Head | Linear(64→1) → sigmoid at inference |

**Output:** one probability for `respiratory_concern`. The model has no ability to say *which* condition is present.

## Dataset and training

Training happened in [`notebooks/01_dataset_inspection.ipynb`](notebooks/01_dataset_inspection.ipynb), using a Coswara-derived dataset that is kept outside this repository because of its size (audio is stored as WAV bytes inside Parquet shards).

- **Recordings used:** `cough-heavy` and `cough-shallow`. Recordings with quality score `0` (bad) are dropped; `1` (good) and `2` (excellent) are kept.
- **Splits:** the dataset's own train / validation / test split is kept, and the notebook checks that no participant appears in more than one split, to prevent leakage.
- **Label:** `respiratory_concern` is positive if the participant has an explicit annotation for asthma, pneumonia, fever or loss of smell, or a positive COVID status (`positive_mild`, `positive_moderate`, `positive_asymp`). It is negative when COVID status is `healthy` with no positive indicator, and left unlabelled otherwise. Unlabelled samples are excluded from the loss and from evaluation, not treated as negatives.
- **Training:** Adam, learning rate 1e-3, batch size 32, 10 epochs, with the lowest-validation-loss weights kept.

### Test-set results

These are the held-out test results shown on the CoughSense website (threshold 0.5):

| Precision | Recall | F1-score | ROC-AUC |
| --- | --- | --- | --- |
| 86.84% | 66.0% | 75.0% | 81.69% |

| | Predicted no concern | Predicted concern |
| --- | --- | --- |
| **Actual no concern** | 363 (true negative) | 25 (false positive) |
| **Actual concern** | 85 (false negative) | 165 (true positive) |

A recall of 66% means about one in three labelled positives was missed, which is another reason this must not be used as a diagnostic tool.

To re-run the notebook you will need the dataset plus `pandas`, `pyarrow`, `scikit-learn`, `matplotlib` and `jupyter`, none of which are in `requirements.txt`. Update `DATASET_DIR` in the notebook to wherever you keep the data.

## Known limitations

- **Prototype only.** Not clinically validated and not for medical use.
- **Limited labels.** The training data has sparse and uneven annotations, and the target is a broad "respiratory concern" grouping rather than a specific condition.
- **Compressed audio shifts the score slightly.** In a synthetic test, the same sound scored up to about 0.09 higher as WebM or MP3 than as the original WAV. The model was trained on WAV recordings, and lossy codecs change the spectrogram a little.
- **No Flask web page.** `app.py` defines `GET /`, which renders `frontend/templates/index.html`, but that file is not in the repo, so only `POST /predict` works.
- **No automated tests.**

### Live demo limitations

The hosted model service runs the FastAPI version of the API (the same `/predict` interface as `backend/api.py` in this repo), not `app_wav.py`. That means:

- **Slow first request.** The services sleep when idle; waking them can take from about 20 seconds to over a minute.
- **Smoking status is ignored until the backend is redeployed.**
  - The deployed service only reads a field called `smoker_status`, but the site sends the answer as `smoker`, so every live screening is scored as "smoking status unknown". In testing, this changed the score of the same recording from 0.50 (smoker) or 0.31 (non-smoker) to 0.06 (unknown).
  - `backend/api.py` in this repo is already fixed: it also accepts `smoker` and translates the site's values (`smoker` → yes, `non-smoker` → no, `prefer-not-to-say` → unknown). Redeploying it to Render fixes the live demo.
- **Errors can look like a low score.** If the service fails while processing a recording, it still replies with success and a confidence of 0, which the site shows as a very low probability instead of an error.
- **Preprocessing differs from training.** The service resamples audio to 22,050 Hz and uses 200 time frames, while the model was trained at the recording's native sample rate with 256 frames. Its scores may therefore differ from the local Flask servers for the same recording.
- **Open to any website.** The service accepts requests from every origin (CORS `*`).

## Documentation

More detail is in [`docs/`](docs): [architecture](docs/architecture.md), [dataset](docs/dataset.md) and [model](docs/model.md).
