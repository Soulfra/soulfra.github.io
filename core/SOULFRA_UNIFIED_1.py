#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

PORT = 14000

HTML = """<!DOCTYPE html>
<html>
<head>
<title>Soulfra Unified Platform</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}

.header {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-bottom: 2px solid #333;
    padding: 20px 0;
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.nav {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.logo {
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(45deg, #4CAF50, #2196F3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-links {
    display: flex;
    gap: 30px;
    list-style: none;
}

.nav-links a {
    color: #e0e0e0;
    text-decoration: none;
    transition: color 0.3s;
    font-weight: 500;
}

.nav-links a:hover {
    color: #4CAF50;
}

.main-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 20px;
}

.hero {
    text-align: center;
    padding: 60px 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 20px;
    margin-bottom: 40px;
}

.hero h1 {
    font-size: 48px;
    margin-bottom: 20px;
    background: linear-gradient(45deg, #fff, #4CAF50);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero p {
    font-size: 20px;
    color: #b0b0b0;
    max-width: 600px;
    margin: 0 auto;
}

.section {
    margin-bottom: 60px;
}

.section-title {
    font-size: 32px;
    margin-bottom: 30px;
    text-align: center;
    color: #4CAF50;
}

.game-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
}

.game-card {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 15px;
    padding: 0;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
}

.game-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
}

.game-preview {
    height: 200px;
    background: #2a2a2a;
    position: relative;
    overflow: hidden;
}

.game-preview iframe {
    width: 100%;
    height: 100%;
    border: none;
    transform: scale(0.5);
    transform-origin: top left;
    width: 200%;
    height: 200%;
    pointer-events: none;
}

.game-info {
    padding: 20px;
}

.game-title {
    font-size: 24px;
    margin-bottom: 10px;
    color: #4CAF50;
}

.game-desc {
    color: #b0b0b0;
    margin-bottom: 15px;
}

.game-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    font-size: 14px;
}

.stat {
    display: flex;
    align-items: center;
    gap: 5px;
}

.online-dot {
    width: 8px;
    height: 8px;
    background: #4CAF50;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.play-btn {
    display: inline-block;
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: bold;
    transition: all 0.3s;
}

.play-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
}

.platform-section {
    background: #1a1a1a;
    border-radius: 20px;
    padding: 40px;
    margin-bottom: 40px;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    margin-top: 30px;
}

.feature {
    text-align: center;
    padding: 20px;
    background: #2a2a2a;
    border-radius: 10px;
    border: 1px solid #333;
}

.feature-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.feature h3 {
    color: #4CAF50;
    margin-bottom: 10px;
}

.status-bar {
    background: #1a1a1a;
    border-top: 2px solid #333;
    padding: 20px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tier-indicator {
    background: #2a2a2a;
    padding: 5px 15px;
    border-radius: 20px;
    border: 1px solid #4CAF50;
    font-size: 12px;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .hero h1 { font-size: 32px; }
    .game-grid { grid-template-columns: 1fr; }
    .nav-links { display: none; }
}

.loading-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    justify-content: center;
    align-items: center;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #333;
    border-top: 3px solid #4CAF50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
</head>
<body>

<header class="header">
    <nav class="nav">
        <div class="logo">SOULFRA</div>
        <ul class="nav-links">
            <li><a href="#games">Games</a></li>
            <li><a href="#platform">Platform</a></li>
            <li><a href="#arena">Arena</a></li>
            <li><a href="#tiers">Tiers</a></li>
        </ul>
    </nav>
</header>

<div class="main-container">
    <div class="hero">
        <h1>Welcome to Soulfra</h1>
        <p>The unified gaming platform where consciousness meets code</p>
    </div>

    <section id="games" class="section">
        <h2 class="section-title">Active Games</h2>
        <div class="game-grid">
            <div class="game-card">
                <div class="game-preview">
                    <iframe src="http://localhost:13001" loading="lazy"></iframe>
                </div>
                <div class="game-info">
                    <h3 class="game-title">Habbo Style World</h3>
                    <p class="game-desc">Isometric social world with character customization</p>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="online-dot"></span>
                            <span>Online</span>
                        </div>
                        <div class="stat">Port: 13001</div>
                    </div>
                    <a href="http://localhost:13001" class="play-btn" target="_blank">ENTER WORLD</a>
                </div>
            </div>

            <div class="game-card">
                <div class="game-preview">
                    <iframe src="http://localhost:13002" loading="lazy"></iframe>
                </div>
                <div class="game-info">
                    <h3 class="game-title">RuneScape Adventure</h3>
                    <p class="game-desc">Classic RPG with minimap and stat tracking</p>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="online-dot"></span>
                            <span>Online</span>
                        </div>
                        <div class="stat">Port: 13002</div>
                    </div>
                    <a href="http://localhost:13002" class="play-btn" target="_blank">START ADVENTURE</a>
                </div>
            </div>

            <div class="game-card">
                <div class="game-preview">
                    <iframe src="http://localhost:13003" loading="lazy"></iframe>
                </div>
                <div class="game-info">
                    <h3 class="game-title">AI Battle Arena</h3>
                    <p class="game-desc">Bet on AI fighters in automated combat</p>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="online-dot"></span>
                            <span>Online</span>
                        </div>
                        <div class="stat">Port: 13003</div>
                    </div>
                    <a href="http://localhost:13003" class="play-btn" target="_blank">WATCH BATTLES</a>
                </div>
            </div>
        </div>
    </section>

    <section id="platform" class="platform-section">
        <h2 class="section-title">Platform Features</h2>
        <div class="feature-grid">
            <div class="feature">
                <div class="feature-icon">🎮</div>
                <h3>Gaming Hub</h3>
                <p>Multiple game styles from simple to complex</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🤖</div>
                <h3>AI Integration</h3>
                <p>Automated battles and intelligent NPCs</p>
            </div>
            <div class="feature">
                <div class="feature-icon">💰</div>
                <h3>Betting System</h3>
                <p>Stake credits on AI battles and events</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🏛️</div>
                <h3>Arena Events</h3>
                <p>Colosseum-style tournaments</p>
            </div>
        </div>
    </section>

    <section class="section">
        <h2 class="section-title">Core Systems</h2>
        <div class="game-grid">
            <div class="game-card">
                <div class="game-info">
                    <h3 class="game-title">Main Platform</h3>
                    <p class="game-desc">The core Soulfra ecosystem and dashboard</p>
                    <div class="game-stats">
                        <div class="stat">Port: 3333</div>
                    </div>
                    <a href="http://localhost:3333" class="play-btn" target="_blank">ENTER PLATFORM</a>
                </div>
            </div>

            <div class="game-card">
                <div class="game-info">
                    <h3 class="game-title">Immersive Portal</h3>
                    <p class="game-desc">3D consciousness interface and reality engine</p>
                    <div class="game-stats">
                        <div class="stat">Port: 5555</div>
                    </div>
                    <a href="http://localhost:5555" class="play-btn" target="_blank">ENTER PORTAL</a>
                </div>
            </div>

            <div class="game-card">
                <div class="game-info">
                    <h3 class="game-title">Arena System</h3>
                    <p class="game-desc">Main AI vs AI battle system</p>
                    <div class="game-stats">
                        <div class="stat">Port: 4444</div>
                    </div>
                    <a href="http://localhost:4444" class="play-btn" target="_blank">ENTER ARENA</a>
                </div>
            </div>
        </div>
    </section>
</div>

<div class="status-bar">
    <div class="status-item">
        <span class="online-dot"></span>
        <span>Platform Active</span>
    </div>
    <div class="status-item">
        <span class="tier-indicator">Tier -10 Connected</span>
    </div>
    <div class="status-item">
        <span id="time"></span>
    </div>
</div>

<div class="loading-overlay" id="loading">
    <div class="loading-spinner"></div>
</div>

<script>
// Update time
function updateTime() {
    document.getElementById('time').textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

// Check service status
async function checkServices() {
    const services = [
        { port: 13001, selector: '.game-card:nth-child(1) .online-dot' },
        { port: 13002, selector: '.game-card:nth-child(2) .online-dot' },
        { port: 13003, selector: '.game-card:nth-child(3) .online-dot' }
    ];
    
    for (const service of services) {
        try {
            await fetch(`http://localhost:${service.port}`, { mode: 'no-cors' });
            document.querySelector(service.selector).style.background = '#4CAF50';
        } catch (e) {
            document.querySelector(service.selector).style.background = '#f44336';
        }
    }
}

checkServices();
setInterval(checkServices, 30000);

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Loading overlay for game launches
document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        document.getElementById('loading').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 1000);
    });
});
</script>

</body>
</html>""".encode()

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML)
    def log_message(self, f, *a): pass

print(f"Soulfra Unified Platform running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()