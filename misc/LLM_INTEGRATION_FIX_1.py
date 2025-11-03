#!/usr/bin/env python3
"""
LLM Integration UTF-8 Fix
Ensures proper encoding for AI/LLM prompts and responses
"""

import json
import re
import unicodedata
from typing import Dict, Any, Optional
import sys
import io

# Force UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class LLMEncodingHandler:
    """Handles encoding/decoding for LLM interactions"""
    
    def __init__(self):
        self.emoji_pattern = re.compile(
            "[\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"   # symbols & pictographs
            "\U0001F680-\U0001F6FF"   # transport & map symbols
            "\U0001F1E0-\U0001F1FF"   # flags
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE)
    
    def clean_prompt(self, prompt: str) -> str:
        """Clean and prepare prompt for LLM"""
        # Ensure string type
        if not isinstance(prompt, str):
            prompt = str(prompt)
        
        # Normalize unicode
        prompt = unicodedata.normalize('NFC', prompt)
        
        # Remove zero-width characters that can cause issues
        prompt = prompt.replace('\u200b', '')  # Zero-width space
        prompt = prompt.replace('\u200c', '')  # Zero-width non-joiner
        prompt = prompt.replace('\u200d', '')  # Zero-width joiner
        prompt = prompt.replace('\ufeff', '')  # Zero-width no-break space
        
        return prompt
    
    def format_response(self, response: str) -> str:
        """Format LLM response for safe display"""
        if not isinstance(response, str):
            response = str(response)
        
        # Ensure proper encoding
        response = response.encode('utf-8', errors='replace').decode('utf-8')
        
        # Fix common encoding issues
        response = response.replace('â€™', "'")  # Smart quote
        response = response.replace('â€œ', '"')  # Left double quote
        response = response.replace('â€', '"')   # Right double quote
        response = response.replace('â€"', '—')  # Em dash
        response = response.replace('â€"', '–')  # En dash
        response = response.replace('Ã©', 'é')   # Common French e
        response = response.replace('Ã¨', 'è')
        response = response.replace('Ã ', 'à')
        
        return response
    
    def safe_json_dumps(self, data: Dict[str, Any]) -> str:
        """Safely serialize JSON with UTF-8 support"""
        return json.dumps(data, ensure_ascii=False, indent=2)
    
    def safe_json_loads(self, data: str) -> Dict[str, Any]:
        """Safely parse JSON with UTF-8 support"""
        try:
            # Clean the string first
            data = self.clean_prompt(data)
            return json.loads(data)
        except json.JSONDecodeError as e:
            # Try to fix common issues
            data = data.replace("'", '"')  # Single to double quotes
            data = re.sub(r',\s*}', '}', data)  # Remove trailing commas
            data = re.sub(r',\s*]', ']', data)
            
            try:
                return json.loads(data)
            except:
                return {"error": f"JSON decode error: {str(e)}", "raw": data}
    
    def extract_emojis(self, text: str) -> list:
        """Extract all emojis from text"""
        return self.emoji_pattern.findall(text)
    
    def escape_for_html(self, text: str) -> str:
        """Escape text for HTML display while preserving emojis"""
        # Basic HTML escaping
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        text = text.replace('"', '&quot;')
        text = text.replace("'", '&#39;')
        
        return text

class LLMPromptTemplate:
    """Templates for LLM prompts with proper encoding"""
    
    @staticmethod
    def create_safe_prompt(role: str, content: str, context: Optional[Dict] = None) -> Dict:
        """Create a safe prompt structure"""
        handler = LLMEncodingHandler()
        
        prompt = {
            "role": role,
            "content": handler.clean_prompt(content)
        }
        
        if context:
            prompt["context"] = {
                k: handler.clean_prompt(str(v)) if isinstance(v, str) else v
                for k, v in context.items()
            }
        
        return prompt
    
    @staticmethod
    def format_chat_history(messages: list) -> list:
        """Format chat history with proper encoding"""
        handler = LLMEncodingHandler()
        formatted = []
        
        for msg in messages:
            formatted_msg = {
                "role": msg.get("role", "user"),
                "content": handler.clean_prompt(msg.get("content", ""))
            }
            
            # Preserve emojis
            emojis = handler.extract_emojis(msg.get("content", ""))
            if emojis:
                formatted_msg["emojis"] = emojis
            
            formatted.append(formatted_msg)
        
        return formatted

class MockLLMService:
    """Mock LLM service demonstrating proper encoding"""
    
    def __init__(self):
        self.handler = LLMEncodingHandler()
        self.responses = {
            "greeting": "Hello! 👋 How can I help you today? 😊",
            "emoji": "Great question! Here are some emojis: 🚀 🔥 💯 ⚡ 🌟",
            "unicode": "I can handle unicode too: café, résumé, naïve, 你好, мир",
            "mixed": "Let's mix it up! 🎉 Unicode café ☕ and emojis 🌈 together!"
        }
    
    def generate_response(self, prompt: str) -> str:
        """Generate a response with proper encoding"""
        # Clean the prompt
        clean_prompt = self.handler.clean_prompt(prompt)
        
        # Simple keyword matching for demo
        if "emoji" in clean_prompt.lower():
            response = self.responses["emoji"]
        elif "unicode" in clean_prompt.lower():
            response = self.responses["unicode"]
        elif "hello" in clean_prompt.lower() or "hi" in clean_prompt.lower():
            response = self.responses["greeting"]
        else:
            response = self.responses["mixed"]
        
        # Format the response
        return self.handler.format_response(response)
    
    def chat(self, messages: list) -> Dict[str, Any]:
        """Chat endpoint with proper encoding"""
        # Format chat history
        formatted_messages = LLMPromptTemplate.format_chat_history(messages)
        
        # Get last message
        last_message = formatted_messages[-1]["content"] if formatted_messages else ""
        
        # Generate response
        response = self.generate_response(last_message)
        
        # Return formatted response
        return {
            "response": response,
            "formatted_messages": formatted_messages,
            "encoding": "utf-8",
            "emojis_found": self.handler.extract_emojis(response)
        }

# Integration wrapper for existing services
class LLMIntegrationWrapper:
    """Wrap existing LLM calls with proper encoding"""
    
    def __init__(self, llm_function):
        self.llm_function = llm_function
        self.handler = LLMEncodingHandler()
    
    def __call__(self, prompt: str, **kwargs) -> str:
        """Wrap LLM call with encoding fixes"""
        # Clean prompt
        clean_prompt = self.handler.clean_prompt(prompt)
        
        # Call original function
        try:
            response = self.llm_function(clean_prompt, **kwargs)
        except Exception as e:
            response = f"Error calling LLM: {str(e)}"
        
        # Format response
        return self.handler.format_response(str(response))

# Example integration
def integrate_with_service():
    """Example of integrating with existing service"""
    
    # Mock existing LLM function
    def existing_llm_function(prompt):
        # Simulate LLM response
        return f"Response to: {prompt}"
    
    # Wrap with encoding handler
    safe_llm = LLMIntegrationWrapper(existing_llm_function)
    
    # Test with emoji prompt
    response = safe_llm("Hello! 🚀 Can you help me? 💯")
    print(f"Safe response: {response}")
    
    # Test chat service
    chat_service = MockLLMService()
    result = chat_service.chat([
        {"role": "user", "content": "Show me some emojis! 🎉"}
    ])
    
    print(f"Chat response: {json.dumps(result, ensure_ascii=False, indent=2)}")

# Test suite
def test_encoding():
    """Test encoding fixes"""
    handler = LLMEncodingHandler()
    
    test_cases = [
        "Simple text",
        "Emoji test: 🚀 🔥 💯",
        "Unicode: café résumé naïve",
        "Mixed: Hello 👋 from café ☕",
        "Complex: 你好世界 🌍 مرحبا",
        '{"json": "with emoji 🎉"}',
        "Zero-width: \u200btest\u200c"
    ]
    
    print("====================================")
    print("   LLM ENCODING TEST SUITE          ")
    print("====================================")
    print()
    
    for test in test_cases:
        print(f"Original: {repr(test)}")
        cleaned = handler.clean_prompt(test)
        print(f"Cleaned:  {repr(cleaned)}")
        formatted = handler.format_response(cleaned)
        print(f"Formatted: {formatted}")
        
        if '{' in test:
            try:
                parsed = handler.safe_json_loads(test)
                print(f"JSON: {handler.safe_json_dumps(parsed)}")
            except:
                print("JSON: Failed to parse")
        
        print("---")
    
    print("\n✅ Encoding tests complete!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_encoding()
    else:
        integrate_with_service()