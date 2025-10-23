# QR Login Setup Guide

**Serverless QR authentication using Google Sheets** - No backend server needed!

## For Open Source Users (Browser Setup)

**NEW!** No coding required - configure directly in the browser:

```
1. Open: https://soulfra.github.io/qr-config-wizard.html
2. Follow the 3-step wizard
3. Done! Your QR login is ready
```

The wizard will:
- ✅ Guide you through creating a Google Sheet
- ✅ Help you get a free Google API key
- ✅ Test the connection automatically
- ✅ Save config to your browser (no server needed)

**How it works:**
- Your credentials are stored in browser `localStorage`
- Works on ANY GitHub Pages fork (no hardcoded keys)
- Each user maintains their own Google Sheet
- 100% free - no backend server required

## For Developers (Automated CLI Setup)

```bash
# Run automated setup wizard
npm run qr:setup
```

The wizard will:
1. ✅ Detect existing Google OAuth credentials
2. ✅ Reuse Gmail webhook Google Sheets setup
3. ✅ Auto-create QR sessions sheet
4. ✅ Inject credentials into HTML files
5. ✅ Auto-deploy to GitHub Pages

## Manual Setup

If you prefer manual setup or the wizard fails:

### 1. Create Google Sheet

1. Go to https://sheets.google.com
2. Create new spreadsheet
3. Name it: "CalOS QR Sessions"
4. Copy the Spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123XYZ.../edit
                                              ^^^^^^^^^
                                         This is the ID
   ```
5. Share → "Anyone with link" → "Editor"

### 2. Add QR Sessions Sheet

Create a new sheet named `qr_sessions` with these columns:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| sessionId | status | createdAt | expiresAt | desktopFingerprint | phoneFingerprint | verified | userId | verifiedAt |

### 3. Create Google API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API key"
3. Click "Restrict Key"
4. Under "API restrictions":
   - Select "Restrict key"
   - Check "Google Sheets API"
5. Under "Website restrictions":
   - Add: `https://soulfra.github.io/*`
6. Click "Save"
7. Copy the API key

### 4. Update Configuration Files

Edit these files in `projects/soulfra.github.io/`:

**qr-login-gist.html** (line ~295):
```javascript
sheetsAuth = new SheetsQRAuth({
  spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',  // Replace this
  apiKey: 'YOUR_GOOGLE_API_KEY_HERE'          // Replace this
});
```

**qr-scanner-gist.html** (line ~315):
```javascript
sheetsAuth = new SheetsQRAuth({
  spreadsheetId: qrData.spreadsheetId,
  sheetName: qrData.sheetName || 'qr_sessions',
  apiKey: 'YOUR_GOOGLE_API_KEY_HERE'          // Replace this
});
```

**sheets-qr-auth.js** (line ~34):
```javascript
this.spreadsheetId = config.spreadsheetId || 'YOUR_SPREADSHEET_ID_HERE';  // Replace this
this.apiKey = config.apiKey || 'YOUR_GOOGLE_API_KEY';                     // Replace this
```

### 5. Deploy to GitHub Pages

```bash
cd projects/soulfra.github.io
git add qr-login-gist.html qr-scanner-gist.html sheets-qr-auth.js
git commit -m "Configure QR login with Google Sheets"
git push origin main
```

## Testing

```bash
# Open QR login page
npm run qr:test

# Or manually:
open https://soulfra.github.io/qr-login-gist.html
```

## How It Works

### Desktop Flow (qr-login-gist.html)
1. User opens https://soulfra.github.io/qr-login-gist.html
2. JavaScript creates row in Google Sheets:
   ```javascript
   {
     sessionId: "abc123",
     status: "pending",
     createdAt: 1234567890,
     expiresAt: 1234567890 + 300000, // 5 min
     desktopFingerprint: "device-hash",
     verified: false
   }
   ```
3. QR code generated with:
   ```json
   {
     "type": "calos-qr-login",
     "spreadsheetId": "1ABC123...",
     "sessionId": "abc123",
     "expiresAt": 1234567890
   }
   ```
4. Desktop polls Google Sheets every 2s checking if `verified === true`

### iPhone Flow (qr-scanner-gist.html)
1. User scans QR code with iPhone camera
2. Opens https://soulfra.github.io/qr-scanner-gist.html?qr={payload}
3. JavaScript updates Google Sheets row:
   ```javascript
   {
     status: "verified",
     verified: true,
     phoneFingerprint: "iphone-hash",
     userId: "user123",
     verifiedAt: 1234567890
   }
   ```
4. Shows success message, auto-closes after 3s

### Desktop Completes
1. Desktop polling detects `verified === true`
2. Shows success message
3. Stores session in localStorage
4. Redirects to dashboard

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static)                    │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │  qr-login-gist.html    │  │  qr-scanner-gist.html      │ │
│  │  (Desktop)             │  │  (iPhone)                  │ │
│  └───────┬────────────────┘  └────────────┬───────────────┘ │
└──────────┼─────────────────────────────────┼─────────────────┘
           │                                 │
           │ Create row                      │ Update row
           │ Poll for changes                │ Set verified=true
           ▼                                 ▼
    ┌──────────────────────────────────────────────────────┐
    │           Google Sheets (Free Database)              │
    │  ┌────────────────────────────────────────────────┐  │
    │  │  qr_sessions sheet                             │  │
    │  │  ┌───────────┬────────┬──────────┬──────────┐  │  │
    │  │  │ sessionId │ status │ verified │ userId   │  │  │
    │  │  ├───────────┼────────┼──────────┼──────────┤  │  │
    │  │  │ abc123    │ verified│ true    │ user123  │  │  │
    │  │  └───────────┴────────┴──────────┴──────────┘  │  │
    │  └────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────┘
```

## Security

- ✅ **Sessions expire after 5 minutes**
- ✅ **Device fingerprinting** prevents replay attacks
- ✅ **Public Google Sheet** but data meaningless without context
- ✅ **API key restricted** to soulfra.github.io domain
- ✅ **HTTPS only** - GitHub Pages enforces SSL

## Troubleshooting

### "Failed to insert row"
- Check API key has Google Sheets API enabled
- Check spreadsheet is shared "Anyone with link → Editor"
- Check API key domain restrictions include `soulfra.github.io`

### "Session not found"
- Session may have expired (5 min timeout)
- Clear browser cache and try again
- Check Google Sheet has `qr_sessions` sheet

### "CORS error"
- API key must have website restrictions set
- Use `https://soulfra.github.io/*` in restrictions
- Don't use IP address restrictions

## Advanced

### Using Existing Gmail Webhook Sheet

If you've already set up Gmail webhook with Google Sheets:

```bash
# The wizard will automatically detect and reuse your sheet
npm run qr:setup

# Or manually reuse the same spreadsheet ID from .env:
cat .env | grep GOOGLE_SHEETS_DB_ID
```

### Custom Configuration

Create `.qr-login.config.js`:

```javascript
module.exports = {
  spreadsheetId: process.env.GOOGLE_SHEETS_DB_ID,
  sheetName: 'custom_qr_sessions',
  sessionTimeout: 10 * 60 * 1000, // 10 minutes
  pollInterval: 1000 // Poll every 1s (faster)
};
```

## API Reference

See `sheets-qr-auth.js` for full API documentation.

### SheetsQRAuth Methods

```javascript
const auth = new SheetsQRAuth({
  spreadsheetId: '1ABC123...',
  sheetName: 'qr_sessions',
  apiKey: 'AIza...'
});

// Desktop: Create session
const session = await auth.createSession(deviceFingerprint);
// Returns: { sessionId, qrPayload, expiresAt, sheetUrl }

// iPhone: Verify session
const result = await auth.verifySession(sessionId, phoneFingerprint, userId);
// Returns: { success: true, sessionId, userId }

// Desktop: Poll for verification
const status = await auth.pollForVerification(sessionId);
// Returns: { verified: true, session: {...} }
```

## Support

- 📖 Documentation: https://github.com/Soulfra/calos-platform
- 💬 Discussions: https://github.com/Soulfra/calos-platform/discussions
- 🐛 Issues: https://github.com/Soulfra/calos-platform/issues

## License

MIT © Matthew Mauer (SoulFra)
