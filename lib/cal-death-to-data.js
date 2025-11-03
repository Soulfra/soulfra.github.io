/**
 * Cal's "Death to Data" Research System
 *
 * Adversarial research engine that finds counter-evidence to your hypothesis
 * Instead of confirming bias, actively searches for reasons you're WRONG
 *
 * Flow:
 * 1. You propose hypothesis: "Government needs secure AI tools"
 * 2. Cal searches for counter-evidence: "Why government WON'T fund this"
 * 3. Returns risks, edge cases, failure modes
 * 4. You iterate or pivot
 *
 * This is the "death to data" philosophy:
 * - Kill bad ideas early
 * - Find problems before customers do
 * - Stress-test assumptions
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class CalDeathToData {
  constructor(sheetsAuth) {
    this.sheets = sheetsAuth;
    this.sheetName = 'cal_research_log';

    console.log('[CalDeathToData] Initialized');
  }

  /**
   * Adversarial research - find counter-evidence
   */
  async deathToDataSearch(hypothesis, context = {}) {
    try {
      const {
        userId,
        domain = 'general',
        searchDepth = 'deep' // shallow, deep, thorough
      } = context;

      console.log('[CalDeathToData] Searching for counter-evidence:', hypothesis);

      // Generate adversarial queries
      const queries = this._generateAdversarialQueries(hypothesis, domain);

      // Search each query (would connect to web search API)
      const results = {
        hypothesis,
        counterEvidence: [],
        risks: [],
        edgeCases: [],
        failureModes: [],
        mitigationStrategies: [],
        confidence: 0, // 0-100, lower = more risks found
        timestamp: Date.now()
      };

      // Simulate adversarial findings (in production, this would call real APIs)
      const findings = await this._performAdversarialSearch(hypothesis, queries);

      results.counterEvidence = findings.counterEvidence;
      results.risks = findings.risks;
      results.edgeCases = findings.edgeCases;
      results.failureModes = findings.failureModes;
      results.mitigationStrategies = this._generateMitigations(findings);
      results.confidence = this._calculateConfidence(findings);

      // Log research
      if (userId) {
        await this._logResearch(userId, results);
      }

      console.log('[CalDeathToData] Research complete. Confidence:', results.confidence);

      return { success: true, results };

    } catch (error) {
      console.error('[CalDeathToData] Search error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate adversarial search queries
   * @private
   */
  _generateAdversarialQueries(hypothesis, domain) {
    const baseQuery = hypothesis.toLowerCase();

    return [
      // Direct counter-arguments
      `why ${baseQuery} failed`,
      `problems with ${baseQuery}`,
      `${baseQuery} doesn't work because`,

      // Market validation
      `${baseQuery} market size`,
      `${baseQuery} competitors`,
      `${baseQuery} alternative solutions`,

      // Risk assessment
      `${baseQuery} regulatory issues`,
      `${baseQuery} technical limitations`,
      `${baseQuery} cost analysis`,

      // Edge cases
      `${baseQuery} edge cases`,
      `when ${baseQuery} breaks`,
      `${baseQuery} security vulnerabilities`,

      // Domain-specific
      ...(domain === 'government' ? [
        `government procurement challenges ${baseQuery}`,
        `government budget cuts ${baseQuery}`,
        `government security clearance ${baseQuery}`
      ] : []),

      ...(domain === 'vc' ? [
        `why VCs pass on ${baseQuery}`,
        `${baseQuery} unit economics`,
        `${baseQuery} churn rate`
      ] : [])
    ];
  }

  /**
   * Perform adversarial search (simulated)
   * In production, this would call:
   * - Web search APIs (Google, Bing)
   * - Academic databases (arXiv, Google Scholar)
   * - Government databases (SAM.gov, regulations.gov)
   * - Patent databases (USPTO)
   * - Financial databases (Crunchbase, PitchBook)
   *
   * @private
   */
  async _performAdversarialSearch(hypothesis, queries) {
    // Simulate findings (replace with real API calls)

    // Example: "Government needs secure AI tools"
    const isGovernmentAI = hypothesis.toLowerCase().includes('government') &&
                           hypothesis.toLowerCase().includes('ai');

    if (isGovernmentAI) {
      return {
        counterEvidence: [
          'Government procurement cycles are 18-24 months, not suitable for fast-moving AI',
          'FedRAMP authorization costs $250K-$1M and takes 12+ months',
          'Government prefers incumbent vendors (AWS, Microsoft, Google)',
          'AI tools require continuous updates, but government wants fixed-price contracts',
          'Security clearances required for many AI projects (months to years)'
        ],
        risks: [
          'Long sales cycles (18-24 months) may burn through runway',
          'Regulatory compliance costs may exceed revenue for years',
          'Government budget cuts in 2025 reducing discretionary spending',
          'AI ethics concerns causing procurement delays',
          'Competition from defense contractors with existing relationships'
        ],
        edgeCases: [
          'What if AI regulations ban certain capabilities?',
          'What if government mandates on-premises deployment only?',
          'What if security clearance requirements exclude solo founders?',
          'What if government switches to open-source-only policies?'
        ],
        failureModes: [
          'Burn all capital before first contract closes',
          'Get FedRAMP but customers still choose incumbents',
          'Build for government, but commercial market moves faster',
          'Win contract but can\'t hire cleared engineers',
          'Regulations change mid-contract, invalidating solution'
        ]
      };
    }

    // Generic adversarial findings
    return {
      counterEvidence: [
        'Market may be smaller than expected',
        'Competitors may have unfair advantages',
        'Technology may not be mature enough'
      ],
      risks: [
        'High customer acquisition cost',
        'Long payback period',
        'Technical complexity underestimated'
      ],
      edgeCases: [
        'What if primary assumption is wrong?',
        'What if market conditions change?',
        'What if key dependency fails?'
      ],
      failureModes: [
        'Run out of capital before product-market fit',
        'Regulations block core functionality',
        'Market consolidates around different solution'
      ]
    };
  }

  /**
   * Generate mitigation strategies
   * @private
   */
  _generateMitigations(findings) {
    const mitigations = [];

    // Counter each risk
    findings.risks.forEach(risk => {
      if (risk.includes('sales cycle')) {
        mitigations.push('Start with SBIR/STTR grants (faster than contracts)');
        mitigations.push('Target state/local governments first (shorter cycles)');
      }
      if (risk.includes('compliance')) {
        mitigations.push('Partner with FedRAMP-authorized platform (AWS GovCloud)');
        mitigations.push('Pursue IL4/IL5 authorization incrementally');
      }
      if (risk.includes('competition')) {
        mitigations.push('Focus on niche the incumbents ignore (solo dev tools)');
        mitigations.push('Build open-source community first (credibility)');
      }
      if (risk.includes('budget')) {
        mitigations.push('Diversify revenue (commercial + government)');
        mitigations.push('Bootstrap with consulting/services');
      }
    });

    // Generic mitigations
    if (mitigations.length === 0) {
      mitigations.push('Validate assumptions with customer interviews');
      mitigations.push('Build MVP quickly to test core hypothesis');
      mitigations.push('Diversify revenue streams to reduce risk');
    }

    return [...new Set(mitigations)]; // Remove duplicates
  }

  /**
   * Calculate confidence score (0-100)
   * Lower score = more risks found = less confident
   * @private
   */
  _calculateConfidence(findings) {
    let score = 100;

    // Deduct points for each risk category
    score -= Math.min(findings.counterEvidence.length * 5, 30);
    score -= Math.min(findings.risks.length * 8, 40);
    score -= Math.min(findings.edgeCases.length * 3, 15);
    score -= Math.min(findings.failureModes.length * 10, 30);

    return Math.max(0, score);
  }

  /**
   * Analyze market opportunity (simplified)
   */
  async analyzeMarket(market, product) {
    try {
      const hypothesis = `${product} is needed in ${market} market`;

      const research = await this.deathToDataSearch(hypothesis, {
        domain: market.toLowerCase().includes('government') ? 'government' : 'general',
        searchDepth: 'deep'
      });

      if (!research.success) {
        throw new Error(research.error);
      }

      // Generate market assessment
      const assessment = {
        market,
        product,
        viability: research.results.confidence,
        topRisks: research.results.risks.slice(0, 3),
        topMitigations: research.results.mitigationStrategies.slice(0, 3),
        recommendation: this._generateRecommendation(research.results),
        timestamp: Date.now()
      };

      return { success: true, assessment };

    } catch (error) {
      console.error('[CalDeathToData] Market analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate recommendation based on confidence
   * @private
   */
  _generateRecommendation(results) {
    if (results.confidence >= 70) {
      return {
        decision: 'PURSUE',
        reason: 'High confidence. Risks are manageable.',
        action: 'Build MVP and validate with early customers'
      };
    }
    else if (results.confidence >= 40) {
      return {
        decision: 'PIVOT',
        reason: 'Moderate confidence. Significant risks identified.',
        action: 'Address top 3 risks before committing resources'
      };
    }
    else {
      return {
        decision: 'KILL',
        reason: 'Low confidence. Too many critical risks.',
        action: 'Explore alternative approaches or different markets'
      };
    }
  }

  /**
   * Log research to Sheets
   * @private
   */
  async _logResearch(userId, results) {
    const row = [
      userId,
      results.hypothesis,
      JSON.stringify(results.counterEvidence),
      JSON.stringify(results.risks),
      JSON.stringify(results.edgeCases),
      JSON.stringify(results.failureModes),
      JSON.stringify(results.mitigationStrategies),
      results.confidence,
      results.timestamp
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:I:append?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Get research history for user
   */
  async getResearchHistory(userId, limit = 10) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:I?key=${this.sheets.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const rows = data.values || [];

      const history = rows
        .slice(1)
        .filter(r => r[0] === userId)
        .map(r => ({
          userId: r[0],
          hypothesis: r[1],
          counterEvidence: JSON.parse(r[2] || '[]'),
          risks: JSON.parse(r[3] || '[]'),
          edgeCases: JSON.parse(r[4] || '[]'),
          failureModes: JSON.parse(r[5] || '[]'),
          mitigationStrategies: JSON.parse(r[6] || '[]'),
          confidence: parseInt(r[7]) || 0,
          timestamp: parseInt(r[8])
        }));

      history.sort((a, b) => b.timestamp - a.timestamp);
      return history.slice(0, limit);

    } catch (error) {
      console.error('[CalDeathToData] Get history error:', error);
      return [];
    }
  }

  /**
   * Initialize table
   */
  async initTable() {
    const headers = ['userId', 'hypothesis', 'counterEvidence', 'risks', 'edgeCases', 'failureModes', 'mitigationStrategies', 'confidence', 'timestamp'];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A1:I1?key=${this.sheets.apiKey}`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.values?.length > 0) {
        console.log('[CalDeathToData] Table exists');
        return { success: true };
      }
    }

    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A1:I1?valueInputOption=RAW&key=${this.sheets.apiKey}`;
    await fetch(createUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [headers] })
    });

    console.log('[CalDeathToData] Table initialized');
    return { success: true };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.CalDeathToData = CalDeathToData;
}

console.log('[CalDeathToData] Module loaded');
