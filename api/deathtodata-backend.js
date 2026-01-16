const express = require('express');
const cors = require('cors');
const https = require('https');
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

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`🚀 DeathToData API running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
});
