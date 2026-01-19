# DeathToData Knowledge Base System

**What it does:** Uses Ollama to learn and remember things, building institutional knowledge that persists in your database.

---

## The Three Tools

### 1. **ollama-search-agent.py** - Learn from the Web
Searches DeathToData, gets Ollama analysis, **saves to database**.

```bash
python3 ollama-search-agent.py "VPS deployment"
python3 ollama-search-agent.py "encrypted messaging"
```

**What happens:**
- Searches DuckDuckGo
- Ollama analyzes results
- Analysis saved to SQLite
- You can query it later

---

### 2. **audit-infrastructure.py** - Learn About Your Own Code
Searches your codebase for configs, asks Ollama to find issues, **saves findings to database**.

```bash
# Audit API configurations
python3 audit-infrastructure.py api

# Audit domain configurations
python3 audit-infrastructure.py domains

# Run all audits
python3 audit-infrastructure.py
```

**What it finds:**
- API URLs (localhost, production URLs)
- Port numbers (5051, 11434, etc.)
- Domain references (deathtodata.com, soulfra.com)
- Configuration mismatches

**Ollama analyzes and identifies:**
- Hardcoded URLs that won't work in production
- Disconnects between frontend/backend
- Security issues
- Recommendations to fix

---

### 3. **query-knowledge.py** - Query Everything You've Learned
Retrieves stored analyses and audits from database.

```bash
# Show summary of all knowledge
python3 query-knowledge.py

# List all analyses
python3 query-knowledge.py list

# List all audits
python3 query-knowledge.py audits

# Show specific analysis
python3 query-knowledge.py show 51

# Show specific audit
python3 query-knowledge.py audit 12

# Search for topic
python3 query-knowledge.py search "VPS"

# Interactive Q&A mode
python3 query-knowledge.py ask
```

**Interactive Mode Example:**
```
❓ Question: How do I deploy to a VPS?
🤖 Consulting knowledge base...
💬 Answer: Based on previous learning about VPS deployment...
```

---

## How It Works (The Technical Reality)

**Not magic. Just workflows + SQL + API calls.**

```python
# 1. Search web
results = requests.get('http://localhost:5051/api/search?q=privacy')

# 2. Ask Ollama to analyze
analysis = requests.post('http://localhost:11434/api/generate', json={
    'model': 'llama3.2',
    'prompt': f'Analyze: {results}'
})

# 3. Save to database
db.execute('''
    INSERT INTO analytics_events (event_type, metadata)
    VALUES ('ollama_analysis', ?)
''', json.dumps({'query': 'privacy', 'summary': analysis}))

# 4. Query later
db.execute("SELECT * FROM analytics_events WHERE event_type='ollama_analysis'")
```

**That's it.**

All the "AI Agent" buzzwords = this 10-line workflow.

---

## What's Stored in the Database

### Table: `analytics_events`

**event_type: `ollama_analysis`**
```json
{
  "query": "VPS deployment",
  "result_count": 10,
  "ollama_summary": "VPS deployment involves...",
  "top_sources": ["https://...", "https://..."],
  "timestamp": "2026-01-18T13:58:17"
}
```

**event_type: `infrastructure_audit`**
```json
{
  "audit_type": "api_configuration",
  "findings": {
    "api_urls": [...],
    "ports": ["5051", "11434"]
  },
  "ollama_analysis": "Hardcoded localhost URLs won't work in production...",
  "timestamp": "2026-01-18T14:00:00"
}
```

---

## Example Workflow

### Day 1: Learn About Privacy Tools
```bash
python3 ollama-search-agent.py "privacy tools"
python3 ollama-search-agent.py "encrypted messaging"
python3 ollama-search-agent.py "VPN services"
```

### Day 7: What Did I Learn Last Week?
```bash
python3 query-knowledge.py search "privacy"
# Shows all 3 analyses about privacy
```

### Day 30: Audit Your Infrastructure
```bash
python3 audit-infrastructure.py
# Finds all API URLs, ports, domains
# Ollama identifies issues
# Saves to database
```

### Day 31: Fix Issues Found in Audit
```bash
python3 query-knowledge.py audits
# Shows audit findings
python3 query-knowledge.py audit 15
# See detailed recommendations
```

---

## Database Queries (Direct Access)

```bash
# See all Ollama analyses
sqlite3 deathtodata.db "SELECT * FROM analytics_events WHERE event_type='ollama_analysis'"

# See all audits
sqlite3 deathtodata.db "SELECT * FROM analytics_events WHERE event_type='infrastructure_audit'"

# Search for specific topic
sqlite3 deathtodata.db "SELECT * FROM analytics_events WHERE metadata LIKE '%VPS%'"

# Count total knowledge
sqlite3 deathtodata.db "SELECT event_type, COUNT(*) FROM analytics_events WHERE event_type IN ('ollama_analysis', 'infrastructure_audit') GROUP BY event_type"
```

---

## Why This Matters

### Before:
- Search something → learn it → forget it
- Fix bug → forget what you fixed
- Run audit → lose findings

### After:
- Search → learn → **store in database**
- Fix bug → **store solution**
- Run audit → **store findings**
- Query anytime: "What did I learn about X?"

**You're building institutional knowledge that persists.**

Like a second brain, but it's actually just SQLite + Ollama.

---

## What You Can Build Next

### Option A: Auto-Audit on Commit
```bash
# Git hook: Run audit before every commit
.git/hooks/pre-commit:
  python3 audit-infrastructure.py
  # Blocks commit if issues found
```

### Option B: Daily Learning Digest
```bash
# Cron job: Email yourself what you learned today
0 18 * * * python3 query-knowledge.py list | mail -s "Today's Learning" you@email.com
```

### Option C: Web Dashboard
```python
# Flask app showing all knowledge
@app.route('/knowledge')
def knowledge():
    analyses = query_all_analyses()
    audits = query_all_audits()
    return render_template('knowledge.html', analyses=analyses, audits=audits)
```

---

## The Core Insight

**AI Agents = Workflows + SQL + API Calls**

This knowledge base is:
- `requests.get()` - search API
- `requests.post()` - Ollama API
- `db.execute()` - SQLite
- `json.dumps()` - data formatting

No magic. Just persistence.

---

## Testing It Now

```bash
# 1. Search and learn
python3 ollama-search-agent.py "self-hosting web apps"

# 2. See it in database
python3 query-knowledge.py

# 3. Query it
python3 query-knowledge.py show 51

# 4. Search your knowledge
python3 query-knowledge.py search "hosting"

# 5. Ask questions
python3 query-knowledge.py ask
> How do I host web apps?
```

**You now have a self-documenting system that learns and remembers.**

---

## Files Created

- `ollama-search-agent.py` - Enhanced with database storage
- `audit-infrastructure.py` - NEW - Audits your codebase
- `query-knowledge.py` - NEW - Queries stored knowledge
- `deathtodata.db` - Stores everything (SQLite)

All working locally. No external dependencies except Ollama.
