#!/usr/bin/env python3
"""
Video Generation Wrapper for Soulfra Digital Twin
Uses SadTalker to generate talking head videos from images + audio

Usage:
    python3 video-generator.py <image_path> <audio_path> [output_path]

Example:
    python3 video-generator.py calriven.png voice.wav calriven_talking.mp4

Installation (one-time):
    cd SadTalker
    pip install -r requirements.txt
    bash scripts/download_models.sh
"""

import sys
import os
import json
import subprocess
import base64
from pathlib import Path

def check_sadtalker():
    """Check if SadTalker is installed"""
    sadtalker_path = Path(__file__).parent / 'SadTalker'

    if not sadtalker_path.exists():
        print("❌ SadTalker not found!")
        print(f"Expected location: {sadtalker_path}")
        print("\nTo install:")
        print("  cd api/vision")
        print("  git clone https://github.com/OpenTalker/SadTalker.git")
        return False

    checkpoints = sadtalker_path / 'checkpoints'
    if not checkpoints.exists():
        print("⚠️ SadTalker checkpoints not downloaded")
        print(f"\nRun: cd {sadtalker_path} && bash scripts/download_models.sh")
        return False

    return True

def generate_video_sadtalker(image_path, audio_path, output_path, options=None):
    """
    Generate talking head video using SadTalker

    Args:
        image_path: Path to source image (PNG/JPG)
        audio_path: Path to audio file (WAV/MP3)
        output_path: Path to save output video (MP4)
        options: Dict of SadTalker options

    Returns:
        dict with success status and metadata
    """

    if not check_sadtalker():
        return {"success": False, "error": "SadTalker not installed"}

    sadtalker_path = Path(__file__).parent / 'SadTalker'
    inference_script = sadtalker_path / 'inference.py'

    # Default options
    opts = options or {}
    enhancer = opts.get('enhancer', 'gfpgan')  # gfpgan or RestoreFormer
    preprocess = opts.get('preprocess', 'full')  # crop, resize, full
    still_mode = opts.get('still', False)  # disable head movement
    expression_scale = opts.get('expression_scale', 1.0)
    pose_style = opts.get('pose_style', 0)  # 0-46

    # Build command
    cmd = [
        'python3',
        str(inference_script),
        '--driven_audio', audio_path,
        '--source_image', image_path,
        '--result_dir', str(Path(output_path).parent),
        '--enhancer', enhancer,
        '--preprocess', preprocess,
        '--expression_scale', str(expression_scale),
        '--pose_style', str(pose_style)
    ]

    if still_mode:
        cmd.append('--still')

    print(f"🎬 Generating video...")
    print(f"📷 Image: {image_path}")
    print(f"🎤 Audio: {audio_path}")
    print(f"⚙️ Options: enhancer={enhancer}, preprocess={preprocess}")

    try:
        # Run SadTalker
        result = subprocess.run(
            cmd,
            cwd=str(sadtalker_path),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            print(f"❌ SadTalker failed:\n{result.stderr}")
            return {
                "success": False,
                "error": result.stderr
            }

        # Find generated video (SadTalker creates it in result_dir)
        result_dir = Path(output_path).parent
        generated_videos = list(result_dir.glob('*.mp4'))

        if not generated_videos:
            return {
                "success": False,
                "error": "No video generated"
            }

        # Move to output path
        latest_video = max(generated_videos, key=lambda p: p.stat().st_mtime)
        latest_video.rename(output_path)

        file_size = Path(output_path).stat().st_size

        print(f"✅ Video generated: {output_path}")
        print(f"📊 Size: {file_size / 1024 / 1024:.1f} MB")

        return {
            "success": True,
            "output_file": output_path,
            "file_size_mb": file_size / 1024 / 1024,
            "enhancer": enhancer,
            "preprocess": preprocess
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Video generation timed out (>5 minutes)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def video_to_base64(video_path):
    """Convert video to base64 data URL"""
    with open(video_path, 'rb') as f:
        video_data = f.read()

    base64_data = base64.b64encode(video_data).decode('utf-8')
    return f"data:video/mp4;base64,{base64_data}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 video-generator.py <image_path> <audio_path> [output_path]")
        print("\nExample:")
        print("  python3 video-generator.py calriven.png voice.wav output.mp4")
        print("\nWith options:")
        print("  python3 video-generator.py calriven.png voice.wav output.mp4 --still --enhancer gfpgan")
        sys.exit(1)

    image_path = sys.argv[1]
    audio_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else "output_video.mp4"

    # Check files exist
    if not Path(image_path).exists():
        print(f"❌ Image not found: {image_path}")
        sys.exit(1)

    if not Path(audio_path).exists():
        print(f"❌ Audio not found: {audio_path}")
        sys.exit(1)

    # Parse options from command line
    options = {}
    if '--still' in sys.argv:
        options['still'] = True
    if '--enhancer' in sys.argv:
        idx = sys.argv.index('--enhancer')
        options['enhancer'] = sys.argv[idx + 1]

    # Generate video
    result = generate_video_sadtalker(image_path, audio_path, output_path, options)

    if result['success']:
        print(f"\n✅ SUCCESS!")
        print(f"📹 Video: {result['output_file']}")
        print(f"💾 Size: {result['file_size_mb']:.1f} MB")
    else:
        print(f"\n❌ FAILED: {result['error']}")
        sys.exit(1)
