const crypto = require('crypto');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class APIKeyVault {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'billion_dollar_game',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    // Master encryption key - in production, use AWS KMS or similar
    this.masterKey = process.env.VAULT_MASTER_KEY || this.generateMasterKey();
    this.algorithm = 'aes-256-gcm';
  }

  generateMasterKey() {
    // In production, this should be stored securely (e.g., AWS KMS, HashiCorp Vault)
    return crypto.randomBytes(32).toString('hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm, 
      Buffer.from(this.masterKey, 'hex'), 
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.masterKey, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  generateKeyHash(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async storeAPIKey(serviceName, keyName, apiKey, options = {}) {
    try {
      // Encrypt the API key
      const encryptedData = this.encrypt(apiKey);
      const keyHash = this.generateKeyHash(apiKey);
      
      // Store encrypted key with metadata
      const encryptedKey = JSON.stringify(encryptedData);
      
      const query = `
        INSERT INTO api_keys (
          service_name, key_name, encrypted_key, key_hash,
          environment, permissions, rate_limit, expires_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      
      const values = [
        serviceName,
        keyName,
        encryptedKey,
        keyHash,
        options.environment || 'production',
        options.permissions || {},
        options.rateLimit || null,
        options.expiresAt || null,
        options.createdBy || null
      ];
      
      const result = await this.pool.query(query, values);
      
      // Log the action
      await this.logAccess('store', serviceName, keyName, options.createdBy);
      
      return {
        success: true,
        keyId: result.rows[0].id,
        message: 'API key stored successfully'
      };
    } catch (error) {
      console.error('Error storing API key:', error);
      throw new Error('Failed to store API key');
    }
  }

  async retrieveAPIKey(serviceName, keyName, userId = null) {
    try {
      const query = `
        SELECT encrypted_key, permissions, rate_limit, expires_at, is_active
        FROM api_keys
        WHERE service_name = $1 AND key_name = $2 AND is_active = true
      `;
      
      const result = await this.pool.query(query, [serviceName, keyName]);
      
      if (result.rows.length === 0) {
        throw new Error('API key not found');
      }
      
      const keyData = result.rows[0];
      
      // Check if key is expired
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        throw new Error('API key has expired');
      }
      
      // Decrypt the key
      const encryptedData = JSON.parse(keyData.encrypted_key);
      const decryptedKey = this.decrypt(encryptedData);
      
      // Update last used timestamp
      await this.pool.query(
        'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE service_name = $1 AND key_name = $2',
        [serviceName, keyName]
      );
      
      // Log the access
      await this.logAccess('retrieve', serviceName, keyName, userId);
      
      return {
        key: decryptedKey,
        permissions: keyData.permissions,
        rateLimit: keyData.rate_limit
      };
    } catch (error) {
      console.error('Error retrieving API key:', error);
      throw error;
    }
  }

  async rotateAPIKey(serviceName, keyName, newApiKey, userId = null) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Deactivate old key
      await client.query(
        'UPDATE api_keys SET is_active = false WHERE service_name = $1 AND key_name = $2',
        [serviceName, keyName]
      );
      
      // Store new key
      const encryptedData = this.encrypt(newApiKey);
      const keyHash = this.generateKeyHash(newApiKey);
      const encryptedKey = JSON.stringify(encryptedData);
      
      await client.query(`
        INSERT INTO api_keys (
          service_name, key_name, encrypted_key, key_hash, created_by
        ) VALUES ($1, $2, $3, $4, $5)
      `, [serviceName, keyName, encryptedKey, keyHash, userId]);
      
      await client.query('COMMIT');
      
      // Log the rotation
      await this.logAccess('rotate', serviceName, keyName, userId);
      
      return {
        success: true,
        message: 'API key rotated successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error rotating API key:', error);
      throw new Error('Failed to rotate API key');
    } finally {
      client.release();
    }
  }

  async deleteAPIKey(serviceName, keyName, userId = null) {
    try {
      await this.pool.query(
        'UPDATE api_keys SET is_active = false WHERE service_name = $1 AND key_name = $2',
        [serviceName, keyName]
      );
      
      // Log the deletion
      await this.logAccess('delete', serviceName, keyName, userId);
      
      return {
        success: true,
        message: 'API key deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  async listAPIKeys(filters = {}) {
    try {
      let query = `
        SELECT 
          id, service_name, key_name, environment, 
          permissions, rate_limit, last_used, expires_at,
          created_at, is_active
        FROM api_keys
        WHERE 1=1
      `;
      
      const values = [];
      let paramCount = 0;
      
      if (filters.serviceName) {
        query += ` AND service_name = $${++paramCount}`;
        values.push(filters.serviceName);
      }
      
      if (filters.environment) {
        query += ` AND environment = $${++paramCount}`;
        values.push(filters.environment);
      }
      
      if (filters.isActive !== undefined) {
        query += ` AND is_active = $${++paramCount}`;
        values.push(filters.isActive);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await this.pool.query(query, values);
      
      return result.rows.map(row => ({
        ...row,
        hasExpired: row.expires_at && new Date(row.expires_at) < new Date()
      }));
    } catch (error) {
      console.error('Error listing API keys:', error);
      throw new Error('Failed to list API keys');
    }
  }

  async logAccess(action, serviceName, keyName, userId = null) {
    try {
      await this.pool.query(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, changes
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        `api_key_${action}`,
        'api_key',
        null,
        { service: serviceName, key: keyName }
      ]);
    } catch (error) {
      console.error('Error logging API key access:', error);
      // Don't throw - logging errors shouldn't break the main operation
    }
  }

  async exportEnvironmentFile(environment = 'production') {
    try {
      const keys = await this.listAPIKeys({ environment, isActive: true });
      
      let envContent = `# Billion Dollar Game Environment Variables\n`;
      envContent += `# Generated at: ${new Date().toISOString()}\n`;
      envContent += `# Environment: ${environment}\n\n`;
      
      // Add database configuration
      envContent += `# Database Configuration\n`;
      envContent += `DB_HOST=${process.env.DB_HOST || 'localhost'}\n`;
      envContent += `DB_PORT=${process.env.DB_PORT || '5432'}\n`;
      envContent += `DB_NAME=${process.env.DB_NAME || 'billion_dollar_game'}\n`;
      envContent += `DB_USER=${process.env.DB_USER || 'postgres'}\n`;
      envContent += `DB_PASSWORD=${process.env.DB_PASSWORD || 'postgres'}\n\n`;
      
      // Add Redis configuration
      envContent += `# Redis Configuration\n`;
      envContent += `REDIS_HOST=${process.env.REDIS_HOST || 'localhost'}\n`;
      envContent += `REDIS_PORT=${process.env.REDIS_PORT || '6379'}\n`;
      envContent += `REDIS_PASSWORD=${process.env.REDIS_PASSWORD || 'billion_dollar_redis_2024'}\n\n`;
      
      // Add MongoDB configuration
      envContent += `# MongoDB Configuration\n`;
      envContent += `MONGODB_URI=${process.env.MONGODB_URI || 'mongodb://localhost:27017/billion_dollar_game'}\n\n`;
      
      // Add API keys
      envContent += `# API Keys\n`;
      for (const key of keys) {
        const keyData = await this.retrieveAPIKey(key.service_name, key.key_name);
        const envVarName = `${key.service_name.toUpperCase()}_${key.key_name.toUpperCase()}`;
        envContent += `${envVarName}=${keyData.key}\n`;
      }
      
      // Add additional configuration
      envContent += `\n# Application Configuration\n`;
      envContent += `NODE_ENV=${environment}\n`;
      envContent += `PORT=${process.env.PORT || '3000'}\n`;
      envContent += `JWT_SECRET=${process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')}\n`;
      envContent += `VAULT_MASTER_KEY=${this.masterKey}\n`;
      
      return envContent;
    } catch (error) {
      console.error('Error exporting environment file:', error);
      throw new Error('Failed to export environment file');
    }
  }

  async saveEnvironmentFile(filePath, environment = 'production') {
    try {
      const envContent = await this.exportEnvironmentFile(environment);
      await fs.writeFile(filePath, envContent, 'utf8');
      
      // Set restrictive permissions
      await fs.chmod(filePath, 0o600);
      
      return {
        success: true,
        message: `Environment file saved to ${filePath}`
      };
    } catch (error) {
      console.error('Error saving environment file:', error);
      throw new Error('Failed to save environment file');
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = APIKeyVault;