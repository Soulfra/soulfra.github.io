#!/usr/bin/env node

/**
 * Privacy.com for Domains - Automated Domain Deployment System
 *
 * Creates isolated, single-purpose domain deployments with one command:
 * node create-domain.js <domain-name> <domain-type>
 *
 * What this does automatically:
 * 1. Creates new GitHub repository
 * 2. Generates professional site content using Ollama (no API costs)
 * 3. Sets up GitHub Pages deployment
 * 4. Configures DNS via CloudFlare API (if credentials provided)
 * 5. Adds domain to soulfra.com portfolio
 *
 * Example:
 * node create-domain.js deathtodata search-engine
 * node create-domain.js calriven calendar-system
 * node create-domain.js cringeproof content-moderation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  githubUsername: 'Soulfra',
  githubToken: process.env.GITHUB_TOKEN || '',
  cloudflareToken: process.env.CLOUDFLARE_TOKEN || '',
  cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  ollamaModel: 'llama3.2:latest',
  portfolioSite: 'soulfra.com'
};

// Domain templates
const DOMAIN_TEMPLATES = {
  'search-engine': {
    description: 'Privacy-first search engine',
    features: ['Search API', 'Results page', 'Privacy dashboard', 'User authentication'],
    techStack: 'Vanilla JS + Node.js backend + DuckDuckGo API'
  },
  'calendar-system': {
    description: 'Smart calendar and scheduling system',
    features: ['Event management', 'Scheduling', 'Reminders', 'Calendar sync'],
    techStack: 'Vanilla JS + Node.js backend + Calendar API'
  },
  'content-moderation': {
    description: 'AI-powered content moderation platform',
    features: ['Content analysis', 'Moderation dashboard', 'Reporting', 'AI filtering'],
    techStack: 'Vanilla JS + Node.js + Ollama for AI'
  },
  'default': {
    description: 'Professional web application',
    features: ['Landing page', 'Dashboard', 'User authentication', 'API integration'],
    techStack: 'Vanilla JS + Node.js backend'
  }
};

class DomainAutomation {
  constructor(domainName, domainType) {
    this.domainName = domainName;
    this.domainType = domainType || 'default';
    this.repoName = `${domainName}.github.io`;
    this.template = DOMAIN_TEMPLATES[this.domainType] || DOMAIN_TEMPLATES.default;
    this.workDir = `/tmp/${this.repoName}`;
  }

  async run() {
    console.log(`\n🚀 Creating domain deployment for ${this.domainName}`);
    console.log(`📋 Type: ${this.domainType}`);
    console.log(`📦 Template: ${this.template.description}\n`);

    try {
      // Step 1: Create GitHub repository
      await this.createGitHubRepo();

      // Step 2: Generate site content
      await this.generateSiteContent();

      // Step 3: Setup GitHub Pages
      await this.setupGitHubPages();

      // Step 4: Configure DNS (if credentials provided)
      if (CONFIG.cloudflareToken && CONFIG.cloudflareZoneId) {
        await this.configureDNS();
      } else {
        console.log('\n⚠️  CloudFlare credentials not found - skipping DNS setup');
        console.log('   Set CLOUDFLARE_TOKEN and CLOUDFLARE_ZONE_ID to enable automatic DNS');
      }

      // Step 5: Add to portfolio
      await this.addToPortfolio();

      console.log(`\n✅ Domain ${this.domainName} deployed successfully!`);
      console.log(`\n📍 URLs:`);
      console.log(`   GitHub: https://github.com/${CONFIG.githubUsername}/${this.repoName}`);
      console.log(`   Live: https://${this.domainName}.com (once DNS propagates)`);
      console.log(`   Portfolio: https://${CONFIG.portfolioSite}\n`);

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  async createGitHubRepo() {
    console.log('📦 Step 1: Creating GitHub repository...');

    if (!CONFIG.githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    const repoData = JSON.stringify({
      name: this.repoName,
      description: `${this.template.description} - ${this.domainName}.com`,
      homepage: `https://${this.domainName}.com`,
      private: false,
      has_issues: true,
      has_projects: true,
      has_wiki: false,
      auto_init: false
    });

    try {
      await this.githubAPI('POST', '/user/repos', repoData);
      console.log(`   ✓ Repository created: ${this.repoName}`);
    } catch (error) {
      if (error.message.includes('422')) {
        console.log(`   ℹ️  Repository ${this.repoName} already exists, continuing...`);
      } else {
        throw error;
      }
    }
  }

  async generateSiteContent() {
    console.log('\n🎨 Step 2: Generating site content with Ollama...');

    // Create working directory
    if (fs.existsSync(this.workDir)) {
      execSync(`rm -rf ${this.workDir}`);
    }
    fs.mkdirSync(this.workDir, { recursive: true });

    // Initialize git
    execSync(`cd ${this.workDir} && git init`, { stdio: 'inherit' });
    execSync(`cd ${this.workDir} && git checkout -b main`, { stdio: 'inherit' });

    // Generate index.html using Ollama
    const prompt = `Create a professional, modern landing page for ${this.domainName}.com

Description: ${this.template.description}
Features: ${this.template.features.join(', ')}
Tech Stack: ${this.template.techStack}

Requirements:
- Single HTML file with embedded CSS and minimal JS
- Modern, clean design with good UX
- Mobile responsive
- Privacy-focused messaging
- Include navigation to main features
- Professional color scheme
- No external dependencies

Return ONLY the HTML code, no explanations.`;

    console.log('   🤖 Generating HTML with Ollama...');
    const html = await this.callOllama(prompt);

    // Save index.html
    fs.writeFileSync(path.join(this.workDir, 'index.html'), html);
    console.log('   ✓ index.html generated');

    // Create README
    const readme = `# ${this.domainName}.com

${this.template.description}

## Features

${this.template.features.map(f => `- ${f}`).join('\n')}

## Tech Stack

${this.template.techStack}

## Deployment

Auto-deployed via GitHub Pages to https://${this.domainName}.com

## Development

\`\`\`bash
# Run local server
python3 -m http.server 8000
# Visit http://localhost:8000
\`\`\`

---

Generated with Privacy.com for Domains automation
Part of the Soulfra ecosystem: https://${CONFIG.portfolioSite}
`;

    fs.writeFileSync(path.join(this.workDir, 'README.md'), readme);
    console.log('   ✓ README.md generated');

    // Create CNAME file
    fs.writeFileSync(path.join(this.workDir, 'CNAME'), `${this.domainName}.com`);
    console.log('   ✓ CNAME file created');
  }

  async setupGitHubPages() {
    console.log('\n🌐 Step 3: Setting up GitHub Pages...');

    // Commit and push
    execSync(`cd ${this.workDir} && git add -A`, { stdio: 'inherit' });
    execSync(`cd ${this.workDir} && git commit -m "Initial commit: Auto-generated ${this.domainType} deployment"`, { stdio: 'inherit' });
    execSync(`cd ${this.workDir} && git remote add origin https://${CONFIG.githubToken}@github.com/${CONFIG.githubUsername}/${this.repoName}.git`, { stdio: 'inherit' });
    execSync(`cd ${this.workDir} && git push -u origin main --force`, { stdio: 'inherit' });
    console.log('   ✓ Code pushed to GitHub');

    // Enable GitHub Pages via API
    try {
      const pagesData = JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      });
      await this.githubAPI('POST', `/repos/${CONFIG.githubUsername}/${this.repoName}/pages`, pagesData);
      console.log('   ✓ GitHub Pages enabled');
    } catch (error) {
      if (error.message.includes('409')) {
        console.log('   ℹ️  GitHub Pages already enabled');
      } else {
        console.log(`   ⚠️  Could not enable Pages via API (may need manual setup): ${error.message}`);
      }
    }
  }

  async configureDNS() {
    console.log('\n🌍 Step 4: Configuring DNS with CloudFlare...');

    const records = [
      {
        type: 'CNAME',
        name: this.domainName,
        content: `${CONFIG.githubUsername}.github.io`,
        proxied: true
      }
    ];

    for (const record of records) {
      try {
        const recordData = JSON.stringify(record);
        await this.cloudflareAPI('POST', `/zones/${CONFIG.cloudflareZoneId}/dns_records`, recordData);
        console.log(`   ✓ DNS record created: ${record.name} -> ${record.content}`);
      } catch (error) {
        console.log(`   ⚠️  DNS record may already exist: ${error.message}`);
      }
    }
  }

  async addToPortfolio() {
    console.log('\n📚 Step 5: Adding to portfolio...');

    const portfolioFile = path.join(__dirname, 'data', 'domain-portfolio.json');
    let portfolio = { domains: [] };

    if (fs.existsSync(portfolioFile)) {
      portfolio = JSON.parse(fs.readFileSync(portfolioFile, 'utf8'));
    }

    // Check if domain already exists
    const existingIndex = portfolio.domains.findIndex(d => d.name === this.domainName);

    const domainEntry = {
      name: this.domainName,
      url: `https://${this.domainName}.com`,
      type: this.domainType,
      description: this.template.description,
      features: this.template.features,
      techStack: this.template.techStack,
      githubRepo: `https://github.com/${CONFIG.githubUsername}/${this.repoName}`,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    if (existingIndex >= 0) {
      portfolio.domains[existingIndex] = { ...portfolio.domains[existingIndex], ...domainEntry };
      console.log('   ✓ Portfolio entry updated');
    } else {
      portfolio.domains.push(domainEntry);
      console.log('   ✓ Portfolio entry added');
    }

    // Ensure data directory exists
    fs.mkdirSync(path.dirname(portfolioFile), { recursive: true });
    fs.writeFileSync(portfolioFile, JSON.stringify(portfolio, null, 2));
  }

  async callOllama(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: CONFIG.ollamaModel,
        prompt: prompt,
        stream: false
      });

      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response.response);
          } catch (error) {
            reject(new Error(`Ollama parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => reject(new Error(`Ollama error: ${error.message}`)));
      req.write(data);
      req.end();
    });
  }

  async githubAPI(method, endpoint, data) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${CONFIG.githubToken}`,
          'User-Agent': 'Soulfra-Domain-Automation',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body ? JSON.parse(body) : {});
          } else {
            reject(new Error(`GitHub API ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (error) => reject(error));
      if (data) req.write(data);
      req.end();
    });
  }

  async cloudflareAPI(method, endpoint, data) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cloudflare.com',
        path: `/client/v4${endpoint}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${CONFIG.cloudflareToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const response = JSON.parse(body);
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(`CloudFlare API error: ${JSON.stringify(response.errors)}`));
          }
        });
      });

      req.on('error', (error) => reject(error));
      if (data) req.write(data);
      req.end();
    });
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Usage: node create-domain.js <domain-name> [domain-type]

Domain Types:
  - search-engine      Privacy-first search engine
  - calendar-system    Smart calendar and scheduling
  - content-moderation AI-powered content moderation
  - default            Generic professional site

Examples:
  node create-domain.js deathtodata search-engine
  node create-domain.js calriven calendar-system
  node create-domain.js myapp default

Environment Variables:
  GITHUB_TOKEN         GitHub personal access token (required)
  CLOUDFLARE_TOKEN     CloudFlare API token (optional)
  CLOUDFLARE_ZONE_ID   CloudFlare zone ID (optional)
`);
    process.exit(1);
  }

  const [domainName, domainType] = args;
  const automation = new DomainAutomation(domainName, domainType);
  automation.run().catch(console.error);
}

module.exports = DomainAutomation;
