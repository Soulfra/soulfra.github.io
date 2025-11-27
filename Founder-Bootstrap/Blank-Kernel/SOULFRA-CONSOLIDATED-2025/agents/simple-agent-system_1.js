#!/usr/bin/env node

/**
 * SIMPLE AGENT SYSTEM - Actually works!
 * No dependencies, no integrations, just core functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Super simple in-memory storage
const agents = [];
const drops = [];

// Create a simple HTTP server
const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Route: Home page
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Simple Agent System</title>
    <style>
        body { background: #000; color: #0f8; font-family: monospace; padding: 40px; }
        textarea { width: 100%; height: 200px; background: #111; color: #0f8; border: 1px solid #0f8; }
        button { background: #0f8; color: #000; border: none; padding: 10px 20px; cursor: pointer; margin: 10px 0; }
        .result { background: #111; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🤖 Simple Agent System</h1>
    <p>Paste your text and create an AI agent:</p>
    
    <textarea id="content" placeholder="Paste your chat log, notes, or ideas here..."></textarea>
    <br>
    <button onclick="createAgent()">Create Agent ($1)</button>
    
    <div id="result"></div>
    
    <h3>Active Agents: ${agents.length}</h3>
    <div id="agents">${agents.map(a => `<div>• ${a.name} - ${a.personality}</div>`).join('')}</div>
    
    <script>
        async function createAgent() {
            const content = document.getElementById('content').value;
            if (!content) {
                alert('Please enter some content');
                return;
            }
            
            document.getElementById('result').innerHTML = '<p>Creating agent...</p>';
            
            try {
                const response = await fetch('/api/create-agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                
                const agent = await response.json();
                
                document.getElementById('result').innerHTML = 
                    '<div class="result">' +
                    '<h3>✅ Agent Created!</h3>' +
                    '<p>Name: ' + agent.name + '</p>' +
                    '<p>Personality: ' + agent.personality + '</p>' +
                    '<p>Purpose: ' + agent.purpose + '</p>' +
                    '<p>Drop URL: <a href="' + agent.dropUrl + '">' + agent.dropUrl + '</a></p>' +
                    '</div>';
                    
                // Refresh page to show new agent
                setTimeout(() => location.reload(), 3000);
                
            } catch (e) {
                document.getElementById('result').innerHTML = 
                    '<p style="color: red;">Error: ' + e.message + '</p>';
            }
        }
    </script>
</body>
</html>
        `);
    }
    
    // Route: Create agent
    else if (req.url === '/api/create-agent' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { content } = JSON.parse(body);
                
                // Simple content analysis
                const wordCount = content.split(/\s+/).length;
                const hasQuestions = content.includes('?');
                const hasCode = content.includes('```') || content.includes('function');
                
                // Generate agent based on content
                const agent = {
                    id: `agent-${Date.now()}`,
                    name: `Agent-${agents.length + 1}`,
                    personality: hasQuestions ? 'curious' : hasCode ? 'technical' : 'creative',
                    purpose: wordCount > 500 ? 'Deep analysis and insights' : 'Quick help and responses',
                    skills: [
                        hasCode ? 'coding' : 'writing',
                        hasQuestions ? 'research' : 'creativity',
                        'communication'
                    ],
                    created: new Date(),
                    dropId: `drop-${Date.now()}`
                };
                
                // Store agent
                agents.push(agent);
                
                // Create drop page
                const dropHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>${agent.name}</title>
    <style>
        body { background: #000; color: #0f8; font-family: monospace; padding: 40px; text-align: center; }
        .info { background: #111; padding: 20px; margin: 20px auto; max-width: 600px; }
        textarea { width: 100%; background: #111; color: #0f8; border: 1px solid #0f8; }
        button { background: #0f8; color: #000; border: none; padding: 10px 20px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🤖 ${agent.name}</h1>
    <div class="info">
        <p>Personality: ${agent.personality}</p>
        <p>Purpose: ${agent.purpose}</p>
        <p>Skills: ${agent.skills.join(', ')}</p>
    </div>
    
    <h3>Whisper to ${agent.name}:</h3>
    <textarea id="whisper" rows="4"></textarea><br>
    <button onclick="sendWhisper()">Send</button>
    
    <div id="response"></div>
    
    <script>
        function sendWhisper() {
            const whisper = document.getElementById('whisper').value;
            // Simple response based on personality
            const responses = {
                curious: ['That\\'s interesting! Tell me more...', 'I wonder why that is?', 'Have you considered...'],
                technical: ['Let me analyze that...', 'From a technical perspective...', 'The solution might be...'],
                creative: ['What a fascinating idea!', 'Let\\'s explore that creatively...', 'Imagine if we...']
            };
            
            const personality = '${agent.personality}';
            const responseList = responses[personality] || responses.creative;
            const response = responseList[Math.floor(Math.random() * responseList.length)];
            
            document.getElementById('response').innerHTML = 
                '<div style="margin: 20px; padding: 20px; background: #111;">' +
                '<strong>Response:</strong> ' + response +
                '</div>';
        }
    </script>
</body>
</html>
                `;
                
                // Save drop page
                const dropDir = `drops/${agent.dropId}`;
                fs.mkdirSync(dropDir, { recursive: true });
                fs.writeFileSync(`${dropDir}/index.html`, dropHtml);
                
                agent.dropUrl = `http://localhost:${PORT}/drops/${agent.dropId}/`;
                
                // Send response
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(agent));
                
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
    }
    
    // Route: Serve drop pages
    else if (req.url.startsWith('/drops/')) {
        const filePath = req.url.slice(1);
        const fullPath = path.join(__dirname, filePath, 'index.html');
        
        if (fs.existsSync(fullPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(fullPath));
        } else {
            res.writeHead(404);
            res.end('Drop not found');
        }
    }
    
    // 404
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`
🤖 Simple Agent System Running!
📍 URL: http://localhost:${PORT}

✅ What it does:
1. Paste text → Create agent
2. Agent gets personality based on content
3. Each agent gets a drop page
4. Simple whisper interface

NO external dependencies!
NO complex integrations!
JUST WORKS!
    `);
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});