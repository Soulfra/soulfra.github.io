#!/usr/bin/env python3
"""
Depth Map Generator using MiDaS
Generates depth maps from images for rigging and 3D reconstruction
"""

import sys
import base64
import json
import numpy as np
from io import BytesIO
from PIL import Image
import cv2
import torch

# Global model cache
_model = None
_transform = None
_device = None

def load_model():
    """Load MiDaS model (cached)"""
    global _model, _transform, _device

    if _model is not None:
        return _model, _transform, _device

    print("🔧 Loading MiDaS model...", file=sys.stderr)

    # Use CPU for compatibility (can change to 'cuda' if GPU available)
    _device = torch.device("cpu")

    # Load MiDaS small model (faster, smaller)
    _model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True)
    _model.to(_device)
    _model.eval()

    # Load transforms
    midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
    _transform = midas_transforms.small_transform

    print("✅ MiDaS model loaded", file=sys.stderr)

    return _model, _transform, _device

def generate_depth_map(image_data, output_format='base64'):
    """
    Generate depth map from image

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

    # Load model
    model, transform, device = load_model()

    # Transform input
    input_batch = transform(img_np).to(device)

    # Generate depth map
    with torch.no_grad():
        prediction = model(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img_np.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()

    # Convert to numpy
    depth = prediction.cpu().numpy()

    # Normalize to 0-255
    depth_min = depth.min()
    depth_max = depth.max()
    depth_normalized = ((depth - depth_min) / (depth_max - depth_min) * 255).astype(np.uint8)

    # Create colored depth map (viridis colormap)
    depth_colored = cv2.applyColorMap(depth_normalized, cv2.COLORMAP_VIRIDIS)

    # Create grayscale depth map
    depth_gray = depth_normalized

    # Generate gridlines overlay
    grid_overlay = create_grid_overlay(depth_normalized, original_shape)

    # Convert to base64 if needed
    if output_format == 'base64':
        # Colored depth map
        _, colored_buffer = cv2.imencode('.png', depth_colored)
        colored_base64 = base64.b64encode(colored_buffer).decode('utf-8')

        # Grayscale depth map
        _, gray_buffer = cv2.imencode('.png', depth_gray)
        gray_base64 = base64.b64encode(gray_buffer).decode('utf-8')

        # Grid overlay
        _, grid_buffer = cv2.imencode('.png', grid_overlay)
        grid_base64 = base64.b64encode(grid_buffer).decode('utf-8')

        return {
            'depth_map_colored': f'data:image/png;base64,{colored_base64}',
            'depth_map_grayscale': f'data:image/png;base64,{gray_base64}',
            'depth_map_grid': f'data:image/png;base64,{grid_base64}',
            'depth_range': {
                'min': float(depth_min),
                'max': float(depth_max),
                'mean': float(depth.mean()),
                'std': float(depth.std())
            },
            'resolution': {
                'width': original_shape[1],
                'height': original_shape[0]
            }
        }
    else:
        return {
            'depth_array': depth.tolist(),
            'depth_normalized': depth_normalized.tolist(),
            'depth_range': {
                'min': float(depth_min),
                'max': float(depth_max),
                'mean': float(depth.mean()),
                'std': float(depth.std())
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
        cv2.line(colored, (0, i), (w, i), (255, 255, 255), 1)

    for j in range(0, w, grid_size):
        cv2.line(colored, (j, 0), (j, h), (255, 255, 255), 1)

    # Draw beads at grid intersections
    for i in range(0, h, grid_size):
        for j in range(0, w, grid_size):
            # Get depth value at this point
            depth_val = depth_map[i, j]
            # Brighter = closer, darker = farther
            color = (int(depth_val), int(depth_val), int(depth_val))
            cv2.circle(colored, (j, i), 2, (255, 255, 255), -1)

    return colored

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 depth-estimator.py <image_path>")
        print("Example: python3 depth-estimator.py /Users/matthewmauer/Desktop/calriven.png")
        sys.exit(1)

    image_path = sys.argv[1]

    print(f"🗺️ Generating depth map from: {image_path}", file=sys.stderr)

    result = generate_depth_map(image_path, output_format='base64')

    print(f"\n✅ Depth map generated", file=sys.stderr)
    print(f"📊 Depth range: {result['depth_range']['min']:.2f} - {result['depth_range']['max']:.2f}", file=sys.stderr)
    print(f"📐 Resolution: {result['resolution']['width']}x{result['resolution']['height']}", file=sys.stderr)

    # Save to JSON
    output_file = 'depth-map.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n💾 Saved to {output_file}", file=sys.stderr)

    # Also save visualizations as image files
    if result.get('depth_map_colored'):
        colored_data = result['depth_map_colored'].split(',')[1]
        with open('depth-colored.png', 'wb') as f:
            f.write(base64.b64decode(colored_data))
        print(f"💾 Saved depth-colored.png", file=sys.stderr)

    if result.get('depth_map_grid'):
        grid_data = result['depth_map_grid'].split(',')[1]
        with open('depth-grid.png', 'wb') as f:
            f.write(base64.b64decode(grid_data))
        print(f"💾 Saved depth-grid.png (beadmap overlay)", file=sys.stderr)
