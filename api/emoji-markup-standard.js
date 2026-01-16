#!/usr/bin/env node
/**
 * Emoji Markup Standard (EMS)
 *
 * A custom markup language using emojis as semantic tags
 * Alternative to HTML for simpler, more visual content authoring
 *
 * EMOJI SPEC:
 * 📄 = Document root
 * 📰 = Heading (level determined by context)
 * 📝 = Paragraph/Text block
 * 🖼️ = Image
 * 🔗 = Link/Hyperlink
 * 🎨 = Style/CSS block
 * 📊 = Data/Table
 * 🎬 = Video/Media
 * 🔤 = Code block
 * 💭 = Comment
 * 📦 = Container/Section
 * 🏷️ = Metadata/Tags
 *
 * PHILOSOPHY:
 * - Visual: Emojis are self-documenting
 * - Simple: Less syntax noise than HTML
 * - Semantic: Meaning is clear from emoji
 * - Portable: JSON-based, easy to parse/generate
 * - Convertible: Full bidirectional HTML conversion
 *
 * Usage:
 *   const EMS = require('./emoji-markup-standard');
 *   const ems = new EMS();
 *
 *   // HTML → EMS
 *   const emojiDoc = ems.fromHTML(htmlString);
 *
 *   // EMS → HTML
 *   const html = ems.toHTML(emojiDoc);
 *
 *   // EMS → Plain text format
 *   const text = ems.toText(emojiDoc);
 */

const fs = require('fs');
const path = require('path');

class EmojiMarkupStandard {
  constructor(options = {}) {
    this.verbose = options.verbose || false;

    // Emoji symbol mapping
    this.SYMBOLS = {
      DOCUMENT: '📄',
      HEADING: '📰',
      TEXT: '📝',
      IMAGE: '🖼️',
      LINK: '🔗',
      STYLE: '🎨',
      DATA: '📊',
      VIDEO: '🎬',
      CODE: '🔤',
      COMMENT: '💭',
      CONTAINER: '📦',
      METADATA: '🏷️'
    };

    // HTML tag mapping
    this.TAG_MAP = {
      h1: { emoji: this.SYMBOLS.HEADING, level: 1 },
      h2: { emoji: this.SYMBOLS.HEADING, level: 2 },
      h3: { emoji: this.SYMBOLS.HEADING, level: 3 },
      h4: { emoji: this.SYMBOLS.HEADING, level: 4 },
      h5: { emoji: this.SYMBOLS.HEADING, level: 5 },
      h6: { emoji: this.SYMBOLS.HEADING, level: 6 },
      p: { emoji: this.SYMBOLS.TEXT },
      img: { emoji: this.SYMBOLS.IMAGE },
      a: { emoji: this.SYMBOLS.LINK },
      style: { emoji: this.SYMBOLS.STYLE },
      table: { emoji: this.SYMBOLS.DATA },
      video: { emoji: this.SYMBOLS.VIDEO },
      code: { emoji: this.SYMBOLS.CODE },
      pre: { emoji: this.SYMBOLS.CODE },
      div: { emoji: this.SYMBOLS.CONTAINER },
      section: { emoji: this.SYMBOLS.CONTAINER },
      meta: { emoji: this.SYMBOLS.METADATA }
    };

    console.log('📄 EmojiMarkupStandard initialized');
  }

  /**
   * Convert HTML to EMS Document
   */
  fromHTML(html) {
    const doc = {
      format: 'EMS/1.0',
      type: this.SYMBOLS.DOCUMENT,
      sections: []
    };

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      doc.title = titleMatch[1].trim();
    }

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (metaMatch) {
      doc.description = metaMatch[1].trim();
    }

    // Parse body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch ? bodyMatch[1] : html;

    // Extract all semantic elements
    this.parseElements(content, doc.sections);

    return doc;
  }

  /**
   * Parse HTML elements into EMS sections
   */
  parseElements(html, sections) {
    // Headings (h1-h6)
    const headingRegex = /<(h[1-6])[^>]*>([^<]+)<\/\1>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1].substring(1));
      sections.push({
        type: this.SYMBOLS.HEADING,
        level,
        content: match[2].trim()
      });
    }

    // Paragraphs
    const pRegex = /<p[^>]*>([^<]+)<\/p>/gi;
    while ((match = pRegex.exec(html)) !== null) {
      sections.push({
        type: this.SYMBOLS.TEXT,
        content: match[1].trim()
      });
    }

    // Images
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']+)["'][^>]*>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      sections.push({
        type: this.SYMBOLS.IMAGE,
        src: match[1],
        alt: match[2]
      });
    }

    // Links
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      // Skip anchor links
      if (match[1] === '#') continue;

      sections.push({
        type: this.SYMBOLS.LINK,
        href: match[1],
        text: match[2].trim()
      });
    }

    // Code blocks
    const codeRegex = /<(pre|code)[^>]*>([^<]+)<\/\1>/gi;
    while ((match = codeRegex.exec(html)) !== null) {
      sections.push({
        type: this.SYMBOLS.CODE,
        content: match[2].trim()
      });
    }

    // Videos
    const videoRegex = /<video[^>]*src=["']([^"']+)["'][^>]*>/gi;
    while ((match = videoRegex.exec(html)) !== null) {
      sections.push({
        type: this.SYMBOLS.VIDEO,
        src: match[1]
      });
    }
  }

  /**
   * Convert EMS Document to HTML
   */
  toHTML(emsDoc, options = {}) {
    const includeBoilerplate = options.boilerplate !== false;
    let html = '';

    if (includeBoilerplate) {
      html += '<!DOCTYPE html>\n';
      html += '<html lang="en">\n';
      html += '<head>\n';
      html += '  <meta charset="UTF-8">\n';
      html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';

      if (emsDoc.title) {
        html += `  <title>${emsDoc.title}</title>\n`;
      }

      if (emsDoc.description) {
        html += `  <meta name="description" content="${emsDoc.description}">\n`;
      }

      // Default minimal styling
      html += '  <style>\n';
      html += '    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }\n';
      html += '    img { max-width: 100%; height: auto; }\n';
      html += '    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }\n';
      html += '    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }\n';
      html += '  </style>\n';
      html += '</head>\n';
      html += '<body>\n';
    }

    // Convert sections
    for (const section of emsDoc.sections) {
      if (section.type === this.SYMBOLS.HEADING) {
        const level = section.level || 1;
        html += `  <h${level}>${section.content}</h${level}>\n`;
      } else if (section.type === this.SYMBOLS.TEXT) {
        html += `  <p>${section.content}</p>\n`;
      } else if (section.type === this.SYMBOLS.IMAGE) {
        html += `  <img src="${section.src}" alt="${section.alt || ''}">\n`;
      } else if (section.type === this.SYMBOLS.LINK) {
        html += `  <a href="${section.href}">${section.text}</a>\n`;
      } else if (section.type === this.SYMBOLS.CODE) {
        html += `  <pre><code>${section.content}</code></pre>\n`;
      } else if (section.type === this.SYMBOLS.VIDEO) {
        html += `  <video src="${section.src}" controls></video>\n`;
      } else if (section.type === this.SYMBOLS.CONTAINER) {
        html += `  <div class="container">\n`;
        if (section.children) {
          // Recursively render children
          const childDoc = { ...emsDoc, sections: section.children };
          html += this.toHTML(childDoc, { boilerplate: false });
        }
        html += `  </div>\n`;
      }
    }

    if (includeBoilerplate) {
      html += '</body>\n';
      html += '</html>\n';
    }

    return html;
  }

  /**
   * Convert EMS Document to plain text format
   */
  toText(emsDoc) {
    let text = '';

    text += `${this.SYMBOLS.DOCUMENT} ${emsDoc.format || 'EMS/1.0'}\n`;

    if (emsDoc.title) {
      text += `${this.SYMBOLS.HEADING} ${emsDoc.title}\n`;
    }

    if (emsDoc.description) {
      text += `${this.SYMBOLS.TEXT} ${emsDoc.description}\n`;
    }

    text += '\n';

    for (const section of emsDoc.sections) {
      if (section.type === this.SYMBOLS.HEADING) {
        const prefix = '#'.repeat(section.level || 1);
        text += `${prefix} ${section.content}\n\n`;
      } else if (section.type === this.SYMBOLS.TEXT) {
        text += `${section.content}\n\n`;
      } else if (section.type === this.SYMBOLS.IMAGE) {
        text += `${this.SYMBOLS.IMAGE} [${section.alt || 'Image'}](${section.src})\n\n`;
      } else if (section.type === this.SYMBOLS.LINK) {
        text += `${this.SYMBOLS.LINK} ${section.text} → ${section.href}\n\n`;
      } else if (section.type === this.SYMBOLS.CODE) {
        text += `${this.SYMBOLS.CODE}\n${section.content}\n\n`;
      } else if (section.type === this.SYMBOLS.VIDEO) {
        text += `${this.SYMBOLS.VIDEO} ${section.src}\n\n`;
      }
    }

    return text;
  }

  /**
   * Parse EMS text format into EMS Document
   */
  fromText(text) {
    const lines = text.split('\n');
    const doc = {
      format: 'EMS/1.0',
      type: this.SYMBOLS.DOCUMENT,
      sections: []
    };

    let currentSection = null;
    let codeBlock = false;
    let codeContent = '';

    for (let line of lines) {
      line = line.trim();

      // Skip empty lines
      if (!line && !codeBlock) continue;

      // Check for format declaration
      if (line.startsWith(this.SYMBOLS.DOCUMENT)) {
        const format = line.substring(this.SYMBOLS.DOCUMENT.length).trim();
        doc.format = format || 'EMS/1.0';
        continue;
      }

      // Headings (markdown-style)
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#+/)[0].length;
        const content = line.replace(/^#+\s*/, '');

        doc.sections.push({
          type: this.SYMBOLS.HEADING,
          level,
          content
        });
        continue;
      }

      // Code blocks
      if (line.startsWith(this.SYMBOLS.CODE)) {
        if (codeBlock) {
          // End code block
          doc.sections.push({
            type: this.SYMBOLS.CODE,
            content: codeContent.trim()
          });
          codeBlock = false;
          codeContent = '';
        } else {
          // Start code block
          codeBlock = true;
        }
        continue;
      }

      if (codeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // Images
      if (line.startsWith(this.SYMBOLS.IMAGE)) {
        const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          doc.sections.push({
            type: this.SYMBOLS.IMAGE,
            alt: match[1],
            src: match[2]
          });
        }
        continue;
      }

      // Links
      if (line.startsWith(this.SYMBOLS.LINK)) {
        const match = line.match(/([^→]+)→\s*(.+)/);
        if (match) {
          doc.sections.push({
            type: this.SYMBOLS.LINK,
            text: match[1].trim(),
            href: match[2].trim()
          });
        }
        continue;
      }

      // Videos
      if (line.startsWith(this.SYMBOLS.VIDEO)) {
        const src = line.substring(this.SYMBOLS.VIDEO.length).trim();
        doc.sections.push({
          type: this.SYMBOLS.VIDEO,
          src
        });
        continue;
      }

      // Default: treat as text
      if (line) {
        doc.sections.push({
          type: this.SYMBOLS.TEXT,
          content: line
        });
      }
    }

    return doc;
  }

  /**
   * Validate EMS document
   */
  validate(emsDoc) {
    const errors = [];

    if (!emsDoc.format) {
      errors.push('Missing format declaration');
    }

    if (emsDoc.type !== this.SYMBOLS.DOCUMENT) {
      errors.push(`Invalid document type: ${emsDoc.type}`);
    }

    if (!Array.isArray(emsDoc.sections)) {
      errors.push('Sections must be an array');
    }

    // Validate each section
    for (let i = 0; i < emsDoc.sections.length; i++) {
      const section = emsDoc.sections[i];

      if (!section.type) {
        errors.push(`Section ${i}: Missing type`);
        continue;
      }

      // Type-specific validation
      if (section.type === this.SYMBOLS.HEADING && !section.content) {
        errors.push(`Section ${i}: Heading missing content`);
      }

      if (section.type === this.SYMBOLS.IMAGE && !section.src) {
        errors.push(`Section ${i}: Image missing src`);
      }

      if (section.type === this.SYMBOLS.LINK && (!section.href || !section.text)) {
        errors.push(`Section ${i}: Link missing href or text`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Save EMS document to file
   */
  save(emsDoc, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(emsDoc, null, 2));
    console.log(`📄 Saved EMS document: ${filePath}`);
  }

  /**
   * Load EMS document from file
   */
  load(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
}

// CLI Mode
if (require.main === module) {
  const ems = new EmojiMarkupStandard({ verbose: true });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          📄 Emoji Markup Standard (EMS)                   ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];
  const input = process.argv[3];
  const output = process.argv[4];

  if (command === 'html2ems' && input) {
    // Convert HTML file to EMS
    const html = fs.readFileSync(input, 'utf-8');
    const emsDoc = ems.fromHTML(html);

    console.log('📄 EMS Document:\n');
    console.log(JSON.stringify(emsDoc, null, 2));

    if (output) {
      ems.save(emsDoc, output);
    }
  } else if (command === 'ems2html' && input) {
    // Convert EMS file to HTML
    const emsDoc = ems.load(input);
    const html = ems.toHTML(emsDoc);

    console.log('📄 HTML Output:\n');
    console.log(html);

    if (output) {
      fs.writeFileSync(output, html);
      console.log(`\n✅ Saved HTML: ${output}`);
    }
  } else if (command === 'text2ems' && input) {
    // Convert text format to EMS
    const text = fs.readFileSync(input, 'utf-8');
    const emsDoc = ems.fromText(text);

    console.log('📄 EMS Document:\n');
    console.log(JSON.stringify(emsDoc, null, 2));

    if (output) {
      ems.save(emsDoc, output);
    }
  } else if (command === 'ems2text' && input) {
    // Convert EMS to text format
    const emsDoc = ems.load(input);
    const text = ems.toText(emsDoc);

    console.log('📄 Text Output:\n');
    console.log(text);

    if (output) {
      fs.writeFileSync(output, text);
      console.log(`\n✅ Saved text: ${output}`);
    }
  } else if (command === 'validate' && input) {
    // Validate EMS document
    const emsDoc = ems.load(input);
    const result = ems.validate(emsDoc);

    if (result.valid) {
      console.log('✅ Document is valid!');
    } else {
      console.log('❌ Document has errors:\n');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }
  } else {
    console.log('Usage:');
    console.log('  node emoji-markup-standard.js html2ems <input.html> [output.json]');
    console.log('  node emoji-markup-standard.js ems2html <input.json> [output.html]');
    console.log('  node emoji-markup-standard.js text2ems <input.txt> [output.json]');
    console.log('  node emoji-markup-standard.js ems2text <input.json> [output.txt]');
    console.log('  node emoji-markup-standard.js validate <input.json>');
    console.log('\nExamples:');
    console.log('  node emoji-markup-standard.js html2ems public/NiceLeak/index.html');
    console.log('  node emoji-markup-standard.js ems2html doc.json output.html');
    process.exit(0);
  }
}

module.exports = EmojiMarkupStandard;
