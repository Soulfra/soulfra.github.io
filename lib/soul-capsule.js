/**
 * Soul Capsule System
 *
 * Time-locked personal thought archives combining:
 * - Pipeline results
 * - Voice transcripts
 * - Personal reflections
 * - Epoch timestamp locking
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class SoulCapsule {
  constructor() {
    this.capsulesKey = 'soul_capsules';
    this.currentCapsule = null;
  }

  /**
   * Create new Soul Capsule
   */
  create(data) {
    const now = Date.now();
    const epochTime = Math.floor(now / 1000);

    const capsule = {
      id: this.generateCapsuleId(),
      type: 'soul_capsule',
      created_at: epochTime,
      created_at_iso: new Date().toISOString(),
      user_id: SessionManager.getUserId(),
      unlock_at: data.unlockAt || null, // Optional timelock
      locked: data.locked !== undefined ? data.locked : false,
      contents: {
        pipelines: data.pipelines || [],
        voice_memos: data.voiceMemos || [],
        reflections: data.reflections || '',
        metadata: data.metadata || {}
      },
      tags: data.tags || [],
      title: data.title || 'Untitled Soul Capsule',
      description: data.description || ''
    };

    // Save capsule
    this.saveCapsule(capsule);

    this.currentCapsule = capsule;
    return capsule;
  }

  /**
   * Create Soul Capsule from Pipeline result
   */
  createFromPipeline(pipelineResult, topic) {
    return this.create({
      title: `Pipeline: ${topic}`,
      pipelines: [pipelineResult],
      tags: ['pipeline', topic.toLowerCase().replace(/\s+/g, '-')],
      metadata: {
        source: 'pipeline',
        template: pipelineResult.pipelineName
      }
    });
  }

  /**
   * Create Soul Capsule from Voice Memo
   */
  createFromVoiceMemo(voiceData, topic) {
    return this.create({
      title: `Voice: ${topic}`,
      voiceMemos: [voiceData],
      tags: ['voice', topic.toLowerCase().replace(/\s+/g, '-')],
      metadata: {
        source: 'voice',
        duration: voiceData.duration
      }
    });
  }

  /**
   * Generate capsule ID
   */
  generateCapsuleId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `soul-${timestamp}-${random}`;
  }

  /**
   * Save capsule to localStorage
   */
  saveCapsule(capsule) {
    const capsules = this.getAllCapsules();
    capsules.push(capsule);
    localStorage.setItem(this.capsulesKey, JSON.stringify(capsules));

    console.log('✅ Soul Capsule saved:', capsule.id);
  }

  /**
   * Get all capsules
   */
  getAllCapsules() {
    try {
      const data = localStorage.getItem(this.capsulesKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Get capsule by ID
   */
  getCapsule(id) {
    const capsules = this.getAllCapsules();
    return capsules.find(c => c.id === id);
  }

  /**
   * Check if capsule is unlocked
   */
  isUnlocked(capsule) {
    if (!capsule.locked) return true;
    if (!capsule.unlock_at) return true;

    const now = Math.floor(Date.now() / 1000);
    return now >= capsule.unlock_at;
  }

  /**
   * Get time remaining until unlock
   */
  getTimeRemaining(capsule) {
    if (!capsule.locked || !capsule.unlock_at) return null;

    const now = Math.floor(Date.now() / 1000);
    const remaining = capsule.unlock_at - now;

    if (remaining <= 0) return { unlocked: true };

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return {
      unlocked: false,
      days,
      hours,
      minutes,
      totalSeconds: remaining
    };
  }

  /**
   * Export capsule to JSON
   */
  exportToJSON(capsule) {
    return JSON.stringify(capsule, null, 2);
  }

  /**
   * Export capsule to Markdown
   */
  exportToMarkdown(capsule) {
    let md = `# ${capsule.title}\n\n`;
    md += `**Created:** ${capsule.created_at_iso}\n`;
    md += `**User:** ${capsule.user_id}\n`;

    if (capsule.locked && capsule.unlock_at) {
      const unlockDate = new Date(capsule.unlock_at * 1000).toISOString();
      md += `**Unlock Date:** ${unlockDate}\n`;
    }

    md += `\n---\n\n`;

    if (capsule.description) {
      md += `${capsule.description}\n\n`;
    }

    // Pipelines
    if (capsule.contents.pipelines && capsule.contents.pipelines.length > 0) {
      md += `## Pipeline Results\n\n`;
      capsule.contents.pipelines.forEach((pipeline, i) => {
        md += `### Pipeline ${i + 1}: ${pipeline.pipelineName || pipeline.topic}\n\n`;
        md += `**Topic:** ${pipeline.topic}\n`;
        md += `**Stages:** ${pipeline.stages ? pipeline.stages.length : 0}\n\n`;

        if (pipeline.stages) {
          pipeline.stages.forEach((stage, j) => {
            md += `#### Stage ${j + 1}: ${stage.stageName}\n\n`;
            md += `**Model:** ${stage.model}\n\n`;
            md += `${stage.output}\n\n`;
          });
        }

        md += `\n---\n\n`;
      });
    }

    // Voice Memos
    if (capsule.contents.voice_memos && capsule.contents.voice_memos.length > 0) {
      md += `## Voice Memos\n\n`;
      capsule.contents.voice_memos.forEach((memo, i) => {
        md += `### Memo ${i + 1}\n\n`;
        md += `**Topic:** ${memo.topicName || memo.topicId}\n`;
        md += `**Duration:** ${memo.duration}\n`;
        md += `**Timestamp:** ${memo.timestamp}\n\n`;

        if (memo.transcript) {
          md += `**Transcript:**\n\n${memo.transcript}\n\n`;
        }

        md += `\n---\n\n`;
      });
    }

    // Reflections
    if (capsule.contents.reflections) {
      md += `## Reflections\n\n`;
      md += `${capsule.contents.reflections}\n\n`;
    }

    // Tags
    if (capsule.tags && capsule.tags.length > 0) {
      md += `**Tags:** ${capsule.tags.join(', ')}\n\n`;
    }

    return md;
  }

  /**
   * Export capsule to .soul file (JSON with special extension)
   */
  exportToFile(capsule, format = 'json') {
    let content, filename, mimeType;

    switch (format) {
      case 'json':
        content = this.exportToJSON(capsule);
        filename = `${capsule.id}.soul`;
        mimeType = 'application/json';
        break;

      case 'markdown':
        content = this.exportToMarkdown(capsule);
        filename = `${capsule.id}.md`;
        mimeType = 'text/markdown';
        break;

      default:
        throw new Error(`Unknown format: ${format}`);
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

    console.log(`📥 Downloaded Soul Capsule: ${filename}`);
  }

  /**
   * Import capsule from .soul file
   */
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const capsule = JSON.parse(e.target.result);

          // Validate capsule
          if (capsule.type !== 'soul_capsule') {
            throw new Error('Invalid Soul Capsule file');
          }

          // Save capsule
          this.saveCapsule(capsule);

          resolve(capsule);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get capsule stats
   */
  getStats() {
    const capsules = this.getAllCapsules();

    return {
      total: capsules.length,
      locked: capsules.filter(c => c.locked).length,
      unlocked: capsules.filter(c => !c.locked || this.isUnlocked(c)).length,
      pipelines: capsules.reduce((sum, c) => sum + (c.contents.pipelines?.length || 0), 0),
      voiceMemos: capsules.reduce((sum, c) => sum + (c.contents.voice_memos?.length || 0), 0)
    };
  }
}

// Export singleton
const soulCapsule = new SoulCapsule();

// Browser export
if (typeof window !== 'undefined') {
  window.SoulCapsule = soulCapsule;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = soulCapsule;
}

console.log('[SoulCapsule] Module loaded');
