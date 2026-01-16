# 🤖 Ollama Testing Guide

**End-to-End Integration Testing with Local LLMs**

This guide shows you how to test the entire Soulfra ecosystem using Ollama for local LLM inference. All systems integrate with Ollama to create zero-dependency, privacy-first workflows.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Ollama Setup](#ollama-setup)
3. [Model Installation](#model-installation)
4. [Connection Testing](#connection-testing)
5. [Pipeline Integration](#pipeline-integration)
6. [Reasoning Engine + Ollama](#reasoning-engine--ollama)
7. [Full Workflow Testing](#full-workflow-testing)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configurations](#advanced-configurations)

---

## Prerequisites

### System Requirements
- **macOS**: 10.15+ (Catalina or newer)
- **RAM**: 8GB minimum (16GB+ recommended for larger models)
- **Storage**: 10GB+ free space for models
- **Python**: 3.8+ (for local server)

### Already Installed?
Check if Ollama is already running:

```bash
# Check if Ollama is installed
which ollama

# Check if service is running
curl http://localhost:11434/api/tags
```

If you get a JSON response, Ollama is already running. Skip to [Model Installation](#model-installation).

---

## Ollama Setup

### Install Ollama

**macOS/Linux**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Or download from**: https://ollama.com/download

### Start Ollama Service

Ollama typically starts automatically after installation. Verify:

```bash
# Check service status
curl http://localhost:11434/api/tags

# If not running, start manually
ollama serve
```

**Expected Response**:
```json
{"models":[]}
```

If you see this, Ollama is running correctly (empty models list is normal at first).

### Verify API Access

Test the Ollama API endpoint:

```bash
# List installed models
ollama list

# Check API version
curl http://localhost:11434/api/version
```

**Expected Output**:
```
NAME                    ID              SIZE    MODIFIED
(empty if no models installed yet)
```

---

## Model Installation

### Recommended Models for Soulfra

Install these three models for optimal pipeline testing:

#### 1. DeepSeek R1 (1.5B) - Reasoning Model
```bash
ollama pull deepseek-r1:1.5b
```
- **Size**: ~1GB
- **Use Case**: Research stage, reasoning tasks
- **Speed**: Very fast
- **Quality**: Good for structured thinking

#### 2. Llama 3.2 - Analysis Model
```bash
ollama pull llama3.2
```
- **Size**: ~2GB
- **Use Case**: Analysis stage, context synthesis
- **Speed**: Fast
- **Quality**: Excellent for multi-stage workflows

#### 3. Qwen 2.5 Coder (3B) - Code/Synthesis Model
```bash
ollama pull qwen2.5-coder:3b
```
- **Size**: ~2GB
- **Use Case**: Synthesis stage, technical content
- **Speed**: Fast
- **Quality**: Great for final synthesis

### Verify Models Installed

```bash
ollama list
```

**Expected Output**:
```
NAME                    ID              SIZE    MODIFIED
deepseek-r1:1.5b       abc123def456    1.0 GB  2 minutes ago
llama3.2               def789ghi012    2.0 GB  1 minute ago
qwen2.5-coder:3b       ghi345jkl678    2.0 GB  30 seconds ago
```

### Test Individual Model

Run a quick inference test:

```bash
ollama run deepseek-r1:1.5b "Explain zero-knowledge proofs in one sentence"
```

**Expected**: Model should generate a response within 2-5 seconds.

---

## Connection Testing

### Test from Browser Console

Open `http://localhost:8000/pipelines/run.html` in your browser.

**Press F12** to open Developer Console, then run:

```javascript
// Test Ollama connection
fetch('http://localhost:11434/api/tags')
  .then(r => r.json())
  .then(d => console.log('Ollama models:', d))
  .catch(e => console.error('Connection failed:', e));
```

**Expected Output**:
```javascript
Ollama models: {
  models: [
    { name: 'deepseek-r1:1.5b', ... },
    { name: 'llama3.2', ... },
    { name: 'qwen2.5-coder:3b', ... }
  ]
}
```

### Test Generate Endpoint

```javascript
// Test text generation
fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'deepseek-r1:1.5b',
    prompt: 'Hello, Ollama!',
    stream: false
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d.response))
.catch(e => console.error('Generate failed:', e));
```

**Expected**: Should return generated text within 5 seconds.

---

## Pipeline Integration

### Manual Pipeline Test

1. **Open Pipelines**: `http://localhost:8000/pipelines/run.html`

2. **Configure Pipeline**:
   - **Topic**: "Zero-Knowledge Proofs"
   - **Stage 1 Model**: deepseek-r1:1.5b
   - **Stage 2 Model**: llama3.2
   - **Stage 3 Model**: qwen2.5-coder:3b

3. **Click "Start Pipeline"**

**Expected Flow**:
```
Stage 1: Research (deepseek-r1:1.5b)
├─ Prompt: "Research zero-knowledge proofs"
├─ Domain Context: [Soulfra context injected]
└─ Output: 2-3 paragraphs on ZKPs

Stage 2: Analysis (llama3.2)
├─ Prompt: "Analyze this: [Stage 1 output]"
├─ Domain Context: [Soulfra context injected]
└─ Output: Analysis of Stage 1 content

Stage 3: Synthesis (qwen2.5-coder:3b)
├─ Prompt: "Synthesize: [Stage 1 + Stage 2]"
├─ Domain Context: [Soulfra context injected]
└─ Output: Final synthesis combining both

✅ Pipeline Complete
```

### Timing Expectations

| Stage | Model | Expected Time |
|-------|-------|---------------|
| Stage 1 | deepseek-r1:1.5b | 2-5 seconds |
| Stage 2 | llama3.2 | 3-6 seconds |
| Stage 3 | qwen2.5-coder:3b | 3-6 seconds |
| **Total** | | **8-17 seconds** |

### Verify Domain Context Injection

Check the console output for:
```
[Stage 1] Injecting domain context...
Context: "Soulfra is a temporal experience engine..."
```

This confirms domain context is being injected into prompts.

---

## Reasoning Engine + Ollama

### Generate Content with Ollama for IVC

The Reasoning Engine (IVC - Interview Voice Coach) works best with Ollama-generated content:

#### Test Flow:

1. **Generate Content via Ollama**:

```javascript
// In browser console
const prompt = "Explain the Soulfra protocol's temporal experience mechanics";

fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2',
    prompt: prompt,
    stream: false
  })
})
.then(r => r.json())
.then(data => {
  console.log('Generated text:', data.response);

  // Now feed this to Reasoning Engine
  window.ReasoningEngine.startSession({
    text: data.response,
    mode: 'normal',
    requireScroll: true,
    requireVoice: false,
    minReadTime: 10000
  });

  window.ReasoningEngine.renderAnimation('reasoning-container');
});
```

2. **Expected Result**:
   - Ollama generates explanation text
   - Reasoning Engine displays it word-by-word
   - User must read through entire content at timed pace
   - Prevents premature judgment through timing mechanics

### IVC Pipeline Integration

**Future Enhancement**: Combine pipelines + reasoning engine:

```
Pipeline Output → Reasoning Engine → User Comprehension → User Response → Next Stage Input
```

This creates a **temporal reasoning loop** where:
1. Ollama generates content
2. User experiences it at controlled pace (IVC)
3. User response feeds back into next pipeline stage
4. Loop continues for multi-turn reasoning

---

## Full Workflow Testing

### Workflow #1: Pipeline → Soul Capsule → Story

**Goal**: Test complete content flow from generation to compilation

#### Steps:

1. **Run Pipeline**:
   - URL: `http://localhost:8000/pipelines/run.html`
   - Topic: "Soulfra Integration Test"
   - Models: deepseek-r1:1.5b → llama3.2 → qwen2.5-coder:3b
   - Wait for completion (~10-15 seconds)

2. **Check Pipeline Data**:
```javascript
// In browser console
const pipelineData = JSON.parse(localStorage.getItem('last_pipeline_result'));
console.log('Pipeline:', pipelineData);
```

3. **Create Soul Capsule**:
   - URL: `http://localhost:8000/sandbox/test.html`
   - Click "🌌 Test Soul Capsule"
   - Capsule created from pipeline data

4. **Compile Story**:
   - Click "💊 Capsule → Story"
   - Story panels generated from capsule

5. **Verify Results**:
```javascript
// Check compiled story
const stories = JSON.parse(localStorage.getItem('compiled_stories'));
console.log('Latest story:', stories[stories.length - 1]);
```

**Pass Criteria**:
- ✅ Pipeline completes all 3 stages
- ✅ Soul capsule contains pipeline data
- ✅ Story has 4+ panels (title + 3 stages)
- ✅ All content flows through correctly

---

### Workflow #2: Voice → Reasoning Engine → Pipeline

**Goal**: Test voice input → timed comprehension → LLM synthesis

#### Steps:

1. **Record Voice Memo**:
   - URL: `http://localhost:8000/voice/record.html`
   - Record 10-15 seconds
   - Get transcript

2. **Feed to Reasoning Engine**:
```javascript
const transcript = localStorage.getItem('last_voice_transcript');

window.ReasoningEngine.startSession({
  text: transcript,
  mode: 'slow',
  requireScroll: true,
  onComplete: (session) => {
    console.log('User experienced transcript at controlled pace');

    // Now send to Ollama for analysis
    fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: `Analyze this voice memo transcript: "${transcript}"`,
        stream: false
      })
    })
    .then(r => r.json())
    .then(d => console.log('Ollama analysis:', d.response));
  }
});
```

3. **Result**:
   - User reads their own transcript at paced timing
   - Ollama provides analysis after comprehension
   - Prevents premature self-judgment

---

### Workflow #3: Review → Story Compilation

**Goal**: Test review system integration

#### Steps:

1. **Submit Review**:
   - URL: `http://localhost:8000/reviews/form.html`
   - Business: "Soulfra Protocol"
   - Review: "The temporal experience engine..."
   - Rating: 5 stars

2. **Compile Review Story**:
```javascript
const reviewData = JSON.parse(localStorage.getItem('reviews'))[0];

window.StoryCompiler.compile({
  sources: [{ type: 'review', data: reviewData }],
  title: 'My Soulfra Review',
  format: 'feed'
});
```

3. **Enhance with Ollama**:
```javascript
// Generate additional context
fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'deepseek-r1:1.5b',
    prompt: `Expand on this review: "${reviewData.reviewText}"`,
    stream: false
  })
})
.then(r => r.json())
.then(d => {
  // Add Ollama expansion to story
  const expandedStory = window.StoryCompiler.compile({
    sources: [
      { type: 'review', data: reviewData },
      { type: 'generic', data: { title: 'AI Expansion', content: d.response }}
    ],
    title: 'Enhanced Review Story',
    algorithm: 'RL'
  });

  console.log('Enhanced story:', expandedStory);
});
```

**Pass Criteria**:
- ✅ Review saved to localStorage
- ✅ Story compiled with review panel
- ✅ Ollama expansion adds context
- ✅ RL ordering applied

---

## Troubleshooting

### Problem: "Ollama connection refused"

**Symptoms**:
- Pipeline fails at Stage 1
- Console error: `Failed to fetch`
- Network tab shows `ERR_CONNECTION_REFUSED`

**Solutions**:

1. **Check if Ollama is running**:
```bash
curl http://localhost:11434/api/tags
```

2. **Restart Ollama**:
```bash
# Kill existing process
pkill -f ollama

# Start fresh
ollama serve
```

3. **Check port 11434**:
```bash
lsof -i :11434
```

4. **Verify firewall settings**:
   - macOS: System Preferences → Security → Firewall
   - Allow incoming connections for Ollama

---

### Problem: "Model not found"

**Symptoms**:
- Pipeline starts but returns empty output
- Console error: `model 'xxx' not found`

**Solutions**:

1. **List installed models**:
```bash
ollama list
```

2. **Install missing model**:
```bash
ollama pull deepseek-r1:1.5b
```

3. **Verify exact model name**:
   - Use exact names: `deepseek-r1:1.5b` not `deepseek`
   - Check tag versions: `:1.5b` vs `:latest`

---

### Problem: "Generation takes forever"

**Symptoms**:
- Pipeline stuck on one stage for 30+ seconds
- CPU usage very high
- Browser becomes unresponsive

**Solutions**:

1. **Check model size**:
```bash
ollama list
```
   - Models >7B may be too slow on 8GB RAM
   - Use smaller models (1.5B - 3B recommended)

2. **Reduce prompt length**:
   - Long prompts = slower inference
   - Domain context should be <500 chars

3. **Use `stream: false`**:
   - Streaming can cause delays
   - Non-streaming is faster for short responses

4. **Monitor system resources**:
```bash
# Check CPU/RAM
top -o cpu

# Ollama should use <4GB RAM for 3B models
```

---

### Problem: "CORS errors in browser"

**Symptoms**:
- Console error: `blocked by CORS policy`
- Fetch fails despite Ollama running

**Solutions**:

**Not actually a problem!** Ollama's local API doesn't enforce CORS for localhost.

If you still see CORS errors:

1. **Verify you're accessing via localhost**:
   - ✅ `http://localhost:8000`
   - ❌ `http://127.0.0.1:8000` (different origin)

2. **Check browser console**:
   - Real error might be different
   - CORS error can mask connection issues

---

### Problem: "Empty responses from Ollama"

**Symptoms**:
- Pipeline completes but output is blank
- `response: ""` in API result

**Solutions**:

1. **Test model directly**:
```bash
ollama run deepseek-r1:1.5b "test prompt"
```

2. **Check prompt format**:
```javascript
// Bad: No actual prompt
{ model: 'llama3.2', prompt: '' }

// Good: Clear prompt
{ model: 'llama3.2', prompt: 'Explain ZKPs' }
```

3. **Verify model is loaded**:
```bash
# Should show model in memory
ps aux | grep ollama
```

---

## Advanced Configurations

### Custom Model Management

#### Install Specific Model Versions

```bash
# Latest version
ollama pull llama3.2:latest

# Specific quantization
ollama pull llama3.2:q4_0

# Specific size
ollama pull llama3.2:7b
```

#### Remove Unused Models

```bash
# Free up space
ollama rm old-model-name

# Confirm removal
ollama list
```

---

### Multi-Model Pipelines

Test different model combinations:

#### Speed-Optimized Pipeline
```
Stage 1: deepseek-r1:1.5b (fast reasoning)
Stage 2: llama3.2 (fast analysis)
Stage 3: qwen2.5-coder:3b (fast synthesis)
Total time: ~8-12 seconds
```

#### Quality-Optimized Pipeline
```
Stage 1: deepseek-r1:7b (deep reasoning)
Stage 2: llama3.2:8b (thorough analysis)
Stage 3: qwen2.5-coder:7b (detailed synthesis)
Total time: ~30-60 seconds
```

#### Specialized Pipeline
```
Stage 1: deepseek-r1:1.5b (research)
Stage 2: llama3.2 (general analysis)
Stage 3: codellama (code generation)
Use case: Technical content creation
```

---

### Environment Variables

Configure Ollama behavior:

```bash
# Set GPU usage (if available)
export OLLAMA_GPU_LAYERS=35

# Set context window size
export OLLAMA_NUM_CTX=4096

# Set concurrent requests
export OLLAMA_NUM_PARALLEL=2

# Restart Ollama to apply
ollama serve
```

---

### Performance Monitoring

Track Ollama performance:

```bash
# Monitor in real-time
watch -n 1 'curl -s http://localhost:11434/api/tags | jq'

# Log all requests
tail -f ~/Library/Logs/Ollama/server.log

# Check model load times
time ollama run deepseek-r1:1.5b "test" --verbose
```

---

### Integration with Reasoning Engine

#### Timed Reading of Ollama Output

```javascript
async function ollamaToIVC(prompt, model = 'llama3.2') {
  // Generate content
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });

  const data = await response.json();

  // Feed to Reasoning Engine
  const session = window.ReasoningEngine.startSession({
    text: data.response,
    mode: 'normal',
    requireScroll: true,
    minReadTime: data.response.split(' ').length * 150, // 150ms per word
    onComplete: (s) => {
      console.log('User comprehended Ollama output after', s.endTime - s.startTime, 'ms');
    }
  });

  await window.ReasoningEngine.renderAnimation('reasoning-container');

  return session;
}

// Usage
ollamaToIVC('Explain temporal experience engines', 'llama3.2');
```

This creates the **core IVC mechanic**:
1. Ollama generates content
2. User must experience it at timed pace
3. Comprehension is tracked
4. Prevents premature judgment

---

## Testing Checklist

```
SETUP:
□ Ollama installed
□ Service running on port 11434
□ 3+ models installed (deepseek, llama, qwen)

CONNECTION TESTS:
□ /api/tags returns model list
□ /api/generate works from console
□ No CORS errors

PIPELINE TESTS:
□ Single-stage pipeline completes
□ 3-stage pipeline completes
□ Domain context injected
□ Timing < 20 seconds total

INTEGRATION TESTS:
□ Pipeline → Soul Capsule works
□ Capsule → Story Compiler works
□ Voice → Reasoning Engine works
□ Review → Story works

ADVANCED TESTS:
□ Multi-model pipelines
□ Custom model configurations
□ Performance monitoring
□ IVC + Ollama integration
```

---

## Next Steps

After completing Ollama testing:

1. **Read**: `/docs/PUNCH_TEST.md` - Verify all systems work
2. **Read**: `/docs/ROUTING_GUIDE.md` - Understand domain routing
3. **Deploy**: Test on production URLs (GitHub Pages)
4. **Scale**: Try larger models for quality improvements

---

## API Reference

### Ollama Endpoints Used

```
GET  http://localhost:11434/api/tags          # List models
GET  http://localhost:11434/api/version       # Get version
POST http://localhost:11434/api/generate      # Generate text
POST http://localhost:11434/api/chat          # Chat completion
GET  http://localhost:11434/api/show          # Model details
```

### JavaScript Integration Pattern

```javascript
async function callOllama(model, prompt, stream = false) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream })
  });

  if (!stream) {
    const data = await response.json();
    return data.response;
  } else {
    // Handle streaming response
    const reader = response.body.getReader();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      const json = JSON.parse(text);
      result += json.response;
    }

    return result;
  }
}
```

---

**Last Updated**: 2026-01-12
**Ollama Version**: 0.1.x+
**Tested Models**: deepseek-r1:1.5b, llama3.2, qwen2.5-coder:3b
**Maintained by**: Soulfra Infrastructure Team
