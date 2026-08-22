# Dataset

The project used a Coswara-derived dataset stored outside the repository. Key points:

- Audio recordings were stored inside Parquet shards where each audio cell contains a small dictionary with WAV bytes. The notebook demonstrates decoding the bytes into waveforms.
- Participant metadata is stored in Parquet files and matched to audio via participant IDs.
- The dataset was split into train/validation/test with participant-level disjoint splits to prevent leakage.
- Recording types include cough-heavy and cough-shallow; audio quality flags are used to filter out low-quality recordings (quality 0 = excluded; 1 = good; 2 = excellent).
- Missing annotations are represented explicitly (e.g., -1) and are not treated as negative labels during training.

