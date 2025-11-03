#!/usr/bin/env python3
"""
INTEGRATE TO SOULFRA-FLAT - Move AI Orchestrator to the consolidated platform
This organizes everything properly and creates integration points
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime

def create_integration_plan():
    """Create a plan for integrating AI Orchestrator into SOULFRA-FLAT"""
    
    plan = {
        "timestamp": datetime.now().isoformat(),
        "purpose": "Integrate AI Orchestrator into SOULFRA-FLAT",
        "source_files": {
            "ai_orchestrator/": "Complete AI orchestration system",
            "CLAUDE_BRIDGE.py": "Claude communication bridge",
            "CLAUDE_CODE_INTEGRATION.py": "Claude Code monitoring",
            "DEPARTMENT_AUTOMATION.py": "Smart routing system",
            "AI_ECONOMY_GITHUB_AUTOMATION.py": "GitHub PR automation",
            "LOCAL_AI_ECOSYSTEM.py": "Best Ollama integration"
        },
        "target_structure": {
            "/ai_orchestrator/": "Main orchestrator directory",
            "/bridges/ai_bridges/": "Communication bridges",
            "/integrations/desktop/": "Desktop app integrations",
            "/integrations/cloud/": "Cloud service integrations",
            "/utils/automation/": "Automation utilities"
        },
        "integration_points": {
            "main_platform": {
                "file": "SOULFRA_ULTIMATE_UNIFIED.py",
                "method": "Add orchestrator as service",
                "port": 8080
            },
            "ollama": {
                "file": "LOCAL_AI_ECOSYSTEM.py",
                "method": "Use existing Ollama connection",
                "enhancement": "Share Ollama instance"
            },
            "web_interface": {
                "url": "/orchestrator",
                "description": "Add to main SOULFRA navigation"
            }
        },
        "benefits": {
            "unified_control": "Control all AI tools from SOULFRA",
            "shared_ollama": "Use existing Ollama integration",
            "mobile_ready": "Access from phone anywhere",
            "no_duplicates": "Follows NO DUPLICATES rule"
        }
    }
    
    # Save plan
    with open("AI_ORCHESTRATOR_INTEGRATION_PLAN.json", "w") as f:
        json.dump(plan, f, indent=2)
    
    print("📋 Integration plan created: AI_ORCHESTRATOR_INTEGRATION_PLAN.json")
    return plan

def generate_copy_script():
    """Generate script to copy files to SOULFRA-FLAT"""
    
    script = '''#!/bin/bash
# Copy AI Orchestrator to SOULFRA-FLAT

SOULFRA_FLAT="/Users/matthewmauer/Desktop/SOULFRA-FLAT"
SOURCE_DIR="$(pwd)"

echo "🚀 Copying AI Orchestrator to SOULFRA-FLAT..."

# Create directories
mkdir -p "$SOULFRA_FLAT/ai_orchestrator"
mkdir -p "$SOULFRA_FLAT/bridges/ai_bridges"
mkdir -p "$SOULFRA_FLAT/integrations/desktop"
mkdir -p "$SOULFRA_FLAT/integrations/cloud"
mkdir -p "$SOULFRA_FLAT/utils/automation"

# Copy main orchestrator
cp -r "$SOURCE_DIR/ai_orchestrator/"* "$SOULFRA_FLAT/ai_orchestrator/"

# Copy bridges
cp "$SOURCE_DIR/CLAUDE_BRIDGE.py" "$SOULFRA_FLAT/bridges/ai_bridges/"
cp "$SOURCE_DIR/CLAUDE_CODE_INTEGRATION.py" "$SOULFRA_FLAT/bridges/ai_bridges/"

# Copy automation
cp "$SOURCE_DIR/DEPARTMENT_AUTOMATION.py" "$SOULFRA_FLAT/utils/automation/"
cp "$SOURCE_DIR/AI_ECONOMY_GITHUB_AUTOMATION.py" "$SOULFRA_FLAT/utils/automation/"

# Copy launch script
cp "$SOURCE_DIR/START_AI_ORCHESTRATOR.py" "$SOULFRA_FLAT/"
cp "$SOURCE_DIR/AI_ORCHESTRATOR_GUIDE.md" "$SOULFRA_FLAT/"

echo "✅ Files copied to SOULFRA-FLAT!"
echo "📁 Location: $SOULFRA_FLAT/ai_orchestrator/"
echo ""
echo "Next steps:"
echo "1. cd $SOULFRA_FLAT"
echo "2. python3 START_AI_ORCHESTRATOR.py"
'''
    
    with open("copy_to_soulfra_flat.sh", "w") as f:
        f.write(script)
    
    os.chmod("copy_to_soulfra_flat.sh", 0o755)
    print("📜 Copy script created: copy_to_soulfra_flat.sh")
    print("   Run: ./copy_to_soulfra_flat.sh")

def create_integration_code():
    """Create code to integrate orchestrator into SOULFRA"""
    
    integration_code = '''
# Add this to SOULFRA_ULTIMATE_UNIFIED.py or your main platform file:

# In the __init__ method:
self.orchestrator_enabled = True
self.orchestrator_port = 8080

# In the services discovery:
if self.orchestrator_enabled:
    self.services['ai_orchestrator'] = {
        'name': 'AI Control Center',
        'port': self.orchestrator_port,
        'url': f'http://localhost:{self.orchestrator_port}',
        'status': self.check_service_status(self.orchestrator_port),
        'description': 'Control all AI tools from your phone'
    }

# Add route to main navigation:
@app.route('/orchestrator')
def orchestrator_redirect():
    """Redirect to AI Orchestrator"""
    return redirect(f'http://localhost:{self.orchestrator_port}')

# In the HTML navigation, add:
<a href="/orchestrator" class="nav-link">
    🎮 AI Control Center
</a>

# To share Ollama connection, in LOCAL_AI_ECOSYSTEM.py:
# Export the connector
ollama_connector = LocalAIEcosystem()

# Then in MASTER_ORCHESTRATOR.py:
# Import and use shared instance
from LOCAL_AI_ECOSYSTEM import ollama_connector
self.ollama = ollama_connector
'''
    
    with open("ORCHESTRATOR_INTEGRATION_CODE.py", "w") as f:
        f.write(integration_code)
    
    print("💻 Integration code created: ORCHESTRATOR_INTEGRATION_CODE.py")

def analyze_current_structure():
    """Analyze what we have and what connects to what"""
    
    print("\n📊 Analyzing current structure...")
    
    # Find key files
    orchestrator_files = []
    bridge_files = []
    integration_files = []
    
    for root, dirs, files in os.walk("."):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                
                # Read first few lines to categorize
                try:
                    with open(path, 'r') as f:
                        content = f.read(500).lower()
                        
                    if 'orchestrat' in content:
                        orchestrator_files.append(path)
                    elif 'bridge' in content:
                        bridge_files.append(path)
                    elif any(word in content for word in ['claude', 'chatgpt', 'cursor', 'google']):
                        integration_files.append(path)
                except:
                    pass
    
    print(f"\n📁 Found {len(orchestrator_files)} orchestrator files")
    print(f"🌉 Found {len(bridge_files)} bridge files")
    print(f"🔌 Found {len(integration_files)} integration files")
    
    # Save analysis
    analysis = {
        "orchestrator_files": orchestrator_files[:10],  # Top 10
        "bridge_files": bridge_files[:10],
        "integration_files": integration_files[:10],
        "total_files": len(orchestrator_files) + len(bridge_files) + len(integration_files)
    }
    
    with open("AI_ORCHESTRATOR_ANALYSIS.json", "w") as f:
        json.dump(analysis, f, indent=2)
    
    print("\n📊 Analysis saved: AI_ORCHESTRATOR_ANALYSIS.json")

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║        INTEGRATE AI ORCHESTRATOR TO SOULFRA-FLAT            ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Create integration plan
    plan = create_integration_plan()
    
    # Generate copy script
    generate_copy_script()
    
    # Create integration code
    create_integration_code()
    
    # Analyze structure
    analyze_current_structure()
    
    print(f"""
✅ Integration preparation complete!

📋 Files created:
   • AI_ORCHESTRATOR_INTEGRATION_PLAN.json - Full integration plan
   • copy_to_soulfra_flat.sh - Script to copy files
   • ORCHESTRATOR_INTEGRATION_CODE.py - Code snippets
   • AI_ORCHESTRATOR_ANALYSIS.json - Current structure analysis

🚀 To integrate:
   1. Run: ./copy_to_soulfra_flat.sh
   2. Add integration code to SOULFRA
   3. Test: python3 START_AI_ORCHESTRATOR.py

📱 Then access from your phone at:
   http://your-laptop-ip:8080

This gives you ONE place to control ALL your AI tools!
""")

if __name__ == "__main__":
    main()