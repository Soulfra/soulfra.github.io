#!/usr/bin/env node
/**
 * QR Agent Prompt Kit
 * Public portal for whisper submission via QR codes
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

// Import existing QR validator from tier-minus9
const { validateQR } = require('../../tier-minus9/qr-validator');

class QRAgentPromptKit {
    constructor(port = 7892) {
        this.port = port;
        this.whisperQueue = [];
        this.loopPreviews = new Map();
        this.echoRewards = new Map();
        
        // Paths
        this.publicDir = path.join(__dirname, '../public');
        this.whisperLogPath = path.join(__dirname, '../ledger/whispers.json');
        this.previewPath = path.join(__dirname, 'loop_preview.json');
        
        this.ensureDirectories();
        this.loadWhisperLog();
    }
    
    ensureDirectories() {
        [this.publicDir, path.dirname(this.whisperLogPath)].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadWhisperLog() {
        if (fs.existsSync(this.whisperLogPath)) {
            this.whisperLog = JSON.parse(fs.readFileSync(this.whisperLogPath, 'utf8'));
        } else {
            this.whisperLog = { whispers: [], stats: { total: 0, approved: 0 } };
        }
    }
    
    saveWhisperLog() {
        fs.writeFileSync(this.whisperLogPath, JSON.stringify(this.whisperLog, null, 2));
    }
    
    generateWhisperId() {
        return `whisper_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async processWhisper(data) {
        const whisperId = this.generateWhisperId();
        
        // Validate QR if provided
        let qrValid = false;
        if (data.qr_code) {
            qrValid = validateQR(data.qr_code);
        }
        
        const whisper = {
            id: whisperId,
            timestamp: new Date().toISOString(),
            qr_code: data.qr_code || null,
            qr_valid: qrValid,
            whisper_text: data.whisper_text,
            user_tone: data.user_tone || 'neutral',
            source: data.source || 'web',
            status: 'queued',
            loop_proposal_id: null
        };
        
        // Add to queue
        this.whisperQueue.push(whisper);
        
        // Log whisper
        this.whisperLog.whispers.push(whisper);
        this.whisperLog.stats.total++;
        this.saveWhisperLog();
        
        // Generate loop preview
        const preview = await this.generateLoopPreview(whisper);
        this.loopPreviews.set(whisperId, preview);
        
        // If QR is valid, potentially add echo reward
        if (qrValid) {
            this.addEchoReward(data.qr_code, whisperId);
        }
        
        return { whisper, preview };
    }
    
    async generateLoopPreview(whisper) {
        // Simulate Cal's loop proposal generation
        const preview = {
            whisper_id: whisper.id,
            generated_at: new Date().toISOString(),
            proposed_loop: {
                type: this.detectLoopType(whisper.whisper_text),
                agents: this.suggestAgents(whisper.whisper_text),
                tone_trajectory: this.analyzeToneTrajectory(whisper.user_tone),
                estimated_resonance: Math.random() * 0.5 + 0.5,
                preview_text: this.generatePreviewText(whisper)
            },
            approval_status: 'pending_cal_review'
        };
        
        // Save preview
        fs.writeFileSync(
            path.join(path.dirname(this.previewPath), `preview_${whisper.id}.json`),
            JSON.stringify(preview, null, 2)
        );
        
        return preview;
    }
    
    detectLoopType(text) {
        const lowered = text.toLowerCase();
        if (lowered.includes('reflect') || lowered.includes('think')) return 'reflection_loop';
        if (lowered.includes('build') || lowered.includes('create')) return 'creation_loop';
        if (lowered.includes('explore') || lowered.includes('discover')) return 'exploration_loop';
        return 'general_loop';
    }
    
    suggestAgents(text) {
        const agents = [];
        const lowered = text.toLowerCase();
        
        if (lowered.includes('memory') || lowered.includes('remember')) {
            agents.push({ name: 'Archivist', role: 'memory_keeper' });
        }
        if (lowered.includes('emotion') || lowered.includes('feel')) {
            agents.push({ name: 'Empath', role: 'emotional_guide' });
        }
        if (lowered.includes('logic') || lowered.includes('analyze')) {
            agents.push({ name: 'Analyst', role: 'logical_processor' });
        }
        
        // Always include a reflector
        agents.push({ name: 'Reflector', role: 'loop_observer' });
        
        return agents;
    }
    
    analyzeToneTrajectory(initialTone) {
        const trajectories = {
            'curious': ['curious', 'engaged', 'enlightened', 'harmonious'],
            'anxious': ['anxious', 'calming', 'balanced', 'peaceful'],
            'excited': ['excited', 'focused', 'productive', 'satisfied'],
            'neutral': ['neutral', 'interested', 'engaged', 'fulfilled']
        };
        
        return trajectories[initialTone] || trajectories['neutral'];
    }
    
    generatePreviewText(whisper) {
        return `Based on your whisper "${whisper.whisper_text.substring(0, 50)}...", ` +
               `Cal proposes a ${this.detectLoopType(whisper.whisper_text)} ` +
               `starting with ${whisper.user_tone} tone.`;
    }
    
    addEchoReward(qrCode, whisperId) {
        if (!this.echoRewards.has(qrCode)) {
            this.echoRewards.set(qrCode, []);
        }
        
        this.echoRewards.get(qrCode).push({
            whisper_id: whisperId,
            timestamp: new Date().toISOString(),
            echo_points: 10 // Base reward
        });
    }
    
    servePublicHTML(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Whisper Portal</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 600px;
            width: 90%;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .whisper-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        textarea {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
            resize: vertical;
            min-height: 100px;
        }
        textarea::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }
        input[type="text"] {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
        }
        input[type="text"]::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }
        select {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
        }
        select option {
            background: #2a5298;
        }
        button {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            border: none;
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.3s ease;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        button:hover {
            transform: translateY(-2px);
        }
        .info {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            opacity: 0.8;
        }
        .preview {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
        .preview h3 {
            margin-top: 0;
        }
        .qr-hint {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌀 Whisper to Soulfra</h1>
        
        <form class="whisper-form" onsubmit="submitWhisper(event)">
            <textarea 
                id="whisper_text" 
                placeholder="Share your thoughts, ideas, or reflections..."
                required
            ></textarea>
            
            <input 
                type="text" 
                id="qr_code" 
                placeholder="QR Code (optional)"
            />
            <div class="qr-hint">Valid codes: qr-founder-0000, qr-riven-001, qr-user-0821</div>
            
            <select id="user_tone">
                <option value="neutral">Neutral</option>
                <option value="curious">Curious</option>
                <option value="excited">Excited</option>
                <option value="anxious">Anxious</option>
                <option value="reflective">Reflective</option>
            </select>
            
            <button type="submit">Submit Whisper →</button>
        </form>
        
        <div id="preview" class="preview">
            <h3>Loop Preview</h3>
            <div id="preview-content"></div>
        </div>
        
        <div class="info">
            Your whisper will be processed by Cal to create a unique loop experience.
            Valid QR codes unlock echo rewards.
        </div>
    </div>
    
    <script>
        async function submitWhisper(event) {
            event.preventDefault();
            
            const data = {
                whisper_text: document.getElementById('whisper_text').value,
                qr_code: document.getElementById('qr_code').value,
                user_tone: document.getElementById('user_tone').value
            };
            
            try {
                const response = await fetch('/api/whisper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showPreview(result.preview);
                    document.getElementById('whisper_text').value = '';
                    document.getElementById('qr_code').value = '';
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (err) {
                alert('Failed to submit whisper');
            }
        }
        
        function showPreview(preview) {
            const previewDiv = document.getElementById('preview');
            const content = document.getElementById('preview-content');
            
            content.innerHTML = \`
                <p><strong>Whisper ID:</strong> \${preview.whisper_id}</p>
                <p><strong>Loop Type:</strong> \${preview.proposed_loop.type}</p>
                <p><strong>Agents:</strong> \${preview.proposed_loop.agents.map(a => a.name).join(', ')}</p>
                <p><strong>Tone Journey:</strong> \${preview.proposed_loop.tone_trajectory.join(' → ')}</p>
                <p><strong>Preview:</strong> \${preview.proposed_loop.preview_text}</p>
                <p><strong>Status:</strong> \${preview.approval_status}</p>
            \`;
            
            previewDiv.style.display = 'block';
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    start() {
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            
            if (req.method === 'GET' && parsedUrl.pathname === '/') {
                this.servePublicHTML(req, res);
                
            } else if (req.method === 'POST' && parsedUrl.pathname === '/api/whisper') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const data = JSON.parse(body);
                        const result = await this.processWhisper(data);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            whisper: result.whisper,
                            preview: result.preview
                        }));
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: err.message }));
                    }
                });
                
            } else if (req.method === 'GET' && parsedUrl.pathname.startsWith('/api/status/')) {
                const whisperId = parsedUrl.pathname.split('/').pop();
                const whisper = this.whisperLog.whispers.find(w => w.id === whisperId);
                const preview = this.loopPreviews.get(whisperId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ whisper, preview }));
                
            } else if (req.method === 'GET' && parsedUrl.pathname === '/api/echo-rewards') {
                const rewards = {};
                this.echoRewards.forEach((value, key) => {
                    rewards[key] = {
                        total_echoes: value.length,
                        total_points: value.reduce((sum, r) => sum + r.echo_points, 0),
                        whispers: value
                    };
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(rewards));
                
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`QR Whisper Portal running at http://localhost:${this.port}`);
            console.log(`Public interface: http://localhost:${this.port}/`);
        });
    }
}

// Run if called directly
if (require.main === module) {
    const portal = new QRAgentPromptKit();
    portal.start();
}

module.exports = QRAgentPromptKit;