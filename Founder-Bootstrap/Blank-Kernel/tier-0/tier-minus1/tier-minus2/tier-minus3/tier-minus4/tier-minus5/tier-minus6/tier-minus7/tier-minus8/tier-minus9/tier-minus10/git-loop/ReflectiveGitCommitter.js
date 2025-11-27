// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Reflective Git Committer
 * Creates tone-aware Git commits with semantic meaning
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const http = require('http');

class ReflectiveGitCommitter extends EventEmitter {
    constructor() {
        super();
        this.logsDir = path.join(__dirname, 'logs');
        this.syncLogPath = path.join(__dirname, 'GitSyncLog.json');
        
        // Connect to services
        this.chatProcessorPort = 8080; // For tone analysis
        this.vectorIndexerPort = 7891; // For semantic search
        
        // Tone mappings for commit messages
        this.toneTemplates = {
            curious: ['explores', 'investigates', 'discovers', 'questions'],
            excited: ['implements', 'adds', 'creates', 'launches'],
            anxious: ['fixes', 'patches', 'resolves', 'addresses'],
            reflective: ['refactors', 'contemplates', 'reviews', 'considers'],
            confident: ['establishes', 'deploys', 'completes', 'achieves'],
            harmonious: ['integrates', 'unifies', 'synchronizes', 'aligns']
        };
        
        this.ensureDirectories();
        this.loadSyncLog();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }
    
    loadSyncLog() {
        if (fs.existsSync(this.syncLogPath)) {
            this.syncLog = JSON.parse(fs.readFileSync(this.syncLogPath, 'utf8'));
        } else {
            this.syncLog = {
                commits: [],
                loops: {},
                tone_history: []
            };
        }
    }
    
    saveSyncLog() {
        fs.writeFileSync(this.syncLogPath, JSON.stringify(this.syncLog, null, 2));
    }
    
    async createReflectiveCommit(files, context = {}) {
        console.log('\n🔮 Creating reflective commit...');
        
        try {
            // Analyze changes
            const changes = this.analyzeChanges(files);
            
            // Detect tone
            const tone = await this.detectTone(changes, context);
            
            // Find related loops
            const relatedLoops = await this.findRelatedLoops(changes);
            
            // Generate commit message
            const message = this.generateCommitMessage(changes, tone, relatedLoops);
            
            // Stage files
            this.stageFiles(files);
            
            // Create commit
            const commitHash = this.createCommit(message);
            
            // Update sync log
            this.updateSyncLog(commitHash, files, tone, relatedLoops);
            
            // Emit event
            this.emit('commit_created', {
                hash: commitHash,
                message,
                tone,
                loops: relatedLoops,
                files
            });
            
            console.log(`✓ Commit created: ${commitHash}`);
            console.log(`  Tone: ${tone}`);
            console.log(`  Message: ${message.split('\n')[0]}`);
            
            return commitHash;
            
        } catch (err) {
            console.error('Error creating reflective commit:', err);
            throw err;
        }
    }
    
    analyzeChanges(files) {
        const changes = {
            added: [],
            modified: [],
            deleted: [],
            types: new Set(),
            modules: new Set(),
            total: files.length
        };
        
        files.forEach(file => {
            // Get git status for file
            try {
                const status = execSync(`git status --porcelain "${file}"`, {
                    encoding: 'utf8'
                }).trim();
                
                if (status.startsWith('??') || status.startsWith('A')) {
                    changes.added.push(file);
                } else if (status.startsWith('M')) {
                    changes.modified.push(file);
                } else if (status.startsWith('D')) {
                    changes.deleted.push(file);
                }
                
                // Track file types
                const ext = path.extname(file);
                if (ext) changes.types.add(ext);
                
                // Track modules
                const parts = file.split('/');
                if (parts.length > 1) {
                    changes.modules.add(parts[0]);
                }
                
            } catch (err) {
                // File might not be tracked yet
            }
        });
        
        return changes;
    }
    
    async detectTone(changes, context) {
        // If tone provided in context, use it
        if (context.tone) {
            return context.tone;
        }
        
        // Analyze based on change patterns
        if (changes.deleted.length > changes.added.length) {
            return 'reflective'; // Cleaning up
        }
        
        if (changes.added.length > 5) {
            return 'excited'; // Lots of new stuff
        }
        
        if (changes.types.has('.md') && changes.types.has('.js')) {
            return 'confident'; // Docs and code together
        }
        
        if (changes.modules.size > 3) {
            return 'harmonious'; // Cross-module integration
        }
        
        // Default to curious for exploration
        return 'curious';
    }
    
    async findRelatedLoops(changes) {
        const loops = [];
        
        // Check for loop references in filenames
        changes.added.concat(changes.modified).forEach(file => {
            const loopMatch = file.match(/loop[_-]?(\w+)/i);
            if (loopMatch) {
                loops.push({
                    id: loopMatch[1],
                    file,
                    type: 'filename_reference'
                });
            }
        });
        
        // Check sync log for related commits
        const recentCommits = this.syncLog.commits.slice(-10);
        recentCommits.forEach(commit => {
            changes.modules.forEach(module => {
                if (commit.modules && commit.modules.includes(module)) {
                    commit.loops.forEach(loop => {
                        if (!loops.find(l => l.id === loop.id)) {
                            loops.push({
                                ...loop,
                                type: 'historical_reference'
                            });
                        }
                    });
                }
            });
        });
        
        return loops;
    }
    
    generateCommitMessage(changes, tone, loops) {
        // Select tone-appropriate verb
        const verbs = this.toneTemplates[tone] || this.toneTemplates.curious;
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        
        // Build primary message
        let message = '';
        
        if (changes.added.length > 0) {
            const mainFile = path.basename(changes.added[0]);
            message = `${verb} ${mainFile}`;
            
            if (changes.added.length > 1) {
                message += ` and ${changes.added.length - 1} more`;
            }
        } else if (changes.modified.length > 0) {
            const mainFile = path.basename(changes.modified[0]);
            message = `${verb} ${mainFile}`;
        } else if (changes.deleted.length > 0) {
            message = `removes ${path.basename(changes.deleted[0])}`;
        }
        
        // Add module context
        if (changes.modules.size === 1) {
            message += ` in ${Array.from(changes.modules)[0]}`;
        } else if (changes.modules.size > 1) {
            message += ` across ${changes.modules.size} modules`;
        }
        
        // Add extended description
        const details = [];
        
        // File type summary
        if (changes.types.size > 0) {
            details.push(`Types: ${Array.from(changes.types).join(', ')}`);
        }
        
        // Loop references
        if (loops.length > 0) {
            details.push(`Loops: ${loops.map(l => l.id).join(', ')}`);
        }
        
        // Tone marker
        details.push(`Tone: ${tone}`);
        
        // Stats
        details.push(`Files: +${changes.added.length} ~${changes.modified.length} -${changes.deleted.length}`);
        
        // Combine
        if (details.length > 0) {
            message += '\n\n' + details.join('\n');
        }
        
        // Add semantic marker
        message += '\n\n[Reflective Commit via Cal]';
        
        return message;
    }
    
    stageFiles(files) {
        files.forEach(file => {
            try {
                execSync(`git add "${file}"`, { encoding: 'utf8' });
            } catch (err) {
                console.error(`Failed to stage ${file}:`, err.message);
            }
        });
    }
    
    createCommit(message) {
        try {
            // Create commit
            execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
                encoding: 'utf8'
            });
            
            // Get commit hash
            const hash = execSync('git rev-parse HEAD', {
                encoding: 'utf8'
            }).trim();
            
            return hash;
            
        } catch (err) {
            throw new Error(`Git commit failed: ${err.message}`);
        }
    }
    
    updateSyncLog(commitHash, files, tone, loops) {
        const entry = {
            hash: commitHash,
            timestamp: new Date().toISOString(),
            files,
            tone,
            loops,
            modules: Array.from(new Set(files.map(f => f.split('/')[0])))
        };
        
        this.syncLog.commits.push(entry);
        
        // Update tone history
        this.syncLog.tone_history.push({
            timestamp: entry.timestamp,
            tone,
            commit: commitHash
        });
        
        // Update loop tracking
        loops.forEach(loop => {
            if (!this.syncLog.loops[loop.id]) {
                this.syncLog.loops[loop.id] = {
                    first_seen: entry.timestamp,
                    commits: []
                };
            }
            this.syncLog.loops[loop.id].commits.push(commitHash);
        });
        
        // Keep only last 1000 commits
        if (this.syncLog.commits.length > 1000) {
            this.syncLog.commits = this.syncLog.commits.slice(-1000);
        }
        
        this.saveSyncLog();
    }
    
    async createLoopCommit(loopId, files, metadata = {}) {
        const context = {
            tone: metadata.tone || 'reflective',
            loop_id: loopId
        };
        
        // Add loop to related loops
        const loops = [{
            id: loopId,
            type: 'primary',
            metadata
        }];
        
        // Create commit with loop context
        return this.createReflectiveCommit(files, context);
    }
    
    getToneHistory(limit = 10) {
        return this.syncLog.tone_history.slice(-limit);
    }
    
    getLoopHistory(loopId) {
        return this.syncLog.loops[loopId] || null;
    }
}

// Export for use
module.exports = ReflectiveGitCommitter;

// CLI interface
if (require.main === module) {
    const committer = new ReflectiveGitCommitter();
    const args = process.argv.slice(2);
    
    if (args[0] === 'commit' && args.length > 1) {
        // Commit specified files
        const files = args.slice(1);
        const tone = process.env.COMMIT_TONE || 'curious';
        
        committer.createReflectiveCommit(files, { tone })
            .then(hash => {
                console.log(`\nCommit successful: ${hash}`);
            })
            .catch(err => {
                console.error('Commit failed:', err);
                process.exit(1);
            });
            
    } else if (args[0] === 'tone-history') {
        // Show tone history
        const history = committer.getToneHistory(20);
        console.log('\nRecent tone history:');
        history.forEach(entry => {
            console.log(`${entry.timestamp}: ${entry.tone} (${entry.commit.substring(0, 7)})`);
        });
        
    } else if (args[0] === 'loop' && args[1]) {
        // Show loop history
        const loopHistory = committer.getLoopHistory(args[1]);
        if (loopHistory) {
            console.log(`\nLoop ${args[1]} history:`);
            console.log(`First seen: ${loopHistory.first_seen}`);
            console.log(`Commits: ${loopHistory.commits.length}`);
            loopHistory.commits.slice(-5).forEach(hash => {
                console.log(`  ${hash.substring(0, 7)}`);
            });
        } else {
            console.log(`No history found for loop: ${args[1]}`);
        }
        
    } else {
        console.log('Usage:');
        console.log('  node ReflectiveGitCommitter.js commit <files...>  - Create reflective commit');
        console.log('  node ReflectiveGitCommitter.js tone-history       - Show tone history');
        console.log('  node ReflectiveGitCommitter.js loop <loop-id>     - Show loop history');
        console.log('\nSet COMMIT_TONE environment variable to override tone detection');
    }
}