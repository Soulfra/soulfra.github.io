// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Cal Drop Watcher
 * Monitors incoming directory for new files and routes them
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class CalDropWatcher extends EventEmitter {
    constructor() {
        super();
        this.watchDir = path.join(__dirname, 'incoming');
        this.processedDir = path.join(__dirname, 'processed');
        this.queueDir = path.join(__dirname, 'queue');
        this.logsDir = path.join(__dirname, 'logs');
        
        // Track processed files to avoid duplicates
        this.processedFiles = new Set();
        this.activeProcessing = new Map();
        
        this.ensureDirectories();
        this.loadProcessedHistory();
    }
    
    ensureDirectories() {
        [this.watchDir, this.processedDir, this.queueDir, this.logsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadProcessedHistory() {
        const historyFile = path.join(this.logsDir, 'processed_history.json');
        if (fs.existsSync(historyFile)) {
            try {
                const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                this.processedFiles = new Set(history.files || []);
            } catch (err) {
                console.error('Error loading history:', err);
            }
        }
    }
    
    saveProcessedHistory() {
        const historyFile = path.join(this.logsDir, 'processed_history.json');
        const history = {
            files: Array.from(this.processedFiles),
            updated: new Date().toISOString()
        };
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    }
    
    start() {
        console.log(`Cal Drop Watcher started`);
        console.log(`Watching: ${this.watchDir}`);
        console.log(`Drop files here to process them automatically`);
        
        // Process any existing files
        this.scanExistingFiles();
        
        // Watch for new files
        this.watcher = fs.watch(this.watchDir, (eventType, filename) => {
            if (eventType === 'rename' && filename) {
                this.handleFileEvent(filename);
            }
        });
        
        // Also poll periodically for missed events
        this.pollInterval = setInterval(() => {
            this.scanExistingFiles();
        }, 5000);
    }
    
    stop() {
        if (this.watcher) {
            this.watcher.close();
        }
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        console.log('Cal Drop Watcher stopped');
    }
    
    scanExistingFiles() {
        try {
            const files = fs.readdirSync(this.watchDir);
            
            files.forEach(filename => {
                if (!this.shouldProcess(filename)) return;
                
                const filepath = path.join(this.watchDir, filename);
                const stat = fs.statSync(filepath);
                
                if (stat.isFile() && !this.isProcessed(filename)) {
                    this.processFile(filename);
                }
            });
        } catch (err) {
            console.error('Error scanning directory:', err);
        }
    }
    
    handleFileEvent(filename) {
        if (!this.shouldProcess(filename)) return;
        
        // Small delay to ensure file is fully written
        setTimeout(() => {
            const filepath = path.join(this.watchDir, filename);
            
            if (fs.existsSync(filepath) && !this.isProcessed(filename)) {
                this.processFile(filename);
            }
        }, 100);
    }
    
    shouldProcess(filename) {
        // Skip hidden files and system files
        if (filename.startsWith('.') || filename.startsWith('~')) {
            return false;
        }
        
        // Skip if already processing
        if (this.activeProcessing.has(filename)) {
            return false;
        }
        
        return true;
    }
    
    isProcessed(filename) {
        return this.processedFiles.has(filename);
    }
    
    async processFile(filename) {
        console.log(`\n📥 New file detected: ${filename}`);
        
        // Mark as processing
        this.activeProcessing.set(filename, Date.now());
        
        try {
            const filepath = path.join(this.watchDir, filename);
            const stat = fs.statSync(filepath);
            
            // Create file metadata
            const fileInfo = {
                id: this.generateFileId(filename),
                filename,
                filepath,
                type: path.extname(filename).toLowerCase(),
                size: stat.size,
                detected_at: new Date().toISOString(),
                content_hash: await this.hashFile(filepath)
            };
            
            // Emit event for processing
            this.emit('file_detected', fileInfo);
            
            // Queue the file
            await this.queueFile(fileInfo);
            
            // Mark as processed
            this.processedFiles.add(filename);
            this.saveProcessedHistory();
            
            // Log the event
            this.logFileEvent(fileInfo, 'detected');
            
            console.log(`✓ File queued for processing: ${filename}`);
            
        } catch (err) {
            console.error(`Error processing ${filename}:`, err);
            this.emit('error', { filename, error: err });
        } finally {
            this.activeProcessing.delete(filename);
        }
    }
    
    generateFileId(filename) {
        return `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async hashFile(filepath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filepath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }
    
    async queueFile(fileInfo) {
        // Create queue entry
        const queueEntry = {
            ...fileInfo,
            status: 'queued',
            queued_at: new Date().toISOString()
        };
        
        // Save to queue directory
        const queueFile = path.join(this.queueDir, `${fileInfo.id}.json`);
        fs.writeFileSync(queueFile, JSON.stringify(queueEntry, null, 2));
        
        // Move original file to queue
        const queuedFilePath = path.join(this.queueDir, fileInfo.filename);
        fs.renameSync(fileInfo.filepath, queuedFilePath);
        
        // Update file info with new path
        queueEntry.filepath = queuedFilePath;
        fs.writeFileSync(queueFile, JSON.stringify(queueEntry, null, 2));
    }
    
    logFileEvent(fileInfo, event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            file: {
                id: fileInfo.id,
                name: fileInfo.filename,
                type: fileInfo.type,
                size: fileInfo.size,
                hash: fileInfo.content_hash
            }
        };
        
        // Append to daily log
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logsDir, `cal-drop-${today}.log`);
        
        fs.appendFileSync(
            logFile,
            JSON.stringify(logEntry) + '\n'
        );
    }
    
    getStats() {
        return {
            watching: this.watchDir,
            processed_count: this.processedFiles.size,
            currently_processing: this.activeProcessing.size,
            queue_size: fs.readdirSync(this.queueDir).filter(f => f.endsWith('.json')).length
        };
    }
}

// Export for use by IntentRouter
module.exports = CalDropWatcher;

// Run if called directly
if (require.main === module) {
    const watcher = new CalDropWatcher();
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\nShutting down Cal Drop Watcher...');
        watcher.stop();
        process.exit(0);
    });
    
    // Start watching
    watcher.start();
    
    // Log stats periodically
    setInterval(() => {
        const stats = watcher.getStats();
        console.log(`\n📊 Stats: Processed: ${stats.processed_count}, Queue: ${stats.queue_size}`);
    }, 30000);
}