/**
 * Pitch Deck Generator
 *
 * Auto-generates pitch deck from daily check-in emails:
 * - Problem: Extracted from ideas/ folder
 * - Solution: Extracted from code/ folder
 * - Traction: Extracted from wins/ folder
 * - Team: Your 12 brands = 12 proven skills
 * - Ask: What you need (funding/contracts/distribution)
 *
 * Updates automatically as you ship
 * Used for government contracts, VC pitches, etc.
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class PitchDeckGenerator {
  constructor(emailFiler, sheetsAuth) {
    this.filer = emailFiler;
    this.sheets = sheetsAuth;
    this.sheetName = 'pitch_decks';

    // Your 12 brands mapped to capabilities
    this.brands = [
      {
        name: 'Soulfra',
        icon: '🔐',
        capability: 'Security Engineering',
        proof: 'Ed25519 crypto • SSO • Zero-knowledge proofs',
        url: 'https://soulfra.github.io'
      },
      {
        name: 'Calriven',
        icon: '🤖',
        capability: 'AI/ML Engineering',
        proof: 'Multi-LLM routing • ELO systems • Agent marketplace',
        url: 'https://calriven.com'
      },
      {
        name: 'CALOS',
        icon: '🧠',
        capability: 'Systems Architecture',
        proof: 'Agent router • Gmail relay • Zero-cost infrastructure',
        url: 'https://github.com/calos'
      },
      {
        name: 'Thoughtstream',
        icon: '💭',
        capability: 'Content Generation',
        proof: 'Auto-blog • Weekly summaries • Thought logging',
        url: null
      },
      {
        name: 'BountyBoard',
        icon: '💰',
        capability: 'Talent Matching',
        proof: 'ICP builder • Skill detection • Pipeline management',
        url: null
      },
      {
        name: 'DevRagebait',
        icon: '🔥',
        capability: 'Viral Marketing',
        proof: 'Meme generator • GIF/MP4 export • 11 templates',
        url: null
      },
      {
        name: 'VoiceConsultant',
        icon: '🎙️',
        capability: 'Voice AI',
        proof: 'Speech-to-text • Context-aware • Skill extraction',
        url: null
      },
      {
        name: 'RepoExplorer',
        icon: '📁',
        capability: 'Code Analysis',
        proof: 'GitHub integration • Repo search • File parsing',
        url: null
      },
      {
        name: 'EquityGame',
        icon: '🎮',
        capability: 'Gamification',
        proof: 'Tier systems • Equity visualization • Engagement loops',
        url: null
      },
      {
        name: 'MatrixChat',
        icon: '💬',
        capability: 'Real-time Collaboration',
        proof: 'Self-hosted • Room management • Community building',
        url: null
      },
      {
        name: 'GmailRelay',
        icon: '📧',
        capability: 'Email Infrastructure',
        proof: 'Zero-cost relay • Google Sheets DB • Rate limiting',
        url: null
      },
      {
        name: 'PitchDeck',
        icon: '📊',
        capability: 'Business Development',
        proof: 'Auto-generated decks • Contract matching • Reverse applications',
        url: null
      }
    ];

    console.log('[PitchDeckGenerator] Initialized');
  }

  /**
   * Generate pitch deck from recent activity
   */
  async generateDeck(userId, options = {}) {
    try {
      const {
        days = 30,
        title = '',
        targetAudience = 'government', // government, vc, customer
        ask = ''
      } = options;

      // Get recent activity from folders
      const activity = await this.filer.getRecentActivity(userId, days);

      const problems = activity.find(a => a.category === 'ideas')?.items || [];
      const solutions = activity.find(a => a.category === 'code')?.items || [];
      const wins = activity.find(a => a.category === 'wins')?.items || [];

      // Generate deck
      const deck = {
        userId,
        title: title || this._generateTitle(targetAudience),
        slides: [
          this._generateCoverSlide(targetAudience),
          this._generateProblemSlide(problems),
          this._generateSolutionSlide(solutions),
          this._generateTractionSlide(wins),
          this._generateTeamSlide(),
          this._generateCapabilitiesSlide(),
          this._generateAskSlide(ask, targetAudience)
        ],
        createdAt: Date.now(),
        targetAudience,
        daysOfData: days
      };

      // Save to Sheets
      await this._saveDeck(deck);

      console.log('[PitchDeckGenerator] Generated deck:', deck.title);

      return { success: true, deck };

    } catch (error) {
      console.error('[PitchDeckGenerator] Generate deck error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate cover slide
   * @private
   */
  _generateCoverSlide(audience) {
    const titles = {
      government: 'Building the Future of Secure AI Infrastructure',
      vc: 'The Operating System for AI-Native Development',
      customer: 'Ship 10x Faster with AI-Powered Tools'
    };

    return {
      type: 'cover',
      title: titles[audience] || titles.government,
      subtitle: 'A Portfolio of 12 Live Products Proving 12 Core Capabilities',
      author: 'Matt Mauer',
      email: 'matt@soulfra.com',
      github: 'github.com/Soulfra'
    };
  }

  /**
   * Generate problem slide from ideas folder
   * @private
   */
  _generateProblemSlide(problems) {
    // Extract top 3 problems
    const topProblems = problems.slice(0, 3).map(p => {
      const text = p.body.substring(0, 150);
      return this._extractFirstSentence(text);
    });

    return {
      type: 'problem',
      title: 'The Problem',
      subtitle: 'What developers are struggling with',
      bullets: topProblems.length > 0 ? topProblems : [
        'Developers waste time on infrastructure instead of building',
        'AI tools are expensive and vendor-locked',
        'Security is an afterthought, not built-in'
      ]
    };
  }

  /**
   * Generate solution slide from code folder
   * @private
   */
  _generateSolutionSlide(solutions) {
    // Extract code-based solutions
    const topSolutions = solutions.slice(0, 3).map(s => {
      const text = s.body.substring(0, 150);
      return this._extractFirstSentence(text);
    });

    return {
      type: 'solution',
      title: 'The Solution',
      subtitle: 'Open-source, zero-cost, AI-native tools',
      bullets: topSolutions.length > 0 ? topSolutions : [
        'Zero-cost infrastructure using free tiers (Sheets, Gmail, GitHub Pages)',
        'Multi-LLM routing with ELO-based selection (best model, lowest cost)',
        'Security-first design with Ed25519 crypto and zero-knowledge proofs'
      ]
    };
  }

  /**
   * Generate traction slide from wins folder
   * @private
   */
  _generateTractionSlide(wins) {
    const metrics = {
      productsLive: 12,
      daysBuilding: Math.floor((Date.now() - new Date('2025-01-01')) / (1000 * 60 * 60 * 24)),
      githubRepos: 12,
      totalWins: wins.length
    };

    return {
      type: 'traction',
      title: 'Traction',
      subtitle: 'Built and shipped in public',
      metrics: [
        { label: 'Products Live', value: metrics.productsLive, icon: '🚀' },
        { label: 'Days Building', value: metrics.daysBuilding, icon: '📅' },
        { label: 'GitHub Repos', value: metrics.githubRepos, icon: '📁' },
        { label: 'Wins Logged', value: metrics.totalWins, icon: '🎯' }
      ],
      recentWins: wins.slice(0, 3).map(w => this._extractFirstSentence(w.body))
    };
  }

  /**
   * Generate team slide
   * @private
   */
  _generateTeamSlide() {
    return {
      type: 'team',
      title: 'Team',
      subtitle: 'Solo founder with proven execution',
      founder: {
        name: 'Matt Mauer',
        role: 'Builder',
        bio: 'Solo technical founder building 12 products in parallel. Each product proves a different capability. No team, no funding, just shipping.',
        proof: '12 live products = 12 proven skills'
      }
    };
  }

  /**
   * Generate capabilities slide (12 brands)
   * @private
   */
  _generateCapabilitiesSlide() {
    return {
      type: 'capabilities',
      title: 'Capabilities',
      subtitle: 'Each brand proves a different skill',
      brands: this.brands
    };
  }

  /**
   * Generate ask slide
   * @private
   */
  _generateAskSlide(customAsk, audience) {
    const defaultAsks = {
      government: {
        title: 'The Ask',
        subtitle: 'Partner to secure government infrastructure',
        bullets: [
          '$500K SBIR/STTR contract for secure AI tooling',
          'Access to government developer communities',
          'Partnership on cybersecurity initiatives'
        ],
        cta: 'Apply to fund this work: soulfra.github.io/apply'
      },
      vc: {
        title: 'The Ask',
        subtitle: 'Seed funding to scale',
        bullets: [
          '$1M seed round for team + infrastructure',
          'Intro to enterprise customers',
          'Partnership with AI infrastructure providers'
        ],
        cta: 'Apply to invest: soulfra.github.io/apply'
      },
      customer: {
        title: 'Get Started',
        subtitle: 'Try it free, upgrade when ready',
        bullets: [
          'Free tier: 1K tokens/day',
          'Pro tier: $20/month, 1M tokens',
          'Enterprise: Custom pricing + support'
        ],
        cta: 'Start building: soulfra.github.io'
      }
    };

    const ask = defaultAsks[audience] || defaultAsks.government;

    if (customAsk) {
      ask.bullets = [customAsk];
    }

    return ask;
  }

  /**
   * Generate title based on audience
   * @private
   */
  _generateTitle(audience) {
    const titles = {
      government: 'Government Pitch: Secure AI Infrastructure',
      vc: 'Seed Round: AI-Native Developer Tools',
      customer: 'Product Demo: Ship Faster with AI'
    };
    return titles[audience] || titles.government;
  }

  /**
   * Extract first sentence from text
   * @private
   */
  _extractFirstSentence(text) {
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0].trim() : text.substring(0, 100) + '...';
  }

  /**
   * Export deck as markdown
   */
  exportAsMarkdown(deck) {
    let md = '';

    deck.slides.forEach((slide, idx) => {
      md += `---\n\n`; // Slide separator

      if (slide.type === 'cover') {
        md += `# ${slide.title}\n\n`;
        md += `**${slide.subtitle}**\n\n`;
        md += `${slide.author}\n`;
        md += `${slide.email} • ${slide.github}\n\n`;
      }
      else if (slide.type === 'problem' || slide.type === 'solution') {
        md += `# ${slide.title}\n\n`;
        md += `*${slide.subtitle}*\n\n`;
        slide.bullets.forEach(bullet => {
          md += `- ${bullet}\n`;
        });
        md += `\n`;
      }
      else if (slide.type === 'traction') {
        md += `# ${slide.title}\n\n`;
        md += `*${slide.subtitle}*\n\n`;
        slide.metrics.forEach(metric => {
          md += `**${metric.icon} ${metric.label}:** ${metric.value}\n\n`;
        });
        if (slide.recentWins.length > 0) {
          md += `### Recent Wins\n\n`;
          slide.recentWins.forEach(win => {
            md += `- ${win}\n`;
          });
          md += `\n`;
        }
      }
      else if (slide.type === 'team') {
        md += `# ${slide.title}\n\n`;
        md += `**${slide.founder.name}** - ${slide.founder.role}\n\n`;
        md += `${slide.founder.bio}\n\n`;
        md += `*${slide.founder.proof}*\n\n`;
      }
      else if (slide.type === 'capabilities') {
        md += `# ${slide.title}\n\n`;
        md += `*${slide.subtitle}*\n\n`;
        slide.brands.forEach(brand => {
          md += `### ${brand.icon} ${brand.name}\n`;
          md += `**${brand.capability}**\n`;
          md += `${brand.proof}\n`;
          if (brand.url) md += `[View →](${brand.url})\n`;
          md += `\n`;
        });
      }
      else if (slide.title === 'The Ask' || slide.title === 'Get Started') {
        md += `# ${slide.title}\n\n`;
        md += `*${slide.subtitle}*\n\n`;
        slide.bullets.forEach(bullet => {
          md += `- ${bullet}\n`;
        });
        md += `\n**${slide.cta}**\n\n`;
      }
    });

    return md;
  }

  /**
   * Export deck as HTML
   */
  exportAsHTML(deck) {
    const slides = deck.slides.map(slide => {
      if (slide.type === 'cover') {
        return `
          <div class="slide cover">
            <h1>${slide.title}</h1>
            <h2>${slide.subtitle}</h2>
            <div class="author">
              <p>${slide.author}</p>
              <p>${slide.email} • ${slide.github}</p>
            </div>
          </div>
        `;
      }
      else if (slide.type === 'problem' || slide.type === 'solution') {
        return `
          <div class="slide">
            <h1>${slide.title}</h1>
            <h3>${slide.subtitle}</h3>
            <ul>
              ${slide.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      else if (slide.type === 'traction') {
        return `
          <div class="slide traction">
            <h1>${slide.title}</h1>
            <h3>${slide.subtitle}</h3>
            <div class="metrics">
              ${slide.metrics.map(m => `
                <div class="metric">
                  <div class="metric-icon">${m.icon}</div>
                  <div class="metric-value">${m.value}</div>
                  <div class="metric-label">${m.label}</div>
                </div>
              `).join('')}
            </div>
            ${slide.recentWins.length > 0 ? `
              <h3>Recent Wins</h3>
              <ul>
                ${slide.recentWins.map(w => `<li>${w}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      }
      else if (slide.type === 'capabilities') {
        return `
          <div class="slide capabilities">
            <h1>${slide.title}</h1>
            <h3>${slide.subtitle}</h3>
            <div class="brands-grid">
              ${slide.brands.map(b => `
                <div class="brand-card">
                  <div class="brand-icon">${b.icon}</div>
                  <h4>${b.name}</h4>
                  <p class="capability">${b.capability}</p>
                  <p class="proof">${b.proof}</p>
                  ${b.url ? `<a href="${b.url}">View →</a>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      else {
        return `
          <div class="slide">
            <h1>${slide.title}</h1>
            <h3>${slide.subtitle}</h3>
            <ul>
              ${slide.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
            <p class="cta">${slide.cta}</p>
          </div>
        `;
      }
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${deck.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; }
    .slide {
      min-height: 100vh;
      padding: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      page-break-after: always;
    }
    .slide.cover { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    h1 { font-size: 3rem; margin-bottom: 20px; }
    h2 { font-size: 1.5rem; opacity: 0.9; }
    h3 { font-size: 1.2rem; opacity: 0.7; margin-bottom: 30px; }
    ul { font-size: 1.5rem; line-height: 2; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; margin: 40px 0; }
    .metric { text-align: center; }
    .metric-icon { font-size: 3rem; }
    .metric-value { font-size: 3rem; font-weight: bold; color: #667eea; }
    .metric-label { font-size: 1rem; opacity: 0.7; }
    .brands-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 40px; }
    .brand-card { padding: 20px; border: 2px solid #eee; border-radius: 8px; }
    .brand-icon { font-size: 2rem; margin-bottom: 10px; }
    .capability { font-weight: bold; margin: 10px 0; }
    .proof { font-size: 0.9rem; opacity: 0.7; }
    .cta { font-size: 1.5rem; font-weight: bold; margin-top: 40px; color: #667eea; }
  </style>
</head>
<body>
  ${slides}
</body>
</html>`;
  }

  /**
   * Save deck to Sheets
   * @private
   */
  async _saveDeck(deck) {
    const row = [
      deck.userId,
      deck.title,
      JSON.stringify(deck.slides),
      deck.createdAt,
      deck.targetAudience,
      deck.daysOfData
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:F:append?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Get all decks for user
   */
  async getDecks(userId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:F?key=${this.sheets.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const rows = data.values || [];

      const decks = rows
        .slice(1)
        .filter(r => r[0] === userId)
        .map(r => ({
          userId: r[0],
          title: r[1],
          slides: JSON.parse(r[2]),
          createdAt: parseInt(r[3]),
          targetAudience: r[4],
          daysOfData: parseInt(r[5])
        }));

      decks.sort((a, b) => b.createdAt - a.createdAt);
      return decks;

    } catch (error) {
      console.error('[PitchDeckGenerator] Get decks error:', error);
      return [];
    }
  }

  /**
   * Initialize table
   */
  async initTable() {
    const headers = ['userId', 'title', 'slides', 'createdAt', 'targetAudience', 'daysOfData'];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A1:F1?key=${this.sheets.apiKey}`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.values?.length > 0) {
        console.log('[PitchDeckGenerator] Table exists');
        return { success: true };
      }
    }

    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A1:F1?valueInputOption=RAW&key=${this.sheets.apiKey}`;
    await fetch(createUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [headers] })
    });

    console.log('[PitchDeckGenerator] Table initialized');
    return { success: true };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.PitchDeckGenerator = PitchDeckGenerator;
}

console.log('[PitchDeckGenerator] Module loaded');
