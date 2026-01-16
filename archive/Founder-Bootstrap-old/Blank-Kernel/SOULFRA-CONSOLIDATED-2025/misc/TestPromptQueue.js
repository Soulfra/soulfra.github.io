#!/usr/bin/env node
/**
 * TestPromptQueue.js
 * Queue system for Claude-readable prompt files to be executed and processed
 * Integrates with existing PLATFORM_LOGGER and queue architecture
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class TestPromptQueue extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.queueDir = options.queueDir || './queue';
        this.processedDir = options.processedDir || './queue/processed';
        this.failedDir = options.failedDir || './queue/failed';
        this.dbPath = options.dbPath || './test_prompt_queue.db';
        
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = options.maxConcurrent || 1;
        this.retryAttempts = options.retryAttempts || 3;
        
        this.stats = {
            total_queued: 0,
            total_processed: 0,
            total_failed: 0,
            total_retries: 0,
            current_queue_size: 0,
            last_processed: null,
            processing_time_avg: 0
        };
        
        this.initializeQueue();
    }

    async initializeQueue() {
        console.log('🗂️ Initializing Test Prompt Queue...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load existing queue state
            await this.loadQueueState();
            
            // Scan for new prompt files
            await this.scanForPrompts();
            
            console.log(`✅ Queue initialized: ${this.queue.length} prompts ready`);
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Queue initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [this.queueDir, this.processedDir, this.failedDir];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    }

    async loadQueueState() {
        const stateFile = path.join(this.queueDir, '.queue-state.json');
        
        if (fs.existsSync(stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                this.stats = { ...this.stats, ...state.stats };
                console.log(`📊 Loaded queue state: ${state.stats.total_processed} processed`);
            } catch (error) {
                console.warn('⚠️ Failed to load queue state, starting fresh');
            }
        }
    }

    async saveQueueState() {
        const stateFile = path.join(this.queueDir, '.queue-state.json');
        const state = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            queue_size: this.queue.length
        };
        
        try {
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save queue state:', error.message);
        }
    }

    async scanForPrompts() {
        if (!fs.existsSync(this.queueDir)) return;
        
        const files = fs.readdirSync(this.queueDir);
        const promptFiles = files.filter(file => 
            file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.prompt')
        );
        
        for (const file of promptFiles) {
            const promptPath = path.join(this.queueDir, file);
            const existing = this.queue.find(item => item.file === file);
            
            if (!existing) {
                const promptItem = await this.createPromptItem(promptPath);
                if (promptItem) {
                    this.queue.push(promptItem);
                    this.stats.total_queued++;
                    console.log(`📄 Queued prompt: ${file}`);
                }
            }
        }
        
        this.stats.current_queue_size = this.queue.length;
    }

    async createPromptItem(promptPath) {
        try {
            const stats = fs.statSync(promptPath);
            const content = fs.readFileSync(promptPath, 'utf8');
            const filename = path.basename(promptPath);
            
            // Parse prompt metadata from content
            const metadata = this.parsePromptMetadata(content);
            
            return {
                id: this.generatePromptId(),
                file: filename,
                path: promptPath,
                content: content,
                metadata: metadata,
                priority: metadata.priority || 'normal',
                retries: 0,
                created_at: stats.birthtime.toISOString(),
                status: 'queued'
            };
            
        } catch (error) {
            console.error(`Failed to create prompt item for ${promptPath}:`, error.message);
            return null;
        }
    }

    parsePromptMetadata(content) {
        const metadata = {
            title: 'Untitled Prompt',
            description: '',
            priority: 'normal',
            tags: [],
            timeout: 30000,
            expected_output: 'text'
        };
        
        // Parse YAML frontmatter or comment metadata
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            try {
                const yamlContent = frontmatterMatch[1];
                const lines = yamlContent.split('\n');
                
                for (const line of lines) {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length) {
                        const value = valueParts.join(':').trim();
                        metadata[key.trim()] = value;
                    }
                }
            } catch (error) {
                console.warn('Failed to parse prompt metadata:', error.message);
            }
        }
        
        // Parse markdown title
        const titleMatch = content.match(/^# (.+)$/m);
        if (titleMatch) {
            metadata.title = titleMatch[1];
        }
        
        return metadata;
    }

    generatePromptId() {
        return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Queue management methods
    async addPrompt(promptContent, metadata = {}) {
        const promptId = this.generatePromptId();
        const filename = `${promptId}.md`;
        const promptPath = path.join(this.queueDir, filename);
        
        // Add metadata as frontmatter
        const frontmatter = Object.keys(metadata).length > 0 
            ? `---\n${Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n`
            : '';
        
        const fullContent = frontmatter + promptContent;
        
        fs.writeFileSync(promptPath, fullContent);
        
        const promptItem = await this.createPromptItem(promptPath);
        if (promptItem) {
            this.queue.push(promptItem);
            this.stats.total_queued++;
            this.stats.current_queue_size = this.queue.length;
            
            console.log(`📝 Added prompt to queue: ${filename}`);
            this.emit('prompt-added', promptItem);
            
            return promptItem;
        }
        
        return null;
    }

    getNextPrompt() {
        // Sort by priority (high -> normal -> low) then by created_at
        this.queue.sort((a, b) => {
            const priorities = { high: 3, normal: 2, low: 1 };
            const aPriority = priorities[a.priority] || 2;
            const bPriority = priorities[b.priority] || 2;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        return this.queue.find(item => item.status === 'queued');
    }

    markPromptProcessing(promptItem) {
        promptItem.status = 'processing';
        promptItem.started_at = new Date().toISOString();
        this.emit('prompt-processing', promptItem);
    }

    async markPromptCompleted(promptItem, result) {
        promptItem.status = 'completed';
        promptItem.completed_at = new Date().toISOString();
        promptItem.result = result;
        
        // Move file to processed directory
        const newPath = path.join(this.processedDir, promptItem.file);
        fs.renameSync(promptItem.path, newPath);
        promptItem.path = newPath;
        
        // Remove from queue
        this.queue = this.queue.filter(item => item.id !== promptItem.id);
        
        this.stats.total_processed++;
        this.stats.current_queue_size = this.queue.length;
        this.stats.last_processed = new Date().toISOString();
        
        // Update processing time average
        const processingTime = new Date(promptItem.completed_at) - new Date(promptItem.started_at);
        this.stats.processing_time_avg = this.stats.processing_time_avg 
            ? (this.stats.processing_time_avg + processingTime) / 2 
            : processingTime;
        
        await this.saveQueueState();
        this.emit('prompt-completed', promptItem);
        
        console.log(`✅ Completed prompt: ${promptItem.file}`);
    }

    async markPromptFailed(promptItem, error) {
        promptItem.retries++;
        promptItem.last_error = error.message;
        promptItem.failed_at = new Date().toISOString();
        
        if (promptItem.retries >= this.retryAttempts) {
            promptItem.status = 'failed';
            
            // Move file to failed directory
            const newPath = path.join(this.failedDir, promptItem.file);
            fs.renameSync(promptItem.path, newPath);
            promptItem.path = newPath;
            
            // Remove from queue
            this.queue = this.queue.filter(item => item.id !== promptItem.id);
            
            this.stats.total_failed++;
            this.stats.current_queue_size = this.queue.length;
            
            await this.saveQueueState();
            this.emit('prompt-failed', promptItem);
            
            console.log(`❌ Failed prompt: ${promptItem.file} (${promptItem.retries} retries)`);
        } else {
            promptItem.status = 'queued';
            this.stats.total_retries++;
            
            this.emit('prompt-retry', promptItem);
            console.log(`🔄 Retrying prompt: ${promptItem.file} (attempt ${promptItem.retries + 1})`);
        }
    }

    // Status and monitoring
    getQueueStatus() {
        return {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            queue: this.queue.map(item => ({
                id: item.id,
                file: item.file,
                priority: item.priority,
                status: item.status,
                retries: item.retries,
                created_at: item.created_at
            }))
        };
    }

    getProcessingItems() {
        return this.queue.filter(item => item.status === 'processing');
    }

    getQueuedItems() {
        return this.queue.filter(item => item.status === 'queued');
    }

    // Cleanup and maintenance
    async cleanup() {
        console.log('🧹 Cleaning up Test Prompt Queue...');
        await this.saveQueueState();
        this.removeAllListeners();
    }
}

module.exports = TestPromptQueue;

// CLI execution
if (require.main === module) {
    const queue = new TestPromptQueue();
    
    queue.on('initialized', () => {
        console.log('Queue initialized successfully');
        
        // Example usage
        queue.addPrompt('# Test Prompt\n\nThis is a test prompt for Claude to process.', {
            priority: 'high',
            tags: 'test,example'
        });
        
        const status = queue.getQueueStatus();
        console.log('Queue status:', JSON.stringify(status, null, 2));
    });
    
    queue.on('error', (error) => {
        console.error('Queue error:', error.message);
        process.exit(1);
    });
}