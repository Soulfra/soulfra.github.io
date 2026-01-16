#!/usr/bin/env node
/**
 * Domain Router
 *
 * Assigns URLs to deployed drops
 * Manages domain mappings and availability
 *
 * Features:
 * - Auto-assign URLs to drops (drops.soulfra.com/projectname)
 * - Custom domain mapping (Phase 2)
 * - Domain availability checking
 * - Vanity URL support
 *
 * URL Structure:
 * - Default: http://localhost:8000/projectname
 * - Production: https://drops.soulfra.com/projectname
 * - Custom (Phase 2): https://user.com → drops/projectname
 *
 * Usage:
 *   const DomainRouter = require('./domain-router');
 *   const router = new DomainRouter();
 *
 *   const url = router.assignDomain('myproject', 'user@example.com');
 *   console.log(`Deployed at: ${url}`);
 */

const fs = require('fs');
const path = require('path');

class DomainRouter {
  constructor(options = {}) {
    this.dataPath = path.join(__dirname, '../data');
    this.domainsPath = path.join(this.dataPath, 'domains.json');

    // Configuration
    this.baseURL = options.baseURL || 'http://localhost:8000/public';
    this.productionURL = options.productionURL || 'https://drops.soulfra.com';
    this.environment = options.environment || 'development'; // 'development' | 'production'

    // Reserved names (can't be used as project names)
    this.reservedNames = [
      'api', 'admin', 'dashboard', 'auth', 'login', 'logout',
      'register', 'signup', 'signin', 'www', 'mail', 'ftp',
      'blog', 'shop', 'store', 'help', 'support', 'about',
      'contact', 'terms', 'privacy', 'legal'
    ];

    // Load domains
    this.domains = this.loadDomains();

    this.initialize();

    console.log('🌐 DomainRouter initialized');
    console.log(`   Environment: ${this.environment}`);
    console.log(`   Base URL: ${this.getBaseURL()}`);
  }

  /**
   * Initialize data files
   */
  initialize() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    if (!fs.existsSync(this.domainsPath)) {
      this.saveDomains();
    }
  }

  /**
   * Load domains from file
   */
  loadDomains() {
    try {
      if (fs.existsSync(this.domainsPath)) {
        const data = fs.readFileSync(this.domainsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Could not load domains:', error.message);
    }

    return {
      assignments: {},  // projectName → { url, userId, assignedAt, customDomain }
      customDomains: {} // customDomain → projectName (Phase 2)
    };
  }

  /**
   * Save domains to file
   */
  saveDomains() {
    try {
      fs.writeFileSync(
        this.domainsPath,
        JSON.stringify(this.domains, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Failed to save domains:', error.message);
    }
  }

  /**
   * Get base URL based on environment
   */
  getBaseURL() {
    return this.environment === 'production' ? this.productionURL : this.baseURL;
  }

  /**
   * Validate project name
   */
  validateProjectName(projectName) {
    // Must be alphanumeric with hyphens/underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;

    if (!validPattern.test(projectName)) {
      return {
        valid: false,
        reason: 'Project name can only contain letters, numbers, hyphens, and underscores'
      };
    }

    // Check length
    if (projectName.length < 3) {
      return {
        valid: false,
        reason: 'Project name must be at least 3 characters'
      };
    }

    if (projectName.length > 50) {
      return {
        valid: false,
        reason: 'Project name must be less than 50 characters'
      };
    }

    // Check reserved names
    if (this.reservedNames.includes(projectName.toLowerCase())) {
      return {
        valid: false,
        reason: `"${projectName}" is a reserved name`
      };
    }

    return { valid: true };
  }

  /**
   * Check if project name is available
   */
  isAvailable(projectName) {
    return !this.domains.assignments[projectName];
  }

  /**
   * Assign domain to project
   */
  assignDomain(projectName, userId, options = {}) {
    // Validate project name
    const validation = this.validateProjectName(projectName);
    if (!validation.valid) {
      throw new Error(`Invalid project name: ${validation.reason}`);
    }

    // Check availability
    if (!this.isAvailable(projectName)) {
      throw new Error(`Project name "${projectName}" is already taken`);
    }

    // Generate URL
    const baseURL = this.getBaseURL();
    const url = `${baseURL}/${projectName}`;

    // Create assignment
    const assignment = {
      projectName,
      url,
      userId,
      assignedAt: new Date().toISOString(),
      customDomain: options.customDomain || null,
      metadata: options.metadata || {}
    };

    this.domains.assignments[projectName] = assignment;
    this.saveDomains();

    console.log(`✅ Assigned domain: ${projectName} → ${url}`);

    return assignment;
  }

  /**
   * Get domain assignment
   */
  getDomain(projectName) {
    return this.domains.assignments[projectName] || null;
  }

  /**
   * Get URL for project
   */
  getURL(projectName) {
    const assignment = this.getDomain(projectName);
    return assignment ? assignment.url : null;
  }

  /**
   * Update domain assignment
   */
  updateDomain(projectName, updates) {
    const assignment = this.getDomain(projectName);

    if (!assignment) {
      throw new Error(`No domain assignment found for "${projectName}"`);
    }

    // Update fields
    Object.assign(assignment, updates, {
      updatedAt: new Date().toISOString()
    });

    this.saveDomains();

    console.log(`✅ Updated domain: ${projectName}`);

    return assignment;
  }

  /**
   * Remove domain assignment
   */
  removeDomain(projectName) {
    if (!this.domains.assignments[projectName]) {
      throw new Error(`No domain assignment found for "${projectName}"`);
    }

    delete this.domains.assignments[projectName];
    this.saveDomains();

    console.log(`✅ Removed domain: ${projectName}`);
  }

  /**
   * List all assignments
   */
  listDomains(options = {}) {
    const assignments = Object.values(this.domains.assignments);

    // Filter by user
    if (options.userId) {
      return assignments.filter(a => a.userId === options.userId);
    }

    // Sort by most recent
    return assignments.sort((a, b) =>
      new Date(b.assignedAt) - new Date(a.assignedAt)
    );
  }

  /**
   * Get stats
   */
  getStats() {
    const assignments = Object.values(this.domains.assignments);

    return {
      totalAssignments: assignments.length,
      totalCustomDomains: Object.keys(this.domains.customDomains).length,
      recentAssignments: assignments
        .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
        .slice(0, 10)
        .map(a => ({
          projectName: a.projectName,
          url: a.url,
          assignedAt: a.assignedAt
        }))
    };
  }

  /**
   * Suggest available names (if requested name is taken)
   */
  suggestAlternatives(projectName, count = 5) {
    const suggestions = [];

    // Try with numbers
    for (let i = 1; i <= count; i++) {
      const suggestion = `${projectName}${i}`;
      if (this.isAvailable(suggestion)) {
        suggestions.push(suggestion);
      }
    }

    // Try with year
    const year = new Date().getFullYear();
    const withYear = `${projectName}${year}`;
    if (this.isAvailable(withYear)) {
      suggestions.push(withYear);
    }

    // Try with month
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const withMonth = `${projectName}-${month}`;
    if (this.isAvailable(withMonth)) {
      suggestions.push(withMonth);
    }

    return suggestions.slice(0, count);
  }

  /**
   * Assign custom domain (Phase 2)
   */
  assignCustomDomain(projectName, customDomain) {
    const assignment = this.getDomain(projectName);

    if (!assignment) {
      throw new Error(`No project found: ${projectName}`);
    }

    // Validate domain format
    const domainPattern = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainPattern.test(customDomain)) {
      throw new Error('Invalid domain format');
    }

    // Check if custom domain is already taken
    if (this.domains.customDomains[customDomain]) {
      throw new Error(`Domain ${customDomain} is already assigned`);
    }

    // Assign custom domain
    this.domains.customDomains[customDomain] = projectName;
    assignment.customDomain = customDomain;
    assignment.customURL = `https://${customDomain}`;

    this.saveDomains();

    console.log(`✅ Assigned custom domain: ${customDomain} → ${projectName}`);

    return assignment;
  }

  /**
   * Get project by custom domain
   */
  getProjectByCustomDomain(customDomain) {
    return this.domains.customDomains[customDomain] || null;
  }

  /**
   * Verify custom domain (Phase 2 - DNS check)
   */
  async verifyCustomDomain(customDomain) {
    // TODO: Implement DNS verification
    // Check if domain points to our server
    // Return verification status
    return {
      verified: false,
      message: 'Custom domain verification not yet implemented (Phase 2)'
    };
  }
}

// CLI Mode
if (require.main === module) {
  const router = new DomainRouter();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       🌐 Domain Router - URL Management                   ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const stats = router.getStats();
  console.log('📊 Domain Stats:');
  console.log(`   Total Assignments: ${stats.totalAssignments}`);
  console.log(`   Custom Domains: ${stats.totalCustomDomains}`);

  if (stats.totalAssignments === 0) {
    console.log('\n🆕 No domains assigned yet');
    console.log('\nExample usage:');
    console.log('  const router = new DomainRouter();');
    console.log('  router.assignDomain("myproject", "user@example.com");');
    console.log('  // → http://localhost:8000/myproject');
  } else {
    console.log('\n📋 Recent Assignments:');
    stats.recentAssignments.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.projectName} → ${a.url}`);
    });
  }

  // Test assignment
  if (process.argv[2] === 'test') {
    console.log('\n🧪 Testing domain assignment...');
    const testProject = `test-${Date.now()}`;
    const assignment = router.assignDomain(testProject, 'test@example.com');
    console.log('✅ Test assignment created:', assignment.url);
  }
}

module.exports = DomainRouter;
