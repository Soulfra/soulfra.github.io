# Google OAuth Setup Guide (2 Minutes)

Get "Sign in with Google" working on your site in 2 minutes.

---

## Step 1: Get Google Client ID (90 seconds)

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com
- Sign in with your Google account

### 2. Create Project (if you don't have one)
- Click **Select a project** (top left)
- Click **NEW PROJECT**
- Name: `Soulfra Auth`
- Click **CREATE**

### 3. Enable Google Identity Services
- In your project, go to **APIs & Services** → **Enabled APIs & services**
- Click **+ ENABLE APIS AND SERVICES**
- Search for: `Google Identity Services`
- Click **ENABLE**

### 4. Create OAuth Client ID
- Go to **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **OAuth client ID**
- If prompted, configure OAuth consent screen first:
  - User Type: **External**
  - App name: `Soulfra`
  - User support email: Your email
  - Developer contact: Your email
  - Click **SAVE AND CONTINUE**
  - Scopes: Skip for now
  - Test users: Add your email
  - Click **SAVE AND CONTINUE**

Back to creating OAuth Client ID:
- Application type: **Web application**
- Name: `Soulfra Web Client`
- Authorized JavaScript origins:
  - `https://soulfra.github.io`
  - `http://localhost:8000` (for local testing)
- Authorized redirect URIs:
  - `https://soulfra.github.io/auth-google.html`
  - `http://localhost:8000/auth-google.html`
- Click **CREATE**

### 5. Copy Client ID
- You'll see a popup with your Client ID
- Looks like: `123456789-abc123def456.apps.googleusercontent.com`
- **Copy this** - you'll need it in Step 2

---

## Step 2: Add Client ID to Your Site (30 seconds)

### 1. Open `auth-google.html`

Find this line (around line 177):
```javascript
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
```

Replace with your actual Client ID:
```javascript
const CLIENT_ID = '123456789-abc123def456.apps.googleusercontent.com';
```

### 2. (Optional) Add Google Sheets Config

If you want to save users to Google Sheets, also update:
```javascript
const SHEETS_CONFIG = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID',  // From your Google Sheet URL
  apiKey: 'YOUR_API_KEY'                 // From Google Cloud Console
};
```

If you don't have a Google Sheets database yet, you can skip this. Users will still be saved to localStorage.

### 3. Save the file

---

## Step 3: Test It (30 seconds)

### Option A: Test Locally (Recommended)

1. Start a local server:
```bash
# If you have Python:
python3 -m http.server 8000

# Or if you have Node.js:
npx http-server -p 8000
```

2. Open browser: `http://localhost:8000/auth-google.html`

3. Click "Sign in with Google" button

4. You should see Google's auth popup

5. Sign in with your Google account

6. You should be redirected to `index.html` (or whatever redirect URL you set)

7. Check browser console - you should see:
```
[GoogleOAuth] Login successful: your-email@gmail.com
```

8. Check localStorage:
```javascript
localStorage.getItem('soulfra_google_user')
// Should return JSON with your user data
```

### Option B: Test on GitHub Pages

1. Push to GitHub:
```bash
git add auth-google.html lib/google-oauth.js
git commit -m "Add Google OAuth"
git push
```

2. Wait 1-2 minutes for GitHub Pages to deploy

3. Visit: `https://YOUR_USERNAME.github.io/auth-google.html`

4. Click "Sign in with Google"

5. Done!

---

## Step 4: (Optional) Setup Google Sheets Database

If you want to save users to Google Sheets instead of just localStorage:

### 1. Create Google Sheet
- Go to: https://sheets.google.com
- Create new spreadsheet
- Name it: `Soulfra Users`
- Create tab: `users`
- Add header row:
  ```
  userId | email | name | picture | googleId | createdAt | lastLogin | source
  ```

### 2. Get Spreadsheet ID
- From URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
- Copy the `SPREADSHEET_ID` part

### 3. Get API Key
- Go to Google Cloud Console → **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **API key**
- Copy the API key
- (Optional) Restrict key:
  - API restrictions → **Google Sheets API**
  - Website restrictions → Your domain

### 4. Make Sheet Public (Read)
- In Google Sheets, click **Share**
- Change access: **Anyone with the link** → **Viewer**
- This allows the API key to read/write

### 5. Update `auth-google.html`
```javascript
const SHEETS_CONFIG = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  apiKey: 'YOUR_API_KEY'
};
```

Now when users sign in, they'll be saved to both localStorage AND Google Sheets!

---

## Troubleshooting

### "Sign in with Google" button not showing
- Check browser console for errors
- Make sure Google script loaded: `<script src="https://accounts.google.com/gsi/client">`
- Make sure Client ID is correct
- Try hard refresh (Cmd+Shift+R)

### "redirect_uri_mismatch" error
- Your current URL is not in "Authorized redirect URIs"
- Go back to Google Cloud Console → Credentials
- Add your current URL to Authorized redirect URIs
- Example: `https://soulfra.github.io/auth-google.html`

### Users not saving to Google Sheets
- Check Spreadsheet ID is correct
- Check API Key is correct
- Make sure Sheet is shared ("Anyone with link" can view)
- Check browser console for API errors

### "Access blocked: This app's request is invalid"
- OAuth consent screen not configured
- Go to Google Cloud Console → **OAuth consent screen**
- Fill out required fields (App name, email, etc.)
- Add your email as test user
- Save and try again

---

## Cost: $0

- Google Identity Services: **Free**
- Google Sheets API: **Free** (up to 500 requests/100 seconds)
- Google Cloud Console: **Free** (for auth)

No credit card required!

---

## Security Notes

### What's Stored:
- **localStorage:** User email, name, picture, login timestamp
- **Google Sheets:** Same data (if configured)
- **NOT stored:** Google password, access tokens (handled by Google)

### Privacy:
- OAuth flow happens on Google's servers (secure)
- Your site only receives: email, name, picture
- No password ever touches your site
- User can revoke access anytime: https://myaccount.google.com/permissions

### Sessions:
- Auto-logout after 30 days
- User can manually logout anytime
- localStorage cleared on logout

---

## Next Steps

### Phase 1: Basic Login (Done!)
- ✅ Google OAuth working
- ✅ Users saved to localStorage
- ✅ (Optional) Users saved to Sheets

### Phase 2: Protect Pages
Add login check to other pages:

```html
<!-- At top of index.html, funding-grid.html, etc. -->
<script src="lib/google-oauth.js"></script>
<script>
// Check if logged in
const auth = new GoogleOAuth({ clientId: 'YOUR_CLIENT_ID' });

if (!auth.isAuthenticated()) {
  // Not logged in - redirect to auth page
  window.location.href = 'auth-google.html?redirect=' + window.location.pathname;
}

// Logged in - show user info
const user = auth.getCurrentUser();
console.log('Welcome,', user.name);
</script>
```

### Phase 3: User Dashboard
Show logged-in user:

```html
<div class="user-menu">
  <img id="userPicture" src="" alt="Profile">
  <span id="userName"></span>
  <button onclick="logout()">Logout</button>
</div>

<script>
const user = auth.getCurrentUser();
document.getElementById('userName').textContent = user.name;
document.getElementById('userPicture').src = user.picture;

function logout() {
  auth.logout();
  window.location.href = 'auth-google.html';
}
</script>
```

---

## FAQ

**Q: Do I need a backend server?**
A: No! Google OAuth works client-side. Google Sheets acts as your database.

**Q: Can users sign in with email/password instead?**
A: Yes, but you'd need to build that separately. Google OAuth is simpler and more secure.

**Q: Can I use this for mobile apps?**
A: This is for web only. For mobile, use Google Sign-In SDKs for iOS/Android.

**Q: What if Google is blocked (China, etc.)?**
A: Fall back to Ed25519 auth (the existing `auth.html` page).

**Q: How many users can I support?**
A: localStorage: Unlimited per device. Google Sheets: 5M cells (about 500K users).

---

**Built by:** Matt Mauer (@Soulfra)
**Questions?** matt@soulfra.com
**Source:** https://github.com/Soulfra
