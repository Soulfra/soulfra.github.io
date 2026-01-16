#!/usr/bin/env python3
"""
XTTS-v2 Voice Cloning for Soulfra Digital Twin
Clones voice from 6-30 second audio sample using Coqui TTS
"""

import sys
import os
import json
import base64
import wave
from io import BytesIO
from TTS.api import TTS

# Global model cache
_tts = None

def load_xtts_model():
    """Load XTTS-v2 model (cached)"""
    global _tts

    if _tts is not None:
        return _tts

    print("🎤 Loading XTTS-v2 model...", file=sys.stderr)

    # Initialize TTS with XTTS-v2 multilingual model
    _tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

    print("✅ XTTS-v2 loaded", file=sys.stderr)

    return _tts

def analyze_voice_sample(audio_path):
    """Analyze voice characteristics from audio sample"""
    import librosa
    import numpy as np

    # Load audio
    y, sr = librosa.load(audio_path, sr=None)

    # Extract features
    # Pitch (F0)
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_values = []
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        if pitch > 0:
            pitch_values.append(pitch)

    # Speaking rate (syllable rate approximation)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)

    # Energy/loudness
    rms = librosa.feature.rms(y=y)[0]
    energy_mean = float(np.mean(rms))

    # Spectral characteristics
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    brightness = float(np.mean(spectral_centroid))

    return {
        "pitch_mean_hz": float(np.mean(pitch_values)) if pitch_values else 0,
        "pitch_std_hz": float(np.std(pitch_values)) if pitch_values else 0,
        "pitch_range": {
            "min_hz": float(np.min(pitch_values)) if pitch_values else 0,
            "max_hz": float(np.max(pitch_values)) if pitch_values else 0
        },
        "speaking_rate_bpm": float(tempo),
        "energy_mean": energy_mean,
        "spectral_brightness": brightness,
        "duration_seconds": float(len(y) / sr),
        "sample_rate": int(sr)
    }

def clone_voice(audio_sample_path, text_to_speak, output_path):
    """
    Clone voice and generate speech

    Args:
        audio_sample_path: Path to WAV file (6+ seconds)
        text_to_speak: Text to synthesize
        output_path: Path to save generated speech WAV

    Returns:
        dict with success status and metadata
    """

    tts = load_xtts_model()

    print(f"🎙️ Cloning voice from: {audio_sample_path}", file=sys.stderr)
    print(f"💬 Generating speech: '{text_to_speak[:50]}...'", file=sys.stderr)

    # Generate speech with voice cloning
    tts.tts_to_file(
        text=text_to_speak,
        speaker_wav=audio_sample_path,
        language="en",  # Auto-detect or specify: en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh, ja, hu, ko, hi
        file_path=output_path
    )

    print(f"✅ Generated: {output_path}", file=sys.stderr)

    # Analyze original voice characteristics
    characteristics = analyze_voice_sample(audio_sample_path)

    return {
        "success": True,
        "output_file": output_path,
        "voice_characteristics": characteristics,
        "text_length": len(text_to_speak),
        "model": "xtts_v2"
    }

def voice_to_base64(wav_path):
    """Convert WAV file to base64 data URL"""
    with open(wav_path, 'rb') as f:
        wav_data = f.read()

    base64_data = base64.b64encode(wav_data).decode('utf-8')
    return f"data:audio/wav;base64,{base64_data}"

def base64_to_wav(data_url, output_path):
    """Convert base64 data URL to WAV file"""
    if data_url.startswith('data:audio'):
        # Remove data:audio/wav;base64, prefix
        audio_data = data_url.split(',')[1]
    else:
        audio_data = data_url

    # Decode and save
    wav_bytes = base64.b64decode(audio_data)
    with open(output_path, 'wb') as f:
        f.write(wav_bytes)

    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 xtts-clone.py <voice_sample.wav> <text_to_speak> [output.wav]")
        print("Example: python3 xtts-clone.py my_voice.wav \"Hello world\" output.wav")
        sys.exit(1)

    voice_sample = sys.argv[1]
    text = sys.argv[2]
    output = sys.argv[3] if len(sys.argv) > 3 else "output_speech.wav"

    if not os.path.exists(voice_sample):
        print(f"❌ Voice sample not found: {voice_sample}")
        sys.exit(1)

    result = clone_voice(voice_sample, text, output)

    print("\n✅ Voice cloning complete!")
    print(f"📊 Voice characteristics:")
    print(json.dumps(result['voice_characteristics'], indent=2))
    print(f"\n🎵 Generated speech: {output}")
    print(f"💾 File size: {os.path.getsize(output) / 1024:.1f} KB")
