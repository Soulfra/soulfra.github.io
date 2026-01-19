# Multi-Domain Login System

**Your Question:** "How can we build a login system that works across all my domains?"

**Short Answer:** Central auth server + JWT tokens + database session sharing

---

## The Problem

You have multiple domains:
- `deathtodata.com`
- `soulfra.com`
- Others...

**You want:** Login once → access all domains

**This is called:** Single Sign-On (SSO)

---

## How Big Companies Do It

**Google:**
- Login at `accounts.google.com`
- Access Gmail, YouTube, Drive, etc.
- One login, all Google services

**Your Version:**
- Login at `auth.soulfra.com` (or `auth.deathtodata.com`)
- Access deathtodata.com, soulfra.com, etc.
- One login, all your domains

---

## The Architecture

### Option 1: Central Auth Server (Recommended)

```
User visits deathtodata.com
  ↓
Not logged in? → Redirect to auth.soulfra.com
  ↓
Login form at auth.soulfra.com
  ↓
Verify credentials (check database)
  ↓
Generate JWT token
  ↓
Redirect back to deathtodata.com with token
  ↓
deathtodata.com verifies token
  ↓
User logged in!

Now visit soulfra.com:
  ↓
Check JWT token (still valid?)
  ↓
User already logged in!
```

**Key Components:**
1. **Auth Server** (`auth.soulfra.com`) - Handles all login/logout
2. **JWT Tokens** - Cryptographically signed session IDs
3. **Shared Database** - All domains check same user table
4. **Token Verification** - Each domain verifies tokens independently

---

## Database Schema

### users table (already have this)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),  -- bcrypt hash
  created_at TIMESTAMP,
  last_login TIMESTAMP
);
```

### sessions table (NEW - for multi-domain)
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token VARCHAR(500) NOT NULL,  -- JWT token
  domain VARCHAR(255),           -- Which domain issued it
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### api_keys table (OPTIONAL - for programmatic access)
```sql
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  key_hash VARCHAR(255),
  name VARCHAR(100),           -- "My API Key"
  scopes TEXT,                 -- JSON: ["read", "write"]
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Implementation Steps

### Step 1: Create Auth Server

**New File:** `api/auth-server.js`

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/sqliteClient');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const TOKEN_EXPIRY = '7d'; // 7 days

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  // Store session in database
  await db.query(
    `INSERT INTO sessions (user_id, token, domain, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', '+7 days'))`,
    [user.id, token, req.get('host'), req.ip, req.get('user-agent')]
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

// Verify token endpoint (other domains call this)
app.post('/auth/verify', async (req, res) => {
  const { token } = req.body;

  try {
    // Verify JWT signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists in database
    const result = await db.query(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Update last_used_at
    await db.query(
      'UPDATE sessions SET last_used_at = datetime("now") WHERE token = ?',
      [token]
    );

    res.json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email
      }
    });

  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
  const { token } = req.body;

  // Delete session from database
  await db.query('DELETE FROM sessions WHERE token = ?', [token]);

  res.json({ success: true });
});

app.listen(5052, () => {
  console.log('🔐 Auth server running on http://localhost:5052');
});
```

---

### Step 2: Add Auth Middleware to Other Apps

**Update:** `api/deathtodata-backend.js`

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware to check if user is authenticated
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Verify token locally (fast)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Optionally: verify with auth server (slower but more secure)
    // const response = await fetch('http://auth.soulfra.com/auth/verify', {
    //   method: 'POST',
    //   body: JSON.stringify({ token })
    // });

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protect routes
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({
    message: 'You are authenticated!',
    user: req.user
  });
});

// Public routes (no auth required)
app.get('/api/search', async (req, res) => {
  // ... existing search code
});
```

---

### Step 3: Frontend Login Flow

**New File:** `deathtodata/login.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Login - DeathToData</title>
</head>
<body>
  <form id="loginForm">
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>

  <script>
    const AUTH_SERVER = 'http://localhost:5052'; // In production: https://auth.soulfra.com

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(`${AUTH_SERVER}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();

        // Store token in localStorage (accessible across same origin)
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = '/dashboard.html';

      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  </script>
</body>
</html>
```

**Update existing pages to check auth:**

```javascript
// In search.html, dashboard.html, etc.
const token = localStorage.getItem('auth_token');

if (token) {
  // Verify token is still valid
  fetch(`${AUTH_SERVER}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  .then(res => res.json())
  .then(data => {
    if (data.valid) {
      console.log('Logged in as:', data.user.email);
    } else {
      // Token expired, redirect to login
      window.location.href = '/login.html';
    }
  });
}

// Include token in API requests
fetch(`${API_URL}/api/protected`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### Step 4: Cross-Domain Token Sharing

**The Challenge:** `localStorage` doesn't work across different domains.

**Solutions:**

#### Option A: Redirect Through Auth Server (Recommended)
```
1. User visits deathtodata.com
2. No token? Redirect to auth.soulfra.com/login?return=deathtodata.com
3. User logs in at auth.soulfra.com
4. Auth server redirects back: deathtodata.com?token=xyz123
5. deathtodata.com stores token in localStorage
```

#### Option B: Shared Cookie Domain
```javascript
// Set cookie that works across *.soulfra.com
res.cookie('auth_token', token, {
  domain: '.soulfra.com',  // Works for soulfra.com, api.soulfra.com, etc.
  httpOnly: true,          // Can't be accessed by JavaScript (more secure)
  secure: true,            // Only sent over HTTPS
  sameSite: 'lax'          // CSRF protection
});
```

**Problem:** Won't work for `deathtodata.com` (different root domain)

#### Option C: iframe Trick (Old School)
```html
<!-- On deathtodata.com -->
<iframe src="https://auth.soulfra.com/check-auth" style="display:none"></iframe>

<script>
window.addEventListener('message', (event) => {
  if (event.origin === 'https://auth.soulfra.com') {
    const token = event.data.token;
    localStorage.setItem('auth_token', token);
  }
});
</script>
```

On auth server:
```javascript
// auth.soulfra.com/check-auth
const token = localStorage.getItem('auth_token');
window.parent.postMessage({ token }, '*');
```

**⚠️ Security Warning:** Only use with trusted domains!

---

## The Simple Version (Start Here)

**For now, simplest approach:**

1. **Single database** (SQLite/PostgreSQL) - all domains connect to it
2. **Same backend** - all domains use same API server
3. **Shared localStorage** - only works for same domain

**Implementation:**

```javascript
// All your sites point to same API
const API_URL = 'https://api.soulfra.com';  // Centralized API

// Login endpoint (backend)
app.post('/auth/login', async (req, res) => {
  // Check credentials
  // Generate token
  // Return token
});

// Protected endpoint (backend)
app.get('/api/user/profile', requireAuth, async (req, res) => {
  // Return user data
});

// Frontend (all domains)
const token = localStorage.getItem('token');

fetch('https://api.soulfra.com/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(user => console.log(user));
```

---

## Production Deployment

### Option 1: Centralized (Easiest)
```
All domains → Point to same backend
https://deathtodata.com → api.soulfra.com
https://soulfra.com → api.soulfra.com
```

**Pros:**
- One backend to maintain
- Shared session automatically
- Simple

**Cons:**
- If API goes down, all sites break
- Can't deploy sites independently

### Option 2: Distributed (Advanced)
```
Each domain → Own backend → Shared database
deathtodata.com → api.deathtodata.com → PostgreSQL (shared)
soulfra.com → api.soulfra.com → PostgreSQL (same database)
```

**Pros:**
- Redundancy (one API down ≠ all down)
- Can scale independently

**Cons:**
- More complex
- Need to sync code across backends

---

## Security Best Practices

### 1. Never Store Passwords in Plain Text
```javascript
// WRONG
await db.query('INSERT INTO users (password) VALUES (?)', [password]);

// RIGHT
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
await db.query('INSERT INTO users (password_hash) VALUES (?)', [hash]);
```

### 2. Use HTTPS in Production
```
http://deathtodata.com → ❌ Insecure
https://deathtodata.com → ✅ Secure
```

### 3. Set Token Expiry
```javascript
// Tokens expire after 7 days
const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
```

### 4. Validate All Inputs
```javascript
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate email format
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Validate password length
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }

  // ... continue
});
```

### 5. Rate Limit Login Attempts
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts
  message: 'Too many login attempts, try again later'
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  // ... login logic
});
```

---

## Testing Locally

### 1. Start Auth Server
```bash
node api/auth-server.js
# Running on localhost:5052
```

### 2. Start Main Backend
```bash
node api/deathtodata-backend.js
# Running on localhost:5051
```

### 3. Create Test User
```bash
curl -X POST http://localhost:5052/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 4. Login
```bash
curl -X POST http://localhost:5052/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Returns: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 5. Use Token
```bash
TOKEN="your-token-here"

curl http://localhost:5051/api/protected \
  -H "Authorization: Bearer $TOKEN"
```

---

## The Real Answer

**Build it in phases:**

### Phase 1: Single Domain (Now)
- Login works on deathtodata.com
- Token stored in localStorage
- Protected routes check token

### Phase 2: Centralized API (Next)
- Create `api.soulfra.com`
- All sites point to it
- Shared database

### Phase 3: Multi-Domain (Later)
- Implement auth server at `auth.soulfra.com`
- Redirect-based login flow
- JWT tokens work across domains

---

## What You Already Have

✅ Database schema (users table)
✅ Backend API (deathtodata-backend.js)
✅ Frontend pages
✅ SQLite → can switch to PostgreSQL for production

**What You Need:**
❌ Password hashing (bcrypt)
❌ JWT token generation
❌ Auth middleware
❌ Login/logout endpoints
❌ Frontend login page

---

## Next Steps (In Order)

1. **Install dependencies:**
   ```bash
   npm install bcrypt jsonwebtoken express-rate-limit
   ```

2. **Add sessions table to database**

3. **Create `api/auth-server.js`** (copy code above)

4. **Test locally** (register → login → get token)

5. **Create `deathtodata/login.html`**

6. **Update existing pages** to check auth

7. **Deploy** when working locally

---

## The Philosophical Point

**You asked about multi-domain auth.**

**But really, it's just:**
- Database table (sessions)
- HTTP endpoints (login, verify, logout)
- Tokens (encrypted strings)
- Cookies/localStorage (browser storage)

**All the "enterprise SSO" stuff** = these 4 things combined.

No magic. Just HTTP + SQL + crypto.

---

**Want me to build Phase 1 (single domain login) right now?**

I can:
1. Add password hashing to users table
2. Create login/logout endpoints
3. Build login.html page
4. Add auth middleware to protect routes
5. Test it end-to-end locally

Then later expand to multi-domain when you deploy to VPS.
