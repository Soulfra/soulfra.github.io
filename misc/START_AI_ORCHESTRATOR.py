#!/usr/bin/env python3
"""
START AI ORCHESTRATOR - One-click launch for your AI control center
Control Claude, ChatGPT, Google Drive, Cursor, etc. from your phone!
"""

import os
import sys
import subprocess
import time
import socket
import asyncio
from pathlib import Path

# Add ai_orchestrator to path
sys.path.insert(0, str(Path(__file__).parent / 'ai_orchestrator'))

def check_dependencies():
    """Check and install required dependencies"""
    print("🔍 Checking dependencies...")
    
    required = {
        'aiohttp': 'Web server',
        'qrcode': 'QR code generation',
        'requests': 'HTTP requests'
    }
    
    optional = {
        'pyautogui': 'Desktop automation',
        'pyperclip': 'Clipboard access',
        'google-api-python-client': 'Google Drive integration',
        'applescript': 'macOS automation'
    }
    
    missing_required = []
    missing_optional = []
    
    # Check required
    for package, description in required.items():
        try:
            __import__(package)
            print(f"✅ {package} - {description}")
        except ImportError:
            missing_required.append(package)
            print(f"❌ {package} - {description} (REQUIRED)")
    
    # Check optional
    for package, description in optional.items():
        try:
            __import__(package)
            print(f"✅ {package} - {description}")
        except ImportError:
            missing_optional.append(package)
            print(f"⚠️  {package} - {description} (optional)")
    
    # Install missing required
    if missing_required:
        print(f"\n📦 Installing required packages...")
        subprocess.run([sys.executable, '-m', 'pip', 'install'] + missing_required)
    
    # Suggest optional
    if missing_optional:
        print(f"\n💡 Optional packages for full features:")
        print(f"   pip install {' '.join(missing_optional)}")
    
    return len(missing_required) == 0

def check_ollama():
    """Check if Ollama is running"""
    try:
        import requests
        resp = requests.get("http://localhost:11434/api/tags", timeout=2)
        if resp.status_code == 200:
            print("✅ Ollama is running")
            return True
    except:
        pass
    
    print("❌ Ollama not running")
    print("   To start: ollama serve")
    return False

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def print_banner():
    """Print startup banner"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║           🎮 AI ORCHESTRATOR - CONTROL CENTER 🎮            ║
║                                                              ║
║  Control all your AI tools from your phone or browser!      ║
╚══════════════════════════════════════════════════════════════╝
    """)

def main():
    """Main launcher"""
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Missing required dependencies. Please install and try again.")
        return
    
    print()
    
    # Check services
    print("🔍 Checking services...")
    ollama_ok = check_ollama()
    
    # Check for desktop apps
    apps_found = []
    for app in ['Claude', 'ChatGPT', 'Cursor']:
        try:
            if sys.platform == "darwin":  # macOS
                result = subprocess.run(['pgrep', '-f', app], capture_output=True)
                if result.returncode == 0:
                    apps_found.append(app)
                    print(f"✅ {app} is running")
                else:
                    print(f"⚠️  {app} not running (start it for full features)")
            else:
                print(f"⚠️  {app} detection not implemented for this OS")
        except:
            pass
    
    print()
    
    # Get local IP
    local_ip = get_local_ip()
    phone_url = f"http://{local_ip}:8080"
    
    print(f"""
🚀 Starting AI Orchestrator...

📱 Phone Access URL: {phone_url}
💻 Local Access: http://localhost:8080

📲 On your phone:
   1. Make sure you're on the same WiFi network
   2. Open browser to: {phone_url}
   3. Control everything remotely!

🎮 Available Features:
   • Send messages to Claude Desktop
   • Send messages to ChatGPT Desktop
   • Open files in Cursor
   • Chat with Ollama locally
   • Execute Claude CLI commands
   • Access Google Drive (if configured)

Press Ctrl+C to stop
""")
    
    # Start the orchestrator
    try:
        from ai_orchestrator.core.MASTER_ORCHESTRATOR import main as orchestrator_main
        asyncio.run(orchestrator_main())
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down AI Orchestrator...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure port 8080 is free")
        print("2. Check firewall settings")
        print("3. Verify all services are accessible")

if __name__ == "__main__":
    main()