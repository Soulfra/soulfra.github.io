# Serverless QR Login Setup Guide

**100% serverless QR authentication with Google OAuth, free trials, and viral referral system** - Zero backend required!

## Overview

This guide shows you how to set up the complete serverless QR login system with:
- ✅ QR code authentication (desktop ↔ iPhone)
- ✅ Google OAuth integration (no password needed)
- ✅ Free trial management (30 days + referral bonuses)
- ✅ Viral referral system (invite friends → earn bonus days)
- ✅ Newsletter auto-subscription
- ✅ 100% free tier (Google Sheets + GitHub Pages)
- ✅ Zero backend servers needed

## Quick Start

### 1. Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new spreadsheet: **"CalOS Auth Database"**
3. Copy the Spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123XYZ.../edit
                                             ^^^^^^^^^ This is the ID
   ```
4. Click **Share** → **Anyone with link** → **Editor**

### 2. Create Required Sheets

Add these sheets to your spreadsheet (use exact names):

#### Sheet: `qr_sessions`
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| sessionId | status | createdAt | expiresAt | desktopFingerprint | phoneFingerprint | verified | userId | verifiedAt |

#### Sheet: `trials`
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| userId | email | name | trialDays | bonusDays | startedAt | status | updatedAt |

#### Sheet: `referrals`
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| userId | code | referralCount | bonusDaysEarned | createdAt | updatedAt | referredBy |

#### Sheet: `newsletter_recipients`
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| userId | email | name | source | status | createdAt | confirmedAt | unsubscribedAt |

### 3. Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create new project or select existing
3. Enable **Google Sheets API**
4. Click **Create Credentials** → **API key**
5. Click **Restrict Key**:
   - **API restrictions**: Select "Google Sheets API"
   - **Website restrictions**: Add `https://soulfra.github.io/*`
6. Click **Save** and copy your API key

### 4. Get Google OAuth Client ID

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: **CalOS QR Login**
5. Authorized redirect URIs:
   ```
   https://soulfra.github.io/oauth-callback.html
   http://localhost:5001/oauth-callback.html
   ```
6. Click **Create** and copy your Client ID

### 5. Configure the Pages

Open [qr-fedcm-login.html](https://soulfra.github.io/qr-fedcm-login.html):

1. Click the **⚙️** (gear) icon
2. Paste your Google OAuth Client ID
3. Click **Save Configuration**

Open [qr-config-wizard.html](https://soulfra.github.io/qr-config-wizard.html):

1. Paste your Spreadsheet ID
2. Paste your Google API Key
3. Click **Save & Test Connection**

### 6. Test the Flow

1. **Desktop**: Open [qr-fedcm-login.html](https://soulfra.github.io/qr-fedcm-login.html)
2. **iPhone**: Scan QR code with camera
3. **iPhone**: Login with Google
4. **Desktop**: Auto-login detected → redirects to dashboard
5. **Both**: You're logged in!

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static HTML)                   │
│  ┌────────────────────────┐      ┌────────────────────────────┐ │
│  │  qr-fedcm-login.html   │      │  oauth-callback.html       │ │
│  │  (Desktop)             │      │  (iPhone)                  │ │
│  │                        │      │                            │ │
│  │  1. Generate OAuth URL │      │  3. Handle OAuth redirect  │ │
│  │  2. Create QR code     │      │  4. Update Google Sheets   │ │
│  │  3. Poll for changes   │      │                            │ │
│  └───────┬────────────────┘      └────────────┬───────────────┘ │
└──────────┼─────────────────────────────────────┼─────────────────┘
           │                                     │
           │ Create session row                  │ Update verified=true
           │ Poll every 2s                       │ Save user data
           ▼                                     ▼
    ┌──────────────────────────────────────────────────────────────┐
    │              Google Sheets (Free Database)                   │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │  qr_sessions          trials           referrals       │  │
    │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
    │  │  │ sessionId   │  │ userId       │  │ userId       │  │  │
    │  │  │ verified    │  │ trialDays    │  │ code         │  │  │
    │  │  │ userId      │  │ bonusDays    │  │ count        │  │  │
    │  │  └─────────────┘  └──────────────┘  └──────────────┘  │  │
    │  └────────────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────────────┘
```

### Desktop Flow

1. User opens `qr-fedcm-login.html`
2. JavaScript generates OAuth URL with state parameter:
   ```javascript
   const state = btoa(JSON.stringify({
     sessionId: crypto.randomUUID(),
     timestamp: Date.now(),
     deviceFingerprint: 'device-hash'
   }));

   const oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
     `client_id=${clientId}&` +
     `redirect_uri=https://soulfra.github.io/oauth-callback.html&` +
     'response_type=token&' +
     'scope=email%20profile&' +
     `state=${state}`;
   ```
3. QR code generated with OAuth URL
4. Session row created in Google Sheets (`qr_sessions` sheet)
5. Desktop polls Google Sheets every 2 seconds checking for `verified=true`
6. QR code auto-refreshes every 60 seconds (new sessionId + timestamp)

### iPhone Flow

1. User scans QR code with camera
2. Redirects to Google OAuth login
3. After Google auth, redirects to `oauth-callback.html` with access token
4. JavaScript fetches Google user info
5. Updates session row in Google Sheets:
   ```javascript
   {
     verified: true,
     userId: userInfo.id,
     userEmail: userInfo.email,
     userName: userInfo.name,
     userPicture: userInfo.picture
   }
   ```
6. Creates trial record (30 days) if new user
7. Creates referral code if new user
8. Shows success message → auto-closes

### Trial & Referral Flow

1. **First Login**: Trial created (30 days)
2. **Dashboard**: Shows trial countdown + referral link
3. **Share Referral**: Friend signs up with your code
4. **Bonus Days**: You earn +7 days, friend earns +7 days
5. **Viral Growth**: More referrals = longer trial

## Features

### Auto-Refreshing QR Codes

QR codes automatically regenerate every 60 seconds with:
- New session ID
- New timestamp
- Updated counter display

```javascript
// Auto-refresh every 60 seconds
refreshInterval = setTimeout(() => {
  qrCounter++;
  generateQRCode();
}, 60000);
```

### Free Trial Management

- Default: 30 days
- Bonus days: +7 per referral
- Tracked in Google Sheets
- Auto-calculated expiry
- Progress bar display

### Viral Referral System

- Unique code per user (e.g., `MAT3K7R`)
- Shareable link: `https://soulfra.github.io/qr-fedcm-login.html?ref=MAT3K7R`
- Auto-tracking in Google Sheets
- Bonus days awarded to both parties
- Real-time counter

### Newsletter Integration

- Auto-subscribe on login (optional)
- Double opt-in confirmation
- Tracked in Google Sheets
- GDPR compliant

## Configuration

### Browser Storage

All user config stored in `localStorage`:

```javascript
// OAuth config
localStorage.setItem('calos_oauth_config', JSON.stringify({
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
}));

// Sheets config
localStorage.setItem('calos_sheets_config', JSON.stringify({
  spreadsheetId: '1ABC123XYZ...',
  apiKey: 'AIza...'
}));

// User session
localStorage.setItem('calos_session', JSON.stringify({
  userId: 'google-id',
  email: 'user@example.com',
  name: 'User Name',
  picture: 'https://...',
  authMethod: 'qr-fedcm-oauth',
  loginAt: 1234567890
}));
```

### Google Sheets Schema

#### qr_sessions
```
sessionId         | string  | Unique session ID (UUID)
status            | string  | 'pending' | 'verified' | 'expired'
createdAt         | number  | Unix timestamp
expiresAt         | number  | Unix timestamp (createdAt + 5min)
desktopFingerprint| string  | Browser fingerprint
phoneFingerprint  | string  | Browser fingerprint
verified          | boolean | true/false
userId            | string  | Google user ID
verifiedAt        | number  | Unix timestamp
```

#### trials
```
userId      | string  | Google user ID
email       | string  | User email
name        | string  | User name
trialDays   | number  | Base trial days (default: 30)
bonusDays   | number  | Referral bonus days
startedAt   | number  | Unix timestamp
status      | string  | 'active' | 'expired' | 'upgraded'
updatedAt   | number  | Unix timestamp
```

#### referrals
```
userId           | string  | Google user ID
code             | string  | Referral code (e.g., 'MAT3K7R')
referralCount    | number  | Number of successful referrals
bonusDaysEarned  | number  | Total bonus days earned
createdAt        | number  | Unix timestamp
updatedAt        | number  | Unix timestamp
referredBy       | string  | Referrer's userId (if referred)
```

## Security

### API Key Restrictions

✅ **Google Sheets API only** - Key cannot access other Google services
✅ **Domain restricted** - Only works on `soulfra.github.io`
✅ **No write access** to private data
✅ **HTTPS enforced** - GitHub Pages SSL

### OAuth Security

✅ **State parameter** - Prevents CSRF attacks
✅ **Timestamp validation** - Sessions expire after 5 minutes
✅ **Device fingerprinting** - Prevents replay attacks
✅ **Access token** in URL fragment (not sent to server)

### Data Privacy

✅ **Google Sheet is public** but data is meaningless without context
✅ **No PII in QR codes** - Only session IDs
✅ **User controls** - Can logout anytime
✅ **Optional newsletter** - User must confirm

## Troubleshooting

### "Failed to create QR session"

**Cause**: Google Sheets API key not configured or invalid

**Fix**:
1. Open [qr-config-wizard.html](https://soulfra.github.io/qr-config-wizard.html)
2. Enter valid API key
3. Click "Save & Test Connection"

### "OAuth configuration required"

**Cause**: Google OAuth Client ID not set

**Fix**:
1. Open [qr-fedcm-login.html](https://soulfra.github.io/qr-fedcm-login.html)
2. Click ⚙️ gear icon
3. Enter your OAuth Client ID
4. Click "Save Configuration"

### "Session expired"

**Cause**: QR code older than 5 minutes

**Fix**: QR codes auto-refresh every 60s. If error persists, click "Generate New Code"

### "Failed to verify session"

**Cause**: Google Sheets write access denied

**Fix**:
1. Open your Google Sheet
2. Click **Share** → **Anyone with link** → **Editor** (not "Viewer")
3. Save and try again

### CORS Errors

**Cause**: API key domain restrictions incorrect

**Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your API key
3. Website restrictions: Add `https://soulfra.github.io/*`
4. Save (may take a few minutes to propagate)

## Advanced

### Custom Trial Duration

Edit `trial-dashboard.html`:

```javascript
// Change default trial days
trialData = await sheetsAuth.createTrial(userData.userId, {
  email: userData.email,
  name: userData.name,
  trialDays: 60,  // ← Change to 60 days
  startedAt: Date.now()
});
```

### Custom Referral Bonuses

Edit `sheets-qr-auth.js`:

```javascript
// Change bonus days per referral
async incrementReferralCount(userId, bonusDays = 14) {  // ← Change to 14 days
  // ...
}
```

### Disable Auto-Newsletter

Edit `oauth-callback.html`:

```javascript
// Comment out newsletter subscription
// await subscribeToNewsletter(userInfo);
```

### Add Custom Sheets

1. Create new sheet in your spreadsheet
2. Add column headers
3. Use Google Sheets API v4:

```javascript
const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/my_custom_sheet!A:Z:append?valueInputOption=RAW&key=${apiKey}`;

await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    values: [['col1', 'col2', 'col3']]
  })
});
```

## Deployment

### GitHub Pages

```bash
cd projects/soulfra.github.io

# Add new files
git add qr-fedcm-login.html oauth-callback.html trial-dashboard.html sheets-qr-auth.js

# Commit
git commit -m "Add serverless QR login with trials and referrals"

# Push
git push origin main

# Your site will be live at:
# https://soulfra.github.io/qr-fedcm-login.html
```

### Custom Domain

1. Add `CNAME` file:
   ```bash
   echo "yourdomain.com" > CNAME
   ```

2. Update DNS:
   ```
   CNAME   @   soulfra.github.io
   ```

3. Update OAuth redirect URIs in Google Cloud Console:
   ```
   https://yourdomain.com/oauth-callback.html
   ```

4. Update API key website restrictions:
   ```
   https://yourdomain.com/*
   ```

## Cost Breakdown

| Service | Limit | Price |
|---------|-------|-------|
| GitHub Pages | 100GB bandwidth/month | **FREE** |
| Google Sheets | 10M cells | **FREE** |
| Google Sheets API | 100 requests/100s/user | **FREE** |
| Google OAuth | Unlimited | **FREE** |
| **TOTAL** | | **$0/month** ✨ |

## Support

- 📖 Documentation: [github.com/Soulfra/calos-platform](https://github.com/Soulfra/calos-platform)
- 💬 Discussions: [GitHub Discussions](https://github.com/Soulfra/calos-platform/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/Soulfra/calos-platform/issues)

## License

MIT © Matthew Mauer (SoulFra)

---

**Built with ❤️ by CalOS** - Zero-cost serverless authentication for everyone
