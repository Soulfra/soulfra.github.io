import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class EncryptionManager {
  constructor() {
    this.keys = new Map();
    this.algorithms = new Map();
    this.initialize();
  }

  async initialize() {
    await this.loadKeys();
    await this.initializeAlgorithms();
  }

  async loadKeys() {
    const keysDir = path.join(process.cwd(), 'layers/encryption/keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }
    
    const keyFiles = fs.readdirSync(keysDir);
    for (const file of keyFiles) {
      if (file.endsWith('.key')) {
        const key = fs.readFileSync(path.join(keysDir, file));
        this.keys.set(file.replace('.key', ''), key);
      }
    }
  }

  async initializeAlgorithms() {
    this.algorithms.set('aes-256-gcm', {
      encrypt: this.encryptAES.bind(this),
      decrypt: this.decryptAES.bind(this)
    });
  }

  async encryptAES(data, keyName = 'master') {
    const key = this.keys.get(keyName);
    if (!key) throw new Error(`Key ${keyName} not found`);
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  async decryptAES(encrypted, iv, authTag, keyName = 'master') {
    const key = this.keys.get(keyName);
    if (!key) throw new Error(`Key ${keyName} not found`);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }

  async rotateKey(keyName) {
    const newKey = crypto.randomBytes(32);
    const keyPath = path.join(process.cwd(), 'layers/encryption/keys', `${keyName}.key`);
    fs.writeFileSync(keyPath, newKey);
    this.keys.set(keyName, newKey);
  }
}

export { EncryptionManager };
