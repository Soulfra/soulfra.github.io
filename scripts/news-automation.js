#!/usr/bin/env node
/**
 * News Feed Automation with Ollama
 *
 * FREE news automation:
 * 1. Fetches RSS feeds
 * 2. Summarizes with Ollama (local AI - FREE)
 * 3. Saves to JSON file
 * 4. Posts to your site
 *
 * No API fees. No hosting fees. Just your laptop.
 *
 * Usage:
 *   node scripts/news-automation.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ========================================
// CONFIG
// ========================================
const CONFIG = {
  // RSS feeds to monitor (add your own!)
  feeds: [
    'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://techcrunch.com/feed/',
    'https://www.wired.com/feed/rss'
  ],

  // Ollama settings
  ollama: {
    host: '127.0.0.1',
    port: 11434,
    model: 'llama3.2' // or whatever model you have
  },

  // Output
  outputFile: path.join(__dirname, '../data/news-summaries.json'),

  // How often to check (in ms)
  interval: 5 * 60 * 1000 // 5 minutes
};

// ========================================
// FETCH RSS FEED
// ========================================
function fetchRSS(feedUrl) {
  return new Promise((resolve, reject) => {
    const protocol = feedUrl.startsWith('https') ? https : http;

    protocol.get(feedUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Parse RSS (simple XML parsing)
        const items = [];
        const itemRegex = /<item>(.*?)<\/item>/gs;
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
        const linkRegex = /<link>(.*?)<\/link>/;
        const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;

        let match;
        while ((match = itemRegex.exec(data)) !== null) {
          const itemXML = match[1];
          const titleMatch = titleRegex.exec(itemXML);
          const linkMatch = linkRegex.exec(itemXML);
          const descMatch = descRegex.exec(itemXML);

          if (titleMatch && linkMatch) {
            items.push({
              title: (titleMatch[1] || titleMatch[2] || '').trim(),
              link: (linkMatch[1] || '').trim(),
              description: (descMatch?.[1] || descMatch?.[2] || '').trim().replace(/<[^>]*>/g, '')
            });
          }
        }

        resolve(items.slice(0, 2)); // Top 2 items from each feed
      });
    }).on('error', reject);
  });
}

// ========================================
// SUMMARIZE WITH OLLAMA
// ========================================
async function summarizeWithOllama(title, description) {
  // Check if description is useless
  const uselessDescriptions = ['Comments', '', 'Read more', 'Continue reading'];
  const hasRealDescription = description &&
    description.length > 20 &&
    !uselessDescriptions.some(bad => description.trim() === bad);

  let prompt;
  if (hasRealDescription) {
    // We have real content
    prompt = `Summarize this news in 1-2 sentences:\n\nTitle: ${title}\n\n${description}`;
  } else {
    // Just a title - explain what this is likely about
    prompt = `Based on this headline, explain what this news story is likely about in 1-2 sentences:\n\n"${title}"`;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.ollama.model,
      prompt: prompt,
      stream: false
    });

    const options = {
      hostname: CONFIG.ollama.host,
      port: CONFIG.ollama.port,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve(json.response || 'No summary available');
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ========================================
// PROCESS FEEDS
// ========================================
async function processFeeds() {
  console.log('🔄 Fetching news feeds...');

  const allNews = [];

  for (const feedUrl of CONFIG.feeds) {
    try {
      console.log(`  📰 Fetching: ${feedUrl}`);
      const items = await fetchRSS(feedUrl);

      for (const item of items) {
        console.log(`    🤖 Summarizing: ${item.title.slice(0, 50)}...`);

        try {
          const summary = await summarizeWithOllama(
            item.title,
            item.description
          );

          allNews.push({
            title: item.title,
            link: item.link,
            originalDescription: item.description,
            aiSummary: summary,
            source: feedUrl,
            fetchedAt: new Date().toISOString()
          });

          console.log(`    ✅ Done`);
        } catch (error) {
          console.error(`    ❌ Summarize failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Feed fetch failed: ${error.message}`);
    }
  }

  // Save to JSON
  const existingNews = fs.existsSync(CONFIG.outputFile)
    ? JSON.parse(fs.readFileSync(CONFIG.outputFile, 'utf8'))
    : [];

  const updated = [...allNews, ...existingNews].slice(0, 100); // Keep last 100

  fs.writeFileSync(
    CONFIG.outputFile,
    JSON.stringify(updated, null, 2)
  );

  console.log(`\n✅ Saved ${allNews.length} news items to ${CONFIG.outputFile}`);
  console.log(`📊 Total items in database: ${updated.length}\n`);

  return allNews;
}

// ========================================
// GENERATE HTML PAGE
// ========================================
function generateNewsPage(newsItems) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI-Powered News Feed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fff;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      opacity: 0.6;
      margin-bottom: 40px;
    }
    .news-item {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 25px;
      transition: all 0.3s;
    }
    .news-item:hover {
      border-color: #667eea;
      transform: translateY(-2px);
    }
    .news-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .news-title a {
      color: #fff;
      text-decoration: none;
    }
    .news-title a:hover {
      color: #667eea;
    }
    .ai-summary {
      background: #0f0f0f;
      padding: 15px;
      border-radius: 8px;
      border-left: 3px solid #667eea;
      margin-bottom: 15px;
    }
    .meta {
      font-size: 0.9rem;
      opacity: 0.5;
      margin-top: 10px;
    }
    .tag {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 AI-Powered News Feed</h1>
    <p class="subtitle">Summarized by Ollama • Updated ${new Date().toLocaleString()}</p>

    ${newsItems.map(item => `
      <div class="news-item">
        <div class="news-title">
          <a href="${item.link}" target="_blank">${item.title}</a>
        </div>

        <div class="ai-summary">
          <span class="tag">AI Summary</span>
          ${item.aiSummary}
        </div>

        <div class="meta">
          Source: ${new URL(item.source).hostname} • ${new Date(item.fetchedAt).toLocaleString()}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `.trim();

  const htmlPath = path.join(__dirname, '../news.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`📄 Generated HTML page: ${htmlPath}`);
}

// ========================================
// MAIN
// ========================================
async function main() {
  console.log('🚀 Fetching News...\n');
  console.log(`📡 Fetching from ${CONFIG.feeds.length} feeds`);
  console.log(`🤖 Using Ollama: ${CONFIG.ollama.model}\n`);

  // Fetch news and generate page
  const newsItems = await processFeeds();
  generateNewsPage(newsItems);

  console.log('\n✨ Done! Visit http://localhost:8000/news.html to see your feed\n');
  console.log('💡 Run this script again to refresh the feed.');
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Error:', error.message);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFeeds, summarizeWithOllama };
