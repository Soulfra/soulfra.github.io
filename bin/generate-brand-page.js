#!/usr/bin/env node

/**
 * Brand Page Generator
 *
 * Generates professional brand pages from templates with variable replacement.
 * Based on 99brands.com model but FREE and open-source.
 *
 * Usage:
 *   node bin/generate-brand-page.js --brand "MyBrand" --slug "mybrand" --x-handle "@mybrand"
 *   node bin/generate-brand-page.js --json submission.json
 *
 * Templates:
 *   - templates/brand-page/about.html
 *   - templates/brand-page/privacy.html
 *   - templates/brand-page/terms.html
 *
 * Output:
 *   - brands/[brandSlug]/about.html
 *   - brands/[brandSlug]/privacy.html
 *   - brands/[brandSlug]/terms.html
 *   - brands/[brandSlug]/index.html (redirect to about)
 */

const fs = require('fs');
const path = require('path');

class BrandPageGenerator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || path.join(__dirname, '..');
    this.templatesDir = path.join(this.projectRoot, 'templates', 'brand-page');
    this.brandsDir = path.join(this.projectRoot, 'brands');
    this.brandRegistry = path.join(this.projectRoot, 'data', 'brand-registry.json');

    // Ensure directories exist
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.brandsDir)) {
      fs.mkdirSync(this.brandsDir, { recursive: true });
    }

    const dataDir = path.dirname(this.brandRegistry);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Generate brand pages from submission data
   * @param {Object} submission - Brand submission data
   * @returns {Object} - Generation result with file paths
   */
  async generate(submission) {
    // Validate submission
    this.validateSubmission(submission);

    // Prepare template variables
    const variables = this.prepareVariables(submission);

    // Create brand directory
    const brandDir = path.join(this.brandsDir, submission.brandSlug);
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }

    // Generate pages from templates
    const generatedFiles = {};
    const templates = ['about.html', 'privacy.html', 'terms.html'];

    for (const template of templates) {
      const templatePath = path.join(this.templatesDir, template);
      const outputPath = path.join(brandDir, template);

      // Read template
      let content = fs.readFileSync(templatePath, 'utf-8');

      // Replace variables
      content = this.replaceVariables(content, variables);

      // Write output
      fs.writeFileSync(outputPath, content, 'utf-8');
      generatedFiles[template] = outputPath;
    }

    // Generate index.html (redirect to about.html)
    const indexPath = path.join(brandDir, 'index.html');
    fs.writeFileSync(indexPath, this.generateIndexRedirect(submission.brandName), 'utf-8');
    generatedFiles['index.html'] = indexPath;

    // Update brand registry
    this.updateBrandRegistry(submission);

    return {
      success: true,
      brandSlug: submission.brandSlug,
      brandDir,
      files: generatedFiles,
      url: `https://soulfra.github.io/brands/${submission.brandSlug}/`
    };
  }

  /**
   * Validate submission data
   */
  validateSubmission(submission) {
    const required = ['brandName', 'brandSlug', 'xHandle', 'contactEmail'];
    for (const field of required) {
      if (!submission[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(submission.brandSlug)) {
      throw new Error(`Invalid brandSlug format: ${submission.brandSlug}. Use lowercase, alphanumeric, hyphens only.`);
    }

    // Validate X handle format
    if (!submission.xHandle.startsWith('@')) {
      submission.xHandle = '@' + submission.xHandle;
    }
  }

  /**
   * Prepare template variables from submission
   */
  prepareVariables(submission) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastUpdated = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const xHandleClean = submission.xHandle.replace('@', '');

    return {
      // Brand basics
      BRAND_NAME: submission.brandName,
      BRAND_SLUG: submission.brandSlug,
      BRAND_TAGLINE: submission.brandTagline || 'Building in public',
      BRAND_DESCRIPTION: submission.brandDescription || 'A principled brand focused on changing the world.',
      BRAND_MISSION: submission.brandMission || 'Build tools that matter, give them away for free.',
      BRAND_CATEGORY: submission.brandCategory || 'platform',
      BRAND_IMPACT: submission.brandImpact || 'solve real problems',

      // Social/Contact
      X_HANDLE: submission.xHandle,
      X_HANDLE_CLEAN: xHandleClean,
      CONTACT_EMAIL: submission.contactEmail,

      // Dates
      CURRENT_YEAR: currentYear.toString(),
      LAST_UPDATED: lastUpdated,

      // Philosophy
      WHY_WORTH_MILLIONS: submission.whyWorthMillions || this.defaultWorthMillions(),

      // Cross-promotion
      CROSS_PROMOTION_LINKS: this.generateCrossPromotionLinks(submission.brandSlug)
    };
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(content, variables) {
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.split(placeholder).join(value);
    }
    return content;
  }

  /**
   * Generate cross-promotion links (all brands except current)
   */
  generateCrossPromotionLinks(currentSlug) {
    const brands = this.loadBrandRegistry();
    const otherBrands = brands.filter(b => b.brandSlug !== currentSlug);

    if (otherBrands.length === 0) {
      return '<p>First brand in the ecosystem!</p>';
    }

    const links = otherBrands.map(brand => {
      return `<a href="/brands/${brand.brandSlug}/" target="_blank">${brand.brandName}</a>`;
    }).join(' • ');

    return links;
  }

  /**
   * Generate index.html redirect
   */
  generateIndexRedirect(brandName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=about.html">
  <title>${brandName}</title>
</head>
<body>
  <p>Redirecting to <a href="about.html">About ${brandName}</a>...</p>
</body>
</html>`;
  }

  /**
   * Default "Why Worth Millions" content
   */
  defaultWorthMillions() {
    return `<ul>
  <li><strong>Market Need:</strong> Solves a real problem millions of people face</li>
  <li><strong>Network Effects:</strong> Value increases with each user</li>
  <li><strong>Scalability:</strong> Built to serve millions with minimal infrastructure</li>
  <li><strong>Open Source:</strong> Community contributions accelerate growth</li>
</ul>`;
  }

  /**
   * Load brand registry
   */
  loadBrandRegistry() {
    if (!fs.existsSync(this.brandRegistry)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.brandRegistry, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading brand registry:', err.message);
      return [];
    }
  }

  /**
   * Update brand registry with new brand
   */
  updateBrandRegistry(submission) {
    let brands = this.loadBrandRegistry();

    // Remove existing entry if it exists
    brands = brands.filter(b => b.brandSlug !== submission.brandSlug);

    // Add new entry
    brands.push({
      brandName: submission.brandName,
      brandSlug: submission.brandSlug,
      brandTagline: submission.brandTagline || 'Building in public',
      xHandle: submission.xHandle,
      contactEmail: submission.contactEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Save registry
    fs.writeFileSync(
      this.brandRegistry,
      JSON.stringify(brands, null, 2),
      'utf-8'
    );
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    options[key] = value;
  }

  // Load from JSON file if provided
  let submission;
  if (options.json) {
    const jsonPath = path.resolve(options.json);
    submission = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } else {
    // Build submission from CLI args
    submission = {
      brandName: options.brand || options.name,
      brandSlug: options.slug,
      brandTagline: options.tagline,
      xHandle: options['x-handle'] || options.twitter,
      contactEmail: options.email,
      brandDescription: options.description,
      brandMission: options.mission
    };
  }

  // Generate
  const generator = new BrandPageGenerator();

  generator.generate(submission)
    .then(result => {
      console.log('\n✅ Brand page generated successfully!\n');
      console.log(`📁 Brand Directory: ${result.brandDir}`);
      console.log(`🌐 Public URL: ${result.url}\n`);
      console.log('📄 Generated Files:');
      for (const [name, filepath] of Object.entries(result.files)) {
        console.log(`   - ${name}: ${filepath}`);
      }
      console.log('\n🚀 Next steps:');
      console.log('   1. Commit changes: git add brands/ data/brand-registry.json');
      console.log('   2. Push to GitHub: git push origin main');
      console.log(`   3. View live: ${result.url}`);
    })
    .catch(err => {
      console.error('\n❌ Generation failed:', err.message);
      console.error('\nUsage:');
      console.error('  node bin/generate-brand-page.js --brand "MyBrand" --slug "mybrand" --x-handle "@mybrand" --email "contact@mybrand.com"');
      console.error('  node bin/generate-brand-page.js --json submission.json');
      process.exit(1);
    });
}

module.exports = BrandPageGenerator;
