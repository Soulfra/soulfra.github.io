# Video Generation Setup - Soulfra Digital Twin

## Quick Start

You have **everything you need** to turn your avatar into talking videos:

### What's Ready:
- ✅ `calriven.png` (your avatar image)
- ✅ Depth maps + hex codes + rigging data
- ✅ XTTS-v2 voice cloning
- ✅ SadTalker cloned to `api/vision/SadTalker/`
- ✅ `video-generator.py` wrapper script

### What You Need To Do:

#### 1. Install SadTalker Dependencies (One-Time)
```bash
cd api/vision/SadTalker
pip install -r requirements.txt
bash scripts/download_models.sh  # Downloads ~3GB of model checkpoints
```

**Note:** This may take 10-20 minutes depending on your internet speed.

#### 2. Generate Your First Video
```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io

# Create a test audio file with your voice (6+ seconds)
# Or use XTTS to generate one:
python3 api/voice/xtts-clone.py your_voice_sample.wav "Hello, this is my digital twin" test_audio.wav

# Generate video
python3 api/vision/video-generator.py calriven.png test_audio.wav calriven_talking.mp4
```

#### 3. Expected Output
```
🎬 Generating video...
📷 Image: calriven.png
🎤 Audio: test_audio.wav
⚙️ Options: enhancer=gfpgan, preprocess=full

✅ Video generated: calriven_talking.mp4
📊 Size: 2.3 MB
```

---

## Alternative: Use Pre-Built Services (No Installation)

If you don't want to install SadTalker locally, you can use:

### Option A: Hugging Face Spaces (Free)
1. Go to: https://huggingface.co/spaces/vinthony/SadTalker
2. Upload your `calriven.png`
3. Upload your audio file
4. Click "Generate"
5. Download MP4

### Option B: Local WebUI
```bash
cd api/vision/SadTalker
python3 app.py  # Launches Gradio web interface
```

Then visit: http://localhost:7860

---

## Video Options

### Basic Usage
```bash
python3 api/vision/video-generator.py image.png audio.wav output.mp4
```

### With Face Enhancement
```bash
python3 api/vision/video-generator.py image.png audio.wav output.mp4 --enhancer gfpgan
```

### Disable Head Movement (Still Mode)
```bash
python3 api/vision/video-generator.py image.png audio.wav output.mp4 --still
```

---

## Full Pipeline Test

### Complete Digital Twin → Video Flow:

```bash
# 1. Analyze image and generate rigging data
# (Already done via avatar-export.html)

# 2. Clone voice from sample
python3 api/voice/xtts-clone.py my_voice.wav "Test speech" cloned_voice.wav

# 3. Generate video
python3 api/vision/video-generator.py \
  calriven.png \
  cloned_voice.wav \
  final_video.mp4

# 4. Result: Talking avatar video with YOUR cloned voice!
```

---

## Troubleshooting

### "SadTalker not found"
Make sure you're in the right directory:
```bash
ls api/vision/SadTalker/  # Should show files
```

### "Checkpoints not downloaded"
Run the download script:
```bash
cd api/vision/SadTalker
bash scripts/download_models.sh
```

### Numpy/PyTorch version conflict
SadTalker needs numpy 1.23.4 but you have 2.3.5. Options:
- Use a virtual environment for SadTalker (recommended)
- Use the Hugging Face Space instead (no install needed)

### Torchvision compatibility fix
If you see `ModuleNotFoundError: No module named 'torchvision.transforms.functional_tensor'`:

```bash
# Fix the basicsr dependency
nano api/vision/SadTalker/venv/lib/python3.9/site-packages/basicsr/data/degradations.py

# Change line 8 from:
# from torchvision.transforms.functional_tensor import rgb_to_grayscale
# To:
from torchvision.transforms.functional import rgb_to_grayscale
```

This is due to torchvision 0.23+ changing the module structure.

### Video generation timeout
Increase timeout in `video-generator.py` (default 5 minutes)

---

## Next Steps

Once video generation works:
1. Add `/api/video/generate` backend endpoint
2. Update `avatar-export.html` with video generation UI
3. Test batch processing (multiple images)
4. Deploy to CringeProof.com platform

---

## Resources

- **SadTalker Paper:** https://arxiv.org/abs/2211.12194
- **GitHub:** https://github.com/OpenTalker/SadTalker
- **Demo:** https://sadtalker.github.io/
- **HuggingFace:** https://huggingface.co/spaces/vinthony/SadTalker

## Need Help?

Check the SadTalker README: `api/vision/SadTalker/README.md`
