#!/usr/bin/env node

/**
 * 🌀 GAME INFINITY ROUTER
 * 
 * Routes players through the billion dollar arena system
 * Handles authentication, load balancing, and session management
 */

const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class GameInfinityRouter extends EventEmitter {
    constructor() {
        super();
        this.PORT = 3003;
        
        // Router configuration
        this.config = {
            maxPlayersPerArena: 1000,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            qrCodePrefix: 'arena-',
            mirrorChainAnchors: ['qr-gladiator-0001', 'qr-arena-prime', 'qr-billion-game']
        };
        
        // Active arenas
        this.arenas = new Map();
        this.playerSessions = new Map();
        this.qrTokens = new Map();
        
        // Load balancing
        this.nextArenaId = 0;
        
        // Trace tokens for tier integration
        this.traceTokenFile = path.join(__dirname, 'arena-trace-token.json');
    }
    
    async initialize() {
        console.log('🌀 Game Infinity Router initializing...');
        
        // Create default arena
        this.createArena('prime', {
            name: 'Prime Colosseum',
            type: 'classic',
            maxPlayers: 1000
        });
        
        // Start HTTP server
        this.startServer();
        
        // Start session cleanup
        this.startSessionCleanup();
    }
    
    createArena(id, config) {
        const arena = {
            id: id || `arena_${this.nextArenaId++}`,
            name: config.name || `Arena ${this.nextArenaId}`,
            type: config.type || 'classic',
            maxPlayers: config.maxPlayers || this.config.maxPlayersPerArena,
            players: new Set(),
            created: Date.now(),
            status: 'active',
            shell: null // Will be connected to battle shell
        };
        
        this.arenas.set(arena.id, arena);
        console.log(`🏛️  Created arena: ${arena.name} (${arena.id})`);
        
        return arena;
    }
    
    validateQRCode(qrCode) {
        // Check against known anchors
        if (this.config.mirrorChainAnchors.includes(qrCode)) {
            return { valid: true, type: 'admin' };
        }
        
        // Check arena QR codes
        if (qrCode.startsWith(this.config.qrCodePrefix)) {
            return { valid: true, type: 'player' };
        }
        
        return { valid: false };
    }
    
    generateTraceToken(qrCode, playerId) {
        const token = {
            id: crypto.randomUUID(),
            qrCode: qrCode,
            playerId: playerId,
            timestamp: Date.now(),
            signature: crypto.createHash('sha256')
                .update(`${qrCode}:${playerId}:${Date.now()}`)
                .digest('hex')
        };
        
        // Save to file for tier integration
        fs.writeFileSync(this.traceTokenFile, JSON.stringify(token, null, 2));
        
        return token;
    }
    
    createPlayerSession(playerData) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        const session = {
            id: sessionId,
            playerId: playerData.playerId || crypto.randomBytes(8).toString('hex'),
            username: playerData.username || `Gladiator${Math.floor(Math.random() * 9999)}`,
            arenaId: null,
            created: Date.now(),
            lastActivity: Date.now(),
            stats: {
                wins: 0,
                losses: 0,
                betsWon: 0,
                totalEarned: 0
            }
        };
        
        this.playerSessions.set(sessionId, session);
        
        // Emit for logging
        this.emit('player-joined', session);
        
        return session;
    }
    
    routePlayerToArena(sessionId) {
        const session = this.playerSessions.get(sessionId);
        if (!session) return null;
        
        // Find arena with space
        let targetArena = null;
        for (const [arenaId, arena] of this.arenas) {
            if (arena.players.size < arena.maxPlayers && arena.status === 'active') {
                targetArena = arena;
                break;
            }
        }
        
        // Create new arena if all full
        if (!targetArena) {
            targetArena = this.createArena();
        }
        
        // Add player to arena
        targetArena.players.add(sessionId);
        session.arenaId = targetArena.id;
        session.lastActivity = Date.now();
        
        console.log(`🎯 Routed ${session.username} to ${targetArena.name}`);
        
        return {
            arenaId: targetArena.id,
            arenaName: targetArena.name,
            playerCount: targetArena.players.size
        };
    }
    
    startSessionCleanup() {
        setInterval(() => {
            const now = Date.now();
            const timeout = this.config.sessionTimeout;
            
            for (const [sessionId, session] of this.playerSessions) {
                if (now - session.lastActivity > timeout) {
                    this.removePlayerSession(sessionId);
                }
            }
        }, 60000); // Check every minute
    }
    
    removePlayerSession(sessionId) {
        const session = this.playerSessions.get(sessionId);
        if (!session) return;
        
        // Remove from arena
        if (session.arenaId) {
            const arena = this.arenas.get(session.arenaId);
            if (arena) {
                arena.players.delete(sessionId);
            }
        }
        
        // Delete session
        this.playerSessions.delete(sessionId);
        
        console.log(`👋 Removed inactive session: ${session.username}`);
    }
    
    startServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Main router interface
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getRouterInterface());
            }
            
            // QR validation endpoint
            else if (req.url === '/api/validate-qr' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const validation = this.validateQRCode(data.qrCode);
                    
                    if (validation.valid) {
                        const token = this.generateTraceToken(data.qrCode, data.playerId);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            valid: true,
                            type: validation.type,
                            token: token
                        }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ valid: false }));
                    }
                });
            }
            
            // Create session endpoint
            else if (req.url === '/api/create-session' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const session = this.createPlayerSession(data);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(session));
                });
            }
            
            // Route to arena endpoint
            else if (req.url === '/api/route-to-arena' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const routing = this.routePlayerToArena(data.sessionId);
                    
                    if (routing) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(routing));
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Session not found' }));
                    }
                });
            }
            
            // Router status endpoint
            else if (req.url === '/api/status') {
                const status = {
                    arenas: Array.from(this.arenas.values()).map(arena => ({
                        id: arena.id,
                        name: arena.name,
                        players: arena.players.size,
                        maxPlayers: arena.maxPlayers,
                        status: arena.status
                    })),
                    totalPlayers: this.playerSessions.size,
                    uptime: Date.now() - this.startTime
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(status));
            }
            
            else {
                res.writeHead(404);
                res.end();
            }
        });
        
        this.startTime = Date.now();
        
        server.listen(this.PORT, () => {
            console.log(`
🌀 GAME INFINITY ROUTER ONLINE
==============================
🌐 Router URL: http://localhost:${this.PORT}
🏛️  Active Arenas: ${this.arenas.size}
🎮 Max Players/Arena: ${this.config.maxPlayersPerArena}
🔐 QR Validation: Enabled

Endpoints:
- POST /api/validate-qr - Validate QR codes
- POST /api/create-session - Create player session
- POST /api/route-to-arena - Route to available arena
- GET /api/status - Router status

Ready to route gladiators!
            `);
        });
    }
    
    getRouterInterface() {
        return `<!DOCTYPE html>
<html>
<head>
<title>Game Infinity Router</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #0a0a0a;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
}
.container {
    text-align: center;
    max-width: 600px;
    padding: 40px;
    background: #1a1a1a;
    border-radius: 20px;
    border: 2px solid #00ff88;
}
h1 {
    font-size: 48px;
    margin-bottom: 20px;
    background: linear-gradient(90deg, #00ff88, #00ccff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.status {
    background: #0a0a0a;
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
}
.arena-list {
    text-align: left;
    margin: 20px 0;
}
.arena-item {
    padding: 10px;
    margin: 5px 0;
    background: #2a2a2a;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
}
.button {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 10px;
    cursor: pointer;
    margin: 10px;
}
.button:hover {
    background: #00cc6a;
}
</style>
</head>
<body>
<div class="container">
    <h1>🌀 Game Infinity Router</h1>
    <p>Routing gladiators to their destiny...</p>
    
    <div class="status">
        <h2>Active Arenas</h2>
        <div id="arenaList" class="arena-list">Loading...</div>
    </div>
    
    <button class="button" onclick="refreshStatus()">Refresh Status</button>
    <button class="button" onclick="window.location.href='http://localhost:3004'">Enter Arena →</button>
</div>

<script>
async function refreshStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        const arenaList = document.getElementById('arenaList');
        arenaList.innerHTML = data.arenas.map(arena => \`
            <div class="arena-item">
                <span>\${arena.name}</span>
                <span>\${arena.players}/\${arena.maxPlayers} players</span>
            </div>
        \`).join('');
    } catch (error) {
        console.error('Failed to refresh:', error);
    }
}

// Auto-refresh every 5 seconds
setInterval(refreshStatus, 5000);
refreshStatus();
</script>
</body>
</html>`;
    }
}

// Export for use by other modules
module.exports = GameInfinityRouter;

// Run if called directly
if (require.main === module) {
    const router = new GameInfinityRouter();
    router.initialize().catch(console.error);
}