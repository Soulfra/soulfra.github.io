#!/usr/bin/env python3
"""
Simple SadTalker Test - Prove It Works
No bullshit, just generate a video.
"""

import subprocess
from pathlib import Path

def make_video(image_path, audio_path, output_name="test_output.mp4"):
    """
    Generate talking head video.

    Args:
        image_path: Path to image (PNG/JPG)
        audio_path: Path to audio (WAV/MP3)
        output_name: Name for output video

    Returns:
        Path to generated MP4
    """
    # Paths
    sadtalker_dir = Path(__file__).parent / 'api/vision/SadTalker'
    results_dir = sadtalker_dir / 'results'

    # Command
    cmd = [
        str(sadtalker_dir / 'venv/bin/python'),
        str(sadtalker_dir / 'inference.py'),
        '--source_image', str(image_path),
        '--driven_audio', str(audio_path),
        '--result_dir', str(results_dir),
        '--preprocess', 'full'
    ]

    print(f"🎬 Generating video...")
    print(f"📷 Image: {image_path}")
    print(f"🎤 Audio: {audio_path}")
    print(f"⏳ This takes ~20 minutes on CPU...")

    # Run it
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        return None

    # Find the output video (SadTalker creates timestamped folder)
    latest_result = max(results_dir.glob('*/'), key=lambda p: p.stat().st_mtime)
    video_files = list(latest_result.glob('*.mp4'))

    if not video_files:
        print(f"❌ No MP4 found in {latest_result}")
        return None

    video_path = video_files[0]
    print(f"✅ Video generated: {video_path}")
    print(f"📊 Size: {video_path.stat().st_size / 1024 / 1024:.1f} MB")

    return video_path


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 3:
        print("Usage: python test-video-simple.py IMAGE AUDIO")
        print("\nExample:")
        print("  python test-video-simple.py calriven.png test_audio.wav")
        print("\nTest with SadTalker examples:")
        print("  python test-video-simple.py \\")
        print("    api/vision/SadTalker/examples/source_image/art_0.png \\")
        print("    api/vision/SadTalker/examples/driven_audio/RD_Radio31_000.wav")
        sys.exit(1)

    image = sys.argv[1]
    audio = sys.argv[2]

    video = make_video(image, audio)

    if video:
        print(f"\n🎉 SUCCESS! Video at: {video}")
        print(f"\nPlay it with: open {video}")
    else:
        print("\n❌ FAILED!")
        sys.exit(1)
