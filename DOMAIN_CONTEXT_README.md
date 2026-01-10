# 🌐 Domain Context System

**Inject domain-specific knowledge into AI models to prevent hallucinations**

---

## Problem Solved

The AI models were hallucinating domain knowledge:
- **Calos** thought: Soulfra = RuneScape account, Calriven = XP calculator
- **Soulfra** thought: Everything is decentralized identity systems
- **DeathToData** thought: Everything is software tools

**Solution:** Inject correct domain definitions as system prompts before each query.

---

## Domains

### 1. 🔐 Soulfra
- **Tagline:** "Your keys. Your identity. Period."
- **Category:** Identity & Security
- **Focus:** Self-sovereign identity, zero-knowledge proofs, decentralized auth
- **Technologies:** Web3 wallets, DIDs, verifiable credentials, ZK-SNARKs

### 2. 🤖 Calriven
- **Tagline:** "Best AI for the job. Every time."
- **Category:** AI Platform
- **Focus:** LLM routing, model selection, AI orchestration
- **Technologies:** Ollama, OpenRouter, intent classification, ensembles

### 3. 🔍 DeathToData
- **Tagline:** "Search without surveillance. Deal with it, Google."
- **Category:** Privacy Search
- **Focus:** Anonymous search, no tracking, encrypted queries
- **Technologies:** Tor, VPN-friendly, zero-log, proxy-based

### 4. 📊 CringeProof
- **Tagline:** "Will Your Takes Age Well?"
- **Category:** Prediction Market
- **Focus:** Time-locked predictions, reputation tokens, accountability
- **Technologies:** Smart contracts, IPFS, blockchain timestamps

---

## Quick Start

### 1. Open Chatbox
```bash
# Server is already running at:
http://localhost:8000/pages/chat/chatbox.html
```

### 2. Select Domain Context

In the chatbox header, you'll see two dropdowns:
- **Model Mode** (far left): Single, Ensemble, Calos, Soulfra, DeathToData
- **Domain Context** (middle): Soulfra, Calriven, DeathToData, CringeProof, None

### 3. Test Domain Context

**Test 1: Soulfra Context**
1. Set Domain to: 🔐 Soulfra (Identity)
2. Set Mode to: Ensemble (All 3)
3. Ask: "What is Soulfra?"
4. Expected: Models explain self-sovereign identity, zero-knowledge proofs, Web3

**Test 2: Calriven Context**
1. Set Domain to: 🤖 Calriven (AI Platform)
2. Set Mode to: Ensemble (All 3)
3. Ask: "What is Calriven?"
4. Expected: Models explain AI routing, model selection, LLM orchestration

**Test 3: DeathToData Context**
1. Set Domain to: 🔍 DeathToData (Search)
2. Set Mode to: Ensemble (All 3)
3. Ask: "What is DeathToData?"
4. Expected: Models explain privacy search, no tracking, anonymous queries

**Test 4: No Context (Baseline)**
1. Set Domain to: 🌐 No Domain Context
2. Set Mode to: Ensemble (All 3)
3. Ask: "What is Soulfra?"
4. Expected: Models hallucinate or give generic answers

---

## How It Works

### 1. Domain Context Injection

When you select a domain, the system:
1. Loads domain definition from `domain-context.js`
2. Generates a system prompt with mission, focus areas, technologies
3. Prepends system prompt to every user query
4. Models receive full context before answering

**Example System Prompt (Soulfra):**
```
You are an AI assistant for Soulfra (https://soulfra.com).

**Soulfra**: Your keys. Your identity. Period.
**Category**: Identity & Security

**Mission**: Self-sovereign identity and zero-knowledge authentication.
We believe your identity belongs to you—not corporations, not governments,
not anyone else.

**Core Focus Areas**:
- Self-sovereign identity (SSI)
- Zero-knowledge proofs
- Decentralized authentication
- Public key infrastructure (PKI)
...

User: What is Soulfra?
Assistant: [Models now have correct context!]
```

### 2. Integration with LLM Router

The LLM Router supports domain context in:
- `queryEnsemble(query, { domain, injectContext })`
- `route(query, { intent, domain, injectContext })`
- `queryModel(model, query, { domain, injectContext })`

All queries automatically inject domain context if provided.

### 3. UI Integration

The chatbox has:
- Domain selector dropdown (top-right area)
- Domain status indicator ("Domain: Soulfra")
- System message when switching domains
- Automatic context injection for all modes (ensemble, individual models)

---

## API Reference

### DomainContext Class

```javascript
// Get context for a domain
const context = DomainContext.getContext('soulfra');
// Returns: { name, tagline, category, mission, focus, technologies, values, useCases }

// Get system prompt
const systemPrompt = DomainContext.getSystemPrompt('calriven');
// Returns: Full system prompt string with domain knowledge

// Inject context into query
const injected = DomainContext.injectContext('What is Calriven?', 'calriven');
// Returns: { system: "...", user: "...", fullPrompt: "..." }

// Auto-detect domain from URL
const domain = DomainContext.detectCurrentDomain();
// Returns: 'soulfra' | 'calriven' | 'deathtodata' | 'cringeproof'

// Search domains by keyword
const results = DomainContext.searchDomains('privacy');
// Returns: [{ domain, name, tagline, category, relevance }]

// Compare domains
const comparison = DomainContext.compareDomains('soulfra', 'cringeproof');
// Returns: Side-by-side comparison with cross-references

// Get all domains
const domains = DomainContext.getAllDomains();
// Returns: ['soulfra', 'calriven', 'deathtodata', 'cringeproof']
```

---

## Testing Guide

### Console Testing

Open browser console at `http://localhost:8000/pages/chat/chatbox.html`:

```javascript
// Test 1: Check DomainContext loaded
console.log(DomainContext);
// Should show DomainContext instance

// Test 2: Get Soulfra context
const soulfra = DomainContext.getContext('soulfra');
console.log(soulfra.name, soulfra.tagline);
// Output: "Soulfra" "Your keys. Your identity. Period."

// Test 3: Get system prompt
const prompt = DomainContext.getSystemPrompt('calriven');
console.log(prompt);
// Output: Full system prompt for Calriven

// Test 4: Search domains
const results = DomainContext.searchDomains('AI');
console.log(results);
// Output: [{ domain: 'calriven', ... }]

// Test 5: Detect domain from URL
const domain = DomainContext.detectDomainFromURL('https://soulfra.github.io/calriven');
console.log(domain);
// Output: "calriven"

// Test 6: Ensemble with domain context
const result = await llmRouter.queryEnsemble(
  'What is zero-knowledge proof?',
  { domain: 'soulfra', injectContext: true }
);
console.log(result.response);
// Output: Response with Soulfra context injected
```

### Chat Testing

**Test Scenario 1: Identity Questions**
- Domain: Soulfra
- Mode: Ensemble
- Questions:
  1. "What is self-sovereign identity?"
  2. "How do zero-knowledge proofs work?"
  3. "What's the difference between Soulfra and traditional login?"

**Test Scenario 2: AI Platform Questions**
- Domain: Calriven
- Mode: Ensemble
- Questions:
  1. "How does AI routing work?"
  2. "When should I use ensemble vs single model?"
  3. "What models does Calriven support?"

**Test Scenario 3: Privacy Questions**
- Domain: DeathToData
- Mode: Ensemble
- Questions:
  1. "How is DeathToData different from Google?"
  2. "What privacy features does DeathToData have?"
  3. "Can I search anonymously?"

**Test Scenario 4: Prediction Questions**
- Domain: CringeProof
- Mode: Ensemble
- Questions:
  1. "How do time-locked predictions work?"
  2. "What happens if my prediction is wrong?"
  3. "How are reputation tokens calculated?"

---

## Verification

After domain context injection, verify:

1. **Console Output:**
   - Look for: `🌐 Injected [domain] context into query`
   - Check: System prompt logged to console

2. **Response Quality:**
   - Models mention domain-specific concepts
   - No hallucinations about unrelated topics
   - Responses align with domain mission/values

3. **Cross-Domain References:**
   - Models suggest other domains when appropriate
   - Example: "For anonymous login, check out Soulfra"

---

## Next Steps

Now that domain context is working:

1. **Build Content Generator** (`api/content/generator.js`)
   - Take ensemble chat responses
   - Generate articles for each domain
   - Extract key concepts and explanations

2. **Build Voice Generator** (`api/voice/generator.js`)
   - Convert articles to podcast scripts
   - Add voice-over using text-to-speech
   - Generate audio files

3. **Build Content Studio** (`pages/content/studio.html`)
   - UI for content generation
   - Preview articles and podcasts
   - One-click deploy to all domains

4. **Test Full Pipeline:**
   - Chat → Ensemble → Article → Podcast → Deploy

---

## Troubleshooting

### Issue: Domain context not injecting

**Solution:**
1. Check console for: `🌐 Injected [domain] context into query`
2. Verify DomainContext is loaded: `console.log(DomainContext)`
3. Check domain selector value: `document.getElementById('domainContextSelect').value`
4. Ensure domain is not set to 'none'

### Issue: Models still hallucinating

**Solution:**
1. Verify system prompt is correct: `DomainContext.getSystemPrompt('soulfra')`
2. Check that injectContext is true in query options
3. Test with "none" domain to confirm baseline behavior
4. Models may need to "warm up" - try 2-3 queries

### Issue: Domain selector not visible

**Solution:**
1. Check browser width (may be off-screen on narrow displays)
2. Inspect element: `document.getElementById('domainContextSelect')`
3. Check CSS positioning: `right: 32rem`

---

## Architecture

```
User Query
    ↓
Domain Selector (UI)
    ↓
changeDomainContext()
    ↓
currentDomainContext variable
    ↓
LLM Router (queryEnsemble / route)
    ↓
DomainContext.injectContext(query, domain)
    ↓
System Prompt + User Query
    ↓
Ollama Model (calos / soulfra / deathtodata)
    ↓
Response with correct domain knowledge
```

---

## Files

- **`/api/llm/domain-context.js`** - Domain definitions and injection logic
- **`/api/llm/router.js`** - LLM router with domain context support
- **`/pages/chat/chatbox.html`** - Chatbox UI with domain selector

---

## License

MIT - Soulfra 2025
