# Soulfra Deployment Guide

Deploy your Soulfra API to production in minutes using Railway, Render, or Fly.io.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

**One-Click Deploy:**
1. Click the button above
2. Connect your GitHub account
3. Set environment variables:
   - `SENDGRID_API_KEY` or `POSTMARK_API_KEY`
   - `FROM_EMAIL`
   - `FROM_NAME`
4. Deploy!

**Manual Railway Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set SENDGRID_API_KEY=your_key_here
railway variables set FROM_EMAIL=noreply@soulfra.com
railway variables set FROM_NAME="Soulfra Platform"

# Deploy
railway up
```

**Cost:** $5/month (includes $5 free credit each month)

---

### Option 2: Render.com (Free Tier Available)

**Deploy Steps:**
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name:** soulfra-api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node api/unified-backend-v2.js`
   - **Port:** 5050
5. Add environment variables (click "Environment"):
   ```
   SENDGRID_API_KEY=your_key_here
   FROM_EMAIL=noreply@soulfra.com
   FROM_NAME=Soulfra Platform
   PORT=5050
   ```
6. Click "Create Web Service"

**Cost:** Free tier available (spins down after inactivity)

**Custom Domain:**
- Go to Settings → Custom Domain
- Add your domain (e.g., api.soulfra.com)
- Update DNS with provided CNAME

---

### Option 3: Fly.io (Best for Global Scale)

**Deploy Steps:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app (creates fly.toml automatically)
fly launch --name soulfra-api --region sjc

# Set environment variables
fly secrets set SENDGRID_API_KEY=your_key_here
fly secrets set FROM_EMAIL=noreply@soulfra.com
fly secrets set FROM_NAME="Soulfra Platform"

# Deploy
fly deploy
```

**Cost:** Free tier: 3 shared VMs, 160GB outbound transfer/month

**Custom Domain:**
```bash
fly certs add api.soulfra.com
```

---

## 📧 Email Service Setup

### SendGrid (100 emails/day free)

1. **Sign up:** https://signup.sendgrid.com/
2. **Create API Key:**
   - Settings → API Keys → Create API Key
   - Name: "Soulfra Production"
   - Permissions: Full Access
3. **Copy key** and add to your deployment's environment variables

### Postmark (100 emails/month free)

1. **Sign up:** https://postmarkapp.com/sign_up
2. **Get Server API Token:**
   - Servers → [Your Server] → API Tokens
   - Copy "Server API token"
3. **Verify sender signature:**
   - Sender Signatures → Add New
   - Verify your email domain
4. **Add to environment variables**

---

## 🔧 Environment Variables Checklist

Required for production:
- [x] `SENDGRID_API_KEY` **or** `POSTMARK_API_KEY`
- [x] `FROM_EMAIL`
- [x] `FROM_NAME`
- [x] `PORT` (set to 5050 or leave default)

Optional:
- [ ] `OPENAI_API_KEY` (for GPT models)
- [ ] `ANTHROPIC_API_KEY` (for Claude models)
- [ ] `NODE_ENV=production`

---

## 🌐 Frontend Update (After Deploy)

Once deployed, update your frontend to use the production URL:

**signup.html** (line ~290):
```javascript
// Change from:
const response = await fetch('http://localhost:5050/api/signup', {

// To:
const response = await fetch('https://your-app.railway.app/api/signup', {
// OR
const response = await fetch('https://soulfra-api.onrender.com/api/signup', {
// OR
const response = await fetch('https://api.soulfra.com/api/signup', {
```

**Pro tip:** Use environment detection:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5050'
  : 'https://api.soulfra.com';

const response = await fetch(`${API_URL}/api/signup`, {
  // ...
});
```

---

## 🔒 Security Checklist

Before going live:

- [ ] **Never commit `.env` to git**
  ```bash
  echo ".env" >> .gitignore
  ```

- [ ] **Use environment variables** for all secrets

- [ ] **Enable CORS properly**
  - Update `Access-Control-Allow-Origin` in backend
  - Change from `*` to your actual domain

- [ ] **Add rate limiting**
  ```javascript
  // Add to unified-backend-v2.js
  const rateLimit = new Map();

  function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = rateLimit.get(ip) || [];
    const recentRequests = userRequests.filter(time => now - time < 60000);

    if (recentRequests.length > 100) {
      return false; // Too many requests
    }

    rateLimit.set(ip, [...recentRequests, now]);
    return true;
  }
  ```

- [ ] **Validate all inputs**

- [ ] **Monitor error logs**

---

## 📊 Monitoring & Logs

### Railway
```bash
railway logs
```

### Render
- Dashboard → [Your Service] → Logs

### Fly.io
```bash
fly logs
```

---

## 🆘 Troubleshooting

### "Signup endpoint not working"
- Check backend logs for errors
- Verify environment variables are set
- Test endpoint: `curl https://your-api.com/api/health`

### "Emails not sending"
- Check email service API key is correct
- Verify sender email is verified (Postmark)
- Check console logs for email service errors

### "CORS errors"
- Update `Access-Control-Allow-Origin` to match your frontend domain
- Ensure preflight OPTIONS requests return 204

### "Backend crashes"
- Check if `node_modules` is ignored in `.gitignore`
- Verify `package.json` has all dependencies
- Check deployment logs for missing modules

---

## 📦 GitHub Actions Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Setup:**
1. Get Railway token: `railway login && railway whoami --token`
2. Add to GitHub: Settings → Secrets → `RAILWAY_TOKEN`
3. Push to main → Auto-deploys! 🚀

---

## 🎯 Next Steps

After deployment:

1. **Test signup flow** on production
2. **Monitor email delivery**
3. **Set up custom domain**
4. **Add API documentation** (Swagger/OpenAPI)
5. **Scale as needed** (upgrade plan when you hit limits)

---

## 💡 Pro Tips

**Free Hosting Strategy:**
- **Frontend:** GitHub Pages (free, unlimited)
- **Backend:** Render free tier (spins down after 15min inactivity)
- **Email:** SendGrid free tier (100/day)
- **Total cost:** $0/month ✨

**Production-Ready Stack:**
- **Frontend:** Vercel or Cloudflare Pages ($0-20/mo)
- **Backend:** Railway or Fly.io ($5-10/mo)
- **Email:** SendGrid or Postmark ($0-10/mo)
- **Database:** Upstash Redis ($0-10/mo)
- **Total cost:** $5-50/month

**Enterprise Scale:**
- **Backend:** AWS ECS or Google Cloud Run
- **Email:** SendGrid Enterprise
- **Database:** PostgreSQL on RDS
- **CDN:** Cloudflare
- **Monitoring:** Datadog or New Relic

---

**Questions?** Open an issue or check [docs/](./README.md)

**Ready to deploy?** Choose your platform and get started! 🚀
