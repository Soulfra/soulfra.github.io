#!/usr/bin/env python3
"""
Color Extractor - Extract dominant colors and hex codes from images
Returns actual pixel colors, not text descriptions
"""

import sys
import base64
import json
from io import BytesIO
from PIL import Image
from collections import Counter

def quantize_color(r, g, b, levels=32):
    """Quantize RGB values to reduce similar colors"""
    factor = 256 // levels
    return (
        (r // factor) * factor,
        (g // factor) * factor,
        (b // factor) * factor
    )

def is_interesting_color(r, g, b):
    """Filter out very dark, very light, or gray colors"""
    # Skip near-black
    if r < 20 and g < 20 and b < 20:
        return False
    # Skip near-white
    if r > 235 and g > 235 and b > 235:
        return False
    # Skip grays (low saturation)
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    if max_val - min_val < 30:  # Low color difference = gray
        return False
    return True

def extract_colors(image_data, num_colors=10, filter_boring=True):
    """
    Extract dominant colors from image

    Args:
        image_data: Base64 encoded image or file path
        num_colors: Number of dominant colors to extract
        filter_boring: Skip very dark, light, or gray colors

    Returns:
        dict with hex codes, RGB values, and percentages
    """

    # Load image
    if isinstance(image_data, str) and image_data.startswith('data:image'):
        # Base64 data URL
        image_data = image_data.split(',')[1]

    if isinstance(image_data, str) and len(image_data) > 200:
        # Base64 string
        img_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(img_bytes))
    else:
        # File path
        img = Image.open(image_data)

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # Resize for speed (keep aspect ratio)
    img.thumbnail((150, 150))

    # Get all pixels and quantize
    pixels = list(img.getdata())
    quantized = [quantize_color(r, g, b) for r, g, b in pixels]

    # Filter interesting colors if requested
    if filter_boring:
        quantized = [c for c in quantized if is_interesting_color(*c)]

    total_pixels = len(pixels)
    interesting_pixels = len(quantized)

    # Count color frequency
    color_counts = Counter(quantized)
    most_common = color_counts.most_common(num_colors)

    # Convert to hex and calculate percentages
    colors = []
    for (r, g, b), count in most_common:
        hex_code = '#{:02x}{:02x}{:02x}'.format(r, g, b)
        percentage = (count / interesting_pixels) * 100 if filter_boring else (count / total_pixels) * 100

        colors.append({
            'hex': hex_code,
            'rgb': {'r': r, 'g': g, 'b': b},
            'count': count,
            'percentage': round(percentage, 2)
        })

    return {
        'dominant_color': colors[0]['hex'] if colors else '#000000',
        'palette': [c['hex'] for c in colors],
        'colors': colors,
        'total_pixels': total_pixels,
        'interesting_pixels': interesting_pixels,
        'unique_colors': len(color_counts)
    }

def get_color_name(r, g, b):
    """Approximate color name from RGB"""
    if r > 200 and g > 200 and b > 200:
        return 'white'
    elif r < 50 and g < 50 and b < 50:
        return 'black'
    elif r > g and r > b:
        return 'red'
    elif g > r and g > b:
        return 'green'
    elif b > r and b > g:
        return 'blue'
    elif r > 150 and g > 150 and b < 100:
        return 'yellow'
    elif r > 150 and g < 100 and b > 150:
        return 'magenta'
    elif r < 100 and g > 150 and b > 150:
        return 'cyan'
    else:
        return 'mixed'

def extract_with_names(image_data, num_colors=10):
    """Extract colors with approximate names"""
    result = extract_colors(image_data, num_colors)

    for color in result['colors']:
        r, g, b = color['rgb']['r'], color['rgb']['g'], color['rgb']['b']
        color['name'] = get_color_name(r, g, b)

    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 color-extractor.py <image_path>")
        print("Example: python3 color-extractor.py /Users/matthewmauer/Desktop/calriven.png")
        sys.exit(1)

    image_path = sys.argv[1]

    print(f"🎨 Extracting colors from: {image_path}")

    result = extract_with_names(image_path, num_colors=10)

    print(f"\n✅ Found {result['unique_colors']} unique colors")
    print(f"📊 Dominant color: {result['dominant_color']}")
    print(f"\n🎨 Top 10 colors:")
    print("-" * 50)

    for i, color in enumerate(result['colors'], 1):
        print(f"{i}. {color['hex']} ({color['name']}) - {color['percentage']}%")

    # Save to JSON
    output_file = 'color-extraction.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n💾 Saved to {output_file}")
