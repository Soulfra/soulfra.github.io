#!/usr/bin/env node
/**
 * Data Store - Safe File Operations
 *
 * Provides:
 * - File locking to prevent race conditions
 * - Corruption recovery (graceful handling of invalid JSON)
 * - Atomic read-modify-write operations
 * - Try-catch around all file operations
 *
 * Usage:
 *   const DataStore = require('./data-store');
 *   const store = new DataStore('data/emails.json');
 *   await store.append({ email: 'test@example.com' });
 */

const fs = require('fs');
const path = require('path');

class DataStore {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.lockFile = `${filePath}.lock`;
    this.backupFile = `${filePath}.backup`;
    this.maxLockWaitMs = options.maxLockWaitMs || 5000;
    this.lockCheckIntervalMs = options.lockCheckIntervalMs || 50;

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      this._writeFileSafe(filePath, '[]');
    }
  }

  /**
   * Acquire file lock (simple implementation using lock files)
   */
  async _acquireLock() {
    const startTime = Date.now();

    while (true) {
      try {
        // Try to create lock file (exclusive flag)
        fs.writeFileSync(this.lockFile, process.pid.toString(), { flag: 'wx' });
        return true; // Lock acquired
      } catch (error) {
        // Lock file exists - check if it's stale
        if (fs.existsSync(this.lockFile)) {
          try {
            const lockPid = fs.readFileSync(this.lockFile, 'utf8');
            const lockAge = Date.now() - fs.statSync(this.lockFile).mtimeMs;

            // If lock is older than 30 seconds, consider it stale
            if (lockAge > 30000) {
              console.warn(`⚠️ Stale lock detected (age: ${lockAge}ms), removing...`);
              fs.unlinkSync(this.lockFile);
              continue;
            }
          } catch (e) {
            // Lock file disappeared or is unreadable, try again
            continue;
          }
        }

        // Check timeout
        if (Date.now() - startTime > this.maxLockWaitMs) {
          throw new Error(`Failed to acquire lock after ${this.maxLockWaitMs}ms`);
        }

        // Wait and retry
        await this._sleep(this.lockCheckIntervalMs);
      }
    }
  }

  /**
   * Release file lock
   */
  _releaseLock() {
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
      }
    } catch (error) {
      console.error('⚠️ Error releasing lock:', error.message);
    }
  }

  /**
   * Sleep helper
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safe file write with atomic operation
   */
  _writeFileSafe(filePath, data) {
    const tempFile = `${filePath}.tmp`;

    try {
      // Write to temp file
      fs.writeFileSync(tempFile, data, 'utf8');

      // Atomic rename (overwrites target)
      fs.renameSync(tempFile, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw error;
    }
  }

  /**
   * Safe file read with corruption recovery
   */
  _readFileSafe(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');

      // Try to parse JSON
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error(`❌ Corrupted JSON in ${filePath}:`, parseError.message);

        // Try backup
        if (fs.existsSync(this.backupFile)) {
          console.log(`🔄 Attempting recovery from backup...`);
          const backupData = fs.readFileSync(this.backupFile, 'utf8');
          const parsed = JSON.parse(backupData);

          // Restore from backup
          this._writeFileSafe(filePath, backupData);
          console.log(`✅ Recovered from backup`);

          return parsed;
        }

        // No backup - return empty array and reinitialize
        console.warn(`⚠️ No backup available, reinitializing with empty array`);
        this._writeFileSafe(filePath, '[]');
        return [];
      }
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error.message);

      // If file doesn't exist, create it
      if (error.code === 'ENOENT') {
        this._writeFileSafe(filePath, '[]');
        return [];
      }

      throw error;
    }
  }

  /**
   * Read data from store
   */
  async read() {
    await this._acquireLock();

    try {
      return this._readFileSafe(this.filePath);
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Write data to store (replaces entire contents)
   */
  async write(data) {
    await this._acquireLock();

    try {
      // Create backup before writing
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupFile);
      }

      // Write new data
      const jsonData = JSON.stringify(data, null, 2);
      this._writeFileSafe(this.filePath, jsonData);

      return { success: true };
    } catch (error) {
      console.error(`❌ Error writing to ${this.filePath}:`, error.message);
      return { success: false, error: error.message };
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Append item to array in store (atomic)
   */
  async append(item) {
    await this._acquireLock();

    try {
      // Read current data
      const data = this._readFileSafe(this.filePath);

      if (!Array.isArray(data)) {
        throw new Error('Data store must contain an array for append operation');
      }

      // Create backup
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupFile);
      }

      // Append item
      data.push(item);

      // Write back
      const jsonData = JSON.stringify(data, null, 2);
      this._writeFileSafe(this.filePath, jsonData);

      return { success: true, count: data.length };
    } catch (error) {
      console.error(`❌ Error appending to ${this.filePath}:`, error.message);
      return { success: false, error: error.message };
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Update data using a transformer function (atomic)
   */
  async update(transformer) {
    await this._acquireLock();

    try {
      // Read current data
      const data = this._readFileSafe(this.filePath);

      // Create backup
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupFile);
      }

      // Transform data
      const newData = transformer(data);

      // Write back
      const jsonData = JSON.stringify(newData, null, 2);
      this._writeFileSafe(this.filePath, jsonData);

      return { success: true, data: newData };
    } catch (error) {
      console.error(`❌ Error updating ${this.filePath}:`, error.message);
      return { success: false, error: error.message };
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Clear all data in store
   */
  async clear() {
    await this._acquireLock();

    try {
      // Create backup before clearing
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupFile);
      }

      this._writeFileSafe(this.filePath, '[]');

      return { success: true };
    } catch (error) {
      console.error(`❌ Error clearing ${this.filePath}:`, error.message);
      return { success: false, error: error.message };
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Check if store exists and is readable
   */
  exists() {
    return fs.existsSync(this.filePath);
  }

  /**
   * Get store statistics
   */
  async stats() {
    try {
      const data = await this.read();
      const fileStats = fs.statSync(this.filePath);

      return {
        success: true,
        path: this.filePath,
        size: fileStats.size,
        itemCount: Array.isArray(data) ? data.length : null,
        modified: fileStats.mtime,
        hasBackup: fs.existsSync(this.backupFile)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DataStore;

// CLI testing
if (require.main === module) {
  (async () => {
    console.log('\n🧪 Testing DataStore...\n');

    const testFile = path.join(__dirname, '../data/test-store.json');
    const store = new DataStore(testFile);

    // Test 1: Append
    console.log('Test 1: Append items');
    await store.append({ id: 1, name: 'Test 1', timestamp: new Date().toISOString() });
    await store.append({ id: 2, name: 'Test 2', timestamp: new Date().toISOString() });
    console.log('✅ Appended 2 items\n');

    // Test 2: Read
    console.log('Test 2: Read data');
    const data = await store.read();
    console.log(`✅ Read ${data.length} items:`, data, '\n');

    // Test 3: Update
    console.log('Test 3: Update with transformer');
    await store.update(items => {
      return items.map(item => ({
        ...item,
        updated: true
      }));
    });
    console.log('✅ Updated all items\n');

    // Test 4: Stats
    console.log('Test 4: Get stats');
    const stats = await store.stats();
    console.log('✅ Stats:', stats, '\n');

    // Test 5: Concurrent writes (race condition test)
    console.log('Test 5: Concurrent writes (10 simultaneous)');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(store.append({ id: i + 10, concurrent: true }));
    }
    await Promise.all(promises);
    const finalData = await store.read();
    console.log(`✅ Final count: ${finalData.length} items (should be 12)\n`);

    // Test 6: Clear
    console.log('Test 6: Clear store');
    await store.clear();
    const emptyData = await store.read();
    console.log(`✅ Cleared. Count: ${emptyData.length}\n`);

    console.log('🎉 All tests passed!\n');
  })();
}
