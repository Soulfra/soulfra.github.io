# 🎭 Avatar Pipeline - Photo → Talking Character

**Turn any photo into an AI-generated talking avatar.** All open source, runs locally.

---

## 🎯 What This Does

```
1. Upload photo/screenshot
   ↓
2. AI analyzes it (describes what it sees)
   ↓
3. Generate new avatar image (AI art)
   ↓
4. Extract data (colors, depth, metadata)
   ↓
5. Record voice
   ↓
6. Generate talking avatar video
   ↓
7. (Optional) Place in 3D world
```

**Your buddy uploads a selfie → Gets back an animated talking avatar in your world.**

---

## 🛠️ The Tech Stack

### Vision AI (Photo → Prompt)
| Tool | Purpose | Local? | Cost |
|------|---------|--------|------|
| **Ollama + LLaVA** | Analyzes images, generates descriptions | ✅ Yes | Free |
| **GPT-4 Vision** | Better quality, API | ❌ Cloud | $0.01/image |
| **Claude 3 Vision** | Also good, API | ❌ Cloud | $0.01/image |

**Recommendation:** Use Ollama LLaVA (you already have Ollama!)

### Image Generation (Prompt → Avatar)
| Tool | Quality | Speed | Local? |
|------|---------|-------|--------|
| **FLUX.1-schnell** | ⭐⭐⭐⭐⭐ | Fast | ✅ Yes (8GB+ VRAM) |
| **Stable Diffusion XL** | ⭐⭐⭐⭐ | Medium | ✅ Yes (6GB+ VRAM) |
| **Replicate API** | ⭐⭐⭐⭐⭐ | Fast | ❌ Cloud ($0.002/image) |

**Recommendation:** FLUX.1-schnell (best quality) or Replicate API (easiest)

### Depth Maps & Data Extraction
| Tool | Purpose | Model Size |
|------|---------|------------|
| **MiDaS** | Depth estimation | ~100MB |
| **DepthAnything** | Better depth | ~400MB |
| **PIL/Pillow** | Color extraction | Built-in |

### Lip Sync (Image + Audio → Talking Video)
| Tool | Quality | Speed | Notes |
|------|---------|-------|-------|
| **Wav2Lip** | ⭐⭐⭐ | Fast | Classic, works well |
| **SadTalker** | ⭐⭐⭐⭐ | Slower | More natural motion |
| **Live Portrait** | ⭐⭐⭐⭐⭐ | Fast | State-of-the-art |

**Recommendation:** Wav2Lip (easiest to set up)

### 3D World (Optional)
| Tool | Purpose | Complexity |
|------|---------|------------|
| **TripoSR** | Image → 3D mesh | Medium |
| **InstantMesh** | Better 3D | Hard |
| **Three.js** | 3D in browser | Easy |
| **Babylon.js** | Game engine in browser | Medium |

---

## 🚀 Quick Start (Basic Pipeline)

### Step 1: Install LLaVA Model

```bash
# Pull the vision model
ollama pull llava

# Test it
ollama run llava "Describe this image" < photo.jpg
```

### Step 2: Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install vision tools
pip install torch torchvision
pip install pillow numpy
pip install diffusers transformers accelerate

# Install depth mapping
pip install timm

# Install lip sync (later)
# pip install wav2lip sadtalker
```

### Step 3: Test Vision → Prompt

```python
# test-vision.py
import ollama
import base64

# Load image
with open('photo.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

# Analyze with Ollama
response = ollama.chat(
    model='llava',
    messages=[{
        'role': 'user',
        'content': 'Describe this person as an avatar character. Include clothing, style, mood, setting.',
        'images': [image_data]
    }]
)

print("Generated Prompt:")
print(response['message']['content'])
```

### Step 4: Test Prompt → Image (Using Replicate)

```python
# test-generation.py
import replicate

prompt = "anime style avatar, blue hoodie, confident expression, cyberpunk city background"

output = replicate.run(
    "black-forest-labs/flux-schnell",
    input={"prompt": prompt}
)

print(f"Generated image: {output}")
# Downloads to local file
```

### Step 5: Extract Metadata

```python
# extract-data.py
from PIL import Image
from collections import Counter

img = Image.open('avatar.jpg')

# Get dominant colors
colors = img.getcolors(img.size[0] * img.size[1])
hex_colors = ['#%02x%02x%02x' % c[1] for c in sorted(colors, key=lambda x: x[0], reverse=True)[:5]]

# Generate metadata
metadata = {
    "prompt": prompt,
    "colors": hex_colors,
    "dimensions": {"width": img.width, "height": img.height},
    "format": img.format
}

import json
with open('avatar_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
```

---

## 🎙️ Adding Lip Sync

### Option 1: Wav2Lip (Easiest)

```bash
# Clone repo
git clone https://github.com/Rudrabha/Wav2Lip.git
cd Wav2Lip

# Download pre-trained model
wget 'https://iiitaphyd-my.sharepoint.com/personal/radrabha_m_research_iiit_ac_in/_layouts/15/download.aspx?share=EdjI7bZlgApMqsVoEUUXpLsBxqXbn5z8VTmoxp55YNDcIA' -O 'checkpoints/wav2lip.pth'

# Install requirements
pip install -r requirements.txt

# Generate talking video
python inference.py \
  --checkpoint_path checkpoints/wav2lip.pth \
  --face avatar.jpg \
  --audio voice.wav \
  --outfile talking_avatar.mp4
```

### Option 2: SadTalker (Better Quality)

```bash
git clone https://github.com/OpenTalker/SadTalker.git
cd SadTalker

# Follow setup instructions
bash scripts/download_models.sh

# Generate
python inference.py \
  --driven_audio voice.wav \
  --source_image avatar.jpg \
  --result_dir ./results
```

---

## 🌐 Web Integration

### Frontend Upload Interface

```html
<!-- avatar-gen.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Avatar Generator</title>
    <style>
        body {
            font-family: system-ui;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .step {
            margin: 30px 0;
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 10px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }
        img, video {
            max-width: 100%;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <h1>📸 Photo → Talking Avatar</h1>

    <!-- Step 1: Upload Photo -->
    <div class="step">
        <h2>Step 1: Upload Photo</h2>
        <input type="file" id="photo" accept="image/*">
        <button onclick="analyzePhoto()">Analyze</button>
        <div id="photo-preview"></div>
    </div>

    <!-- Step 2: Generated Prompt -->
    <div class="step">
        <h2>Step 2: AI Description</h2>
        <div id="prompt-result" style="background: #f5f5f5; padding: 15px; border-radius: 5px;"></div>
    </div>

    <!-- Step 3: Generate Avatar -->
    <div class="step">
        <h2>Step 3: Generate Avatar</h2>
        <button onclick="generateAvatar()">Generate</button>
        <img id="avatar-preview" style="display:none;">
    </div>

    <!-- Step 4: Record Voice -->
    <div class="step">
        <h2>Step 4: Record Voice</h2>
        <button onclick="startRecording()">🎤 Start Recording</button>
        <button onclick="stopRecording()">⏹️ Stop</button>
        <audio id="audio-preview" controls style="display:none;"></audio>
    </div>

    <!-- Step 5: Generate Talking Avatar -->
    <div class="step">
        <h2>Step 5: Make It Talk</h2>
        <button onclick="generateTalkingAvatar()">Generate Video</button>
        <video id="talking-avatar" controls style="display:none;"></video>
    </div>

    <script>
        let currentPrompt = '';
        let currentAvatarUrl = '';
        let mediaRecorder;
        let audioChunks = [];

        async function analyzePhoto() {
            const file = document.getElementById('photo').files[0];
            if (!file) return alert('Select a photo first!');

            // Preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('photo-preview').innerHTML =
                    `<img src="${e.target.result}" style="max-width: 300px;">`;
            };
            reader.readAsDataURL(file);

            // Convert to base64
            const base64 = await fileToBase64(file);

            // Call backend
            const res = await fetch('http://localhost:5050/api/avatar/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ imageData: base64 })
            });

            const data = await res.json();
            currentPrompt = data.prompt;

            document.getElementById('prompt-result').innerHTML =
                `<strong>AI Description:</strong><br>${currentPrompt}`;
        }

        async function generateAvatar() {
            if (!currentPrompt) return alert('Analyze a photo first!');

            document.getElementById('avatar-preview').style.display = 'none';

            const res = await fetch('http://localhost:5050/api/avatar/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: currentPrompt })
            });

            const data = await res.json();
            currentAvatarUrl = data.imageUrl;

            const img = document.getElementById('avatar-preview');
            img.src = currentAvatarUrl;
            img.style.display = 'block';
        }

        function startRecording() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);

                    mediaRecorder.ondataavailable = (e) => {
                        audioChunks.push(e.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);

                        const audio = document.getElementById('audio-preview');
                        audio.src = audioUrl;
                        audio.style.display = 'block';
                    };

                    mediaRecorder.start();
                    alert('Recording... Click Stop when done.');
                });
        }

        function stopRecording() {
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
        }

        async function generateTalkingAvatar() {
            if (!currentAvatarUrl) return alert('Generate avatar first!');
            if (audioChunks.length === 0) return alert('Record voice first!');

            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

            // Upload to backend
            const formData = new FormData();
            formData.append('avatar', currentAvatarUrl);
            formData.append('audio', audioBlob);

            const res = await fetch('http://localhost:5050/api/avatar/animate', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            const video = document.getElementById('talking-avatar');
            video.src = data.videoUrl;
            video.style.display = 'block';
        }

        function fileToBase64(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(file);
            });
        }
    </script>
</body>
</html>
```

---

## 📊 The Data Flow

```json
{
  "pipeline": {
    "input": {
      "type": "image/jpeg",
      "source": "user_upload"
    },
    "steps": [
      {
        "step": 1,
        "name": "vision_analysis",
        "model": "llava",
        "output": "detailed_prompt"
      },
      {
        "step": 2,
        "name": "image_generation",
        "model": "flux-schnell",
        "input": "detailed_prompt",
        "output": "avatar_image"
      },
      {
        "step": 3,
        "name": "metadata_extraction",
        "outputs": {
          "colors": ["#FF5733", "#33FF57"],
          "depth_map": "depth.png",
          "dimensions": {"width": 512, "height": 512}
        }
      },
      {
        "step": 4,
        "name": "lip_sync",
        "model": "wav2lip",
        "inputs": ["avatar_image", "user_audio"],
        "output": "talking_avatar.mp4"
      }
    ]
  }
}
```

---

## 🎮 Use Cases

### 1. CringeProof Avatars
- Upload selfie
- Generate cartoon avatar
- Record "roast" or response
- Share talking avatar video

### 2. Virtual Worlds
- Everyone gets an avatar
- Place them in 3D space
- They talk/move based on voice
- Build interactive scenes

### 3. Content Creation
- Upload photo → instant character
- Generate multiple variations
- Animate with different voices
- Export for video/games

---

## 🔧 Backend Implementation

**See `api/avatar-generator.js`** for full code.

**Key endpoints:**
- `POST /api/avatar/analyze` - Photo → Prompt
- `POST /api/avatar/generate` - Prompt → Image
- `POST /api/avatar/animate` - Image + Audio → Video
- `GET /api/avatar/:id` - Retrieve generated avatar

---

## 💡 Advanced Features

### Face Swap (Anonymization)
```python
# Use InsightFace to swap faces
from insightface.app import FaceAnalysis

app = FaceAnalysis()
# Swap user's face with generated avatar face
# Privacy-preserving!
```

### 3D Model Generation
```python
# TripoSR: Image → 3D
from triposr import TripoSR

model = TripoSR.load()
mesh = model.generate(avatar_image)
mesh.export('avatar.obj')
```

### Real-time Animation
```javascript
// Three.js with morph targets
const avatar = new THREE.Mesh(geometry, material);

// Animate mouth based on audio
avatar.morphTargetInfluences[0] = audioLevel;
```

---

## 📝 Next Steps

1. ✅ Install Ollama LLaVA
2. ✅ Test vision → prompt pipeline
3. ✅ Set up image generation (Replicate or local)
4. Add lip sync (Wav2Lip)
5. Create frontend interface
6. (Optional) Add 3D world integration

---

## 🔗 Resources

- **LLaVA:** https://llava.hliu.cc/
- **FLUX:** https://github.com/black-forest-labs/flux
- **Wav2Lip:** https://github.com/Rudrabha/Wav2Lip
- **SadTalker:** https://github.com/OpenTalker/SadTalker
- **TripoSR:** https://github.com/VAST-AI-Research/TripoSR

---

## ✅ Summary

**You're not crazy. This is all real and doable:**

✅ Upload photo
✅ AI analyzes it (Ollama LLaVA)
✅ Generate avatar (FLUX/SD)
✅ Extract data (colors, depth, JSON)
✅ Record voice
✅ Lip sync (Wav2Lip)
✅ Output: Talking avatar video

**All open source. Runs on your laptop. No cloud required.**

Ready to build it?
