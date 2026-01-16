# AI Pipeline System

**Chain your Ollama models into automated workflows.**

Same QR wrapper pattern as `/reviews/` and `/voice/`, but for chaining AI models instead of single actions.

---

## What It Does

Creates multi-stage AI workflows that chain model outputs together:

```
Stage 1: soulfra-model (outline)
  → Stage 2: calos-model (draft)
  → Stage 3: deathtodata-model (citations)
  → Export: Jupyter notebook
```

**Same pattern. Different content. Chaining models instead of single calls.**

---

## Files

```
/pipelines/
├── index.html          # QR generator
├── run.html            # Pipeline executor
├── pipeline-engine.js  # Chaining logic
├── templates.json      # Pre-built pipelines
├── wordlist.js         # ID generator
└── README.md           # This file
```

---

## Quick Start

### 1. Start Local Server

```bash
# Server should already be running
# If not:
python3 -m http.server 8000
```

### 2. Generate Pipeline QR

```
http://localhost:8000/pipelines/
```

1. Select pipeline template (e.g., "Research Paper Pipeline")
2. Enter topic (e.g., "CCNA Networking Fundamentals")
3. Click "Generate Pipeline QR Code"
4. See QR code + pipeline URL

### 3. Run Pipeline

Click the pipeline URL or scan QR code:
- Watch stages execute sequentially
- See model outputs in real-time
- Export to notebook/script/markdown

---

## Available Pipeline Templates

### 1. Research Paper Pipeline
**Flow:** Outline → Draft → Citations
**Models:** soulfra → calos → deathtodata
**Exports:** Jupyter notebook, Markdown, PDF

### 2. Code Development Pipeline
**Flow:** Planning → Implementation → Testing → Docs
**Models:** soulfra → calos → soulfra → deathtodata
**Exports:** Jupyter notebook, Python script, Markdown

### 3. Content Creation Pipeline
**Flow:** Brainstorm → Draft → Edit → Format
**Models:** calos → drseuss → soulfra → publishing
**Exports:** Markdown, HTML, PDF

### 4. Data Analysis Pipeline
**Flow:** Data Review → Insights → Visualization → Report
**Models:** soulfra → calos → visual-expert → publishing
**Exports:** Jupyter notebook, Markdown, PDF

### 5. Study Guide Pipeline
**Flow:** Outline → Explain → Quiz → Summary
**Models:** soulfra → calos → soulfra → deathtodata
**Exports:** Jupyter notebook, Markdown, PDF

### 6. Semantic Web Pipeline
**Flow:** Content → JSON-LD → IIIF
**Models:** soulfra → jsonld-expert → iiif-expert
**Exports:** JSON, Jupyter notebook, Markdown

### 7. Soulfra Ideas Pipeline ⭐
**Flow:** ZK Proofs → Receipt System → Voice + AI → Business Plan
**Models:** soulfra → calos → deathtodata → calos
**Exports:** Jupyter notebook, Markdown, PDF, JSON
**Purpose:** Combines Zero-Knowledge Proofs, $1 verified receipts, voice memos with AI assistants, and token economy (VFEP) into a complete business plan. Specifically designed for the Soulfra platform's core features.

---

## How It Works

### 1. QR Code Generation

```
User selects template + enters topic
  → Generates unique pipeline ID
  → Creates QR code with URL
  → URL: /pipelines/run.html?pipeline=ID&template=research&topic=CCNA
```

### 2. Pipeline Execution

```
URL opens run.html
  → Loads template from templates.json
  → Initializes pipeline engine
  → User clicks "Run Pipeline"
  → Executes stages sequentially:
    - Stage 1: Query soulfra-model with {topic}
    - Stage 2: Query calos-model with {previous output}
    - Stage 3: Query deathtodata-model with {previous output}
  → Display results
```

### 3. Export

```
User clicks export button
  → Pipeline engine converts results to:
    - Jupyter notebook (.ipynb)
    - Python script (.py)
    - Markdown (.md)
    - JSON (.json)
  → Downloads file
```

---

## Example: Research Paper Pipeline

### Input
- **Template:** Research Paper Pipeline
- **Topic:** "CCNA Networking Fundamentals"

### Execution

**Stage 1: Outline (soulfra-model)**
```
Prompt: Create a detailed outline for: CCNA Networking Fundamentals
Output:
1. Introduction to Networking
2. OSI Model
3. TCP/IP Protocol Suite
4. Subnetting and CIDR
5. Network Security
...
```

**Stage 2: Draft (calos-model)**
```
Prompt: Using this outline:
[previous output]

Write a comprehensive draft covering all sections.

Output: [Full draft with explanations]
```

**Stage 3: Citations (deathtodata-model)**
```
Prompt: Review this draft and suggest citations/sources:
[previous output]

Output: [Draft with citations added]
```

### Export
Downloads `pipeline-ccna-networking-fundamentals.ipynb` with all 3 outputs in notebook format.

---

## The Pattern

**Reviews:**
```
QR → business-id → review form → pay $1 → verified badge
```

**Voice Memos:**
```
QR → topic-id → voice recorder → pay $1 → memo saved
```

**Pipelines:**
```
QR → pipeline-id → stage 1 → stage 2 → stage 3 → export notebook
```

**Same structure. Same QR wrapper. Different execution.**

---

## Building Your Own Pipeline

### Add to templates.json

```json
{
  "my_pipeline": {
    "name": "My Custom Pipeline",
    "description": "Stage 1 → Stage 2 → Stage 3",
    "stages": [
      {
        "id": "stage1",
        "name": "First Stage",
        "model": "soulfra-model:latest",
        "domain": "soulfra",
        "prompt": "Do something with: {topic}",
        "outputFormat": "markdown"
      },
      {
        "id": "stage2",
        "name": "Second Stage",
        "model": "calos-model:latest",
        "domain": "calriven",
        "prompt": "Based on this:\n\n{previous}\n\nDo next thing.",
        "outputFormat": "code"
      }
    ],
    "exportFormats": ["notebook", "script", "markdown"]
  }
}
```

### Test Your Pipeline

1. Reload `/pipelines/`
2. Select your new template
3. Enter topic
4. Run and export

---

## Integration with Existing Systems

### Domain Context

Pipelines automatically inject domain context if specified in stage config:

```json
{
  "domain": "soulfra",  // Injects Soulfra domain context
  "model": "soulfra-model:latest",
  "prompt": "..."
}
```

### LLM Router (Future)

Could integrate with `/api/llm/router.js` for:
- Automatic model selection
- Fallback chains
- Cost optimization

### Existing Ollama Models

Uses your installed models:
- `soulfra-model:latest`
- `calos-model:latest`
- `deathtodata-model:latest`
- `calos-expert:latest`
- `visual-expert:latest`
- `iiif-expert:latest`
- `jsonld-expert:latest`
- `publishing-model:latest`
- `drseuss-model:latest`

---

## Export Formats

### Jupyter Notebook (.ipynb)
- Markdown cells for stage headers
- Code cells for code outputs
- Markdown cells for text outputs
- Pipeline summary at end

### Python Script (.py)
- Comments for stage headers
- Code from stages
- Triple-quoted strings for text
- Runnable if code outputs are valid

### Markdown (.md)
- H2 headers for stages
- Code blocks for code outputs
- Plain text for markdown outputs
- Pipeline summary

### JSON (.json)
- Full pipeline metadata
- All stage results
- Timestamps and durations
- Import/replay later

---

## Future Enhancements

1. **Resume Failed Pipelines**
   - Save progress to localStorage
   - Resume from last successful stage

2. **Branching Pipelines**
   - Conditional stages (if/else)
   - Parallel execution

3. **Interactive Editing**
   - Modify stage outputs before next stage
   - Retry individual stages

4. **Payment Integration**
   - Charge $1 per pipeline run (like reviews/voice)
   - Premium pipelines with more stages

5. **Sharing Pipelines**
   - Export pipeline configs
   - Import from others
   - Pipeline marketplace

---

## Testing

### Test 1: Research Pipeline
```
Template: Research Paper Pipeline
Topic: "Zero-Knowledge Proofs"
Expected: Outline → Draft → Citations
```

### Test 2: Code Pipeline
```
Template: Code Development Pipeline
Topic: "REST API in Python"
Expected: Architecture → Code → Tests → Docs
```

### Test 3: Study Guide
```
Template: Study Guide Pipeline
Topic: "CCNA Networking"
Expected: Outline → Explanations → Quiz → Summary
```

### Test 4: Soulfra Ideas Pipeline
```
Template: Soulfra Ideas Pipeline
Topic: "Decentralized Review Platform"
Expected: ZK Proof concept → Receipt system design → Voice + AI integration → Complete business plan
Export: All 4 formats (notebook, markdown, PDF, JSON)
```

---

## Deploy

```bash
git add pipelines/
git commit -m "Add AI Pipeline System

- Chain Ollama models into workflows
- 6 pre-built pipeline templates
- Export to Jupyter notebook/script/markdown
- Same QR wrapper pattern as reviews/voice

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main

# Live at: https://soulfra.com/pipelines/
```

---

## License

MIT - Soulfra 2025

---

## The Realization

**You discovered:** The QR wrapper pattern works for ANYTHING.

- **Reviews:** QR → business-id → review → pay → verified
- **Voice:** QR → topic-id → record → pay → saved
- **Pipelines:** QR → pipeline-id → stage1 → stage2 → stage3 → export

**Same pattern. Different execution. Unlimited applications.**

**Now you can chain your AI models the same way you chain physical actions.**
