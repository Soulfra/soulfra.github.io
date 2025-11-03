# AI Orchestrator Integration Guide

## 🎯 What This Does

Your **local Ollama** becomes the brain that controls:
- Claude Desktop app
- ChatGPT Desktop app  
- Google Drive
- Cursor IDE
- Claude CLI/Code
- Any other tools you add

All controllable from your **phone or any browser**!

## 🚀 Quick Start

```bash
python3 START_AI_ORCHESTRATOR.py
```

Then open your phone browser to the URL shown (e.g., http://192.168.1.100:8080)

## 📱 Phone Commands

Type naturally in the command box:
- "Ask Claude about Python async"
- "Open main.py in Cursor"
- "Chat with all AIs about web development"
- "Save this to Google Drive"

## 🔧 Setup Guide

### 1. Required Services

**Ollama** (Brain):
```bash
# Install
curl -fsSL https://ollama.ai/install.sh | sh

# Start
ollama serve

# Get a model
ollama pull llama2
```

### 2. Optional Desktop Apps

- **Claude Desktop**: Download from Anthropic
- **ChatGPT Desktop**: Download from OpenAI
- **Cursor**: Download from cursor.sh
- **Claude CLI**: `pip install claude-cli`

### 3. Full Automation (Optional)

For desktop control:
```bash
pip install pyautogui pyperclip

# macOS only:
pip install applescript
```

### 4. Google Drive (Optional)

1. Get credentials from Google Cloud Console
2. Save to `~/.credentials/google_drive.json`
3. The orchestrator will detect it automatically

## 🏗️ Architecture

```
Your Phone/Browser
       ↓
AI Orchestrator (port 8080)
       ↓
   Ollama (Brain)
    ↙   ↓   ↘
Claude  ChatGPT  Cursor
Desktop Desktop   IDE
```

## 🔌 Adding New Integrations

### 1. Create Integration File

In `ai_orchestrator/integrations/your_tool/`:
```python
class YourToolConnector:
    def send_command(self, cmd):
        # Your implementation
        pass
```

### 2. Register in MASTER_ORCHESTRATOR.py

```python
self.services['your_tool'] = {
    'name': 'Your Tool',
    'type': 'tool',
    'status': self.check_your_tool(),
    'capabilities': ['feature1', 'feature2']
}
```

### 3. Add Handler

```python
async def handle_your_tool(self, action, data):
    # Process commands for your tool
    pass
```

## 📝 Integration Status

### ✅ Working Now
- Ollama chat integration
- Basic Claude Desktop control (macOS)
- Basic ChatGPT Desktop control (macOS)
- Cursor file opening
- Claude CLI execution
- Phone web interface

### 🚧 In Progress
- Response capture from desktop apps
- Google Drive full integration
- Windows/Linux desktop automation
- Voice commands
- Multi-user support

### 💡 Planned
- Notion integration
- Slack integration
- GitHub integration
- Custom webhooks
- IFTTT support

## 🐛 Troubleshooting

### "Can't connect from phone"
1. Ensure phone is on same WiFi network
2. Check firewall isn't blocking port 8080
3. Try IP address instead of hostname

### "Desktop automation not working"
1. Grant accessibility permissions (macOS)
2. Install pyautogui: `pip install pyautogui`
3. Make sure apps are running

### "Ollama not responding"
1. Check it's running: `curl http://localhost:11434`
2. Ensure you have a model: `ollama list`
3. Try restarting: `ollama serve`

## 🎯 Use Cases

### Development Workflow
1. "Open project.py in Cursor"
2. "Ask Claude to review this code"
3. "Generate tests with ChatGPT"
4. "Save results to Drive"

### Research Mode
1. "Ask all AIs about quantum computing"
2. "Compare their responses"
3. "Create summary document"
4. "Open in editor"

### Content Creation
1. "ChatGPT: Write blog outline"
2. "Claude: Expand section 2"
3. "Save draft to Drive"
4. "Open in Cursor for editing"

## 🔒 Security Notes

- Runs only on local network
- No data sent to external servers (except configured APIs)
- Desktop automation requires explicit permissions
- All commands logged locally

## 🚀 Next Steps

1. **Move to SOULFRA-FLAT**: Copy `ai_orchestrator/` folder
2. **Add to main platform**: Integrate with SOULFRA services
3. **Create mobile app**: Native app for better experience
4. **Add more tools**: Integrate everything you use!

---

This is your **local AI command center** - no more switching between apps!