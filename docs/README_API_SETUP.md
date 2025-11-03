# API Setup Guide for Cal Riven Runtime

To enable full multi-LLM competition in the Cal Riven system, you need to configure real API keys.

## Claude API Key Setup

1. Get your Claude API key from: https://console.anthropic.com/
2. Update the following files with your actual API key:

### vault/router-env.json
```json
{
  "api_key": "YOUR-CLAUDE-API-KEY-HERE",
  "device_id": "vault-core-mirror-001", 
  "operator": "cal-riven-root"
}
```

### api/claude-env.json
```json
{
  "api_key": "YOUR-CLAUDE-API-KEY-HERE",
  "LLM": "claude",
  "mirror": "local",
  "trust_route": "api"
}
```

## Ollama Setup

1. Install Ollama: https://ollama.ai/
2. Start the Ollama service:
```bash
ollama serve
```
3. Pull the mistral model:
```bash
ollama pull mistral
```

## DeepSeek Setup

DeepSeek is currently running in simulation mode. To use the real API:
1. Get API key from: https://platform.deepseek.com/
2. Update runtime/agent-orchestrator.js to use real API calls

## Testing Your Setup

Run the full test:
```bash
cd tier-minus10
bash launch-cal-platform.sh
# Choose option 6: Run live test
```

With real API keys configured, you should see actual LLM responses competing in the GameShell runtime.