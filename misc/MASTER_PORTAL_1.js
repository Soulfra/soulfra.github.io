#!/usr/bin/env node

/**
 * MASTER PORTAL
 * 
 * The ONE place to see and access EVERYTHING
 * Includes documentation, demos, games, and all systems
 */

const http = require('http');
const PORT = 9000;

// Check system status
async function checkSystem(url) {
  return new Promise(resolve => {
    http.get(url, res => resolve(res.statusCode === 200))
      .on('error', () => resolve(false));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    // Check what's actually running
    const systems = [
      { name: 'Actually Working System', url: 'http://localhost:8080', desc: 'Multi-user growth platform with Cal AI' },
      { name: 'Production Legal System', url: 'http://localhost:8888', desc: 'Legal documentation & compliance' },
      { name: 'AI Economy Game', url: 'http://localhost:3003', desc: 'Watch AI agents compete for $1B goal' },
      { name: 'Cal Dashboard', url: 'http://localhost:4040', desc: 'Cal Riven reflection system' },
      { name: 'Domingo Economy', url: 'http://localhost:5055', desc: 'Bounty & reward system' }
    ];
    
    // Check status
    for (let sys of systems) {
      sys.online = await checkSystem(sys.url);
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
<title>Soulfra Master Portal</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0a0a0a;
  color: #fff;
  line-height: 1.6;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px;
  text-align: center;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.hero p {
  font-size: 20px;
  opacity: 0.9;
  max-width: 800px;
  margin: 0 auto;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.section {
  margin-bottom: 60px;
}

.section h2 {
  font-size: 32px;
  margin-bottom: 30px;
  color: #00ff88;
  border-bottom: 2px solid #00ff88;
  padding-bottom: 10px;
}

.systems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.system-card {
  background: #1a1a1a;
  border: 2px solid #2a2a2a;
  border-radius: 15px;
  padding: 25px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.system-card.online {
  border-color: #00ff88;
}

.system-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,255,136,0.3);
}

.status-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.online {
  background: #00ff88;
  color: #000;
}

.status-badge.offline {
  background: #ff4444;
  color: #fff;
}

.system-card h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #fff;
}

.system-card p {
  color: #aaa;
  margin-bottom: 20px;
  font-size: 14px;
}

.system-card a {
  display: inline-block;
  background: #00ff88;
  color: #000;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s ease;
}

.system-card a:hover {
  background: #00cc6a;
  transform: scale(1.05);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  background: linear-gradient(135deg, #1a1a1a, #2a1a2a);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #00ff88;
}

.documentation {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 30px;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.doc-link {
  background: #0a0a0a;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  text-decoration: none;
  color: #00ff88;
  border: 1px solid #00ff88;
  transition: all 0.2s ease;
}

.doc-link:hover {
  background: #00ff88;
  color: #000;
}

.roadmap {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 15px;
}

.roadmap-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #0a0a0a;
  border-radius: 10px;
}

.roadmap-status {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.roadmap-status.done { background: #00ff88; color: #000; }
.roadmap-status.progress { background: #ffa500; color: #000; }
.roadmap-status.planned { background: #666; color: #fff; }

.quick-start {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: #000;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  margin: 40px 0;
}

.quick-start h3 {
  font-size: 28px;
  margin-bottom: 20px;
}

.quick-start-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.quick-btn {
  background: #000;
  color: #00ff88;
  padding: 15px 30px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: #111;
  transform: scale(1.05);
}

.footer {
  text-align: center;
  padding: 40px 20px;
  border-top: 1px solid #333;
  margin-top: 60px;
  color: #666;
}
</style>
</head>
<body>

<div class="hero">
  <h1>🚀 Soulfra Master Portal</h1>
  <p>The ONE place to see everything we've built. Gaming culture meets real-world growth. Multi-user platform for reflection, earning, and AI-powered transformation.</p>
</div>

<div class="container">
  
  <section class="section">
    <h2>🌐 Live Systems</h2>
    <div class="systems-grid">
      ${systems.map(sys => `
        <div class="system-card ${sys.online ? 'online' : ''}">
          <span class="status-badge ${sys.online ? 'online' : 'offline'}">
            ${sys.online ? '✅ ONLINE' : '❌ OFFLINE'}
          </span>
          <h3>${sys.name}</h3>
          <p>${sys.desc}</p>
          ${sys.online ? `<a href="${sys.url}" target="_blank">Open System →</a>` : '<span style="color: #666;">Currently Offline</span>'}
        </div>
      `).join('')}
    </div>
  </section>

  <section class="section">
    <h2>🎮 What We've Built</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>Cal AI Reflection</h3>
        <p>Personal growth AI that understands depression, gaming mindset, and helps you level up in real life</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💰</div>
        <h3>Real Earning System</h3>
        <p>Earn $25-$500 per meaningful action. Help others, spread culture, find easter eggs</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚔️</div>
        <h3>RuneScape Duel Arena</h3>
        <p>Classic gaming mechanics brought to professional industries. Easter eggs everywhere</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <h3>AI Agent Economy</h3>
        <p>Watch AI agents compete, collaborate, and work toward a billion dollar goal</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>Multi-User Platform</h3>
        <p>Like DocuSign but for personal growth. Multiple people can use simultaneously</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🌊</div>
        <h3>Habbo Hotel Vibes</h3>
        <p>Virtual rooms for every industry. Network with gaming culture</p>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>📚 Documentation & Resources</h2>
    <div class="documentation">
      <h3>Quick Access</h3>
      <div class="doc-grid">
        <a href="/docs/executive-summary" class="doc-link">Executive Summary</a>
        <a href="/docs/5-year-old" class="doc-link">ELI5 Version</a>
        <a href="/docs/technical" class="doc-link">Technical Docs</a>
        <a href="/docs/api" class="doc-link">API Reference</a>
        <a href="/docs/vision" class="doc-link">Vision & Mission</a>
        <a href="/docs/roadmap" class="doc-link">Product Roadmap</a>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>🗺️ Roadmap & Progress</h2>
    <div class="roadmap">
      <div class="roadmap-item">
        <div class="roadmap-status done">✓</div>
        <div>
          <h4>Phase 1: Core Platform</h4>
          <p>Multi-user system, Cal AI integration, earning mechanics</p>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-status done">✓</div>
        <div>
          <h4>Phase 2: Gaming Integration</h4>
          <p>RuneScape arena, Habbo rooms, gaming culture mechanics</p>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-status progress">...</div>
        <div>
          <h4>Phase 3: Full Integration</h4>
          <p>Connect all systems, unified dashboard, seamless experience</p>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-status planned">🚀</div>
        <div>
          <h4>Phase 4: Scale to 130 Domains</h4>
          <p>Deploy across industries, Docker/K8s, global infrastructure</p>
        </div>
      </div>
    </div>
  </section>

  <div class="quick-start">
    <h3>🎯 Ready to Experience It?</h3>
    <p>Start with any system above or try our quick demos</p>
    <div class="quick-start-buttons">
      <a href="http://localhost:8080" class="quick-btn" target="_blank">Try Growth Platform</a>
      <a href="http://localhost:3003" class="quick-btn" target="_blank">Watch AI Economy</a>
      <a href="http://localhost:4040" class="quick-btn" target="_blank">Reflect with Cal</a>
    </div>
  </div>

</div>

<div class="footer">
  <p>Soulfra Platform &copy; 2024 | Built by someone who came from the gutter and is leading the way</p>
  <p style="margin-top: 10px; font-size: 14px;">🎮 Bringing gaming culture to every industry 🚀</p>
</div>

<script>
// Auto-refresh status every 30 seconds
setInterval(() => {
  window.location.reload();
}, 30000);

console.log('🚀 Welcome to Soulfra Master Portal');
console.log('Systems Status:');
${systems.map(s => `console.log('${s.name}: ${s.online ? "ONLINE" : "OFFLINE"}');`).join('\n')}
</script>

</body>
</html>`);
  }
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    MASTER PORTAL                              ║
║                                                               ║
║  🌐 URL: http://localhost:${PORT}                            ║
║                                                               ║
║  The ONE place to see EVERYTHING:                            ║
║  ✅ Live system status                                        ║
║  ✅ Direct links to all platforms                            ║
║  ✅ Documentation & roadmap                                   ║
║  ✅ Quick start guides                                        ║
║                                                               ║
║  This shows what's ACTUALLY running and working              ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});