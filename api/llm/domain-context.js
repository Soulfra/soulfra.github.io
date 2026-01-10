/**
 * Domain Context System
 *
 * Injects domain-specific knowledge into LLM prompts to prevent hallucinations.
 * Each domain has its own identity, mission, and focus areas.
 *
 * Domains:
 * - Soulfra: Identity & Security platform
 * - Calriven: AI Platform for model routing
 * - DeathToData: Privacy-first search engine
 * - CringeProof: Prediction market for accountability
 *
 * Usage:
 *   const context = DomainContext.getContext('soulfra');
 *   const prompt = DomainContext.injectContext(userQuery, 'soulfra');
 *   const sysprompt = DomainContext.getSystemPrompt('calriven');
 */

class DomainContext {
  constructor() {
    this.DOMAINS = {
      soulfra: {
        name: 'Soulfra',
        tagline: 'Your keys. Your identity. Period.',
        category: 'Identity & Security',
        url: 'https://soulfra.com',
        githubPages: 'https://soulfra.github.io',

        mission: 'Self-sovereign identity and zero-knowledge authentication. We believe your identity belongs to you—not corporations, not governments, not anyone else.',

        focus: [
          'Self-sovereign identity (SSI)',
          'Zero-knowledge proofs',
          'Decentralized authentication',
          'Public key infrastructure (PKI)',
          'Identity verification without surveillance',
          'Cryptographic key management',
          'Blockchain-based identity',
          'Privacy-preserving credentials'
        ],

        technologies: [
          'Web3 wallets',
          'Zero-knowledge SNARKs',
          'Decentralized identifiers (DIDs)',
          'Verifiable credentials',
          'Public/private key cryptography',
          'Ethereum smart contracts',
          'IPFS for decentralized storage'
        ],

        values: [
          'Privacy by default',
          'User ownership of data',
          'No central authority',
          'Cryptographic proof over trust',
          'Open source and transparent'
        ],

        useCases: [
          'Login without passwords (private keys)',
          'Prove age without revealing birthdate',
          'Verify credentials without sharing documents',
          'Anonymous authentication',
          'Cross-platform identity portability'
        ]
      },

      calriven: {
        name: 'Calriven',
        tagline: 'Best AI for the job. Every time.',
        category: 'AI Platform',
        url: 'https://calriven.com',
        githubPages: 'https://soulfra.github.io/calriven',

        mission: 'Intelligent AI routing that selects the optimal model for each task. We match queries to the best-suited AI, whether it\'s GPT-4, Claude, Mistral, or your custom models.',

        focus: [
          'LLM routing and orchestration',
          'Model selection algorithms',
          'AI performance optimization',
          'Multi-model ensembles',
          'Query intent classification',
          'Cost-optimized AI inference',
          'Local vs. cloud model routing',
          'AI model benchmarking'
        ],

        technologies: [
          'Ollama (local LLMs)',
          'OpenRouter (cloud LLMs)',
          'Custom fine-tuned models',
          'Intent classification',
          'Response synthesis',
          'Model fallback chains',
          'Load balancing',
          'Performance monitoring'
        ],

        values: [
          'Right tool for the right job',
          'Transparency in model selection',
          'Privacy-first (local when possible)',
          'Cost efficiency',
          'Performance over marketing hype'
        ],

        useCases: [
          'Route creative queries to GPT-4, technical to Claude',
          'Run sensitive data on local Ollama models',
          'Ensemble multiple models for critical decisions',
          'Automatic fallback if primary model fails',
          'Cost tracking and optimization'
        ]
      },

      deathtodata: {
        name: 'DeathToData',
        tagline: 'Search without surveillance. Deal with it, Google.',
        category: 'Privacy Search',
        url: 'https://deathtodata.com',
        githubPages: 'https://soulfra.github.io/deathtodata',

        mission: 'Privacy-first search engine that doesn\'t track, profile, or sell your data. We believe search should be anonymous and surveillance-free.',

        focus: [
          'Anonymous search',
          'No tracking or profiling',
          'No data collection',
          'Encrypted queries',
          'No personalized results (by design)',
          'No ads based on search history',
          'Proxy-based searching',
          'Search result aggregation'
        ],

        technologies: [
          'Tor integration',
          'VPN-friendly architecture',
          'Zero-log policy',
          'Encrypted search proxies',
          'Decentralized search indexing',
          'No cookies or fingerprinting',
          'Search result caching'
        ],

        values: [
          'Privacy is a right, not a luxury',
          'No surveillance capitalism',
          'Anonymity by default',
          'Transparency in data handling',
          'No behavioral profiling'
        ],

        useCases: [
          'Search without leaving a trail',
          'Bypass personalized filter bubbles',
          'Research sensitive topics privately',
          'Anonymous academic research',
          'Avoid targeted ads based on searches'
        ]
      },

      cringeproof: {
        name: 'CringeProof',
        tagline: 'Will Your Takes Age Well?',
        category: 'Prediction Market',
        url: 'https://cringeproof.com',
        githubPages: 'https://soulfra.github.io/cringeproof',

        mission: 'Accountability through time-locked predictions. We create a permanent record of your takes, bets, and predictions—so you can\'t rewrite history when you\'re wrong.',

        focus: [
          'Time-locked predictions',
          'Reputation tokens based on accuracy',
          'Blockchain-based prediction records',
          'Social accountability for hot takes',
          'Prediction market mechanics',
          'Timestamped commitments',
          'Historical take archives',
          'Accuracy scoring and leaderboards'
        ],

        technologies: [
          'Smart contracts for time-locks',
          'IPFS for immutable storage',
          'Blockchain timestamps',
          'Reputation token system',
          'Cryptographic commitments',
          'Decentralized prediction markets',
          'Social graph of predictions'
        ],

        values: [
          'Accountability over revisionism',
          'Skin in the game',
          'Permanent records prevent gaslighting',
          'Transparency in predictions',
          'Reward accuracy, punish overconfidence'
        ],

        useCases: [
          'Lock in your prediction about AI timelines',
          'Bet on political outcomes with stake',
          'Build reputation as an accurate forecaster',
          'Call out pundits who flip-flop',
          'Archive takes to prevent memory-holing'
        ]
      }
    };

    // Cross-references between domains
    this.CROSS_REFERENCES = {
      soulfra: ['Use Calriven to route identity verification queries', 'Use DeathToData to search for identity standards'],
      calriven: ['Use Soulfra for user authentication', 'Use DeathToData for AI model research'],
      deathtodata: ['Use Soulfra for anonymous login', 'Use Calriven to route search queries to best model'],
      cringeproof: ['Use Soulfra for anonymous predictions', 'Use Calriven for prediction analysis']
    };
  }

  /**
   * Get domain context
   */
  getContext(domain = 'soulfra') {
    const normalized = domain.toLowerCase();
    return this.DOMAINS[normalized] || this.DOMAINS.soulfra;
  }

  /**
   * Get all domains
   */
  getAllDomains() {
    return Object.keys(this.DOMAINS);
  }

  /**
   * Get system prompt for a specific domain
   */
  getSystemPrompt(domain = 'soulfra') {
    const context = this.getContext(domain);

    return `You are an AI assistant for ${context.name} (${context.url}).

**${context.name}**: ${context.tagline}
**Category**: ${context.category}

**Mission**: ${context.mission}

**Core Focus Areas**:
${context.focus.map(f => `- ${f}`).join('\n')}

**Key Technologies**:
${context.technologies.map(t => `- ${t}`).join('\n')}

**Core Values**:
${context.values.map(v => `- ${v}`).join('\n')}

**Use Cases**:
${context.useCases.map(u => `- ${u}`).join('\n')}

When answering questions, always stay within the context of ${context.name}'s mission and values. If a question is outside your domain, suggest which other domain might be more appropriate:
${this.CROSS_REFERENCES[domain.toLowerCase()]?.map(ref => `- ${ref}`).join('\n') || ''}

Be helpful, concise, and aligned with ${context.name}'s values.`;
  }

  /**
   * Inject domain context into a user query
   */
  injectContext(userQuery, domain = 'soulfra') {
    const systemPrompt = this.getSystemPrompt(domain);

    return {
      system: systemPrompt,
      user: userQuery,
      fullPrompt: `${systemPrompt}\n\n---\n\nUser: ${userQuery}\n\nAssistant:`
    };
  }

  /**
   * Get domain from URL or hostname
   */
  detectDomainFromURL(url) {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('calriven')) return 'calriven';
    if (urlLower.includes('deathtodata')) return 'deathtodata';
    if (urlLower.includes('cringeproof')) return 'cringeproof';

    return 'soulfra'; // Default
  }

  /**
   * Auto-detect current domain from window.location
   */
  detectCurrentDomain() {
    if (typeof window !== 'undefined') {
      return this.detectDomainFromURL(window.location.href);
    }
    return 'soulfra';
  }

  /**
   * Get comparison between domains
   */
  compareDomains(domain1, domain2) {
    const ctx1 = this.getContext(domain1);
    const ctx2 = this.getContext(domain2);

    return {
      [domain1]: {
        name: ctx1.name,
        tagline: ctx1.tagline,
        category: ctx1.category,
        focus: ctx1.focus
      },
      [domain2]: {
        name: ctx2.name,
        tagline: ctx2.tagline,
        category: ctx2.category,
        focus: ctx2.focus
      },
      crossReferences: {
        [domain1]: this.CROSS_REFERENCES[domain1],
        [domain2]: this.CROSS_REFERENCES[domain2]
      }
    };
  }

  /**
   * Get domain summary for quick reference
   */
  getDomainSummary(domain = 'soulfra') {
    const context = this.getContext(domain);

    return {
      name: context.name,
      tagline: context.tagline,
      category: context.category,
      mission: context.mission,
      focusCount: context.focus.length,
      techCount: context.technologies.length
    };
  }

  /**
   * Search domains by keyword
   */
  searchDomains(keyword) {
    const results = [];
    const keywordLower = keyword.toLowerCase();

    for (const [domainKey, domainData] of Object.entries(this.DOMAINS)) {
      const searchText = [
        domainData.name,
        domainData.tagline,
        domainData.mission,
        ...domainData.focus,
        ...domainData.technologies,
        ...domainData.values
      ].join(' ').toLowerCase();

      if (searchText.includes(keywordLower)) {
        results.push({
          domain: domainKey,
          name: domainData.name,
          tagline: domainData.tagline,
          category: domainData.category,
          relevance: (searchText.match(new RegExp(keywordLower, 'g')) || []).length
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Generate domain context for debugging
   */
  exportDomainContext(domain = 'soulfra') {
    const context = this.getContext(domain);

    return {
      domain: domain,
      timestamp: new Date().toISOString(),
      context: context,
      systemPrompt: this.getSystemPrompt(domain),
      crossReferences: this.CROSS_REFERENCES[domain]
    };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.DomainContext = new DomainContext();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DomainContext;
}
