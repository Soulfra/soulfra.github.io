# DNS Configuration Guide for Custom Domains

## 🎯 The Problem

Your GitHub Pages sites are **LIVE and working**:
- ✅ https://soulfra.github.io/soulfra/
- ✅ https://soulfra.github.io/calriven/
- ✅ https://soulfra.github.io/deathtodata/

But your custom domains have SSL errors because they point to the **wrong server**.

---

## 🔍 Current DNS Settings (WRONG)

```
soulfra.com → 138.197.94.123 (unknown server)
calriven.com → 138.197.94.123 (unknown server)
deathtodata.com → 138.197.94.123 (unknown server)
```

This causes SSL certificate errors when trying to access `https://soulfra.com`.

---

## ✅ Correct DNS Settings (GitHub Pages)

For **each domain** (soulfra.com, calriven.com, deathtodata.com):

### A Records (IPv4)

Delete all existing A records and add these **4 A records**:

```
Type: A
Name: @ (or leave blank for root domain)
Value: 185.199.108.153
TTL: 3600

Type: A
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

### AAAA Records (IPv6 - Optional but Recommended)

```
Type: AAAA
Name: @
Value: 2606:50c0:8000::153

Type: AAAA
Name: @
Value: 2606:50c0:8001::153

Type: AAAA
Name: @
Value: 2606:50c0:8002::153

Type: AAAA
Name: @
Value: 2606:50c0:8003::153
```

---

## 📝 Step-by-Step Instructions

### 1. Log into your domain registrar

- **Namecheap**: namecheap.com → Domain List → Manage
- **GoDaddy**: godaddy.com → My Products → DNS
- **Google Domains**: domains.google.com
- **Cloudflare**: dash.cloudflare.com

### 2. Find DNS settings

Look for one of these sections:
- "DNS Management"
- "Advanced DNS"
- "DNS Records"
- "Nameservers"

### 3. Delete old A records

**Find and DELETE** any A records pointing to:
- ❌ 138.197.94.123 (remove this!)

### 4. Add GitHub Pages A records

Add these **4 A records** for each domain:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### 5. Wait for DNS propagation

DNS changes take time:
- **Minimum**: 15 minutes
- **Typical**: 1-2 hours
- **Maximum**: 24-48 hours

### 6. Verify DNS is working

```bash
# Check DNS (should show GitHub IPs)
dig soulfra.com +short
# Should return:
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

# Check if site loads
curl -I https://soulfra.com
# Should return: HTTP/2 200
```

---

## 🔧 How to Configure Each Registrar

### Namecheap

1. Login → **Domain List** → **Manage**
2. Click **Advanced DNS** tab
3. Find "Host Records" section
4. Delete old A records (click trash icon)
5. Click **Add New Record**
   - Type: **A Record**
   - Host: **@**
   - Value: **185.199.108.153**
   - TTL: **Automatic**
6. Repeat for all 4 IP addresses

### GoDaddy

1. Login → **My Products** → **DNS**
2. Scroll to "Records" section
3. Delete old A records (click pencil → Delete)
4. Click **Add** → **A**
   - Name: **@**
   - Value: **185.199.108.153**
   - TTL: **1 Hour**
5. Repeat for all 4 IP addresses

### Google Domains

1. Login → **My Domains** → **Manage**
2. Click **DNS** in left sidebar
3. Scroll to "Custom resource records"
4. Delete old A records
5. Add new A records:
   - Name: **@**
   - Type: **A**
   - TTL: **1h**
   - Data: **185.199.108.153**
6. Repeat for all 4 IP addresses

### Cloudflare

1. Login → Select your domain
2. Click **DNS** tab
3. Delete old A records
4. Click **Add record**
   - Type: **A**
   - Name: **@**
   - IPv4 address: **185.199.108.153**
   - Proxy status: **Proxied** (orange cloud)
   - TTL: **Auto**
5. Repeat for all 4 IP addresses

---

## 🧪 Testing After Configuration

### Test 1: DNS Resolution

```bash
# Should return GitHub Pages IPs
dig soulfra.com +short
dig calriven.com +short
dig deathtodata.com +short
```

### Test 2: SSL Certificate

```bash
# Should work without SSL errors
curl -I https://soulfra.com
curl -I https://calriven.com
curl -I https://deathtodata.com
```

### Test 3: Browser

Open in browser:
- https://soulfra.com
- https://calriven.com
- https://deathtodata.com

Should load **without** SSL warnings.

---

## 🚨 Troubleshooting

### "SSL certificate error" still happening

**Solution**: Wait longer. DNS can take up to 48 hours.

```bash
# Check current DNS
dig soulfra.com +short

# If still showing old IP (138.197.94.123):
# → DNS hasn't propagated yet, wait longer
```

### "Page not found" (404 error)

**Check**:
1. Is CNAME file correct?
   ```bash
   curl https://soulfra.github.io/soulfra/CNAME
   # Should return: soulfra.com
   ```

2. Are GitHub Pages enabled?
   ```bash
   gh repo view Soulfra/soulfra --web
   # Check Settings → Pages → Branch: main
   ```

### DNS shows correct IPs but SSL still fails

**Possible causes**:
1. Browser cache - Try incognito/private mode
2. Local DNS cache - Flush DNS:
   ```bash
   # macOS
   sudo dscacheutil -flushcache

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

## 📊 Understanding the URLs

### Repository URL
```
https://github.com/Soulfra/soulfra
```
- This is your **source code** repository
- Contains HTML, CSS, JS files
- "Special repository" message = GitHub shows README on profile
- **Has nothing to do with deployment**

### GitHub Pages URL
```
https://soulfra.github.io/soulfra/
```
- This is your **deployed website**
- GitHub automatically serves files from `main` branch
- Always works (no DNS configuration needed)
- Has free SSL certificate

### Custom Domain URL
```
https://soulfra.com
```
- Your **branded domain**
- Requires DNS configuration (this guide)
- GitHub provides free SSL after DNS is configured
- Can take 24-48 hours for SSL to activate

---

## ✅ What Happens After DNS is Fixed

**Before** (current state):
```
You type: https://soulfra.com
Browser tries: 138.197.94.123 (wrong server)
Result: SSL error ❌
```

**After** (correct DNS):
```
You type: https://soulfra.com
DNS resolves to: 185.199.108.153 (GitHub Pages)
GitHub serves: soulfra.github.io/soulfra content
Result: Website loads ✅
```

---

## 🎯 Quick Copy-Paste Reference

### For DNS A Records

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### For DNS AAAA Records (optional)

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

---

## 📚 Official Documentation

- [GitHub Pages Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages IP Addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain)

---

**Built with ❤️ by Soulfra**

*Last updated: 2025-12-31*
