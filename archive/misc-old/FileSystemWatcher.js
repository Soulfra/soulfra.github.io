#!/usr/bin/env node
/**
 * FileSystemWatcher.js
 * Monitors file system for new directories and files
 * Emits events for the Rules Orchestrator to handle
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class FileSystemWatcher extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.rootPath = options.rootPath || process.cwd();
        this.ignorePatterns = options.ignorePatterns || [
            '**/node_modules/**',
            '**/.git/**',
            '**/logs/**',
            '**/.next/**',
            '**/dist/**',
            '**/build/**'
        ];
        
        this.watchInterval = options.watchInterval || 2000; // 2 seconds
        this.debounceDelay = options.debounceDelay || 500; // 500ms debounce
        
        this.watchers = new Map();
        this.fileState = new Map();
        this.pendingEvents = new Map();
        this.running = false;
        
        this.stats = {
            directoriesWatched: 0,
            filesTracked: 0,
            eventsEmitted: 0
        };
    }
    
    async start() {
        if (this.running) {
            console.log('FileSystemWatcher already running');
            return;
        }
        
        this.running = true;
        console.log(`👁️  Starting FileSystemWatcher on ${this.rootPath}`);
        
        // Initial scan
        await this.scanDirectory(this.rootPath);
        
        // Setup recursive watching
        this.setupWatchers(this.rootPath);
        
        console.log(`✅ Watching ${this.stats.directoriesWatched} directories`);
        this.emit('started');
    }
    
    async stop() {
        this.running = false;
        
        // Close all watchers
        for (const [dir, watcher] of this.watchers) {
            watcher.close();
        }
        
        this.watchers.clear();
        this.fileState.clear();
        this.pendingEvents.clear();
        
        console.log('✅ FileSystemWatcher stopped');
        this.emit('stopped');
    }
    
    async scanDirectory(dirPath) {
        if (this.shouldIgnore(dirPath)) {
            return;
        }
        
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (this.shouldIgnore(fullPath)) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    this.stats.directoriesWatched++;
                    // Recurse into subdirectory
                    await this.scanDirectory(fullPath);
                } else if (entry.isFile()) {
                    // Track file state
                    const stats = await fs.promises.stat(fullPath);
                    this.fileState.set(fullPath, {
                        size: stats.size,
                        mtime: stats.mtime.getTime(),
                        exists: true
                    });
                    this.stats.filesTracked++;
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error.message);
        }
    }
    
    setupWatchers(dirPath) {
        if (this.shouldIgnore(dirPath) || this.watchers.has(dirPath)) {
            return;
        }
        
        try {
            const watcher = fs.watch(dirPath, { persistent: false }, (eventType, filename) => {
                if (!filename || this.shouldIgnore(filename)) {
                    return;
                }
                
                const fullPath = path.join(dirPath, filename);
                this.handleFileSystemEvent(eventType, fullPath);
            });
            
            this.watchers.set(dirPath, watcher);
            
            // Watch subdirectories
            fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
                if (err) return;
                
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const subDir = path.join(dirPath, entry.name);
                        if (!this.shouldIgnore(subDir)) {
                            this.setupWatchers(subDir);
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error(`Error setting up watcher for ${dirPath}:`, error.message);
        }
    }
    
    handleFileSystemEvent(eventType, fullPath) {
        // Debounce events
        const existingTimeout = this.pendingEvents.get(fullPath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        const timeout = setTimeout(() => {
            this.processFileSystemEvent(eventType, fullPath);
            this.pendingEvents.delete(fullPath);
        }, this.debounceDelay);
        
        this.pendingEvents.set(fullPath, timeout);
    }
    
    async processFileSystemEvent(eventType, fullPath) {
        try {
            const exists = fs.existsSync(fullPath);
            const stats = exists ? await fs.promises.stat(fullPath) : null;
            const previousState = this.fileState.get(fullPath);
            
            if (stats && stats.isDirectory()) {
                if (!previousState || !previousState.exists) {
                    // New directory created
                    console.log(`📁 New directory: ${fullPath}`);
                    this.stats.eventsEmitted++;
                    this.emit('directory-created', fullPath);
                    
                    // Setup watcher for new directory
                    this.setupWatchers(fullPath);
                    
                    // Scan for any files already in it
                    await this.scanDirectory(fullPath);
                }
            } else if (stats && stats.isFile()) {
                if (!previousState || !previousState.exists) {
                    // New file created
                    console.log(`📄 New file: ${fullPath}`);
                    this.stats.eventsEmitted++;
                    this.emit('file-created', fullPath);
                    
                    this.fileState.set(fullPath, {
                        size: stats.size,
                        mtime: stats.mtime.getTime(),
                        exists: true
                    });
                    this.stats.filesTracked++;
                } else if (previousState.mtime < stats.mtime.getTime()) {
                    // File modified
                    this.stats.eventsEmitted++;
                    this.emit('file-modified', fullPath);
                    
                    this.fileState.set(fullPath, {
                        size: stats.size,
                        mtime: stats.mtime.getTime(),
                        exists: true
                    });
                }
            } else if (!exists && previousState && previousState.exists) {
                // File or directory deleted
                if (this.watchers.has(fullPath)) {
                    // Directory deleted
                    console.log(`🗑️  Directory deleted: ${fullPath}`);
                    this.stats.eventsEmitted++;
                    this.emit('directory-deleted', fullPath);
                    
                    // Close watcher
                    this.watchers.get(fullPath).close();
                    this.watchers.delete(fullPath);
                    this.stats.directoriesWatched--;
                } else {
                    // File deleted
                    console.log(`🗑️  File deleted: ${fullPath}`);
                    this.stats.eventsEmitted++;
                    this.emit('file-deleted', fullPath);
                    
                    this.fileState.delete(fullPath);
                    this.stats.filesTracked--;
                }
            }
            
        } catch (error) {
            console.error(`Error processing event for ${fullPath}:`, error.message);
        }
    }
    
    shouldIgnore(filePath) {
        // Normalize path for consistent checking
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // Check against ignore patterns
        for (const pattern of this.ignorePatterns) {
            if (this.matchPattern(normalizedPath, pattern)) {
                return true;
            }
        }
        
        // Also ignore hidden files/directories (starting with .)
        const basename = path.basename(filePath);
        if (basename.startsWith('.') && basename !== '.rules') {
            return true;
        }
        
        return false;
    }
    
    matchPattern(filePath, pattern) {
        // Simple glob pattern matching
        // Convert glob to regex
        const regexPattern = pattern
            .replace(/\*/g, '[^/]*')
            .replace(/\*\*/g, '.*')
            .replace(/\?/g, '[^/]');
            
        const regex = new RegExp(regexPattern);
        return regex.test(filePath);
    }
    
    getStatus() {
        return {
            running: this.running,
            rootPath: this.rootPath,
            stats: { ...this.stats },
            watchedDirectories: Array.from(this.watchers.keys()),
            trackedFiles: this.fileState.size
        };
    }
    
    getTrackedFiles() {
        const files = [];
        for (const [filePath, state] of this.fileState) {
            if (state.exists) {
                files.push({
                    path: filePath,
                    size: state.size,
                    modified: new Date(state.mtime)
                });
            }
        }
        return files;
    }
}

module.exports = FileSystemWatcher;

// CLI testing
if (require.main === module) {
    const watcher = new FileSystemWatcher({
        rootPath: process.argv[2] || process.cwd()
    });
    
    watcher.on('directory-created', (dir) => {
        console.log('Event: Directory created:', dir);
    });
    
    watcher.on('file-created', (file) => {
        console.log('Event: File created:', file);
    });
    
    watcher.on('file-modified', (file) => {
        console.log('Event: File modified:', file);
    });
    
    watcher.on('file-deleted', (file) => {
        console.log('Event: File deleted:', file);
    });
    
    watcher.on('directory-deleted', (dir) => {
        console.log('Event: Directory deleted:', dir);
    });
    
    watcher.start().then(() => {
        console.log('Watcher started. Press Ctrl+C to stop.');
    });
    
    process.on('SIGINT', async () => {
        console.log('\nStopping watcher...');
        await watcher.stop();
        process.exit(0);
    });
}