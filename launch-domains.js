#!/usr/bin/env node
/**
 * Domain Launch Script
 *
 * Auto-generates complete professional websites for all domains using:
 * - Ollama for content generation (no API costs)
 * - Domain contexts for brand consistency
 * - Professional HTML templates matching existing site quality
 *
 * Usage: node launch-domains.js [domain]
 *   or: node launch-domains.js (launches all domains)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const TemplateGenerator = require('./api/template-generator.js');

const API_BASE = 'http://localhost:5050/api';
const DOMAINS = ['soulfra', 'calriven', 'deathtodata', 'cringeproof'];

const templateGen = new TemplateGenerator();

/**
 * Make HTTP request to API
 */
function apiRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    // Construct full URL - API_BASE ends with /api, endpoint starts with /
    const fullUrl = `${API_BASE}${endpoint}`;
    const data = JSON.stringify(body);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(fullUrl, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Check if backend is running
 */
async function checkBackend() {
  return new Promise((resolve) => {
    // API_BASE already includes /api, so we just add /health
    http.get(`${API_BASE}/health`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

/**
 * Generate content via API
 */
async function generateContent(domain, type, topic) {
  try {
    const response = await apiRequest('/content/generate', {
      domain,
      type,
      topic,
      skipCache: true  // Force fresh generation
    });

    if (response.success && response.data && response.data.content) {
      return response.data.content.content;
    } else {
      console.error(`⚠️  API returned unexpected format:`, JSON.stringify(response).substring(0, 200));
      return null;
    }
  } catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
    return null;
  }
}

/**
 * Launch a single domain
 */
async function launchDomain(domain) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Launching: ${domain}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create directory structure
  const domainDir = path.join(__dirname, domain);
  const blogDir = path.join(domainDir, 'blog');

  if (!fs.existsSync(domainDir)) {
    fs.mkdirSync(domainDir, { recursive: true });
  }
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  console.log('📁 Directory structure created\n');

  // 1. Generate Landing Page
  console.log('📄 Generating landing page...');
  const landingContent = await generateContent(
    domain,
    'landing_page',
    `Homepage for ${domain} with hero section, key features, and value proposition`
  );

  if (landingContent) {
    const landingHTML = templateGen.generateLandingPage(domain, landingContent);
    fs.writeFileSync(path.join(domainDir, 'index.html'), landingHTML);
    console.log(`✅ Landing page created: ${domain}/index.html`);
  } else {
    console.log('⚠️  Landing page generation failed');
  }

  await sleep(1000);

  // 2. Generate Pitch Deck
  console.log('\n📊 Generating pitch deck...');
  const pitchContent = await generateContent(
    domain,
    'article',
    `Investor pitch deck for ${domain}: problem, solution, market opportunity, business model, traction, team, and ask`
  );

  if (pitchContent) {
    const pitchHTML = templateGen.generatePitchDeck(domain, pitchContent);
    fs.writeFileSync(path.join(domainDir, 'pitch-deck.html'), pitchHTML);
    console.log(`✅ Pitch deck created: ${domain}/pitch-deck.html`);
  } else {
    console.log('⚠️  Pitch deck generation failed');
  }

  await sleep(1000);

  // 3. Generate Business Plan
  console.log('\n📋 Generating business plan...');
  const businessContent = await generateContent(
    domain,
    'article',
    `Business plan for ${domain}: executive summary, market analysis, competitive advantage, revenue strategy, financial projections, and roadmap`
  );

  if (businessContent) {
    const businessHTML = templateGen.generateBusinessPlan(domain, businessContent);
    fs.writeFileSync(path.join(domainDir, 'business-plan.html'), businessHTML);
    console.log(`✅ Business plan created: ${domain}/business-plan.html`);
  } else {
    console.log('⚠️  Business plan generation failed');
  }

  await sleep(1000);

  // 4. Generate Blog Posts (5 posts)
  console.log('\n📝 Generating blog posts...');

  const blogTopics = [
    `Why ${domain} matters and the problem it solves`,
    `How ${domain} works: technology and architecture`,
    `Getting started with ${domain}: a beginner's guide`,
    `${domain} vs traditional solutions: key differences`,
    `The future of ${domain} and our roadmap`
  ];

  const blogPosts = [];
  let postNum = 1;

  for (const topic of blogTopics) {
    const blogContent = await generateContent(domain, 'article', topic);

    if (blogContent) {
      const slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 60);

      const title = topic.replace(`${domain}`, domain.charAt(0).toUpperCase() + domain.slice(1));
      const postHTML = templateGen.generateBlogPost(domain, title, blogContent);

      fs.writeFileSync(path.join(blogDir, `${slug}.html`), postHTML);
      console.log(`  ✅ Post ${postNum}: ${title}`);

      blogPosts.push({
        title,
        slug,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        excerpt: blogContent.substring(0, 150).replace(/<[^>]*>/g, '') + '...'
      });

      postNum++;
      await sleep(500);
    }
  }

  // 5. Generate Blog Index
  if (blogPosts.length > 0) {
    const blogIndexHTML = templateGen.generateBlogIndex(domain, blogPosts);
    fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndexHTML);
    console.log(`\n✅ Blog index created: ${domain}/blog/index.html`);
  }

  // 6. Create README
  const readme = `# ${domain.charAt(0).toUpperCase() + domain.slice(1)}

Auto-generated professional website using local AI (Ollama).

## Files

- \`index.html\` - Landing page
- \`pitch-deck.html\` - Investor pitch deck
- \`business-plan.html\` - Full business plan
- \`blog/\` - Blog posts (${blogPosts.length} articles)

## View Locally

\`\`\`bash
cd ${domain}
python3 -m http.server 8080
# Visit: http://localhost:8080
\`\`\`

## Deploy

This site is ready to deploy to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

## Generated

Content generated using:
- **Ollama** (local LLM - no API costs)
- **Domain contexts** from \`api/llm/domain-context.js\`
- **Professional templates** matching existing site quality
- **Zero external API dependencies**
`;

  fs.writeFileSync(path.join(domainDir, 'README.md'), readme);

  console.log(`\n✅ ${domain} launch complete!`);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Domain Launch System');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Using: Ollama + Professional Templates + Domain Contexts\n');

  // Check if backend is running
  console.log('🔍 Checking backend...');
  const backendRunning = await checkBackend();

  if (!backendRunning) {
    console.log('❌ Backend not running. Start it first:');
    console.log('   bash start.sh');
    process.exit(1);
  }

  console.log('✅ Backend is running\n');

  // Determine which domains to launch
  const targetDomain = process.argv[2];
  const domainsToLaunch = targetDomain
    ? (DOMAINS.includes(targetDomain) ? [targetDomain] : [])
    : DOMAINS;

  if (domainsToLaunch.length === 0) {
    console.log(`❌ Invalid domain: ${targetDomain}`);
    console.log(`Valid domains: ${DOMAINS.join(', ')}`);
    process.exit(1);
  }

  // Launch each domain
  for (const domain of domainsToLaunch) {
    try {
      await launchDomain(domain);
    } catch (error) {
      console.error(`❌ Failed to launch ${domain}: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 LAUNCH COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('View your sites:');
  for (const domain of domainsToLaunch) {
    console.log(`  🌐 http://localhost:8000/${domain}`);
  }

  console.log('\nNext steps:');
  console.log('  1. Review generated content in each domain folder');
  console.log('  2. Customize as needed');
  console.log('  3. Deploy to GitHub Pages or your hosting');
  console.log('  4. Point your actual domains to these sites\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { launchDomain, generateContent };
