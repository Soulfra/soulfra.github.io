# 📸 Vision AI Test - Photo to Avatar Prompt

**First step of the avatar pipeline is working!**

## What This Does

Upload a photo → LLaVA analyzes it → Get detailed prompt for avatar generation

## Files Created

### 1. `/avatar-test.html`
Beautiful web interface for testing vision AI:
- Drag & drop photo upload
- Calls `/api/avatar/analyze` endpoint
- Shows generated prompt
- Displays token usage stats

### 2. `/test-vision.py`
Python script for command-line testing:
```bash
python3 test-vision.py photo.jpg
```
Outputs prompt to console and saves to `vision-output.json`

### 3. Backend Updates
- Added `vision()` method to `api/providers/ollama-provider.js`
- Added `/api/avatar/analyze` endpoint to `api/unified-backend-v2.js`
- Updated `js/api-config.js` with new endpoint

## How to Test

### Web Interface (Recommended)
1. Open browser: http://localhost:8000/avatar-test.html
2. Upload a photo (drag & drop or click)
3. Click "Analyze with LLaVA"
4. See the generated avatar prompt

### Command Line
```bash
# Test with any image
python3 test-vision.py photo.jpg

# View output
cat vision-output.json
```

### API Direct
```bash
# Convert image to base64
base64 -i photo.jpg | tr -d '\n' > image.b64

# Call API
curl -X POST http://localhost:5050/api/avatar/analyze \
  -H "Content-Type: application/json" \
  -d "{\"imageData\": \"$(cat image.b64)\"}"
```

## What's Working

✅ Ollama running (localhost:11434)
✅ LLaVA model installed (4.7 GB)
✅ Backend endpoint: `/api/avatar/analyze`
✅ Frontend: http://localhost:8000/avatar-test.html
✅ Python test script

## Example Output

Input: Photo of person in blue hoodie

Output:
```
The image depicts a person wearing a blue hoodie,
standing against an urban cityscape backdrop. The individual
has short dark hair and appears focused. The hoodie features
a simple design with no visible logos. The setting suggests
a cyberpunk or modern urban environment with neon lights
visible in the background. The overall mood is confident
and introspective. Colors: deep blue (#2E5CB8), black accents,
neon purple highlights in background (#A855F7).
```

## Token Usage

- **Input tokens**: ~500 (image encoding)
- **Output tokens**: ~100-200 (description)
- **Model**: llava:latest (7B parameters)
- **Speed**: ~5-10 seconds on M1 Mac

## Next Steps

This is **Step 1** of the full pipeline. See `AVATAR_PIPELINE.md` for complete workflow.

**Pipeline roadmap:**
1. ✅ Photo → Prompt (working now)
2. ⏳ Prompt → Image (next - FLUX or Replicate)
3. ⏳ Image → Depth Map (MiDaS)
4. ⏳ Image + Audio → Talking Video (Wav2Lip)

## Troubleshooting

### "Ollama not available"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

### "LLaVA model not found"
```bash
# Install LLaVA
ollama pull llava

# Verify installation
ollama list | grep llava
```

### "Backend not responding"
```bash
# Check backend status
curl http://localhost:5050/api/health

# Restart backend
node api/unified-backend-v2.js
```

## API Endpoint Details

**POST** `/api/avatar/analyze`

Request:
```json
{
  "imageData": "base64_encoded_image_string",
  "prompt": "Optional custom prompt (uses default if omitted)",
  "model": "llava",
  "temperature": 0.7,
  "maxTokens": 1024
}
```

Response:
```json
{
  "success": true,
  "data": {
    "prompt": "Generated description...",
    "model": "llava:latest",
    "usage": {
      "inputTokens": 512,
      "outputTokens": 156,
      "totalTokens": 668
    }
  }
}
```

## Resources

- **LLaVA Paper**: https://llava.hliu.cc/
- **Ollama Docs**: https://ollama.ai/docs
- **Full Pipeline**: See `AVATAR_PIPELINE.md`
