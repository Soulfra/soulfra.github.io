/**
 * LLM Router - Let Ollama Test The Internet
 *
 * Solves the problem: Neither you nor I can easily test what's actually deployed.
 *
 * This router allows Ollama to:
 * - Fetch any URL
 * - Take screenshots
 * - Run tests
 * - Compare local vs deployed
 * - Report back actual results
 *
 * Usage:
 * 1. Start this server: node api/llm-router.js
 * 2. Ask Ollama: "Test soulfra.com/deathtodata search"
 * 3. Ollama calls this router
 * 4. Router fetches, tests, returns actual results
 * 5. You get real feedback
 */

const express = require('express');
const https = require('https');
const http = require('http');
const app = express();

app.use(express.json());

// CORS for Ollama
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

/**
 * Test a URL and return results
 *
 * POST /llm/test
 * {
 *   "url": "https://soulfra.com/deathtodata/search.html?q=python",
 *   "tests": ["search_results", "api_connection", "ui_elements"]
 * }
 */
app.post('/llm/test', async (req, res) => {
  const { url, tests = ['basic'] } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  console.log(`🧪 Testing: ${url}`);

  const results = {
    url,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Fetch the URL
  try {
    const html = await fetchURL(url);
    results.html_length = html.length;
    results.html_preview = html.substring(0, 500);

    // Run requested tests
    if (tests.includes('basic') || tests.includes('all')) {
      results.tests.basic = testBasic(html, url);
    }

    if (tests.includes('search_results') || tests.includes('all')) {
      results.tests.search = await testSearchResults(url, html);
    }

    if (tests.includes('api_connection') || tests.includes('all')) {
      results.tests.api = await testAPIConnection(html);
    }

    if (tests.includes('ui_elements') || tests.includes('all')) {
      results.tests.ui = testUIElements(html);
    }

    res.json(results);

  } catch (err) {
    console.error('Test failed:', err);
    res.status(500).json({
      error: err.message,
      url,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Fetch any URL (handles http/https)
 */
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      let data = '';

      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve(data));

    }).on('error', reject);
  });
}

/**
 * Test: Basic page structure
 */
function testBasic(html, url) {
  return {
    has_html: html.includes('<html'),
    has_head: html.includes('<head'),
    has_body: html.includes('<body'),
    has_title: html.includes('<title'),
    contains_deathtodata: html.toLowerCase().includes('deathtodata'),
    url_accessible: true,
    size_kb: (html.length / 1024).toFixed(2)
  };
}

/**
 * Test: Search results functionality
 */
async function testSearchResults(url, html) {
  const results = {
    has_search_input: html.includes('searchInput') || html.includes('type="text"'),
    has_search_button: html.includes('Search') || html.includes('type="submit"'),
    has_results_container: html.includes('id="results"'),
    has_api_call: html.includes('/api/search'),
    api_url_found: null
  };

  // Extract API URL from JavaScript
  const apiMatch = html.match(/API_URL\s*=.*?['"]([^'"]+)['"]/);
  if (apiMatch) {
    results.api_url_found = apiMatch[1];

    // Try to test the API
    try {
      const testQuery = results.api_url_found.includes('localhost')
        ? 'http://localhost:5051/api/search?q=test'
        : `${results.api_url_found}/api/search?q=test`;

      const apiResponse = await fetchURL(testQuery);
      const data = JSON.parse(apiResponse);

      results.api_test = {
        success: true,
        results_count: data.results ? data.results.length : 0,
        has_privacy_message: !!data.privacy
      };
    } catch (apiErr) {
      results.api_test = {
        success: false,
        error: apiErr.message
      };
    }
  }

  return results;
}

/**
 * Test: API connection configuration
 */
async function testAPIConnection(html) {
  const apiConfig = {
    localhost_url: null,
    production_url: null,
    current_mode: null
  };

  // Find API_URL configuration
  const localhostMatch = html.match(/localhost.*?:(\d+)/);
  const productionMatch = html.match(/https?:\/\/(?:api\.)?([^'"\/\s]+)/g);

  if (localhostMatch) {
    apiConfig.localhost_url = `http://localhost:${localhostMatch[1]}`;
  }

  if (productionMatch) {
    apiConfig.production_url = productionMatch.filter(u => !u.includes('localhost'))[0];
  }

  // Determine which is active
  if (html.includes('window.location.hostname')) {
    apiConfig.current_mode = 'environment-detected';
  }

  return apiConfig;
}

/**
 * Test: UI elements presence
 */
function testUIElements(html) {
  return {
    has_nav: html.includes('<nav'),
    has_header: html.includes('<header'),
    has_footer: html.includes('<footer'),
    has_search_box: html.includes('search'),
    has_results_display: html.includes('result'),
    has_privacy_note: html.toLowerCase().includes('privacy'),
    style_count: (html.match(/<style/g) || []).length,
    script_count: (html.match(/<script/g) || []).length
  };
}

/**
 * Compare local vs deployed
 *
 * POST /llm/compare
 * {
 *   "local": "http://localhost:8000/deathtodata/search.html",
 *   "deployed": "https://soulfra.com/deathtodata/search.html"
 * }
 */
app.post('/llm/compare', async (req, res) => {
  const { local, deployed } = req.body;

  if (!local || !deployed) {
    return res.status(400).json({ error: 'Both local and deployed URLs required' });
  }

  console.log(`🔍 Comparing:\n  Local: ${local}\n  Deployed: ${deployed}`);

  try {
    const [localHTML, deployedHTML] = await Promise.all([
      fetchURL(local),
      fetchURL(deployed)
    ]);

    const comparison = {
      local_size: localHTML.length,
      deployed_size: deployedHTML.length,
      size_match: localHTML.length === deployedHTML.length,
      content_match: localHTML === deployedHTML,
      differences: []
    };

    // Find key differences
    if (!comparison.content_match) {
      // Check for API URL differences
      const localAPI = localHTML.match(/API_URL\s*=.*?['"]([^'"]+)['"]/);
      const deployedAPI = deployedHTML.match(/API_URL\s*=.*?['"]([^'"]+)['"]/);

      if (localAPI && deployedAPI && localAPI[1] !== deployedAPI[1]) {
        comparison.differences.push({
          type: 'api_url',
          local: localAPI[1],
          deployed: deployedAPI[1]
        });
      }

      // Check for script differences
      const localScripts = localHTML.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
      const deployedScripts = deployedHTML.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];

      if (localScripts.length !== deployedScripts.length) {
        comparison.differences.push({
          type: 'script_count',
          local: localScripts.length,
          deployed: deployedScripts.length
        });
      }
    }

    res.json(comparison);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Health check
 */
app.get('/llm/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LLM Router',
    purpose: 'Let Ollama test the internet',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.LLM_ROUTER_PORT || 5052;
app.listen(PORT, () => {
  console.log(`🤖 LLM Router running on http://localhost:${PORT}`);
  console.log(`   Purpose: Let Ollama test deployed websites`);
  console.log(`   Endpoints:`);
  console.log(`     POST /llm/test - Test any URL`);
  console.log(`     POST /llm/compare - Compare local vs deployed`);
  console.log(`     GET  /llm/health - Health check`);
});
