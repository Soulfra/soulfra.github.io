#!/usr/bin/env python3
"""
Simple Depth Map Generator
Uses edge detection and gradient analysis to create pseudo-depth maps
Doesn't require external models - works offline
"""

import sys
import base64
import json
import numpy as np
from io import BytesIO
from PIL import Image
import cv2

def generate_depth_map(image_data, output_format='base64'):
    """
    Generate pseudo-depth map from image using edge detection

    Args:
        image_data: Base64 encoded image or file path
        output_format: 'base64' or 'array'

    Returns:
        dict with depth map data and metadata
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

    # Convert to numpy array
    img_np = np.array(img)
    original_shape = img_np.shape

    # Convert to grayscale
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

    # Method 1: Use edge detection (Canny)
    edges = cv2.Canny(gray, 50, 150)

    # Method 2: Use gradient magnitude (Sobel)
    grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
    gradient_magnitude = cv2.normalize(gradient_magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # Method 3: Combine brightness and edges
    # Assumption: Brighter areas are closer, edges indicate depth changes
    brightness = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)

    # Create depth map by combining methods
    # Invert edges (so non-edges are closer)
    depth_from_edges = 255 - edges

    # Blur the edge-based depth
    depth_blurred = cv2.GaussianBlur(depth_from_edges, (21, 21), 0)

    # Combine with brightness (weighted)
    depth_combined = cv2.addWeighted(depth_blurred, 0.6, brightness, 0.4, 0)

    # Add gradient information
    depth_final = cv2.addWeighted(depth_combined, 0.8, gradient_magnitude, 0.2, 0)

    # Normalize final depth map
    depth_normalized = cv2.normalize(depth_final, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # Create colored depth map (viridis colormap)
    depth_colored = cv2.applyColorMap(depth_normalized, cv2.COLORMAP_VIRIDIS)

    # Create grayscale depth map
    depth_gray = depth_normalized

    # Generate gridlines overlay (beadmap)
    grid_overlay = create_grid_overlay(depth_normalized, original_shape)

    # Convert to base64 if needed
    if output_format == 'base64':
        # Colored depth map
        _, colored_buffer = cv2.imencode('.png', cv2.cvtColor(depth_colored, cv2.COLOR_BGR2RGB))
        colored_base64 = base64.b64encode(colored_buffer).decode('utf-8')

        # Grayscale depth map
        _, gray_buffer = cv2.imencode('.png', depth_gray)
        gray_base64 = base64.b64encode(gray_buffer).decode('utf-8')

        # Grid overlay
        _, grid_buffer = cv2.imencode('.png', cv2.cvtColor(grid_overlay, cv2.COLOR_BGR2RGB))
        grid_base64 = base64.b64encode(grid_buffer).decode('utf-8')

        return {
            'depth_map_colored': f'data:image/png;base64,{colored_base64}',
            'depth_map_grayscale': f'data:image/png;base64,{gray_base64}',
            'depth_map_grid': f'data:image/png;base64,{grid_base64}',
            'depth_range': {
                'min': float(depth_normalized.min()),
                'max': float(depth_normalized.max()),
                'mean': float(depth_normalized.mean()),
                'std': float(depth_normalized.std())
            },
            'resolution': {
                'width': original_shape[1],
                'height': original_shape[0]
            },
            'method': 'edge_detection + gradients + brightness',
            'note': 'Pseudo-depth map for rigging. Brighter = closer, darker = farther'
        }
    else:
        return {
            'depth_array': depth_normalized.tolist(),
            'depth_range': {
                'min': float(depth_normalized.min()),
                'max': float(depth_normalized.max()),
                'mean': float(depth_normalized.mean()),
                'std': float(depth_normalized.std())
            }
        }

def create_grid_overlay(depth_map, original_shape, grid_size=20):
    """
    Create a beadmap/gridline overlay on the depth map

    Args:
        depth_map: Normalized depth map (0-255)
        original_shape: Original image shape
        grid_size: Grid spacing in pixels

    Returns:
        Grid overlay image
    """
    h, w = original_shape[:2]

    # Create colored depth map
    colored = cv2.applyColorMap(depth_map, cv2.COLORMAP_VIRIDIS)

    # Draw grid lines
    for i in range(0, h, grid_size):
        cv2.line(colored, (0, i), (w, i), (255, 255, 255), 1, cv2.LINE_AA)

    for j in range(0, w, grid_size):
        cv2.line(colored, (j, 0), (j, h), (255, 255, 255), 1, cv2.LINE_AA)

    # Draw beads at grid intersections
    for i in range(0, h, grid_size):
        for j in range(0, w, grid_size):
            # Get depth value at this point
            depth_val = depth_map[min(i, h-1), min(j, w-1)]

            # Draw bead with size based on depth (closer = larger)
            bead_size = int(2 + (depth_val / 255) * 2)  # 2-4 pixels
            cv2.circle(colored, (j, i), bead_size, (255, 255, 255), -1, cv2.LINE_AA)

    return colored

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 depth-simple.py <image_path>")
        print("Example: python3 depth-simple.py /Users/matthewmauer/Desktop/calriven.png")
        sys.exit(1)

    image_path = sys.argv[1]

    print(f"🗺️ Generating depth map from: {image_path}")

    result = generate_depth_map(image_path, output_format='base64')

    print(f"\n✅ Depth map generated")
    print(f"📊 Depth range: {result['depth_range']['min']:.2f} - {result['depth_range']['max']:.2f}")
    print(f"📐 Resolution: {result['resolution']['width']}x{result['resolution']['height']}")
    print(f"🔧 Method: {result['method']}")

    # Save to JSON
    output_file = 'depth-map.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n💾 Saved to {output_file}")

    # Also save visualizations as image files
    if result.get('depth_map_colored'):
        colored_data = result['depth_map_colored'].split(',')[1]
        with open('depth-colored.png', 'wb') as f:
            f.write(base64.b64decode(colored_data))
        print(f"💾 Saved depth-colored.png")

    if result.get('depth_map_grid'):
        grid_data = result['depth_map_grid'].split(',')[1]
        with open('depth-grid.png', 'wb') as f:
            f.write(base64.b64decode(grid_data))
        print(f"💾 Saved depth-grid.png (beadmap overlay)")
