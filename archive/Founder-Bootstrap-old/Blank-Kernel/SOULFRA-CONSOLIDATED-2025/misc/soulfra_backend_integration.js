// ==========================================
// SOULFRA BACKEND INTEGRATION
// Connect chat log analyzer with existing Soulfra infrastructure
// ==========================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { SoulfraChatLogPipeline } = require('./soulfra-chatlog-analyzer');
const { SoulframContextRouter } = require('./soulfra-context-router');

class SoulfraChatLogService {
  constructor() {
    this.app = express();
    this.pipeline = new SoulfraChatLogPipeline();
    this.analysisCache = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS for mobile/web access
    this.app.use(cors({
      origin: ['http://localhost:3000', 'https://soulfra.ai', 'file://'],
      credentials: true
    }));

    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.static('public'));

    // File upload handling
    const storage = multer.memoryStorage();
    this.upload = multer({ 
      storage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.json', '.csv', '.txt', '.md', '.log'];
        const isAllowed = allowedTypes.some(type => 
          file.originalname.toLowerCase().endsWith(type)
        );
        cb(null, isAllowed);
      }
    });
  }

  setupRoutes() {
    // ==========================================
    // CORE ANALYSIS ENDPOINTS
    // ==========================================

    // Upload and analyze chat logs
    this.app.post('/api/analyze', this.upload.array('files', 10), async (req, res) => {
      try {
        console.log('📊 Starting chat log analysis...');
        
        const { userId = 'anonymous', options = {} } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        const results = [];
        
        for (const file of files) {
          // Save file temporarily
          const tempPath = `/tmp/${Date.now()}_${file.originalname}`;
          require('fs').writeFileSync(tempPath, file.buffer);

          // Process through Soulfra pipeline
          const analysis = await this.pipeline.processUserChatLogs(
            tempPath, 
            userId, 
            { 
              ...options,
              originalFilename: file.originalname,
              fileSize: file.size
            }
          );

          results.push({
            filename: file.originalname,
            ...analysis
          });

          // Cache results
          const cacheKey = `${userId}_${file.originalname}_${file.size}`;
          this.analysisCache.set(cacheKey, analysis);

          // Cleanup temp file
          require('fs').unlinkSync(tempPath);
        }

        // If multiple files, merge results
        const mergedResult = results.length === 1 ? results[0] : this.mergeAnalyses(results);

        res.json({
          success: true,
          analysis: mergedResult,
          processingTime: Date.now(),
          filesProcessed: files.length
        });

      } catch (error) {
        console.error('❌ Analysis failed:', error);
        res.status(500).json({ 
          error: 'Analysis failed', 
          details: error.message 
        });
      }
    });

    // Get cached analysis
    this.app.get('/api/analysis/:cacheKey', (req, res) => {
      const analysis = this.analysisCache.get(req.params.cacheKey);
      if (analysis) {
        res.json({ success: true, analysis });
      } else {
        res.status(404).json({ error: 'Analysis not found' });
      }
    });

    // ==========================================
    // DOCUMENT GENERATION ENDPOINTS
    // ==========================================

    // Generate executive summary
    this.app.post('/api/generate/executive-summary', async (req, res) => {
      try {
        const { analysisData, format = 'markdown' } = req.body;
        
        const summary = await this.generateExecutiveSummary(analysisData, format);
        
        res.json({
          success: true,
          document: summary,
          downloadUrl: `/api/download/${summary.id}`
        });

      } catch (error) {
        res.status(500).json({ error: 'Failed to generate summary', details: error.message });
      }
    });

    // Generate action plan
    this.app.post('/api/generate/action-plan', async (req, res) => {
      try {
        const { analysisData, priorityFilter = 'all' } = req.body;
        
        const actionPlan = await this.generateActionPlan(analysisData, priorityFilter);
        
        res.json({
          success: true,
          document: actionPlan,
          downloadUrl: `/api/download/${actionPlan.id}`
        });

      } catch (error) {
        res.status(500).json({ error: 'Failed to generate action plan', details: error.message });
      }
    });

    // Generate mobile-optimized report
    this.app.post('/api/generate/mobile-report', async (req, res) => {
      try {
        const { analysisData, theme = 'soulfra' } = req.body;
        
        const mobileReport = await this.generateMobileReport(analysisData, theme);
        
        res.json({
          success: true,
          report: mobileReport,
          previewUrl: `/mobile-preview/${mobileReport.id}`
        });

      } catch (error) {
        res.status(500).json({ error: 'Failed to generate mobile report', details: error.message });
      }
    });

    // ==========================================
    // EXPORT ENDPOINTS
    // ==========================================

    // Export to CSV
    this.app.post('/api/export/csv', async (req, res) => {
      try {
        const { analysisData, fields = 'all' } = req.body;
        
        const csvData = this.convertAnalysisToCSV(analysisData, fields);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=soulfra_analysis.csv');
        res.send(csvData);

      } catch (error) {
        res.status(500).json({ error: 'CSV export failed', details: error.message });
      }
    });

    // Export to PDF
    this.app.post('/api/export/pdf', async (req, res) => {
      try {
        const { analysisData, template = 'executive' } = req.body;
        
        const pdfBuffer = await this.generatePDFReport(analysisData, template);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=soulfra_analysis.pdf');
        res.send(pdfBuffer);

      } catch (error) {
        res.status(500).json({ error: 'PDF export failed', details: error.message });
      }
    });

    // Export to JSON
    this.app.post('/api/export/json', (req, res) => {
      try {
        const { analysisData, includeRawData = false } = req.body;
        
        const exportData = {
          meta: {
            exported_at: new Date().toISOString(),
            soulfra_version: '1.0.0',
            format: 'json'
          },
          analysis: includeRawData ? analysisData : this.sanitizeAnalysisForExport(analysisData)
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=soulfra_analysis.json');
        res.json(exportData);

      } catch (error) {
        res.status(500).json({ error: 'JSON export failed', details: error.message });
      }
    });

    // ==========================================
    // MOBILE-SPECIFIC ENDPOINTS
    // ==========================================

    // Mobile preview
    this.app.get('/mobile-preview/:reportId', (req, res) => {
      // Serve mobile-optimized HTML
      const reportId = req.params.reportId;
      const mobileHTML = this.generateMobilePreviewHTML(reportId);
      res.send(mobileHTML);
    });

    // Mobile API for quick stats
    this.app.get('/api/mobile/quick-stats/:userId', async (req, res) => {
      try {
        const userId = req.params.userId;
        const quickStats = await this.getQuickStatsForUser(userId);
        
        res.json({
          success: true,
          stats: quickStats,
          last_updated: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({ error: 'Failed to get quick stats' });
      }
    });

    // ==========================================
    // INTEGRATION WITH EXISTING SOULFRA
    // ==========================================

    // Integrate analysis results with trust engine
    this.app.post('/api/integrate/trust-profile', async (req, res) => {
      try {
        const { userId, analysisData } = req.body;
        
        const trustUpdate = await this.updateTrustProfileFromAnalysis(userId, analysisData);
        
        res.json({
          success: true,
          trustUpdate,
          newTrustScore: trustUpdate.newScore,
          insights: trustUpdate.insights
        });

      } catch (error) {
        res.status(500).json({ error: 'Trust profile integration failed' });
      }
    });

    // Create AI agents from conversation patterns
    this.app.post('/api/integrate/create-agent', async (req, res) => {
      try {
        const { userId, analysisData, agentType = 'assistant' } = req.body;
        
        const agent = await this.createAgentFromAnalysis(userId, analysisData, agentType);
        
        res.json({
          success: true,
          agent: {
            id: agent.id,
            name: agent.name,
            personality: agent.personality,
            capabilities: agent.capabilities,
            deploymentUrl: `/api/agents/${agent.id}/chat`
          }
        });

      } catch (error) {
        res.status(500).json({ error: 'Agent creation failed' });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        service: 'soulfra-chatlog-service',
        version: '1.0.0',
        cache_size: this.analysisCache.size,
        uptime: process.uptime()
      });
    });
  }

  // ==========================================
  // BUSINESS LOGIC METHODS
  // ==========================================

  mergeAnalyses(analyses) {
    // Merge multiple analysis results
    const merged = {
      totalMessages: analyses.reduce((sum, a) => sum + a.totalMessages, 0),
      analysis: {
        communication_patterns: this.mergeCommunicationPatterns(analyses),
        strategic_themes: this.mergeStrategicThemes(analyses),
        personality_profile: this.mergePersonalityProfiles(analyses),
        business_insights: this.mergeBusinessInsights(analyses)
      },
      clusters: this.mergeClusters(analyses),
      documents: this.mergeDocuments(analyses),
      summary: {
        files_processed: analyses.length,
        total_messages: analyses.reduce((sum, a) => sum + a.totalMessages, 0),
        themes_identified: this.countUniqueThemes(analyses),
        mobile_ready: true
      }
    };

    return merged;
  }

  mergeCommunicationPatterns(analyses) {
    // Average communication patterns across analyses
    const patterns = {
      response_style: 'analytical', // Most common style
      questioning_frequency: 0,
      technical_depth: 'high'
    };

    patterns.questioning_frequency = analyses.reduce((sum, a) => 
      sum + (a.analysis.communication_patterns.questioning_frequency || 0), 0) / analyses.length;

    return patterns;
  }

  mergeStrategicThemes(analyses) {
    const mergedThemes = {};
    
    analyses.forEach(analysis => {
      Object.entries(analysis.analysis.strategic_themes).forEach(([theme, data]) => {
        if (mergedThemes[theme]) {
          mergedThemes[theme].frequency += data.frequency;
        } else {
          mergedThemes[theme] = { frequency: data.frequency };
        }
      });
    });

    return mergedThemes;
  }

  async generateExecutiveSummary(analysisData, format) {
    const summary = {
      id: `exec_${Date.now()}`,
      title: 'Executive Summary - Communication Analysis',
      content: this.buildExecutiveSummaryContent(analysisData),
      format: format,
      generated_at: new Date().toISOString(),
      metadata: {
        total_messages: analysisData.totalMessages,
        key_themes: Object.keys(analysisData.analysis.strategic_themes).length,
        communication_style: analysisData.analysis.communication_patterns.response_style
      }
    };

    return summary;
  }

  buildExecutiveSummaryContent(data) {
    return `
# Executive Communication Analysis

## Overview
- **Total Messages Analyzed**: ${data.totalMessages}
- **Primary Communication Style**: ${data.analysis.communication_patterns.response_style}
- **Strategic Themes Identified**: ${Object.keys(data.analysis.strategic_themes).length}

## Key Strategic Themes
${Object.entries(data.analysis.strategic_themes)
  .sort(([,a], [,b]) => b.frequency - a.frequency)
  .map(([theme, themeData]) => `- **${theme.replace('_', ' ').toUpperCase()}**: ${themeData.frequency} mentions`)
  .join('\n')}

## Personality Profile
- **Openness**: ${Math.round(data.analysis.personality_profile.traits.openness * 100)}%
- **Conscientiousness**: ${Math.round(data.analysis.personality_profile.traits.conscientiousness * 100)}%
- **Expertise Areas**: ${data.analysis.personality_profile.expertise_areas.join(', ')}

## Business Insights
- **Strategic Focus**: ${data.analysis.business_insights.strategic_focus.join(', ')}
- **Growth Mindset**: ${data.analysis.business_insights.growth_mindset}
- **Market Orientation**: ${data.analysis.business_insights.market_orientation}

## Recommendations
1. **Leverage Analytical Strengths**: Continue systematic approach to strategic decisions
2. **Focus on Core Themes**: Prioritize the ${Object.keys(data.analysis.strategic_themes).length} identified strategic areas
3. **Maintain Communication Style**: ${data.analysis.communication_patterns.response_style} approach aligns with leadership needs
4. **Build on Expertise**: Utilize identified expertise areas for competitive advantage

---
*Generated by Soulfra Chat Analysis Engine*
    `;
  }

  async generateMobileReport(analysisData, theme) {
    const report = {
      id: `mobile_${Date.now()}`,
      theme: theme,
      content: {
        header: {
          title: '📊 Soulfra Analysis',
          subtitle: 'Strategic Communication Insights',
          stats: {
            messages: analysisData.totalMessages,
            themes: Object.keys(analysisData.analysis.strategic_themes).length,
            expertise_areas: analysisData.analysis.personality_profile.expertise_areas.length
          }
        },
        sections: [
          {
            title: '🎯 Top Themes',
            type: 'theme_cards',
            data: Object.entries(analysisData.analysis.strategic_themes)
              .sort(([,a], [,b]) => b.frequency - a.frequency)
              .slice(0, 5)
              .map(([theme, data]) => ({
                name: theme.replace('_', ' '),
                frequency: data.frequency,
                priority: data.frequency > 10 ? 'high' : data.frequency > 5 ? 'medium' : 'low'
              }))
          },
          {
            title: '💡 Key Insights',
            type: 'insight_list',
            data: Object.values(analysisData.clusters)
              .map(cluster => cluster.key_insights)
              .flat()
              .slice(0, 6)
          },
          {
            title: '👤 Profile',
            type: 'personality_chart',
            data: {
              traits: analysisData.analysis.personality_profile.traits,
              style: analysisData.analysis.communication_patterns.response_style,
              expertise: analysisData.analysis.personality_profile.expertise_areas
            }
          }
        ]
      },
      generated_at: new Date().toISOString()
    };

    return report;
  }

  convertAnalysisToCSV(analysisData, fields) {
    const rows = [];
    
    // Add header
    const headers = ['Category', 'Item', 'Value', 'Frequency', 'Priority', 'Notes'];
    rows.push(headers.join(','));

    // Add strategic themes
    Object.entries(analysisData.analysis.strategic_themes).forEach(([theme, data]) => {
      rows.push([
        'Strategic Theme',
        theme.replace('_', ' '),
        '',
        data.frequency,
        data.frequency > 10 ? 'High' : 'Medium',
        'Core strategic focus area'
      ].map(cell => `"${cell}"`).join(','));
    });

    // Add personality traits
    Object.entries(analysisData.analysis.personality_profile.traits).forEach(([trait, score]) => {
      rows.push([
        'Personality Trait',
        trait,
        Math.round(score * 100) + '%',
        '',
        score > 0.8 ? 'High' : 'Medium',
        'Leadership characteristic'
      ].map(cell => `"${cell}"`).join(','));
    });

    // Add insights
    Object.entries(analysisData.clusters).forEach(([category, cluster]) => {
      cluster.key_insights.forEach(insight => {
        rows.push([
          'Key Insight',
          insight,
          '',
          '',
          'Medium',
          category.replace('_', ' ')
        ].map(cell => `"${cell}"`).join(','));
      });
    });

    return rows.join('\n');
  }

  async updateTrustProfileFromAnalysis(userId, analysisData) {
    // Integration with existing Soulfra trust engine
    const trustInsights = {
      communication_consistency: analysisData.analysis.communication_patterns.response_style === 'analytical' ? 0.9 : 0.7,
      strategic_thinking: analysisData.analysis.personality_profile.traits.conscientiousness || 0.8,
      expertise_depth: analysisData.analysis.personality_profile.expertise_areas.length * 0.1,
      decision_quality: analysisData.analysis.business_insights.growth_mindset === 'aggressive' ? 0.85 : 0.75
    };

    const overallTrustBoost = Object.values(trustInsights).reduce((sum, val) => sum + val, 0) / 4;
    
    return {
      userId,
      insights: trustInsights,
      trustBoost: Math.round(overallTrustBoost * 100),
      newScore: Math.min(100, 75 + (overallTrustBoost * 25)), // Assume base score of 75
      recommendations: [
        'Communication patterns indicate high reliability',
        'Strategic thinking shows long-term focus',
        'Expertise areas demonstrate domain knowledge'
      ]
    };
  }

  async createAgentFromAnalysis(userId, analysisData, agentType) {
    const agent = {
      id: `agent_${Date.now()}`,
      name: `${userId}_strategic_assistant`,
      type: agentType,
      personality: {
        communication_style: analysisData.analysis.communication_patterns.response_style,
        expertise_areas: analysisData.analysis.personality_profile.expertise_areas,
        strategic_focus: analysisData.analysis.business_insights.strategic_focus,
        traits: analysisData.analysis.personality_profile.traits
      },
      capabilities: [
        'strategic_analysis',
        'business_planning',
        'decision_support',
        ...(analysisData.analysis.personality_profile.expertise_areas.includes('ai_ml') ? ['technical_architecture'] : []),
        ...(analysisData.analysis.personality_profile.expertise_areas.includes('product_management') ? ['product_strategy'] : [])
      ],
      training_data: {
        themes: analysisData.analysis.strategic_themes,
        communication_patterns: analysisData.analysis.communication_patterns,
        decision_patterns: analysisData.analysis.business_insights
      },
      created_at: new Date().toISOString()
    };

    return agent;
  }

  generateMobilePreviewHTML(reportId) {
    // Generate mobile-optimized HTML preview
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Mobile Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 100%; }
        .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 30px; margin-bottom: 20px; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: 600; }
        .metric-value { color: #667eea; font-weight: bold; }
        h2 { color: #333; margin-bottom: 15px; }
        .theme-card { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .insight { background: #fff8f0; padding: 12px; border-left: 3px solid #667eea; margin: 8px 0; font-size: 0.95em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Soulfra Analysis</h1>
            <p>Strategic Communication Insights</p>
        </div>
        
        <div class="card">
            <h2>📈 Overview</h2>
            <div class="metric">
                <span class="metric-label">Messages Analyzed</span>
                <span class="metric-value">Loading...</span>
            </div>
            <div class="metric">
                <span class="metric-label">Themes Identified</span>
                <span class="metric-value">Loading...</span>
            </div>
            <div class="metric">
                <span class="metric-label">Communication Style</span>
                <span class="metric-value">Loading...</span>
            </div>
        </div>

        <div class="card">
            <h2>🎯 Strategic Themes</h2>
            <div id="themes">Loading themes...</div>
        </div>

        <div class="card">
            <h2>💡 Key Insights</h2>
            <div id="insights">Loading insights...</div>
        </div>
    </div>
    
    <script>
        // Load report data via API
        fetch('/api/reports/${reportId}')
            .then(response => response.json())
            .then(data => {
                // Populate mobile interface with data
                console.log('Report loaded:', data);
            })
            .catch(error => console.error('Failed to load report:', error));
    </script>
</body>
</html>`;
  }

  async getQuickStatsForUser(userId) {
    // Get quick stats from cache or database
    const userAnalyses = Array.from(this.analysisCache.values())
      .filter(analysis => analysis.metadata?.user_id === userId);

    if (userAnalyses.length === 0) {
      return {
        total_analyses: 0,
        total_messages: 0,
        top_themes: [],
        communication_style: 'unknown'
      };
    }

    const latestAnalysis = userAnalyses[userAnalyses.length - 1];
    
    return {
      total_analyses: userAnalyses.length,
      total_messages: userAnalyses.reduce((sum, a) => sum + a.totalMessages, 0),
      top_themes: Object.entries(latestAnalysis.analysis.strategic_themes)
        .sort(([,a], [,b]) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(([theme, data]) => ({ theme, frequency: data.frequency })),
      communication_style: latestAnalysis.analysis.communication_patterns.response_style,
      last_analysis: latestAnalysis.metadata.processed_at
    };
  }

  // ==========================================
  // SERVER STARTUP
  // ==========================================

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`🚀 Soulfra Chat Log Service running on port ${port}`);
      console.log(`📱 Mobile interface: http://localhost:${port}`);
      console.log(`🔍 Health check: http://localhost:${port}/health`);
      console.log(`📊 API docs: http://localhost:${port}/api/docs`);
    });
  }
}

// ==========================================
// USAGE & STARTUP
// ==========================================

const service = new SoulfraChatLogService();

// Integration endpoints for existing Soulfra services
service.app.get('/api/docs', (req, res) => {
  res.json({
    service: 'Soulfra Chat Log Analysis Service',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/analyze - Upload and analyze chat logs',
      export: {
        csv: 'POST /api/export/csv - Export analysis as CSV',
        pdf: 'POST /api/export/pdf - Generate PDF report',
        json: 'POST /api/export/json - Export raw analysis data'
      },
      mobile: {
        preview: 'GET /mobile-preview/:reportId - Mobile-optimized report view',
        stats: 'GET /api/mobile/quick-stats/:userId - Quick stats for mobile'
      },
      integration: {
        trust: 'POST /api/integrate/trust-profile - Update user trust from analysis',
        agent: 'POST /api/integrate/create-agent - Create AI agent from patterns'
      }
    },
    examples: {
      curl_upload: 'curl -X POST -F "files=@chat.json" http://localhost:3001/api/analyze',
      mobile_view: 'Open http://localhost:3001/mobile-preview/REPORT_ID on mobile device'
    }
  });
});

// Start the service
if (require.main === module) {
  service.start();
}

module.exports = { SoulfraChatLogService };

// ==========================================
// DOCKER INTEGRATION
// ==========================================

/*
# Dockerfile for Chat Log Service
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "soulfra-chatlog-service.js"]
*/

// ==========================================
// KUBERNETES DEPLOYMENT
// ==========================================

/*
apiVersion: apps/v1
kind: Deployment
metadata:
  name: soulfra-chatlog-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: soulfra-chatlog
  template:
    metadata:
      labels:
        app: soulfra-chatlog
    spec:
      containers:
      - name: chatlog-service
        image: soulfra/chatlog-analyzer:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: soulfra-chatlog-service
spec:
  selector:
    app: soulfra-chatlog
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
*/