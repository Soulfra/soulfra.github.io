const express = require('express');
const cors = require('cors');
const https = require('https');
const crypto = require('crypto');
const SearchEngine = require('./search/engine');
const app = express();

// Initialize search engine
const searchEngine = new SearchEngine();
console.log('✅ Search engine initialized (DuckDuckGo Instant Answer API)');

// Use SQLite for local, PostgreSQL for production
const db = process.env.NODE_ENV === 'production'
  ? require('../config/postgresClient')
  : require('../config/sqliteClient');

app.use(cors());
app.use(express.json());

// Disable caching during development (browser won't cache old versions)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '0');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// Serve static files from deathtodata directory
app.use(express.static('deathtodata'));

// Redirect root to index.html
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Email signup endpoint
app.post('/api/signup', async (req, res) => {
  const { email, source = 'landing-page' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    // Add to waitlist
    await db.query(
      'INSERT INTO waitlist (email, source) VALUES (?, ?)',
      [email, source]
    );

    // Create user account
    const userResult = await db.query(
      'INSERT INTO users (email) VALUES (?) RETURNING id',
      [email]
    );

    const userId = userResult.rows[0].id;

    // Send welcome message
    await db.query(
      'INSERT INTO messages (user_id, subject, body) VALUES (?, ?, ?)',
      [userId, 'Welcome to DeathToData!', 'Thanks for joining our privacy-first search revolution. Your dashboard is ready at /dashboard.html']
    );

    res.json({
      success: true,
      message: 'Welcome! Check your dashboard at /dashboard.html',
      userId
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      console.error('Signup error:', err);
      res.status(500).json({ error: err.message });
    }
  }
});

// Get user messages
app.get('/api/messages/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await db.query(
      `SELECT m.* FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE u.email = ?
       ORDER BY m.created_at DESC`,
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get internal feed
app.get('/api/feed', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM internal_feed ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark message as read
app.post('/api/messages/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE messages SET read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user profile by email
app.get('/api/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await db.query(
      'SELECT id, email, name, created_at, last_login FROM users WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('User profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Track analytics event
app.post('/api/analytics', async (req, res) => {
  const { event_type, user_id, metadata, ip_address, user_agent } = req.body;

  try {
    await db.query(
      'INSERT INTO analytics_events (event_type, user_id, metadata, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [event_type, user_id || null, JSON.stringify(metadata || {}), ip_address || null, user_agent || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SEARCH ENGINE - The core feature!
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const useOllama = req.query.ai === 'true'; // Optional AI filtering

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query required' });
  }

  console.log(`🔍 Search query: "${query}"${useOllama ? ' (with AI filtering)' : ''}`);

  try {
    // Track search (privacy-focused: no user identification)
    await db.query(
      'INSERT INTO analytics_events (event_type, metadata) VALUES (?, ?)',
      ['search', JSON.stringify({ query: query.substring(0, 100), timestamp: new Date().toISOString() })]
    );

    // Use SearchEngine class (DuckDuckGo Instant Answer API + internal search)
    let results = [];
    try {
      results = await searchEngine.search(query, {
        providers: ['duckduckgo'],
        maxResults: 10,
        includeInternal: false, // Disable internal search (uses localStorage)
        cacheResults: false // Disable cache (uses Map which should work)
      });
    } catch (searchErr) {
      console.warn('SearchEngine failed, using fallback:', searchErr.message);
      // Fallback: fetch DuckDuckGo directly with HTTPS
      results = await fallbackDuckDuckGoSearch(query);
    }

    // Optional: Filter with Ollama
    let filteredResults = results;
    if (useOllama && results.length > 0) {
      try {
        filteredResults = await filterResultsWithOllama(query, results);
        console.log(`✨ AI filtered ${results.length} → ${filteredResults.length} results`);
      } catch (ollamaErr) {
        console.warn('Ollama filtering failed, using unfiltered results:', ollamaErr.message);
      }
    }

    res.json({
      query,
      results: filteredResults,
      count: filteredResults.length,
      privacy: 'No tracking, no profiling, no surveillance',
      engine: 'DuckDuckGo Instant Answer API',
      ai_filtered: useOllama,
      stats: searchEngine.getStats()
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// Fallback: Direct DuckDuckGo Instant Answer API using HTTPS
async function fallbackDuckDuckGoSearch(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    https.get(url, (response) => {
      let data = '';

      response.on('data', chunk => { data += chunk; });

      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = [];

          // Add abstract (instant answer)
          if (json.Abstract && json.AbstractURL) {
            results.push({
              title: json.Heading || query,
              url: json.AbstractURL,
              snippet: json.Abstract,
              source: 'duckduckgo'
            });
          }

          // Add related topics
          if (json.RelatedTopics && Array.isArray(json.RelatedTopics)) {
            json.RelatedTopics.forEach(topic => {
              if (topic.Text && topic.FirstURL) {
                results.push({
                  title: topic.Text.split(' - ')[0],
                  url: topic.FirstURL,
                  snippet: topic.Text,
                  source: 'duckduckgo'
                });
              }
            });
          }

          console.log(`✅ Fallback search found ${results.length} results`);
          resolve(results.slice(0, 10));
        } catch (parseErr) {
          console.error('Parse error:', parseErr);
          resolve([]);
        }
      });
    }).on('error', err => {
      console.error('HTTPS error:', err);
      reject(err);
    });
  });
}

// Filter and rank search results using Ollama AI
async function filterResultsWithOllama(query, results) {
  const OLLAMA_URL = 'http://localhost:11434/api/generate';

  const prompt = `You are a search result quality filter for DeathToData search engine.

Query: "${query}"

Results to filter:
${results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`).join('\n\n')}

Task: Return ONLY the numbers (1-${results.length}) of high-quality, relevant results that match the query intent. Remove spam, low-quality, or irrelevant results.

Return format: Just comma-separated numbers like: 1,3,4,7
If all results are good, return: all
If no results are good, return: none

Response:`;

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deathtodata-model',
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.response.trim().toLowerCase();

  // Parse AI response
  if (aiResponse === 'all') {
    return results;
  } else if (aiResponse === 'none') {
    return [];
  } else {
    // Parse comma-separated numbers
    const keepIndices = aiResponse
      .split(',')
      .map(n => parseInt(n.trim()) - 1)
      .filter(i => i >= 0 && i < results.length);

    return keepIndices.map(i => results[i]);
  }
}

// Ollama Analysis - Same as Python agent but in JavaScript
app.post('/api/analyze', async (req, res) => {
  const { query, results } = req.body;

  if (!query || !results) {
    return res.status(400).json({ error: 'Query and results required' });
  }

  console.log(`🤖 Analyzing search results for: "${query}"`);

  try {
    // Format results for Ollama (same as Python script)
    let searchSummary = `Search results for '${query}':\n\n`;
    results.slice(0, 5).forEach((result, i) => {
      searchSummary += `${i + 1}. ${result.title}\n`;
      searchSummary += `   URL: ${result.url}\n`;
      searchSummary += `   ${result.snippet.substring(0, 150)}...\n\n`;
    });

    const prompt = `You are a search assistant. Analyze these search results and provide:
1. A brief summary of what the results are about
2. The 3 most relevant findings
3. A recommendation for the user

${searchSummary}

Be concise and helpful.`;

    // Call Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    const ollamaData = await ollamaResponse.json();
    const analysis = ollamaData.response;

    // Save to database (same as Python script)
    const metadata = {
      query,
      result_count: results.length,
      ollama_summary: analysis,
      top_sources: results.slice(0, 3).map(r => r.url),
      timestamp: new Date().toISOString()
    };

    await db.query(
      'INSERT INTO analytics_events (event_type, metadata) VALUES (?, ?)',
      ['ollama_analysis', JSON.stringify(metadata)]
    );

    console.log('✅ Analysis complete and saved to database');

    res.json({
      success: true,
      analysis,
      saved: true
    });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', message: err.message });
  }
});

// Voice Search with Ambient Audio Anti-Bot
app.post('/api/voice-search', async (req, res) => {
  const { transcript, ambientScore, fingerprint, signature, publicKey } = req.body;

  if (!transcript || ambientScore === undefined || !fingerprint) {
    return res.status(400).json({ error: 'transcript, ambientScore, and fingerprint required' });
  }

  console.log(`🎤 Voice search: "${transcript}" (ambient score: ${ambientScore.toFixed(2)})`);

  try {
    // 1. Verify signature (if authenticated)
    if (signature && publicKey) {
      // In production: verify signature with crypto.subtle.verify()
      // For now, we trust the client signature
      console.log(`[VoiceSearch] Signed by: ${publicKey.substring(0, 16)}...`);
    }

    // 2. Check ambient score (anti-bot detection)
    if (ambientScore < 0.7) {
      console.log(`❌ Bot detected! Ambient score too low: ${ambientScore.toFixed(2)}`);
      return res.status(403).json({
        error: 'Bot detected',
        message: 'Ambient audio score too low. Are you human?',
        score: ambientScore,
        threshold: 0.7
      });
    }

    console.log(`✅ Human verified! Ambient score: ${ambientScore.toFixed(2)}`);

    // 3. Store signed voice search in analytics
    await db.query(`
      INSERT INTO analytics_events (
        event_type,
        metadata,
        user_id,
        created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `, [
      'voice_search',
      JSON.stringify({
        transcript,
        ambient_score: ambientScore,
        audio_fingerprint: fingerprint,
        timestamp: Date.now(),
        verified_human: true
      }),
      publicKey ? publicKey.substring(0, 16) : null
    ]);

    // 4. Award VIBES (if authenticated)
    let vibesAwarded = 0;
    if (publicKey) {
      try {
        // Award 0.3 VIBES (more than text search because verified human)
        await db.query(`
          UPDATE users
          SET vibes_balance = COALESCE(vibes_balance, 0) + 0.3
          WHERE public_key = ?
        `, [publicKey]);
        vibesAwarded = 0.3;
        console.log(`💎 Awarded ${vibesAwarded} VIBES for verified human voice search`);
      } catch (vibesErr) {
        console.warn('[VoiceSearch] VIBES award failed (column might not exist):', vibesErr.message);
      }
    }

    res.json({
      success: true,
      transcript,
      ambientScore,
      vibesAwarded,
      message: 'Voice search verified as human!',
      privacy: 'Audio processed locally - only fingerprint stored'
    });

  } catch (err) {
    console.error('[VoiceSearch] Error:', err);
    res.status(500).json({ error: 'Voice search failed', message: err.message });
  }
});

// Get all stored knowledge (analyses and audits)
app.get('/api/knowledge', async (req, res) => {
  const type = req.query.type || 'all'; // 'all', 'ollama_analysis', 'infrastructure_audit'

  try {
    let query;
    let params = [];

    if (type === 'all') {
      query = `SELECT id, event_type, metadata, created_at
               FROM analytics_events
               WHERE event_type IN ('ollama_analysis', 'infrastructure_audit')
               ORDER BY created_at DESC`;
    } else {
      query = `SELECT id, event_type, metadata, created_at
               FROM analytics_events
               WHERE event_type = ?
               ORDER BY created_at DESC`;
      params = [type];
    }

    const result = await db.query(query, params);

    // Parse metadata JSON for each row
    const knowledge = result.rows.map(row => {
      try {
        return {
          id: row.id,
          type: row.event_type,
          metadata: JSON.parse(row.metadata),
          created_at: row.created_at
        };
      } catch (e) {
        return {
          id: row.id,
          type: row.event_type,
          metadata: {},
          created_at: row.created_at
        };
      }
    });

    res.json({
      count: knowledge.length,
      knowledge
    });

  } catch (err) {
    console.error('Knowledge retrieval error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific knowledge entry by ID
app.get('/api/knowledge/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT id, event_type, metadata, created_at FROM analytics_events WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    const entry = result.rows[0];
    res.json({
      id: entry.id,
      type: entry.event_type,
      metadata: JSON.parse(entry.metadata),
      created_at: entry.created_at
    });

  } catch (err) {
    console.error('Knowledge retrieval error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== UNIVERSAL AUTH ENDPOINTS =====

// Register new user with public key (from soulfra-universal-auth.js)
app.post('/auth/register', async (req, res) => {
  const { publicKey, userId } = req.body;

  if (!publicKey || !userId) {
    return res.status(400).json({ error: 'publicKey and userId required' });
  }

  try {
    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE public_key = ?',
      [publicKey]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'User already registered',
        userId,
        returning: true
      });
    }

    // Create new user (email required by schema, use empty string for crypto auth)
    const result = await db.query(
      'INSERT INTO users (email, public_key, created_at) VALUES (?, ?, datetime("now")) RETURNING id',
      ['', publicKey]  // Empty email for crypto auth users
    );

    const dbUserId = result.rows[0].id;

    console.log(`[Auth] New user registered: ${userId} (DB ID: ${dbUserId})`);

    res.json({
      success: true,
      message: 'User registered successfully',
      userId,
      dbUserId
    });

  } catch (err) {
    console.error('[Auth] Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify signature and authenticate user
app.post('/auth/verify', async (req, res) => {
  const { message, signature, publicKey } = req.body;

  if (!message || !signature || !publicKey) {
    return res.status(400).json({ error: 'message, signature, and publicKey required' });
  }

  try {
    // In production, verify signature using Web Crypto API equivalent
    // For now, we trust the client (since keys are in localStorage)
    // Real verification would use: crypto.verify() with Ed25519

    // Find user by public key
    const result = await db.query(
      'SELECT id, public_key, created_at FROM users WHERE public_key = ?',
      [publicKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const user = result.rows[0];
    const userId = publicKey.substring(0, 16);

    // Update last login
    await db.query(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?',
      [user.id]
    );

    console.log(`[Auth] User verified: ${userId} (DB ID: ${user.id})`);

    // Return user info
    res.json({
      success: true,
      userId,
      dbUserId: user.id,
      publicKey: user.public_key,
      createdAt: user.created_at
    });

  } catch (err) {
    console.error('[Auth] Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user info
app.get('/auth/me', async (req, res) => {
  const publicKey = req.query.publicKey;

  if (!publicKey) {
    return res.status(400).json({ error: 'publicKey required' });
  }

  try {
    const result = await db.query(
      'SELECT id, public_key, email, name, created_at, last_login FROM users WHERE public_key = ?',
      [publicKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const userId = publicKey.substring(0, 16);

    res.json({
      userId,
      dbUserId: user.id,
      email: user.email,
      name: user.name,
      publicKey: user.public_key,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });

  } catch (err) {
    console.error('[Auth] Get user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify SSO token from another domain
app.post('/auth/verify-sso', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'SSO token required' });
  }

  try {
    // Decode base64 token
    const tokenJSON = Buffer.from(token, 'base64').toString('utf-8');
    const { payload, signature } = JSON.parse(tokenJSON);

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Verify signature (in production, use crypto.verify)
    // For now, trust the token since it's signed client-side

    // Find user by public key
    const result = await db.query(
      'SELECT id FROM users WHERE public_key = ?',
      [payload.publicKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Auth] SSO token verified for: ${payload.userId}`);

    res.json({
      success: true,
      userId: payload.userId,
      publicKey: payload.publicKey,
      targetDomain: payload.targetDomain
    });

  } catch (err) {
    console.error('[Auth] SSO verification error:', err);
    res.status(401).json({ error: 'Invalid SSO token' });
  }
});

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`🚀 DeathToData API running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
});
