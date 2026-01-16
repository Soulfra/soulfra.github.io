# 🚀 Soulfra Backend Deployment Guide

This guide will help you deploy your fully-built backend to Vercel and connect it to your frontend.

## ✅ What You Already Have

Your backend is **fully built** and running at `localhost:5050` with:
- ✅ QR authentication system
- ✅ User account management
- ✅ Voice upload processing
- ✅ Token economy
- ✅ AI chat (Ollama, OpenAI, Claude)
- ✅ Agent builder
- ✅ Email capture
- ✅ Comment system

**It just needs to be deployed online and connected to the frontend.**

---

## 📋 Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com (free tier works)
2. **Vercel CLI** - Install with: `npm install -g vercel`
3. **GitHub Repository** - Your `soulfra.github.io` repo

---

## Step 1: Deploy Backend to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"

2. **Import Git Repository**
   - Select your GitHub account
   - Choose `soulfra.github.io` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Other**
   - Root Directory: **Leave as `.`** (root)
   - Build Command: **Leave empty** (serverless functions don't need build)
   - Output Directory: **Leave empty**

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   NODE_ENV=production
   PORT=5050
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for deployment
   - You'll get a URL like: `https://soulfra-github-io.vercel.app`

### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy from project root
cd /Users/matthewmauer/Desktop/soulfra.github.io
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? soulfra-backend
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

---

## Step 2: Get Your API URL

After deployment, Vercel will give you a URL like:
```
https://soulfra-github-io.vercel.app
```

Your API will be accessible at:
```
https://soulfra-github-io.vercel.app/api/health
https://soulfra-github-io.vercel.app/api/auth/qr/generate
https://soulfra-github-io.vercel.app/api/chat
```

### Test Your Deployment

```bash
# Test health endpoint
curl https://your-deployment-url.vercel.app/api/health

# Should return:
# {"status":"ok","timestamp":"...","adapters":{"QRAdapter":"ready","AgentAdapter":"ready"}}
```

---

## Step 3: Add Custom API Subdomain (Optional)

### Option 1: Use Vercel Subdomain
Your API is already accessible at `https://soulfra-github-io.vercel.app/api/*`

### Option 2: Custom Domain (Recommended)
Set up `api.soulfra.com` to point to your Vercel deployment:

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter: `api.soulfra.com`

2. **In Your DNS Provider (wherever soulfra.com is hosted):**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: api
     Value: cname.vercel-dns.com
     ```

3. **Wait for DNS propagation** (5-30 minutes)

4. **Test:**
   ```bash
   curl https://api.soulfra.com/api/health
   ```

---

## Step 4: Connect Frontend to Backend

Now update your frontend pages to call the deployed API instead of localhost.

### Create API Configuration File

**Create `/js/api-config.js`:**

```javascript
// API Configuration
const API_CONFIG = {
    // Change this to your Vercel deployment URL
    BASE_URL: 'https://soulfra-github-io.vercel.app',

    // Or if you set up custom domain:
    // BASE_URL: 'https://api.soulfra.com',

    ENDPOINTS: {
        health: '/api/health',
        emailCapture: '/api/email-capture',
        qrGenerate: '/api/qr/generate',
        authQR: '/api/auth/qr/generate',
        chat: '/api/chat',
        agentBuild: '/api/agent/build',
        userBalance: '/api/user/balance',
        deployedSites: '/api/deployed-sites',
        domainPortfolio: '/api/domain-portfolio/summary',
        users: '/api/users'
    }
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, apiCall };
}
```

### Update index.html to Use API

**Add script tag before closing `</body>`:**

```html
<!-- Load API config -->
<script src="/js/api-config.js"></script>

<script>
    // Update loadStats() function to use API config
    async function loadStats() {
        try {
            // Load domain count
            const portfolioData = await apiCall(API_CONFIG.ENDPOINTS.domainPortfolio);
            document.getElementById('domains-count').textContent = portfolioData.totalDomains || 0;

            // Load artwork count
            const users = await apiCall(API_CONFIG.ENDPOINTS.users);
            const totalArtworks = Object.values(users).reduce((sum, user) =>
                sum + (user.projects?.length || 0), 0
            );
            document.getElementById('artworks-count').textContent = totalArtworks;

            // Load deploy count
            const sites = await apiCall(API_CONFIG.ENDPOINTS.deployedSites);
            document.getElementById('deploys-count').textContent = sites.length || 6;

            // Load user token balance
            const balance = await apiCall(API_CONFIG.ENDPOINTS.userBalance);
            document.getElementById('token-balance').textContent = balance.tokens || 100;
        } catch (err) {
            console.log('Stats will load from API when backend is running');
            console.error(err);
        }
    }

    loadStats();
</script>
```

---

## Step 5: Add QR Login Functionality

### Update Dashboard Button

Replace the Dashboard button in `/index.html` with QR login flow:

```html
<div class="user-info">
    <div class="token-balance">
        <span>💰</span>
        <span id="token-balance">100</span>
        <span>tokens</span>
    </div>
    <button class="btn btn-primary" onclick="handleLogin()">Login with QR</button>
</div>

<script>
async function handleLogin() {
    try {
        // Generate QR code for authentication
        const qrData = await apiCall(API_CONFIG.ENDPOINTS.authQR, {
            method: 'POST',
            body: JSON.stringify({
                username: 'guest-' + Date.now(),
                redirect: window.location.origin + '/pages/dashboard/dashboard.html'
            })
        });

        // Show QR code modal
        showQRModal(qrData.qrCodeURL, qrData.authURL);
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}

function showQRModal(qrCodeURL, authURL) {
    // Create modal to display QR code
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 20px; text-align: center;">
            <h2 style="color: #667eea; margin-bottom: 1rem;">Scan to Login</h2>
            <img src="${qrCodeURL}" alt="QR Code" style="width: 300px; height: 300px;">
            <p style="color: #666; margin-top: 1rem;">Scan with your phone to authenticate</p>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="margin-top: 1rem; padding: 0.5rem 2rem; background: #667eea; color: white; border: none; border-radius: 50px; cursor: pointer;">
                Close
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}
</script>
```

---

## Step 6: Test Everything

### Test Backend Endpoints

```bash
# Health check
curl https://your-deployment-url.vercel.app/api/health

# Email capture
curl -X POST https://your-deployment-url.vercel.app/api/email-capture \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","brand":"soulfra"}'

# QR generation
curl -X POST https://your-deployment-url.vercel.app/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://soulfra.com","size":300}'

# Chat (if Ollama is running)
curl -X POST https://your-deployment-url.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","provider":"ollama"}'
```

### Test Frontend Integration

1. **Visit Homepage:** https://soulfra.com
2. **Check Console:** Look for successful API calls (no CORS errors)
3. **Verify Stats:** Domain count, artwork count should load from API
4. **Test QR Login:** Click "Login with QR" button
5. **Check Token Balance:** Should load from backend

---

## Step 7: Environment Variables (Important!)

Some features need API keys. Add these in Vercel Dashboard:

### OpenAI (for AI chat)
```
OPENAI_API_KEY=sk-...
```

### Claude (for AI chat)
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Custom Configuration
```
NODE_ENV=production
PORT=5050
JWT_SECRET=your-secret-key-here
```

**To add:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each key-value pair
3. Redeploy for changes to take effect

---

## Common Issues & Fixes

### Issue: CORS Errors

**Symptom:** Browser console shows:
```
Access to fetch at 'https://...' from origin 'https://soulfra.com' has been blocked by CORS
```

**Fix:** Already handled in `vercel.json` with:
```json
"headers": [
  {
    "source": "/api/(.*)",
    "headers": [
      {
        "key": "Access-Control-Allow-Origin",
        "value": "*"
      }
    ]
  }
]
```

If still having issues, update `api/unified-backend-v2.js`:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
```

### Issue: 404 on API Routes

**Symptom:** API endpoints return 404

**Fix:** Check `vercel.json` routes configuration:
```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "api/unified-backend-v2.js"
  },
  {
    "src": "/(.*)",
    "dest": "/$1"
  }
]
```

### Issue: Function Timeout

**Symptom:** "Function execution timed out"

**Fix:** Add timeout configuration to `vercel.json`:
```json
"functions": {
  "api/unified-backend-v2.js": {
    "maxDuration": 30
  }
}
```

---

## Quick Deployment Checklist

- [ ] Create Vercel account
- [ ] Deploy backend to Vercel
- [ ] Get deployment URL
- [ ] Create `/js/api-config.js` with your URL
- [ ] Update `/index.html` to load api-config.js
- [ ] Update `loadStats()` to use apiCall()
- [ ] Add QR login functionality
- [ ] Test all endpoints
- [ ] Add environment variables (API keys)
- [ ] Test frontend integration
- [ ] (Optional) Set up custom domain `api.soulfra.com`

---

## What Gets Unlocked

Once deployed and connected, you'll have:

✅ **QR Login** - Scan to authenticate, no passwords
✅ **User Accounts** - Persistent user data with token balances
✅ **Voice Uploads** - Record voice memos, generate emoji art
✅ **AI Chat** - Talk to Ollama/OpenAI/Claude agents
✅ **Agent Builder** - Create custom AI agents
✅ **Token Economy** - Earn/spend tokens across platform
✅ **Real Stats** - Live domain/artwork/deploy counts
✅ **Comments** - User comments on artworks
✅ **Email Capture** - Collect waitlist signups

Everything you built is ready - just needs deployment and connection!

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Serverless Functions:** https://vercel.com/docs/functions/serverless-functions
- **Environment Variables:** https://vercel.com/docs/environment-variables

Your backend is solid. This is just the deployment step to make it accessible online instead of localhost:5050.
