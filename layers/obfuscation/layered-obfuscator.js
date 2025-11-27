import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class LayeredObfuscator {
  constructor() {
    this.layers = new Map();
    this.initialize();
  }

  async initialize() {
    await this.loadLayers();
    await this.initializeEncryption();
  }

  async loadLayers() {
    const layersDir = path.join(process.cwd(), 'layers/obfuscation');
    const layerTypes = ['prompt', 'context', 'response'];
    
    for (const type of layerTypes) {
      const layerPath = path.join(layersDir, type);
      if (fs.existsSync(layerPath)) {
        const layer = await import(path.join(layerPath, 'index.js'));
        this.layers.set(type, layer.default);
      }
    }
  }

  async initializeEncryption() {
    const keyPath = path.join(process.cwd(), 'layers/encryption/keys');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath, { recursive: true });
      const key = crypto.randomBytes(32);
      fs.writeFileSync(path.join(keyPath, 'master.key'), key);
    }
  }

  async obfuscate(input, context = {}) {
    const obfuscationId = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();
    
    // Apply each layer of obfuscation
    let obfuscated = input;
    const layerResults = new Map();
    
    for (const [type, layer] of this.layers) {
      const result = await layer.obfuscate(obfuscated, context);
      obfuscated = result.output;
      layerResults.set(type, {
        success: result.success,
        metadata: result.metadata
      });
    }
    
    return {
      obfuscation_id: obfuscationId,
      timestamp,
      input,
      output: obfuscated,
      layers: Object.fromEntries(layerResults),
      context
    };
  }

  async deobfuscate(input, context = {}) {
    const layerResults = new Map();
    let deobfuscated = input;
    
    // Apply layers in reverse order
    const reversedLayers = Array.from(this.layers.entries()).reverse();
    
    for (const [type, layer] of reversedLayers) {
      const result = await layer.deobfuscate(deobfuscated, context);
      deobfuscated = result.output;
      layerResults.set(type, {
        success: result.success,
        metadata: result.metadata
      });
    }
    
    return {
      input,
      output: deobfuscated,
      layers: Object.fromEntries(layerResults),
      context
    };
  }
}

export { LayeredObfuscator };
