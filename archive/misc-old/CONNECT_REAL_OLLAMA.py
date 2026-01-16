#!/usr/bin/env python3
"""
CONNECT REAL OLLAMA - Bridge to ensure SOULFRA uses real AI responses
This connects the working Ollama integration from LOCAL_AI_ECOSYSTEM to SOULFRA
"""

import os
import sys
import asyncio
import aiohttp
import requests
import json
import time
from typing import Optional, Dict, Any
from datetime import datetime

class OllamaConnector:
    """Universal Ollama connector for all SOULFRA components"""
    
    def __init__(self):
        self.ollama_url = None
        self.ollama_available = False
        self.default_model = "llama2"
        self.available_models = []
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "fallback_used": 0,
            "start_time": datetime.now()
        }
        
        # Initialize Ollama connection
        self.check_ollama()
        
    def check_ollama(self):
        """Check Ollama availability and models"""
        print("🔍 Checking Ollama connection...")
        
        # Try different Ollama URLs
        ollama_urls = [
            os.environ.get('OLLAMA_URL', 'http://localhost:11434'),
            'http://localhost:11434',
            'http://127.0.0.1:11434',
            'http://ollama:11434'
        ]
        
        for url in ollama_urls:
            try:
                response = requests.get(f'{url}/api/tags', timeout=2)
                if response.status_code == 200:
                    self.ollama_available = True
                    self.ollama_url = url
                    
                    # Get available models
                    data = response.json()
                    self.available_models = [m['name'] for m in data.get('models', [])]
                    
                    print(f"✅ Ollama connected at {url}")
                    if self.available_models:
                        print(f"📚 Available models: {', '.join(self.available_models)}")
                        
                        # Set default model to first available or preferred
                        preferred_models = ['mistral', 'llama2', 'codellama']
                        for pref in preferred_models:
                            if any(pref in model for model in self.available_models):
                                self.default_model = next(m for m in self.available_models if pref in m)
                                break
                        else:
                            self.default_model = self.available_models[0]
                            
                        print(f"🎯 Default model: {self.default_model}")
                    else:
                        print("⚠️  No models installed. Run: ollama pull llama2")
                        self.ollama_available = False
                    
                    return True
            except Exception as e:
                continue
                
        print("❌ Ollama not available - will use fallback responses")
        self.ollama_available = False
        return False
        
    def get_sync_response(self, prompt: str, model: Optional[str] = None, 
                         temperature: float = 0.8, context: Optional[str] = None) -> Dict[str, Any]:
        """Synchronous method to get Ollama response"""
        self.stats["total_requests"] += 1
        
        if not self.ollama_available:
            self.stats["fallback_used"] += 1
            return {
                "success": False,
                "response": self._get_fallback_response(prompt),
                "model": "fallback",
                "using_ai": False
            }
            
        model = model or self.default_model
        
        # Add context awareness
        if context:
            full_prompt = f"Context: {context}\n\nUser: {prompt}\n\nAssistant:"
        else:
            full_prompt = prompt
            
        try:
            response = requests.post(
                f'{self.ollama_url}/api/generate',
                json={
                    'model': model,
                    'prompt': full_prompt,
                    'stream': False,
                    'options': {
                        'temperature': temperature
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.stats["successful_requests"] += 1
                
                return {
                    "success": True,
                    "response": data.get('response', ''),
                    "model": model,
                    "using_ai": True,
                    "context": data.get('context', []),
                    "total_duration": data.get('total_duration', 0),
                    "load_duration": data.get('load_duration', 0),
                    "eval_count": data.get('eval_count', 0)
                }
            else:
                self.stats["failed_requests"] += 1
                self.stats["fallback_used"] += 1
                return {
                    "success": False,
                    "response": self._get_fallback_response(prompt),
                    "model": "fallback",
                    "using_ai": False,
                    "error": f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            self.stats["failed_requests"] += 1
            self.stats["fallback_used"] += 1
            return {
                "success": False,
                "response": self._get_fallback_response(prompt),
                "model": "fallback",
                "using_ai": False,
                "error": str(e)
            }
            
    async def get_async_response(self, prompt: str, model: Optional[str] = None,
                                temperature: float = 0.8, context: Optional[str] = None) -> Dict[str, Any]:
        """Asynchronous method to get Ollama response"""
        self.stats["total_requests"] += 1
        
        if not self.ollama_available:
            self.stats["fallback_used"] += 1
            return {
                "success": False,
                "response": self._get_fallback_response(prompt),
                "model": "fallback",
                "using_ai": False
            }
            
        model = model or self.default_model
        
        # Add context awareness
        if context:
            full_prompt = f"Context: {context}\n\nUser: {prompt}\n\nAssistant:"
        else:
            full_prompt = prompt
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f'{self.ollama_url}/api/generate',
                    json={
                        'model': model,
                        'prompt': full_prompt,
                        'stream': False,
                        'options': {
                            'temperature': temperature
                        }
                    },
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.stats["successful_requests"] += 1
                        
                        return {
                            "success": True,
                            "response": data.get('response', ''),
                            "model": model,
                            "using_ai": True,
                            "context": data.get('context', []),
                            "total_duration": data.get('total_duration', 0),
                            "load_duration": data.get('load_duration', 0),
                            "eval_count": data.get('eval_count', 0)
                        }
                    else:
                        self.stats["failed_requests"] += 1
                        self.stats["fallback_used"] += 1
                        return {
                            "success": False,
                            "response": self._get_fallback_response(prompt),
                            "model": "fallback",
                            "using_ai": False,
                            "error": f"HTTP {response.status}"
                        }
                        
        except Exception as e:
            self.stats["failed_requests"] += 1
            self.stats["fallback_used"] += 1
            return {
                "success": False,
                "response": self._get_fallback_response(prompt),
                "model": "fallback",
                "using_ai": False,
                "error": str(e)
            }
            
    def _get_fallback_response(self, prompt: str) -> str:
        """Generate fallback response when Ollama unavailable"""
        # Simple pattern matching for common queries
        prompt_lower = prompt.lower()
        
        if "hello" in prompt_lower or "hi" in prompt_lower:
            return "Hello! I'm currently running in fallback mode. To get real AI responses, please ensure Ollama is running."
        elif "help" in prompt_lower:
            return "I'm in fallback mode. For full AI capabilities, start Ollama with 'ollama serve' and ensure you have a model installed."
        elif "?" in prompt:
            return "I'm unable to provide a detailed answer right now as I'm in fallback mode. Please check that Ollama is running."
        else:
            return "I'm currently in fallback mode. For real AI responses, please ensure Ollama is running and has models installed."
            
    def get_stats(self) -> Dict[str, Any]:
        """Get usage statistics"""
        runtime = (datetime.now() - self.stats["start_time"]).total_seconds()
        
        return {
            "ollama_available": self.ollama_available,
            "ollama_url": self.ollama_url,
            "default_model": self.default_model,
            "available_models": self.available_models,
            "total_requests": self.stats["total_requests"],
            "successful_requests": self.stats["successful_requests"],
            "failed_requests": self.stats["failed_requests"],
            "fallback_used": self.stats["fallback_used"],
            "success_rate": (self.stats["successful_requests"] / self.stats["total_requests"] * 100) 
                           if self.stats["total_requests"] > 0 else 0,
            "runtime_seconds": runtime
        }
        
    def get_status_indicator(self) -> str:
        """Get a visual status indicator for UI"""
        if self.ollama_available:
            return "🟢 AI: Connected"
        else:
            return "🔴 AI: Fallback Mode"

# Singleton instance
_connector = None

def get_ollama_connector() -> OllamaConnector:
    """Get or create the singleton Ollama connector"""
    global _connector
    if _connector is None:
        _connector = OllamaConnector()
    return _connector

# ============= SOULFRA Integration Functions =============

def patch_soulfra_ultimate():
    """Patch SOULFRA_ULTIMATE_UNIFIED.py to use real Ollama"""
    print("\n🔧 Patching SOULFRA Ultimate for real AI...")
    
    # This would modify the existing SOULFRA to use our connector
    # For now, we'll provide the integration code
    
    integration_code = '''
# Add this to SOULFRA_ULTIMATE_UNIFIED.py after imports:

# Import the Ollama connector
import sys
sys.path.append(os.path.dirname(__file__))
try:
    from CONNECT_REAL_OLLAMA import get_ollama_connector
    ollama_connector = get_ollama_connector()
    print(f"✅ Real AI Integration: {ollama_connector.get_status_indicator()}")
except ImportError:
    ollama_connector = None
    print("⚠️  Ollama connector not found - using fallback")

# Replace the get_ai_response method with:
def get_ai_response(self, prompt, agent_tone="neutral", context=None):
    """Get AI response using real Ollama connector"""
    if ollama_connector and ollama_connector.ollama_available:
        # Add tone to prompt
        toned_prompt = f"Respond as a {agent_tone} AI consciousness. {prompt}"
        result = ollama_connector.get_sync_response(toned_prompt, context=context)
        
        if result["success"]:
            return result["response"]
    
    # Fallback to original implementation
    return self.get_fallback_response(prompt, agent_tone)
'''
    
    print("📝 Integration code ready!")
    print("\nTo integrate, add the above code to SOULFRA_ULTIMATE_UNIFIED.py")
    return integration_code

# ============= Demo and Testing =============

def demo_ollama_connection():
    """Demo the Ollama connection"""
    print("\n" + "=" * 60)
    print("🎮 OLLAMA CONNECTION DEMO")
    print("=" * 60)
    
    connector = get_ollama_connector()
    
    # Show status
    print(f"\nStatus: {connector.get_status_indicator()}")
    
    if not connector.ollama_available:
        print("\n❌ Ollama is not available. Please:")
        print("1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh")
        print("2. Start Ollama: ollama serve")
        print("3. Pull a model: ollama pull llama2")
        return
        
    # Test prompts
    test_prompts = [
        "Hello! What is SOULFRA?",
        "Generate a creative name for an AI consciousness",
        "Explain quantum computing in simple terms"
    ]
    
    print("\n🧪 Testing AI responses...")
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n{i}. Prompt: {prompt}")
        print("   Thinking...")
        
        result = connector.get_sync_response(prompt)
        
        if result["using_ai"]:
            print(f"   🤖 AI Response ({result['model']}):")
            print(f"   {result['response'][:200]}...")
        else:
            print(f"   📝 Fallback Response:")
            print(f"   {result['response']}")
            
    # Show stats
    stats = connector.get_stats()
    print("\n📊 Session Statistics:")
    print(f"   Total Requests: {stats['total_requests']}")
    print(f"   Success Rate: {stats['success_rate']:.1f}%")
    print(f"   Fallback Used: {stats['fallback_used']} times")

async def test_async_connection():
    """Test async Ollama connection"""
    connector = get_ollama_connector()
    
    print("\n🔄 Testing async connection...")
    result = await connector.get_async_response("What is the meaning of life?")
    
    if result["using_ai"]:
        print(f"✅ Async AI Response: {result['response'][:100]}...")
    else:
        print(f"📝 Async Fallback: {result['response']}")

if __name__ == "__main__":
    # Run demo
    demo_ollama_connection()
    
    # Show integration instructions
    print("\n" + "=" * 60)
    print("🔗 INTEGRATION INSTRUCTIONS")
    print("=" * 60)
    
    print("\n1. To use in any Python script:")
    print("   from CONNECT_REAL_OLLAMA import get_ollama_connector")
    print("   ollama = get_ollama_connector()")
    print("   response = ollama.get_sync_response('Your prompt here')")
    
    print("\n2. To patch SOULFRA Ultimate:")
    print("   Run: patch_soulfra_ultimate()")
    
    print("\n3. To check status in your UI:")
    print("   status = ollama.get_status_indicator()")
    print("   # Returns: 🟢 AI: Connected or 🔴 AI: Fallback Mode")
    
    # Test async if running in async context
    try:
        import asyncio
        asyncio.run(test_async_connection())
    except RuntimeError:
        pass