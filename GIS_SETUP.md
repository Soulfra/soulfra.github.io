# Google Identity Services (GIS) Setup Guide

Complete setup guide for CalOS serverless QR login with Google Identity Services.

## Overview

This system provides **100% serverless authentication** using:
- ✅ Google Identity Services (modern OAuth)
- ✅ Google Sheets (free database)
- ✅ GitHub Pages (free static hosting)
- ✅ Zero monthly cost

## Quick Start (5 minutes)

### Step 1: Create Google OAuth Client ID

1. Go to [Google Cloud Console - Credentials](https://console.developers.google.com/apis/credentials)

2. Create or select a project

3. Click **Create Credentials** → **OAuth 2.0 Client ID**

4. Application type: **Web application**

5. Name: **CalOS QR Login**

6. **Authorized JavaScript origins** (add both):
   ```
   https://soulfra.github.io
   http://localhost:5001
   ```

7. **Authorized redirect URIs**: Leave empty (GIS uses popup, not redirects)

8. Click **Create**

9. **Copy your Client ID** (looks like: `1234567890-abc123.apps.googleusercontent.com`)

### Step 2: Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)

2. Create new spreadsheet: **"CalOS Auth Database"**

3. Create these sheets (exact names):

   **Sheet: `qr_sessions`**
   | A | B | C | D | E | F | G | H | I |
   |---|---|---|---|---|---|---|---|---|
   | sessionId | status | createdAt | expiresAt | desktopFingerprint | phoneFingerprint | verified | userId | verifiedAt |

   **Sheet: `trials`**
   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | userId | email | name | trialDays | bonusDays | startedAt | status | updatedAt |

   **Sheet: `referrals`**
   | A | B | C | D | E | F | G |
   |---|---|---|---|---|---|---|
   | userId | code | referralCount | bonusDaysEarned | createdAt | updatedAt | referredBy |

   **Sheet: `newsletter_recipients`**
   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | userId | email | name | source | status | createdAt | confirmedAt | unsubscribedAt |

4. Copy the **Spreadsheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123XYZ.../edit
                                             ^^^^^^^^^ This is the ID
   ```

5. Click **Share** → **Anyone with link** → **Editor**

### Step 3: Get Google Sheets API Key

1. Go to [Google Cloud Console - Credentials](https://console.developers.google.com/apis/credentials)

2. Click **Create Credentials** → **API key**

3. Click **Restrict Key**:
   - **API restrictions**: Select "Google Sheets API"
   - **Website restrictions**: Add `https://soulfra.github.io/*` and `http://localhost:5001/*`

4. Click **Save**

5. **Copy your API key**

### Step 4: Configure CalOS Pages

**On Desktop:**

1. Open [qr-gis-login.html](https://soulfra.github.io/qr-gis-login.html)
2. Click **⚙️** (gear icon)
3. Paste your Google Client ID
4. Click **Save Configuration**

**Configure Google Sheets:**

1. Open [qr-config-wizard.html](https://soulfra.github.io/qr-config-wizard.html)
2. Paste your Spreadsheet ID
3. Paste your Google Sheets API Key
4. Click **Save & Test Connection**

### Step 5: Test the Flow

1. **Desktop**: Open [qr-gis-login.html](https://soulfra.github.io/qr-gis-login.html)
2. QR code appears
3. **iPhone**: Scan QR code with camera
4. **iPhone**: Click "Sign in with Google"
5. **Desktop**: Auto-login detected → redirects to dashboard
6. **Done!** ✨

## How It Works

### Architecture

```
Desktop (qr-gis-login.html)
  ├─ Generate session ID (UUID)
  ├─ Create session row in Google Sheets
  ├─ Generate QR code with session URL
  ├─ Poll Google Sheets every 2s
  └─ Auto-refresh QR code every 60s

iPhone scans QR
  ├─ Opens qr-scan.html?session=UUID
  ├─ Loads Google Identity Services
  ├─ Shows "Sign in with Google" button
  ├─ User clicks → GIS popup → authenticates
  ├─ Receives JWT token with user info
  ├─ Updates Google Sheets: verified=true
  ├─ Creates trial (30 days) if new user
  ├─ Creates referral code if new user
  └─ Shows success → auto-closes

Desktop detects change
  ├─ Reads verified session from Sheets
  ├─ Gets user data (email, name, picture)
  ├─ Stores session in localStorage
  └─ Redirects to trial-dashboard.html
```

### Session Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static)                    │
│  ┌────────────────────┐        ┌────────────────────────┐   │
│  │ qr-gis-login.html  │        │   qr-scan.html         │   │
│  │ (Desktop)          │        │   (iPhone)             │   │
│  │                    │        │                        │   │
│  │ sessionId: abc123  │        │ ?session=abc123        │   │
│  │ QR: /qr-scan?...   │        │ Google Sign-In button  │   │
│  │ Poll Sheets (2s)   │        │ JWT → update Sheets    │   │
│  └──────┬─────────────┘        └────────────┬───────────┘   │
└─────────┼──────────────────────────────────┼───────────────┘
          │                                  │
          │ Write: status=pending            │ Write: verified=true
          │ Read: verified?                  │       userId, email
          ▼                                  ▼
   ┌────────────────────────────────────────────────────────┐
   │         Google Sheets (Free Database)                  │
   │  ┌──────────────────────────────────────────────────┐  │
   │  │ qr_sessions                                      │  │
   │  │ abc123 | verified | user@example.com | ...      │  │
   │  └──────────────────────────────────────────────────┘  │
   └────────────────────────────────────────────────────────┘
```

## Google Identity Services Benefits

### Why GIS over manual OAuth?

| Manual OAuth | Google Identity Services |
|--------------|-------------------------|
| Build OAuth URL manually | Automatic OAuth handling |
| Manage redirect URIs | Uses popup (no redirect) |
| Handle state parameter | Built-in CSRF protection |
| Exchange tokens | JWT in callback |
| Complex error handling | Production-ready |
| 50+ lines of code | 10 lines of code |

### GIS Features

✅ **Simple Integration**: Just include script + add div
✅ **Built-in Security**: CSRF protection by default
✅ **Modern UI**: Google's latest sign-in button
✅ **Mobile Optimized**: Works perfectly on iPhone
✅ **FedCM Support**: Browser credential management
✅ **One Tap**: Optional auto sign-in
✅ **Production Ready**: Used by millions of sites

## Configuration Details

### Google Client ID

**What it is:**
- OAuth 2.0 Client ID for web applications
- Identifies your app to Google
- Required for Google Sign-In

**Where to use:**
- Desktop: qr-gis-login.html (config UI)
- iPhone: qr-scan.html (loads from localStorage)

**Security:**
- Restricted to your domains (soulfra.github.io)
- Not secret (client-side JavaScript)
- Can be public (it's in HTML anyway)

### Google Sheets API Key

**What it is:**
- API key for Google Sheets API v4
- Allows browser to read/write Sheets
- Required for session storage

**Where to use:**
- qr-config-wizard.html (one-time setup)
- Stored in localStorage
- Used by sheets-qr-auth.js

**Security:**
- Restricted to Sheets API only
- Restricted to your domains
- Rate limited by Google (100 req/100s)
- Public Sheet is already world-writable

### localStorage Storage

**What's stored:**

```javascript
// Google Client ID (GIS)
calos_gis_config = {
  clientId: "1234567890-abc.apps.googleusercontent.com"
}

// Google Sheets config
calos_sheets_config = {
  spreadsheetId: "1ABC123XYZ...",
  apiKey: "AIza..."
}

// User session (after login)
calos_session = {
  userId: "google-user-id",
  email: "user@example.com",
  name: "User Name",
  picture: "https://...",
  authMethod: "qr-gis",
  loginAt: 1234567890
}
```

**Benefits:**
- No hardcoded credentials
- Works on any fork
- User controls their own data
- Easy to reset (clear localStorage)

## Referral System

### How Referrals Work

1. **User gets referral code**: Generated from userId (e.g., `MAT3K7R`)

2. **Share referral link**:
   ```
   https://soulfra.github.io/qr-gis-login.html?ref=MAT3K7R
   ```

3. **Friend signs up**: QR code includes `?ref=` parameter

4. **Both get bonus days**:
   - Referrer: +7 days
   - Friend: +7 days

5. **Tracked in Google Sheets**: `referrals` sheet

### Viral Growth Mechanics

```
User A signs up
  → Gets code: ABC123
  → Trial: 30 days

User A shares: ?ref=ABC123
  → Friend B signs up
  → User A: 30 + 7 = 37 days
  → Friend B: 30 + 7 = 37 days

Friend B shares: ?ref=DEF456
  → Friend C signs up
  → Friend B: 37 + 7 = 44 days
  → Friend C: 30 + 7 = 37 days
```

**Result**: Exponential growth with built-in incentives!

## Troubleshooting

### "Failed to load Google Sign-In"

**Cause**: Google Identity Services script didn't load

**Fix**:
1. Check internet connection
2. Check browser console for errors
3. Verify `https://accounts.google.com/gsi/client` is accessible
4. Try different browser

### "Google Client ID not configured"

**Cause**: Client ID not saved in localStorage

**Fix**:
1. Open qr-gis-login.html on desktop
2. Click ⚙️ gear icon
3. Enter your Client ID
4. Click "Save Configuration"

### "Google Sheets not configured"

**Cause**: Sheets config not saved

**Fix**:
1. Open qr-config-wizard.html
2. Enter Spreadsheet ID + API Key
3. Click "Save & Test Connection"
4. Verify success message

### "Session expired"

**Cause**: QR code older than 5 minutes

**Fix**:
- QR codes auto-refresh every 60s
- If expired, click "Generate New Code"
- Scan within 5 minutes

### "Session not found"

**Cause**: Session row not in Google Sheets

**Fix**:
1. Verify Google Sheets API key is correct
2. Check spreadsheet has `qr_sessions` sheet
3. Verify spreadsheet is shared "Anyone with link → Editor"
4. Try generating new QR code

### CORS Errors

**Cause**: API key domain restrictions incorrect

**Fix**:
1. Go to Google Cloud Console
2. Edit API key
3. Website restrictions:
   - Add `https://soulfra.github.io/*`
   - Add `http://localhost:5001/*` (for testing)
4. Save (may take a few minutes)

## Testing Locally

### Local Development

```bash
# Start local server
cd projects/soulfra.github.io
python3 -m http.server 5001

# Or use the agent-router server
cd ../..
npm start -- --local

# Open browser
open http://localhost:5001/qr-gis-login.html
```

### Local Configuration

1. **Add localhost to Google OAuth**:
   - Authorized JavaScript origins: `http://localhost:5001`

2. **Add localhost to API key**:
   - Website restrictions: `http://localhost:5001/*`

3. **Test on desktop**:
   - Open http://localhost:5001/qr-gis-login.html
   - QR code should generate

4. **Test on iPhone**:
   - Make sure iPhone is on same WiFi
   - Scan QR code
   - Should open http://YOUR_LOCAL_IP:5001/qr-scan.html
   - Sign in with Google

## Production Deployment

### GitHub Pages

```bash
cd projects/soulfra.github.io

# Add files
git add qr-gis-login.html qr-scan.html trial-dashboard.html
git add sheets-qr-auth.js GIS_SETUP.md

# Commit
git commit -m "Add serverless QR login with Google Identity Services"

# Push
git push origin main

# Wait 1-2 minutes for deployment
# Test: https://soulfra.github.io/qr-gis-login.html
```

### Custom Domain

If using custom domain (e.g., `auth.calos.com`):

1. **Update Google OAuth**:
   - Authorized JavaScript origins: `https://auth.calos.com`

2. **Update API key**:
   - Website restrictions: `https://auth.calos.com/*`

3. **Add CNAME**:
   ```bash
   echo "auth.calos.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

4. **Configure DNS**:
   ```
   CNAME  auth  soulfra.github.io
   ```

## Security Best Practices

### API Key Security

✅ **DO**:
- Restrict to Google Sheets API only
- Restrict to your domains
- Use different keys for dev/prod
- Rotate keys periodically

❌ **DON'T**:
- Use API key for backend services
- Share API key publicly (but it's in HTML anyway)
- Use same key for multiple projects

### OAuth Security

✅ **DO**:
- Verify JWT token signature (GIS does this)
- Check token expiry (GIS does this)
- Use HTTPS only (GitHub Pages enforces)
- Validate redirect origins

❌ **DON'T**:
- Trust client-side data without verification
- Store sensitive data in localStorage
- Use HTTP (only HTTPS)

### Google Sheets Security

✅ **DO**:
- Use public sheet (it's just session data)
- Set expiry times on sessions
- Clean up old sessions periodically
- Rate limit requests

❌ **DON'T**:
- Store passwords in Sheets
- Store payment info in Sheets
- Trust data without validation

## Cost Breakdown

| Service | Limit | Price |
|---------|-------|-------|
| GitHub Pages | 100GB/month bandwidth | **FREE** |
| Google Sheets | 10M cells | **FREE** |
| Google Sheets API | 100 req/100s/user | **FREE** |
| Google Identity Services | Unlimited | **FREE** |
| Google OAuth | Unlimited | **FREE** |
| **TOTAL** | | **$0/month** ✨ |

## Support

- 📖 Documentation: [github.com/Soulfra/calos-platform](https://github.com/Soulfra/calos-platform)
- 💬 Discussions: [GitHub Discussions](https://github.com/Soulfra/calos-platform/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/Soulfra/calos-platform/issues)
- 🔧 Setup Help: See QR_LOGIN_SETUP.md

## Next Steps

1. ✅ Complete setup above
2. ✅ Test login flow
3. ✅ Share referral link with friends
4. ✅ Check trial-dashboard.html
5. ✅ Explore CalOS features!

---

**Built with ❤️ by CalOS** - Serverless authentication for everyone
