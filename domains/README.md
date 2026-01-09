# Soulfra Subdomain Registry

## Get Your Free Subdomain!

Request a free subdomain under any of our network domains:
- **soulfra.com** - AI-powered development platform
- **calriven.com** - Technical excellence
- **deathtodata.com** - Privacy-first
- **cringeproof.com** - Authentic community

## How to Request a Subdomain

### 1. Choose Your Letter (A-Z)

Each domain has **26 slots** (one per letter). Check availability:
- View [Letter Availability Chart](../waitlist/)
- First come, first served!

### 2. Create Your Domain File

Fork this repo and create a file: `domains/{username}.json`

Example: `domains/alice.json`
```json
{
  "owner": "alice",
  "email": "alice@example.com",
  "subdomain": "alice",
  "domain": "soulfra",
  "letter": "A",
  "target": "alice.github.io",
  "record_type": "CNAME"
}
```

### 3. Submit a Pull Request

Your PR will be automatically validated and merged if:
- ✅ JSON format is valid
- ✅ Letter is not taken
- ✅ Email format is valid
- ✅ Target URL is reachable
- ✅ You follow the naming rules

### 4. DNS Propagation

Once merged, your subdomain will be live within **5-10 minutes**:
- `{username}.{domain}.com` → Your target URL
- SSL certificate auto-generated
- CloudFlare CDN enabled

## Field Reference

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `owner` | ✅ | Your GitHub username | `"alice"` |
| `email` | ✅ | Your email address | `"alice@example.com"` |
| `subdomain` | ✅ | Subdomain name (usually same as owner) | `"alice"` |
| `domain` | ✅ | Parent domain (soulfra, calriven, deathtodata, cringeproof) | `"soulfra"` |
| `letter` | ✅ | Your letter slot (A-Z, first letter of subdomain) | `"A"` |
| `target` | ✅ | Where to point the DNS record | `"alice.github.io"` |
| `record_type` | ✅ | DNS record type (CNAME, A, AAAA, TXT) | `"CNAME"` |
| `status` | ❌ | Auto-set by system | `"active"` |
| `created_at` | ❌ | Auto-set by system | `"2026-01-09T00:00:00Z"` |
| `verified` | ❌ | Auto-set by system | `true` |
| `dns_configured` | ❌ | Auto-set by system | `true` |

## Naming Rules

1. **Letter Match**: Your subdomain must start with your chosen letter
   - ✅ `alice.json` with `"letter": "A"`
   - ❌ `alice.json` with `"letter": "B"`

2. **Lowercase Only**: Subdomain must be lowercase
   - ✅ `"alice"`
   - ❌ `"Alice"` or `"ALICE"`

3. **Valid Characters**: Letters, numbers, hyphens only
   - ✅ `"alice-dev"`, `"bob123"`
   - ❌ `"alice_dev"`, `"bob@123"`

4. **No Duplicates**: Each subdomain+domain combo must be unique
   - ✅ `alice.soulfra.com` (first)
   - ❌ `alice.soulfra.com` (duplicate)

5. **One Slot Per Letter**: Only one user per letter per domain
   - ✅ `alice.soulfra.com` (letter A)
   - ❌ `alex.soulfra.com` (letter A already taken)

## Examples

### GitHub Pages
```json
{
  "owner": "bob",
  "email": "bob@example.com",
  "subdomain": "bob",
  "domain": "calriven",
  "letter": "B",
  "target": "bob.github.io",
  "record_type": "CNAME"
}
```

### Vercel
```json
{
  "owner": "carol",
  "email": "carol@vercel.com",
  "subdomain": "carol",
  "domain": "deathtodata",
  "letter": "C",
  "target": "carol-app.vercel.app",
  "record_type": "CNAME"
}
```

### Netlify
```json
{
  "owner": "dave",
  "email": "dave@netlify.com",
  "subdomain": "dave",
  "domain": "cringeproof",
  "letter": "D",
  "target": "dave-site.netlify.app",
  "record_type": "CNAME"
}
```

### Custom IP
```json
{
  "owner": "eve",
  "email": "eve@example.com",
  "subdomain": "eve",
  "domain": "soulfra",
  "letter": "E",
  "target": "192.0.2.1",
  "record_type": "A"
}
```

## Need Help?

- **Letter Availability**: Check [waitlist page](../waitlist/)
- **Questions**: Open an issue
- **Community**: Join our Discord (link in main README)

## Abuse Policy

Subdomains used for:
- Phishing
- Malware distribution
- Spam
- Illegal content

Will be **immediately revoked** without notice.
