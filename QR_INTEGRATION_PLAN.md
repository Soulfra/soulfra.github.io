# QR Login → Multi-Device Integration Plan

**Goal**: Connect the deployed QR login pages (Google Identity Services) with the existing multi-device federation, device pairing, and notification systems.

## Current State

### What's Working (Deployed)
- ✅ **qr-gis-login.html** - Desktop QR generation with Google Identity Services
- ✅ **qr-scan.html** - iPhone Google Sign-In landing page
- ✅ **trial-dashboard.html** - Trial countdown and referral system
- ✅ **sheets-qr-auth.js** - Google Sheets session management
- ✅ **GIS_SETUP.md** - Complete setup documentation

### What's Disconnected
- ❌ Uses Google Sheets instead of PostgreSQL `user_devices` table
- ❌ No integration with `/lib/device-pairing.js`
- ❌ No device-to-device paging via `/lib/smart-notification-system.js`
- ❌ No WebRTC for device calling
- ❌ No tier-based access control

## Architecture Integration

### Before (Current - Standalone)
```
Desktop (qr-gis-login.html)
  ↓
Google Sheets (qr_sessions)
  ↓
iPhone (qr-scan.html)
  ↓
Trial Dashboard (standalone)
```

### After (Integrated)
```
Desktop (qr-gis-login.html)
  ↓
PostgreSQL + device-pairing.js
  ├─ user_devices table (multi-device federation)
  ├─ device_pairing_sessions table
  └─ user_sessions table (JWT tokens)
  ↓
iPhone (qr-scan.html)
  ↓
Multi-Device Dashboard
  ├─ All paired devices visible
  ├─ Device-to-device paging (smart-notification-system.js)
  ├─ WebRTC calling between devices
  └─ Tier-based features (Community/Pro/Enterprise)
```

## Integration Steps

### Step 1: Backend API for Device Pairing

**Create**: `/api/device-pairing-api.js` (serverless function)

```javascript
// POST /api/pairing/generate-qr
// Called by desktop when QR code is generated
export async function generatePairingQR(req, res) {
  const { userId, deviceFingerprint } = req.body;

  // Use existing device-pairing.js
  const pairingManager = new DevicePairingManager({ db });

  // Find or create source device
  let sourceDevice = await db.query(
    `SELECT device_id FROM user_devices
     WHERE user_id = $1 AND device_fingerprint = $2`,
    [userId, deviceFingerprint]
  );

  if (!sourceDevice.rows.length) {
    // Create new device record
    sourceDevice = await db.query(
      `INSERT INTO user_devices (user_id, device_fingerprint, device_type, trust_level)
       VALUES ($1, $2, 'desktop', 1)
       RETURNING device_id`,
      [userId, deviceFingerprint]
    );
  }

  const sourceDeviceId = sourceDevice.rows[0].device_id;

  // Generate pairing code and QR data
  const { sessionId, pairingCode, qrData, expiresAt } =
    await pairingManager.generatePairingCode(userId, sourceDeviceId);

  return res.json({
    success: true,
    sessionId,
    pairingCode,
    qrData,
    expiresAt
  });
}

// POST /api/pairing/complete
// Called by iPhone after Google Sign-In
export async function completePairing(req, res) {
  const { pairingCode, googleToken, deviceFingerprint, deviceInfo } = req.body;

  // Verify Google token
  const userInfo = await verifyGoogleToken(googleToken);

  // Complete pairing using device-pairing.js
  const pairingManager = new DevicePairingManager({ db });
  const { deviceId, jwt } = await pairingManager.completePairing(
    pairingCode,
    deviceFingerprint,
    {
      ...deviceInfo,
      device_type: 'mobile',
      device_name: `${userInfo.name}'s iPhone`
    }
  );

  return res.json({
    success: true,
    deviceId,
    jwt,
    userInfo
  });
}

// GET /api/pairing/poll/:sessionId
// Called by desktop to check if pairing completed
export async function pollPairingStatus(req, res) {
  const { sessionId } = req.params;

  const session = await db.query(
    `SELECT status, paired_device_id, completed_at
     FROM device_pairing_sessions
     WHERE id = $1`,
    [sessionId]
  );

  if (!session.rows.length) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.json({
    status: session.rows[0].status,
    completed: session.rows[0].status === 'completed',
    deviceId: session.rows[0].paired_device_id,
    completedAt: session.rows[0].completed_at
  });
}
```

### Step 2: Update qr-gis-login.html (Desktop)

**Changes to qr-gis-login.html**:

```javascript
// Replace Google Sheets session creation with backend API
async function generateQRCode() {
  try {
    showState('loading');

    // Get or create user session
    const userData = JSON.parse(localStorage.getItem('calos_session') || '{}');

    // Call backend API to generate pairing QR
    const response = await fetch('/api/pairing/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.userId,
        deviceFingerprint: window.CalOSIdentity?.fingerprint || 'unknown'
      })
    });

    const { sessionId, qrData, expiresAt } = await response.json();

    // Store session ID for polling
    window.pairingSessionId = sessionId;

    // Generate QR code with pairing data
    const qrCanvas = document.getElementById('qrCode');
    await QRCode.toCanvas(qrCanvas, qrData, {
      width: 260,
      margin: 2,
      color: { dark: '#667eea', light: '#ffffff' }
    });

    // Update counter
    document.getElementById('qrCounter').textContent = `QR #${qrCounter}`;

    // Show QR state
    showState('qr');

    // Start polling for verification
    startPolling();

    // Start auto-refresh timer
    startAutoRefresh();

  } catch (error) {
    console.error('[QR Pairing] Error:', error);
    showError(error.message || 'Failed to generate QR code');
  }
}

// Update polling to use backend API
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/pairing/poll/${window.pairingSessionId}`);
      const { completed, deviceId } = await response.json();

      if (completed) {
        clearInterval(pollInterval);
        clearInterval(refreshInterval);
        clearInterval(refreshCountdown);
        handlePairingSuccess(deviceId);
      }
    } catch (error) {
      console.error('[QR Pairing] Poll error:', error);
    }
  }, 2000);
}

// Handle successful pairing
function handlePairingSuccess(deviceId) {
  showState('success');

  console.log('[QR Pairing] Device paired successfully:', deviceId);

  // Redirect to multi-device dashboard
  setTimeout(() => {
    window.location.href = 'multi-device-dashboard.html';
  }, 2000);
}
```

### Step 3: Update qr-scan.html (iPhone)

**Changes to qr-scan.html**:

```javascript
// Parse QR code data
window.addEventListener('load', async () => {
  try {
    // Get pairing data from URL
    const urlParams = new URLSearchParams(window.location.search);
    const qrData = urlParams.get('data'); // Base64 encoded pairing data

    if (!qrData) {
      showError('Invalid QR code. Please scan again.');
      return;
    }

    // Decode pairing data
    const pairingInfo = JSON.parse(atob(qrData));
    window.pairingCode = pairingInfo.code;
    window.sessionId = pairingInfo.sessionId;

    // Check expiry
    if (Date.now() > new Date(pairingInfo.expiresAt).getTime()) {
      showError('QR code expired. Please generate a new one.');
      return;
    }

    // Show sign-in state
    showState('signIn');

    // Initialize Google Identity Services
    if (typeof google !== 'undefined' && google.accounts) {
      initializeGIS();
    } else {
      const checkGIS = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkGIS);
          initializeGIS();
        }
      }, 100);
    }

  } catch (error) {
    console.error('[QR Scan] Initialization error:', error);
    showError(error.message || 'Failed to initialize');
  }
});

// Handle Google credential response
async function handleCredentialResponse(response) {
  try {
    console.log('[QR Scan] Google credential received');

    // Get device fingerprint
    const deviceFingerprint = window.CalOSIdentity?.fingerprint || 'unknown';

    // Get device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    };

    // Complete pairing via backend API
    const pairingResponse = await fetch('/api/pairing/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairingCode: window.pairingCode,
        googleToken: response.credential,
        deviceFingerprint,
        deviceInfo
      })
    });

    const { deviceId, jwt, userInfo } = await pairingResponse.json();

    console.log('[QR Scan] Pairing completed:', deviceId);

    // Store JWT token
    localStorage.setItem('calos_jwt', jwt);
    localStorage.setItem('calos_session', JSON.stringify({
      userId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      deviceId,
      authMethod: 'qr-gis-pairing',
      loginAt: Date.now()
    }));

    // Show success
    document.getElementById('userName').textContent = userInfo.name || userInfo.email;
    showState('success');

    // Auto-close after 3 seconds
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      countdown--;
      document.getElementById('countdown').textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        window.close();
      }
    }, 1000);

  } catch (error) {
    console.error('[QR Scan] Error:', error);
    showError(error.message);
  }
}
```

### Step 4: Create Multi-Device Dashboard

**New File**: `multi-device-dashboard.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Device Dashboard - CalOS</title>
  <style>
    /* Similar styling to trial-dashboard.html */
    .device-card {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 20px;
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .device-info {
      flex: 1;
    }

    .device-actions {
      display: flex;
      gap: 10px;
    }

    .btn-page {
      padding: 10px 20px;
      background: rgba(241,196,15,0.3);
      border: 1px solid rgba(241,196,15,0.5);
      border-radius: 8px;
      color: #f1c40f;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-call {
      padding: 10px 20px;
      background: rgba(46,204,113,0.3);
      border: 1px solid rgba(46,204,113,0.5);
      border-radius: 8px;
      color: #2ecc71;
      cursor: pointer;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔐 Multi-Device Dashboard</h1>
      <p class="subtitle">Manage all your paired devices</p>
    </header>

    <div class="dashboard-card">
      <h2>Your Devices</h2>
      <div id="devicesList"></div>

      <button onclick="pairNewDevice()" class="cta">+ Pair New Device</button>
    </div>

    <div class="dashboard-card">
      <h2>Trial Status</h2>
      <div id="trialInfo"></div>
    </div>
  </div>

  <script src="identity-tracker.js"></script>
  <script>
    let devices = [];
    let userData = null;

    // Load user session
    window.addEventListener('load', async () => {
      const session = localStorage.getItem('calos_session');
      if (!session) {
        window.location.href = 'qr-gis-login.html';
        return;
      }

      userData = JSON.parse(session);
      await loadDevices();
      await loadTrialInfo();
    });

    // Load all paired devices
    async function loadDevices() {
      const jwt = localStorage.getItem('calos_jwt');

      const response = await fetch('/api/devices/list', {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      devices = await response.json();
      renderDevices();
    }

    // Render device list
    function renderDevices() {
      const container = document.getElementById('devicesList');
      container.innerHTML = '';

      devices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'device-card';

        const deviceIcon = device.device_type === 'mobile' ? '📱' : '💻';
        const trustBadge = device.trust_level === 2 ? '✓ Trusted' :
                          device.trust_level === 1 ? '~ Verified' : '? Unverified';

        card.innerHTML = `
          <div class="device-info">
            <div style="font-size: 2rem;">${deviceIcon}</div>
            <strong>${device.device_name}</strong>
            <div style="font-size: 0.9rem; opacity: 0.8;">
              ${device.device_type} • ${trustBadge}
            </div>
          </div>
          <div class="device-actions">
            <button class="btn-page" onclick="pageDevice('${device.device_id}')">
              📢 Page
            </button>
            <button class="btn-call" onclick="callDevice('${device.device_id}')">
              📞 Call
            </button>
          </div>
        `;

        container.appendChild(card);
      });
    }

    // Page a device (notification flood)
    async function pageDevice(deviceId) {
      const jwt = localStorage.getItem('calos_jwt');

      await fetch('/api/notifications/page', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetDeviceId: deviceId,
          message: 'Someone is trying to reach you!',
          mode: 'brick' // BRICK mode from smart-notification-system.js
        })
      });

      alert('📢 Device paged! They should get notifications now.');
    }

    // Call a device (WebRTC)
    async function callDevice(deviceId) {
      // Initialize WebRTC call
      window.location.href = `webrtc-call.html?target=${deviceId}`;
    }

    // Pair new device
    function pairNewDevice() {
      window.location.href = 'qr-gis-login.html';
    }

    // Load trial info
    async function loadTrialInfo() {
      const jwt = localStorage.getItem('calos_jwt');

      const response = await fetch('/api/trials/status', {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      const trial = await response.json();

      const container = document.getElementById('trialInfo');
      const daysLeft = Math.max(0, trial.trialDays + trial.bonusDays -
        Math.floor((Date.now() - trial.startedAt) / (1000 * 60 * 60 * 24)));

      container.innerHTML = `
        <div style="font-size: 1.2rem; margin-bottom: 10px;">
          <strong>${daysLeft} days</strong> remaining
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(daysLeft / (trial.trialDays + trial.bonusDays)) * 100}%"></div>
        </div>
        <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">
          Trial: ${trial.trialDays} days + Bonus: ${trial.bonusDays} days
        </div>
      `;
    }
  </script>
</body>
</html>
```

### Step 5: Device-to-Device Paging API

**Create**: `/api/notifications-api.js`

```javascript
import { SmartNotificationSystem } from '../lib/smart-notification-system.js';

const notificationSystem = new SmartNotificationSystem();

// POST /api/notifications/page
// Send notification to specific device
export async function pageDevice(req, res) {
  const { targetDeviceId, message, mode = 'important' } = req.body;
  const jwt = req.headers.authorization?.replace('Bearer ', '');

  // Verify JWT and get source user/device
  const sourceUser = await verifyJWT(jwt);

  // Verify target device belongs to same user
  const targetDevice = await db.query(
    `SELECT user_id FROM user_devices WHERE device_id = $1`,
    [targetDeviceId]
  );

  if (targetDevice.rows[0].user_id !== sourceUser.userId) {
    return res.status(403).json({ error: 'Cannot page devices from other users' });
  }

  // Send notification using smart notification system
  if (mode === 'brick') {
    // BRICK mode - consensual notification flooding
    await notificationSystem.brick(sourceUser.userId, message, 60000);
  } else {
    // Normal notification
    await notificationSystem.sendToDevice(targetDeviceId, message, { mode });
  }

  return res.json({ success: true });
}
```

### Step 6: WebRTC Device Calling

**Create**: `webrtc-call.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Device Call - CalOS</title>
  <style>
    video {
      width: 100%;
      max-width: 640px;
      border-radius: 12px;
      background: #000;
    }

    .call-controls {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin: 20px 0;
    }

    .btn-end-call {
      padding: 15px 40px;
      background: rgba(231,76,60,0.3);
      border: 2px solid rgba(231,76,60,0.5);
      border-radius: 50px;
      color: #e74c3c;
      font-weight: 600;
      font-size: 1.1rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📞 Device Call</h1>

    <div id="callStatus">Connecting...</div>

    <video id="localVideo" autoplay muted></video>
    <video id="remoteVideo" autoplay></video>

    <div class="call-controls">
      <button class="btn-end-call" onclick="endCall()">End Call</button>
    </div>
  </div>

  <script>
    let peerConnection = null;
    let localStream = null;
    let targetDeviceId = null;

    // WebRTC configuration
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    window.addEventListener('load', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      targetDeviceId = urlParams.get('target');

      if (!targetDeviceId) {
        alert('No target device specified');
        return;
      }

      await initializeCall();
    });

    async function initializeCall() {
      try {
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        document.getElementById('localVideo').srcObject = localStream;

        // Create peer connection
        peerConnection = new RTCPeerConnection(rtcConfig);

        // Add local stream to connection
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          document.getElementById('remoteVideo').srcObject = event.streams[0];
          document.getElementById('callStatus').textContent = 'Connected';
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = async (event) => {
          if (event.candidate) {
            // Send ICE candidate to target device via API
            await sendSignaling('ice-candidate', event.candidate);
          }
        };

        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send offer to target device
        await sendSignaling('offer', offer);

        // Start listening for answer
        pollForAnswer();

      } catch (error) {
        console.error('[WebRTC] Error:', error);
        alert('Failed to initialize call: ' + error.message);
      }
    }

    // Send signaling data to target device
    async function sendSignaling(type, data) {
      const jwt = localStorage.getItem('calos_jwt');

      await fetch('/api/webrtc/signal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetDeviceId,
          type,
          data
        })
      });
    }

    // Poll for answer from target device
    async function pollForAnswer() {
      const jwt = localStorage.getItem('calos_jwt');

      const interval = setInterval(async () => {
        const response = await fetch(`/api/webrtc/poll/${targetDeviceId}`, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });

        const signals = await response.json();

        for (const signal of signals) {
          if (signal.type === 'answer') {
            clearInterval(interval);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
          } else if (signal.type === 'ice-candidate') {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
          }
        }
      }, 1000);
    }

    // End call
    function endCall() {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      window.close();
    }
  </script>
</body>
</html>
```

### Step 7: Tier-Based Access Control

**Add to all API endpoints**:

```javascript
// Middleware to check tier limits
async function checkTierLimits(req, res, next) {
  const jwt = req.headers.authorization?.replace('Bearer ', '');
  const user = await verifyJWT(jwt);

  // Get user's tier from database
  const tierInfo = await db.query(
    `SELECT tier, devices_limit FROM user_tiers WHERE user_id = $1`,
    [user.userId]
  );

  const tier = tierInfo.rows[0]?.tier || 'community';

  // Tier limits
  const limits = {
    community: { devices: 2, calling: false, paging: true },
    pro: { devices: 10, calling: true, paging: true },
    enterprise: { devices: 999, calling: true, paging: true }
  };

  req.userTier = tier;
  req.tierLimits = limits[tier];

  next();
}

// Example: Restrict WebRTC calling to Pro+ tiers
export async function initiateCall(req, res) {
  if (!req.tierLimits.calling) {
    return res.status(403).json({
      error: 'Device calling requires Pro or Enterprise tier',
      upgrade: 'https://soulfra.github.io/pricing.html'
    });
  }

  // Proceed with call...
}
```

## Migration Path

### Phase 1: Hybrid Mode (Keep Google Sheets)
1. Deploy backend APIs alongside existing Sheets
2. Add device pairing endpoints
3. Keep trial/referral system in Sheets
4. Test with small group

### Phase 2: Database Migration
1. Migrate qr_sessions → device_pairing_sessions table
2. Migrate trials → user_trials table
3. Migrate referrals → user_referrals table
4. Keep Sheets as backup for 30 days

### Phase 3: Full Integration
1. Enable device-to-device paging
2. Add WebRTC calling
3. Implement tier-based limits
4. Remove Google Sheets dependency

## Testing Checklist

- [ ] Desktop generates QR code using device-pairing API
- [ ] iPhone scans QR and completes Google Sign-In
- [ ] Device pairing creates records in user_devices table
- [ ] Desktop detects pairing completion via polling
- [ ] Both devices can see each other in multi-device dashboard
- [ ] "Page" button sends BRICK notifications to target device
- [ ] "Call" button initiates WebRTC connection
- [ ] Video/audio works between devices on same WiFi
- [ ] Tier limits enforced (Community = 2 devices, no calling)
- [ ] Pro tier enables calling feature
- [ ] Trial countdown shows on dashboard
- [ ] Referral system awards bonus days

## Security Considerations

1. **JWT Token Security**
   - Short expiration (24 hours)
   - Refresh tokens for long-term sessions
   - Device fingerprint validation

2. **WebRTC Security**
   - STUN only (no TURN server = no relay through cloud)
   - Local network only for privacy
   - End-to-end encrypted by default

3. **Notification Security**
   - Only allow paging own devices
   - Rate limit BRICK mode (max 1/minute)
   - User must consent to BRICK mode

4. **Tier Enforcement**
   - Backend validation (not client-side)
   - Check tier on every API call
   - Graceful degradation

## Next Steps

1. **Backend Setup**
   - Set up serverless functions (Vercel/Netlify)
   - Connect to PostgreSQL (Supabase/Neon)
   - Deploy device-pairing API

2. **Frontend Updates**
   - Modify qr-gis-login.html to use new API
   - Modify qr-scan.html to use new API
   - Create multi-device-dashboard.html
   - Create webrtc-call.html

3. **Testing**
   - Test pairing flow (desktop + iPhone)
   - Test paging (BRICK mode notifications)
   - Test calling (WebRTC on WiFi)
   - Test tier limits

4. **Documentation**
   - Update GIS_SETUP.md with new flow
   - Create WEBRTC_CALLING_GUIDE.md
   - Create MULTI_DEVICE_PAGING_GUIDE.md

---

**Built with ❤️ by CalOS** - Teaching the system to connect devices like a private pager network
