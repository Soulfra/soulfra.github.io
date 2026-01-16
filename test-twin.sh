#!/bin/bash
# Digital Twin Pipeline Test
# Tests the full pipeline with fake avatar

set -e

echo "=========================================="
echo "DIGITAL TWIN PIPELINE TEST"
echo "=========================================="
echo ""

# Paths
IMAGE="api/vision/SadTalker/examples/source_image/art_0.png"
AUDIO="api/vision/SadTalker/examples/driven_audio/RD_Radio31_000.wav"
SCRIPT="test-video-simple.py"

# Check files exist
echo "[1/4] Checking files..."
if [ ! -f "$IMAGE" ]; then
    echo "ERROR: Image not found: $IMAGE"
    exit 1
fi
if [ ! -f "$AUDIO" ]; then
    echo "ERROR: Audio not found: $AUDIO"
    exit 1
fi
echo "✓ Files found"
echo ""

# Check Python environment
echo "[2/4] Checking Python environment..."
PYTHON="api/vision/SadTalker/venv/bin/python"
if [ ! -f "$PYTHON" ]; then
    echo "ERROR: Python virtual environment not found"
    echo "Run: cd api/vision/SadTalker && python3.9 -m venv venv"
    exit 1
fi
echo "✓ Python 3.9 venv ready"
echo ""

# Check Ollama (for object recognition)
echo "[3/4] Checking Ollama..."
if command -v ollama &> /dev/null; then
    if ollama list | grep -q llava; then
        echo "✓ Ollama with llava model ready"
    else
        echo "WARNING: llava model not found"
        echo "Run: ollama pull llava"
    fi
else
    echo "WARNING: Ollama not installed"
    echo "Object recognition will not work"
fi
echo ""

# Run test
echo "[4/4] Running full pipeline test..."
echo "This will take ~20 minutes on CPU"
echo ""
echo "Command:"
echo "  python3 $SCRIPT $IMAGE $AUDIO"
echo ""
read -p "Press Enter to start, or Ctrl+C to cancel..."

python3 "$SCRIPT" "$IMAGE" "$AUDIO"

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="
echo ""
echo "Check results in:"
echo "  api/vision/SadTalker/results/"
echo ""
echo "View generated video:"
echo "  open api/vision/SadTalker/results/*/art_0*.mp4"
echo ""
