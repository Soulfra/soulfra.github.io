/**
 * Pipeline Engine
 *
 * Chains multiple Ollama models together in sequential stages.
 * Each stage's output becomes the next stage's input.
 *
 * Usage:
 *   const pipeline = new PipelineEngine();
 *   await pipeline.run(templateName, userTopic);
 *   pipeline.exportToNotebook();
 */

class PipelineEngine {
  constructor() {
    this.ollamaURL = 'http://localhost:11434';
    this.templates = null;
    this.currentPipeline = null;
    this.stages = [];
    this.results = [];
    this.topic = '';
  }

  /**
   * Load pipeline templates
   */
  async loadTemplates() {
    if (this.templates) return this.templates;

    try {
      const response = await fetch('/pipelines/templates.json');
      this.templates = await response.json();
      return this.templates;
    } catch (error) {
      console.error('Failed to load templates:', error);
      return null;
    }
  }

  /**
   * Get all available templates
   */
  async getAvailableTemplates() {
    await this.loadTemplates();
    return Object.keys(this.templates || {}).map(key => ({
      id: key,
      name: this.templates[key].name,
      description: this.templates[key].description
    }));
  }

  /**
   * Initialize a pipeline from template
   */
  async initPipeline(templateName, userTopic) {
    await this.loadTemplates();

    if (!this.templates[templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }

    this.currentPipeline = this.templates[templateName];
    this.topic = userTopic;
    this.stages = [...this.currentPipeline.stages];
    this.results = [];

    console.log(`🔗 Pipeline initialized: ${this.currentPipeline.name}`);
    console.log(`📋 Topic: ${userTopic}`);
    console.log(`📊 Stages: ${this.stages.length}`);

    return {
      pipelineName: this.currentPipeline.name,
      topic: userTopic,
      totalStages: this.stages.length,
      stages: this.stages.map((s, i) => ({
        index: i,
        name: s.name || s.id,
        model: s.model
      }))
    };
  }

  /**
   * Run entire pipeline
   */
  async run(templateName, userTopic, options = {}) {
    const { onProgress = null } = options;

    await this.initPipeline(templateName, userTopic);

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];

      // Notify progress
      if (onProgress) {
        onProgress({
          stage: i,
          totalStages: this.stages.length,
          stageName: stage.name || stage.id,
          model: stage.model
        });
      }

      // Run stage
      const result = await this.runStage(stage, i);
      this.results.push(result);

      console.log(`✓ Stage ${i + 1}/${this.stages.length} complete: ${stage.name || stage.id}`);

      // Call UI callback if defined
      if (typeof this.onStageComplete === 'function') {
        this.onStageComplete(i, result);
      }
    }

    console.log('🎉 Pipeline complete!');

    return {
      success: true,
      pipelineName: this.currentPipeline.name,
      topic: this.topic,
      stages: this.results
    };
  }

  /**
   * Run a single stage
   */
  async runStage(stage, stageIndex) {
    console.log(`\n▶ Running stage: ${stage.name || stage.id}`);
    console.log(`  Model: ${stage.model}`);

    // Build prompt with previous output
    let prompt = stage.prompt.replace('{topic}', this.topic);

    if (stageIndex > 0 && prompt.includes('{previous}')) {
      const previousOutput = this.results[stageIndex - 1].output;
      prompt = prompt.replace('{previous}', previousOutput);
    }

    // Inject domain context if specified
    if (stage.domain) {
      try {
        if (typeof DomainContext !== 'undefined' && DomainContext.injectContext) {
          const contextInjected = DomainContext.injectContext(prompt, stage.domain);
          prompt = contextInjected.fullPrompt;
          console.log(`  🌐 Domain context: ${stage.domain}`);
        } else {
          console.warn(`  ⚠️ DomainContext not available, skipping context injection`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to inject domain context:`, error.message);
      }
    }

    // Call Ollama
    const startTime = Date.now();
    const output = await this.queryOllama(stage.model, prompt);
    const duration = Date.now() - startTime;

    return {
      stageId: stage.id,
      stageName: stage.name || stage.id,
      model: stage.model,
      domain: stage.domain || null,
      prompt: prompt,
      output: output,
      outputFormat: stage.outputFormat || 'text',
      duration: duration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Query Ollama model
   */
  async queryOllama(model, prompt) {
    try {
      const response = await fetch(`${this.ollamaURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';

    } catch (error) {
      console.error(`❌ Stage failed:`, error);
      return `[Error: ${error.message}]`;
    }
  }

  /**
   * Export to Jupyter Notebook
   */
  exportToNotebook() {
    const cells = [];

    // Title cell
    cells.push({
      cell_type: 'markdown',
      metadata: {},
      source: [
        `# ${this.currentPipeline.name}\n`,
        `\n`,
        `**Topic:** ${this.topic}\n`,
        `**Generated:** ${new Date().toISOString()}\n`,
        `**Pipeline:** ${this.results.length} stages\n`
      ]
    });

    // Stage cells
    this.results.forEach((result, i) => {
      // Stage header
      cells.push({
        cell_type: 'markdown',
        metadata: {},
        source: [
          `## Stage ${i + 1}: ${result.stageName}\n`,
          `\n`,
          `- **Model:** \`${result.model}\`\n`,
          result.domain ? `- **Domain:** \`${result.domain}\`\n` : '',
          `- **Duration:** ${(result.duration / 1000).toFixed(2)}s\n`,
          `- **Format:** ${result.outputFormat}\n`
        ].filter(line => line)
      });

      // Output cell
      const cellType = result.outputFormat === 'code' ? 'code' : 'markdown';
      cells.push({
        cell_type: cellType,
        metadata: {},
        source: result.output.split('\n')
      });
    });

    // Summary cell
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    cells.push({
      cell_type: 'markdown',
      metadata: {},
      source: [
        `---\n`,
        `\n`,
        `## Pipeline Summary\n`,
        `\n`,
        `- **Total stages:** ${this.results.length}\n`,
        `- **Total time:** ${(totalDuration / 1000).toFixed(2)}s\n`,
        `- **Models used:** ${[...new Set(this.results.map(r => r.model))].join(', ')}\n`,
        `\n`,
        `Generated with [Soulfra Pipelines](https://soulfra.com/pipelines/)\n`
      ]
    });

    const notebook = {
      cells: cells,
      metadata: {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3'
        },
        language_info: {
          name: 'python',
          version: '3.9.0'
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };

    return notebook;
  }

  /**
   * Export to Python script
   */
  exportToScript() {
    let script = `#!/usr/bin/env python3
"""
${this.currentPipeline.name}

Topic: ${this.topic}
Generated: ${new Date().toISOString()}
Pipeline: ${this.results.length} stages
"""

`;

    this.results.forEach((result, i) => {
      script += `# Stage ${i + 1}: ${result.stageName}\n`;
      script += `# Model: ${result.model}\n`;
      if (result.domain) {
        script += `# Domain: ${result.domain}\n`;
      }
      script += `\n`;

      if (result.outputFormat === 'code') {
        script += result.output + '\n\n';
      } else {
        script += `"""\n${result.output}\n"""\n\n`;
      }
    });

    script += `# Pipeline completed in ${(this.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s\n`;

    return script;
  }

  /**
   * Export to Markdown
   */
  exportToMarkdown() {
    let md = `# ${this.currentPipeline.name}\n\n`;
    md += `**Topic:** ${this.topic}\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;
    md += `---\n\n`;

    this.results.forEach((result, i) => {
      md += `## Stage ${i + 1}: ${result.stageName}\n\n`;
      md += `- **Model:** \`${result.model}\`\n`;
      if (result.domain) {
        md += `- **Domain:** \`${result.domain}\`\n`;
      }
      md += `- **Duration:** ${(result.duration / 1000).toFixed(2)}s\n`;
      md += `\n`;

      if (result.outputFormat === 'code') {
        md += `\`\`\`\n${result.output}\n\`\`\`\n\n`;
      } else {
        md += result.output + '\n\n';
      }
    });

    md += `---\n\n`;
    md += `**Pipeline Summary:**\n`;
    md += `- Total stages: ${this.results.length}\n`;
    md += `- Total time: ${(this.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s\n`;
    md += `- Models: ${[...new Set(this.results.map(r => r.model))].join(', ')}\n`;

    return md;
  }

  /**
   * Export to JSON
   */
  exportToJSON() {
    return {
      pipelineName: this.currentPipeline.name,
      topic: this.topic,
      generatedAt: new Date().toISOString(),
      totalStages: this.results.length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      stages: this.results
    };
  }

  /**
   * Download export as file
   */
  downloadExport(format = 'notebook') {
    let content, filename, mimeType;

    switch (format) {
      case 'notebook':
        content = JSON.stringify(this.exportToNotebook(), null, 2);
        filename = `pipeline-${this.topic.toLowerCase().replace(/\s+/g, '-')}.ipynb`;
        mimeType = 'application/x-ipynb+json';
        break;

      case 'script':
        content = this.exportToScript();
        filename = `pipeline-${this.topic.toLowerCase().replace(/\s+/g, '-')}.py`;
        mimeType = 'text/x-python';
        break;

      case 'markdown':
        content = this.exportToMarkdown();
        filename = `pipeline-${this.topic.toLowerCase().replace(/\s+/g, '-')}.md`;
        mimeType = 'text/markdown';
        break;

      case 'json':
        content = JSON.stringify(this.exportToJSON(), null, 2);
        filename = `pipeline-${this.topic.toLowerCase().replace(/\s+/g, '-')}.json`;
        mimeType = 'application/json';
        break;

      default:
        throw new Error(`Unknown export format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

    console.log(`📥 Downloaded: ${filename}`);
  }

  /**
   * Save pipeline to localStorage
   */
  savePipeline(pipelineId) {
    const data = {
      id: pipelineId,
      templateName: this.currentPipeline.name,
      topic: this.topic,
      results: this.results,
      createdAt: new Date().toISOString()
    };

    const pipelines = JSON.parse(localStorage.getItem('pipelines') || '[]');
    pipelines.push(data);
    localStorage.setItem('pipelines', JSON.stringify(pipelines));

    console.log(`💾 Pipeline saved: ${pipelineId}`);
  }

  /**
   * Load pipeline from localStorage
   */
  loadPipeline(pipelineId) {
    const pipelines = JSON.parse(localStorage.getItem('pipelines') || '[]');
    const pipeline = pipelines.find(p => p.id === pipelineId);

    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    this.currentPipeline = { name: pipeline.templateName };
    this.topic = pipeline.topic;
    this.results = pipeline.results;

    console.log(`📂 Pipeline loaded: ${pipelineId}`);
    return pipeline;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.PipelineEngine = PipelineEngine;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PipelineEngine;
}
