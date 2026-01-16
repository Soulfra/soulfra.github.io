#!/usr/bin/env python3
"""
Blender Rigging Data Importer for Soulfra Digital Twin Format
Imports JSON rigging data (colors, depth maps, descriptions) into Blender

Usage in Blender:
    1. Open Blender
    2. Go to Scripting tab
    3. Open this file
    4. Modify the JSON_PATH variable
    5. Run script (Alt+P)

Or from command line:
    blender --python blender_import_rigging.py -- /path/to/rigging_data.json
"""

import bpy
import json
import base64
import numpy as np
from io import BytesIO
from PIL import Image
import mathutils
import sys
import os

def decode_base64_image(data_url):
    """Decode base64 image data URL to numpy array"""
    if data_url.startswith('data:image'):
        # Remove data:image/png;base64, prefix
        image_data = data_url.split(',')[1]
    else:
        image_data = data_url

    # Decode base64
    img_bytes = base64.b64decode(image_data)
    img = Image.open(BytesIO(img_bytes))

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # Convert to numpy array (normalized 0-1 for Blender)
    img_array = np.array(img).astype(np.float32) / 255.0

    return img_array, img.size

def create_plane_from_depth_map(depth_image_array, resolution, name="DepthMapMesh"):
    """Create a subdivided plane mesh and displace vertices based on depth map"""
    width, height = resolution

    # Create a grid mesh
    # Use smaller subdivision for performance (max 200x200)
    subdiv_x = min(width // 5, 200)
    subdiv_y = min(height // 5, 200)

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=subdiv_x,
        y_subdivisions=subdiv_y,
        size=2,
        location=(0, 0, 0)
    )

    obj = bpy.context.active_object
    obj.name = name
    mesh = obj.data

    # Get depth map as grayscale (average RGB channels)
    depth_gray = np.mean(depth_image_array, axis=2)

    # Displace vertices based on depth
    for i, vert in enumerate(mesh.vertices):
        # Map vertex UV to depth map coordinates
        u = (vert.co.x + 1) / 2  # -1 to 1 → 0 to 1
        v = (vert.co.y + 1) / 2

        # Get depth value (flip V for image coordinates)
        x = int(u * (depth_gray.shape[1] - 1))
        y = int((1 - v) * (depth_gray.shape[0] - 1))

        depth_value = depth_gray[y, x]

        # Displace Z based on depth (scale factor 0.5 for visible effect)
        vert.co.z = depth_value * 0.5

    mesh.update()

    return obj

def apply_vertex_colors(obj, color_palette):
    """Apply color palette as vertex colors"""
    mesh = obj.data

    # Create vertex color layer
    if not mesh.vertex_colors:
        mesh.vertex_colors.new(name="ColorPalette")

    color_layer = mesh.vertex_colors.active

    # Get dominant color
    dominant_color = color_palette['dominant']
    r = int(dominant_color[1:3], 16) / 255.0
    g = int(dominant_color[3:5], 16) / 255.0
    b = int(dominant_color[5:7], 16) / 255.0

    # Apply dominant color to all vertices
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            color_layer.data[loop_index].color = (r, g, b, 1.0)

    mesh.update()

def create_materials_from_palette(obj, colors_data):
    """Create materials from color palette"""
    # Create main material
    mat = bpy.data.materials.new(name="AvatarMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Add Principled BSDF
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)

    # Set base color from dominant color
    dominant_hex = colors_data['dominant']
    r = int(dominant_hex[1:3], 16) / 255.0
    g = int(dominant_hex[3:5], 16) / 255.0
    b = int(dominant_hex[5:7], 16) / 255.0
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)

    # Add Material Output
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (300, 0)

    # Link nodes
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    # Assign material to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def create_text_object(text_content, location, name="Description"):
    """Create 3D text object from LLaVA description"""
    # Truncate long descriptions
    if len(text_content) > 200:
        text_content = text_content[:197] + "..."

    bpy.ops.object.text_add(location=location)
    text_obj = bpy.context.active_object
    text_obj.name = name
    text_obj.data.body = text_content
    text_obj.data.size = 0.1
    text_obj.data.align_x = 'CENTER'

    return text_obj

def setup_armature_rigify(mesh_obj):
    """Add Rigify metarig and prepare for rigging (requires Rigify addon)"""
    try:
        # Check if Rigify is enabled
        if 'rigify' not in bpy.context.preferences.addons:
            print("⚠️ Rigify addon not enabled. Skipping auto-rig.")
            return None

        # Add basic human metarig
        bpy.ops.object.armature_human_metarig_add()
        armature_obj = bpy.context.active_object
        armature_obj.name = "MetaRig"

        # Scale and position to match mesh
        armature_obj.scale = (0.5, 0.5, 0.5)
        armature_obj.location = mesh_obj.location

        # Parent mesh to armature with automatic weights
        mesh_obj.select_set(True)
        armature_obj.select_set(True)
        bpy.context.view_layer.objects.active = armature_obj
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')

        return armature_obj
    except Exception as e:
        print(f"⚠️ Could not create Rigify armature: {e}")
        return None

def import_rigging_data(json_path):
    """Main import function"""
    print(f"\n🎨 Importing Soulfra Digital Twin: {json_path}\n")

    # Load JSON
    with open(json_path, 'r') as f:
        data = json.load(f)

    # Validate version
    if data.get('version') != '1.0':
        print(f"⚠️ Warning: Unknown version {data.get('version')}")

    # Clear existing mesh objects (optional)
    # bpy.ops.object.select_all(action='SELECT')
    # bpy.ops.object.delete()

    # Import depth map as mesh
    if 'depth_map' in data:
        print("📐 Creating mesh from depth map...")
        depth_data = data['depth_map']

        # Use grayscale depth map
        depth_image_url = depth_data['visualizations']['grayscale']
        resolution = (depth_data['resolution']['width'], depth_data['resolution']['height'])

        depth_array, size = decode_base64_image(depth_image_url)
        mesh_obj = create_plane_from_depth_map(depth_array, resolution, "AvatarMesh")

        print(f"✅ Created mesh: {resolution[0]}x{resolution[1]}")

    # Apply colors
    if 'colors' in data:
        print("🎨 Applying color palette...")
        apply_vertex_colors(mesh_obj, data['colors'])
        create_materials_from_palette(mesh_obj, data['colors'])
        print(f"✅ Applied {len(data['colors']['palette'])} colors")

    # Add description as text
    if 'llava_description' in data:
        print("💬 Adding description text...")
        desc_text = create_text_object(
            data['llava_description'],
            location=(0, -3, 0),
            name="AvatarDescription"
        )
        print("✅ Description added")

    # Setup rigging (optional, requires Rigify)
    print("\n🦴 Setting up armature...")
    armature = setup_armature_rigify(mesh_obj)
    if armature:
        print("✅ Rigify metarig created")

    # Add metadata as custom properties
    mesh_obj['soulfra_version'] = data.get('version', '1.0')
    mesh_obj['soulfra_timestamp'] = data.get('timestamp', '')
    mesh_obj['soulfra_tool'] = data.get('metadata', {}).get('tool', 'Unknown')

    # Focus view on object
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj
    bpy.ops.view3d.view_selected()

    print("\n✅ Import complete!\n")
    print("Next steps:")
    print("  1. Generate Rigify rig: Select armature → Generate Rig")
    print("  2. Adjust materials in Shading workspace")
    print("  3. Export as VRM: File → Export → VRM")
    print(f"  4. Metadata stored in mesh custom properties")

    return mesh_obj

# Main execution
if __name__ == "__main__":
    # Check if running in Blender
    try:
        import bpy
    except ImportError:
        print("❌ This script must be run inside Blender!")
        print("Usage: blender --python blender_import_rigging.py -- /path/to/rigging_data.json")
        sys.exit(1)

    # Get JSON path from command line or use default
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1:]
        if len(argv) > 0:
            json_path = argv[0]
        else:
            json_path = "calriven_rigging_data.json"
    else:
        # Default path - MODIFY THIS!
        json_path = "/Users/matthewmauer/Desktop/soulfra.github.io/data/calriven_rigging_data.json"

    # Check if file exists
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        print(f"Please modify the JSON_PATH variable or run with:")
        print(f"blender --python {__file__} -- /path/to/your/rigging_data.json")
    else:
        # Import!
        import_rigging_data(json_path)
