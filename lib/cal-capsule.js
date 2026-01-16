/**
 * Cal Capsule System
 *
 * Time-locked business/project archives combining:
 * - Pipeline business plans
 * - Verification receipts
 * - Project milestones
 * - Epoch timestamp locking
 *
 * Named after Calriven - the business-focused brand
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class CalCapsule {
  constructor() {
    this.capsulesKey = 'cal_capsules';
    this.currentCapsule = null;
  }

  /**
   * Create new Cal Capsule
   */
  create(data) {
    const now = Date.now();
    const epochTime = Math.floor(now / 1000);

    const capsule = {
      id: this.generateCapsuleId(),
      type: 'cal_capsule',
      created_at: epochTime,
      created_at_iso: new Date().toISOString(),
      user_id: SessionManager.getUserId(),
      unlock_at: data.unlockAt || null, // Epoch timestamp for when to unlock
      locked: data.locked !== undefined ? data.locked : !!data.unlockAt,
      contents: {
        business_plan: data.businessPlan || '',
        receipts: data.receipts || [],
        milestones: data.milestones || [],
        financials: data.financials || {},
        metadata: data.metadata || {}
      },
      tags: data.tags || [],
      title: data.title || 'Untitled Cal Capsule',
      description: data.description || '',
      status: data.status || 'draft' // draft, active, archived, unlocked
    };

    // Save capsule
    this.saveCapsule(capsule);

    this.currentCapsule = capsule;
    return capsule;
  }

  /**
   * Create Cal Capsule from Pipeline business plan
   */
  createFromPipeline(pipelineResult, topic) {
    // Extract business plan from last stage (if available)
    const businessPlan = pipelineResult.stages && pipelineResult.stages.length > 0
      ? pipelineResult.stages[pipelineResult.stages.length - 1].output
      : '';

    return this.create({
      title: `Business Plan: ${topic}`,
      businessPlan: businessPlan,
      tags: ['pipeline', 'business-plan', topic.toLowerCase().replace(/\s+/g, '-')],
      metadata: {
        source: 'pipeline',
        template: pipelineResult.pipelineName,
        pipelineId: pipelineResult.pipelineId || 'unknown',
        stages: pipelineResult.stages?.length || 0
      }
    });
  }

  /**
   * Create Cal Capsule from verified review/payment
   */
  createFromReceipt(receiptData) {
    return this.create({
      title: `Receipt: ${receiptData.businessName || receiptData.topicId}`,
      receipts: [receiptData],
      tags: ['receipt', 'verified'],
      metadata: {
        source: 'receipt',
        amount: receiptData.amount,
        verificationId: receiptData.verificationId
      }
    });
  }

  /**
   * Add milestone to capsule
   */
  addMilestone(capsuleId, milestone) {
    const capsule = this.getCapsule(capsuleId);
    if (!capsule) throw new Error('Capsule not found');

    const newMilestone = {
      id: `milestone-${Date.now()}`,
      title: milestone.title,
      description: milestone.description || '',
      completedAt: milestone.completedAt || new Date().toISOString(),
      evidence: milestone.evidence || null,
      timestamp: Date.now()
    };

    capsule.contents.milestones.push(newMilestone);

    // Update capsule
    this.updateCapsule(capsule);

    return newMilestone;
  }

  /**
   * Generate capsule ID
   */
  generateCapsuleId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `cal-${timestamp}-${random}`;
  }

  /**
   * Save capsule to localStorage
   */
  saveCapsule(capsule) {
    const capsules = this.getAllCapsules();
    capsules.push(capsule);
    localStorage.setItem(this.capsulesKey, JSON.stringify(capsules));

    console.log('✅ Cal Capsule saved:', capsule.id);
  }

  /**
   * Update existing capsule
   */
  updateCapsule(capsule) {
    const capsules = this.getAllCapsules();
    const index = capsules.findIndex(c => c.id === capsule.id);

    if (index === -1) throw new Error('Capsule not found');

    capsules[index] = capsule;
    localStorage.setItem(this.capsulesKey, JSON.stringify(capsules));

    console.log('✅ Cal Capsule updated:', capsule.id);
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
    md += `**Status:** ${capsule.status}\n`;

    if (capsule.locked && capsule.unlock_at) {
      const unlockDate = new Date(capsule.unlock_at * 1000).toISOString();
      md += `**Unlock Date:** ${unlockDate}\n`;

      const timeRemaining = this.getTimeRemaining(capsule);
      if (timeRemaining && !timeRemaining.unlocked) {
        md += `**Time Remaining:** ${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m\n`;
      }
    }

    md += `\n---\n\n`;

    if (capsule.description) {
      md += `${capsule.description}\n\n`;
    }

    // Business Plan
    if (capsule.contents.business_plan) {
      md += `## Business Plan\n\n`;
      md += `${capsule.contents.business_plan}\n\n`;
      md += `\n---\n\n`;
    }

    // Receipts
    if (capsule.contents.receipts && capsule.contents.receipts.length > 0) {
      md += `## Verified Receipts\n\n`;
      capsule.contents.receipts.forEach((receipt, i) => {
        md += `### Receipt ${i + 1}\n\n`;
        md += `**Business:** ${receipt.businessName || receipt.topicId}\n`;
        md += `**Amount:** $${receipt.amount || 1.00}\n`;
        md += `**Verification ID:** ${receipt.verificationId}\n`;
        md += `**Timestamp:** ${receipt.timestamp}\n\n`;
      });
      md += `\n---\n\n`;
    }

    // Milestones
    if (capsule.contents.milestones && capsule.contents.milestones.length > 0) {
      md += `## Project Milestones\n\n`;
      capsule.contents.milestones.forEach((milestone, i) => {
        md += `### ${i + 1}. ${milestone.title}\n\n`;
        md += `**Completed:** ${milestone.completedAt}\n`;

        if (milestone.description) {
          md += `\n${milestone.description}\n`;
        }

        if (milestone.evidence) {
          md += `\n**Evidence:** ${milestone.evidence}\n`;
        }

        md += `\n`;
      });
      md += `\n---\n\n`;
    }

    // Financials
    if (capsule.contents.financials && Object.keys(capsule.contents.financials).length > 0) {
      md += `## Financials\n\n`;
      md += `\`\`\`json\n${JSON.stringify(capsule.contents.financials, null, 2)}\n\`\`\`\n\n`;
    }

    // Tags
    if (capsule.tags && capsule.tags.length > 0) {
      md += `**Tags:** ${capsule.tags.join(', ')}\n\n`;
    }

    return md;
  }

  /**
   * Export capsule to PDF-ready format
   */
  exportToPDF(capsule) {
    // This would integrate with jsPDF or similar
    // For now, return structured data for PDF generation
    return {
      title: capsule.title,
      subtitle: capsule.description,
      sections: [
        {
          title: 'Business Plan',
          content: capsule.contents.business_plan
        },
        {
          title: 'Receipts',
          items: capsule.contents.receipts
        },
        {
          title: 'Milestones',
          items: capsule.contents.milestones
        },
        {
          title: 'Financials',
          data: capsule.contents.financials
        }
      ],
      metadata: {
        created: capsule.created_at_iso,
        user: capsule.user_id,
        status: capsule.status,
        locked: capsule.locked,
        unlockAt: capsule.unlock_at
      }
    };
  }

  /**
   * Export capsule to .cal file (JSON with special extension)
   */
  exportToFile(capsule, format = 'json') {
    let content, filename, mimeType;

    switch (format) {
      case 'json':
        content = this.exportToJSON(capsule);
        filename = `${capsule.id}.cal`;
        mimeType = 'application/json';
        break;

      case 'markdown':
        content = this.exportToMarkdown(capsule);
        filename = `${capsule.id}.md`;
        mimeType = 'text/markdown';
        break;

      case 'pdf':
        // For PDF, we'd need jsPDF integration
        // For now, download as markdown
        content = this.exportToMarkdown(capsule);
        filename = `${capsule.id}-report.md`;
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

    console.log(`📥 Downloaded Cal Capsule: ${filename}`);
  }

  /**
   * Import capsule from .cal file
   */
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const capsule = JSON.parse(e.target.result);

          // Validate capsule
          if (capsule.type !== 'cal_capsule') {
            throw new Error('Invalid Cal Capsule file');
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
      byStatus: {
        draft: capsules.filter(c => c.status === 'draft').length,
        active: capsules.filter(c => c.status === 'active').length,
        archived: capsules.filter(c => c.status === 'archived').length,
        unlocked: capsules.filter(c => c.status === 'unlocked').length
      },
      receipts: capsules.reduce((sum, c) => sum + (c.contents.receipts?.length || 0), 0),
      milestones: capsules.reduce((sum, c) => sum + (c.contents.milestones?.length || 0), 0)
    };
  }
}

// Export singleton
const calCapsule = new CalCapsule();

// Browser export
if (typeof window !== 'undefined') {
  window.CalCapsule = calCapsule;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = calCapsule;
}

console.log('[CalCapsule] Module loaded');
