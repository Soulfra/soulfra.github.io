# DeathToData Ollama Agent

**What it does:** Teaches Ollama to search DeathToData and analyze results for you.

---

## Quick Start

### 1. Restart Backend (to serve HTML files)

```bash
# Kill old backend
lsof -ti:5051 | xargs kill -9

# Start new backend
cd /Users/matthewmauer/Desktop/soulfra.github.io
node api/deathtodata-backend.js
```

### 2. Test DeathToData in Browser

```
http://localhost:5051/index.html
http://localhost:5051/search.html
```

Search should work now!

### 3. Run the Ollama Agent

```bash
# Simple search
python3 ollama-search-agent.py privacy

# Multi-word search
python3 ollama-search-agent.py "privacy tools"
python3 ollama-search-agent.py "encrypted messaging apps"
```

---

## What the Agent Does

**Workflow:**
```
1. You ask: "privacy tools"
2. Agent searches DeathToData API
3. Agent gets 10 results
4. Agent sends results to Ollama (llama3.2)
5. Ollama analyzes and summarizes
6. You get smart answer + recommendations
```

**Example Output:**
```
🔍 Searching DeathToData for: privacy tools

📊 Found 10 results

🤖 Asking Ollama to analyze...

💬 Ollama's Analysis:
Based on the search results, here's a summary:

1. Summary: The results focus on privacy-focused tools and services...

2. Top 3 Findings:
   - DuckDuckGo: Privacy-first search engine
   - Signal: Encrypted messaging app
   - ProtonMail: Encrypted email service

3. Recommendation: If you're looking for privacy tools, start with...
```

---

## How It Works (The Code)

```python
# Tool 1: Search API
def search_deathtodata(query):
    response = requests.get(f'http://localhost:5051/api/search?q={query}')
    return response.json()

# Tool 2: Ask Ollama
def ask_ollama(prompt):
    response = requests.post('http://localhost:11434/api/generate', json={
        'model': 'llama3.2',
        'prompt': prompt
    })
    return response.json()['response']

# Workflow: Search → Summarize → Answer
def agent_search(query):
    results = search_deathtodata(query)  # Call API
    summary = format_results(results)     # Format data
    answer = ask_ollama(summary)          # Ask Ollama
    print(answer)                         # Show result
```

**That's it.** Just API calls + text formatting + Ollama.

---

## Using Different Ollama Models

You have 24 models installed! Try different ones:

```bash
# Use llama2 instead
# Edit ollama-search-agent.py line 26:
model='llama2'

# Or use your custom models:
model='deathtodata-model'    # Your custom model!
model='business-discovery'
model='mistral:7b'
model='codellama:7b'
```

---

## Next Steps

### Option A: Save Search History

Add this to the agent:
```python
import sqlite3

def save_search(query, results):
    db = sqlite3.connect('search_history.db')
    db.execute('CREATE TABLE IF NOT EXISTS searches (query, results, date)')
    db.execute('INSERT INTO searches VALUES (?, ?, ?)',
               (query, json.dumps(results), datetime.now()))
    db.commit()
```

### Option B: Chat Interface

Make it conversational:
```bash
You: Search for privacy tools
Agent: [searches] Found 10 results. Want me to summarize?
You: Yes, show top 3
Agent: [Ollama analyzes] Here are the top 3...
You: Save these
Agent: [saves to SQLite] Saved 3 results.
```

### Option C: Web UI

Create a simple web interface:
```python
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/search', methods=['POST'])
def search():
    query = request.form['query']
    results = agent_search(query)
    return render_template('results.html', results=results)
```

Visit http://localhost:8080 → Chat with Ollama about searches.

---

## Why This Matters

**You just built what companies call:**
- "AI Agent" ✅
- "RAG (Retrieval Augmented Generation)" ✅
- "LLM-powered search" ✅
- "Intelligent assistant" ✅

**But it's really just:**
- API call (`requests.get()`)
- Text formatting (f-strings)
- Another API call (`ollama.generate()`)

**ALL the buzzwords are just workflows + SQL + API calls.**

You're right. It's not magic.

---

## Troubleshooting

**Error: Connection refused (port 5051)**
```bash
# Backend not running. Start it:
node api/deathtodata-backend.js
```

**Error: Connection refused (port 11434)**
```bash
# Ollama not running. Start it:
ollama serve
```

**Error: Model not found**
```bash
# Check installed models:
ollama list

# Download model if needed:
ollama pull llama3.2
```

**Agent runs but no results**
```bash
# Test API manually:
curl "http://localhost:5051/api/search?q=test"

# Should return JSON results
```

---

**Now go test it!**

```bash
python3 ollama-search-agent.py privacy
```
