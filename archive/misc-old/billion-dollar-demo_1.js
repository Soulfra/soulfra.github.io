#!/usr/bin/env node

/**
 * 💰 BILLION DOLLAR GAME - PRODUCTION DEMO VERSION
 * 
 * Clean, professional, no random jumps, no errors
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Game state with professional defaults
const gameState = {
    currentAmount: 0,
    targetAmount: 1000000000,
    contributors: 0,
    lastContribution: null,
    startTime: Date.now()
};

// Load saved state if exists
const saveFile = path.join(__dirname, 'billion-game-state.json');
try {
    const saved = JSON.parse(fs.readFileSync(saveFile, 'utf8'));
    Object.assign(gameState, saved);
} catch (e) {
    // Start fresh
}

// Save state every 10 seconds
setInterval(() => {
    fs.writeFileSync(saveFile, JSON.stringify(gameState, null, 2));
}, 10000);

// Create server
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/') {
        const percentComplete = (gameState.currentAmount / gameState.targetAmount * 100).toFixed(2);
        
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(`<!DOCTYPE html>
<html>
<head>
<title>Billion Dollar Collective</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background: #0a0a0a;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}
.container {
    max-width: 800px;
    width: 100%;
    text-align: center;
}
h1 {
    font-size: 48px;
    margin-bottom: 10px;
    font-weight: 300;
    letter-spacing: -1px;
}
.subtitle {
    font-size: 18px;
    color: #888;
    margin-bottom: 40px;
}
.amount {
    font-size: 36px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #00ff88;
}
.progress-container {
    width: 100%;
    height: 60px;
    background: #1a1a1a;
    border-radius: 30px;
    overflow: hidden;
    position: relative;
    margin-bottom: 40px;
}
.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00cc6a);
    width: ${percentComplete}%;
    transition: width 0.5s ease;
    position: relative;
}
.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 0 10px rgba(0,0,0,0.5);
}
.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}
.stat {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #2a2a2a;
}
.stat-label {
    font-size: 14px;
    color: #888;
    margin-bottom: 5px;
}
.stat-value {
    font-size: 24px;
    font-weight: 600;
}
.contribute-btn {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 20px 60px;
    font-size: 20px;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
}
.contribute-btn:hover {
    background: #00cc6a;
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(0, 255, 136, 0.4);
}
.contribute-btn:active {
    transform: translateY(0);
}
.message {
    margin-top: 20px;
    padding: 15px;
    background: rgba(0, 255, 136, 0.1);
    border-radius: 10px;
    display: none;
}
.footer {
    margin-top: 60px;
    color: #666;
    font-size: 14px;
}
</style>
</head>
<body>
<div class="container">
    <h1>The Billion Dollar Collective</h1>
    <p class="subtitle">A shared goal. A collective achievement.</p>
    
    <div class="amount">$${gameState.currentAmount.toLocaleString()}</div>
    
    <div class="progress-container">
        <div class="progress-bar"></div>
        <div class="progress-text">${percentComplete}% Complete</div>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-label">Contributors</div>
            <div class="stat-value">${gameState.contributors.toLocaleString()}</div>
        </div>
        <div class="stat">
            <div class="stat-label">Average Contribution</div>
            <div class="stat-value">$${gameState.contributors > 0 ? Math.floor(gameState.currentAmount / gameState.contributors).toLocaleString() : '0'}</div>
        </div>
        <div class="stat">
            <div class="stat-label">Distance to Goal</div>
            <div class="stat-value">$${(gameState.targetAmount - gameState.currentAmount).toLocaleString()}</div>
        </div>
    </div>
    
    <button class="contribute-btn" onclick="contribute()">Contribute $1,000</button>
    
    <div id="message" class="message"></div>
    
    <div class="footer">
        Every contribution brings us closer to our collective goal.
    </div>
</div>

<script>
let isProcessing = false;

async function contribute() {
    if (isProcessing) return;
    isProcessing = true;
    
    const btn = document.querySelector('.contribute-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
        const response = await fetch('/contribute', { method: 'POST' });
        const data = await response.json();
        
        // Update UI
        document.querySelector('.amount').textContent = '$' + data.currentAmount.toLocaleString();
        document.querySelector('.progress-bar').style.width = data.percentComplete + '%';
        document.querySelector('.progress-text').textContent = data.percentComplete + '% Complete';
        
        // Update stats
        document.querySelectorAll('.stat-value')[0].textContent = data.contributors.toLocaleString();
        document.querySelectorAll('.stat-value')[1].textContent = '$' + (data.contributors > 0 ? Math.floor(data.currentAmount / data.contributors).toLocaleString() : '0');
        document.querySelectorAll('.stat-value')[2].textContent = '$' + (data.targetAmount - data.currentAmount).toLocaleString();
        
        // Show message
        const msg = document.getElementById('message');
        msg.textContent = 'Thank you! Your $1,000 contribution has been added.';
        msg.style.display = 'block';
        msg.style.animation = 'none';
        setTimeout(() => {
            msg.style.animation = 'fadeIn 0.3s ease';
        }, 10);
        
        setTimeout(() => {
            msg.style.display = 'none';
        }, 3000);
        
        if (data.currentAmount >= data.targetAmount) {
            celebrate();
        }
    } catch (error) {
        console.error('Contribution failed:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Contribute $1,000';
        isProcessing = false;
    }
}

function celebrate() {
    document.body.innerHTML = \`
    <div class="container" style="text-align: center;">
        <h1 style="font-size: 72px; margin-bottom: 20px;">🎉 WE DID IT! 🎉</h1>
        <div class="amount" style="font-size: 48px;">$1,000,000,000</div>
        <p style="font-size: 24px; margin-top: 20px;">The Billion Dollar Collective has reached its goal!</p>
        <p style="font-size: 18px; margin-top: 10px; color: #888;">Together, we achieved the impossible.</p>
    </div>
    \`;
}

// Auto-refresh stats every 5 seconds
setInterval(async () => {
    if (!isProcessing) {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            document.querySelector('.amount').textContent = '$' + data.currentAmount.toLocaleString();
            document.querySelector('.progress-bar').style.width = data.percentComplete + '%';
            document.querySelector('.progress-text').textContent = data.percentComplete + '% Complete';
            
            document.querySelectorAll('.stat-value')[0].textContent = data.contributors.toLocaleString();
            document.querySelectorAll('.stat-value')[1].textContent = '$' + (data.contributors > 0 ? Math.floor(data.currentAmount / data.contributors).toLocaleString() : '0');
            document.querySelectorAll('.stat-value')[2].textContent = '$' + (data.targetAmount - data.currentAmount).toLocaleString();
        } catch (error) {
            // Silently fail
        }
    }
}, 5000);

// Add fade animation
const style = document.createElement('style');
style.textContent = \`
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
\`;
document.head.appendChild(style);
</script>
</body>
</html>`);
    }
    else if (req.url === '/contribute' && req.method === 'POST') {
        // Add exactly $1,000
        gameState.currentAmount += 1000;
        gameState.contributors += 1;
        gameState.lastContribution = Date.now();
        
        const percentComplete = (gameState.currentAmount / gameState.targetAmount * 100).toFixed(2);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            currentAmount: gameState.currentAmount,
            targetAmount: gameState.targetAmount,
            percentComplete: percentComplete,
            contributors: gameState.contributors
        }));
    }
    else if (req.url === '/status') {
        const percentComplete = (gameState.currentAmount / gameState.targetAmount * 100).toFixed(2);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            currentAmount: gameState.currentAmount,
            targetAmount: gameState.targetAmount,
            percentComplete: percentComplete,
            contributors: gameState.contributors
        }));
    }
    else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = 3003;
server.listen(PORT, () => {
    console.log(`
💰 BILLION DOLLAR COLLECTIVE - PRODUCTION DEMO
============================================
🌐 Access at: http://localhost:${PORT}
💵 Current: $${gameState.currentAmount.toLocaleString()}
🎯 Target: $${gameState.targetAmount.toLocaleString()}
👥 Contributors: ${gameState.contributors}

✅ Clean, professional interface
✅ No random jumps - only $1,000 increments
✅ Persistent state across restarts
✅ Mobile responsive
✅ Production ready for demos

Press Ctrl+C to stop
`);
});