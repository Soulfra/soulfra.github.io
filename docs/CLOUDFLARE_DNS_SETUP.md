# CloudFlare DNS Automation Setup

Automated DNS provisioning for Soulfra Network subdomains using GitHub Actions and CloudFlare API.

## Overview

When users submit a PR to register a subdomain (e.g., `alice.soulfra.com`), the system:

1. **Validates** the domain registration (format, letter availability, target reachability)
2. **Auto-merges** the PR if validation passes
3. **Provisions** DNS records via CloudFlare API
4. **Enables** SSL certificates automatically (CloudFlare proxy)

## Prerequisites

1. **CloudFlare Account** with domains configured:
   - soulfra.com
   - calriven.com
   - deathtodata.com
   - cringeproof.com

2. **CloudFlare API Token** with DNS edit permissions

3. **Zone IDs** for each domain

## Step 1: Get CloudFlare API Token

1. Log in to [CloudFlare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use template: **Edit zone DNS**
5. Configure permissions:
   - **Permissions**: `Zone / DNS / Edit`
   - **Zone Resources**: Include all zones or specific zones
6. Click **Continue to summary** → **Create Token**
7. **Copy the token** (you won't see it again!)

## Step 2: Get Zone IDs

For each domain, get the Zone ID:

1. Go to [CloudFlare Dashboard](https://dash.cloudflare.com/)
2. Click on your domain (e.g., `soulfra.com`)
3. Scroll down to **API** section on the right sidebar
4. Copy the **Zone ID**

Repeat for all 4 domains.

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add CLOUDFLARE_API_TOKEN

- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: Paste your API token from Step 1
- Click **Add secret**

### Add CLOUDFLARE_ZONE_IDS

- **Name**: `CLOUDFLARE_ZONE_IDS`
- **Secret**: JSON object with zone IDs:

```json
{
  "soulfra": "your_soulfra_zone_id",
  "calriven": "your_calriven_zone_id",
  "deathtodata": "your_deathtodata_zone_id",
  "cringeproof": "your_cringeproof_zone_id"
}
```

Replace `your_*_zone_id` with actual zone IDs from Step 2.

- Click **Add secret**

## Step 4: Test the Setup

### Option 1: Create a test domain

1. Fork the repository
2. Create `domains/test.json`:

```json
{
  "owner": "test",
  "email": "test@example.com",
  "subdomain": "test",
  "domain": "soulfra",
  "letter": "T",
  "target": "example.github.io",
  "record_type": "CNAME"
}
```

3. Submit a PR
4. Watch the GitHub Actions run:
   - `Validate Domain Registration PR` - Validates and auto-merges
   - `Provision DNS Records` - Creates DNS record in CloudFlare

### Option 2: Manual trigger

1. Go to **Actions** tab in GitHub
2. Select **Provision DNS Records** workflow
3. Click **Run workflow**
4. Choose branch and optionally specify a domain file
5. Click **Run workflow**

## Verification

After provisioning, verify DNS records:

### Via CloudFlare Dashboard

1. Go to your domain in CloudFlare
2. Click **DNS** → **Records**
3. Look for the new subdomain record (e.g., `test.soulfra.com`)
4. Verify:
   - **Type**: CNAME (or A, depending on config)
   - **Name**: subdomain name
   - **Target**: your target URL
   - **Proxy status**: Proxied (orange cloud) - SSL enabled

### Via Command Line

```bash
# Check DNS resolution
dig test.soulfra.com

# Check if site is accessible
curl -I https://test.soulfra.com
```

DNS propagation typically takes 5-10 minutes.

## Workflow Files

### `.github/workflows/validate-domain-pr.yml`

Validates PRs and auto-merges if validation passes.

**Triggers**: PR opened/updated with changes to `domains/*.json`

**Steps**:
1. Validate JSON schema
2. Check email format
3. Verify letter availability
4. Check target reachability
5. Auto-approve and merge PR

### `.github/workflows/provision-dns.yml`

Provisions DNS records via CloudFlare API.

**Triggers**:
- Push to main branch with changes to `domains/*.json`
- Manual workflow dispatch

**Steps**:
1. Detect changed domain files
2. Create/update DNS records in CloudFlare
3. Update domain file status
4. Commit changes

## Domain File Status

After provisioning, domain files are updated with:

```json
{
  "owner": "alice",
  "email": "alice@example.com",
  "subdomain": "alice",
  "domain": "soulfra",
  "letter": "A",
  "target": "alice.github.io",
  "record_type": "CNAME",
  "status": "active",
  "dns_configured": true,
  "verified": true
}
```

## Troubleshooting

### "CloudFlare API error: 401 Unauthorized"

- Check that `CLOUDFLARE_API_TOKEN` is correctly set in GitHub Secrets
- Verify the token has DNS edit permissions
- Token may have expired - regenerate a new one

### "No CloudFlare zone ID configured for domain.com"

- Check that `CLOUDFLARE_ZONE_IDS` is correctly formatted as JSON
- Verify all domain names match exactly (lowercase)
- Ensure zone IDs are correct (copy from CloudFlare dashboard)

### "DNS record creation failed"

- Verify the zone is active in CloudFlare
- Check that the target URL/IP is valid
- Ensure DNS proxy settings are compatible with record type

### "Workflow not running"

- Check GitHub Actions are enabled for the repository
- Verify workflow YAML syntax is valid
- Ensure the branch is `main` or `master`

## Security Notes

1. **API Token**: Never commit the API token to the repository
2. **Secrets**: Keep GitHub Secrets secure, don't share publicly
3. **Permissions**: Use least-privilege API tokens (DNS edit only)
4. **Zone IDs**: Zone IDs are not sensitive but keep them in secrets for consistency

## Rate Limits

CloudFlare API rate limits:
- **Free plan**: 1,200 requests per 5 minutes
- **Pro plan**: Higher limits

For this use case, rate limits are unlikely to be an issue unless you're provisioning hundreds of domains at once.

## SSL Certificates

When using CloudFlare proxy (recommended):
- SSL certificates are **automatically provisioned**
- **Universal SSL** enabled by default
- **HTTPS** works immediately after DNS propagation
- **HTTP to HTTPS redirect** enabled

## Advanced Configuration

### Custom TTL

Edit `provision-dns.yml` to set custom TTL:

```python
data = {
    "type": record_type,
    "name": name,
    "content": content,
    "ttl": 3600,  # 1 hour (instead of auto)
    "proxied": proxied
}
```

### Disable CloudFlare Proxy

For A records that shouldn't be proxied:

```python
# In provision_domain function
proxied = False  # Disable proxy
```

### Multiple Target Records

To support multiple A records for the same subdomain, modify the script to create multiple records instead of updating.

## Support

- **CloudFlare API Docs**: https://developers.cloudflare.com/api/
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Issues**: Open an issue in this repository

## Next Steps

Once DNS automation is working:

1. Monitor GitHub Actions for successful provisioning
2. Test subdomain accessibility (HTTPS)
3. Set up monitoring/alerts for DNS issues
4. Document the process for users
5. Consider adding a dashboard to show provisioning status
