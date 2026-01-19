# Quick Start Guide

**Deploy anything in 3 steps. Choose your deployment type and follow the guide.**

---

## Current Status

### ✅ DeathToData Deployed
- **Repo:** https://github.com/Soulfra/deathtodata.github.io
- **Current URL:** https://soulfra.com/deathtodata.github.io/ (subdirectory - not ideal)
- **Target URL:** https://deathtodata.com (needs DNS configuration)
- **Status:** Code deployed, DNS pending

---

## Choose Your Deployment Type

### 1. Static Site (HTML/CSS/JS) → FREE

**Use for:** Landing pages, documentation, portfolios, static websites

```bash
./templates/deploy-static.sh ~/my-site mysite
```

**What it does:**
- Creates GitHub repo
- Deploys to GitHub Pages
- Automatic SSL certificate
- Free hosting forever

**Cost:** $0/month

**Example:** DeathToData is deployed this way

---

### 2. Express/Node.js API → $5-10/month

**Use for:** REST APIs, Node.js backends, real-time servers

```bash
./templates/deploy-express.sh ~/my-api myapi.com 192.168.1.100
```

**What it does:**
- Deploys to your VPS
- PM2 process management
- Nginx reverse proxy
- SSL with Let's Encrypt
- Auto-restart on crashes

**Cost:** $5-10/month (VPS)

---

### 3. Flask/Python API → $5-10/month

**Use for:** Python APIs, machine learning backends, data processing

```bash
./templates/deploy-flask.sh ~/my-flask-app myapi.com 192.168.1.100
```

**What it does:**
- Deploys Python app to VPS
- Gunicorn WSGI server
- Nginx reverse proxy
- SSL certificate
- Systemd service (auto-restart)

**Cost:** $5-10/month (VPS)

---

### 4. WordPress Site → $5-10/month

**Use for:** Blogs, CMS, content sites

```bash
./templates/deploy-wordpress.sh myblog.com 192.168.1.100
```

**What it does:**
- Full LAMP stack installation
- WordPress latest version
- Security plugins (Wordfence)
- Backup system (UpdraftPlus)
- Auto-updates enabled
- SSL certificate

**Cost:** $5-10/month (VPS)

---

### 5. Database Server → $5-10/month

**Use for:** PostgreSQL or MySQL databases for your apps

```bash
# PostgreSQL
./templates/deploy-database.sh postgres mydb 192.168.1.100

# MySQL
./templates/deploy-database.sh mysql mydb 192.168.1.100
```

**What it does:**
- Installs database server
- Creates database and user
- Configures firewall
- Sets up daily backups
- Enables remote access
- Generates connection string

**Cost:** $5-10/month (VPS) - can share with apps

---

## Fix DeathToData DNS (Make it Live on deathtodata.com)

**Problem:** Currently at `soulfra.com/deathtodata.github.io/` (bad for SEO)

**Solution:** Configure GoDaddy DNS (5 minutes)

### Steps:

1. **Read the guide:**
   ```bash
   cat templates/GODADDY-DNS-SETUP.md
   ```

2. **Log into GoDaddy** → Find deathtodata.com → DNS Management

3. **Add these records:**
   ```
   Type: A     Name: @   Value: 185.199.108.153
   Type: A     Name: @   Value: 185.199.109.153
   Type: A     Name: @   Value: 185.199.110.153
   Type: A     Name: @   Value: 185.199.111.153
   Type: CNAME Name: www Value: soulfra.github.io
   ```

4. **Wait 30 min - 2 hours** for DNS propagation

5. **Test it:**
   ```bash
   ./templates/test-deployment.py deathtodata.com
   ```

6. **Done!** Visit https://deathtodata.com

---

## Test Any Deployment (Python Script)

After deploying, validate everything works:

```bash
./templates/test-deployment.py deathtodata.com
```

**What it tests:**
- ✅ DNS resolution
- ✅ SSL certificate validity
- ✅ HTTP → HTTPS redirect
- ✅ Response time
- ✅ Content validation
- ✅ SEO basics (title, meta tags)
- ✅ Mobile-friendliness

---

## Visual Dashboard

See all deployments in one place:

```bash
# Open the dashboard
open templates/deployment-dashboard.html
```

**Features:**
- View all active deployments
- Status indicators (live, deploying, error)
- Generate deployment commands
- View deployment logs
- Links to live sites and repos

---

## Directory Structure

```
templates/
├── deploy-static.sh          # GitHub Pages deployment
├── deploy-express.sh         # Node.js/Express to VPS
├── deploy-flask.sh           # Python/Flask to VPS
├── deploy-wordpress.sh       # WordPress with LAMP
├── deploy-database.sh        # PostgreSQL/MySQL setup
├── test-deployment.py        # Test/validate deployments
├── deployment-dashboard.html # Visual interface
├── GODADDY-DNS-SETUP.md     # Detailed DNS guide
├── README.md                 # Full documentation
└── QUICK-START.md            # This file
```

---

## Common Workflows

### Deploy a Landing Page (Free)
```bash
# 1. Create your HTML/CSS site locally
mkdir ~/my-landing-page
# ... build your site ...

# 2. Deploy to GitHub Pages
./templates/deploy-static.sh ~/my-landing-page mysite

# 3. Configure DNS (if using custom domain)
# Follow: templates/GODADDY-DNS-SETUP.md

# 4. Test
./templates/test-deployment.py mysite.com
```

### Deploy a REST API (Node.js)
```bash
# 1. Have your Express app ready with package.json
cd ~/my-api

# 2. Get a VPS ($5/month from DigitalOcean, Linode, etc.)
# Note: Save the IP address

# 3. Deploy
./templates/deploy-express.sh ~/my-api myapi.com YOUR_VPS_IP

# 4. Test
./templates/test-deployment.py myapi.com
```

### Deploy API + Database
```bash
# 1. Deploy database first
./templates/deploy-database.sh postgres mydb YOUR_VPS_IP
# Note: Save the connection string it outputs

# 2. Update your app's .env with database URL

# 3. Deploy your app
./templates/deploy-flask.sh ~/my-app myapp.com YOUR_VPS_IP

# 4. SSH to server and configure .env
ssh root@YOUR_VPS_IP
cd /var/www/myapp
nano .env  # Add DATABASE_URL=...
sudo systemctl restart myapp
```

---

## Requirements

### For Static Sites (FREE)
- GitHub CLI: `brew install gh`
- GitHub account (already have: Soulfra)
- Nothing else!

### For VPS Deployments ($5-10/month)
- Everything above, plus:
- A VPS server (DigitalOcean, Linode, Vultr, etc.)
- SSH access configured
- Domain with DNS access (GoDaddy, etc.)

### For Testing
- Python 3: `python3 --version`
- pip packages: `pip3 install requests`

---

## Get a VPS (If You Need One)

### Recommended Providers:

**DigitalOcean** (Most popular)
- $6/month for 1GB RAM
- Simple interface
- Great docs
- https://www.digitalocean.com

**Linode**
- $5/month for 1GB RAM
- Fast performance
- Good support
- https://www.linode.com

**Vultr**
- $5/month for 1GB RAM
- More locations
- Quick provisioning
- https://www.vultr.com

### What to do after getting a VPS:

1. **Create Ubuntu 22.04 droplet**
2. **Note the IP address**
3. **Set up SSH keys:**
   ```bash
   ssh-copy-id root@YOUR_VPS_IP
   ```
4. **You're ready to deploy!**

---

## Next Steps Based on Your Goal

### Goal: Get DeathToData on deathtodata.com
→ Follow the "Fix DeathToData DNS" section above

### Goal: Deploy another static site
→ Use `deploy-static.sh`

### Goal: Deploy a Node.js API
→ Get a VPS, then use `deploy-express.sh`

### Goal: Deploy a Python API
→ Get a VPS, then use `deploy-flask.sh`

### Goal: Start a blog
→ Get a VPS, then use `deploy-wordpress.sh`

### Goal: Set up a database
→ Get a VPS, then use `deploy-database.sh`

### Goal: Test existing deployment
→ Use `test-deployment.py`

---

## Troubleshooting

**"gh: command not found"**
```bash
brew install gh
gh auth login
```

**"Cannot connect to server"**
```bash
# Make sure SSH keys are set up
ssh-copy-id root@YOUR_VPS_IP

# Test connection
ssh root@YOUR_VPS_IP
```

**"DNS not resolving"**
- DNS can take up to 24 hours to propagate
- Check with: `dig yourdomain.com`
- Clear DNS cache: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`

**"SSL certificate error"**
- DNS must be configured first
- GitHub Pages auto-provisions SSL (takes 10-15 min after DNS works)
- For VPS: Let's Encrypt is installed by deploy scripts

---

## Help & Support

**Read the docs:**
- Full guide: `templates/README.md`
- DNS setup: `templates/GODADDY-DNS-SETUP.md`

**Check deployment:**
```bash
./templates/test-deployment.py yourdomain.com
```

**View logs on VPS:**
```bash
# For Express apps
ssh root@YOUR_VPS_IP
journalctl -u yourapp -f

# For Flask apps
ssh root@YOUR_VPS_IP
journalctl -u yourapp -f

# For nginx
tail -f /var/log/nginx/error.log
```

---

**Everything's ready. Pick a deployment type and ship it! 🚀**
