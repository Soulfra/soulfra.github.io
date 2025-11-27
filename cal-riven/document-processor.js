import fs from 'fs';
import path from 'path';

class DocumentProcessor {
  constructor() {
    this.processedDocs = [];
    this.soulframContext = {
      buildingProcess: [],
      strategicDecisions: [],
      technicalChoices: [],
      reasoningPatterns: []
    };
  }

  // Process all Soulfra documentation
  async processSoulframDocs(docsPath) {
    console.log('📚 Processing Soulfra documentation...');
    
    const files = this.findMarkdownFiles(docsPath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const processed = await this.extractKnowledge(content, file);
      this.soulframContext.buildingProcess.push(processed);
    }
    
    await this.saveContext();
    console.log(`✅ Processed ${files.length} documentation files`);
    return this.soulframContext;
  }

  findMarkdownFiles(dir) {
    const files = [];
    
    function searchDirectory(directory) {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDirectory(fullPath);
        } else if (item.endsWith('.md') || item.endsWith('.txt')) {
          files.push(fullPath);
        }
      }
    }
    
    searchDirectory(dir);
    return files;
  }

  async extractKnowledge(content, filename) {
    // Extract key patterns from documentation
    const knowledge = {
      filename: path.basename(filename),
      type: this.detectDocType(content),
      keyDecisions: this.extractDecisions(content),
      technicalApproaches: this.extractTechnicalInfo(content),
      strategicInsights: this.extractStrategy(content),
      buildingPatterns: this.extractBuildingPatterns(content)
    };
    
    return knowledge;
  }

  detectDocType(content) {
    if (content.includes('PRD') || content.includes('Product Requirements')) return 'product';
    if (content.includes('implementation') || content.includes('code')) return 'technical';
    if (content.includes('strategy') || content.includes('business')) return 'strategic';
    if (content.includes('integration') || content.includes('system')) return 'architecture';
    return 'general';
  }

  extractDecisions(content) {
    const decisions = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('decided') || line.includes('choice') || line.includes('selected')) {
        decisions.push(line.trim());
      }
    }
    
    return decisions;
  }

  extractTechnicalInfo(content) {
    const technical = [];
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    
    for (const block of codeBlocks) {
      technical.push({
        type: 'code',
        content: block
      });
    }
    
    return technical;
  }

  extractStrategy(content) {
    const strategy = [];
    const strategicTerms = ['market', 'competitive', 'advantage', 'positioning', 'value prop'];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (strategicTerms.some(term => line.toLowerCase().includes(term))) {
        strategy.push(line.trim());
      }
    }
    
    return strategy;
  }

  extractBuildingPatterns(content) {
    const patterns = [];
    
    // Look for process descriptions
    if (content.includes('step by step') || content.includes('process')) {
      patterns.push('systematic_approach');
    }
    if (content.includes('iterate') || content.includes('improve')) {
      patterns.push('iterative_development');
    }
    if (content.includes('user') || content.includes('customer')) {
      patterns.push('user_focused');
    }
    if (content.includes('simple') || content.includes('clear')) {
      patterns.push('clarity_first');
    }
    
    return patterns;
  }

  async saveContext() {
    const contextFile = 'cal-riven/context/soulfra-knowledge.json';
    fs.writeFileSync(contextFile, JSON.stringify(this.soulframContext, null, 2));
    console.log('💾 Saved Soulfra context to:', contextFile);
  }
}

export { DocumentProcessor };
