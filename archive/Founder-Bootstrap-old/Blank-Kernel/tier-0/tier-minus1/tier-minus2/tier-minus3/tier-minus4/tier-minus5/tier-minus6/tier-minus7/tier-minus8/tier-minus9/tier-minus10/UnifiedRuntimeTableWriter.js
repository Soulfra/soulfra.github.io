// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * UnifiedRuntimeTableWriter.js
 * Creates and maintains unified_runtime_table.csv for all Soulfra runtime objects
 * Logs loops, whispers, agents, tasks, prompts in structured CSV format
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class UnifiedRuntimeTableWriter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.outputFile = options.outputFile || './data/unified_runtime_table.csv';
        this.logFile = options.logFile || './logs/runtime_table_activity.log';
        this.templateFile = options.templateFile || './Template_unified_runtime_table.csv';
        
        this.columns = [
            'type',
            'timestamp', 
            'tone',
            'agent',
            'source',
            'status',
            'file'
        ];
        
        this.validTypes = ['loop', 'whisper', 'agent', 'task', 'prompt'];
        this.validStatuses = ['pending', 'blessed', 'complete', 'stable', 'executed', 'failed', 'processing'];
        
        this.stats = {
            entries_written: 0,
            last_write: null,
            file_size_kb: 0,
            errors: 0
        };
        
        this.initializeWriter();
    }

    async initializeWriter() {
        console.log('📊 Initializing Unified Runtime Table Writer...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Initialize CSV file if it doesn't exist
            await this.initializeCSVFile();
            
            // Load existing stats
            await this.loadStats();
            
            console.log('✅ Runtime Table Writer initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Runtime table writer initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.outputFile),
            path.dirname(this.logFile),
            './data',
            './agents/suggestions'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async initializeCSVFile() {
        if (!fs.existsSync(this.outputFile)) {
            // Create CSV with headers
            const headers = this.columns.join(',') + '\n';
            fs.writeFileSync(this.outputFile, headers);
            
            // Add template data if template exists
            if (fs.existsSync(this.templateFile)) {
                const templateData = fs.readFileSync(this.templateFile, 'utf8');
                const templateRows = templateData.split('\n').slice(1); // Skip header
                
                for (const row of templateRows) {
                    if (row.trim()) {
                        fs.appendFileSync(this.outputFile, row.trim() + '\n');
                    }
                }
                
                console.log('📋 Loaded template data into runtime table');
            }
        }
        
        // Update stats
        const stats = fs.statSync(this.outputFile);
        this.stats.file_size_kb = Math.round(stats.size / 1024);
    }

    async loadStats() {
        if (fs.existsSync(this.outputFile)) {
            try {
                const content = fs.readFileSync(this.outputFile, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                this.stats.entries_written = Math.max(0, lines.length - 1); // Exclude header
                
                console.log(`📊 Loaded runtime table: ${this.stats.entries_written} entries`);
            } catch (error) {
                console.warn('Failed to load runtime table stats:', error.message);
            }
        }
    }

    // Core logging methods for different runtime objects
    async logLoop(loopData, status = 'pending') {
        const entry = {
            type: 'loop',
            timestamp: new Date().toISOString(),
            tone: loopData.emotional_tone || loopData.tone || 'neutral',
            agent: loopData.agent || loopData.spawned_by || 'system',
            source: loopData.source || loopData.origin || 'autospawn',
            status: status,
            file: loopData.file || loopData.loop_file || `/loop/${loopData.loop_id || 'unknown'}.json`
        };
        
        return await this.writeEntry(entry);
    }

    async logWhisper(whisperData, status = 'pending') {
        const entry = {
            type: 'whisper',
            timestamp: new Date().toISOString(),
            tone: whisperData.emotional_tone || whisperData.tone || 'mystical',
            agent: whisperData.agent || whisperData.whisper_origin || 'human',
            source: whisperData.source || whisperData.origin || 'chatlog',
            status: status,
            file: whisperData.file || whisperData.whisper_file || `/whispers/${Date.now()}.json`
        };
        
        return await this.writeEntry(entry);
    }

    async logAgent(agentData, status = 'stable') {
        const entry = {
            type: 'agent',
            timestamp: new Date().toISOString(),
            tone: agentData.personality || agentData.current_tone || 'neutral',
            agent: agentData.agent_name || agentData.name || agentData.agent_id || 'unknown',
            source: agentData.source || agentData.spawn_source || 'summon',
            status: status,
            file: agentData.file || agentData.agent_file || `/agents/${agentData.agent_name || 'unknown'}.json`
        };
        
        return await this.writeEntry(entry);
    }

    async logTask(taskData, status = 'pending') {
        const entry = {
            type: 'task',
            timestamp: new Date().toISOString(),
            tone: taskData.tone || 'null',
            agent: taskData.agent || taskData.executor || 'system',
            source: taskData.source || taskData.task_source || 'unknown',
            status: status,
            file: taskData.file || taskData.task_file || `/tasks/${Date.now()}.json`
        };
        
        return await this.writeEntry(entry);
    }

    async logPrompt(promptData, status = 'pending') {
        const entry = {
            type: 'prompt',
            timestamp: new Date().toISOString(),
            tone: promptData.tone || 'null',
            agent: 'claude',
            source: promptData.source || promptData.runner || 'ClaudeTestRunner.js',
            status: status,
            file: promptData.file || promptData.prompt_file || `/queue/${promptData.id || Date.now()}.txt`
        };
        
        return await this.writeEntry(entry);
    }

    async writeEntry(entry) {
        try {
            // Validate entry
            const validatedEntry = this.validateEntry(entry);
            
            // Convert to CSV row
            const csvRow = this.columns.map(col => {
                const value = validatedEntry[col] || '';
                // Escape commas and quotes in CSV
                if (value.includes(',') || value.includes('"')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
            
            // Append to file
            fs.appendFileSync(this.outputFile, csvRow + '\n');
            
            // Update stats
            this.stats.entries_written++;
            this.stats.last_write = new Date().toISOString();
            
            // Update file size
            const stats = fs.statSync(this.outputFile);
            this.stats.file_size_kb = Math.round(stats.size / 1024);
            
            // Log activity
            this.logActivity(`WRITE: ${entry.type} | ${entry.agent} | ${entry.status} | ${entry.file}`);
            
            this.emit('entry-written', validatedEntry);
            
            return validatedEntry;
            
        } catch (error) {
            this.stats.errors++;
            console.error('Failed to write runtime table entry:', error.message);
            this.logActivity(`ERROR: ${error.message}`);
            throw error;
        }
    }

    validateEntry(entry) {
        const validated = { ...entry };
        
        // Validate type
        if (!this.validTypes.includes(validated.type)) {
            throw new Error(`Invalid type: ${validated.type}`);
        }
        
        // Validate status
        if (!this.validStatuses.includes(validated.status)) {
            console.warn(`Unknown status: ${validated.status}, using 'pending'`);
            validated.status = 'pending';
        }
        
        // Ensure required fields
        validated.timestamp = validated.timestamp || new Date().toISOString();
        validated.tone = validated.tone || 'neutral';
        validated.agent = validated.agent || 'system';
        validated.source = validated.source || 'unknown';
        validated.file = validated.file || '/unknown';
        
        // Clean values
        Object.keys(validated).forEach(key => {
            if (typeof validated[key] === 'string') {
                validated[key] = validated[key].trim();
            }
        });
        
        return validated;
    }

    logActivity(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} | ${message}\n`;
        
        try {
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            console.warn('Failed to write activity log:', error.message);
        }
    }

    // Utility methods
    async updateEntryStatus(type, identifier, newStatus) {
        try {
            // Read current CSV
            const content = fs.readFileSync(this.outputFile, 'utf8');
            const lines = content.split('\n');
            
            // Find and update the entry
            let updated = false;
            for (let i = 1; i < lines.length; i++) { // Skip header
                const row = lines[i];
                if (!row.trim()) continue;
                
                const fields = this.parseCSVRow(row);
                if (fields.length >= this.columns.length) {
                    const entryType = fields[0];
                    const entryFile = fields[6];
                    
                    if (entryType === type && entryFile.includes(identifier)) {
                        // Update status (column index 5)
                        fields[5] = newStatus;
                        lines[i] = fields.map(field => 
                            field.includes(',') || field.includes('"') ? `"${field.replace(/"/g, '""')}"` : field
                        ).join(',');
                        updated = true;
                        break;
                    }
                }
            }
            
            if (updated) {
                fs.writeFileSync(this.outputFile, lines.join('\n'));
                this.logActivity(`UPDATE: ${type} | ${identifier} | ${newStatus}`);
                this.emit('entry-updated', { type, identifier, newStatus });
            }
            
            return updated;
            
        } catch (error) {
            console.error('Failed to update entry status:', error.message);
            return false;
        }
    }

    parseCSVRow(row) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        fields.push(currentField); // Add last field
        return fields;
    }

    // API methods
    getTableStats() {
        return {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            file_path: this.outputFile,
            columns: this.columns,
            valid_types: this.validTypes,
            valid_statuses: this.validStatuses
        };
    }

    async getRecentEntries(limit = 10) {
        try {
            const content = fs.readFileSync(this.outputFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const entries = [];
            const start = Math.max(1, lines.length - limit); // Skip header
            
            for (let i = start; i < lines.length; i++) {
                const fields = this.parseCSVRow(lines[i]);
                if (fields.length >= this.columns.length) {
                    const entry = {};
                    this.columns.forEach((col, idx) => {
                        entry[col] = fields[idx];
                    });
                    entries.push(entry);
                }
            }
            
            return entries.reverse(); // Most recent first
            
        } catch (error) {
            console.error('Failed to get recent entries:', error.message);
            return [];
        }
    }

    async getEntriesByType(type) {
        try {
            const content = fs.readFileSync(this.outputFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const entries = [];
            
            for (let i = 1; i < lines.length; i++) { // Skip header
                const fields = this.parseCSVRow(lines[i]);
                if (fields.length >= this.columns.length && fields[0] === type) {
                    const entry = {};
                    this.columns.forEach((col, idx) => {
                        entry[col] = fields[idx];
                    });
                    entries.push(entry);
                }
            }
            
            return entries;
            
        } catch (error) {
            console.error('Failed to get entries by type:', error.message);
            return [];
        }
    }

    // Integration hooks for existing systems
    hookIntoLoopBlessing(loopSystem) {
        if (loopSystem && typeof loopSystem.on === 'function') {
            loopSystem.on('loop-blessed', async (loopData) => {
                await this.logLoop(loopData, 'blessed');
            });
        }
    }

    hookIntoWhisperIngest(whisperSystem) {
        if (whisperSystem && typeof whisperSystem.on === 'function') {
            whisperSystem.on('whisper-ingested', async (whisperData) => {
                await this.logWhisper(whisperData, 'pending');
            });
        }
    }

    hookIntoClaudeRunner(claudeRunner) {
        if (claudeRunner && typeof claudeRunner.on === 'function') {
            claudeRunner.on('prompt-executed', async (promptData) => {
                await this.logPrompt(promptData, 'executed');
            });
            
            claudeRunner.on('prompt-failed', async (promptData) => {
                await this.logPrompt(promptData, 'failed');
            });
        }
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Runtime Table Writer...');
        this.logActivity('CLEANUP: Runtime table writer shutting down');
        this.removeAllListeners();
    }
}

module.exports = UnifiedRuntimeTableWriter;

// CLI execution
if (require.main === module) {
    const writer = new UnifiedRuntimeTableWriter();
    
    writer.on('initialized', () => {
        console.log('Runtime Table Writer initialized successfully');
        
        // Test with sample data
        writer.logLoop({
            loop_id: 'test_001',
            emotional_tone: 'curious',
            agent: 'cal',
            source: 'test_script'
        }, 'blessed');
        
        writer.logWhisper({
            whisper_origin: 'test whisper',
            tone: 'mystical',
            agent: 'human'
        });
        
        const stats = writer.getTableStats();
        console.log('Table stats:', JSON.stringify(stats, null, 2));
    });
    
    writer.on('entry-written', (entry) => {
        console.log(`📝 Entry written: ${entry.type} | ${entry.agent} | ${entry.status}`);
    });
    
    writer.on('error', (error) => {
        console.error('Runtime table writer error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down runtime table writer...');
        await writer.cleanup();
        process.exit(0);
    });
}