#!/usr/bin/env node
/**
 * Content Generator
 *
 * Generates marketing content using domain contexts + Ollama + web research.
 * Multi-stage pipeline: Research → Outline → Draft → Polish
 *
 * Features:
 * - Domain-aware content generation
 * - Multi-stage Ollama pipeline
 * - Web research integration
 * - Content library deduplication
 * - Support for multiple content types
 * - Automatic brand voice application
 */

const http = require('http');
const path = require('path');
const DomainContext = require('./llm/domain-context.js');
const WebResearcher = require('./web-researcher.js');
const ContentLibrary = require('./content-library.js');

class ContentGenerator {
  constructor(options = {}) {
    // Configuration
    this.config = {
      ollamaHost: options.ollamaHost || '127.0.0.1',
      ollamaPort: options.ollamaPort || 11434,
      model: options.model || 'llama3.2',
      temperature: options.temperature || 0.7,
      enableWebResearch: options.enableWebResearch !== false, // true by default
      ...options
    };

    // Initialize subsystems
    this.domainContext = new DomainContext();
    this.webResearcher = new WebResearcher({
      ollamaHost: this.config.ollamaHost,
      ollamaPort: this.config.ollamaPort,
      model: this.config.model
    });
    this.contentLibrary = new ContentLibrary();

    // Content type configurations
    this.contentTypes = {
      article: {
        name: 'Article',
        wordTarget: 800,
        stages: ['research', 'outline', 'draft', 'polish']
      },
      landing_page: {
        name: 'Landing Page',
        wordTarget: 400,
        stages: ['research', 'outline', 'draft', 'polish']
      },
      email: {
        name: 'Email',
        wordTarget: 200,
        stages: ['outline', 'draft', 'polish']
      },
      social_post: {
        name: 'Social Post',
        wordTarget: 50,
        stages: ['draft', 'polish']
      },
      product: {
        name: 'Product Description',
        wordTarget: 300,
        stages: ['research', 'draft', 'polish']
      }
    };

    // Statistics
    this.stats = {
      totalGenerated: 0,
      cacheHits: 0,
      webResearchUsed: 0,
      totalWords: 0
    };
  }

  /**
   * Initialize (must be called before use)
   */
  async initialize() {
    try {
      await this.contentLibrary.initialize();
      await this.webResearcher.initialize();
      console.log('✅ Content Generator initialized');
      return true;
    } catch (error) {
      console.warn('⚠️ Content Generator initialization warning:', error.message);
      return false;
    }
  }

  /**
   * Generate content
   *
   * @param {Object} params
   * @param {string} params.domain - Domain (soulfra, calriven, etc.)
   * @param {string} params.type - Content type (article, landing_page, email, social_post, product)
   * @param {string} params.topic - Topic/subject
   * @param {Array} params.keywords - Keywords to include (optional)
   * @param {Array} params.urls - URLs to research (optional)
   * @param {boolean} params.skipCache - Skip cache check (optional)
   * @param {Object} params.metadata - Additional metadata (optional)
   */
  async generate(params) {
    const {
      domain = 'soulfra',
      type = 'article',
      topic,
      keywords = [],
      urls = [],
      skipCache = false,
      metadata = {}
    } = params;

    // Validate
    if (!topic) {
      throw new Error('Topic is required');
    }

    if (!this.contentTypes[type]) {
      throw new Error(`Invalid content type: ${type}. Valid types: ${Object.keys(this.contentTypes).join(', ')}`);
    }

    console.log(`\n🎨 Generating ${type} for ${domain}: "${topic}"`);

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const existing = await this.contentLibrary.exists(domain, type, topic);
      if (existing) {
        console.log(`💾 Cache hit! Using existing content: ${existing.id}`);
        this.stats.cacheHits++;
        return {
          success: true,
          cached: true,
          contentId: existing.id,
          content: existing
        };
      }
    }

    // Get domain context
    const domainCtx = this.domainContext.getContext(domain);
    const systemPrompt = this.domainContext.getSystemPrompt(domain);

    console.log(`📋 Domain: ${domainCtx.name} - ${domainCtx.tagline}`);

    // Execute generation pipeline
    const stages = this.contentTypes[type].stages;
    const wordTarget = this.contentTypes[type].wordTarget;

    let researchData = null;
    let outline = null;
    let draft = null;
    let final = null;
    let sources = [];

    try {
      // Stage 1: Research (if applicable)
      if (stages.includes('research') && this.config.enableWebResearch) {
        console.log('🔍 Stage 1: Researching...');
        researchData = await this.researchTopic(topic, urls, domainCtx);
        sources = researchData.sources;
        this.stats.webResearchUsed++;
      }

      // Stage 2: Outline (if applicable)
      if (stages.includes('outline')) {
        console.log('📝 Stage 2: Creating outline...');
        outline = await this.createOutline(topic, type, domainCtx, researchData, keywords, wordTarget);
      }

      // Stage 3: Draft
      console.log('✍️  Stage 3: Writing draft...');
      draft = await this.writeDraft(topic, type, domainCtx, outline, researchData, keywords, wordTarget);

      // Stage 4: Polish
      console.log('✨ Stage 4: Polishing...');
      final = await this.polish(draft, type, domainCtx);

      // Save to library
      console.log('💾 Saving to library...');
      const saved = await this.contentLibrary.save({
        domain,
        type,
        topic,
        content: final,
        metadata: {
          ...metadata,
          keywords,
          wordTarget,
          stages: stages.join(' → ')
        },
        sources
      });

      // Update stats
      this.stats.totalGenerated++;
      this.stats.totalWords += saved.entry.metadata.wordCount;

      console.log(`✅ Content generated: ${saved.contentId}`);
      console.log(`   Words: ${saved.entry.metadata.wordCount} | Sources: ${sources.length}`);

      return {
        success: true,
        cached: false,
        contentId: saved.contentId,
        content: saved.entry,
        stages: {
          research: researchData ? 'completed' : 'skipped',
          outline: outline ? 'completed' : 'skipped',
          draft: 'completed',
          polish: 'completed'
        }
      };
    } catch (error) {
      console.error(`❌ Content generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Research a topic using web researcher
   */
  async researchTopic(topic, urls, domainContext) {
    try {
      const results = await this.webResearcher.researchTopic(topic, urls);

      // Extract sources and summaries
      const sources = results
        .filter(r => !r.error)
        .map(r => r.url);

      const summaries = results
        .filter(r => !r.error)
        .map(r => `${r.url}\n${r.summary}`)
        .join('\n\n');

      return {
        sources,
        summaries,
        resultCount: sources.length
      };
    } catch (error) {
      console.warn(`⚠️ Research failed: ${error.message}`);
      return {
        sources: [],
        summaries: '',
        resultCount: 0
      };
    }
  }

  /**
   * Create content outline
   */
  async createOutline(topic, type, domainContext, researchData, keywords, wordTarget) {
    const researchContext = researchData
      ? `\n\nResearch findings:\n${researchData.summaries}`
      : '';

    const keywordsContext = keywords.length > 0
      ? `\n\nInclude these keywords: ${keywords.join(', ')}`
      : '';

    const prompt = `Create a detailed outline for a ${type} about "${topic}" for ${domainContext.name}.

**Domain Context**:
- Name: ${domainContext.name}
- Tagline: ${domainContext.tagline}
- Mission: ${domainContext.mission}
- Values: ${domainContext.values.join(', ')}

**Content Requirements**:
- Type: ${type}
- Target length: ~${wordTarget} words
- Tone: Professional, aligned with ${domainContext.name}'s brand voice${keywordsContext}${researchContext}

Create a structured outline with main sections and key points. Be concise.

Outline:`;

    const outline = await this.callOllama(prompt, {
      temperature: 0.5,
      max_tokens: 500
    });

    return this.stripMetaCommentary(outline);
  }

  /**
   * Write content draft
   */
  async writeDraft(topic, type, domainContext, outline, researchData, keywords, wordTarget) {
    const outlineContext = outline
      ? `\n\nOutline:\n${outline}`
      : '';

    const researchContext = researchData && researchData.summaries
      ? `\n\nResearch:\n${researchData.summaries}`
      : '';

    const keywordsContext = keywords.length > 0
      ? `\n\nKeywords to include: ${keywords.join(', ')}`
      : '';

    const prompt = `Write a complete ${type} about "${topic}" for ${domainContext.name}.

**Domain Context**:
- Name: ${domainContext.name}
- Tagline: ${domainContext.tagline}
- Mission: ${domainContext.mission}
- Focus: ${domainContext.focus.slice(0, 3).join(', ')}
- Values: ${domainContext.values.slice(0, 3).join(', ')}

**Requirements**:
- Target length: ~${wordTarget} words
- Tone: ${this.getToneForType(type)}
- Brand voice: ${domainContext.name}
- Format: ${this.getFormatForType(type)}${keywordsContext}${outlineContext}${researchContext}

CRITICAL: Output ONLY the ${type} content itself. Do NOT include preamble, explanations, or meta-commentary. Start directly with the content.

Write the complete ${type} now:`;

    const draft = await this.callOllama(prompt, {
      temperature: this.config.temperature,
      max_tokens: this.getMaxTokensForType(type)
    });

    return this.stripMetaCommentary(draft);
  }

  /**
   * Polish content
   */
  async polish(draft, type, domainContext) {
    const prompt = `Polish and refine this ${type} for ${domainContext.name}. Improve clarity, flow, and alignment with the brand voice.

**Brand**: ${domainContext.name} - ${domainContext.tagline}
**Values**: ${domainContext.values.slice(0, 3).join(', ')}

**Original ${type}**:
${draft}

**Instructions**:
- Fix any grammar or spelling issues
- Improve clarity and flow
- Ensure brand voice consistency
- Keep the same length and structure
- Make it more engaging and compelling

CRITICAL: Output ONLY the polished content. Do NOT include any preamble like "Here's a polished version", meta-commentary, explanations, or suggestions. Start immediately with the actual content.

**Polished ${type}**:`;

    const polished = await this.callOllama(prompt, {
      temperature: 0.3, // Lower temperature for refinement
      max_tokens: this.getMaxTokensForType(type)
    });

    return this.stripMetaCommentary(polished);
  }

  /**
   * Strip common LLM meta-commentary patterns
   */
  stripMetaCommentary(text) {
    if (!text) return text;

    // Common patterns to remove
    const patterns = [
      /^Here'?s? (?:a |an )?(?:polished|refined|improved|revised|updated|the) (?:version of )?(?:the )?(?:article|content|landing page|email|post|pitch deck|business plan)[:\s]*/i,
      /^I'?(?:ve)? (?:polished|refined|improved|revised|updated|made|created)[^\n]*[:\s]*/i,
      /^Let me know if you'?(?:d)? like (?:me to )?make any (?:further )?(?:adjustments|changes|modifications)[!\.\s]*/im,
      /^I made the following changes[^\n]*[:\s]*/im,
      /^Based on (?:the |your )?(?:instructions|requirements|context)[^\n]*[:\s]*/i,
      /^(?:Here|Below) is (?:the |a |an )?(?:polished|refined|content)[^\n]*[:\s]*/i,
      /\n*I'?(?:ve)? (?:simplified|emphasized|added|highlighted|rephrased)[^\n]*$/im,
      /\n*Let me know[^\n]*$/im,
      /\n*Feel free to[^\n]*$/im,
      /\n*Would you like[^\n]*\?$/im,
      /^(?:The )?(?:polished|refined|final) (?:version|content|result)[:\s]*/i,
      // Remove placeholder brackets
      /\[(?:High-quality |Placeholder |Insert |Add |Include )?(?:image|video|graphic|photo|picture|illustration|chart|diagram)[^\]]*\]/gi,
      /\[(?:CTA |Call[- ]to[- ]action|Button|Link)[^\]]*\]/gi,
      // Remove section header labels (but keep the actual content after the colon)
      /^\*\*(?:Hero Section|Call-to-Action|CTA|Key Features|Benefits|Features|Introduction|Conclusion)\*\*:?\s*/gim,
      /^(?:Hero Section|Call-to-Action|CTA|Key Features|Benefits|Features|Introduction|Conclusion):?\s*/gim
    ];

    let cleaned = text;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Call Ollama API
   */
  async callOllama(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || this.config.temperature,
          num_predict: options.max_tokens || 1000
        }
      });

      const requestOptions = {
        hostname: this.config.ollamaHost,
        port: this.config.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(requestOptions, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json.response || '');
          } catch (e) {
            reject(new Error(`Ollama response parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Get tone for content type
   */
  getToneForType(type) {
    const tones = {
      article: 'Informative, professional, engaging',
      landing_page: 'Persuasive, clear, action-oriented',
      email: 'Friendly, conversational, direct',
      social_post: 'Casual, punchy, attention-grabbing',
      product: 'Descriptive, benefits-focused, compelling'
    };
    return tones[type] || 'Professional';
  }

  /**
   * Get format for content type
   */
  getFormatForType(type) {
    const formats = {
      article: 'Blog post with introduction, body paragraphs, and conclusion',
      landing_page: 'Professional marketing copy with: compelling opening paragraph that hooks the reader, 3-5 benefit paragraphs with concrete examples and real value propositions, closing paragraph with clear next step. Write actual polished copy - NO section labels like "Hero Section" or "Call-to-Action", NO placeholder brackets, NO instructional headers.',
      email: 'Subject line, greeting, body, call-to-action, signature',
      social_post: 'Short text with hook, value, and hashtags',
      product: 'Product name, description, features, benefits'
    };
    return formats[type] || 'Standard format';
  }

  /**
   * Get max tokens for content type
   */
  getMaxTokensForType(type) {
    const tokens = {
      article: 2000,
      landing_page: 1000,
      email: 500,
      social_post: 150,
      product: 800
    };
    return tokens[type] || 1000;
  }

  /**
   * Batch generate content
   */
  async batchGenerate(items) {
    console.log(`\n📦 Batch generating ${items.length} pieces of content...`);

    const results = [];

    for (const item of items) {
      try {
        const result = await this.generate(item);
        results.push({
          success: true,
          item,
          result
        });
      } catch (error) {
        console.error(`❌ Failed to generate ${item.type} for ${item.domain}: ${error.message}`);
        results.push({
          success: false,
          item,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✅ Batch complete: ${successful} successful, ${failed} failed`);

    return {
      total: items.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Generate content for all domains
   */
  async generateForAllDomains(type, topic, options = {}) {
    const domains = this.domainContext.getAllDomains();

    console.log(`\n🌍 Generating ${type} "${topic}" for all domains...`);

    const items = domains.map(domain => ({
      domain,
      type,
      topic,
      ...options
    }));

    return await this.batchGenerate(items);
  }

  /**
   * Get statistics
   */
  getStats() {
    const libraryStats = this.contentLibrary.getStats();

    return {
      generator: {
        totalGenerated: this.stats.totalGenerated,
        cacheHits: this.stats.cacheHits,
        webResearchUsed: this.stats.webResearchUsed,
        totalWords: this.stats.totalWords,
        cacheHitRate: this.stats.totalGenerated > 0
          ? ((this.stats.cacheHits / (this.stats.totalGenerated + this.stats.cacheHits)) * 100).toFixed(1) + '%'
          : '0%'
      },
      library: libraryStats,
      config: {
        model: this.config.model,
        temperature: this.config.temperature,
        webResearchEnabled: this.config.enableWebResearch
      }
    };
  }

  /**
   * Get available content types
   */
  getContentTypes() {
    return Object.keys(this.contentTypes).map(key => ({
      type: key,
      name: this.contentTypes[key].name,
      wordTarget: this.contentTypes[key].wordTarget,
      stages: this.contentTypes[key].stages
    }));
  }

  /**
   * Get available domains
   */
  getDomains() {
    return this.domainContext.getAllDomains().map(domain => {
      const ctx = this.domainContext.getContext(domain);
      return {
        domain,
        name: ctx.name,
        tagline: ctx.tagline,
        category: ctx.category
      };
    });
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      ready: true,
      contentTypes: this.getContentTypes(),
      domains: this.getDomains(),
      stats: this.getStats(),
      config: {
        model: this.config.model,
        ollamaHost: this.config.ollamaHost,
        ollamaPort: this.config.ollamaPort,
        temperature: this.config.temperature,
        webResearchEnabled: this.config.enableWebResearch
      }
    };
  }
}

module.exports = ContentGenerator;
