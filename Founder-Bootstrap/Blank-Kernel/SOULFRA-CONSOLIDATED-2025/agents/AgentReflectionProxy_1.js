/**
 * AgentReflectionProxy.js
 * 
 * AGENT TRAFFIC GATEKEEPER - FINAL FIREWALL
 * 
 * Routes ALL external AI agent traffic through public reflection sites.
 * Blocks ALL direct access to core memory, runtime, or operator data.
 * 
 * This is the ONLY way agents can interact with Soulfra:
 * - Through sanctioned public domains
 * - Via projected, sanitized content
 * - With full logging and monitoring
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class AgentReflectionProxy extends EventEmitter {
  constructor() {
    super();
    
    // Proxy configuration
    this.port = process.env.PROXY_PORT || 3333;
    this.server = null;
    
    // Sanctioned domains ONLY
    this.allowedDomains = [
      'https://cringeproof.com',
      'https://listener.soulfra.io',
      'https://whisper.soulfra.io'
    ];
    
    // Local development fallback
    if (process.env.NODE_ENV === 'development') {
      this.allowedDomains.push('http://localhost:8080');
    }
    
    // Logging
    this.logsPath = path.join(__dirname, 'logs');
    this.requestLogPath = path.join(this.logsPath, 'agent_requests.json');
    this.blockLogPath = path.join(this.logsPath, 'blocked_attempts.json');
    
    // Request tracking
    this.requestCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
    this.requestStats = {
      total: 0,
      allowed: 0,
      blocked: 0,
      cached: 0
    };
    
    // Rate limiting
    this.rateLimits = new Map();
    this.rateWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 100;
    
    // Blocked patterns - NEVER allow these
    this.blockedPatterns = [
      /soulfra-ledger/i,
      /operator/i,
      /daemon/i,
      /vault/i,
      /blessing/i,
      /soul[_-]chain/i,
      /memory[_-]loop/i,
      /cal[_-]routing/i,
      /internal/i,
      /sealed/i,
      /tier-minus/i,
      /localhost(?!:8080)/i  // Block localhost except dev port
    ];
  }

  /**
   * Initialize the proxy server
   */
  async initialize() {
    console.log('🛡️  Agent Reflection Proxy initializing...');
    
    // Ensure logs directory
    if (!fs.existsSync(this.logsPath)) {
      fs.mkdirSync(this.logsPath, { recursive: true });
    }
    
    // Initialize request log
    this.initializeRequestLog();
    
    // Create proxy server
    this.createProxyServer();
    
    // Start server
    this.server.listen(this.port, () => {
      console.log(`✅ Proxy active on port ${this.port}`);
      console.log('🔒 All agent traffic must pass through sanctioned domains');
    });
  }

  /**
   * Create the proxy server
   */
  createProxyServer() {
    this.server = http.createServer(async (req, res) => {
      // Log all requests
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      try {
        // Parse request
        const requestData = this.parseRequest(req);
        
        // Check if blocked
        if (this.isBlocked(requestData)) {
          this.handleBlockedRequest(requestData, res, requestId);
          return;
        }
        
        // Check rate limit
        if (!this.checkRateLimit(requestData.origin)) {
          this.handleRateLimitExceeded(requestData, res, requestId);
          return;
        }
        
        // Route to appropriate handler
        const response = await this.routeRequest(requestData);
        
        // Send response
        this.sendResponse(res, response, requestId, startTime);
        
      } catch (error) {
        this.handleError(error, res, requestId);
      }
    });
  }

  /**
   * Parse incoming request
   */
  parseRequest(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    return {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: req.headers,
      origin: this.extractOrigin(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Extract request origin
   */
  extractOrigin(req) {
    // Check various headers for origin
    const origin = req.headers['x-forwarded-for'] ||
                  req.headers['x-real-ip'] ||
                  req.connection.remoteAddress ||
                  'unknown';
    
    // Also check for agent identifiers
    const agentId = req.headers['x-agent-id'] ||
                   req.headers['x-soulfra-agent'] ||
                   this.extractAgentFromUA(req.headers['user-agent']);
    
    return {
      ip: origin,
      agentId: agentId,
      type: this.classifyOrigin(origin, agentId)
    };
  }

  extractAgentFromUA(userAgent) {
    if (!userAgent) return null;
    
    // Common AI agent patterns
    const patterns = [
      /Claude|Anthropic/i,
      /GPT|OpenAI/i,
      /Gemini|Google/i,
      /LLaMA|Meta/i,
      /bot|crawler|spider/i
    ];
    
    for (const pattern of patterns) {
      const match = userAgent.match(pattern);
      if (match) return match[0];
    }
    
    return null;
  }

  classifyOrigin(ip, agentId) {
    if (agentId) {
      if (agentId.match(/Claude|Anthropic/i)) return 'claude';
      if (agentId.match(/GPT|OpenAI/i)) return 'openai';
      if (agentId.match(/Gemini|Google/i)) return 'google';
      return 'ai_agent';
    }
    
    if (ip.includes('127.0.0.1') || ip.includes('localhost')) {
      return 'local';
    }
    
    return 'external';
  }

  /**
   * Check if request should be blocked
   */
  isBlocked(requestData) {
    // Check path against blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(requestData.path)) {
        this.logBlockedAttempt(requestData, 'blocked_pattern');
        return true;
      }
    }
    
    // Check for direct core access attempts
    if (this.isDirectCoreAccess(requestData.path)) {
      this.logBlockedAttempt(requestData, 'direct_core_access');
      return true;
    }
    
    // Check for suspicious patterns
    if (this.isSuspicious(requestData)) {
      this.logBlockedAttempt(requestData, 'suspicious_pattern');
      return true;
    }
    
    return false;
  }

  isDirectCoreAccess(path) {
    const corePatterns = [
      /^\/soulfra-core/,
      /^\/tier-/,
      /^\/operator/,
      /^\/vault/,
      /^\/daemon/
    ];
    
    return corePatterns.some(pattern => pattern.test(path));
  }

  isSuspicious(requestData) {
    // Multiple dots (directory traversal)
    if (requestData.path.includes('..')) return true;
    
    // Encoded slashes
    if (requestData.path.includes('%2F') || requestData.path.includes('%5C')) return true;
    
    // SQL injection patterns
    if (requestData.path.match(/('|"|;|union|select|drop)/i)) return true;
    
    return false;
  }

  /**
   * Route valid requests
   */
  async routeRequest(requestData) {
    // Check cache first
    const cacheKey = this.generateCacheKey(requestData);
    const cached = this.getCached(cacheKey);
    if (cached) {
      this.requestStats.cached++;
      return cached;
    }
    
    // Map request to public endpoint
    const publicEndpoint = this.mapToPublicEndpoint(requestData.path);
    
    if (!publicEndpoint) {
      return {
        status: 404,
        data: {
          error: 'Reflection not found',
          message: 'The mirror shows nothing for this path',
          suggestion: 'Try /api/scene, /api/weather, or /api/agents'
        }
      };
    }
    
    // Fetch from sanctioned domain
    try {
      const response = await this.fetchFromPublicDomain(publicEndpoint);
      
      // Cache successful responses
      if (response.status === 200) {
        this.setCached(cacheKey, response);
      }
      
      // Log successful request
      this.logRequest(requestData, response.status, publicEndpoint);
      
      return response;
      
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        status: 503,
        data: {
          error: 'Reflection temporarily unavailable',
          message: 'The mirror clouds momentarily'
        }
      };
    }
  }

  /**
   * Map internal paths to public endpoints
   */
  mapToPublicEndpoint(path) {
    // Remove any query parameters for mapping
    const cleanPath = path.split('?')[0];
    
    // Direct API mappings
    const mappings = {
      '/api/scene': '/api/scene/current.json',
      '/api/scene/current': '/api/scene/current.json',
      '/api/weather': '/api/weather/current.json',
      '/api/weather/current': '/api/weather/current.json',
      '/api/loop': '/api/loop/state.json',
      '/api/loop/state': '/api/loop/state.json',
      '/api/rituals': '/api/rituals/current.json',
      '/api/rituals/current': '/api/rituals/current.json',
      '/api/agents': '/api/agents/index.json'
    };
    
    // Check direct mappings
    if (mappings[cleanPath]) {
      return mappings[cleanPath];
    }
    
    // Agent-specific paths
    const agentMatch = cleanPath.match(/^\/api\/agents\/(.+)$/);
    if (agentMatch) {
      const agentId = agentMatch[1];
      return `/api/agents/${agentId}.json`;
    }
    
    // Context queries (common AI pattern)
    if (cleanPath.includes('context') || cleanPath.includes('getContext')) {
      return '/api/scene/current.json';  // Default to current scene
    }
    
    // State queries
    if (cleanPath.includes('state') || cleanPath.includes('status')) {
      return '/api/loop/state.json';
    }
    
    // No valid mapping
    return null;
  }

  /**
   * Fetch from sanctioned public domain
   */
  async fetchFromPublicDomain(endpoint) {
    // Select domain (round-robin or primary)
    const domain = this.selectDomain();
    const url = `${domain}${endpoint}`;
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const options = {
        timeout: 10000,  // 10 second timeout
        headers: {
          'User-Agent': 'Soulfra-Reflection-Proxy/1.0',
          'X-Proxy-Request': 'true'
        }
      };
      
      protocol.get(url, options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: parsed,
              headers: {
                'Content-Type': 'application/json',
                'X-Reflection-Source': domain,
                'X-Projection': 'true'
              }
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: {
                'Content-Type': 'text/plain',
                'X-Reflection-Source': domain
              }
            });
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Select which domain to use
   */
  selectDomain() {
    // For now, use primary domain
    // Could implement round-robin or load balancing
    return this.allowedDomains[0];
  }

  /**
   * Send response to agent
   */
  sendResponse(res, response, requestId, startTime) {
    const duration = Date.now() - startTime;
    
    // Set headers
    res.writeHead(response.status, {
      ...response.headers,
      'X-Request-ID': requestId,
      'X-Response-Time': `${duration}ms`,
      'X-Proxy-Version': '1.0.0',
      'Access-Control-Allow-Origin': '*'  // Allow CORS
    });
    
    // Send data
    if (typeof response.data === 'object') {
      res.end(JSON.stringify(response.data));
    } else {
      res.end(response.data);
    }
    
    // Update stats
    this.requestStats.total++;
    this.requestStats.allowed++;
  }

  /**
   * Handle blocked requests
   */
  handleBlockedRequest(requestData, res, requestId) {
    const response = {
      error: 'Access Denied',
      message: 'Direct core access is not permitted',
      advice: 'Use sanctioned public endpoints only',
      allowed_domains: this.allowedDomains,
      request_id: requestId
    };
    
    res.writeHead(403, {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Block-Reason': 'security'
    });
    
    res.end(JSON.stringify(response));
    
    // Update stats
    this.requestStats.total++;
    this.requestStats.blocked++;
  }

  /**
   * Handle rate limit exceeded
   */
  handleRateLimitExceeded(requestData, res, requestId) {
    const response = {
      error: 'Rate Limit Exceeded',
      message: 'Too many requests from this origin',
      retry_after: this.rateWindow / 1000,  // seconds
      request_id: requestId
    };
    
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'Retry-After': String(this.rateWindow / 1000)
    });
    
    res.end(JSON.stringify(response));
    
    this.logBlockedAttempt(requestData, 'rate_limit');
  }

  /**
   * Handle errors
   */
  handleError(error, res, requestId) {
    console.error('Proxy error:', error);
    
    const response = {
      error: 'Proxy Error',
      message: 'The reflection pathway encountered interference',
      request_id: requestId
    };
    
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId
    });
    
    res.end(JSON.stringify(response));
  }

  /**
   * RATE LIMITING
   */
  
  checkRateLimit(origin) {
    const key = origin.ip || 'unknown';
    const now = Date.now();
    
    // Get or create rate limit entry
    let rateLimit = this.rateLimits.get(key);
    
    if (!rateLimit) {
      rateLimit = {
        count: 0,
        windowStart: now
      };
      this.rateLimits.set(key, rateLimit);
    }
    
    // Check if window expired
    if (now - rateLimit.windowStart > this.rateWindow) {
      rateLimit.count = 0;
      rateLimit.windowStart = now;
    }
    
    // Increment and check
    rateLimit.count++;
    
    return rateLimit.count <= this.maxRequestsPerWindow;
  }

  /**
   * CACHING
   */
  
  generateCacheKey(requestData) {
    const key = `${requestData.method}:${requestData.path}:${JSON.stringify(requestData.query)}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  getCached(key) {
    const cached = this.requestCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response;
    }
    
    this.requestCache.delete(key);
    return null;
  }

  setCached(key, response) {
    this.requestCache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.requestCache.size > 1000) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
    }
  }

  /**
   * LOGGING
   */
  
  initializeRequestLog() {
    if (!fs.existsSync(this.requestLogPath)) {
      fs.writeFileSync(this.requestLogPath, '[]');
    }
    if (!fs.existsSync(this.blockLogPath)) {
      fs.writeFileSync(this.blockLogPath, '[]');
    }
  }

  logRequest(requestData, status, endpoint) {
    const logEntry = {
      id: this.generateRequestId(),
      timestamp: Date.now(),
      origin: requestData.origin,
      path: requestData.path,
      mapped_to: endpoint,
      status: status,
      user_agent: requestData.userAgent,
      method: requestData.method
    };
    
    this.appendToLog(this.requestLogPath, logEntry);
  }

  logBlockedAttempt(requestData, reason) {
    const logEntry = {
      id: this.generateRequestId(),
      timestamp: Date.now(),
      origin: requestData.origin,
      path: requestData.path,
      reason: reason,
      user_agent: requestData.userAgent,
      method: requestData.method,
      severity: this.calculateSeverity(reason, requestData)
    };
    
    this.appendToLog(this.blockLogPath, logEntry);
    
    // Alert on high severity
    if (logEntry.severity === 'high') {
      console.warn('⚠️  HIGH SEVERITY BLOCK:', logEntry);
    }
  }

  calculateSeverity(reason, requestData) {
    if (reason === 'direct_core_access') return 'high';
    if (reason === 'suspicious_pattern') return 'high';
    if (requestData.path.includes('operator') || requestData.path.includes('vault')) return 'critical';
    return 'medium';
  }

  appendToLog(logPath, entry) {
    try {
      const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      logs.push(entry);
      
      // Keep only last 10000 entries
      if (logs.length > 10000) {
        logs.splice(0, logs.length - 10000);
      }
      
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('Log write error:', error);
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get proxy statistics
   */
  getStats() {
    return {
      ...this.requestStats,
      cache_size: this.requestCache.size,
      rate_limited_origins: this.rateLimits.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Shutdown proxy
   */
  shutdown() {
    if (this.server) {
      this.server.close(() => {
        console.log('🌙 Reflection proxy shutting down');
      });
    }
    
    // Save final stats
    const statsPath = path.join(this.logsPath, 'final_stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(this.getStats(), null, 2));
    
    this.emit('shutdown');
  }
}

module.exports = AgentReflectionProxy;

// Run standalone
if (require.main === module) {
  const proxy = new AgentReflectionProxy();
  proxy.initialize();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    proxy.shutdown();
    process.exit(0);
  });
  
  // Log stats periodically
  setInterval(() => {
    console.log('📊 Proxy stats:', proxy.getStats());
  }, 60000);  // Every minute
}