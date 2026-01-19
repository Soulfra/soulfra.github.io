# GoDaddy DNS Configuration for GitHub Pages

**Goal:** Point `deathtodata.com` to GitHub Pages so it serves your site instead of the ugly subdirectory URL.

**Time Required:** 5 minutes to configure, 5 minutes - 24 hours for DNS propagation (usually ~1 hour)

---

## Step-by-Step Instructions

### 1. Log into GoDaddy

1. Go to https://www.godaddy.com
2. Click "Sign In" (top right)
3. Enter your credentials

### 2. Navigate to DNS Management

1. Click your profile icon (top right)
2. Select "My Products"
3. Find `deathtodata.com` in your domain list
4. Click the "DNS" button next to it
   - OR click the three dots ⋮ and select "Manage DNS"

### 3. Add A Records for GitHub Pages

GitHub Pages requires **4 A records** pointing to their servers.

**For each of these 4 IP addresses, do the following:**

#### IP Addresses to Add:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

#### How to Add Each A Record:

1. Scroll down to "DNS Records" section
2. Click "Add" button
3. Fill in the form:
   ```
   Type:   A
   Name:   @
   Value:  [paste one of the IP addresses above]
   TTL:    600 seconds (or leave default)
   ```
4. Click "Save"
5. Repeat for all 4 IP addresses

**What you should see after adding all 4:**
```
Type  Name  Value                TTL
A     @     185.199.108.153      600
A     @     185.199.109.153      600
A     @     185.199.110.153      600
A     @     185.199.111.153      600
```

### 4. Add CNAME Record for www Subdomain

This makes `www.deathtodata.com` redirect to `deathtodata.com`.

1. Click "Add" button again
2. Fill in the form:
   ```
   Type:   CNAME
   Name:   www
   Value:  soulfra.github.io
   TTL:    1 Hour (or leave default)
   ```
3. Click "Save"

**What you should see:**
```
Type   Name  Value               TTL
CNAME  www   soulfra.github.io   1 Hour
```

### 5. Remove Conflicting Records (If Any)

**IMPORTANT:** If you see any of these existing records, DELETE them (they conflict):

- A record with Name `@` pointing to a different IP
- CNAME record with Name `@` (can't have both A and CNAME)
- Any "domain forwarding" or "parking" records

**How to delete:**
1. Find the record in the DNS Records list
2. Click the pencil/edit icon or three dots ⋮
3. Click "Delete" or trash icon
4. Confirm deletion

### 6. Save Changes

1. GoDaddy usually auto-saves, but look for a "Save" or "Save Changes" button
2. If you see "Save All Changes" at the top or bottom, click it

---

## Verification & Testing

### Immediate Check (5 minutes after saving)

Open Terminal and run:

```bash
# Check if DNS is updating
dig deathtodata.com

# You should see the GitHub IPs in the ANSWER SECTION:
# deathtodata.com.  600  IN  A  185.199.108.153
# deathtodata.com.  600  IN  A  185.199.109.153
# deathtodata.com.  600  IN  A  185.199.110.153
# deathtodata.com.  600  IN  A  185.199.111.153
```

### Check www Subdomain

```bash
dig www.deathtodata.com

# Should show CNAME to soulfra.github.io
```

### Check with Online Tool

Go to: https://dnschecker.org

1. Enter: `deathtodata.com`
2. Select type: `A`
3. Click "Search"
4. Look for green checkmarks showing GitHub IPs propagating worldwide

### Visit Your Site

**After DNS propagates** (5 min - 24 hours, usually ~1 hour):

1. Go to: https://deathtodata.com
2. You should see your DeathToData search engine
3. Check for 🔒 icon (SSL certificate) - GitHub auto-provisions this

**If you see an SSL warning:**
- DNS has propagated, but GitHub hasn't issued certificate yet
- Wait 10-15 more minutes
- Try again - should be fixed

---

## Troubleshooting

### Issue: "This site can't be reached" or DNS_PROBE_FINISHED_NXDOMAIN

**Cause:** DNS hasn't propagated yet

**Fix:**
- Wait 30 more minutes
- Clear your browser cache
- Try in incognito/private window
- Try on your phone (different DNS cache)

### Issue: Still redirecting to soulfra.com/deathtodata.github.io/

**Cause:** Your browser cached the old redirect

**Fix:**
1. Clear browser cache
2. Try incognito/private window
3. Run `dig deathtodata.com` to verify DNS is correct

### Issue: SSL Certificate Error / Not Secure

**Cause:** GitHub hasn't provisioned SSL cert yet

**Fix:**
1. Wait 10-15 minutes after DNS propagates
2. GitHub auto-detects the custom domain and provisions SSL
3. Check GitHub Pages settings: https://github.com/Soulfra/deathtodata.github.io/settings/pages
4. Should show "DNS check successful" and "Certificate: Active"

### Issue: GitHub Pages Shows "There isn't a GitHub Pages site here"

**Cause:** CNAME file might be missing or DNS not pointing correctly

**Fix:**
1. Check CNAME file exists: https://github.com/Soulfra/deathtodata.github.io/blob/main/CNAME
2. Should contain: `deathtodata.com`
3. Verify DNS with: `dig deathtodata.com`
4. Wait for DNS propagation

---

## What Happens Next (Timeline)

### Immediate (0-5 minutes)
- DNS records saved in GoDaddy
- Changes queued for propagation

### 5-30 minutes
- DNS starts propagating to nameservers worldwide
- Some locations see new IPs, some see old
- `dig` command shows GitHub IPs

### 30 minutes - 2 hours
- Most DNS servers updated
- Site accessible at deathtodata.com (might show SSL warning)
- GitHub detects custom domain

### 2-4 hours
- GitHub provisions SSL certificate
- 🔒 HTTPS works with valid certificate
- Site fully live and secure

### 24-48 hours
- 100% of global DNS updated
- All edge cases resolved
- Site works everywhere

---

## Final DNS Configuration Summary

**Your final DNS should look like this:**

```
Type   Name  Value                TTL
A      @     185.199.108.153      600 seconds
A      @     185.199.109.153      600 seconds
A      @     185.199.110.153      600 seconds
A      @     185.199.111.153      600 seconds
CNAME  www   soulfra.github.io    1 Hour
```

**Delete these if they exist:**
- Old A record @ pointing elsewhere
- CNAME record @ (conflicts with A records)
- Parking page records
- Domain forwarding

---

## After DNS is Configured

### Test the Site

Visit these URLs (all should work):
- https://deathtodata.com
- https://www.deathtodata.com (redirects to non-www)
- http://deathtodata.com (redirects to HTTPS)

### Check SEO

Use Google's test tools:
- https://search.google.com/test/mobile-friendly
- https://pagespeed.web.dev

Enter `deathtodata.com` - should show your site with good scores.

### Update Links

Update any existing links from:
- ❌ `https://soulfra.com/deathtodata.github.io/`

To:
- ✅ `https://deathtodata.com`

---

## Questions?

**How long does DNS really take?**
- Usually 30 min - 2 hours
- Can take up to 48 hours in rare cases
- TTL (Time To Live) affects this - 600 seconds = 10 min minimum

**Do I need to do anything in GitHub?**
- Nope! CNAME file is already there
- GitHub auto-detects the custom domain
- SSL certificate auto-provisions

**What if I have other DNS records (email, etc.)?**
- Keep them! Only add/replace the A and CNAME records listed above
- Email MX records, TXT records, etc. stay as-is

**Can I change DNS back if something breaks?**
- Yes! Just delete the GitHub A records
- Or change them back to previous values
- DNS changes are reversible

**Will this affect my other domains?**
- No! This only affects deathtodata.com
- soulfra.com and other domains are unaffected

---

## Pro Tips

### Speed Up DNS Propagation

1. **Lower TTL before making changes:**
   - 24 hours before: Set TTL to 300 seconds (5 min)
   - Make changes
   - After propagation: Set TTL back to 3600 (1 hour)

2. **Flush your local DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

3. **Use a different DNS server for testing:**
   - Google DNS: 8.8.8.8
   - Cloudflare DNS: 1.1.1.1
   - Usually updates faster than ISP DNS

### Monitor Propagation

Watch DNS propagate live:
```bash
watch -n 10 dig deathtodata.com
```

This checks every 10 seconds and shows when it changes.

---

## Success Checklist

- [ ] Logged into GoDaddy
- [ ] Navigated to DNS for deathtodata.com
- [ ] Added 4 A records (185.199.108.153, 109, 110, 111)
- [ ] Added 1 CNAME record (www → soulfra.github.io)
- [ ] Removed conflicting records
- [ ] Saved changes
- [ ] Ran `dig deathtodata.com` (shows GitHub IPs)
- [ ] Waited for propagation
- [ ] Visited https://deathtodata.com (works!)
- [ ] Checked SSL certificate (🔒 shows)
- [ ] Updated bookmarks/links

---

**Once DNS propagates, your site will be live at `https://deathtodata.com` with automatic SSL. No more ugly subdirectory URLs!**
