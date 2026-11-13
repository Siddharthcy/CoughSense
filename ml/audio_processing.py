import io
import numpy as np
import soundfile as sf
import librosa


def audio_to_melspectrogram(audio_input, target_frames=256):

    if isinstance(audio_input, dict):
        audio_bytes = audio_input.get("bytes")
        if audio_bytes is None:
            raise ValueError("audio dict did not contain key 'bytes'")
        bio = io.BytesIO(audio_bytes)
    elif isinstance(audio_input, (bytes, bytearray)):
        bio = io.BytesIO(audio_input)
    elif hasattr(audio_input, "read"):
        data = audio_input.read()
        bio = io.BytesIO(data)
    elif isinstance(audio_input, str):
        bio = audio_input
    else:
        raise ValueError("Unsupported audio_input type")

    if isinstance(bio, str):
        waveform, sample_rate = sf.read(bio)
    else:
        waveform, sample_rate = sf.read(bio)

    if waveform.ndim > 1:
        waveform = waveform.mean(axis=1)

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
