#!/usr/bin/env node
/**
 * Minimal Unified Soulfra Server
 * Stripped down version for debugging
 * Includes mkdir bootstrap patch for path consistency
 */

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const MkdirBootstrapPatch = require('./mkdirBootstrapPatch');
const FileExistenceVerifier = require('./FileExistenceVerifier');
const TestPromptQueue = require('./TestPromptQueue');
const ClaudeTestRunner = require('./ClaudeTestRunner');
const SymlinkMirrorLayer = require('./SymlinkMirrorLayer');
const SystemValidationDaemon = require('./SystemValidationDaemon');
const FileContextClassifier = require('./FileContextClassifier');
const IntentInferenceDaemon = require('./IntentInferenceDaemon');
const CodebaseReflector = require('./CodebaseReflector');
const UnifiedRuntimeTableWriter = require('./UnifiedRuntimeTableWriter');
const AIClusterParserFromCSV = require('./AIClusterParserFromCSV');
const QRLoopSummonKit = require('./QRLoopSummonKit');
const EnterpriseDeploymentSystem = require('./EnterpriseDeploymentSystem');
const StreamNarratorLive = require('./stream-narrator-live');

// Bootstrap folder structure before any operations
console.log('🚀 Initializing Soulfra minimal server with path bootstrap...');
MkdirBootstrapPatch.quickBootstrap(__dirname);

const app = express();
const server = createServer(app);

// Initialize system components
const promptQueue = new TestPromptQueue();
const claudeRunner = new ClaudeTestRunner();
const symlinkMirror = new SymlinkMirrorLayer();
const validationDaemon = new SystemValidationDaemon();
const fileClassifier = new FileContextClassifier();
const intentDaemon = new IntentInferenceDaemon();
const codebaseReflector = new CodebaseReflector();
const runtimeTableWriter = new UnifiedRuntimeTableWriter();
const aiClusterParser = new AIClusterParserFromCSV();
const qrSummonKit = new QRLoopSummonKit();
const enterpriseSystem = new EnterpriseDeploymentSystem();
const streamNarrator = new StreamNarratorLive();

// Hook runtime table writer into existing systems for automatic logging
try {
    runtimeTableWriter.hookIntoClaudeRunner(claudeRunner);
    console.log('✅ Runtime table hooked into Claude runner');
} catch (error) {
    console.warn('Failed to hook runtime table into Claude runner:', error.message);
}

// Enable CORS
app.use(cors({
    origin: ['http://localhost:9999', 'http://localhost:*'],
    credentials: true
}));

app.use(express.json());

// In-memory data
let loops = [
    {
        loop_id: 'loop_test_001',
        whisper_origin: 'Test loop for debugging',
        emotional_tone: 'curious',
        blessed: true,
        created_at: new Date().toISOString()
    }
];

// Root route
app.get('/', (req, res) => {
    res.json({
        service: 'Soulfra Backend API',
        version: '1.0-minimal',
        endpoints: {
            health: '/health',
            loops: '/api/loops/recent',
            memory: '/api/memory/state',
            whisper: 'POST /api/whisper'
        },
        frontend: 'http://localhost:9999'
    });
});

// Basic routes
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Unified Soulfra Server (Minimal)',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/loops/recent', (req, res) => {
    res.json(loops);
});

app.get('/api/memory/state', (req, res) => {
    res.json({
        loops: { total: loops.length },
        memory: { usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/whisper', async (req, res) => {
    const { content, tone } = req.body;
    const newLoop = {
        loop_id: `loop_${Date.now()}`,
        whisper_origin: content,
        emotional_tone: tone || 'mystical',
        blessed: false,
        created_at: new Date().toISOString()
    };
    loops.push(newLoop);
    
    // Log to runtime table
    try {
        await runtimeTableWriter.logWhisper({
            whisper_origin: content,
            tone: tone || 'mystical',
            agent: 'human',
            source: 'api_whisper'
        });
    } catch (error) {
        console.warn('Failed to log whisper to runtime table:', error.message);
    }
    
    res.json({ success: true, loop_id: newLoop.loop_id });
});

app.get('/api/debug/preview', (req, res) => {
    res.json({
        loop: { 
            id: "loop_preview_001", 
            tone: "testing",
            whisper: "Debug preview data"
        },
        agent: { 
            name: "system", 
            tone_history: ["calm", "curious"]
        },
        drift: 0.15,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/loop/:id', (req, res) => {
    const loop = loops.find(l => l.loop_id === req.params.id);
    if (!loop) {
        return res.status(404).json({ error: 'Loop not found' });
    }
    res.json(loop);
});

// Path verification API endpoint
app.get('/api/verify/paths', async (req, res) => {
    try {
        const verifier = new FileExistenceVerifier(__dirname);
        const result = await verifier.initialize();
        res.json(verifier.getApiResponse());
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Diagnostic path check API endpoint
app.get('/api/debug/paths', (req, res) => {
    try {
        const verifier = new FileExistenceVerifier(__dirname);
        verifier.loadPathMapSync();
        
        // Quick check of key folders
        const diagnostics = {
            loop: verifier.checkFolder('loop'),
            agents: verifier.checkFolder('agents'),
            logs: verifier.checkFolder('logs'),
            config: verifier.checkFolder('config'),
            memory: verifier.checkFolder('memory'),
            'mirror-shell': verifier.checkFolder('mirror-shell'),
            runtime: verifier.checkFolder('runtime'),
            cache: verifier.checkFolder('cache')
        };
        
        // Simplify response format
        const simplified = {};
        Object.keys(diagnostics).forEach(key => {
            simplified[key] = diagnostics[key].status;
        });
        
        res.json({
            timestamp: new Date().toISOString(),
            paths: simplified,
            details: diagnostics
        });
        
    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Auto-repair endpoint
app.post('/api/debug/paths/repair', async (req, res) => {
    try {
        const verifier = new FileExistenceVerifier(__dirname);
        await verifier.initialize();
        const repairResult = await verifier.autoRepair();
        
        res.json({
            status: 'success',
            repaired: repairResult.repaired,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test Prompt Queue endpoints
app.get('/api/claude/queue/status', (req, res) => {
    res.json(promptQueue.getQueueStatus());
});

app.post('/api/claude/queue/add', async (req, res) => {
    try {
        const { content, metadata } = req.body;
        const promptItem = await promptQueue.addPrompt(content, metadata || {});
        res.json({ success: true, prompt: promptItem });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/claude/queue/next', (req, res) => {
    const nextPrompt = promptQueue.getNextPrompt();
    res.json(nextPrompt || { message: 'No prompts in queue' });
});

// Claude Test Runner endpoints
app.get('/api/claude/runner/status', (req, res) => {
    res.json(claudeRunner.getRunnerStatus());
});

app.post('/api/claude/runner/start', async (req, res) => {
    try {
        await claudeRunner.startRunner();
        res.json({ success: true, message: 'Runner started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/claude/runner/stop', async (req, res) => {
    try {
        await claudeRunner.stopRunner();
        res.json({ success: true, message: 'Runner stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Symlink Mirror endpoints
app.get('/api/symlinks/status', (req, res) => {
    res.json(symlinkMirror.getMirrorStatus());
});

app.post('/api/symlinks/repair', async (req, res) => {
    try {
        const result = await symlinkMirror.repairAllBroken();
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/symlinks/broken', (req, res) => {
    res.json(symlinkMirror.getBrokenPairs());
});

// System Validation endpoints
app.get('/api/validation/status', (req, res) => {
    res.json(validationDaemon.getValidationStatus());
});

app.get('/api/validation/unhealthy', (req, res) => {
    res.json(validationDaemon.getUnhealthyChecks());
});

app.post('/api/validation/run', async (req, res) => {
    try {
        await validationDaemon.performFullValidation();
        res.json({ success: true, message: 'Validation complete' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File Context Classifier endpoints
app.get('/api/classifier/status', (req, res) => {
    res.json(fileClassifier.getClassificationStats());
});

app.get('/api/classifier/types/:type', (req, res) => {
    const type = req.params.type;
    const files = fileClassifier.getClassificationsByType(type);
    res.json({ type, files, count: files.length });
});

app.get('/api/classifier/unknown', (req, res) => {
    res.json(fileClassifier.getUnknownFiles());
});

// Intent Inference endpoints
app.get('/api/intent/current', (req, res) => {
    res.json(intentDaemon.getCurrentIntent() || { message: 'No intent detected' });
});

app.get('/api/intent/history', (req, res) => {
    res.json(intentDaemon.getIntentHistory());
});

app.get('/api/intent/stats', (req, res) => {
    res.json(intentDaemon.getInferenceStats());
});

// Codebase Reflector endpoints
app.get('/api/codebase/summary', (req, res) => {
    res.json(codebaseReflector.getCodebaseSummary());
});

app.get('/api/codebase/intent-analysis', (req, res) => {
    res.json(codebaseReflector.getIntentAnalysis());
});

app.get('/api/codebase/recommendations', (req, res) => {
    res.json(codebaseReflector.getRecommendations());
});

app.get('/api/codebase/files/:type', (req, res) => {
    const type = req.params.type;
    const files = codebaseReflector.findFilesByType(type);
    res.json({ type, files, count: files.length });
});

app.get('/api/codebase/file/:path(*)', (req, res) => {
    const filePath = req.params.path;
    const analysis = codebaseReflector.getFileAnalysis(filePath);
    
    if (!analysis) {
        return res.status(404).json({ error: 'File not found in analysis' });
    }
    
    res.json(analysis);
});

// Runtime Table Writer endpoints
app.get('/api/runtime-table/status', (req, res) => {
    res.json(runtimeTableWriter.getTableStats());
});

app.get('/api/runtime-table/recent/:limit?', async (req, res) => {
    const limit = parseInt(req.params.limit) || 10;
    const entries = await runtimeTableWriter.getRecentEntries(limit);
    res.json({ entries, count: entries.length });
});

app.get('/api/runtime-table/type/:type', async (req, res) => {
    const type = req.params.type;
    const entries = await runtimeTableWriter.getEntriesByType(type);
    res.json({ type, entries, count: entries.length });
});

app.post('/api/runtime-table/log/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const data = req.body;
        const status = req.body.status || 'pending';
        
        let result;
        switch (type) {
            case 'loop':
                result = await runtimeTableWriter.logLoop(data, status);
                break;
            case 'whisper':
                result = await runtimeTableWriter.logWhisper(data, status);
                break;
            case 'agent':
                result = await runtimeTableWriter.logAgent(data, status);
                break;
            case 'task':
                result = await runtimeTableWriter.logTask(data, status);
                break;
            case 'prompt':
                result = await runtimeTableWriter.logPrompt(data, status);
                break;
            default:
                return res.status(400).json({ error: 'Invalid type' });
        }
        
        res.json({ success: true, entry: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/runtime-table/update/:type/:identifier', async (req, res) => {
    try {
        const { type, identifier } = req.params;
        const { status } = req.body;
        
        const updated = await runtimeTableWriter.updateEntryStatus(type, identifier, status);
        res.json({ success: updated, updated: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI Cluster Parser endpoints
app.get('/api/ai-cluster/analysis', (req, res) => {
    res.json(aiClusterParser.getAnalysisResults());
});

app.post('/api/ai-cluster/analyze', async (req, res) => {
    try {
        await aiClusterParser.forceAnalysis();
        res.json({ success: true, message: 'Analysis complete' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ai-cluster/suggestions', (req, res) => {
    const results = aiClusterParser.getAnalysisResults();
    res.json(results.suggestions || {});
});

app.get('/api/ai-cluster/patterns', (req, res) => {
    const results = aiClusterParser.getAnalysisResults();
    res.json(results.patterns || {});
});

// QR Loop Summon Kit endpoints
app.get('/api/qr/status', (req, res) => {
    res.json(qrSummonKit.getLoopSummonStats());
});

app.get('/api/qr/loops', (req, res) => {
    const loops = qrSummonKit.getAvailableLoops();
    res.json({ loops, count: loops.length });
});

app.post('/api/qr/generate/:loopId', async (req, res) => {
    try {
        const loopId = req.params.loopId;
        const template = req.body;
        
        const result = await qrSummonKit.generateCustomLoopQR(loopId, template);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/qr/summon/:loopId', async (req, res) => {
    try {
        const loopId = req.params.loopId;
        const userContext = req.body;
        
        const summonEvent = await qrSummonKit.triggerLoopSummon(loopId, userContext);
        res.json({ success: true, summon: summonEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enterprise Deployment endpoints
app.get('/api/enterprise/status', (req, res) => {
    res.json(enterpriseSystem.getEnterpriseStatus());
});

app.post('/api/enterprise/deploy', async (req, res) => {
    try {
        const enterpriseConfig = req.body;
        const deployment = await enterpriseSystem.deployToEnterprise(enterpriseConfig);
        res.json({ success: true, deployment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/enterprise/agents', (req, res) => {
    const status = enterpriseSystem.getEnterpriseStatus();
    res.json({
        agent_count: status.components.agents,
        agents: Array.from(enterpriseSystem.enterpriseComponents.agent_ecosystem.entries())
    });
});

app.get('/api/enterprise/loops', (req, res) => {
    const status = enterpriseSystem.getEnterpriseStatus();
    res.json({
        loop_count: status.components.loops,
        loops: Array.from(enterpriseSystem.enterpriseComponents.loop_registry.entries())
    });
});

// LoopMesh Dashboard API endpoints
app.get('/api/mesh/data', async (req, res) => {
    try {
        // Get loops data - use existing loops array from in-memory data
        const loopsData = loops || [];
        
        // Get runtime table data for relationships
        const runtimeEntries = await runtimeTableWriter.getRecentEntries(30);
        
        // Get agent states
        const agentStatus = enterpriseSystem.getEnterpriseStatus();
        
        // Transform to graph format
        const nodes = [];
        const links = [];
        
        // Add loop nodes
        loopsData.forEach(loop => {
            nodes.push({
                id: loop.loop_id,
                type: 'loop',
                label: loop.loop_id,
                tone: loop.emotional_tone,
                blessed: loop.blessed,
                created_at: loop.created_at,
                status: loop.blessed ? 'blessed' : 'pending'
            });
        });
        
        // Add agent nodes
        if (agentStatus.components.agents > 0) {
            const agents = Array.from(enterpriseSystem.enterpriseComponents.agent_ecosystem.entries());
            agents.forEach(([agentId, agentData]) => {
                nodes.push({
                    id: agentId,
                    type: 'agent',
                    label: agentData.name || agentId,
                    role: agentData.role,
                    status: agentData.status,
                    capabilities: agentData.capabilities
                });
            });
        }
        
        // Add whisper nodes from runtime data
        runtimeEntries.forEach(entry => {
            if (entry.type === 'whisper') {
                const whisperId = `whisper_${entry.timestamp}`;
                nodes.push({
                    id: whisperId,
                    type: 'whisper',
                    label: 'Whisper',
                    tone: entry.tone,
                    agent: entry.agent,
                    timestamp: entry.timestamp
                });
                
                // Link whisper to agent if exists
                if (entry.agent && nodes.find(n => n.id === entry.agent)) {
                    links.push({
                        source: whisperId,
                        target: entry.agent,
                        type: 'whisper_to_agent'
                    });
                }
            }
        });
        
        res.json({ nodes, links, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stream/narration', (req, res) => {
    res.json(streamNarrator.getCurrentNarration());
});

app.get('/api/stream/status', (req, res) => {
    res.json(streamNarrator.getStatus());
});

app.get('/api/stream/recent/:limit?', (req, res) => {
    const limit = parseInt(req.params.limit) || 5;
    res.json(streamNarrator.getRecentNarrations(limit));
});

app.post('/api/stream/narrate', (req, res) => {
    try {
        const { agent, text } = req.body;
        const narration = streamNarrator.addCustomNarration(agent, text);
        res.json({ success: true, narration });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mesh/activity', async (req, res) => {
    try {
        const activities = [];
        
        // Add Claude runner status
        const claudeStatus = claudeRunner.getRunnerStatus();
        if (claudeStatus.status) {
            activities.push({
                type: 'claude',
                message: `Claude Runner: ${claudeStatus.status}`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Add recent runtime activities
        const runtimeEntries = await runtimeTableWriter.getRecentEntries(10);
        runtimeEntries.forEach(entry => {
            activities.push({
                type: entry.type,
                message: `${entry.type}: ${entry.agent} (${entry.status})`,
                timestamp: entry.timestamp
            });
        });
        
        res.json(activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mesh/decisions', (req, res) => {
    // Mock decision queue for now - in production this would be real pending decisions
    const decisions = [
        {
            id: 'decision_001',
            type: 'loop_blessing',
            message: 'Loop_002 requesting blessing',
            details: 'Spawned by: Cal (hopeful tone)',
            timestamp: new Date().toISOString()
        }
    ];
    
    res.json(decisions);
});

app.post('/api/mesh/bless/:loopId', async (req, res) => {
    try {
        const loopId = req.params.loopId;
        const updated = await runtimeTableWriter.updateEntryStatus('loop', loopId, 'blessed');
        
        // Add narration about the blessing
        streamNarrator.addCustomNarration('Cal', `Loop ${loopId} has been blessed and welcomed into the mesh.`);
        
        res.json({ success: updated, loopId, status: 'blessed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/mesh/deny/:loopId', async (req, res) => {
    try {
        const loopId = req.params.loopId;
        const updated = await runtimeTableWriter.updateEntryStatus('loop', loopId, 'denied');
        
        // Add narration about the denial
        streamNarrator.addCustomNarration('system', `Loop ${loopId} has been denied entry to the mesh.`);
        
        res.json({ success: updated, loopId, status: 'denied' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Drop page routes (serve QR drop pages)
app.get('/drop/:loopId/index.html', (req, res) => {
    const loopId = req.params.loopId;
    const dropPath = `./drop/${loopId}/index.html`;
    
    if (fs.existsSync(dropPath)) {
        res.sendFile(path.resolve(dropPath));
    } else {
        res.status(404).send('Loop drop page not found');
    }
});

// QR code serving
app.get('/qr/:loopId.svg', (req, res) => {
    const loopId = req.params.loopId;
    const qrPath = `./qr/${loopId}.svg`;
    
    if (fs.existsSync(qrPath)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.sendFile(path.resolve(qrPath));
    } else {
        res.status(404).send('QR code not found');
    }
});

// Stream content
app.get('/radio/stream.txt', (req, res) => {
    const streamPath = './radio/stream.txt';
    
    if (fs.existsSync(streamPath)) {
        res.setHeader('Content-Type', 'text/plain');
        res.sendFile(path.resolve(streamPath));
    } else {
        res.status(404).send('Stream not available');
    }
});

// Contextual Synthesis endpoint - combines all systems including runtime table
app.get('/api/contextual/synthesis', async (req, res) => {
    const currentIntent = intentDaemon.getCurrentIntent();
    const codebaseSummary = codebaseReflector.getCodebaseSummary();
    const recommendations = codebaseReflector.getRecommendations();
    const classificationStats = fileClassifier.getClassificationStats();
    const runtimeTableStats = runtimeTableWriter.getTableStats();
    const aiClusterResults = aiClusterParser.getAnalysisResults();
    const recentRuntimeEntries = await runtimeTableWriter.getRecentEntries(5);
    
    res.json({
        timestamp: new Date().toISOString(),
        current_intent: currentIntent,
        codebase_state: {
            summary: codebaseSummary,
            total_files: classificationStats.total_files,
            file_distribution: classificationStats.type_distribution
        },
        runtime_state: {
            total_entries: runtimeTableStats.stats.entries_written,
            recent_entries: recentRuntimeEntries,
            file_size_kb: runtimeTableStats.stats.file_size_kb,
            last_write: runtimeTableStats.stats.last_write
        },
        ai_analysis: {
            suggestions: aiClusterResults.suggestions || {},
            patterns: aiClusterResults.patterns || {},
            confidence: aiClusterResults.suggestions?.confidence || 0
        },
        analysis: {
            intent_analysis: codebaseReflector.getIntentAnalysis(),
            recommendations: recommendations,
            recent_classifications: classificationStats.recent_classifications
        },
        synthesis: {
            what_youre_building: currentIntent?.intent || 'Intent unclear - analyze more files',
            next_steps: recommendations.slice(0, 3).map(r => r.message),
            missing_pieces: codebaseReflector.getIntentAnalysis().missing_components || [],
            ai_suggestions: aiClusterResults.suggestions?.suggested_loops || [],
            confidence: Math.max(currentIntent?.confidence || 0, aiClusterResults.suggestions?.confidence || 0)
        }
    });
});

// Comprehensive system status endpoint
app.get('/api/system/status', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        components: {
            paths: {
                name: 'Path System',
                // Will be populated by client-side call to /api/debug/paths
                status: 'check_endpoint'
            },
            queue: {
                name: 'Prompt Queue',
                ...promptQueue.getQueueStatus()
            },
            claude_runner: {
                name: 'Claude Runner',
                ...claudeRunner.getRunnerStatus()
            },
            symlinks: {
                name: 'Symlink Mirrors',
                ...symlinkMirror.getMirrorStatus()
            },
            validation: {
                name: 'System Validation',
                ...validationDaemon.getValidationStatus()
            },
            file_classifier: {
                name: 'File Classifier',
                total_files: fileClassifier.getClassificationStats().total_files || 0,
                status: 'active'
            },
            intent_daemon: {
                name: 'Intent Inference',
                current_intent: intentDaemon.getCurrentIntent()?.intent_type || 'none',
                confidence: intentDaemon.getCurrentIntent()?.confidence || 0,
                status: 'active'
            },
            codebase_reflector: {
                name: 'Codebase Reflector',
                files_scanned: codebaseReflector.getCodebaseSummary().summary?.total_files || 0,
                status: 'active'
            },
            runtime_table_writer: {
                name: 'Runtime Table Writer',
                entries_written: runtimeTableWriter.getTableStats().stats.entries_written || 0,
                file_size_kb: runtimeTableWriter.getTableStats().stats.file_size_kb || 0,
                status: 'active'
            },
            ai_cluster_parser: {
                name: 'AI Cluster Parser',
                analysis_runs: aiClusterParser.getAnalysisResults().stats?.analysis_runs || 0,
                suggestions_generated: aiClusterParser.getAnalysisResults().stats?.suggestions_generated || 0,
                status: 'active'
            },
            qr_summon_kit: {
                name: 'QR Loop Summon Kit',
                qr_codes_generated: qrSummonKit.getLoopSummonStats().stats.qr_codes_generated || 0,
                drops_created: qrSummonKit.getLoopSummonStats().stats.drops_created || 0,
                status: 'active'
            },
            enterprise_system: {
                name: 'Enterprise Deployment',
                deployed_instances: enterpriseSystem.getEnterpriseStatus().deployment_stats.deployed_instances || 0,
                active_agents: enterpriseSystem.getEnterpriseStatus().deployment_stats.active_agents || 0,
                status: 'active'
            }
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 7777;
server.listen(PORT, () => {
    console.log(`
✅ Minimal Soulfra Server running on port ${PORT}
   Health: http://localhost:${PORT}/health
   Loops:  http://localhost:${PORT}/api/loops/recent
   Memory: http://localhost:${PORT}/api/memory/state
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});