# 🌐 GitHub-as-Backend - True Decentralization

**Use GitHub itself as your backend.** No servers, no databases, no external services.

---

## 🎯 The Concept

Instead of:
```
Frontend → Node.js backend → PostgreSQL database
```

Use:
```
Frontend → GitHub API → Git repository (data storage)
                      → GitHub Actions (serverless functions)
                      → GitHub Issues (database alternative)
```

**Everything runs on GitHub's infrastructure. 100% free. Truly decentralized.**

---

## ✅ What GitHub Provides (For Free)

### 1. Storage (Git Repository)
- **Data as JSON files** in the repo
- **Writes = commits** to the repo
- **Reads = fetch file from GitHub API**
- Unlimited* storage for public repos

### 2. Compute (GitHub Actions)
- **2,000 minutes/month** free (public repos = unlimited)
- Run workflows on events (push, schedule, webhook)
- Can execute any code (Node.js, Python, etc.)

### 3. Database Alternative (GitHub Issues/Discussions)
- **Issues = database rows**
- Query via GitHub API
- Comment = update record
- Labels = tags/categories
- Unlimited issues

### 4. Authentication (GitHub OAuth)
- Built-in user authentication
- "Login with GitHub" button
- Free OAuth app

### 5. API (github.com/api)
- Full REST API
- GraphQL API
- No rate limits for authenticated requests (5000/hour)

---

## 🏗️ Architecture

### Data Storage

**Instead of PostgreSQL tables:**
```
data/
├── users.json          ← User records
├── sessions.json       ← Active sessions
├── comments.json       ← User comments
├── emails.json         ← Email captures
└── agents/             ← AI agent configs
    ├── agent-1.json
    └── agent-2.json
```

**Writes = Git commits:**
```javascript
// Save user data
async function saveUser(userData) {
  // 1. Fetch current users.json
  const response = await fetch('https://api.github.com/repos/Soulfra/soulfra.github.io/contents/data/users.json');
  const file = await response.json();

  // 2. Decode content
  const users = JSON.parse(atob(file.content));

  // 3. Add new user
  users.push(userData);

  // 4. Commit back to GitHub
  await fetch('https://api.github.com/repos/Soulfra/soulfra.github.io/contents/data/users.json', {
    method: 'PUT',
    headers: {
      'Authorization': 'token YOUR_GITHUB_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Add new user',
      content: btoa(JSON.stringify(users, null, 2)),
      sha: file.sha
    })
  });
}
```

---

## 🔧 Implementation

### 1. Frontend Calls GitHub API

```javascript
// js/github-backend.js
const GITHUB_API = 'https://api.github.com';
const REPO = 'Soulfra/soulfra.github.io';

class GitHubBackend {
  constructor(token) {
    this.token = token;
  }

  async getFile(path) {
    const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`);
    const data = await res.json();
    return JSON.parse(atob(data.content));
  }

  async saveFile(path, data, message) {
    // Get current file to get SHA
    const current = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`);
    const fileData = await current.json();

    // Commit new version
    await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        content: btoa(JSON.stringify(data, null, 2)),
        sha: fileData.sha
      })
    });
  }

  async addUser(username, email) {
    const users = await this.getFile('data/users.json');
    users.push({ username, email, created: new Date().toISOString() });
    await this.saveFile('data/users.json', users, `Add user: ${username}`);
  }

  async getUsers() {
    return await this.getFile('data/users.json');
  }
}
```

### 2. Use GitHub Actions as Backend

**`.github/workflows/process-signups.yml`:**
```yaml
name: Process Email Signups

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:      # Manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Process emails
        run: |
          node scripts/process-emails.js

      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git commit -m "Process email signups" || echo "No changes"
          git push
```

**`scripts/process-emails.js`:**
```javascript
const fs = require('fs');

// Read email captures
const emails = JSON.parse(fs.readFileSync('data/emails.json'));

// Process them (send welcome email, add to users, etc.)
emails.forEach(email => {
  console.log(`Processing: ${email}`);
  // Send to Mailchimp, Sendgrid, etc.
});

// Clear processed emails
fs.writeFileSync('data/emails.json', JSON.stringify([]));
```

---

## 🗄️ GitHub Issues as Database

### Create "Database" via Issues

**Example: Store agent configs**

```javascript
async function createAgent(name, config) {
  await fetch(`${GITHUB_API}/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${this.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Agent: ${name}`,
      body: JSON.stringify(config, null, 2),
      labels: ['agent', 'config']
    })
  });
}

async function getAgents() {
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/issues?labels=agent`);
  const issues = await res.json();

  return issues.map(issue => ({
    name: issue.title.replace('Agent: ', ''),
    config: JSON.parse(issue.body),
    id: issue.number
  }));
}

async function updateAgent(id, newConfig) {
  await fetch(`${GITHUB_API}/repos/${REPO}/issues/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${this.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      body: JSON.stringify(newConfig, null, 2)
    })
  });
}
```

**Why this works:**
- Issues = rows in a database
- Issue number = primary key
- Issue title = identifier
- Issue body = JSON data
- Labels = tags/filters
- Comments = audit log
- Reactions = votes/likes

---

## 🔐 Authentication

### GitHub OAuth

**1. Create OAuth App:**
- Go to https://github.com/settings/developers
- New OAuth App
- Homepage: `https://soulfra.com`
- Callback: `https://soulfra.com/auth/callback`

**2. Add Login Button:**
```html
<button onclick="loginWithGitHub()">
  Login with GitHub
</button>

<script>
const CLIENT_ID = 'your_client_id';

function loginWithGitHub() {
  const redirectUri = 'https://soulfra.com/auth/callback';
  const scope = 'repo';  // Access to repos
  window.location = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
}
</script>
```

**3. Handle Callback:**
```javascript
// auth/callback.html
const code = new URL(window.location).searchParams.get('code');

// Exchange code for token (needs GitHub Actions or backend)
const response = await fetch('https://github.com/login/oauth/access_token', {
  method: 'POST',
  headers: { 'Accept': 'application/json' },
  body: JSON.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,  // Store in GitHub Secrets
    code: code
  })
});

const { access_token } = await response.json();

// Store token
localStorage.setItem('github_token', access_token);

// Redirect to dashboard
window.location = '/dashboard.html';
```

---

## 🤖 Connecting to Local Ollama

### Via GitHub Actions Webhook

**1. Expose localhost via ngrok (when needed):**
```bash
ngrok http 5050
# Get URL: https://abc123.ngrok.app
```

**2. Create GitHub Actions workflow:**

**`.github/workflows/query-ollama.yml`:**
```yaml
name: Query Local Ollama

on:
  issues:
    types: [labeled]

jobs:
  query:
    if: github.event.label.name == 'query-ollama'
    runs-on: ubuntu-latest
    steps:
      - name: Send to local Ollama
        run: |
          curl -X POST ${{ secrets.OLLAMA_WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -d "{\"prompt\":\"${{ github.event.issue.body }}\"}"
```

**3. Your laptop listens for webhook:**
```javascript
// Local webhook server
const express = require('express');
const app = express();

app.post('/webhook', async (req, res) => {
  const { prompt } = req.body;

  // Query local Ollama
  const ollamaRes = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false
    })
  });

  const answer = await ollamaRes.json();

  // Post back to GitHub issue as comment
  await fetch(`https://api.github.com/repos/Soulfra/soulfra.github.io/issues/${req.body.issue_number}/comments`, {
    method: 'POST',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
    body: JSON.stringify({
      body: answer.response
    })
  });

  res.send('OK');
});

app.listen(5050);
```

**Flow:**
```
1. User creates issue with label "query-ollama"
2. GitHub Actions webhook triggers
3. Webhook hits your laptop (via ngrok)
4. Your laptop queries Ollama
5. Posts answer back to GitHub issue
```

---

## 📊 Example Dashboard

```html
<!-- dashboard.html -->
<div class="dashboard">
  <h1>Soulfra Dashboard (GitHub Backend)</h1>

  <!-- User Stats -->
  <div class="stats">
    <div class="stat">
      <span id="user-count">Loading...</span>
      <label>Users</label>
    </div>
    <div class="stat">
      <span id="agent-count">Loading...</span>
      <label>Agents</label>
    </div>
  </div>

  <!-- Create Agent -->
  <div class="create-agent">
    <h2>Create Agent</h2>
    <input type="text" id="agent-name" placeholder="Agent name">
    <textarea id="agent-config" placeholder="Agent config (JSON)"></textarea>
    <button onclick="createAgent()">Create</button>
  </div>

  <!-- Agent List -->
  <div id="agents"></div>
</div>

<script src="/js/github-backend.js"></script>
<script>
const github = new GitHubBackend(localStorage.getItem('github_token'));

async function loadDashboard() {
  // Load users
  const users = await github.getUsers();
  document.getElementById('user-count').textContent = users.length;

  // Load agents (from GitHub Issues)
  const agents = await github.getAgents();
  document.getElementById('agent-count').textContent = agents.length;

  // Display agents
  const agentsList = agents.map(agent => `
    <div class="agent-card">
      <h3>${agent.name}</h3>
      <pre>${JSON.stringify(agent.config, null, 2)}</pre>
    </div>
  `).join('');

  document.getElementById('agents').innerHTML = agentsList;
}

async function createAgent() {
  const name = document.getElementById('agent-name').value;
  const config = JSON.parse(document.getElementById('agent-config').value);

  await github.createAgent(name, config);
  await loadDashboard();
}

loadDashboard();
</script>
```

---

## ⚡ Pros & Cons

### ✅ Advantages

- **100% free** (for public repos)
- **No server management**
- **Built-in version control** (every write is a commit)
- **Audit trail** (git log shows all changes)
- **Collaboration** (pull requests for data changes)
- **OAuth built-in** (GitHub login)
- **Global CDN** (GitHub Pages is fast worldwide)
- **Unlimited issues** (database alternative)
- **GitHub Actions** (2000 min/month compute)

### ❌ Limitations

- **Slow writes** (each write = git commit, ~1-2 seconds)
- **Rate limits** (5000 API calls/hour)
- **No real-time** (can't do live chat, websockets)
- **Public data** (everything is in public repo)*
- **No transactions** (no atomic multi-file updates)
- **File size limits** (100 MB per file)

*Can use private repo, but then you pay for GitHub Pro ($4/mo)

---

## 🎯 Best Use Cases

**Good for:**
- Personal projects
- Low-traffic sites
- Read-heavy workloads
- Static data
- Audit requirements
- Educational projects
- Full transparency needed

**Not good for:**
- High-traffic sites (>5000 requests/hour)
- Real-time applications
- Private data (unless private repo)
- Financial/sensitive data
- Complex queries (no SQL)
- Frequent writes (>100/hour)

---

## 🚀 Getting Started

**1. Create data directory:**
```bash
mkdir data
echo '[]' > data/users.json
echo '[]' > data/sessions.json
echo '[]' > data/emails.json
git add data/
git commit -m "Initialize data storage"
git push
```

**2. Create GitHub token:**
- Go to https://github.com/settings/tokens
- Generate new token (classic)
- Scopes: `repo` (full control of private repos)
- Copy token

**3. Add to frontend:**
```javascript
// Store token (or use GitHub OAuth)
const github = new GitHubBackend('YOUR_TOKEN');

// Use it
await github.addUser('testuser', 'test@example.com');
const users = await github.getUsers();
console.log(users);
```

**4. Create GitHub Actions workflows:**
```bash
mkdir -p .github/workflows
# Add workflow files (see examples above)
```

**5. Deploy:**
```bash
git add .
git commit -m "Add GitHub backend"
git push
```

---

## 🔒 Security Considerations

### Token Storage

**Don't store tokens in frontend code!**

Instead:
1. Use GitHub OAuth (user logs in, gets their own token)
2. Store token in localStorage (user's browser only)
3. Never commit tokens to repo

### Private Data

For sensitive data:
1. Use private GitHub repo
2. Encrypt data before committing
3. Or just use a real database (PostgreSQL/Firebase)

### Rate Limits

GitHub API limits:
- **Authenticated:** 5000 requests/hour
- **Unauthenticated:** 60 requests/hour

Solution:
- Always use authentication
- Cache data in localStorage
- Use GitHub Actions for heavy processing

---

## 📚 Resources

- **GitHub API Docs:** https://docs.github.com/en/rest
- **GitHub Actions:** https://docs.github.com/en/actions
- **GitHub OAuth:** https://docs.github.com/en/developers/apps/building-oauth-apps

---

## ✅ Summary

**GitHub can be your entire backend:**

- **Storage:** Git repository (JSON files)
- **Compute:** GitHub Actions (serverless)
- **Database:** GitHub Issues (query via API)
- **Auth:** GitHub OAuth (free)
- **Hosting:** GitHub Pages (free)

**No Vercel. No VPS. No database server. Just GitHub.**

Perfect for:
- Solo projects
- Learning
- MVP/prototypes
- Full control
- Zero cost

**Limitations:**
- Slow writes
- Public data (or pay for private)
- Not real-time
- Rate limits

**Your call:**
- Need privacy + speed → localhost setup (LOCALHOST_SETUP.md)
- Want simplicity + zero cost → GitHub backend (this doc)
- Need scale + reliability → cloud deployment (DEPLOYMENT.md)

All three are valid. Pick what fits your needs.
