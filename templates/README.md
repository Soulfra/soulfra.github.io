# 🚀 One-Click Deployment Templates

**Deploy anything in seconds. No bullshit, no complexity.**

This is your "Privacy.com for Domains" - automated deployment templates that just work. Each domain gets its own isolated repo, its own SSL certificate, and deploys with a single command.

## What This Is

Simple bash scripts that deploy your projects to the internet with SSL, monitoring, and everything configured properly. No more figuring out nginx configs, SSL certificates, or GitHub Pages settings.

**3 templates = Everything you need:**
1. **Static Sites** (HTML/CSS/JS) → GitHub Pages
2. **Express Apps** (Node.js/API) → VPS with PM2
3. **WordPress** (Blogs/CMS) → VPS with LAMP

## Quick Start

### 1. Static Site (GitHub Pages)

Deploy any HTML/CSS/JS site to GitHub Pages with automatic SSL:

```bash
chmod +x templates/deploy-static.sh
./templates/deploy-static.sh ~/my-website mysite
```

**What it does:**
- Creates `mysite.github.io` repository
- Pushes your files
- Enables GitHub Pages
- Adds SSL certificate (automatic)
- Creates CNAME for `mysite.com`

**Result:** Your site live at `https://mysite.com` in 2 minutes

---

### 2. Express/Node.js App (VPS)

Deploy any Express/Node.js application to a VPS with PM2, nginx, and SSL:

```bash
chmod +x templates/deploy-express.sh
./templates/deploy-express.sh ~/my-api myapi.com 192.168.1.100
```

**What it does:**
- Creates GitHub repository
- SSHs to your server
- Installs Node.js + PM2
- Configures nginx reverse proxy
- Installs Let's Encrypt SSL
- Auto-restarts on crashes

**Result:** Your API live at `https://myapi.com` with monitoring

---

### 3. WordPress Site (VPS)

Install fresh WordPress with LAMP stack, security, and auto-updates:

```bash
chmod +x templates/deploy-wordpress.sh
./templates/deploy-wordpress.sh myblog.com 192.168.1.100
```

**What it does:**
- Installs LAMP stack (Apache, MySQL, PHP)
- Downloads and configures WordPress
- Creates database and user
- Installs SSL with Let's Encrypt
- Installs Wordfence (security) and UpdraftPlus (backups)
- Enables auto-updates

**Result:** Fresh WordPress at `https://myblog.com` with admin credentials

---

## Visual Dashboard

Open `deployment-dashboard.html` in your browser to:
- See all active deployments with status indicators
- Run deployments from a visual interface
- View deployment logs in real-time
- Access links to live sites and GitHub repos

```bash
# Serve the dashboard locally
cd templates
python3 -m http.server 8080

# Open in browser:
# http://localhost:8080/deployment-dashboard.html
```

---

## Requirements

### All Templates
- Mac or Linux (tested on macOS)
- GitHub CLI installed: `brew install gh`
- GitHub CLI authenticated: `gh auth login`

### Static Sites Only
- Nothing else needed! GitHub Pages is free

### Express + WordPress (VPS Required)
- A VPS (DigitalOcean, Linode, Vultr, etc.)
- Ubuntu or Debian OS
- SSH access configured
- Domain DNS pointed to server IP

**Setting up SSH:**
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519

# Copy to your server
ssh-copy-id root@YOUR_SERVER_IP
```

---

## How It Works

### Static Site Deployment (GitHub Pages)

1. **Creates repo:** `yourdomain.github.io`
2. **Pushes code:** All your HTML/CSS/JS files
3. **Enables Pages:** Automatic via GitHub API
4. **Adds CNAME:** For custom domain
5. **SSL:** GitHub handles it automatically

**DNS Configuration Required:**
```
A record:  @   → 185.199.108.153
A record:  @   → 185.199.109.153
A record:  @   → 185.199.110.153
A record:  @   → 185.199.111.153
CNAME:     www → yourusername.github.io
```

---

### Express App Deployment (VPS)

1. **Server Setup:** Installs Node.js, PM2, nginx
2. **Code Deploy:** Clones from GitHub to `/var/www/yourapp`
3. **Process Manager:** PM2 keeps app running, restarts on crash
4. **Reverse Proxy:** nginx forwards traffic to your Node.js app
5. **SSL:** Let's Encrypt certificate with auto-renewal

**Managing Your App:**
```bash
# SSH to your server
ssh root@YOUR_SERVER_IP

# View logs
pm2 logs yourapp

# Restart app
pm2 restart yourapp

# Monitor processes
pm2 monit

# Update code
cd /var/www/yourapp
git pull
npm install
pm2 restart yourapp
```

---

### WordPress Deployment (VPS)

1. **LAMP Stack:** Apache, MySQL, PHP
2. **WordPress:** Latest version downloaded
3. **Database:** MySQL database and user created
4. **Security:** Wordfence firewall + UpdraftPlus backups
5. **SSL:** Let's Encrypt certificate
6. **Auto-Updates:** Enabled for core, plugins, themes

**Post-Install:**
- Admin credentials printed after deployment
- Change password on first login
- Configure Wordfence settings
- Set up UpdraftPlus backup schedule

---

## Real-World Examples

### Example 1: DeathToData Search Engine
```bash
./templates/deploy-static.sh ~/Desktop/soulfra.github.io/deathtodata deathtodata
```
**Result:** https://deathtodata.com (live now)

### Example 2: API for Mobile App
```bash
./templates/deploy-express.sh ~/my-mobile-api mobileapi.com 192.168.1.100
```
**Result:** https://mobileapi.com with PM2 monitoring

### Example 3: Personal Blog
```bash
./templates/deploy-wordpress.sh myblog.com 192.168.1.100
```
**Result:** https://myblog.com with WordPress admin panel

---

## Troubleshooting

### Static Sites

**Problem:** GitHub Pages not working
**Solution:**
```bash
# Check if Pages is enabled
gh api repos/YOURUSERNAME/yourrepo.github.io/pages

# Wait 1-2 minutes for initial build
# Check https://github.com/YOURUSERNAME/yourrepo.github.io/settings/pages
```

**Problem:** Custom domain not working
**Solution:** Check DNS records are correct and wait up to 24 hours for propagation

---

### Express Apps

**Problem:** Can't connect to server
**Solution:**
```bash
# Test SSH connection
ssh -v root@YOUR_SERVER_IP

# If it fails, add your SSH key
ssh-copy-id root@YOUR_SERVER_IP
```

**Problem:** App not starting
**Solution:**
```bash
# SSH to server and check logs
ssh root@YOUR_SERVER_IP
pm2 logs yourapp

# Common issues:
# - Wrong port (check if app uses port 3000)
# - Missing .env file
# - npm dependencies not installed
```

**Problem:** nginx error
**Solution:**
```bash
# Check nginx error logs
ssh root@YOUR_SERVER_IP
tail -f /var/log/nginx/error.log

# Test nginx config
nginx -t
```

---

### WordPress

**Problem:** Database connection error
**Solution:** Database credentials are auto-generated. Check the output from the deployment script for the correct credentials.

**Problem:** Can't access wp-admin
**Solution:**
```bash
# Reset admin password via WP-CLI
ssh root@YOUR_SERVER_IP
cd /var/www/yourdomain
wp user update admin --user_pass=NEWPASSWORD --allow-root
```

---

## Security Best Practices

### Static Sites
✅ SSL enabled automatically
✅ No backend = no vulnerabilities
✅ GitHub handles security

### Express Apps
✅ Use environment variables for secrets (`.env` file)
✅ Never commit `.env` to git
✅ Keep dependencies updated: `npm audit fix`
✅ Use a firewall: `ufw enable`

### WordPress
✅ Change admin password immediately
✅ Configure Wordfence firewall
✅ Set up UpdraftPlus backups
✅ Keep plugins updated (auto-updates enabled)
✅ Use strong database password (auto-generated)

---

## Cost Breakdown

### Static Sites (GitHub Pages)
**FREE** ✅
- Unlimited sites
- Automatic SSL
- Global CDN
- 100GB bandwidth/month

### Express Apps (VPS)
**$5-10/month** per server
- DigitalOcean: $6/month (1GB RAM)
- Linode: $5/month (1GB RAM)
- Vultr: $5/month (1GB RAM)
- Can host multiple apps on one server

### WordPress (VPS)
**$5-10/month** per server
- Same VPS providers as Express
- Can run multiple WordPress sites on one server
- Plugins are free (Wordfence, UpdraftPlus)

---

## Philosophy

This is how deployment should work:

1. **Simple commands** - No 10-step tutorials
2. **One domain per repo** - Isolated, clean, maintainable
3. **Security by default** - SSL, firewalls, auto-updates
4. **No vendor lock-in** - Your code, your server, your control
5. **Plain English docs** - No jargon, no assumptions

**Inspired by:**
- Privacy.com (isolated cards for each vendor)
- is-a.dev (free domains for developers)
- Vercel/Netlify (one-click deploys)

But **self-hosted** and **open source**.

---

## What's Next

### Planned Templates
- [ ] Python/Flask apps
- [ ] Ruby on Rails apps
- [ ] Docker deployments
- [ ] Database backups
- [ ] SSL renewal automation
- [ ] Monitoring dashboards

### Planned Features
- [ ] Backend API for dashboard (execute commands remotely)
- [ ] Real-time deployment logs
- [ ] Rollback functionality
- [ ] Multi-server deployments
- [ ] Environment variable management

---

## Contributing

Got a template idea? Found a bug? Want to add a feature?

1. Fork the repo
2. Create your template in `templates/`
3. Test it on a fresh server
4. Submit a PR

**Template requirements:**
- Single bash script
- Color-coded output
- Error handling
- Clear usage examples
- Works on Ubuntu/Debian

---

## License

MIT License - Do whatever you want with this.

If it helps you deploy something cool, that's awesome. If you build a business on it, that's cool too. No attribution required.

---

## Credits

Built by [@Soulfra](https://github.com/Soulfra)

**Why?** Because deploying shit shouldn't take 3 hours and a PhD in DevOps.

---

## Support

Having issues? Check the troubleshooting section above.

Still stuck? Open an issue on GitHub with:
- Which template you're using
- Full error message
- Your OS and setup

---

**Now go deploy something. 🚀**
