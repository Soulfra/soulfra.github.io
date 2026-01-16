/**
 * Story Compiler
 *
 * Compiles UGC (pipelines, voice memos, reviews) into XKCD-style visual narratives
 * - Collects content from multiple sources
 * - Orders by timestamp or RL algorithm
 * - Generates comic-strip style panels
 * - Word folding/timing animations (using existing wordlist)
 * - Shareable URLs + QR + UPC barcodes
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class StoryCompiler {
  constructor() {
    this.storiesKey = 'compiled_stories';
    this.currentStory = null;
  }

  /**
   * Compile UGC into a story
   */
  compile(options = {}) {
    const {
      sources = [],      // Array of {type, data} objects
      title = 'Untitled Story',
      format = 'comic-strip', // 'comic-strip', 'timeline', 'feed'
      animations = true,
      algorithm = 'timestamp', // 'timestamp', 'RL', 'manual'
      tags = []
    } = options;

    // Collect and process content
    const panels = this.collectPanels(sources);

    // Order panels
    const orderedPanels = this.orderPanels(panels, algorithm);

    // Generate story object
    const story = {
      id: this.generateStoryId(),
      title,
      created_at: Date.now(),
      created_at_iso: new Date().toISOString(),
      user_id: SessionManager ? SessionManager.getUserId() : 'anonymous',
      format,
      animations,
      panels: orderedPanels,
      tags,
      metadata: {
        totalPanels: orderedPanels.length,
        sources: sources.map(s => s.type),
        algorithm
      }
    };

    // Save story
    this.saveStory(story);

    this.currentStory = story;
    return story;
  }

  /**
   * Collect panels from UGC sources
   */
  collectPanels(sources) {
    const panels = [];

    sources.forEach(source => {
      switch (source.type) {
        case 'pipeline':
          panels.push(...this.panelsFromPipeline(source.data));
          break;

        case 'voice':
          panels.push(this.panelFromVoice(source.data));
          break;

        case 'review':
          panels.push(this.panelFromReview(source.data));
          break;

        case 'capsule':
          panels.push(...this.panelsFromCapsule(source.data));
          break;

        default:
          panels.push(this.panelFromGeneric(source.data));
      }
    });

    return panels;
  }

  /**
   * Create panels from pipeline results
   */
  panelsFromPipeline(pipelineData) {
    const panels = [];

    // Title panel
    panels.push({
      type: 'title',
      title: pipelineData.pipelineName || pipelineData.topic,
      subtitle: `Pipeline: ${pipelineData.topic}`,
      timestamp: pipelineData.timestamp || Date.now()
    });

    // Stage panels
    if (pipelineData.stages) {
      pipelineData.stages.forEach((stage, i) => {
        panels.push({
          type: 'stage',
          number: i + 1,
          title: stage.stageName,
          content: stage.output,
          model: stage.model,
          duration: stage.duration,
          timestamp: stage.timestamp || Date.now()
        });
      });
    }

    return panels;
  }

  /**
   * Create panel from voice memo
   */
  panelFromVoice(voiceData) {
    return {
      type: 'voice',
      title: voiceData.topicName || voiceData.topicId,
      audio: voiceData.audioUrl || null,
      transcript: voiceData.transcript || '(No transcript)',
      duration: voiceData.duration,
      timestamp: voiceData.timestamp || Date.now()
    };
  }

  /**
   * Create panel from review
   */
  panelFromReview(reviewData) {
    return {
      type: 'review',
      title: `Review: ${reviewData.businessName || reviewData.topicId}`,
      content: reviewData.reviewText || '',
      rating: reviewData.rating || null,
      verified: reviewData.paid || false,
      timestamp: reviewData.timestamp || Date.now()
    };
  }

  /**
   * Create panels from capsule
   */
  panelsFromCapsule(capsuleData) {
    const panels = [];

    // Capsule title panel
    panels.push({
      type: 'capsule-header',
      title: capsuleData.title,
      capsuleType: capsuleData.type,
      locked: capsuleData.locked,
      timestamp: capsuleData.created_at * 1000 // Convert epoch to ms
    });

    // Extract panels from capsule contents
    if (capsuleData.contents) {
      if (capsuleData.contents.pipelines) {
        capsuleData.contents.pipelines.forEach(pipeline => {
          panels.push(...this.panelsFromPipeline(pipeline));
        });
      }

      if (capsuleData.contents.voice_memos) {
        capsuleData.contents.voice_memos.forEach(voice => {
          panels.push(this.panelFromVoice(voice));
        });
      }

      if (capsuleData.contents.reflections) {
        panels.push({
          type: 'reflection',
          title: 'Reflections',
          content: capsuleData.contents.reflections,
          timestamp: capsuleData.created_at * 1000
        });
      }
    }

    return panels;
  }

  /**
   * Create panel from generic data
   */
  panelFromGeneric(data) {
    return {
      type: 'generic',
      title: data.title || 'Untitled',
      content: data.content || data.text || JSON.stringify(data),
      timestamp: data.timestamp || Date.now()
    };
  }

  /**
   * Order panels by algorithm
   */
  orderPanels(panels, algorithm) {
    switch (algorithm) {
      case 'timestamp':
        return panels.sort((a, b) => a.timestamp - b.timestamp);

      case 'RL':
        return this.orderByRL(panels);

      case 'manual':
        return panels; // Keep original order

      default:
        return panels.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  /**
   * Order panels using simple RL-style scoring
   */
  orderByRL(panels) {
    // Simple scoring algorithm (can be enhanced with actual RL)
    const scored = panels.map(panel => ({
      ...panel,
      score: this.scorePanel(panel)
    }));

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Score a panel for RL ordering
   */
  scorePanel(panel) {
    let score = 0;

    // Recency boost
    const age = Date.now() - panel.timestamp;
    const recencyScore = 1 / (age / (1000 * 60 * 60) + 1); // Decay over hours
    score += recencyScore * 100;

    // Type priority
    const typePriority = {
      'title': 100,
      'capsule-header': 90,
      'stage': 70,
      'voice': 60,
      'review': 50,
      'reflection': 40,
      'generic': 30
    };
    score += typePriority[panel.type] || 0;

    // Content length bonus
    const contentLength = (panel.content || '').length;
    score += Math.min(contentLength / 100, 50); // Max 50 points for length

    return score;
  }

  /**
   * Generate story ID
   */
  generateStoryId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `story-${timestamp}-${random}`;
  }

  /**
   * Save story to localStorage
   */
  saveStory(story) {
    const stories = this.getAllStories();
    stories.push(story);
    localStorage.setItem(this.storiesKey, JSON.stringify(stories));

    console.log('✅ Story compiled:', story.id);
  }

  /**
   * Get all stories
   */
  getAllStories() {
    try {
      const data = localStorage.getItem(this.storiesKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Get story by ID
   */
  getStory(id) {
    const stories = this.getAllStories();
    return stories.find(s => s.id === id);
  }

  /**
   * Generate shareable URL
   */
  getShareUrl(story) {
    const origin = window.location.origin;
    return `${origin}/stories/${story.id}.html`;
  }

  /**
   * Generate QR code URL
   */
  generateQR(story) {
    const url = this.getShareUrl(story);
    // Return data for QR generation (use existing QRCode library)
    return url;
  }

  /**
   * Generate UPC barcode (simple implementation)
   */
  generateUPC(story) {
    // Generate 12-digit UPC from story ID
    const hash = this.hashString(story.id);
    const upc = (hash % 1000000000000).toString().padStart(12, '0');

    return {
      code: upc,
      formatted: this.formatUPC(upc)
    };
  }

  /**
   * Hash string to number
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Format UPC for display
   */
  formatUPC(upc) {
    // Format as: X-XXXXX-XXXXX-X
    return `${upc[0]}-${upc.slice(1, 6)}-${upc.slice(6, 11)}-${upc[11]}`;
  }

  /**
   * Export story to HTML
   */
  exportToHTML(story) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${story.title}</title>
  <style>
    body { font-family: 'SF Mono', monospace; background: #0a0a0a; color: #00ff88; padding: 20px; }
    .story { max-width: 800px; margin: 0 auto; }
    .panel { background: #1a1a1a; border: 1px solid #333; padding: 20px; margin-bottom: 20px; }
    .panel h2 { color: #00ff88; margin-bottom: 10px; }
    .panel-meta { color: #888; font-size: 12px; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="story">
    <h1>${story.title}</h1>
    <p>Created: ${story.created_at_iso}</p>
    <p>Panels: ${story.panels.length}</p>
    <hr>
`;

    story.panels.forEach((panel, i) => {
      html += `
    <div class="panel" data-type="${panel.type}">
      <div class="panel-meta">Panel ${i + 1} • ${panel.type}</div>
      <h2>${panel.title || 'Untitled'}</h2>
      ${panel.content ? `<div>${panel.content}</div>` : ''}
      ${panel.audio ? `<audio controls src="${panel.audio}"></audio>` : ''}
    </div>`;
    });

    html += `
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Download story as HTML file
   */
  downloadHTML(story) {
    const html = this.exportToHTML(story);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.id}.html`;
    link.click();

    URL.revokeObjectURL(url);

    console.log(`📥 Downloaded story: ${story.id}.html`);
  }

  /**
   * Preview story (opens in new window)
   */
  preview(story) {
    const html = this.exportToHTML(story);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }

  /**
   * Get story stats
   */
  getStats() {
    const stories = this.getAllStories();

    return {
      total: stories.length,
      byFormat: {
        'comic-strip': stories.filter(s => s.format === 'comic-strip').length,
        'timeline': stories.filter(s => s.format === 'timeline').length,
        'feed': stories.filter(s => s.format === 'feed').length
      },
      totalPanels: stories.reduce((sum, s) => sum + s.panels.length, 0),
      recentStories: stories.slice(-5).reverse()
    };
  }
}

// Export singleton
const storyCompiler = new StoryCompiler();

// Browser export
if (typeof window !== 'undefined') {
  window.StoryCompiler = storyCompiler;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = storyCompiler;
}

console.log('[StoryCompiler] Module loaded');
