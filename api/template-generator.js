#!/usr/bin/env node
/**
 * Template Generator
 *
 * Generates professional HTML pages matching the quality of existing sites.
 * Supports: landing pages, blog posts, blog indexes, pitch decks
 *
 * Features:
 * - Domain-aware branding
 * - Responsive CSS
 * - Markdown to HTML conversion
 * - Consistent header/nav/footer
 * - SEO-friendly meta tags
 */

const DomainContext = require('./llm/domain-context.js');

class TemplateGenerator {
  constructor() {
    this.domainContext = new DomainContext();

    // Domain brand colors (from existing sites)
    this.brandColors = {
      soulfra: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c'
      },
      calriven: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#61dafb'
      },
      deathtodata: {
        primary: '#2c3e50',
        secondary: '#e74c3c',
        accent: '#f39c12'
      },
      cringeproof: {
        primary: '#8e44ad',
        secondary: '#3498db',
        accent: '#e67e22'
      }
    };
  }

  /**
   * Convert markdown to HTML (simple implementation)
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Lists (unordered) - convert markdown bullets to <li>
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');

    // Lists (ordered) - convert numbered lists to <li>
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

    // Wrap consecutive <li> elements in <ul> tags
    html = html.replace(/(<li>.*?<\/li>(?:\n<li>.*?<\/li>)*)/gm, '<ul>$1</ul>');

    // Paragraphs (lines separated by blank lines)
    html = html.split('\n\n').map(para => {
      para = para.trim();
      if (!para) return '';
      if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<li')) {
        return para;
      }
      return `<p>${para.replace(/\n/g, ' ')}</p>`;
    }).join('\n');

    return html;
  }

  /**
   * Get colors for a domain
   */
  getColors(domain) {
    return this.brandColors[domain] || this.brandColors.soulfra;
  }

  /**
   * Generate common CSS
   */
  getCommonCSS(colors) {
    return `
        :root {
            --primary: ${colors.primary};
            --secondary: ${colors.secondary};
            --accent: ${colors.accent};
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f9f9f9;
        }

        header {
            background: var(--primary);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        nav {
            background: var(--secondary);
            padding: 1rem;
            text-align: center;
        }

        nav a {
            color: white;
            text-decoration: none;
            margin: 0 1rem;
            font-weight: 500;
        }

        nav a:hover {
            text-decoration: underline;
        }

        main {
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
        }

        .content-block, article {
            background: white;
            padding: 2rem;
            margin-bottom: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .content-block h2, article h2 {
            color: var(--primary);
            margin-bottom: 1rem;
        }

        .content-block h3, article h3 {
            color: var(--secondary);
            margin-top: 1.5rem;
            margin-bottom: 0.8rem;
        }

        .content-block p, article p {
            margin-bottom: 1rem;
        }

        .content-block ul, article ul {
            margin-left: 2rem;
            margin-bottom: 1rem;
        }

        .content-block li, article li {
            margin-bottom: 0.5rem;
        }

        .meta {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #eee;
        }

        .cta {
            background: var(--primary);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
            font-weight: 600;
        }

        .cta:hover {
            background: var(--secondary);
        }

        footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 2rem;
            margin-top: 4rem;
        }

        @media (max-width: 768px) {
            header h1 {
                font-size: 2rem;
            }
            main {
                padding: 0 0.5rem;
            }
        }
    `;
  }

  /**
   * Generate header HTML
   * @param {string} pathPrefix - Path prefix for navigation links (e.g., '../' for subdirectories)
   */
  getHeader(domain, pathPrefix = '') {
    const ctx = this.domainContext.getContext(domain);
    return `
    <header>
        <h1>${ctx.name}</h1>
        <p>${ctx.tagline}</p>
    </header>

    <nav>
        <a href="${pathPrefix}index.html">Home</a>
        <a href="${pathPrefix}blog/">Blog</a>
        <a href="${pathPrefix}pitch-deck.html">Pitch Deck</a>
        <a href="${pathPrefix}business-plan.html">Business Plan</a>
    </nav>
    `;
  }

  /**
   * Generate footer HTML
   */
  getFooter(domain) {
    const ctx = this.domainContext.getContext(domain);
    const year = new Date().getFullYear();
    return `
    <footer>
        <p>&copy; ${year} ${ctx.name}. ${ctx.tagline}</p>
        <p><small>Generated with local AI - No API costs, fully self-sovereign</small></p>
    </footer>
    `;
  }

  /**
   * Generate landing page HTML
   */
  generateLandingPage(domain, content) {
    const ctx = this.domainContext.getContext(domain);
    const colors = this.getColors(domain);
    const htmlContent = this.markdownToHtml(content);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ctx.name} - ${ctx.tagline}</title>
    <meta name="description" content="${ctx.mission.substring(0, 155)}">
    <style>${this.getCommonCSS(colors)}</style>
</head>
<body>
${this.getHeader(domain)}

    <main>
        <div class="content-block">
            ${htmlContent}
            <a href="blog/" class="cta">Read Our Blog</a>
            <a href="pitch-deck.html" class="cta">View Pitch Deck</a>
        </div>
    </main>

${this.getFooter(domain)}
</body>
</html>`;
  }

  /**
   * Generate blog post HTML
   */
  generateBlogPost(domain, title, content, date = new Date()) {
    const ctx = this.domainContext.getContext(domain);
    const colors = this.getColors(domain);
    const htmlContent = this.markdownToHtml(content);
    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${ctx.name}</title>
    <meta name="description" content="${ctx.tagline}">
    <style>${this.getCommonCSS(colors)}</style>
</head>
<body>
${this.getHeader(domain, '../')}

    <main>
        <article>
            <h2>${title}</h2>
            <div class="meta">
                <time datetime="${date.toISOString()}">${dateStr}</time>
                 | ${ctx.name}
            </div>
            ${htmlContent}
        </article>

        <div class="content-block">
            <p><a href="../index.html">&larr; Back to ${ctx.name} Home</a></p>
            <p><a href="index.html">&larr; Back to Blog</a></p>
        </div>
    </main>

${this.getFooter(domain)}
</body>
</html>`;
  }

  /**
   * Generate blog index page
   */
  generateBlogIndex(domain, posts) {
    const ctx = this.domainContext.getContext(domain);
    const colors = this.getColors(domain);

    const postsList = posts.map(post => `
        <div class="content-block">
            <h3><a href="${post.slug}.html">${post.title}</a></h3>
            <div class="meta">${post.date}</div>
            <p>${post.excerpt || 'Read more...'}</p>
        </div>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - ${ctx.name}</title>
    <meta name="description" content="Blog posts from ${ctx.name}">
    <style>${this.getCommonCSS(colors)}
        .content-block h3 a {
            color: var(--primary);
            text-decoration: none;
        }
        .content-block h3 a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
${this.getHeader(domain, '../')}

    <main>
        <h2 style="color: ${colors.primary}; margin-bottom: 2rem;">Blog Posts</h2>
        ${postsList}
    </main>

${this.getFooter(domain)}
</body>
</html>`;
  }

  /**
   * Generate pitch deck HTML
   */
  generatePitchDeck(domain, content) {
    const ctx = this.domainContext.getContext(domain);
    const colors = this.getColors(domain);
    const htmlContent = this.markdownToHtml(content);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pitch Deck - ${ctx.name}</title>
    <meta name="description" content="${ctx.name} investor pitch deck">
    <style>${this.getCommonCSS(colors)}
        .slide {
            background: white;
            padding: 3rem;
            margin-bottom: 3rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            min-height: 400px;
        }
        .slide h2 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
            color: var(--primary);
        }
    </style>
</head>
<body>
${this.getHeader(domain)}

    <main>
        <div class="slide">
            ${htmlContent}
        </div>
        <div class="content-block">
            <p><a href="index.html">&larr; Back to Home</a></p>
            <p><a href="business-plan.html">View Full Business Plan &rarr;</a></p>
        </div>
    </main>

${this.getFooter(domain)}
</body>
</html>`;
  }

  /**
   * Generate business plan HTML
   */
  generateBusinessPlan(domain, content) {
    const ctx = this.domainContext.getContext(domain);
    const colors = this.getColors(domain);
    const htmlContent = this.markdownToHtml(content);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Plan - ${ctx.name}</title>
    <meta name="description" content="${ctx.name} business plan and strategy">
    <style>${this.getCommonCSS(colors)}</style>
</head>
<body>
${this.getHeader(domain)}

    <main>
        <article>
            <h2>Business Plan</h2>
            ${htmlContent}
        </article>
        <div class="content-block">
            <p><a href="index.html">&larr; Back to Home</a></p>
            <p><a href="pitch-deck.html">View Pitch Deck &rarr;</a></p>
        </div>
    </main>

${this.getFooter(domain)}
</body>
</html>`;
  }
}

module.exports = TemplateGenerator;
