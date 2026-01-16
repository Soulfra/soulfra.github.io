#!/usr/bin/env node
/**
 * Loop Bundle Exporter
 * Packages loop data for developer/copywriter handoff
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

// Note: archiver is not installed by default
// This implementation provides the structure without the dependency

class LoopBundleExporter {
    constructor() {
        this.exportDir = path.join(__dirname, '../exports');
        this.ledgerDir = path.join(__dirname, '../ledger');
        this.agentDir = path.join(__dirname, '../agents');
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.exportDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async exportLoop(loopId, options = {}) {
        const exportId = `bundle_${loopId}_${Date.now()}`;
        const bundleDir = path.join(this.exportDir, exportId);
        
        // Create bundle directory structure
        this.createBundleStructure(bundleDir);
        
        // Collect all loop data
        const loopData = await this.collectLoopData(loopId);
        
        // Generate README
        const readme = this.generateReadme(loopData, options);
        fs.writeFileSync(path.join(bundleDir, 'README.md'), readme);
        
        // Copy files
        await this.copyLoopFiles(loopData, bundleDir);
        
        // Generate build summary
        const buildSummary = this.generateBuildSummary(loopData);
        fs.writeFileSync(
            path.join(bundleDir, 'build_summary.json'),
            JSON.stringify(buildSummary, null, 2)
        );
        
        // Create diff map if previous version exists
        if (options.previousVersion) {
            const diffMap = await this.createDiffMap(loopId, options.previousVersion);
            fs.writeFileSync(
                path.join(bundleDir, 'diff_map.json'),
                JSON.stringify(diffMap, null, 2)
            );
        }
        
        // Create archive (simulated without archiver dependency)
        const archivePath = await this.createArchive(bundleDir, exportId);
        
        return {
            exportId,
            bundleDir,
            archivePath,
            summary: buildSummary
        };
    }
    
    createBundleStructure(bundleDir) {
        const dirs = [
            bundleDir,
            path.join(bundleDir, 'loop_data'),
            path.join(bundleDir, 'agent_memories'),
            path.join(bundleDir, 'ledger_entries'),
            path.join(bundleDir, 'tone_states'),
            path.join(bundleDir, 'artifacts')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async collectLoopData(loopId) {
        const data = {
            loopId,
            metadata: {},
            whisperOrigin: null,
            agentMemories: [],
            ledgerEntries: [],
            toneStates: [],
            artifacts: [],
            metrics: {}
        };
        
        // Load loop metadata
        const metadataPath = path.join(this.ledgerDir, `loops/${loopId}/metadata.json`);
        if (fs.existsSync(metadataPath)) {
            data.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        // Load whisper origin
        const whisperPath = path.join(this.ledgerDir, `whispers.json`);
        if (fs.existsSync(whisperPath)) {
            const whispers = JSON.parse(fs.readFileSync(whisperPath, 'utf8'));
            data.whisperOrigin = whispers.whispers.find(w => 
                w.loop_proposal_id === loopId
            );
        }
        
        // Collect agent memories
        data.agentMemories = this.collectAgentMemories(loopId);
        
        // Collect ledger entries
        data.ledgerEntries = this.collectLedgerEntries(loopId);
        
        // Collect tone states
        data.toneStates = this.collectToneStates(loopId);
        
        // Collect artifacts
        data.artifacts = this.collectArtifacts(loopId);
        
        // Calculate metrics
        data.metrics = this.calculateMetrics(data);
        
        return data;
    }
    
    collectAgentMemories(loopId) {
        const memories = [];
        const memoryDir = path.join(this.agentDir, 'memories');
        
        if (fs.existsSync(memoryDir)) {
            const files = fs.readdirSync(memoryDir);
            
            files.forEach(file => {
                if (file.includes(loopId)) {
                    const content = fs.readFileSync(
                        path.join(memoryDir, file),
                        'utf8'
                    );
                    
                    memories.push({
                        filename: file,
                        agent: this.extractAgentName(file),
                        content: JSON.parse(content)
                    });
                }
            });
        }
        
        return memories;
    }
    
    collectLedgerEntries(loopId) {
        const entries = [];
        
        // Check various ledger files
        const ledgerFiles = [
            'task_record.json',
            'design_reflections.json',
            'consciousness_ledger.json'
        ];
        
        ledgerFiles.forEach(filename => {
            const filepath = path.join(this.ledgerDir, filename);
            
            if (fs.existsSync(filepath)) {
                const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                
                // Extract entries related to this loop
                if (content.tasks) {
                    entries.push(...content.tasks.filter(t => 
                        t.task_id && t.task_id.includes(loopId)
                    ));
                }
                
                if (content.reflections) {
                    entries.push(...content.reflections.filter(r =>
                        r.loop_id === loopId || 
                        (r.sessionId && r.sessionId.includes(loopId))
                    ));
                }
            }
        });
        
        return entries;
    }
    
    collectToneStates(loopId) {
        const states = [];
        const toneFile = path.join(this.ledgerDir, `loops/${loopId}/tone_trajectory.json`);
        
        if (fs.existsSync(toneFile)) {
            const trajectory = JSON.parse(fs.readFileSync(toneFile, 'utf8'));
            states.push(...trajectory.states);
        }
        
        return states;
    }
    
    collectArtifacts(loopId) {
        const artifacts = [];
        const artifactDir = path.join(this.ledgerDir, `loops/${loopId}/artifacts`);
        
        if (fs.existsSync(artifactDir)) {
            const files = fs.readdirSync(artifactDir);
            
            files.forEach(file => {
                artifacts.push({
                    filename: file,
                    type: this.getArtifactType(file),
                    size: fs.statSync(path.join(artifactDir, file)).size
                });
            });
        }
        
        return artifacts;
    }
    
    calculateMetrics(data) {
        return {
            total_agents: new Set(data.agentMemories.map(m => m.agent)).size,
            total_memories: data.agentMemories.length,
            total_ledger_entries: data.ledgerEntries.length,
            tone_transitions: data.toneStates.length,
            artifacts_generated: data.artifacts.length,
            loop_duration: this.calculateDuration(data),
            resonance_achieved: data.metadata.final_resonance || 0
        };
    }
    
    calculateDuration(data) {
        if (data.metadata.started_at && data.metadata.completed_at) {
            const start = new Date(data.metadata.started_at);
            const end = new Date(data.metadata.completed_at);
            return end - start;
        }
        return 0;
    }
    
    extractAgentName(filename) {
        // Extract agent name from filename pattern
        const match = filename.match(/agent_(\w+)_/);
        return match ? match[1] : 'unknown';
    }
    
    getArtifactType(filename) {
        if (filename.endsWith('.json')) return 'data';
        if (filename.endsWith('.md')) return 'documentation';
        if (filename.endsWith('.js')) return 'code';
        if (filename.endsWith('.png') || filename.endsWith('.jpg')) return 'image';
        return 'other';
    }
    
    generateReadme(loopData, options) {
        const { metadata, whisperOrigin, metrics } = loopData;
        
        return `# Loop Bundle Export

## Loop Information
- **Loop ID**: ${loopData.loopId}
- **Type**: ${metadata.loop_type || 'Unknown'}
- **Status**: ${metadata.status || 'Completed'}
- **Export Date**: ${new Date().toISOString()}
- **Export Reason**: ${options.reason || 'Development handoff'}

## Origin
${whisperOrigin ? `
### Whisper Source
- **ID**: ${whisperOrigin.id}
- **Text**: "${whisperOrigin.whisper_text}"
- **Initial Tone**: ${whisperOrigin.user_tone}
- **QR Code**: ${whisperOrigin.qr_code || 'None'}
` : 'No whisper origin found'}

## Metrics Summary
- **Agents Involved**: ${metrics.total_agents}
- **Memory Entries**: ${metrics.total_memories}
- **Ledger Entries**: ${metrics.total_ledger_entries}
- **Tone Transitions**: ${metrics.tone_transitions}
- **Artifacts Generated**: ${metrics.artifacts_generated}
- **Duration**: ${metrics.loop_duration}ms
- **Final Resonance**: ${metrics.resonance_achieved}

## Bundle Contents

### /loop_data
Core loop configuration and metadata

### /agent_memories
Individual agent memory snapshots throughout the loop

### /ledger_entries
All ledger entries related to this loop

### /tone_states
Complete tone trajectory with timestamps

### /artifacts
Any files or data generated during the loop

## Development Notes
${options.devNotes || 'No additional notes provided'}

## Integration Guide

### For Developers
1. Review loop_data/metadata.json for configuration
2. Check agent_memories/ for behavioral patterns
3. Use tone_states/ to understand emotional flow
4. Reference build_summary.json for technical details

### For Copywriters
1. Focus on tone_states/ for voice consistency
2. Review agent memories for personality traits
3. Check artifacts/ for any generated content
4. Use whisper origin as creative seed

${options.previousVersion ? `
## Version Diff
This bundle includes diff_map.json showing changes from previous version ${options.previousVersion}
` : ''}

---
*Generated by LoopBundleExporter*`;
    }
    
    generateBuildSummary(loopData) {
        return {
            export_metadata: {
                exported_at: new Date().toISOString(),
                loop_id: loopData.loopId,
                bundle_version: '1.0'
            },
            technical_summary: {
                agents_used: [...new Set(loopData.agentMemories.map(m => m.agent))],
                memory_size_bytes: this.calculateMemorySize(loopData.agentMemories),
                ledger_entries: loopData.ledgerEntries.length,
                tone_complexity: this.calculateToneComplexity(loopData.toneStates)
            },
            file_manifest: {
                total_files: this.countTotalFiles(loopData),
                by_type: this.groupFilesByType(loopData)
            },
            dependencies: {
                cal_version: 'v2.0+',
                agent_framework: 'v1.5+',
                required_services: ['cal-riven', 'semantic-api', 'consciousness-ledger']
            }
        };
    }
    
    calculateMemorySize(memories) {
        return memories.reduce((total, mem) => {
            return total + JSON.stringify(mem.content).length;
        }, 0);
    }
    
    calculateToneComplexity(toneStates) {
        const uniqueTones = new Set(toneStates.map(s => s.tone));
        return {
            unique_tones: uniqueTones.size,
            transition_count: toneStates.length - 1,
            complexity_score: uniqueTones.size / Math.max(toneStates.length, 1)
        };
    }
    
    countTotalFiles(loopData) {
        return loopData.agentMemories.length + 
               loopData.artifacts.length + 
               5; // metadata files
    }
    
    groupFilesByType(loopData) {
        const types = {};
        
        loopData.artifacts.forEach(artifact => {
            const type = artifact.type;
            types[type] = (types[type] || 0) + 1;
        });
        
        types['memory'] = loopData.agentMemories.length;
        types['metadata'] = 5;
        
        return types;
    }
    
    async copyLoopFiles(loopData, bundleDir) {
        // Copy agent memories
        loopData.agentMemories.forEach(memory => {
            const destPath = path.join(bundleDir, 'agent_memories', memory.filename);
            fs.writeFileSync(destPath, JSON.stringify(memory.content, null, 2));
        });
        
        // Copy ledger entries
        fs.writeFileSync(
            path.join(bundleDir, 'ledger_entries', 'all_entries.json'),
            JSON.stringify(loopData.ledgerEntries, null, 2)
        );
        
        // Copy tone states
        fs.writeFileSync(
            path.join(bundleDir, 'tone_states', 'trajectory.json'),
            JSON.stringify(loopData.toneStates, null, 2)
        );
        
        // Copy artifacts
        const artifactSourceDir = path.join(this.ledgerDir, `loops/${loopData.loopId}/artifacts`);
        if (fs.existsSync(artifactSourceDir)) {
            loopData.artifacts.forEach(artifact => {
                const sourcePath = path.join(artifactSourceDir, artifact.filename);
                const destPath = path.join(bundleDir, 'artifacts', artifact.filename);
                
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, destPath);
                }
            });
        }
    }
    
    async createDiffMap(loopId, previousVersion) {
        // Simplified diff map without full implementation
        return {
            current_version: loopId,
            previous_version: previousVersion,
            changes: {
                agents: {
                    added: [],
                    removed: [],
                    modified: []
                },
                tone_trajectory: {
                    differences: []
                },
                artifacts: {
                    new_files: [],
                    modified_files: [],
                    deleted_files: []
                }
            },
            summary: 'Diff analysis would be performed here'
        };
    }
    
    async createArchive(bundleDir, exportId) {
        // Without archiver dependency, we'll create a simple tar command
        const archivePath = path.join(this.exportDir, `${exportId}.tar.gz`);
        
        // This would use archiver in production:
        // const archive = archiver('zip', { zlib: { level: 9 } });
        // ... archive code ...
        
        // For now, create a marker file
        fs.writeFileSync(
            archivePath + '.info',
            JSON.stringify({
                note: 'Archive would be created here with archiver package',
                command: `tar -czf ${exportId}.tar.gz ${exportId}/`,
                bundleDir: bundleDir
            }, null, 2)
        );
        
        return archivePath;
    }
}

// CLI interface
if (require.main === module) {
    const exporter = new LoopBundleExporter();
    const args = process.argv.slice(2);
    
    if (args[0] && args[0].startsWith('loop_')) {
        const options = {
            reason: args[1] || 'Manual export',
            previousVersion: args[2] || null,
            devNotes: args[3] || ''
        };
        
        exporter.exportLoop(args[0], options).then(result => {
            console.log('Loop bundle exported successfully!');
            console.log(`Export ID: ${result.exportId}`);
            console.log(`Bundle location: ${result.bundleDir}`);
            console.log(`\nSummary:`);
            console.log(JSON.stringify(result.summary, null, 2));
        }).catch(err => {
            console.error('Export failed:', err);
        });
    } else {
        console.log('Usage:');
        console.log('  node LoopBundleExporter.js <loop_id> [reason] [previous_version] [notes]');
        console.log('  Example: node LoopBundleExporter.js loop_12345 "Client delivery" loop_12300 "Added new agents"');
    }
}

module.exports = LoopBundleExporter;