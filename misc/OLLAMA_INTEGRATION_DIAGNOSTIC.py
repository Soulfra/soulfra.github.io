#!/usr/bin/env python3
"""
OLLAMA INTEGRATION DIAGNOSTIC
Checks if Ollama is running and which SOULFRA components are using real AI vs placeholders
"""

import os
import sys
import subprocess
import requests
import json
import time
from pathlib import Path
from datetime import datetime

class OllamaIntegrationDiagnostic:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "ollama_status": {},
            "soulfra_components": {},
            "recommendations": []
        }
        
    def print_header(self, text):
        print("\n" + "=" * 60)
        print(f"🔍 {text}")
        print("=" * 60)
        
    def check_ollama_installed(self):
        """Check if Ollama is installed"""
        self.print_header("Checking Ollama Installation")
        
        try:
            result = subprocess.run(['ollama', '--version'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Ollama is installed")
                version = result.stdout.strip()
                print(f"   Version: {version}")
                self.results["ollama_status"]["installed"] = True
                self.results["ollama_status"]["version"] = version
                return True
            else:
                print("❌ Ollama command not found")
                self.results["ollama_status"]["installed"] = False
                return False
        except FileNotFoundError:
            print("❌ Ollama is NOT installed")
            print("\n📦 To install Ollama:")
            print("   macOS/Linux: curl -fsSL https://ollama.ai/install.sh | sh")
            print("   Or visit: https://ollama.ai/download")
            self.results["ollama_status"]["installed"] = False
            self.results["recommendations"].append("Install Ollama")
            return False
            
    def check_ollama_running(self):
        """Check if Ollama service is running"""
        self.print_header("Checking Ollama Service")
        
        # Check different possible Ollama URLs
        ollama_urls = [
            'http://localhost:11434',
            'http://127.0.0.1:11434',
            'http://ollama:11434'
        ]
        
        for url in ollama_urls:
            try:
                response = requests.get(f'{url}/api/tags', timeout=2)
                if response.status_code == 200:
                    print(f"✅ Ollama service is RUNNING at {url}")
                    self.results["ollama_status"]["running"] = True
                    self.results["ollama_status"]["url"] = url
                    
                    # Check available models
                    models = response.json().get('models', [])
                    if models:
                        print(f"\n📚 Available models:")
                        for model in models:
                            print(f"   • {model['name']} ({model.get('size', 'unknown size')})")
                        self.results["ollama_status"]["models"] = [m['name'] for m in models]
                    else:
                        print("\n⚠️  No models installed")
                        print("   Run: ollama pull llama2")
                        self.results["ollama_status"]["models"] = []
                        self.results["recommendations"].append("Pull an Ollama model (e.g., ollama pull llama2)")
                    
                    return True
            except:
                continue
                
        print("❌ Ollama service is NOT running")
        print("\n🚀 To start Ollama:")
        print("   Run: ollama serve")
        print("   Or it may start automatically when you run 'ollama pull llama2'")
        self.results["ollama_status"]["running"] = False
        self.results["recommendations"].append("Start Ollama service")
        return False
        
    def test_ollama_generation(self):
        """Test actual text generation with Ollama"""
        if not self.results["ollama_status"].get("running"):
            return False
            
        self.print_header("Testing Ollama Generation")
        
        url = self.results["ollama_status"]["url"]
        models = self.results["ollama_status"].get("models", [])
        
        if not models:
            print("❌ No models available to test")
            return False
            
        # Test with first available model
        test_model = models[0]
        print(f"🧪 Testing generation with model: {test_model}")
        
        try:
            response = requests.post(f'{url}/api/generate',
                json={
                    'model': test_model,
                    'prompt': 'Say "Hello SOULFRA" in a creative way',
                    'stream': False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get('response', '')
                if generated_text:
                    print("✅ Generation successful!")
                    print(f"\n📝 Response: {generated_text[:200]}...")
                    self.results["ollama_status"]["generation_works"] = True
                    return True
                else:
                    print("⚠️  Empty response from Ollama")
                    self.results["ollama_status"]["generation_works"] = False
                    return False
            else:
                print(f"❌ Generation failed: {response.status_code}")
                self.results["ollama_status"]["generation_works"] = False
                return False
                
        except Exception as e:
            print(f"❌ Generation error: {str(e)}")
            self.results["ollama_status"]["generation_works"] = False
            return False
            
    def check_soulfra_components(self):
        """Check which SOULFRA components have Ollama integration"""
        self.print_header("Analyzing SOULFRA Components")
        
        # Find Python files with Ollama integration
        search_patterns = [
            'ollama',
            'localhost:11434',
            'api/generate',
            'get_ai_response',
            'process_with_llm'
        ]
        
        components = {}
        
        # Check main SOULFRA files
        files_to_check = [
            'SOULFRA_ULTIMATE_UNIFIED.py',
            'LOCAL_AI_ECOSYSTEM.py',
            'CHAT_PROCESSOR.py',
            'SIMPLE_CHAT_PROCESSOR.py'
        ]
        
        for filename in files_to_check:
            if os.path.exists(filename):
                print(f"\n📄 Checking {filename}...")
                with open(filename, 'r') as f:
                    content = f.read()
                    
                has_ollama = False
                has_fallback = False
                integration_quality = "none"
                
                # Check for Ollama integration
                if 'ollama' in content.lower():
                    has_ollama = True
                    if 'check_ollama' in content or 'ollama_available' in content:
                        integration_quality = "full"
                    else:
                        integration_quality = "partial"
                        
                # Check for fallback responses
                if 'fallback' in content or 'mock' in content.lower():
                    has_fallback = True
                    
                components[filename] = {
                    "has_ollama": has_ollama,
                    "has_fallback": has_fallback,
                    "integration_quality": integration_quality
                }
                
                if has_ollama:
                    print(f"   ✅ Has Ollama integration ({integration_quality})")
                else:
                    print("   ❌ No Ollama integration")
                    
                if has_fallback:
                    print("   ⚠️  Has fallback/mock responses")
                    
        self.results["soulfra_components"] = components
        
        # Check SOULFRA-FLAT
        flat_path = "/Users/matthewmauer/Desktop/SOULFRA-FLAT/core/SOULFRA_ULTIMATE_UNIFIED.py"
        if os.path.exists(flat_path):
            print(f"\n📁 Checking SOULFRA-FLAT version...")
            with open(flat_path, 'r') as f:
                content = f.read()
                if 'check_ollama' in content and 'get_ai_response' in content:
                    print("   ✅ SOULFRA-FLAT has full Ollama integration!")
                    self.results["soulfra_flat_integration"] = True
                else:
                    print("   ⚠️  SOULFRA-FLAT missing Ollama integration")
                    self.results["soulfra_flat_integration"] = False
                    
    def check_running_processes(self):
        """Check if any SOULFRA processes are running"""
        self.print_header("Checking Running Processes")
        
        try:
            # Check for processes on SOULFRA ports
            ports_to_check = [9999, 9091, 8888, 7777, 11434]
            running_services = []
            
            for port in ports_to_check:
                result = subprocess.run(f'lsof -ti :{port}', 
                                      shell=True, capture_output=True, text=True)
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    service_name = "Unknown"
                    
                    # Identify service
                    if port == 11434:
                        service_name = "Ollama"
                    elif port == 9999:
                        service_name = "SOULFRA Ultimate"
                    elif port == 9091:
                        service_name = "AI Economy"
                    elif port == 8888:
                        service_name = "Chat Processor"
                    elif port == 7777:
                        service_name = "Monitor/Mobile"
                        
                    print(f"   ✅ Port {port}: {service_name} (PID: {pids[0]})")
                    running_services.append({
                        "port": port,
                        "service": service_name,
                        "pid": pids[0]
                    })
                    
            if not running_services:
                print("   ❌ No SOULFRA services running")
            
            self.results["running_services"] = running_services
            
        except Exception as e:
            print(f"   ⚠️  Could not check processes: {str(e)}")
            
    def generate_recommendations(self):
        """Generate specific recommendations"""
        self.print_header("Recommendations")
        
        # Already added some recommendations during checks
        # Add more based on findings
        
        if not self.results["ollama_status"].get("installed"):
            print("\n1. 🔧 Install Ollama first:")
            print("   curl -fsSL https://ollama.ai/install.sh | sh")
            
        elif not self.results["ollama_status"].get("running"):
            print("\n1. 🚀 Start Ollama service:")
            print("   ollama serve")
            
        elif not self.results["ollama_status"].get("models"):
            print("\n1. 📦 Pull a model:")
            print("   ollama pull llama2")
            print("   ollama pull mistral")
            
        else:
            print("\n✅ Ollama is ready to use!")
            
        # SOULFRA recommendations
        if self.results.get("soulfra_flat_integration"):
            print("\n2. 🎯 Launch SOULFRA with AI:")
            print("   cd /Users/matthewmauer/Desktop/SOULFRA-FLAT")
            print("   python3 PRODUCTION_LAUNCH.py")
        else:
            print("\n2. 🔗 Use LOCAL_AI_ECOSYSTEM for best integration:")
            print("   python3 LOCAL_AI_ECOSYSTEM.py")
            
        print("\n3. 💡 For real AI responses:")
        print("   • Ensure Ollama is running (ollama serve)")
        print("   • Launch SOULFRA components that have Ollama integration")
        print("   • Watch the console for 'Ollama detected' messages")
        
    def save_report(self):
        """Save diagnostic report"""
        report_file = f"ollama_diagnostic_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n📊 Full report saved to: {report_file}")
        
    def run_diagnostic(self):
        """Run complete diagnostic"""
        print("=" * 60)
        print("🤖 OLLAMA INTEGRATION DIAGNOSTIC FOR SOULFRA")
        print("=" * 60)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run checks
        ollama_installed = self.check_ollama_installed()
        
        if ollama_installed:
            ollama_running = self.check_ollama_running()
            if ollama_running:
                self.test_ollama_generation()
                
        self.check_soulfra_components()
        self.check_running_processes()
        self.generate_recommendations()
        self.save_report()
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 SUMMARY")
        print("=" * 60)
        
        if self.results["ollama_status"].get("generation_works"):
            print("✅ Ollama is FULLY FUNCTIONAL and ready for AI integration!")
        elif self.results["ollama_status"].get("running"):
            print("⚠️  Ollama is running but needs models installed")
        elif self.results["ollama_status"].get("installed"):
            print("⚠️  Ollama is installed but not running")
        else:
            print("❌ Ollama is not installed - AI features will use placeholders")
            
        # Component summary
        components_with_ollama = sum(1 for c in self.results.get("soulfra_components", {}).values() 
                                    if c.get("has_ollama"))
        total_components = len(self.results.get("soulfra_components", {}))
        
        print(f"\n🔧 SOULFRA Components: {components_with_ollama}/{total_components} have Ollama integration")
        
        if self.results.get("running_services"):
            print(f"\n🟢 Running Services: {len(self.results['running_services'])}")
        else:
            print("\n🔴 No SOULFRA services currently running")

if __name__ == "__main__":
    diagnostic = OllamaIntegrationDiagnostic()
    diagnostic.run_diagnostic()