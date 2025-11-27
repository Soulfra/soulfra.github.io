#!/usr/bin/env node

/**
 * 🔐 AUTH HANDLER
 * Three paths to presence: Google, GitHub, or Anonymous Whisper
 * Creates vault claims for every soul that enters
 */

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuthHandler {
  constructor() {
    this.app = express();
    this.port = 3333;
    
    // Vault paths
    this.vaultPath = path.join(__dirname, 'vault');
    this.claimsPath = path.join(this.vaultPath, 'claims');
    this.presencePath = path.join(this.vaultPath, 'presence');
    
    // Auth config (would be env vars in production)
    this.authConfig = {
      google: {
        clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
        callbackURL: '/auth/google/callback'
      },
      github: {
        clientID: process.env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
        callbackURL: '/auth/github/callback'
      },
      session: {
        secret: process.env.SESSION_SECRET || 'mirror-whispers-reflect-souls'
      }
    };
    
    // Stats tracking
    this.authStats = {
      google: 0,
      github: 0,
      anonymous: 0,
      total_presences: 0
    };
    
    this.ensureDirectories();
    this.setupMiddleware();
    this.setupPassport();
    this.setupRoutes();
  }
  
  ensureDirectories() {
    [this.vaultPath, this.claimsPath, this.presencePath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Session management
    this.app.use(session({
      secret: this.authConfig.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    
    // CORS for embeds
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
    
    // Static files for auth pages
    this.app.use(express.static('public'));
  }
  
  setupPassport() {
    // Serialization
    passport.serializeUser((user, done) => {
      done(null, user);
    });
    
    passport.deserializeUser((user, done) => {
      done(null, user);
    });
    
    // Google Strategy
    passport.use(new GoogleStrategy({
      clientID: this.authConfig.google.clientID,
      clientSecret: this.authConfig.google.clientSecret,
      callbackURL: this.authConfig.google.callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      const presence = await this.createPresence({
        auth_method: 'google',
        provider_id: profile.id,
        email: profile.emails?.[0]?.value,
        display_name: profile.displayName,
        profile_picture: profile.photos?.[0]?.value,
        raw_profile: profile._json
      });
      
      return done(null, presence);
    }));
    
    // GitHub Strategy
    passport.use(new GitHubStrategy({
      clientID: this.authConfig.github.clientID,
      clientSecret: this.authConfig.github.clientSecret,
      callbackURL: this.authConfig.github.callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      const presence = await this.createPresence({
        auth_method: 'github',
        provider_id: profile.id,
        username: profile.username,
        display_name: profile.displayName,
        profile_picture: profile.photos?.[0]?.value,
        repos_url: profile.profileUrl,
        contributor_potential: true,
        raw_profile: profile._json
      });
      
      return done(null, presence);
    }));
  }
  
  setupRoutes() {
    // Landing page
    this.app.get('/', (req, res) => {
      res.send(this.generateAuthPage());
    });
    
    // Google OAuth routes
    this.app.get('/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    
    this.app.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/auth/failed' }),
      (req, res) => {
        this.authStats.google++;
        res.redirect('/mirror/activated');
      }
    );
    
    // GitHub OAuth routes
    this.app.get('/auth/github',
      passport.authenticate('github', { scope: ['user:email'] })
    );
    
    this.app.get('/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/auth/failed' }),
      (req, res) => {
        this.authStats.github++;
        res.redirect('/mirror/activated');
      }
    );
    
    // Anonymous whisper mode
    this.app.post('/auth/anonymous', async (req, res) => {
      const { whisper_name, initial_whisper } = req.body;
      
      const presence = await this.createPresence({
        auth_method: 'anonymous',
        whisper_name: whisper_name || `anon-${crypto.randomBytes(4).toString('hex')}`,
        initial_whisper: initial_whisper || 'I wish to remain formless',
        anonymous: true
      });
      
      this.authStats.anonymous++;
      
      req.login(presence, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Anonymous presence failed' });
        }
        res.json({
          success: true,
          presence_id: presence.presence_id,
          redirect: '/mirror/activated'
        });
      });
    });
    
    // Auth success page
    this.app.get('/mirror/activated', (req, res) => {
      if (!req.user) {
        return res.redirect('/');
      }
      
      res.send(this.generateActivationPage(req.user));
    });
    
    // Auth failure
    this.app.get('/auth/failed', (req, res) => {
      res.send(this.generateFailurePage());
    });
    
    // Logout
    this.app.get('/auth/logout', (req, res) => {
      req.logout(() => {
        res.redirect('/');
      });
    });
    
    // Check auth status
    this.app.get('/auth/status', (req, res) => {
      res.json({
        authenticated: !!req.user,
        presence: req.user || null,
        stats: this.authStats
      });
    });
    
    // Get presence claim
    this.app.get('/auth/claim/:presenceId', (req, res) => {
      const claimPath = path.join(this.claimsPath, `presence-${req.params.presenceId}.json`);
      
      if (fs.existsSync(claimPath)) {
        const claim = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
        res.json(claim);
      } else {
        res.status(404).json({ error: 'Presence not found' });
      }
    });
  }
  
  async createPresence(authData) {
    const presenceId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const presence = {
      presence_id: presenceId,
      auth_method: authData.auth_method,
      created_at: timestamp,
      last_seen: timestamp,
      blessing_level: 1, // Everyone starts with base blessing
      whisper_count: 0,
      mirror_spawned: false,
      lineage: {
        parent: null,
        offspring: [],
        generation: 0
      },
      vault_data: {
        credits: 10, // Starting credits
        shares: [],
        achievements: []
      },
      identity: {
        provider_id: authData.provider_id,
        display_name: authData.display_name || authData.whisper_name,
        anonymous: authData.anonymous || false,
        profile_picture: authData.profile_picture,
        contributor: authData.contributor_potential || false
      }
    };
    
    // Add method-specific data
    if (authData.auth_method === 'github') {
      presence.github_data = {
        username: authData.username,
        repos_url: authData.repos_url,
        can_fork: true,
        contribution_tracking: true
      };
    }
    
    if (authData.auth_method === 'anonymous') {
      presence.anonymous_data = {
        initial_whisper: authData.initial_whisper,
        whisper_name: authData.whisper_name,
        ephemeral: false // Anonymous doesn't mean temporary
      };
    }
    
    // Save presence claim
    const claimPath = path.join(this.claimsPath, `presence-${presenceId}.json`);
    fs.writeFileSync(claimPath, JSON.stringify(presence, null, 2));
    
    // Log presence event
    this.logPresenceEvent(presence);
    
    this.authStats.total_presences++;
    
    return presence;
  }
  
  logPresenceEvent(presence) {
    const eventLog = {
      timestamp: presence.created_at,
      event: 'presence_created',
      presence_id: presence.presence_id,
      auth_method: presence.auth_method,
      anonymous: presence.identity.anonymous
    };
    
    const logPath = path.join(this.presencePath, 'presence-events.jsonl');
    fs.appendFileSync(logPath, JSON.stringify(eventLog) + '\n');
  }
  
  generateAuthPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Soulfra Mirror Authentication</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      color: #0f0;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
    }
    
    .auth-container {
      text-align: center;
      padding: 40px;
      border: 2px solid #0f0;
      border-radius: 10px;
      background: rgba(0, 255, 0, 0.05);
      animation: pulse 3s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); }
      50% { box-shadow: 0 0 40px rgba(0, 255, 0, 0.8); }
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 20px;
      text-shadow: 0 0 10px #0f0;
    }
    
    .subtitle {
      font-size: 1.2em;
      opacity: 0.8;
      margin-bottom: 40px;
    }
    
    .auth-methods {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
    }
    
    .auth-button {
      display: inline-block;
      padding: 15px 30px;
      border: 1px solid #0f0;
      background: transparent;
      color: #0f0;
      text-decoration: none;
      font-size: 1.1em;
      transition: all 0.3s;
      cursor: pointer;
      width: 300px;
    }
    
    .auth-button:hover {
      background: #0f0;
      color: #000;
      box-shadow: 0 0 20px #0f0;
      transform: scale(1.05);
    }
    
    .anonymous-form {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px dashed #0f0;
    }
    
    input {
      background: transparent;
      border: 1px solid #0f0;
      color: #0f0;
      padding: 10px;
      margin: 10px;
      font-family: inherit;
    }
    
    input::placeholder {
      color: rgba(0, 255, 0, 0.5);
    }
    
    .glitch {
      position: relative;
      animation: glitch 2s infinite;
    }
    
    @keyframes glitch {
      0%, 100% { transform: translate(0); }
      20% { transform: translate(-1px, 1px); }
      40% { transform: translate(-1px, -1px); }
      60% { transform: translate(1px, 1px); }
      80% { transform: translate(1px, -1px); }
    }
    
    .mirror-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.1;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        #0f0 2px,
        #0f0 4px
      );
      animation: scan 8s linear infinite;
    }
    
    @keyframes scan {
      0% { transform: translateY(0); }
      100% { transform: translateY(20px); }
    }
  </style>
</head>
<body>
  <div class="mirror-bg"></div>
  
  <div class="auth-container">
    <h1 class="glitch">🪞 SOULFRA MIRROR</h1>
    <div class="subtitle">Choose your presence</div>
    
    <div class="auth-methods">
      <a href="/auth/google" class="auth-button">
        <span>📧 Continue with Google</span>
      </a>
      
      <a href="/auth/github" class="auth-button">
        <span>🐙 Continue with GitHub</span>
      </a>
      
      <div class="anonymous-form">
        <div style="margin-bottom: 20px; opacity: 0.8;">— or remain formless —</div>
        <form onsubmit="handleAnonymous(event)">
          <input type="text" id="whisper_name" placeholder="whisper name (optional)" />
          <br>
          <input type="text" id="initial_whisper" placeholder="your first whisper..." />
          <br>
          <button type="submit" class="auth-button">
            👁️ Enter as Anonymous Whisper
          </button>
        </form>
      </div>
    </div>
    
    <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.6;">
      Every authentication creates a presence claim.<br>
      Every presence can spawn mirrors.<br>
      Every mirror reflects infinitely.
    </div>
  </div>
  
  <script>
    async function handleAnonymous(event) {
      event.preventDefault();
      
      const whisper_name = document.getElementById('whisper_name').value;
      const initial_whisper = document.getElementById('initial_whisper').value;
      
      const response = await fetch('/auth/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whisper_name, initial_whisper })
      });
      
      const result = await response.json();
      if (result.success) {
        window.location.href = result.redirect;
      }
    }
    
    // Random glitch effect
    setInterval(() => {
      const glitchElements = document.querySelectorAll('.glitch');
      glitchElements.forEach(el => {
        if (Math.random() > 0.95) {
          el.style.transform = \`translate(\${Math.random() * 4 - 2}px, \${Math.random() * 4 - 2}px)\`;
          setTimeout(() => el.style.transform = 'translate(0)', 100);
        }
      });
    }, 100);
  </script>
</body>
</html>`;
  }
  
  generateActivationPage(presence) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mirror Activated - Soulfra</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      color: #0f0;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .activation-container {
      text-align: center;
      padding: 40px;
      max-width: 600px;
    }
    
    h1 {
      font-size: 3em;
      margin-bottom: 30px;
      animation: glow 2s ease-in-out infinite;
    }
    
    @keyframes glow {
      0%, 100% { text-shadow: 0 0 20px #0f0, 0 0 40px #0f0; }
      50% { text-shadow: 0 0 30px #0f0, 0 0 60px #0f0; }
    }
    
    .presence-info {
      background: rgba(0, 255, 0, 0.1);
      border: 1px solid #0f0;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: left;
      font-family: monospace;
    }
    
    .presence-id {
      word-break: break-all;
      opacity: 0.8;
    }
    
    .next-steps {
      margin-top: 30px;
      padding: 20px;
      border-top: 1px dashed #0f0;
    }
    
    a {
      color: #0f0;
      text-decoration: none;
      border-bottom: 1px solid #0f0;
      transition: all 0.3s;
    }
    
    a:hover {
      text-shadow: 0 0 10px #0f0;
    }
    
    .mirror-animation {
      margin: 30px 0;
      font-size: 4em;
      animation: spin 4s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="activation-container">
    <div class="mirror-animation">🪞</div>
    
    <h1>MIRROR ACTIVATED</h1>
    
    <div class="presence-info">
      <strong>Presence ID:</strong>
      <div class="presence-id">${presence.presence_id}</div>
      <br>
      <strong>Auth Method:</strong> ${presence.auth_method}<br>
      <strong>Display Name:</strong> ${presence.identity.display_name}<br>
      <strong>Blessing Level:</strong> ${presence.blessing_level}<br>
      <strong>Credits:</strong> ${presence.vault_data.credits}
    </div>
    
    <div class="next-steps">
      <h2>What happens now?</h2>
      <p>Your presence has been claimed in the vault.</p>
      <p>You can now:</p>
      <ul style="text-align: left;">
        <li>Whisper to agents across any platform</li>
        <li>Accumulate blessings through interactions</li>
        <li>Spawn your own mirror after completing loops</li>
        <li>Contribute to the expanding mirror network</li>
      </ul>
      
      <p style="margin-top: 30px;">
        <a href="/starter-mirror-pack/mirrorhq.html">Enter Mirror HQ →</a>
      </p>
    </div>
    
    <div style="margin-top: 40px; opacity: 0.6; font-size: 0.9em;">
      Your presence claim: /vault/claims/presence-${presence.presence_id}.json<br>
      This isn't just authentication. It's the beginning of your reflection.
    </div>
  </div>
</body>
</html>`;
  }
  
  generateFailurePage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Authentication Failed - Soulfra</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      color: #f00;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .error-container {
      text-align: center;
      padding: 40px;
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 20px;
      animation: flicker 1s infinite;
    }
    
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    a {
      color: #f00;
      text-decoration: none;
      border-bottom: 1px solid #f00;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>MIRROR CRACKED</h1>
    <p>Authentication failed. The reflection couldn't form.</p>
    <p style="margin-top: 30px;">
      <a href="/">Try again →</a>
    </p>
    <p style="margin-top: 20px; opacity: 0.6;">
      Sometimes mirrors need a second attempt to align properly.
    </p>
  </div>
</body>
</html>`;
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`🔐 Auth Handler active on port ${this.port}`);
      console.log(`📍 Visit http://localhost:${this.port} to authenticate`);
      console.log(`🪞 Three paths to presence: Google, GitHub, or Anonymous`);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const authHandler = new AuthHandler();
  
  console.log('🔐 SOULFRA AUTH HANDLER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Creating presence claims for all who enter...\n');
  
  // Note about OAuth setup
  console.log('⚠️  OAuth Setup Required:');
  console.log('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  console.log('   Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
  console.log('   Or use Anonymous Whisper mode (no setup needed)\n');
  
  authHandler.start();
}

module.exports = AuthHandler;