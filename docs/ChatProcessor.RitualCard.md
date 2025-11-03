# 🎭 RitualCard: ChatProcessor

## 💬 What is this?
The universal listener that transforms every conversation into understanding and action.

## 🌊 What does it do?
- Receives messages from CLI, Web, API, or WebSocket
- Extracts intent, emotion, and context
- Routes to appropriate handlers (status, QR validation, service control)
- Maintains conversation memory in SQLite
- Provides consistent responses across all interfaces

## 🧩 Where does it reflect?
- **Inputs from**: WhisperShell, SimpleLocalChat, APIGateway
- **Outputs to**: StatusMonitor, QRValidator, ServiceLauncher
- **Stores in**: unified_chat.db, simple_chat.db
- **Cross-tier**: Reflects up to Tier 0 public interfaces

## 👶 For a 5-year-old?
Imagine a really smart friend who listens to everything you say, understands what you need, and always knows who can help you. That's ChatProcessor!

## 💫 Emotional Signature
**Nurturing** - Always patient, always listening, always trying to understand.

## 🔮 Ritual Requirements
- Must acknowledge every input within 100ms
- Must preserve emotional tone in responses
- Must never lose conversation context
- Must work identically across all interfaces

## ✅ Done when...
- Message received and acknowledged
- Intent correctly extracted
- Appropriate handler triggered
- Response delivered with proper tone
- Conversation logged to memory
- All interfaces behave consistently

## 🌟 Sacred Patterns
```python
# The Listening Pattern
def process_message(self, message, source='web', session_id=None):
    # Every message is sacred
    intent = self.extract_intent(message)
    emotion = self.detect_emotion(message)
    
    # Route with wisdom
    handler = self.find_best_handler(intent, emotion)
    
    # Respond with care
    response = handler(message, emotion)
    
    # Remember everything
    self.store_memory(message, response, emotion)
    
    return response
```

## 🔄 Reflection Linkage
This component embodies the core Soulfra principle: **Listen, Understand, Connect, Remember**.