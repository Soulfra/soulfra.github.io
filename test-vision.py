#!/usr/bin/env python3
"""
Test LLaVA Vision AI
Analyzes an image and generates a detailed prompt for avatar generation
"""

import sys
import base64
import json
import requests

def analyze_image(image_path):
    """Analyze image using Ollama LLaVA"""

    # Read and encode image
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')

    # Call Ollama API
    url = 'http://localhost:11434/api/generate'

    payload = {
        'model': 'llava',
        'prompt': 'Describe this person in detail as an avatar character. Include: physical appearance, clothing style, colors, mood/expression, setting/background. Be specific and descriptive for AI image generation.',
        'images': [image_data],
        'stream': False
    }

    print("🔍 Analyzing image with LLaVA...")

    response = requests.post(url, json=payload)

    if response.status_code == 200:
        result = response.json()
        prompt = result.get('response', '')

        print("\n✅ Analysis Complete!")
        print("\n📝 Generated Prompt:")
        print("-" * 60)
        print(prompt)
        print("-" * 60)

        # Save to file
        output = {
            'original_image': image_path,
            'generated_prompt': prompt,
            'model': 'llava',
            'timestamp': result.get('created_at', '')
        }

        with open('vision-output.json', 'w') as f:
            json.dump(output, f, indent=2)

        print("\n💾 Saved to vision-output.json")
        return prompt
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 test-vision.py <image_path>")
        print("Example: python3 test-vision.py photo.jpg")
        sys.exit(1)

    image_path = sys.argv[1]
    analyze_image(image_path)
