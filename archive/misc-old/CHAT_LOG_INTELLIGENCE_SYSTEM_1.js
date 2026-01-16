from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env node

/**
 * 🧠 CHAT LOG INTELLIGENCE SYSTEM
 * 
 * Drop all your chat logs, get intelligent idea extraction and implementation
 * 
 * Features:
 * - Auto-ingest chat logs from any format
 * - AI-powered idea extraction and tagging
 * - Swipeable interface for browsing ideas
 * - Cal integration for implementation
 * - Domingo payment system
 * - $1 personalization engine
 * - Export to any format
 * - 5-year-old to 80-year-old friendly
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class ChatLogIntelligenceSystem extends EventEmitter {
    constructor() {
        super();
        
        this.PORT = 3008;
        
        // Core paths
        this.logsPath = path.join(__dirname, 'chat-logs');
        this.ideasPath = path.join(__dirname, 'extracted-ideas');
        this.containersPath = path.join(__dirname, 'idea-containers');
        this.exportPath = path.join(__dirname, 'exports');
        
        // Intelligence engine
        this.ideas = new Map();
        this.tags = new Map();
        this.conversations = new Map();
        this.implementations = new Map();
        
        // AI Processing
        this.ideaPatterns = {
            features: /(?:want|need|should|could|let'?s|how about|what if|maybe|perhaps).{1,200}?(?:\.|!|\?)/gi,
            problems: /(?:bug|error|issue|problem|broken|doesn'?t work|not working|fails?|crash).{1,200}?(?:\.|!|\?)/gi,
            solutions: /(?:fix|solve|solution|answer|resolve|implement|build|create|make).{1,200}?(?:\.|!|\?)/gi,
            games: /(?:game|arena|gladiator|basketball|runescape|habbo|warcraft|duel|betting|casino).{1,200}?(?:\.|!|\?)/gi,
            business: /(?:\$|money|sell|buy|customer|user|market|product|revenue|profit).{1,200}?(?:\.|!|\?)/gi,
            tech: /(?:api|server|database|code|function|class|module|library|framework).{1,200}?(?:\.|!|\?)/gi
        };
        
        // Personalization engine
        this.personalityProfiles = new Map();
        
        // Cal integration
        this.calEndpoint = 'http://localhost:4040';
        this.domingoEndpoint = 'http://localhost:5055';
        
        // $1 Product engine
        this.productEngine = {
            pricingTier: 1, // $1
            features: ['basic-extraction', 'simple-export', 'cal-integration'],
            premiumFeatures: ['advanced-ai', 'custom-containers', 'auto-implementation']
        };
    }
    
    async initialize() {
        // Create directory structure
        await fs.mkdir(this.logsPath, { recursive: true });
        await fs.mkdir(this.ideasPath, { recursive: true });
        await fs.mkdir(this.containersPath, { recursive: true });
        await fs.mkdir(path.join(this.exportPath, 'json'), { recursive: true });
        await fs.mkdir(path.join(this.exportPath, 'markdown'), { recursive: true });
        await fs.mkdir(path.join(this.exportPath, 'code'), { recursive: true });
        
        // Load existing data
        await this.loadExistingData();
        
        // Start web interface
        this.startWebInterface();
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                🧠 CHAT LOG INTELLIGENCE SYSTEM               ║
║                                                              ║
║  Drop chat logs → Get intelligent ideas → Cal implements    ║
║                                                              ║
║  • Auto-extract ideas from any chat format                  ║
║  • Swipeable interface for browsing                         ║
║  • Cal integration for implementation                       ║
║  • Domingo payment system                                   ║
║  • $1 personalization engine                                ║
║                                                              ║
║  URL: http://localhost:${this.PORT}                         ║
╚══════════════════════════════════════════════════════════════╝
        `);
    }
    
    /**
     * STEP 1: Ingest chat logs from any format
     */
    async ingestChatLogs(logPath = this.logsPath) {
        console.log('📥 Ingesting chat logs...');
        
        const files = await fs.readdir(logPath);
        const results = {
            processed: 0,
            ideas: 0,
            conversations: 0
        };
        
        for (const file of files) {
            const filePath = path.join(logPath, file);
            const ext = path.extname(file).toLowerCase();
            
            let content;
            try {
                content = await fs.readFile(filePath, 'utf8');
            } catch (error) {
                console.log(`  ⚠️ Skipping ${file}: ${error.message}`);
                continue;
            }
            
            // Parse based on format
            let parsed;
            if (ext === '.json') {
                parsed = this.parseJSONLog(content, file);
            } else if (ext === '.txt') {
                parsed = this.parseTextLog(content, file);
            } else if (ext === '.md') {
                parsed = this.parseMarkdownLog(content, file);
            } else {
                // Try to parse as text
                parsed = this.parseTextLog(content, file);
            }
            
            if (parsed) {
                results.processed++;
                results.conversations += parsed.conversations;
                results.ideas += parsed.ideas;
            }
        }
        
        console.log(`✅ Ingested ${results.processed} files, ${results.conversations} conversations, ${results.ideas} ideas`);
        return results;
    }
    
    /**
     * Parse different log formats
     */
    parseJSONLog(content, filename) {
        try {
            const data = JSON.parse(content);
            const conversationId = crypto.randomBytes(8).toString('hex');
            
            let messages = [];
            if (Array.isArray(data)) {
                messages = data;
            } else if (data.messages) {
                messages = data.messages;
            } else if (data.conversation) {
                messages = data.conversation;
            }
            
            const conversation = {
                id: conversationId,
                source: filename,
                format: 'json',
                timestamp: new Date().toISOString(),
                messages: messages,
                metadata: {
                    messageCount: messages.length,
                    participants: this.extractParticipants(messages)
                }
            };
            
            this.conversations.set(conversationId, conversation);
            
            // Extract ideas
            const ideas = this.extractIdeasFromConversation(conversation);
            
            return {
                conversations: 1,
                ideas: ideas.length
            };
            
        } catch (error) {
            console.log(`  ⚠️ Failed to parse JSON log ${filename}: ${error.message}`);
            return null;
        }
    }
    
    parseTextLog(content, filename) {
        const conversationId = crypto.randomBytes(8).toString('hex');
        
        // Split into messages (various formats)
        const lines = content.split('\n').filter(line => line.trim());
        const messages = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Try to detect message format
            let message = this.parseMessageLine(line, i);
            if (message) {
                messages.push(message);
            }
        }
        
        const conversation = {
            id: conversationId,
            source: filename,
            format: 'text',
            timestamp: new Date().toISOString(),
            messages: messages,
            metadata: {
                messageCount: messages.length,
                participants: this.extractParticipants(messages)
            }
        };
        
        this.conversations.set(conversationId, conversation);
        
        // Extract ideas
        const ideas = this.extractIdeasFromConversation(conversation);
        
        return {
            conversations: 1,
            ideas: ideas.length
        };
    }
    
    parseMarkdownLog(content, filename) {
        // Similar to text but with markdown awareness
        return this.parseTextLog(content, filename);
    }
    
    parseMessageLine(line, index) {
        // Try various chat formats
        
        // Discord/Slack format: "username: message"
        let match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
            return {
                id: index,
                author: match[1].trim(),
                content: match[2].trim(),
                timestamp: new Date().toISOString()
            };
        }
        
        // WhatsApp format: "[timestamp] username: message"
        match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/);
        if (match) {
            return {
                id: index,
                author: match[2].trim(),
                content: match[3].trim(),
                timestamp: match[1]
            };
        }
        
        // Simple format: just content
        return {
            id: index,
            author: 'user',
            content: line,
            timestamp: new Date().toISOString()
        };
    }
    
    extractParticipants(messages) {
        const participants = new Set();
        for (const msg of messages) {
            if (msg.author) {
                participants.add(msg.author);
            }
        }
        return Array.from(participants);
    }
    
    /**
     * STEP 2: Extract and tag ideas using AI patterns
     */
    extractIdeasFromConversation(conversation) {
        const allText = conversation.messages
            .map(m => m.content)
            .join(' ');
        
        const extractedIdeas = [];
        
        // Extract different types of ideas
        for (const [type, pattern] of Object.entries(this.ideaPatterns)) {
            const matches = allText.match(pattern) || [];
            
            for (const match of matches) {
                const ideaId = crypto.randomBytes(6).toString('hex');
                
                const idea = {
                    id: ideaId,
                    type: type,
                    content: match.trim(),
                    conversationId: conversation.id,
                    source: conversation.source,
                    timestamp: new Date().toISOString(),
                    tags: this.generateTags(match, type),
                    complexity: this.estimateComplexity(match),
                    implementation: {
                        status: 'pending',
                        calAssigned: false,
                        domingoPayment: null,
                        estimatedCost: this.estimateCost(match, type)
                    },
                    swipeData: {
                        views: 0,
                        likes: 0,
                        exports: 0,
                        implementations: 0
                    }
                };
                
                this.ideas.set(ideaId, idea);
                extractedIdeas.push(idea);
                
                // Create container
                this.createIdeaContainer(idea);
            }
        }
        
        return extractedIdeas;
    }
    
    generateTags(content, type) {
        const tags = [type];
        
        // Technology tags
        if (content.includes('node') || content.includes('javascript')) tags.push('nodejs');
        if (content.includes('react') || content.includes('frontend')) tags.push('frontend');
        if (content.includes('database') || content.includes('sql')) tags.push('database');
        if (content.includes('api') || content.includes('server')) tags.push('backend');
        
        // Domain tags
        if (content.includes('game') || content.includes('arena')) tags.push('gaming');
        if (content.includes('money') || content.includes('$')) tags.push('business');
        if (content.includes('user') || content.includes('interface')) tags.push('ux');
        if (content.includes('ai') || content.includes('agent')) tags.push('ai');
        
        // Complexity tags
        if (content.length > 100) tags.push('complex');
        if (content.includes('simple') || content.includes('easy')) tags.push('simple');
        
        return tags;
    }
    
    estimateComplexity(content) {
        let score = 1;
        
        // Length factor
        score += Math.floor(content.length / 50);
        
        // Technical complexity indicators
        const complexWords = ['algorithm', 'architecture', 'framework', 'integration', 'optimization'];
        for (const word of complexWords) {
            if (content.toLowerCase().includes(word)) score += 2;
        }
        
        // Implementation indicators
        if (content.includes('implement') || content.includes('build')) score += 1;
        if (content.includes('design') || content.includes('architect')) score += 2;
        
        return Math.min(10, score);
    }
    
    estimateCost(content, type) {
        const baseCosts = {
            features: 50,
            problems: 25,
            solutions: 35,
            games: 100,
            business: 75,
            tech: 60
        };
        
        const complexity = this.estimateComplexity(content);
        const baseCost = baseCosts[type] || 40;
        
        return baseCost + (complexity * 10);
    }
    
    /**
     * STEP 3: Create idea containers
     */
    async createIdeaContainer(idea) {
        const containerPath = path.join(this.containersPath, `idea_${idea.id}.json`);
        
        const container = {
            idea: idea,
            relatedIdeas: [],
            implementations: [],
            exports: [],
            calInteractions: [],
            domingoTransactions: [],
            userInteractions: {
                swipes: [],
                comments: [],
                modifications: []
            },
            metadata: {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                version: 1
            }
        };
        
        await fs.writeFile(containerPath, JSON.stringify(container, null, 2));
        return container;
    }
    
    /**
     * STEP 4: Web interface for swiping through ideas
     */
    startWebInterface() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getSwipeInterface());
            }
            else if (req.url === '/api/ideas') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(Array.from(this.ideas.values())));
            }
            else if (req.url === '/api/ingest' && req.method === 'POST') {
                this.handleIngest(req, res);
            }
            else if (req.url.startsWith('/api/idea/')) {
                this.handleIdeaAPI(req, res);
            }
            else if (req.url === '/api/export' && req.method === 'POST') {
                this.handleExport(req, res);
            }
            else if (req.url === '/api/implement' && req.method === 'POST') {
                this.handleImplementation(req, res);
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        
        server.listen(this.PORT, () => {
            console.log(`🌐 Chat Log Intelligence interface ready on port ${this.PORT}`);
        });
    }
    
    getSwipeInterface() {
        return `<!DOCTYPE html>
<html>
<head>
<title>💡 Chat Log Intelligence System</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    height: 100vh;
    overflow: hidden;
}

.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 500px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
}

.header {
    padding: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    text-align: center;
    border-radius: 0 0 20px 20px;
}

.header h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 5px;
}

.stats {
    display: flex;
    justify-content: space-around;
    font-size: 14px;
    opacity: 0.8;
}

.swipe-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    overflow: hidden;
}

.idea-card {
    width: 90%;
    max-width: 400px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 30px;
    text-align: center;
    position: absolute;
    transition: transform 0.3s ease, opacity 0.3s ease;
    cursor: grab;
    user-select: none;
}

.idea-card.dragging {
    cursor: grabbing;
    z-index: 10;
}

.idea-card.swiped-right {
    transform: translateX(100vw) rotate(30deg);
    opacity: 0;
}

.idea-card.swiped-left {
    transform: translateX(-100vw) rotate(-30deg);
    opacity: 0;
}

.idea-type {
    display: inline-block;
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 15px;
}

.idea-content {
    font-size: 18px;
    line-height: 1.5;
    margin-bottom: 20px;
    color: #333;
}

.idea-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
    margin-bottom: 15px;
}

.tag {
    background: #f0f0f0;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    color: #666;
}

.idea-meta {
    font-size: 12px;
    color: #888;
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.actions {
    padding: 20px;
    display: flex;
    justify-content: space-around;
    background: rgba(0, 0, 0, 0.05);
}

.action-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    font-size: 24px;
    cursor: pointer;
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-btn:hover {
    transform: scale(1.1);
}

.action-btn.pass {
    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
    color: white;
}

.action-btn.like {
    background: linear-gradient(45deg, #51cf66, #40c057);
    color: white;
}

.action-btn.implement {
    background: linear-gradient(45deg, #339af0, #228be6);
    color: white;
}

.controls {
    padding: 15px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

.control-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    background: #667eea;
    color: white;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.control-btn:hover {
    background: #5a67d8;
}

.empty-state {
    text-align: center;
    color: #666;
    font-size: 18px;
    padding: 40px;
}

.drop-zone {
    border: 2px dashed #ccc;
    border-radius: 20px;
    padding: 40px;
    margin: 20px;
    text-align: center;
    color: #666;
    cursor: pointer;
    transition: all 0.3s ease;
}

.drop-zone:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
}

.drop-zone.dragover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #51cf66;
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
}

.notification.show {
    transform: translateX(0);
}

@media (max-width: 600px) {
    .container {
        max-width: 100%;
        border-radius: 0;
    }
    
    .idea-card {
        width: 95%;
        padding: 20px;
    }
}
</style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>💡 Chat Log Intelligence</h1>
        <div class="stats">
            <span id="totalIdeas">0 Ideas</span>
            <span id="currentIndex">0/0</span>
            <span id="liked">0 Liked</span>
        </div>
    </div>
    
    <div class="controls">
        <button class="control-btn" onclick="uploadLogs()">📁 Upload Logs</button>
        <button class="control-btn" onclick="refreshIdeas()">🔄 Refresh</button>
        <button class="control-btn" onclick="exportLiked()">📤 Export Liked</button>
        <button class="control-btn" onclick="viewAll()">📋 View All</button>
    </div>
    
    <div class="swipe-area" id="swipeArea">
        <div class="drop-zone" id="dropZone">
            <h3>Drop Chat Logs Here</h3>
            <p>Drag & drop .txt, .json, .md files</p>
            <p>Or click to browse</p>
        </div>
    </div>
    
    <div class="actions">
        <button class="action-btn pass" onclick="swipeLeft()">✕</button>
        <button class="action-btn like" onclick="swipeRight()">💖</button>
        <button class="action-btn implement" onclick="implementIdea()">🚀</button>
    </div>
</div>

<div class="notification" id="notification"></div>

<script>
let ideas = [];
let currentIndex = 0;
let likedIdeas = [];
let currentCard = null;

// Load ideas on startup
loadIdeas();

function loadIdeas() {
    fetch('/api/ideas')
        .then(r => r.json())
        .then(data => {
            ideas = data;
            updateStats();
            showCurrentIdea();
        });
}

function updateStats() {
    document.getElementById('totalIdeas').textContent = ideas.length + ' Ideas';
    document.getElementById('currentIndex').textContent = (currentIndex + 1) + '/' + ideas.length;
    document.getElementById('liked').textContent = likedIdeas.length + ' Liked';
}

function showCurrentIdea() {
    const swipeArea = document.getElementById('swipeArea');
    swipeArea.innerHTML = '';
    
    if (currentIndex >= ideas.length) {
        swipeArea.innerHTML = '<div class="empty-state">🎉 All ideas reviewed!<br><br>Upload more logs or export your liked ideas.</div>';
        return;
    }
    
    const idea = ideas[currentIndex];
    const card = document.createElement('div');
    card.className = 'idea-card';
    card.innerHTML = createIdeaCardHTML(idea);
    
    // Add swipe functionality
    addSwipeListeners(card);
    
    swipeArea.appendChild(card);
    currentCard = card;
}

function createIdeaCardHTML(idea) {
    return \`
        <div class="idea-type">\${idea.type}</div>
        <div class="idea-content">\${idea.content}</div>
        <div class="idea-tags">
            \${idea.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
        </div>
        <div class="idea-meta">
            <span>💰 \${idea.implementation.estimatedCost}◉</span>
            <span>⭐ \${idea.complexity}/10</span>
            <span>👀 \${idea.swipeData.views}</span>
        </div>
    \`;
}

function addSwipeListeners(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        card.classList.add('dragging');
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        currentX = (e.type === 'mousemove' ? e.clientX : e.touches[0].clientX) - startX;
        const rotation = currentX * 0.1;
        
        card.style.transform = \`translateX(\${currentX}px) rotate(\${rotation}deg)\`;
        card.style.opacity = Math.max(0.3, 1 - Math.abs(currentX) / 300);
    }
    
    function endDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        card.classList.remove('dragging');
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        
        if (Math.abs(currentX) > 100) {
            if (currentX > 0) {
                swipeRightAction();
            } else {
                swipeLeftAction();
            }
        } else {
            // Snap back
            card.style.transform = '';
            card.style.opacity = '';
        }
    }
}

function swipeLeft() {
    if (currentCard) {
        currentCard.classList.add('swiped-left');
        swipeLeftAction();
    }
}

function swipeRight() {
    if (currentCard) {
        currentCard.classList.add('swiped-right');
        swipeRightAction();
    }
}

function swipeLeftAction() {
    // Pass on idea
    nextIdea();
}

function swipeRightAction() {
    // Like idea
    const idea = ideas[currentIndex];
    likedIdeas.push(idea);
    showNotification('💖 Idea liked!');
    nextIdea();
}

function implementIdea() {
    const idea = ideas[currentIndex];
    
    fetch('/api/implement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id })
    })
    .then(r => r.json())
    .then(result => {
        showNotification('🚀 Sent to Cal for implementation!');
        likedIdeas.push(idea);
        nextIdea();
    });
}

function nextIdea() {
    currentIndex++;
    updateStats();
    setTimeout(showCurrentIdea, 300);
}

function refreshIdeas() {
    loadIdeas();
}

function uploadLogs() {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.txt,.json,.md';
    input.onchange = handleFileUpload;
    input.click();
}

function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/api/ingest', {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(result => {
            showNotification(\`📥 \${file.name} ingested!\`);
            setTimeout(refreshIdeas, 1000);
        });
    }
}

function exportLiked() {
    if (likedIdeas.length === 0) {
        showNotification('❌ No liked ideas to export!');
        return;
    }
    
    fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas: likedIdeas, format: 'all' })
    })
    .then(r => r.json())
    .then(result => {
        showNotification(\`📤 Exported \${likedIdeas.length} ideas!\`);
    });
}

function viewAll() {
    // Open all ideas view in new window
    window.open('/all-ideas', '_blank');
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Drag and drop functionality
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('click', uploadLogs);

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/api/ingest', {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(result => {
            showNotification(\`📥 \${file.name} ingested!\`);
            setTimeout(refreshIdeas, 1000);
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') swipeLeft();
    if (e.key === 'ArrowRight') swipeRight();
    if (e.key === 'ArrowUp') implementIdea();
    if (e.key === ' ') e.preventDefault();
});
</script>

</body>
</html>`;
    }
    
    async handleIngest(req, res) {
        // Handle file upload and ingestion
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                // For demo, simulate ingestion
                const result = await this.ingestChatLogs();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, result }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handleExport(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const exported = await this.exportIdeas(data.ideas, data.format);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, exported }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handleImplementation(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const result = await this.sendToCalForImplementation(data.ideaId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, result }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    /**
     * STEP 5: Cal integration for implementation
     */
    async sendToCalForImplementation(ideaId) {
        const idea = this.ideas.get(ideaId);
        if (!idea) throw new Error('Idea not found');
        
        // Mark as assigned to Cal
        idea.implementation.status = 'assigned_to_cal';
        idea.implementation.calAssigned = true;
        idea.implementation.assignedAt = new Date().toISOString();
        
        // Send to Cal (simulate for now)
        const calRequest = {
            type: 'implementation_request',
            idea: idea,
            priority: idea.complexity > 7 ? 'high' : 'normal',
            budget: idea.implementation.estimatedCost,
            requirements: this.generateRequirements(idea)
        };
        
        // In real implementation, send to Cal via API
        console.log(`🧠 Sending idea ${ideaId} to Cal for implementation`);
        
        // Create Domingo bounty
        await this.createDomingoBounty(idea);
        
        return {
            ideaId: ideaId,
            status: 'sent_to_cal',
            calRequest: calRequest
        };
    }
    
    generateRequirements(idea) {
        const requirements = [];
        
        if (idea.tags.includes('frontend')) {
            requirements.push('Create user interface');
        }
        if (idea.tags.includes('backend')) {
            requirements.push('Implement server logic');
        }
        if (idea.tags.includes('database')) {
            requirements.push('Design data storage');
        }
        if (idea.tags.includes('gaming')) {
            requirements.push('Implement game mechanics');
        }
        
        requirements.push('Add proper error handling');
        requirements.push('Include documentation');
        requirements.push('Ensure mobile compatibility');
        
        return requirements;
    }
    
    /**
     * STEP 6: Domingo payment integration
     */
    async createDomingoBounty(idea) {
        const bounty = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'idea_implementation',
            ideaId: idea.id,
            title: `Implement: ${idea.content.substring(0, 50)}...`,
            description: idea.content,
            reward: idea.implementation.estimatedCost,
            requirements: this.generateRequirements(idea),
            assignedTo: 'cal',
            status: 'active',
            created: new Date().toISOString()
        };
        
        // In real implementation, send to Domingo
        console.log(`💰 Created Domingo bounty ${bounty.id} for ${bounty.reward}◉`);
        
        idea.implementation.domingoPayment = bounty.id;
        
        return bounty;
    }
    
    /**
     * STEP 7: Export system
     */
    async exportIdeas(ideas, format = 'all') {
        const timestamp = new Date().toISOString().split('T')[0];
        const exports = {};
        
        if (format === 'all' || format === 'json') {
            const jsonPath = path.join(this.exportPath, 'json', `ideas_${timestamp}.json`);
            await fs.writeFile(jsonPath, JSON.stringify(ideas, null, 2));
            exports.json = jsonPath;
        }
        
        if (format === 'all' || format === 'markdown') {
            const mdContent = this.generateMarkdownExport(ideas);
            const mdPath = path.join(this.exportPath, 'markdown', `ideas_${timestamp}.md`);
            await fs.writeFile(mdPath, mdContent);
            exports.markdown = mdPath;
        }
        
        if (format === 'all' || format === 'code') {
            const codeContent = this.generateCodeExport(ideas);
            const codePath = path.join(this.exportPath, 'code', `implementation_${timestamp}.js`);
            await fs.writeFile(codePath, codeContent);
            exports.code = codePath;
        }
        
        return exports;
    }
    
    generateMarkdownExport(ideas) {
        let md = `# Extracted Ideas Export\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
        
        const grouped = this.groupIdeasByType(ideas);
        
        for (const [type, typeIdeas] of Object.entries(grouped)) {
            md += `## ${type.toUpperCase()} (${typeIdeas.length})\n\n`;
            
            for (const idea of typeIdeas) {
                md += `### ${idea.content.substring(0, 80)}...\n\n`;
                md += `**Content:** ${idea.content}\n\n`;
                md += `**Tags:** ${idea.tags.join(', ')}\n\n`;
                md += `**Complexity:** ${idea.complexity}/10\n\n`;
                md += `**Estimated Cost:** ${idea.implementation.estimatedCost}◉\n\n`;
                md += `**Source:** ${idea.source}\n\n`;
                md += '---\n\n';
            }
        }
        
        return md;
    }
    
    generateCodeExport(ideas) {
        let code = `// Generated Implementation Plan\n// Date: ${new Date().toLocaleString()}\n\n`;
        
        code += `class IdeaImplementation {\n`;
        code += `    constructor() {\n`;
        code += `        this.ideas = ${JSON.stringify(ideas, null, 8)};\n`;
        code += `    }\n\n`;
        
        for (const idea of ideas) {
            const methodName = this.generateMethodName(idea.content);
            code += `    async ${methodName}() {\n`;
            code += `        // ${idea.content}\n`;
            code += `        // Complexity: ${idea.complexity}/10\n`;
            code += `        // Tags: ${idea.tags.join(', ')}\n`;
            code += `        \n`;
            code += `        throw new Error('Implementation needed');\n`;
            code += `    }\n\n`;
        }
        
        code += `}\n\nmodule.exports = IdeaImplementation;`;
        
        return code;
    }
    
    generateMethodName(content) {
        return content
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(' ')
            .slice(0, 4)
            .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    
    groupIdeasByType(ideas) {
        const grouped = {};
        for (const idea of ideas) {
            if (!grouped[idea.type]) {
                grouped[idea.type] = [];
            }
            grouped[idea.type].push(idea);
        }
        return grouped;
    }
    
    /**
     * Load existing data
     */
    async loadExistingData() {
        try {
            const files = await fs.readdir(this.containersPath);
            for (const file of files) {
                if (file.startsWith('idea_') && file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(this.containersPath, file), 'utf8');
                    const container = JSON.parse(content);
                    this.ideas.set(container.idea.id, container.idea);
                }
            }
            
            console.log(`📚 Loaded ${this.ideas.size} existing ideas`);
        } catch (error) {
            console.log('📚 Starting with fresh idea database');
        }
    }
    
    /**
     * $1 Product engine
     */
    async createPersonalizationProfile(userId, preferences) {
        const profile = {
            userId: userId,
            preferences: preferences,
            ageGroup: preferences.ageGroup, // '5-12', '13-17', '18-65', '65+'
            techLevel: preferences.techLevel, // 'beginner', 'intermediate', 'expert'
            interests: preferences.interests,
            budget: 1, // $1 tier
            features: this.productEngine.features,
            customizations: {
                interface: this.generateAgeAppropriateInterface(preferences.ageGroup),
                language: this.generateLanguageLevel(preferences.techLevel),
                examples: this.generateRelevantExamples(preferences.interests)
            }
        };
        
        this.personalityProfiles.set(userId, profile);
        return profile;
    }
    
    generateAgeAppropriateInterface(ageGroup) {
        const interfaces = {
            '5-12': { colors: 'bright', animations: 'fun', text: 'simple' },
            '13-17': { colors: 'vibrant', animations: 'cool', text: 'casual' },
            '18-65': { colors: 'professional', animations: 'subtle', text: 'standard' },
            '65+': { colors: 'high-contrast', animations: 'minimal', text: 'large' }
        };
        
        return interfaces[ageGroup] || interfaces['18-65'];
    }
    
    generateLanguageLevel(techLevel) {
        const levels = {
            'beginner': 'simple explanations, avoid jargon',
            'intermediate': 'balanced technical content',
            'expert': 'detailed technical specifications'
        };
        
        return levels[techLevel] || levels['intermediate'];
    }
    
    generateRelevantExamples(interests) {
        const examples = {
            'gaming': ['arena battles', 'character systems', 'leaderboards'],
            'business': ['payment systems', 'user dashboards', 'analytics'],
            'social': ['chat features', 'user profiles', 'friend systems'],
            'education': ['learning modules', 'progress tracking', 'quizzes']
        };
        
        return interests.map(interest => examples[interest] || []).flat();
    }
}

// Export for module use
module.exports = ChatLogIntelligenceSystem;

// Run if called directly
if (require.main === module) {
    const system = new ChatLogIntelligenceSystem();
    system.initialize().then(() => {
        console.log('🧠 Chat Log Intelligence System ready!');
        
        // Auto-ingest if logs directory exists and has files
        system.ingestChatLogs().catch(() => {
            console.log('📁 No chat logs found. Drop files to get started.');
        });
    });
}