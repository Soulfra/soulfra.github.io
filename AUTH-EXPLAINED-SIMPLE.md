# Auth Explained (No Bullshit Version)

**You said:** "i just get more confused because in my head this is nextauth or oauth or login + gmail + github and sso"

**You're right to be confused.** These are all different things that marketers pretend are the same.

---

## The Confusion Map

```
What You Want:
"Login once, access all my domains"
  ↓
This is called: SSO (Single Sign-On)

What Companies Offer You:
  ↓
├─ NextAuth    → Framework (makes building auth easier)
├─ OAuth       → Protocol ("Login with Google" button)
├─ Login       → Basic auth (username + password)
└─ SSO         → What you actually want
```

---

## 1. Basic Login (What You Should Build First)

**What it is:** Username + password → check database → logged in

**Example:**
```
1. User enters email + password
2. Backend checks database:
   SELECT * FROM users WHERE email = 'user@example.com'
3. Compare password hash
4. If match → generate token → send to user
5. User stores token → sends with every request
```

**This is just:**
- HTML form
- Password hashing (bcrypt)
- Token generation (JWT or UUID)
- Database query

**No external dependencies. You control everything.**

**Pros:**
- Simple
- You own the data
- Works offline
- No third party can shut you down

**Cons:**
- You handle password resets
- You handle security
- Users need to create account (not using existing Gmail/GitHub)

---

## 2. OAuth ("Login with Google/GitHub")

**What it is:** Let users login with their existing Google/GitHub/etc account

**How it works:**
```
1. User clicks "Login with Google"
2. Redirect to Google: accounts.google.com
3. User logs in to Google (not your site)
4. Google redirects back to you with a code
5. You exchange code for user info (email, name)
6. You create account in your database using their email
7. User logged in
```

**This is NOT authentication you're doing.** Google does the auth, you just get the result.

**Examples:**
- "Login with Google"
- "Continue with GitHub"
- "Sign in with Facebook"

**Pros:**
- Users don't need to create new password
- Google/GitHub handles security
- Faster signup (one click)

**Cons:**
- You depend on Google/GitHub API
- If they change API, you break
- Users without Google/GitHub account can't login
- Privacy concerns (Google knows your users)

**Libraries that help:**
- Passport.js (Node.js)
- NextAuth (Next.js/React)
- Authlib (Python)

**What you need:**
1. Register app with Google → get CLIENT_ID
2. Add "Login with Google" button → redirects to Google
3. Handle callback → Google sends user back with code
4. Exchange code for user email
5. Create user in your database
6. Done

---

## 3. SSO (Single Sign-On)

**What it is:** Login once → access multiple apps/domains

**This is what you want.** Login at deathtodata.com → automatically logged in at soulfra.com

**How it works:**
```
Central auth server (auth.soulfra.com):
  ↓
User logs in once
  ↓
Gets token (JWT)
  ↓
Token works on:
  - deathtodata.com
  - soulfra.com
  - api.soulfra.com
  - etc.
```

**Examples:**
- Google: Login once → access Gmail, YouTube, Drive
- Microsoft: Login once → access Office, OneDrive, Teams
- Your version: Login once → access all your domains

**This is just:**
- One login server (auth.soulfra.com)
- Multiple apps that trust the login server
- Shared token (JWT)
- Or redirect-based flow

**Already explained this in MULTI-DOMAIN-AUTH.md**

---

## 4. NextAuth

**What it is:** JavaScript library that makes building auth easier (for Next.js/React apps)

**This is NOT a type of auth.** It's a tool to help you build auth.

**What it does:**
- Handles OAuth (Login with Google/GitHub)
- Handles basic login (email + password)
- Handles sessions
- Handles database connections
- Gives you ready-made components

**Example:**
```javascript
// Without NextAuth (manual)
app.post('/login', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  const valid = await bcrypt.compare(password, user.password_hash);
  if (valid) {
    const token = jwt.sign({ userId: user.id }, SECRET);
    res.json({ token });
  }
});

// With NextAuth (automatic)
export default NextAuth({
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // Same logic, but NextAuth handles tokens/sessions/etc
      }
    })
  ]
});
```

**Pros:**
- Less code to write
- Battle-tested
- Works with Next.js

**Cons:**
- Only for Next.js/React
- You're not using Next.js (you're using vanilla JS)
- Learning curve
- Abstraction hides what's actually happening

**You don't need this.** You can build auth with plain JavaScript + bcrypt + JWT.

---

## 5. Passport.js

**What it is:** Node.js library for auth (like NextAuth but for any Node.js app)

**What it does:**
- Handles OAuth (Google, GitHub, Facebook, etc)
- Handles basic login
- Middleware for Express.js

**Example:**
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5051/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Google login successful, profile has user info
  const user = { email: profile.emails[0].value, name: profile.displayName };
  done(null, user);
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['email'] }));
app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
  res.redirect('/dashboard');
});
```

**This is useful if you want OAuth.**

---

## What You Actually Need

**Your quote:**
> "how can we build a login system that works across all my domains"

**You need:** SSO (option 3)

**You DON'T need:**
- ❌ NextAuth (you're not using Next.js)
- ❌ OAuth (unless you want "Login with Google")
- ❌ Passport.js (unless you want OAuth)

**You DO need:**
- ✅ Basic login (email + password)
- ✅ JWT tokens (for cross-domain auth)
- ✅ Shared database (all domains check same users table)

---

## Decision Tree

**Do you want users to login with Gmail/GitHub?**
- **Yes** → Use OAuth (Passport.js or manual implementation)
- **No** → Build basic login

**Do you need it to work across multiple domains?**
- **Yes** → Add SSO layer (central auth server + JWT)
- **No** → Just basic login

**Are you using Next.js/React?**
- **Yes** → Consider NextAuth
- **No** → Build it yourself or use Passport.js

**For your case:**
```
Need: SSO (multi-domain)
Don't need: OAuth (Google/GitHub login)
Don't need: NextAuth (not using Next.js)
```

**Therefore:**
Build basic login + JWT tokens + central auth server

---

## The Building Blocks (No Framework)

### Step 1: Database
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),  -- bcrypt
  created_at TIMESTAMP
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  token VARCHAR(500),  -- JWT
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Step 2: Registration
```javascript
const bcrypt = require('bcrypt');

app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  // Hash password
  const hash = await bcrypt.hash(password, 10);

  // Save to database
  await db.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, hash]
  );

  res.json({ success: true });
});
```

### Step 3: Login
```javascript
const jwt = require('jsonwebtoken');
const SECRET = 'your-secret-key';

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    SECRET,
    { expiresIn: '7d' }
  );

  // Save session
  await db.query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, datetime("now", "+7 days"))',
    [user.id, token]
  );

  res.json({ token, user: { id: user.id, email: user.email } });
});
```

### Step 4: Verify Token
```javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protect routes
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'You are logged in!', user: req.user });
});
```

### Step 5: Frontend
```html
<!-- login.html -->
<form id="loginForm">
  <input type="email" id="email" required>
  <input type="password" id="password" required>
  <button type="submit">Login</button>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const response = await fetch('http://localhost:5051/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  });

  const data = await response.json();

  if (data.token) {
    // Save token
    localStorage.setItem('token', data.token);
    // Redirect
    window.location.href = '/dashboard.html';
  } else {
    alert('Login failed');
  }
});
</script>
```

### Step 6: Use Token
```javascript
// On other pages
const token = localStorage.getItem('token');

fetch('http://localhost:5051/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

**That's it. No frameworks. Just:**
- bcrypt (password hashing)
- JWT (token generation)
- Express (HTTP server)
- SQLite (database)

---

## Comparison Table

| Feature | Basic Login | OAuth | SSO | NextAuth | Passport.js |
|---------|------------|-------|-----|----------|-------------|
| Complexity | Low | Medium | High | Medium | Medium |
| External deps | None | Google/GitHub API | None | Next.js | Node.js |
| Multi-domain | Add JWT | Add JWT | Built-in | Add custom | Add custom |
| "Login with Google" | No | Yes | Can add | Yes | Yes |
| You own data | Yes | Partial | Yes | Yes | Yes |
| Can work offline | Yes | No | Yes | Yes | Yes |
| Setup time | 1 hour | 2 hours | 4 hours | 2 hours | 2 hours |

---

## What You Should Do (In Order)

### Phase 1: Basic Login (This Weekend)
1. Add password_hash column to users table
2. Install bcrypt + jsonwebtoken: `npm install bcrypt jsonwebtoken`
3. Create /auth/register endpoint
4. Create /auth/login endpoint
5. Create login.html
6. Test locally

**Result:** Login works on deathtodata.com

### Phase 2: Protect Routes (Next Week)
1. Create requireAuth middleware
2. Protect /api/knowledge endpoint
3. Protect /api/analyze endpoint
4. Update frontend to send token

**Result:** Only logged-in users can use API

### Phase 3: SSO (When You Deploy)
1. Deploy auth server to VPS
2. Point auth.soulfra.com to it
3. Update deathtodata.com to redirect to auth server
4. Update soulfra.com to redirect to auth server

**Result:** Login once, works everywhere

### Phase 4: OAuth (If You Want)
1. Register app with Google
2. Add "Login with Google" button
3. Handle OAuth callback

**Result:** Users can login with Gmail

---

## The Truth

**All these frameworks (NextAuth, Passport, etc) are just wrappers around:**
- bcrypt (hashing passwords)
- JWT or sessions (remembering who's logged in)
- HTTP redirects (OAuth flow)
- Database queries (storing users)

**You don't need a framework.** You can build it in ~200 lines of code.

**Use a framework if:**
- You want to save time
- You don't care how it works
- You trust the framework

**Build it yourself if:**
- You want to understand it
- You want full control
- You hate dependencies

---

## What I Recommend for You

**Start with basic login:**
```
1. Email + password
2. Bcrypt hashing
3. JWT tokens
4. localStorage on frontend
5. Works on one domain
```

**When it works locally, add SSO:**
```
1. Deploy to VPS
2. Create auth subdomain
3. Redirect-based flow
4. Works across all domains
```

**Only add OAuth if you want "Login with Google":**
```
1. Register with Google
2. Add button
3. Handle callback
```

**Don't use NextAuth** (you're not using Next.js)

**Don't use Passport** (unless you want OAuth later)

**Just use:**
- bcrypt
- jsonwebtoken
- Express middleware
- SQLite/PostgreSQL

**Total dependencies:** 2 packages (bcrypt + jsonwebtoken)

**Total code:** ~200 lines

---

## Test Understanding

**What is OAuth?**
→ Protocol for "Login with Google/GitHub"

**What is SSO?**
→ Login once, access multiple domains

**What is NextAuth?**
→ Framework for Next.js (you don't need it)

**What do you need?**
→ Basic login + JWT + SSO

**What's the first step?**
→ Add password_hash to users table, create login endpoints

---

**Want me to build Phase 1 (basic login) right now?**

I'll:
1. Update users table schema
2. Create /auth/register endpoint
3. Create /auth/login endpoint
4. Build login.html page
5. Add requireAuth middleware
6. Test end-to-end

Then you'll have working login. Later add SSO for multi-domain.
