# Fix: Add One Tap Auto-Login

## Problem
User wants Cal to auto-login using Chrome saved Google accounts instead of requiring manual button click.

## Solution
Enable Google One Tap + auto_select in `auth-google.html`

---

## Fix for auth-google.html

### Find this code (around line 196):

```javascript
// Initialize Google OAuth
async function initGoogleAuth() {
  try {
    const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

    googleAuth = new GoogleOAuth({
      clientId: CLIENT_ID,
      sheets: SHEETS_CONFIG
    });

    await googleAuth.init();

    // Render Google button
    googleAuth.renderButton('g_id_signin');
```

### Replace with:

```javascript
// Initialize Google OAuth
async function initGoogleAuth() {
  try {
    const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

    googleAuth = new GoogleOAuth({
      clientId: CLIENT_ID,
      sheets: SHEETS_CONFIG
    });

    await googleAuth.init();

    // Enable auto-login (One Tap)
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: true,  // Auto-login if user has one account
        cancel_on_tap_outside: false,
        itp_support: true  // Support Safari ITP
      });

      // Show One Tap prompt (auto-appears if logged in to Google)
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap not shown - fall back to manual button
          console.log('[Auth] One Tap not available, showing button');
        } else {
          // One Tap is showing - hide manual button
          console.log('[Auth] One Tap is showing');
        }
      });
    }

    // Also render manual button as fallback
    googleAuth.renderButton('g_id_signin');
```

### Add this callback function:

```javascript
// Handle One Tap response
function handleGoogleResponse(response) {
  console.log('[Auth] Google One Tap response received');

  // This will be handled by GoogleOAuth._handleCredentialResponse
  // which is already wired up
  if (window.onGoogleLoginSuccess) {
    // Decode JWT
    const user = googleAuth._parseJwt(response.credential);
    window.onGoogleLoginSuccess(user);
  }
}
```

---

## How It Works

### Before (Manual Only):
1. User visits auth-google.html
2. Sees "Sign in with Google" button
3. Must click button
4. Google popup appears
5. User selects account
6. Logged in

### After (One Tap Auto):
1. User visits auth-google.html
2. **One Tap appears automatically** (if logged in to Chrome)
3. User clicks account in One Tap → Logged in instantly
4. OR user dismisses One Tap → Manual button still available
5. OR One Tap not available → Manual button works

---

## What is One Tap?

**Google One Tap** is a small popup that appears in the top-right of the page:

```
┌──────────────────────────────┐
│  Sign in with Google         │
│  ┌────────────────────┐      │
│  │ 👤 matt@gmail.com  │ →   │
│  └────────────────────┘      │
│  Continue as Matt            │
└──────────────────────────────┘
```

**Benefits:**
- Auto-appears if user is logged in to Chrome
- One-click login (no popup window)
- Falls back to manual button if not available
- Works on mobile + desktop

---

## Testing

### Test Auto-Login:
1. Make sure you're logged in to Google in Chrome
2. Open `auth-google.html`
3. One Tap should appear in top-right corner
4. Click your account
5. Should auto-login without seeing button

### Test Fallback (Manual Button):
1. Open `auth-google.html` in Incognito mode
2. One Tap won't appear (not logged in)
3. Manual button should still work
4. Click button → Google popup → Login

---

## Options You Can Configure

```javascript
google.accounts.id.initialize({
  client_id: CLIENT_ID,

  // Auto-login settings
  auto_select: true,              // Auto-login if ONE Google account
  cancel_on_tap_outside: false,   // Don't hide One Tap if user clicks elsewhere
  itp_support: true,              // Support Safari Intelligent Tracking Prevention

  // Appearance
  prompt_parent_id: 'g_id_onload', // Where to show One Tap

  // Advanced
  ux_mode: 'popup',               // popup | redirect
  login_uri: 'https://...',       // For redirect mode
  state_cookie_domain: '',        // For multi-domain
});
```

---

## Auto-Select Behavior

**`auto_select: true` means:**
- If user has ONE Google account in Chrome → Auto-login without confirmation
- If user has MULTIPLE accounts → Show account picker
- If user is NOT logged in → Show manual button

**`auto_select: false` means:**
- Always show account picker (even if one account)
- More secure but less convenient

**Recommendation:** Use `auto_select: true` for better UX

---

## Privacy Note

One Tap respects user privacy:
- Only works if user previously logged in to your site with Google
- User can disable One Tap in Google settings
- User can dismiss One Tap (it won't appear again for 2 weeks)
- Manual button always available as fallback

---

## Troubleshooting

**One Tap not appearing:**
- Make sure you're logged in to Google in your browser
- Check browser console for errors
- One Tap requires HTTPS (won't work on `http://localhost`)
- Test on GitHub Pages (HTTPS)

**Auto-select not working:**
- User might have multiple Google accounts
- User might have dismissed One Tap previously
- Check `auto_select: true` is set

**Still shows manual button even when One Tap works:**
- This is correct! Manual button is fallback
- You can hide it with CSS if One Tap is showing:

```javascript
google.accounts.id.prompt((notification) => {
  if (!notification.isNotDisplayed()) {
    // One Tap is showing - hide manual button
    document.getElementById('g_id_signin').style.display = 'none';
  }
});
```

---

**This makes "Cal auto-login" as close to automatic as possible without violating browser security.**
