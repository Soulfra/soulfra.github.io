#!/usr/bin/env node

/**
 * Soulfra MVP: $1 AI Agent System
 * Drop file → Claude analyzes → Spawn agent → Bless → Deploy
 * 
 * ONE WORKING FEATURE - No wrappers, no complexity
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3001; // New clean port

// Middleware
app.use(express.json());
app.use(express.static('public'));

// File upload
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Simple in-memory store (no Redis needed for MVP)
const agents = new Map();
const loops = new Map();
const blessings = new Map();

// Load existing components if available
let chatProcessor = null;
let agentProvisioner = null;
let claudeBridge = null;

// Try to load core components - DISABLED FOR NOW
// We'll add these back once basic flow works
console.log('📦 Running in standalone mode (no external dependencies)')

// === MVP FLOW ===

/**
 * Step 1: Drop a file and analyze
 */
app.post('/api/drop', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`📄 Processing file: ${file.originalname}`);

        // Read file content
        const content = fs.readFileSync(file.path, 'utf8');

        // Always use simple analysis for now
        // We'll add Python processing once basic flow works
        const analysis = simpleAnalyze(content);

        // Generate agent suggestion
        const suggestion = {
            agent: {
                name: `Agent-${Date.now()}`,
                personality: analysis.personality || 'curious',
                skills: analysis.skills || ['reasoning', 'creativity'],
                purpose: analysis.purpose || 'General assistance'
            },
            loop: {
                name: `Loop-${Date.now()}`,
                type: 'reflection',
                frequency: 'daily'
            },
            mask: {
                tone: analysis.tone || 'professional',
                style: 'narrative'
            }
        };

        // Store in memory
        const dropId = `drop-${Date.now()}`;
        agents.set(dropId, suggestion);

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        res.json({
            dropId,
            analysis,
            suggestion,
            next: `/api/spawn/${dropId}`
        });

    } catch (error) {
        console.error('❌ Drop failed:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Step 2: Spawn the agent
 */
app.post('/api/spawn/:dropId', async (req, res) => {
    try {
        const { dropId } = req.params;
        const suggestion = agents.get(dropId);

        if (!suggestion) {
            return res.status(404).json({ error: 'Drop not found' });
        }

        console.log(`🤖 Spawning agent from ${dropId}`);

        // Create agent
        const agent = {
            id: `agent-${Date.now()}`,
            ...suggestion.agent,
            spawned_at: new Date(),
            status: 'active',
            contributor: req.body.contributor || 'anonymous',
            contributed_amount: 1.00
        };

        // If we have the real provisioner, use it
        if (agentProvisioner) {
            const realAgent = await new agentProvisioner().provisionRealAgent({
                contributor_name: agent.contributor,
                contributor_email: req.body.email || 'test@example.com',
                payment_intent_id: `test-${Date.now()}`
            });
            Object.assign(agent, realAgent);
        }

        // Store agent
        agents.set(agent.id, agent);

        // Create loop
        const loop = {
            id: `loop-${Date.now()}`,
            ...suggestion.loop,
            agent_id: agent.id,
            created_at: new Date(),
            blessed: false
        };
        loops.set(loop.id, loop);

        res.json({
            agent,
            loop,
            next: `/api/bless/${loop.id}`
        });

    } catch (error) {
        console.error('❌ Spawn failed:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Step 3: Bless the loop
 */
app.post('/api/bless/:loopId', async (req, res) => {
    try {
        const { loopId } = req.params;
        const loop = loops.get(loopId);

        if (!loop) {
            return res.status(404).json({ error: 'Loop not found' });
        }

        console.log(`✨ Blessing loop ${loopId}`);

        // Create blessing
        const blessing = {
            id: `blessing-${Date.now()}`,
            loop_id: loopId,
            agent_id: loop.agent_id,
            blessed_at: new Date(),
            blessed_by: req.body.blessed_by || 'system',
            status: 'blessed',
            can_propagate: true
        };

        // Update loop
        loop.blessed = true;
        loop.blessing_id = blessing.id;

        // Store blessing
        blessings.set(blessing.id, blessing);

        // Log to CSV
        logToCSV('blessing', blessing);

        res.json({
            blessing,
            loop,
            next: `/api/deploy/${blessing.id}`
        });

    } catch (error) {
        console.error('❌ Blessing failed:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Step 4: Deploy with QR
 */
app.post('/api/deploy/:blessingId', async (req, res) => {
    try {
        const { blessingId } = req.params;
        const blessing = blessings.get(blessingId);

        if (!blessing) {
            return res.status(404).json({ error: 'Blessing not found' });
        }

        const loop = loops.get(blessing.loop_id);
        const agent = agents.get(blessing.agent_id);

        console.log(`🚀 Deploying blessed loop ${loop.id}`);

        // Create drop page
        const dropId = `Drop_${Date.now()}`;
        const dropPath = `drop/${dropId}`;
        fs.mkdirSync(dropPath, { recursive: true });

        // Generate simple drop page
        const dropHtml = generateDropPage(dropId, agent, loop, blessing);
        fs.writeFileSync(`${dropPath}/index.html`, dropHtml);

        // Generate QR code (simple text for now)
        const qrUrl = `http://localhost:${PORT}/drop/${dropId}`;

        res.json({
            deployment: {
                id: dropId,
                url: qrUrl,
                qr: qrUrl, // In production, generate actual QR image
                agent,
                loop,
                blessing
            }
        });

    } catch (error) {
        console.error('❌ Deploy failed:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Step 5: Whisper interface
 */
app.post('/api/whisper/:dropId', async (req, res) => {
    try {
        const { dropId } = req.params;
        const { whisper, tone } = req.body;

        console.log(`🗣️ Whisper received for ${dropId}`);

        // Log whisper
        const whisperEntry = {
            id: `whisper-${Date.now()}`,
            drop_id: dropId,
            whisper,
            tone: tone || 'neutral',
            timestamp: new Date()
        };

        logToCSV('whisper', whisperEntry);

        // If we have Claude bridge, get agent response
        let response = 'Thank you for your whisper';
        if (claudeBridge) {
            const agentResponse = await new claudeBridge().agentThink(
                dropId,
                whisper,
                { tone }
            );
            response = agentResponse.response;
        }

        res.json({
            whisper: whisperEntry,
            response
        });

    } catch (error) {
        console.error('❌ Whisper failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// === HELPER FUNCTIONS ===

function processWithPython(filePath) {
    // Disabled for now to avoid hanging
    return Promise.resolve({ status: 'python disabled' });
}

function simpleAnalyze(content) {
    // Basic analysis when Python processor not available
    const lines = content.split('\n');
    const wordCount = content.split(/\s+/).length;
    
    return {
        lines: lines.length,
        words: wordCount,
        personality: wordCount > 1000 ? 'analytical' : 'concise',
        skills: ['communication', 'analysis'],
        tone: content.includes('!') ? 'enthusiastic' : 'professional',
        purpose: 'Process and understand text content'
    };
}

function logToCSV(type, data) {
    const csvPath = 'data/soulfra_runtime.csv';
    const dir = path.dirname(csvPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create CSV if doesn't exist
    if (!fs.existsSync(csvPath)) {
        const headers = 'timestamp,type,id,data\n';
        fs.writeFileSync(csvPath, headers);
    }
    
    // Append entry
    const row = `${new Date().toISOString()},${type},${data.id},"${JSON.stringify(data)}"\n`;
    fs.appendFileSync(csvPath, row);
}

function generateDropPage(dropId, agent, loop, blessing) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${dropId} - Soulfra Agent</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            background: #000; 
            color: #00ff88; 
            font-family: monospace; 
            padding: 20px;
            text-align: center;
        }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #00ffff; }
        .agent-info {
            background: #111;
            border: 1px solid #00ff88;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        .whisper-form {
            margin: 30px 0;
        }
        textarea {
            width: 100%;
            background: #222;
            color: #00ff88;
            border: 1px solid #00ff88;
            padding: 10px;
            font-family: monospace;
        }
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 10px 30px;
            margin: 10px;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
        }
        button:hover { background: #00cc66; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 ${agent.name}</h1>
        
        <div class="agent-info">
            <p><strong>Personality:</strong> ${agent.personality}</p>
            <p><strong>Skills:</strong> ${agent.skills.join(', ')}</p>
            <p><strong>Purpose:</strong> ${agent.purpose}</p>
            <p><strong>Loop:</strong> ${loop.name} (${loop.type})</p>
            <p><strong>Status:</strong> ✨ Blessed</p>
        </div>
        
        <div class="whisper-form">
            <h2>Whisper to ${agent.name}</h2>
            <textarea id="whisper" rows="4" placeholder="Enter your whisper..."></textarea>
            <br>
            <button onclick="sendWhisper()">Send Whisper</button>
        </div>
        
        <div id="response"></div>
    </div>
    
    <script>
        async function sendWhisper() {
            const whisper = document.getElementById('whisper').value;
            if (!whisper) return;
            
            try {
                const res = await fetch('/api/whisper/${dropId}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ whisper })
                });
                
                const data = await res.json();
                document.getElementById('response').innerHTML = 
                    '<div class="agent-info"><strong>Response:</strong><br>' + 
                    data.response + '</div>';
                    
                document.getElementById('whisper').value = '';
            } catch (e) {
                alert('Failed to send whisper');
            }
        }
    </script>
</body>
</html>`;
}

// === SIMPLE DASHBOARD ===

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Soulfra MVP - $1 AI Agents</title>
    <style>
        body { 
            background: #000; 
            color: #00ff88; 
            font-family: monospace; 
            padding: 40px;
            text-align: center;
        }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #00ffff; font-size: 3em; }
        .upload-area {
            border: 3px dashed #00ff88;
            padding: 60px;
            margin: 40px 0;
            cursor: pointer;
        }
        .upload-area:hover { border-color: #00ffff; }
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 15px 40px;
            font-size: 1.2em;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
        }
        .stats {
            margin: 40px 0;
            font-size: 1.2em;
        }
        #result {
            margin: 40px 0;
            text-align: left;
            background: #111;
            padding: 20px;
            border: 1px solid #00ff88;
            display: none;
        }
        pre { overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Soulfra AI Agents</h1>
        <p style="font-size: 1.5em;">Drop a file → Spawn an agent → $1</p>
        
        <div class="upload-area" onclick="document.getElementById('file').click()">
            <p style="font-size: 1.5em;">📄 Drop your .txt or .md file here</p>
            <input type="file" id="file" style="display:none" accept=".txt,.md" onchange="handleFile(this)">
        </div>
        
        <div class="stats">
            <p>Agents Spawned: ${agents.size}</p>
            <p>Loops Blessed: ${Array.from(loops.values()).filter(l => l.blessed).length}</p>
        </div>
        
        <div id="result"></div>
    </div>
    
    <script>
        async function handleFile(input) {
            const file = input.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            document.getElementById('result').style.display = 'block';
            document.getElementById('result').innerHTML = '<p>⏳ Processing...</p>';
            
            try {
                // Step 1: Drop
                const dropRes = await fetch('/api/drop', {
                    method: 'POST',
                    body: formData
                });
                const dropData = await dropRes.json();
                
                document.getElementById('result').innerHTML = 
                    '<h3>✅ File Analyzed</h3>' +
                    '<pre>' + JSON.stringify(dropData.suggestion, null, 2) + '</pre>' +
                    '<button onclick="spawnAgent(\'' + dropData.dropId + '\')">Spawn Agent ($1)</button>';
                    
            } catch (e) {
                document.getElementById('result').innerHTML = 
                    '<p style="color: #ff0044;">❌ Error: ' + e.message + '</p>';
            }
        }
        
        async function spawnAgent(dropId) {
            try {
                // Step 2: Spawn
                const spawnRes = await fetch('/api/spawn/' + dropId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contributor: 'MVP User' })
                });
                const spawnData = await spawnRes.json();
                
                // Step 3: Auto-bless
                const blessRes = await fetch(spawnData.next, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blessed_by: 'auto' })
                });
                const blessData = await blessRes.json();
                
                // Step 4: Deploy
                const deployRes = await fetch(blessData.next, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const deployData = await deployRes.json();
                
                document.getElementById('result').innerHTML = 
                    '<h3>🎉 Agent Deployed!</h3>' +
                    '<p>Name: ' + deployData.deployment.agent.name + '</p>' +
                    '<p>Personality: ' + deployData.deployment.agent.personality + '</p>' +
                    '<p>Access: <a href="' + deployData.deployment.url + '" target="_blank">' + 
                    deployData.deployment.url + '</a></p>' +
                    '<button onclick="location.reload()">Create Another</button>';
                    
            } catch (e) {
                alert('Failed to spawn agent: ' + e.message);
            }
        }
    </script>
</body>
</html>`);
});

// Serve drop pages
app.use('/drop', express.static('drop'));

// === START SERVER ===

app.listen(PORT, () => {
    console.log('\n🚀 Soulfra MVP Running!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('\n✅ Features:');
    console.log('  • Drop file → Analyze');
    console.log('  • Spawn agent ($1)');
    console.log('  • Auto-bless loop');
    console.log('  • Deploy with QR');
    console.log('  • Whisper interface\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down MVP...');
    process.exit(0);
});