#!/usr/bin/env node
/**
 * Simple News API Server
 * Handles news fetching via HTTP endpoint
 */

const http = require('http');
const { processFeeds } = require('../scripts/news-automation.js');

const PORT = 5051;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle /api/refresh-news
  if (req.url === '/api/refresh-news' && req.method === 'POST') {
    console.log('🔄 Fetching fresh news...');

    try {
      const newsItems = await processFeeds();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        count: newsItems.length,
        news: newsItems
      }));

      console.log(`✅ Sent ${newsItems.length} news items`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`📡 News API running on http://localhost:${PORT}`);
  console.log(`📍 Endpoint: POST http://localhost:${PORT}/api/refresh-news`);
});
