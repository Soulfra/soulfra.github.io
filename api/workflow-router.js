#!/usr/bin/env node
/**
 * Workflow Router
 *
 * Routes traffic to the right product based on domain/subdomain/path
 *
 * ROUTING LOGIC:
 * - soulfra.com → Creative Publishing
 * - game.soulfra.com → Domain Game
 * - cringeproof.com → Verification/Tagging
 * - localhost:8000 → Auto-Deploy (dev mode)
 *
 * FEATURES:
 * - Domain-based routing
 * - Path-based routing
 * - User session management
 * - Cross-product token sync
 * - Unified analytics
 *
 * Usage:
 *   const WorkflowRouter = require('./workflow-router');
 *   const router = new WorkflowRouter();
 *
 *   // Route incoming request
 *   const route = router.route(req);
 *   // => { product: 'game', handler: 'daily-puzzle' }
 */

const fs = require('fs');
const path = require('path');
const url = require('url');

class WorkflowRouter {
  constructor(options = {}) {
    this.verbose = options.verbose || false;

    // Product configurations
    this.products = {
      game: {
        name: 'Domain Game',
        domains: ['game.soulfra.com'],
        paths: ['/game', '/public/game'],
        handler: 'daily-puzzle',
        apiPrefix: '/api/game'
      },
      publishing: {
        name: 'Creative Publishing',
        domains: ['soulfra.com', 'www.soulfra.com'],
        paths: ['/upload', '/gallery', '/art', '/create'],
        handler: 'creative-artifact-publisher',
        apiPrefix: '/api/publishing'
      },
      verification: {
        name: 'Verification & Tagging',
        domains: ['cringeproof.com', 'www.cringeproof.com'],
        paths: ['/verify', '/check', '/proof'],
        handler: 'trust-validator',
        apiPrefix: '/api/verify'
      },
      deploy: {
        name: 'Auto-Deploy',
        domains: ['localhost', '127.0.0.1'],
        paths: ['/drops', '/deploy', '/public'],
        handler: 'drop-watcher',
        apiPrefix: '/api/deploy'
      },
      dashboard: {
        name: 'User Dashboard',
        domains: ['*'], // All domains
        paths: ['/dashboard', '/account', '/profile'],
        handler: 'user-account-system',
        apiPrefix: '/api/user'
      }
    };

    // Load existing modules
    this.handlers = this.loadHandlers();

    console.log('🌐 WorkflowRouter initialized');
    console.log(`   Products: ${Object.keys(this.products).length}`);
  }

  /**
   * Load product handler modules
   */
  loadHandlers() {
    const handlers = {};

    for (const [productId, product] of Object.entries(this.products)) {
      try {
        const handlerPath = path.join(__dirname, `${product.handler}.js`);
        if (fs.existsSync(handlerPath)) {
          handlers[productId] = require(handlerPath);
          if (this.verbose) {
            console.log(`   ✅ Loaded: ${product.name}`);
          }
        }
      } catch (err) {
        console.warn(`   ⚠️  Handler not found: ${product.handler}`);
      }
    }

    return handlers;
  }

  /**
   * Route incoming request to appropriate product
   */
  route(req) {
    const parsedUrl = url.parse(req.url, true);
    const hostname = req.headers.host || 'localhost';
    const pathname = parsedUrl.pathname;

    // Extract domain (without port)
    const domain = hostname.split(':')[0];

    // Determine product based on domain
    let product = this.getProductByDomain(domain);

    // Override with path-based routing if needed
    if (!product || product === 'dashboard') {
      const pathProduct = this.getProductByPath(pathname);
      if (pathProduct) {
        product = pathProduct;
      }
    }

    // Default to dashboard/homepage
    if (!product) {
      product = 'dashboard';
    }

    return {
      product,
      productConfig: this.products[product],
      handler: this.handlers[product],
      domain,
      pathname,
      query: parsedUrl.query
    };
  }

  /**
   * Get product by domain
   */
  getProductByDomain(domain) {
    for (const [productId, config] of Object.entries(this.products)) {
      if (config.domains.includes(domain)) {
        return productId;
      }

      // Check subdomain matching (e.g., game.soulfra.com)
      for (const productDomain of config.domains) {
        if (domain.endsWith(productDomain)) {
          return productId;
        }
      }
    }

    return null;
  }

  /**
   * Get product by path
   */
  getProductByPath(pathname) {
    for (const [productId, config] of Object.entries(this.products)) {
      for (const productPath of config.paths) {
        if (pathname.startsWith(productPath)) {
          return productId;
        }
      }
    }

    return null;
  }

  /**
   * Handle request routing with full workflow
   */
  async handleRequest(req, res) {
    const route = this.route(req);

    if (this.verbose) {
      console.log(`\n🌐 Routing Request:`);
      console.log(`   Domain: ${route.domain}`);
      console.log(`   Path: ${route.pathname}`);
      console.log(`   Product: ${route.product}`);
    }

    // Get user session
    const session = await this.getUserSession(req);

    // Route to appropriate product
    switch (route.product) {
      case 'game':
        return this.handleGame(req, res, session);

      case 'publishing':
        return this.handlePublishing(req, res, session);

      case 'verification':
        return this.handleVerification(req, res, session);

      case 'deploy':
        return this.handleDeploy(req, res, session);

      case 'dashboard':
        return this.handleDashboard(req, res, session);

      default:
        return this.handleNotFound(req, res);
    }
  }

  /**
   * Get user session from request
   */
  async getUserSession(req) {
    // TODO: Implement proper session management
    // For now, return default session
    return {
      userId: 'default-user',
      tokens: 100,
      authenticated: false
    };
  }

  /**
   * Handle Domain Game requests
   */
  async handleGame(req, res, session) {
    const DailyPuzzle = this.handlers.game;

    if (!DailyPuzzle) {
      return this.sendError(res, 'Game handler not available');
    }

    try {
      const puzzle = new DailyPuzzle();
      const todaysPuzzle = puzzle.getTodaysPuzzle();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        product: 'game',
        data: todaysPuzzle,
        session
      }));
    } catch (err) {
      return this.sendError(res, err.message);
    }
  }

  /**
   * Handle Creative Publishing requests
   */
  async handlePublishing(req, res, session) {
    const Publisher = this.handlers.publishing;

    if (!Publisher) {
      return this.sendError(res, 'Publishing handler not available');
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      product: 'publishing',
      message: 'Creative Publishing API',
      endpoints: {
        upload: '/api/publishing/upload',
        gallery: '/api/publishing/gallery',
        artwork: '/api/publishing/artwork/:id'
      },
      session
    }));
  }

  /**
   * Handle Verification requests
   */
  async handleVerification(req, res, session) {
    const TrustValidator = this.handlers.verification;

    if (!TrustValidator) {
      return this.sendError(res, 'Verification handler not available');
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      product: 'verification',
      message: 'Trust Validation & Verification API',
      endpoints: {
        verify: '/api/verify/check',
        proof: '/api/verify/proof/:id'
      },
      session
    }));
  }

  /**
   * Handle Auto-Deploy requests
   */
  async handleDeploy(req, res, session) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      product: 'deploy',
      message: 'Auto-Deploy System',
      dropPath: '~/Public/Drop Box',
      session
    }));
  }

  /**
   * Handle Dashboard requests
   */
  async handleDashboard(req, res, session) {
    // Serve the master dashboard HTML
    const dashboardPath = path.join(__dirname, '../public/index.html');

    if (fs.existsSync(dashboardPath)) {
      const html = fs.readFileSync(dashboardPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      return this.sendError(res, 'Dashboard not found');
    }
  }

  /**
   * Handle 404 Not Found
   */
  handleNotFound(req, res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: 'The requested resource was not found'
    }));
  }

  /**
   * Send error response
   */
  sendError(res, message) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message
    }));
  }

  /**
   * Sync tokens across products
   */
  async syncTokens(userId, productId, amount) {
    // TODO: Implement cross-product token syncing
    console.log(`🪙 Token sync: User ${userId}, Product ${productId}, Amount ${amount}`);
  }

  /**
   * Track analytics across products
   */
  async trackAnalytics(event) {
    // TODO: Implement unified analytics
    console.log(`📊 Analytics: ${event.type} - ${event.product}`);
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return {
      products: Object.keys(this.products).length,
      handlers: Object.keys(this.handlers).length,
      routes: Object.values(this.products).reduce((sum, p) => sum + p.paths.length, 0)
    };
  }
}

// CLI Mode - Start HTTP server with routing
if (require.main === module) {
  const http = require('http');
  const router = new WorkflowRouter({ verbose: true });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          🌐 Workflow Router Server                        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const PORT = process.env.PORT || 3000;

  const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route request
    router.handleRequest(req, res).catch(err => {
      console.error('❌ Routing error:', err);
      router.sendError(res, err.message);
    });
  });

  server.listen(PORT, () => {
    console.log(`✅ Workflow Router running on port ${PORT}\n`);
    console.log('Products:');
    for (const [id, config] of Object.entries(router.products)) {
      console.log(`   - ${config.name}`);
      console.log(`     Domains: ${config.domains.join(', ')}`);
      console.log(`     Paths: ${config.paths.join(', ')}\n`);
    }

    const stats = router.getStats();
    console.log(`📊 Stats: ${stats.products} products, ${stats.handlers} handlers, ${stats.routes} routes\n`);
  });
}

module.exports = WorkflowRouter;
