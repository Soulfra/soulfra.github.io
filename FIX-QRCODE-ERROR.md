# Fix: QRCode is not defined

## Problem
`index.html` line 749 tries to use `QRCode.toCanvas()` before the CDN library finishes loading.

## Solution
Add a check + wait for QRCode library to load before calling it.

---

## Fix for index.html

### Find this code (around line 737):

```javascript
// Generate QR code with session URL
async function generateQRCode() {
  try {
    showState('loading');

    // Generate unique session ID
    sessionId = crypto.randomUUID();

    // Build session URL (phone will open this)
    const sessionUrl = `${window.location.origin}/soulfra-auth.html?session=${sessionId}`;

    // Generate QR code
    const qrCanvas = document.getElementById('qrCode');
    await QRCode.toCanvas(qrCanvas, sessionUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#3498db',
        light: '#ffffff'
      }
    });
```

### Replace with:

```javascript
// Generate QR code with session URL
async function generateQRCode() {
  try {
    showState('loading');

    // Generate unique session ID
    sessionId = crypto.randomUUID();

    // Build session URL (phone will open this)
    const sessionUrl = `${window.location.origin}/soulfra-auth.html?session=${sessionId}`;

    // Wait for QRCode library to load
    await waitForQRCode();

    // Generate QR code
    const qrCanvas = document.getElementById('qrCode');
    await QRCode.toCanvas(qrCanvas, sessionUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#3498db',
        light: '#ffffff'
      }
    });
```

### Add this helper function (anywhere in the <script> section):

```javascript
// Wait for QRCode library to load from CDN
function waitForQRCode() {
  return new Promise((resolve, reject) => {
    // Already loaded?
    if (typeof QRCode !== 'undefined') {
      resolve();
      return;
    }

    // Wait for it (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds

    const checkInterval = setInterval(() => {
      if (typeof QRCode !== 'undefined') {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('QRCode library failed to load'));
      }
      attempts++;
    }, 100);
  });
}
```

---

## Alternative: Simpler Fix

If you don't want to add a helper function, just add this check at the top of `generateQRCode()`:

```javascript
async function generateQRCode() {
  // Check if QRCode library loaded
  if (typeof QRCode === 'undefined') {
    showError('QR code library not loaded. Please refresh the page.');
    return;
  }

  try {
    // ... rest of function
```

---

## Test

1. Open `index.html`
2. Open browser console
3. Should NOT see "QRCode is not defined"
4. QR code should generate successfully

---

## Why This Happened

The CDN script loads async:
```html
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
```

But your JavaScript runs immediately and might call `generateQRCode()` before the CDN finishes.

**Solutions:**
1. Wait for library (recommended - above fix)
2. Make script blocking: Remove `async/defer`
3. Bundle QRCode library locally (no CDN dependency)

---

**Choose Option 1 (waitForQRCode helper) - most robust.**
