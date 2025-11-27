import fs from 'fs';
import path from 'path';

class CentralReasoningEngine {
  constructor() {
    this.patterns = new Map();
    this.strategies = new Map();
    this.context = new Map();
    this.initialize();
  }

  async initialize() {
    await this.loadPatterns();
    await this.loadStrategies();
    await this.loadContext();
  }

  async loadPatterns() {
    const patternsDir = path.join(process.cwd(), 'core/reasoning/patterns');
    const files = fs.readdirSync(patternsDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const pattern = await import(path.join(patternsDir, file));
        this.patterns.set(pattern.name, pattern);
      }
    }
  }

  async loadStrategies() {
    const strategiesDir = path.join(process.cwd(), 'core/reasoning/strategies');
    const files = fs.readdirSync(strategiesDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const strategy = await import(path.join(strategiesDir, file));
        this.strategies.set(strategy.name, strategy);
      }
    }
  }

  async loadContext() {
    const contextDir = path.join(process.cwd(), 'core/context/knowledge');
    const files = fs.readdirSync(contextDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const context = JSON.parse(fs.readFileSync(path.join(contextDir, file)));
        this.context.set(context.name, context);
      }
    }
  }

  async reason(input, context = {}) {
    // Apply reasoning patterns
    const patternResults = await this.applyPatterns(input);
    
    // Select and apply strategies
    const strategyResults = await this.applyStrategies(input, patternResults);
    
    // Generate final reasoning
    return this.generateReasoning(input, patternResults, strategyResults, context);
  }

  async applyPatterns(input) {
    const results = new Map();
    
    for (const [name, pattern] of this.patterns) {
      const result = await pattern.apply(input);
      results.set(name, result);
    }
    
    return results;
  }

  async applyStrategies(input, patternResults) {
    const results = new Map();
    
    for (const [name, strategy] of this.strategies) {
      const result = await strategy.apply(input, patternResults);
      results.set(name, result);
    }
    
    return results;
  }

  generateReasoning(input, patternResults, strategyResults, context) {
    return {
      input,
      patterns: Object.fromEntries(patternResults),
      strategies: Object.fromEntries(strategyResults),
      context,
      timestamp: new Date().toISOString(),
      reasoning_id: `reason_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

export { CentralReasoningEngine };
