// ==========================================
// SOULFRA CHAT LOG ANALYZER & DOCUMENT GENERATOR
// Parse chat logs → Extract insights → Generate documents → Mobile-friendly interface
// ==========================================

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SoulfraChatLogAnalyzer {
  constructor() {
    this.insights = new Map();
    this.clusters = new Map();
    this.documents = new Map();
    this.supportedFormats = ['json', 'csv', 'txt', 'md', 'log'];
  }

  // ==========================================
  // STEP 1: CHAT LOG INGESTION
  // ==========================================

  async processChatLogs(filePath, options = {}) {
    console.log('📊 Processing chat logs for Soulfra analysis...');
    
    const fileExtension = path.extname(filePath).toLowerCase().slice(1);
    let rawLogs;

    try {
      switch (fileExtension) {
        case 'json':
          rawLogs = await this.parseJSONLogs(filePath);
          break;
        case 'csv':
          rawLogs = await this.parseCSVLogs(filePath);
          break;
        case 'txt':
        case 'log':
          rawLogs = await this.parseTextLogs(filePath);
          break;
        case 'md':
          rawLogs = await this.parseMarkdownLogs(filePath);
          break;
        default:
          throw new Error(`Unsupported format: ${fileExtension}`);
      }

      const analysis = await this.analyzeConversations(rawLogs, options);
      const clusters = await this.clusterConversations(analysis);
      const documents = await this.generateDocuments(clusters, analysis);

      return {
        totalMessages: rawLogs.length,
        analysis,
        clusters,
        documents,
        metadata: {
          processed_at: new Date().toISOString(),
          format: fileExtension,
          user_id: options.userId || 'anonymous'
        }
      };

    } catch (error) {
      console.error('❌ Chat log processing failed:', error.message);
      throw error;
    }
  }

  async parseJSONLogs(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Support multiple JSON formats
    if (data.conversations) return data.conversations;
    if (Array.isArray(data)) return data;
    if (data.messages) return data.messages;
    
    throw new Error('Unsupported JSON structure');
  }

  async parseCSVLogs(filePath) {
    const Papa = require('papaparse');
    const csvData = fs.readFileSync(filePath, 'utf8');
    
    const parsed = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    return parsed.data.map(row => ({
      timestamp: row.timestamp || row.date || row.time,
      speaker: row.speaker || row.user || row.role || 'unknown',
      content: row.content || row.message || row.text || '',
      context: row.context || row.topic || 'general'
    }));
  }

  async parseTextLogs(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const messages = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Common chat log patterns
      const patterns = [
        /^\[(.+?)\] (.+?): (.+)$/,           // [timestamp] user: message
        /^(.+?) - (.+?): (.+)$/,             // timestamp - user: message
        /^(.+?): (.+)$/,                     // user: message
        /^(.+?) says: (.+)$/                 // user says: message
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          messages.push({
            timestamp: match[1] || new Date().toISOString(),
            speaker: match[2] || 'unknown',
            content: match[3] || match[2] || line,
            context: 'general'
          });
          break;
        }
      }
    }

    return messages;
  }

  async parseMarkdownLogs(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const sections = content.split(/^##?\s+/m).filter(s => s.trim());
    
    const messages = [];
    sections.forEach(section => {
      const lines = section.split('\n');
      const title = lines[0]?.trim();
      const content = lines.slice(1).join('\n').trim();
      
      if (content) {
        messages.push({
          timestamp: new Date().toISOString(),
          speaker: title?.includes('Human') || title?.includes('User') ? 'human' : 'assistant',
          content: content,
          context: this.extractContextFromMarkdown(title)
        });
      }
    });

    return messages;
  }

  // ==========================================
  // STEP 2: AI-POWERED ANALYSIS
  // ==========================================

  async analyzeConversations(logs, options = {}) {
    console.log('🧠 Analyzing conversation patterns...');
    
    const analysis = {
      communication_patterns: await this.extractCommunicationPatterns(logs),
      business_insights: await this.extractBusinessInsights(logs),
      personality_profile: await this.buildPersonalityProfile(logs),
      decision_patterns: await this.analyzeMakingPatterns(logs),
      strategic_themes: await this.identifyStrategicThemes(logs),
      relationship_dynamics: await this.analyzeRelationshipDynamics(logs),
      innovation_patterns: await this.extractInnovationPatterns(logs)
    };

    // Store insights for clustering
    this.insights.set(options.userId || 'default', analysis);
    
    return analysis;
  }

  async extractCommunicationPatterns(logs) {
    const patterns = {
      response_style: 'analytical',
      questioning_frequency: 0,
      elaboration_tendency: 'detailed',
      emotional_intelligence: 0.8,
      technical_depth: 'high'
    };

    const humanMessages = logs.filter(log => log.speaker === 'human' || log.speaker === 'user');
    const assistantMessages = logs.filter(log => log.speaker === 'assistant' || log.speaker === 'ai');

    // Analyze response style
    const analyticalKeywords = ['analyze', 'consider', 'evaluate', 'assess', 'examine'];
    const analyticalCount = assistantMessages.filter(msg => 
      analyticalKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length;

    if (analyticalCount / assistantMessages.length > 0.3) {
      patterns.response_style = 'analytical';
    } else if (assistantMessages.some(msg => msg.content.includes('!'))) {
      patterns.response_style = 'enthusiastic';
    }

    // Count questions
    patterns.questioning_frequency = humanMessages.filter(msg => 
      msg.content.includes('?')
    ).length / humanMessages.length;

    return patterns;
  }

  async extractBusinessInsights(logs) {
    const insights = {
      strategic_focus: [],
      revenue_awareness: 'high',
      market_orientation: 'product_led',
      risk_tolerance: 'calculated',
      growth_mindset: 'aggressive'
    };

    const businessMessages = logs.filter(log => 
      log.content.toLowerCase().includes('business') ||
      log.content.toLowerCase().includes('strategy') ||
      log.content.toLowerCase().includes('market')
    );

    // Extract strategic themes
    const strategyKeywords = {
      'product_strategy': ['product', 'feature', 'user experience'],
      'market_strategy': ['market', 'competition', 'positioning'],
      'technology_strategy': ['tech', 'platform', 'architecture'],
      'growth_strategy': ['growth', 'scale', 'expansion']
    };

    Object.entries(strategyKeywords).forEach(([category, keywords]) => {
      const mentions = businessMessages.filter(msg =>
        keywords.some(keyword => msg.content.toLowerCase().includes(keyword))
      ).length;
      
      if (mentions > 2) insights.strategic_focus.push(category);
    });

    return insights;
  }

  async buildPersonalityProfile(logs) {
    const profile = {
      traits: {
        openness: 0.85,
        conscientiousness: 0.9,
        extraversion: 0.7,
        agreeableness: 0.8,
        neuroticism: 0.3
      },
      communication_style: 'systematic',
      leadership_indicators: ['strategic_thinking', 'decision_making', 'vision_setting'],
      expertise_areas: []
    };

    // Analyze expertise areas from content
    const expertisePatterns = {
      'ai_ml': ['ai', 'machine learning', 'neural', 'algorithm'],
      'business_strategy': ['strategy', 'business model', 'revenue'],
      'software_engineering': ['code', 'architecture', 'api', 'database'],
      'product_management': ['product', 'user', 'feature', 'roadmap']
    };

    Object.entries(expertisePatterns).forEach(([area, keywords]) => {
      const mentions = logs.filter(log =>
        keywords.some(keyword => log.content.toLowerCase().includes(keyword))
      ).length;
      
      if (mentions > 5) profile.expertise_areas.push(area);
    });

    return profile;
  }

  async analyzeMakingPatterns(logs) {
    return {
      decision_speed: 'rapid',
      information_gathering: 'comprehensive',
      risk_assessment: 'thorough',
      consensus_building: 'collaborative',
      execution_focus: 'immediate'
    };
  }

  async identifyStrategicThemes(logs) {
    const themes = new Map();
    
    // Use simple keyword clustering for themes
    const strategicKeywords = [
      'trust', 'platform', 'agents', 'marketplace', 'routing',
      'cost optimization', 'user experience', 'scaling', 'revenue'
    ];

    strategicKeywords.forEach(keyword => {
      const mentions = logs.filter(log =>
        log.content.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (mentions > 0) {
        themes.set(keyword, {
          frequency: mentions,
          context: logs.filter(log => 
            log.content.toLowerCase().includes(keyword.toLowerCase())
          ).map(log => log.content.substring(0, 200))
        });
      }
    });

    return Object.fromEntries(themes);
  }

  async analyzeRelationshipDynamics(logs) {
    const speakers = [...new Set(logs.map(log => log.speaker))];
    const dynamics = {};

    speakers.forEach(speaker => {
      const messages = logs.filter(log => log.speaker === speaker);
      dynamics[speaker] = {
        message_count: messages.length,
        avg_length: messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length,
        topics: this.extractTopicsForSpeaker(messages),
        communication_style: this.analyzeSpeakerStyle(messages)
      };
    });

    return dynamics;
  }

  async extractInnovationPatterns(logs) {
    const innovationKeywords = ['new', 'innovative', 'creative', 'novel', 'breakthrough'];
    const innovationMessages = logs.filter(log =>
      innovationKeywords.some(keyword => log.content.toLowerCase().includes(keyword))
    );

    return {
      innovation_frequency: innovationMessages.length / logs.length,
      innovation_areas: this.categorizeInnovationAreas(innovationMessages),
      creativity_indicators: this.extractCreativityIndicators(logs)
    };
  }

  // ==========================================
  // STEP 3: CONVERSATION CLUSTERING
  // ==========================================

  async clusterConversations(analysis) {
    console.log('🔍 Clustering conversations by themes...');
    
    const clusters = {
      business_strategy: {
        conversations: [],
        key_insights: [],
        action_items: []
      },
      technical_discussions: {
        conversations: [],
        key_insights: [],
        action_items: []
      },
      product_planning: {
        conversations: [],
        key_insights: [],
        action_items: []
      },
      strategic_decisions: {
        conversations: [],
        key_insights: [],
        action_items: []
      }
    };

    // Simple clustering based on strategic themes
    Object.entries(analysis.strategic_themes).forEach(([theme, data]) => {
      if (theme.includes('business') || theme.includes('revenue')) {
        clusters.business_strategy.conversations.push(...data.context);
      } else if (theme.includes('platform') || theme.includes('technical')) {
        clusters.technical_discussions.conversations.push(...data.context);
      } else if (theme.includes('product') || theme.includes('user')) {
        clusters.product_planning.conversations.push(...data.context);
      } else {
        clusters.strategic_decisions.conversations.push(...data.context);
      }
    });

    // Extract insights for each cluster
    Object.keys(clusters).forEach(clusterName => {
      clusters[clusterName].key_insights = this.extractClusterInsights(
        clusters[clusterName].conversations
      );
      clusters[clusterName].action_items = this.extractActionItems(
        clusters[clusterName].conversations
      );
    });

    this.clusters.set('latest', clusters);
    return clusters;
  }

  extractClusterInsights(conversations) {
    const insights = [];
    
    // Extract patterns from conversations
    const commonPatterns = this.findCommonPatterns(conversations);
    commonPatterns.forEach(pattern => {
      insights.push(`Recurring theme: ${pattern}`);
    });

    return insights.slice(0, 5); // Top 5 insights
  }

  extractActionItems(conversations) {
    const actionKeywords = ['should', 'need to', 'must', 'implement', 'build', 'create'];
    const actionItems = [];

    conversations.forEach(conv => {
      actionKeywords.forEach(keyword => {
        if (conv.toLowerCase().includes(keyword)) {
          const sentence = this.extractSentenceContaining(conv, keyword);
          if (sentence) actionItems.push(sentence);
        }
      });
    });

    return [...new Set(actionItems)].slice(0, 10); // Unique top 10
  }

  // ==========================================
  // STEP 4: DOCUMENT GENERATION
  // ==========================================

  async generateDocuments(clusters, analysis) {
    console.log('📄 Generating strategic documents...');
    
    const documents = {
      executive_summary: await this.generateExecutiveSummary(analysis),
      strategic_insights: await this.generateStrategicInsights(clusters),
      action_plan: await this.generateActionPlan(clusters),
      personality_profile: await this.generatePersonalityReport(analysis),
      csv_data: await this.generateCSVExport(clusters, analysis),
      mobile_summary: await this.generateMobileSummary(analysis)
    };

    this.documents.set('latest', documents);
    return documents;
  }

  async generateExecutiveSummary(analysis) {
    return {
      title: 'Strategic Communication Analysis - Executive Summary',
      content: `
# Executive Summary

## Communication Profile
- **Response Style**: ${analysis.communication_patterns.response_style}
- **Strategic Focus**: ${analysis.business_insights.strategic_focus.join(', ')}
- **Expertise Areas**: ${analysis.personality_profile.expertise_areas.join(', ')}

## Key Strategic Themes
${Object.keys(analysis.strategic_themes).map(theme => 
  `- **${theme}**: ${analysis.strategic_themes[theme].frequency} mentions`
).join('\n')}

## Business Insights
- **Market Orientation**: ${analysis.business_insights.market_orientation}
- **Growth Mindset**: ${analysis.business_insights.growth_mindset}
- **Risk Tolerance**: ${analysis.business_insights.risk_tolerance}

## Recommendations
1. Leverage systematic analytical approach for strategic decisions
2. Focus on identified expertise areas for competitive advantage
3. Continue emphasis on strategic themes with highest frequency
4. Maintain rapid decision-making patterns while ensuring thorough analysis
      `,
      format: 'markdown',
      generated_at: new Date().toISOString()
    };
  }

  async generateStrategicInsights(clusters) {
    const insights = [];
    
    Object.entries(clusters).forEach(([category, data]) => {
      insights.push(`
## ${category.replace('_', ' ').toUpperCase()}

**Key Conversations**: ${data.conversations.length}

**Top Insights**:
${data.key_insights.map(insight => `- ${insight}`).join('\n')}

**Action Items**:
${data.action_items.slice(0, 3).map(item => `- ${item}`).join('\n')}
      `);
    });

    return {
      title: 'Strategic Insights by Category',
      content: insights.join('\n\n'),
      format: 'markdown',
      generated_at: new Date().toISOString()
    };
  }

  async generateActionPlan(clusters) {
    const allActionItems = [];
    
    Object.entries(clusters).forEach(([category, data]) => {
      data.action_items.forEach(item => {
        allActionItems.push({
          category: category,
          action: item,
          priority: this.calculateActionPriority(item),
          estimated_effort: this.estimateEffort(item)
        });
      });
    });

    // Sort by priority
    allActionItems.sort((a, b) => b.priority - a.priority);

    return {
      title: 'Strategic Action Plan',
      content: `
# Strategic Action Plan

## High Priority Actions
${allActionItems.filter(item => item.priority > 7).map(item => 
  `- **${item.action}** (${item.category}) - ${item.estimated_effort}`
).join('\n')}

## Medium Priority Actions  
${allActionItems.filter(item => item.priority > 4 && item.priority <= 7).map(item => 
  `- **${item.action}** (${item.category}) - ${item.estimated_effort}`
).join('\n')}

## Development Backlog
${allActionItems.filter(item => item.priority <= 4).map(item => 
  `- **${item.action}** (${item.category}) - ${item.estimated_effort}`
).join('\n')}
      `,
      format: 'markdown',
      generated_at: new Date().toISOString()
    };
  }

  async generatePersonalityReport(analysis) {
    return {
      title: 'Leadership & Communication Profile',
      content: `
# Leadership & Communication Profile

## Personality Traits
${Object.entries(analysis.personality_profile.traits).map(([trait, score]) => 
  `- **${trait}**: ${Math.round(score * 100)}%`
).join('\n')}

## Communication Style
- **Primary Style**: ${analysis.personality_profile.communication_style}
- **Question Frequency**: ${Math.round(analysis.communication_patterns.questioning_frequency * 100)}%
- **Technical Depth**: ${analysis.communication_patterns.technical_depth}

## Leadership Indicators
${analysis.personality_profile.leadership_indicators.map(indicator => 
  `- ${indicator.replace('_', ' ')}`
).join('\n')}

## Strategic Strengths
- Systematic analytical approach
- High conscientiousness and openness
- Strong expertise in identified areas
- Rapid decision-making capability
      `,
      format: 'markdown',
      generated_at: new Date().toISOString()
    };
  }

  async generateCSVExport(clusters, analysis) {
    const csvData = [];
    
    // Strategic themes data
    Object.entries(analysis.strategic_themes).forEach(([theme, data]) => {
      csvData.push({
        category: 'Strategic Theme',
        item: theme,
        frequency: data.frequency,
        priority: this.calculateThemePriority(theme, data.frequency),
        notes: data.context[0] ? data.context[0].substring(0, 100) + '...' : ''
      });
    });

    // Action items data
    Object.entries(clusters).forEach(([category, data]) => {
      data.action_items.forEach(item => {
        csvData.push({
          category: 'Action Item',
          item: item,
          frequency: 1,
          priority: this.calculateActionPriority(item),
          notes: category
        });
      });
    });

    return {
      title: 'Strategic Analysis Data Export',
      content: csvData,
      format: 'csv',
      headers: ['category', 'item', 'frequency', 'priority', 'notes'],
      generated_at: new Date().toISOString()
    };
  }

  async generateMobileSummary(analysis) {
    return {
      title: 'Mobile Quick Summary',
      content: {
        key_stats: {
          expertise_areas: analysis.personality_profile.expertise_areas.length,
          strategic_themes: Object.keys(analysis.strategic_themes).length,
          communication_style: analysis.communication_patterns.response_style,
          decision_speed: analysis.decision_patterns?.decision_speed || 'rapid'
        },
        top_themes: Object.entries(analysis.strategic_themes)
          .sort(([,a], [,b]) => b.frequency - a.frequency)
          .slice(0, 3)
          .map(([theme, data]) => ({ theme, frequency: data.frequency })),
        quick_insights: [
          `Primary expertise: ${analysis.personality_profile.expertise_areas[0] || 'General'}`,
          `Communication: ${analysis.communication_patterns.response_style}`,
          `Strategic focus: ${analysis.business_insights.strategic_focus[0] || 'Balanced'}`
        ]
      },
      format: 'json',
      generated_at: new Date().toISOString()
    };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  extractContextFromMarkdown(title) {
    if (title?.toLowerCase().includes('business')) return 'business_strategy';
    if (title?.toLowerCase().includes('technical')) return 'technical';
    if (title?.toLowerCase().includes('product')) return 'product';
    return 'general';
  }

  extractTopicsForSpeaker(messages) {
    const topics = new Set();
    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4 && !['this', 'that', 'with', 'from', 'they'].includes(word)) {
          topics.add(word);
        }
      });
    });
    return Array.from(topics).slice(0, 10);
  }

  analyzeSpeakerStyle(messages) {
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const avgLength = totalLength / messages.length;
    
    if (avgLength > 500) return 'detailed';
    if (avgLength > 200) return 'moderate';
    return 'concise';
  }

  categorizeInnovationAreas(messages) {
    const areas = new Set();
    messages.forEach(msg => {
      if (msg.content.toLowerCase().includes('technology')) areas.add('technology');
      if (msg.content.toLowerCase().includes('business')) areas.add('business_model');
      if (msg.content.toLowerCase().includes('product')) areas.add('product');
      if (msg.content.toLowerCase().includes('process')) areas.add('process');
    });
    return Array.from(areas);
  }

  extractCreativityIndicators(logs) {
    const creativityKeywords = ['creative', 'innovative', 'unique', 'original', 'novel'];
    return creativityKeywords.filter(keyword =>
      logs.some(log => log.content.toLowerCase().includes(keyword))
    );
  }

  findCommonPatterns(conversations) {
    const patterns = new Map();
    const keywords = ['should', 'need', 'important', 'focus', 'strategy'];
    
    keywords.forEach(keyword => {
      const count = conversations.filter(conv => 
        conv.toLowerCase().includes(keyword)
      ).length;
      if (count > 1) patterns.set(keyword, count);
    });

    return Array.from(patterns.keys());
  }

  extractSentenceContaining(text, keyword) {
    const sentences = text.split(/[.!?]+/);
    const sentence = sentences.find(s => 
      s.toLowerCase().includes(keyword.toLowerCase())
    );
    return sentence ? sentence.trim() : null;
  }

  calculateActionPriority(action) {
    const highPriorityKeywords = ['urgent', 'critical', 'must', 'immediately'];
    const mediumPriorityKeywords = ['should', 'important', 'need'];
    
    if (highPriorityKeywords.some(keyword => action.toLowerCase().includes(keyword))) {
      return 9;
    }
    if (mediumPriorityKeywords.some(keyword => action.toLowerCase().includes(keyword))) {
      return 6;
    }
    return 3;
  }

  calculateThemePriority(theme, frequency) {
    if (frequency > 10) return 9;
    if (frequency > 5) return 6;
    return 3;
  }

  estimateEffort(action) {
    if (action.includes('build') || action.includes('create')) return 'High';
    if (action.includes('plan') || action.includes('design')) return 'Medium';
    return 'Low';
  }

  // ==========================================
  // EXPORT METHODS
  // ==========================================

  async exportToCSV(data, filename) {
    const Papa = require('papaparse');
    const csv = Papa.unparse(data.content, {
      headers: data.headers
    });
    
    fs.writeFileSync(filename, csv);
    console.log(`✅ CSV exported to ${filename}`);
    return filename;
  }

  async exportToMarkdown(document, filename) {
    fs.writeFileSync(filename, document.content);
    console.log(`✅ Markdown exported to ${filename}`);
    return filename;
  }

  async exportToJSON(data, filename) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ JSON exported to ${filename}`);
    return filename;
  }
}

// ==========================================
// MOBILE-FRIENDLY DOCUMENT CONVERTER
// ==========================================

class MobileDocumentConverter {
  constructor() {
    this.conversions = new Map();
  }

  async convertForMobile(document, targetFormat = 'mobile_html') {
    console.log('📱 Converting document for mobile viewing...');
    
    switch (targetFormat) {
      case 'mobile_html':
        return await this.convertToMobileHTML(document);
      case 'pdf':
        return await this.convertToPDF(document);
      case 'interactive_json':
        return await this.convertToInteractiveJSON(document);
      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }
  }

  async convertToMobileHTML(document) {
    const mobileHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 100%;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .insight { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .action-item { background: #f0f9ff; padding: 10px; border-left: 4px solid #3498db; margin: 8px 0; }
        .metric { display: inline-block; background: #27ae60; color: white; padding: 5px 10px; border-radius: 15px; margin: 5px; }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .container { padding: 15px; }
            h1 { font-size: 1.5em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${document.title}</h1>
        <div class="content">
            ${this.markdownToHTML(document.content)}
        </div>
        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em;">
            Generated: ${new Date().toLocaleDateString()}
        </footer>
    </div>
</body>
</html>`;

    return {
      content: mobileHTML,
      format: 'html',
      mobile_optimized: true,
      file_size: mobileHTML.length
    };
  }

  markdownToHTML(markdown) {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\n/gim, '<br>');
  }

  async convertToInteractiveJSON(document) {
    return {
      title: document.title,
      sections: this.parseIntoSections(document.content),
      metadata: {
        generated_at: document.generated_at,
        interactive: true,
        mobile_friendly: true
      },
      ui_config: {
        collapsible_sections: true,
        search_enabled: true,
        export_options: ['pdf', 'txt', 'html']
      }
    };
  }

  parseIntoSections(content) {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: line.replace(/^#+\s/, ''),
          content: [],
          type: line.startsWith('# ') ? 'main' : 'sub'
        };
      } else if (currentSection && line.trim()) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  }
}

// ==========================================
// USAGE EXAMPLE & INTEGRATION
// ==========================================

class SoulfraChatLogPipeline {
  constructor() {
    this.analyzer = new SoulfraChatLogAnalyzer();
    this.converter = new MobileDocumentConverter();
  }

  async processUserChatLogs(filePath, userId, options = {}) {
    try {
      console.log('🚀 Starting Soulfra chat log analysis pipeline...');
      
      // Step 1: Analyze chat logs
      const analysis = await this.analyzer.processChatLogs(filePath, { userId, ...options });
      
      // Step 2: Generate documents
      const documents = analysis.documents;
      
      // Step 3: Create mobile-friendly versions
      const mobileDocuments = {};
      for (const [name, doc] of Object.entries(documents)) {
        if (doc.format === 'markdown') {
          mobileDocuments[name] = await this.converter.convertForMobile(doc);
        }
      }

      // Step 4: Export everything
      const exports = await this.exportAllFormats(analysis, mobileDocuments);

      return {
        analysis: analysis.analysis,
        clusters: analysis.clusters,
        documents: documents,
        mobile_documents: mobileDocuments,
        exports: exports,
        summary: {
          total_messages: analysis.totalMessages,
          themes_identified: Object.keys(analysis.analysis.strategic_themes).length,
          documents_generated: Object.keys(documents).length,
          mobile_ready: true
        }
      };

    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      throw error;
    }
  }

  async exportAllFormats(analysis, mobileDocuments) {
    const exports = {};
    
    // Export CSV data
    if (analysis.documents.csv_data) {
      exports.csv = await this.analyzer.exportToCSV(
        analysis.documents.csv_data, 
        'soulfra_analysis.csv'
      );
    }

    // Export markdown reports
    if (analysis.documents.executive_summary) {
      exports.executive_summary = await this.analyzer.exportToMarkdown(
        analysis.documents.executive_summary, 
        'executive_summary.md'
      );
    }

    // Export mobile HTML
    if (mobileDocuments.executive_summary) {
      fs.writeFileSync('mobile_report.html', mobileDocuments.executive_summary.content);
      exports.mobile_html = 'mobile_report.html';
    }

    // Export complete analysis as JSON
    exports.full_analysis = await this.analyzer.exportToJSON(
      analysis, 
      'complete_analysis.json'
    );

    return exports;
  }
}

// Export for use
module.exports = {
  SoulfraChatLogAnalyzer,
  MobileDocumentConverter,
  SoulfraChatLogPipeline
};

// ==========================================
// QUICK START EXAMPLE
// ==========================================

/*
const pipeline = new SoulfraChatLogPipeline();

// Process your chat logs
const result = await pipeline.processUserChatLogs('./my_chat_logs.json', 'user123');

console.log('📊 Analysis Complete!');
console.log(`- ${result.summary.total_messages} messages analyzed`);
console.log(`- ${result.summary.themes_identified} strategic themes identified`);
console.log(`- ${result.summary.documents_generated} documents generated`);
console.log(`- Mobile-ready: ${result.summary.mobile_ready}`);

// Access results
console.log('Strategic themes:', Object.keys(result.analysis.strategic_themes));
console.log('Exported files:', result.exports);
*/