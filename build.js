#!/usr/bin/env node
/**
 * Soulfra Build Script
 *
 * Simple compiler that:
 * - Validates all HTML files
 * - Inlines components automatically
 * - Checks for broken links
 * - Outputs clean, deployable files
 *
 * Usage:
 *   node build.js              # Build all files
 *   node build.js --validate   # Just validate, don't build
 *   node build.js --minify     # Build and minify
 */

const fs = require('fs');
const path = require('path');

class SoulfraBuild {
  constructor(options = {}) {
    this.options = {
      validate: options.validate || false,
      minify: options.minify || false,
      verbose: options.verbose || true
    };

    this.stats = {
      filesProcessed: 0,
      filesFixed: 0,
      componentsInlined: 0,
      errors: []
    };

    this.components = this.loadComponents();
  }

  /**
   * Load all component files
   */
  loadComponents() {
    const componentsDir = path.join(__dirname, 'components');
    const components = {};

    if (!fs.existsSync(componentsDir)) {
      console.warn('⚠️  Components directory not found');
      return components;
    }

    const files = ['Header.html', 'Footer.html', 'Breadcrumb.html'];

    for (const file of files) {
      const filePath = path.join(componentsDir, file);
      if (fs.existsSync(filePath)) {
        const name = file.replace('.html', '').toLowerCase();
        components[name] = fs.readFileSync(filePath, 'utf-8');
      }
    }

    return components;
  }

  /**
   * Build all HTML files
   */
  async build() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║          🏗️  Soulfra Build Script                         ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (this.options.validate) {
      console.log('🔍 Validation mode - no files will be modified\n');
    }

    // Find all HTML files
    const htmlFiles = this.findHTMLFiles();
    console.log(`📄 Found ${htmlFiles.length} HTML files\n`);

    // Process each file
    for (const file of htmlFiles) {
      await this.processFile(file);
    }

    // Print summary
    this.printSummary();

    return this.stats.errors.length === 0;
  }

  /**
   * Find all HTML files in the repo
   */
  findHTMLFiles() {
    const files = [];
    const exclude = [
      'node_modules',
      '.git',
      'archive',
      'analysis',
      'agents'
    ];

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip excluded directories
          if (exclude.includes(entry.name)) continue;
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    };

    walk(__dirname);
    return files;
  }

  /**
   * Process a single HTML file
   */
  async processFile(filePath) {
    const relativePath = path.relative(__dirname, filePath);

    if (this.options.verbose) {
      console.log(`📝 Processing: ${relativePath}`);
    }

    this.stats.filesProcessed++;

    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let issues = [];

    // 1. Check for component loader script
    if (content.includes('component-loader.js')) {
      issues.push('Uses component-loader.js (should inline components)');

      if (!this.options.validate) {
        // Remove component-loader script
        content = content.replace(
          /<script src="[^"]*component-loader\.js"><\/script>\s*/g,
          ''
        );
        modified = true;
      }
    }

    // 2. Check for component placeholders
    const componentPattern = /<div data-component="(header|footer|breadcrumb)"><\/div>/g;
    const matches = content.match(componentPattern);

    if (matches) {
      issues.push(`${matches.length} component placeholder(s) found`);

      if (!this.options.validate) {
        // Inline components
        content = content.replace(
          /<div data-component="header"><\/div>/g,
          this.components.header || '<!-- Header component not found -->'
        );

        content = content.replace(
          /<div data-component="footer"><\/div>/g,
          this.components.footer || '<!-- Footer component not found -->'
        );

        content = content.replace(
          /<div data-component="breadcrumb"><\/div>/g,
          this.components.breadcrumb || '<!-- Breadcrumb component not found -->'
        );

        this.stats.componentsInlined += matches.length;
        modified = true;
      }
    }

    // 3. Check for expired image URLs
    if (content.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      issues.push('Contains expired DALL-E image URLs');
    }

    // 4. Check for missing local files
    const localLinkPattern = /(href|src)="\/([^"]+)"/g;
    let match;
    while ((match = localLinkPattern.exec(content)) !== null) {
      const linkPath = match[2];

      // Skip external URLs and special paths
      if (linkPath.startsWith('http') || linkPath.startsWith('#')) continue;
      if (linkPath.startsWith('api/')) continue; // API endpoints

      const fullPath = path.join(__dirname, linkPath);
      if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath + '.html')) {
        issues.push(`Broken link: /${linkPath}`);
      }
    }

    // 5. Minify if requested
    if (this.options.minify && !this.options.validate) {
      content = this.minifyHTML(content);
      modified = true;
    }

    // Write back if modified
    if (modified && !this.options.validate) {
      fs.writeFileSync(filePath, content, 'utf-8');
      this.stats.filesFixed++;
      console.log(`   ✅ Fixed and saved`);
    }

    // Report issues
    if (issues.length > 0) {
      console.log(`   ⚠️  Issues found:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else if (this.options.verbose) {
      console.log(`   ✅ No issues`);
    }

    console.log('');
  }

  /**
   * Simple HTML minification
   */
  minifyHTML(html) {
    return html
      // Remove comments (except IE conditionals)
      .replace(/<!--(?!\[if).*?-->/gs, '')
      // Remove extra whitespace between tags
      .replace(/>\s+</g, '><')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Print build summary
   */
  printSummary() {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 Build Summary:\n');
    console.log(`   Files processed:      ${this.stats.filesProcessed}`);
    console.log(`   Files modified:       ${this.stats.filesFixed}`);
    console.log(`   Components inlined:   ${this.stats.componentsInlined}`);
    console.log(`   Errors:               ${this.stats.errors.length}`);
    console.log('');

    if (this.stats.errors.length > 0) {
      console.log('❌ Errors encountered:\n');
      this.stats.errors.forEach(err => console.log(`   - ${err}`));
      console.log('');
    }

    if (this.stats.filesFixed > 0) {
      console.log('✅ Build complete! Files are ready to deploy.\n');
    } else if (this.options.validate) {
      console.log('✅ Validation complete!\n');
    } else {
      console.log('✅ All files are already clean!\n');
    }
  }
}

// CLI Mode
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    validate: args.includes('--validate'),
    minify: args.includes('--minify'),
    verbose: !args.includes('--quiet')
  };

  const builder = new SoulfraBuild(options);
  builder.build().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
}

module.exports = SoulfraBuild;
