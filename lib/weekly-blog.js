/**
 * Weekly Blog Generator
 *
 * Generates blog posts from weekly email check-ins:
 * - Pulls wins, code, ideas from email folders
 * - Formats as markdown blog post
 * - Shows progress/journey
 * - Makes accountability visible
 *
 * Helps build portfolio and get paid by showing work publicly
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class WeeklyBlog {
  constructor(emailFiler, sheetsAuth) {
    this.filer = emailFiler;
    this.sheets = sheetsAuth;
    this.sheetName = 'blog_posts';

    console.log('[WeeklyBlog] Initialized');
  }

  /**
   * Generate blog post from last 7 days of emails
   */
  async generatePost(userId, options = {}) {
    try {
      const {
        days = 7,
        title = '',
        includeCode = true,
        includeIdeas = false,
        autoPublish = false
      } = options;

      // Get activity from folders
      const activity = await this.filer.getRecentActivity(userId, days);

      // Extract data
      const wins = activity.find(a => a.category === 'wins')?.items || [];
      const code = activity.find(a => a.category === 'code')?.items || [];
      const ideas = activity.find(a => a.category === 'ideas')?.items || [];
      const todos = activity.find(a => a.category === 'todos')?.items || [];

      // Generate title if not provided
      const postTitle = title || this._generateTitle(wins, code);

      // Generate markdown
      const markdown = this._generateMarkdown({
        title: postTitle,
        wins,
        code: includeCode ? code : [],
        ideas: includeIdeas ? ideas : [],
        todos,
        days
      });

      // Save draft
      const post = {
        userId,
        title: postTitle,
        body: markdown,
        createdAt: Date.now(),
        published: autoPublish,
        publishedAt: autoPublish ? Date.now() : null,
        weekStart: Date.now() - (days * 24 * 60 * 60 * 1000),
        weekEnd: Date.now()
      };

      await this._savePost(post);

      console.log('[WeeklyBlog] Generated post:', postTitle);

      return {
        success: true,
        post
      };

    } catch (error) {
      console.error('[WeeklyBlog] Generate post error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate markdown content
   * @private
   */
  _generateMarkdown(data) {
    const { title, wins, code, ideas, todos, days } = data;

    const date = new Date();
    const weekNum = this._getWeekNumber(date);

    let md = `# ${title}\n\n`;
    md += `**Week ${weekNum}, ${date.getFullYear()}** • ${days}-day build sprint\n\n`;
    md += `---\n\n`;

    // Wins section
    if (wins.length > 0) {
      md += `## 🎯 What I Shipped\n\n`;

      wins.forEach((win, idx) => {
        const cleanBody = this._cleanText(win.body);
        md += `**${idx + 1}. ${this._extractFirstLine(cleanBody)}**\n\n`;
        md += `${cleanBody}\n\n`;
      });

      md += `---\n\n`;
    }

    // Code section
    if (code.length > 0) {
      md += `## 💻 Technical Highlights\n\n`;

      code.slice(0, 3).forEach((item, idx) => {
        const cleanBody = this._cleanText(item.body);
        md += `**${idx + 1}. ${item.subject || 'Code Update'}**\n\n`;

        // Extract code blocks
        const codeBlocks = this._extractCodeBlocks(item.body);

        if (codeBlocks.length > 0) {
          codeBlocks.forEach(block => {
            md += `\`\`\`${block.lang}\n${block.code}\n\`\`\`\n\n`;
          });
        } else {
          md += `${cleanBody}\n\n`;
        }
      });

      md += `---\n\n`;
    }

    // Ideas section (optional)
    if (ideas.length > 0) {
      md += `## 💡 What I'm Thinking About\n\n`;

      ideas.slice(0, 3).forEach((idea, idx) => {
        const cleanBody = this._cleanText(idea.body);
        md += `- ${this._extractFirstLine(cleanBody)}\n`;
      });

      md += `\n---\n\n`;
    }

    // Stats
    md += `## 📊 Week Stats\n\n`;
    md += `- **Shipped:** ${wins.length} wins\n`;
    md += `- **Code Updates:** ${code.length} commits/reviews\n`;
    md += `- **Ideas Generated:** ${ideas.length}\n`;
    md += `- **TODOs Created:** ${todos.length}\n`;
    md += `\n`;

    // Footer
    md += `---\n\n`;
    md += `*Built with daily accountability emails • [See my other work](https://soulfra.github.io)*\n\n`;
    md += `*Want to build like this? Email: matt@soulfra.com*\n`;

    return md;
  }

  /**
   * Generate title from wins/code
   * @private
   */
  _generateTitle(wins, code) {
    const date = new Date();
    const weekNum = this._getWeekNumber(date);

    if (wins.length > 0) {
      const firstWin = this._extractFirstLine(wins[0].body);
      const words = firstWin.split(' ').slice(0, 6).join(' ');
      return `Week ${weekNum}: ${words}...`;
    }

    if (code.length > 0) {
      return `Week ${weekNum}: ${code.length} Code Updates`;
    }

    return `Week ${weekNum}: Build Progress`;
  }

  /**
   * Extract first line from text
   * @private
   */
  _extractFirstLine(text) {
    const lines = text.trim().split('\n');
    return lines[0].substring(0, 80);
  }

  /**
   * Clean text (remove extra whitespace, quotes)
   * @private
   */
  _cleanText(text) {
    return text
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Extract code blocks from text
   * @private
   */
  _extractCodeBlocks(text) {
    const blocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        lang: match[1] || 'javascript',
        code: match[2].trim()
      });
    }

    return blocks;
  }

  /**
   * Get ISO week number
   * @private
   */
  _getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Get all posts for user
   */
  async getPosts(userId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:H?key=${this.sheets.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      const posts = rows
        .slice(1)
        .filter(r => r[0] === userId)
        .map(r => ({
          userId: r[0],
          title: r[1],
          body: r[2],
          createdAt: parseInt(r[3]),
          published: r[4] === 'true',
          publishedAt: r[5] ? parseInt(r[5]) : null,
          weekStart: parseInt(r[6]),
          weekEnd: parseInt(r[7])
        }));

      // Sort by created date (newest first)
      posts.sort((a, b) => b.createdAt - a.createdAt);

      return posts;

    } catch (error) {
      console.error('[WeeklyBlog] Get posts error:', error);
      return [];
    }
  }

  /**
   * Publish post
   */
  async publishPost(userId, postId) {
    try {
      const posts = await this.getPosts(userId);
      const post = posts.find(p => p.createdAt === postId);

      if (!post) {
        return { success: false, reason: 'not_found' };
      }

      // Update published status
      post.published = true;
      post.publishedAt = Date.now();

      await this._updatePost(userId, post);

      console.log('[WeeklyBlog] Published post:', post.title);

      return { success: true, post };

    } catch (error) {
      console.error('[WeeklyBlog] Publish post error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export post as HTML file
   */
  exportAsHTML(post) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 2.5rem; margin-bottom: 10px; }
    h2 { margin-top: 40px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    hr { border: none; border-top: 1px solid #eee; margin: 40px 0; }
    a { color: #667eea; }
  </style>
</head>
<body>
${this._markdownToHTML(post.body)}
</body>
</html>`;

    return html;
  }

  /**
   * Simple markdown to HTML converter
   * @private
   */
  _markdownToHTML(md) {
    return md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^\n/gim, '<br>')
      .replace(/---/g, '<hr>');
  }

  /**
   * Save post to Sheets
   * @private
   */
  async _savePost(post) {
    const row = [
      post.userId,
      post.title,
      post.body,
      post.createdAt,
      post.published.toString(),
      post.publishedAt || '',
      post.weekStart,
      post.weekEnd
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:H:append?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Update post in Sheets
   * @private
   */
  async _updatePost(userId, post) {
    // Find row
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:H?key=${this.sheets.apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values || [];

    const rowIndex = rows.findIndex((r, idx) => {
      return idx > 0 && r[0] === userId && parseInt(r[3]) === post.createdAt;
    });

    if (rowIndex === -1) {
      throw new Error('Post not found');
    }

    const row = [
      post.userId,
      post.title,
      post.body,
      post.createdAt,
      post.published.toString(),
      post.publishedAt || '',
      post.weekStart,
      post.weekEnd
    ];

    const rowNum = rowIndex + 1;
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A${rowNum}:H${rowNum}?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Initialize blog posts table
   */
  async initTable() {
    try {
      const headers = ['userId', 'title', 'body', 'createdAt', 'published', 'publishedAt', 'weekStart', 'weekEnd'];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A1:H1?key=${this.sheets.apiKey}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.values && data.values.length > 0) {
          console.log('[WeeklyBlog] Table already exists');
          return { success: true, exists: true };
        }
      }

      // Create header
      const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A1:H1?valueInputOption=RAW&key=${this.sheets.apiKey}`;

      await fetch(createUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [headers] })
      });

      console.log('[WeeklyBlog] Table initialized');

      return { success: true, exists: false };

    } catch (error) {
      console.error('[WeeklyBlog] Init table error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.WeeklyBlog = WeeklyBlog;
}

console.log('[WeeklyBlog] Module loaded');
