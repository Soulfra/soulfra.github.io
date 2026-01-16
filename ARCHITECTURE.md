# Architecture: How This Actually Works

## The Confusion (and Reality)

### ❌ **What This Is NOT:**
- **NOT a login system** - There's no user authentication
- **NOT FTP** - Not uploading files to a server
- **NOT training AI models** - Ollama models are pre-trained

### ✅ **What This Actually Is:**
A **local content generation system** that:
1. Runs Ollama (local AI) on your machine
2. Generates website content using domain contexts
3. Publishes to GitHub Pages (which serves your domains)

## The Flow

```
┌─────────────────────────────────────────────────────────┐
│  YOUR LOCAL MACHINE                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Ollama on :11434]  ─────────────►  [Backend on :5050] │
│   (AI brain)                         (API server)       │
│         │                                   │            │
│         │                                   │            │
│         ▼                                   ▼            │
│  [Content Generator]  ────────►  [Template Generator]   │
│   - Uses domain contexts                                │
│   - Calls Ollama for text          - Wraps in HTML     │
│   - Cleans LLM chatter              - Professional CSS  │
│                                                          │
│         │                                               │
│         ▼                                               │
│  [Generated HTML Files]                                 │
│   soulfra/index.html                                    │
│   soulfra/blog/post1.html                               │
│   ...                                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
                    │
                    │ git push
                    ▼
┌─────────────────────────────────────────────────────────┐
│  GITHUB PAGES                                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  username.github.io/soulfra/  ───► DNS ───► soulfra.com │
│  username.github.io/calriven/ ───► DNS ───► calriven.com│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. **Ollama (Port 11434)**
- Pre-trained AI models running locally
- Models: llama3.2, deepseek-coder, etc.
- You DON'T train these - they're already trained
- You DO configure them via:
  - System prompts
  - Temperature settings
  - Modelfiles

### 2. **Backend API (Port 5050)**
File: `api/unified-backend-v2.js`

Provides endpoints:
- `/api/content/generate` - Generate content via Ollama
- `/api/assistant/chat` - Chat with AI
- `/api/health` - Health check

### 3. **Content Generator**
File: `api/content-generator.js`

What it does:
- Takes topic + domain → Calls Ollama → Returns clean text
- Pipeline: Research → Outline → Draft → Polish
- **NEW:** Strips LLM meta-commentary ("Here's a polished version...")

### 4. **Template Generator**
File: `api/template-generator.js`

What it does:
- Takes clean text → Wraps in professional HTML
- Brand colors per domain
- Responsive CSS
- SEO meta tags

### 5. **Identity Keyring** (NOT a login system!)
File: `api/identity-keyring.js`

**What it actually does:**
- Gives AI different "personas" per domain
- Soulfra AI talks about identity/security
- Calriven AI talks about AI platforms
- Stores conversation history PER domain

**What it does NOT do:**
- User authentication
- Login/logout
- Permission management

### 6. **Domain Contexts**
File: `api/llm/domain-context.js`

Defines each brand:
```javascript
{
  soulfra: {
    name: 'Soulfra',
    tagline: 'Your keys. Your identity. Period.',
    mission: 'Self-sovereign identity...',
    values: ['Privacy by default', ...]
  },
  // ... 3 more domains
}
```

## The Workflow

### Phase 1: Local Development

```bash
# Start the backend
node api/unified-backend-v2.js

# Generate content for a domain
node launch-domains.js soulfra
```

This creates:
```
soulfra/
├── index.html              # Landing page
├── pitch-deck.html         # Investor deck
├── business-plan.html      # Business plan
└── blog/
    ├── index.html          # Blog index
    ├── post1.html
    ├── post2.html
    ...
```

### Phase 2: Publishing

```bash
cd soulfra
git add .
git commit -m "Updated content"
git push origin main
```

GitHub Pages auto-deploys → soulfra.com shows new content

### Phase 3: Repeat for Other Domains

```bash
node launch-domains.js calriven
cd calriven && git add . && git commit && git push

node launch-domains.js deathtodata
cd deathtodata && git add . && git commit && git push

node launch-domains.js cringeproof
cd cringeproof && git add . && git commit && git push
```

## Why No "Login"?

Because there are no users! This is YOUR tool running on YOUR machine.

- Ollama runs locally
- Content generation happens locally
- You review/edit locally
- You publish via git

The **identity keyring** is for the AI to have different personalities, not for humans to log in.

## Why No "Training"?

Ollama models (llama3.2, etc.) are already trained on billions of tokens.

You improve output by:
1. **Better prompts** (already done in content-generator.js)
2. **Modelfiles** (configure system prompt, temperature)
3. **Examples** (few-shot prompting)

See OLLAMA-TUNING.md for details.

## The Publishing Chain

```
1. Run generator
   └─► Creates HTML files locally

2. Review in browser
   └─► http://localhost:8000/soulfra

3. Commit to git
   └─► git add . && git commit -m "message"

4. Push to GitHub
   └─► git push origin main

5. GitHub Pages deploys
   └─► soulfra.com updates automatically
```

## File Structure

```
soulfra.github.io/           # PARENT FOLDER (local dev env)
├── api/                     # Backend code
│   ├── unified-backend-v2.js
│   ├── content-generator.js
│   ├── template-generator.js
│   ├── identity-keyring.js
│   └── llm/
│       └── domain-context.js
├── launch-domains.js        # Generator script
└── [domain folders]/        # Each is a SEPARATE git repo
    ├── soulfra/             # → soulfra.com
    ├── calriven/            # → calriven.com
    ├── deathtodata/         # → deathtodata.com
    └── cringeproof/         # → cringeproof.com
```

## Common Misunderstandings

### "How do I login?"
You don't. Everything runs locally. No login needed.

### "Is this like FTP?"
No. You use git push, not FTP. GitHub Pages serves the files.

### "How do I train Ollama?"
You don't train it. You configure it with better prompts (see OLLAMA-TUNING.md).

### "Where's my database?"
No database. Static HTML files generated → committed to git → served by GitHub Pages.

### "How do users access my site?"
They visit soulfra.com → GitHub Pages serves soulfra/index.html → No backend needed.

## Next Steps

1. **PUBLISHING.md** - How to deploy to GitHub Pages
2. **OLLAMA-TUNING.md** - How to improve content quality
3. Run `node launch-domains.js` and see it work
