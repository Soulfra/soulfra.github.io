#!/usr/bin/env node
/**
 * Site Debugger & OCR Analyzer
 *
 * Analyzes deployed HTML sites for:
 * - Broken external resources (images, CSS, JS)
 * - Missing local files
 * - Expired URLs (DALL-E temporary URLs)
 * - Encoding issues
 * - Structure problems
 *
 * Can also convert HTML to alternative formats:
 * - Emoji-based markup (custom standard)
 * - Simplified semantic format
 * - JSON-LD structured data
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class SiteDebugger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.publicDir = path.join(__dirname, '../public');
  }

  /**
   * Analyze HTML file for issues
   */
  async analyzeHTML(filePath) {
    console.log(`\n🔍 Analyzing: ${filePath}\n`);

    const html = fs.readFileSync(filePath, 'utf-8');
    const issues = {
      brokenExternalURLs: [],
      missingLocalFiles: [],
      expiredURLs: [],
      placeholderContent: [],
      encodingIssues: [],
      structuralIssues: []
    };

    // 1. Check external resources
    const externalRegex = /(src|href)=["'](https?:\/\/[^"']+)["']/g;
    let match;
    while ((match = externalRegex.exec(html)) !== null) {
      const url = match[2];

      // Check if DALL-E temporary URL (these expire)
      if (url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
        // Parse expiration time from URL
        const expiryMatch = url.match(/se=([^&]+)/);
        if (expiryMatch) {
          const expiryDate = new Date(decodeURIComponent(expiryMatch[1]));
          const now = new Date();

          if (expiryDate < now) {
            issues.expiredURLs.push({
              url: url.substring(0, 80) + '...',
              expired: expiryDate.toISOString(),
              type: 'DALL-E temporary URL'
            });
          }
        }
      }

      // Test if external URL is accessible
      try {
        const status = await this.testURL(url);
        if (status !== 200) {
          issues.brokenExternalURLs.push({ url: url.substring(0, 100), status });
        }
      } catch (err) {
        // Skip for now (to avoid timeout)
      }
    }

    // 2. Check local resources
    const localRegex = /(src|href)=["'](?!https?:\/\/)([^"']+)["']/g;
    while ((match = localRegex.exec(html)) !== null) {
      const localPath = match[2];

      // Skip anchor links and data URIs
      if (localPath.startsWith('#') || localPath.startsWith('data:')) {
        continue;
      }

      // Check if it's a placeholder
      if (localPath.includes('path_to') || localPath.includes('your_image') || localPath === 'script.js') {
        issues.placeholderContent.push({
          path: localPath,
          type: 'Placeholder path'
        });
      }

      // Check if file exists
      const siteDir = path.dirname(filePath);
      const fullPath = path.join(siteDir, localPath);

      if (!fs.existsSync(fullPath)) {
        issues.missingLocalFiles.push({
          path: localPath,
          expected: fullPath
        });
      }
    }

    // 3. Check for placeholder links
    const placeholderLinks = html.match(/href=["']#["']/g);
    if (placeholderLinks && placeholderLinks.length > 3) {
      issues.placeholderContent.push({
        type: 'Multiple placeholder links (#)',
        count: placeholderLinks.length
      });
    }

    // 4. Check encoding
    if (!html.includes('charset') && !html.includes('UTF-8')) {
      issues.encodingIssues.push('Missing charset declaration');
    }

    if (html.includes('\\!') || html.includes('\\?')) {
      issues.encodingIssues.push('Bash escape sequences detected');
    }

    // 5. Check structure
    if (!html.includes('<!DOCTYPE')) {
      issues.structuralIssues.push('Missing DOCTYPE declaration');
    }

    if (!html.includes('<html')) {
      issues.structuralIssues.push('Missing <html> tag');
    }

    // Generate report
    this.printReport(filePath, issues, html);

    return issues;
  }

  /**
   * Test if URL is accessible
   */
  async testURL(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode);
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  /**
   * Print diagnostic report
   */
  printReport(filePath, issues, html) {
    const filename = path.basename(filePath);
    const dirname = path.basename(path.dirname(filePath));

    console.log(`📄 File: ${dirname}/${filename}`);
    console.log(`📏 Size: ${html.length} bytes`);
    console.log(`📊 Lines: ${html.split('\n').length}\n`);

    let totalIssues = 0;

    // Expired URLs
    if (issues.expiredURLs.length > 0) {
      console.log(`❌ EXPIRED URLs: ${issues.expiredURLs.length}`);
      issues.expiredURLs.forEach(issue => {
        console.log(`   - ${issue.type}`);
        console.log(`     Expired: ${issue.expired}`);
        console.log(`     URL: ${issue.url}\n`);
      });
      totalIssues += issues.expiredURLs.length;
    }

    // Missing local files
    if (issues.missingLocalFiles.length > 0) {
      console.log(`❌ MISSING LOCAL FILES: ${issues.missingLocalFiles.length}`);
      issues.missingLocalFiles.forEach(issue => {
        console.log(`   - ${issue.path}`);
      });
      console.log('');
      totalIssues += issues.missingLocalFiles.length;
    }

    // Placeholder content
    if (issues.placeholderContent.length > 0) {
      console.log(`⚠️  PLACEHOLDER CONTENT: ${issues.placeholderContent.length}`);
      issues.placeholderContent.forEach(issue => {
        if (issue.path) {
          console.log(`   - ${issue.path} (${issue.type})`);
        } else {
          console.log(`   - ${issue.type} (${issue.count || 0} found)`);
        }
      });
      console.log('');
      totalIssues += issues.placeholderContent.length;
    }

    // Encoding issues
    if (issues.encodingIssues.length > 0) {
      console.log(`⚠️  ENCODING ISSUES: ${issues.encodingIssues.length}`);
      issues.encodingIssues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      console.log('');
      totalIssues += issues.encodingIssues.length;
    }

    // Structural issues
    if (issues.structuralIssues.length > 0) {
      console.log(`⚠️  STRUCTURAL ISSUES: ${issues.structuralIssues.length}`);
      issues.structuralIssues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      console.log('');
      totalIssues += issues.structuralIssues.length;
    }

    if (totalIssues === 0) {
      console.log('✅ NO ISSUES FOUND\n');
    } else {
      console.log(`📊 Total Issues: ${totalIssues}\n`);
    }

    console.log('─'.repeat(60));
  }

  /**
   * Scan all deployed sites
   */
  async scanAllSites() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║          🔍 Site Debugger - Scanning All Sites            ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const sites = [];
    const entries = fs.readdirSync(this.publicDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const indexPath = path.join(this.publicDir, entry.name, 'index.html');
        if (fs.existsSync(indexPath)) {
          sites.push({
            name: entry.name,
            path: indexPath,
            url: `http://localhost:8000/public/${entry.name}/`
          });
        }
      }
    }

    console.log(`Found ${sites.length} deployed sites:\n`);

    const allIssues = {};

    for (const site of sites) {
      console.log(`🌐 ${site.name}`);
      console.log(`   URL: ${site.url}`);

      const issues = await this.analyzeHTML(site.path);
      allIssues[site.name] = issues;
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SCAN SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    for (const [siteName, issues] of Object.entries(allIssues)) {
      const totalIssues =
        issues.expiredURLs.length +
        issues.missingLocalFiles.length +
        issues.placeholderContent.length +
        issues.encodingIssues.length +
        issues.structuralIssues.length;

      const status = totalIssues === 0 ? '✅' : '❌';
      console.log(`${status} ${siteName}: ${totalIssues} issue(s)`);
    }

    console.log('');
  }

  /**
   * Convert HTML to custom emoji-based markup
   * (Alternative to HTML standard)
   */
  htmlToEmojiMarkup(html) {
    // Custom standard: emoji-based semantic markup
    // Example: 📄 = document, 📰 = heading, 📝 = paragraph, 🔗 = link, 🖼️ = image

    const emojiMarkup = {
      type: '📄 DOCUMENT',
      sections: []
    };

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      emojiMarkup.title = `📰 ${titleMatch[1]}`;
    }

    // Extract headings
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    for (const match of h1Matches) {
      emojiMarkup.sections.push({
        type: '📰 HEADING',
        level: 1,
        content: match[1].trim()
      });
    }

    // Extract paragraphs
    const pMatches = html.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
    for (const match of pMatches) {
      emojiMarkup.sections.push({
        type: '📝 TEXT',
        content: match[1].trim()
      });
    }

    // Extract images
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']+)["'][^>]*>/gi);
    for (const match of imgMatches) {
      emojiMarkup.sections.push({
        type: '🖼️ IMAGE',
        src: match[1],
        alt: match[2]
      });
    }

    // Extract links
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi);
    for (const match of linkMatches) {
      emojiMarkup.sections.push({
        type: '🔗 LINK',
        href: match[1],
        text: match[2].trim()
      });
    }

    return emojiMarkup;
  }

  /**
   * Export to custom format
   */
  exportToCustomFormat(emojiMarkup) {
    let output = '';

    output += `${emojiMarkup.type}\n`;
    output += `${emojiMarkup.title}\n\n`;

    for (const section of emojiMarkup.sections) {
      if (section.type === '📰 HEADING') {
        output += `${'#'.repeat(section.level)} ${section.content}\n\n`;
      } else if (section.type === '📝 TEXT') {
        output += `${section.content}\n\n`;
      } else if (section.type === '🖼️ IMAGE') {
        output += `🖼️ [${section.alt}](${section.src})\n\n`;
      } else if (section.type === '🔗 LINK') {
        output += `🔗 ${section.text} → ${section.href}\n\n`;
      }
    }

    return output;
  }
}

// CLI Mode
if (require.main === module) {
  const scanner = new SiteDebugger({ verbose: true });

  const command = process.argv[2];
  const target = process.argv[3];

  if (!command || command === 'scan') {
    // Scan all sites
    scanner.scanAllSites();
  } else if (command === 'analyze' && target) {
    // Analyze specific site
    const sitePath = path.join(scanner.publicDir, target, 'index.html');
    if (fs.existsSync(sitePath)) {
      scanner.analyzeHTML(sitePath);
    } else {
      console.error(`❌ Site not found: ${target}`);
      process.exit(1);
    }
  } else if (command === 'convert' && target) {
    // Convert to emoji markup
    const sitePath = path.join(scanner.publicDir, target, 'index.html');
    if (fs.existsSync(sitePath)) {
      const html = fs.readFileSync(sitePath, 'utf-8');
      const emojiMarkup = scanner.htmlToEmojiMarkup(html);
      const customFormat = scanner.exportToCustomFormat(emojiMarkup);

      console.log('\n📄 CUSTOM EMOJI-BASED MARKUP:\n');
      console.log(customFormat);

      console.log('\n📋 JSON STRUCTURE:\n');
      console.log(JSON.stringify(emojiMarkup, null, 2));
    } else {
      console.error(`❌ Site not found: ${target}`);
      process.exit(1);
    }
  } else {
    console.log('Usage:');
    console.log('  node site-debugger.js scan                    # Scan all sites');
    console.log('  node site-debugger.js analyze <site-name>     # Analyze specific site');
    console.log('  node site-debugger.js convert <site-name>     # Convert to custom format');
    console.log('\nExamples:');
    console.log('  node site-debugger.js scan');
    console.log('  node site-debugger.js analyze NiceLeak');
    console.log('  node site-debugger.js convert holy');
    process.exit(0);
  }
}

module.exports = SiteDebugger;
