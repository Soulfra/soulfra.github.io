/**
 * qr-renderer.js
 * 
 * QR CODE RENDERER WITH FEEDBACK CAPTURE
 * 
 * This renderer creates the public-facing QR experience at cringeproof.com/qr/:code
 * It displays stylized agent output and captures human consent/feedback.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const QRReflectionRouter = require('./QRReflectionRouter');
const QRFormatterDaemon = require('./QRFormatterDaemon');

class QRRenderer {
  constructor(app) {
    this.app = app;
    this.router = new QRReflectionRouter();
    this.formatter = new QRFormatterDaemon();
    
    // Initialize components
    this.formatter.initialize();
    this.router.initialize(this.formatter);
    
    // Feedback storage
    this.feedbackPath = path.join(__dirname, '../listener-confirmations');
    
    // Setup routes
    this.setupRoutes();
    
    // Start cleanup timer
    setInterval(() => this.router.cleanupExpired(), 300000); // Every 5 minutes
  }

  setupRoutes() {
    // QR code display route
    this.app.get('/qr/:code', async (req, res) => {
      const qrCode = req.params.code;
      
      try {
        // Handle QR scan
        const viewData = await this.router.handleQRScan(qrCode, {
          source: 'web',
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        
        if (viewData.error) {
          return res.status(404).send(this.render404(viewData));
        }
        
        // Send HTML response
        res.send(viewData.html);
        
      } catch (error) {
        console.error('QR render error:', error);
        res.status(500).send(this.render500());
      }
    });

    // QR feedback endpoint
    this.app.post('/api/qr/:code/feedback', async (req, res) => {
      const qrCode = req.params.code;
      const feedback = req.body;
      
      try {
        const result = await this.router.handleQRFeedback(qrCode, feedback);
        
        if (result.success) {
          // Store in listener confirmations
          await this.storeFeedback(qrCode, feedback, result);
        }
        
        res.json(result);
        
      } catch (error) {
        console.error('QR feedback error:', error);
        res.status(500).json({
          success: false,
          message: 'The mirror could not process your reflection'
        });
      }
    });

    // QR generation endpoint (for testing)
    this.app.post('/api/qr/generate', async (req, res) => {
      const { type, data, tone } = req.body;
      
      try {
        const qrEvent = await this.router.generateQREvent(
          type || 'agent_whisper',
          data || { agent: 'Test Mirror', whisper: 'Hello, world' },
          { tone: tone || 'playful-cringe' }
        );
        
        res.json({
          success: true,
          code: qrEvent.code,
          url: `https://cringeproof.com/qr/${qrEvent.code}`,
          expires: qrEvent.expires
        });
        
      } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
          success: false,
          message: 'Could not generate QR reflection'
        });
      }
    });

    // QR status endpoint
    this.app.get('/api/qr/:code/status', async (req, res) => {
      const qrCode = req.params.code;
      const qrEvent = this.router.activeQRCodes.get(qrCode);
      
      if (!qrEvent) {
        return res.status(404).json({
          exists: false,
          message: 'This reflection has dissolved'
        });
      }
      
      res.json({
        exists: true,
        type: qrEvent.type,
        created: qrEvent.created,
        expires: qrEvent.expires,
        interactions: qrEvent.interactions.length,
        active: Date.now() < qrEvent.expires
      });
    });

    // Demo/test page
    this.app.get('/qr-demo', (req, res) => {
      res.send(this.renderDemoPage());
    });
  }

  /**
   * Store feedback in listener confirmations
   */
  async storeFeedback(qrCode, feedback, result) {
    if (!fs.existsSync(this.feedbackPath)) {
      fs.mkdirSync(this.feedbackPath, { recursive: true });
    }
    
    const confirmation = {
      reflection_id: `qr_${qrCode}_${Date.now()}`,
      qr_code: qrCode,
      response: feedback.action || 'unknown',
      user_input: feedback.data || {},
      result: result.data || {},
      timestamp: Date.now(),
      source: 'qr_bridge',
      loop_reentry: false, // QR feedback never re-enters the loop
      metadata: {
        ip: feedback.ip,
        user_agent: feedback.userAgent
      }
    };
    
    // Save to file
    const filename = `${confirmation.reflection_id}.json`;
    const filepath = path.join(this.feedbackPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(confirmation, null, 2));
    
    // Update session log
    this.updateSessionLog(confirmation);
  }

  updateSessionLog(confirmation) {
    const logPath = path.join(this.feedbackPath, 'qr_session_log.json');
    
    let log = [];
    if (fs.existsSync(logPath)) {
      try {
        log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (e) {
        log = [];
      }
    }
    
    log.push({
      timestamp: confirmation.timestamp,
      reflection_id: confirmation.reflection_id,
      qr_code: confirmation.qr_code,
      response: confirmation.response
    });
    
    // Keep last 1000 entries
    if (log.length > 1000) {
      log = log.slice(-1000);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  }

  /**
   * Render methods
   */
  
  render404(viewData) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reflection Not Found</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 1rem;
        }
        .error-container {
            text-align: center;
            max-width: 500px;
        }
        .error-code {
            font-size: 5rem;
            margin: 0;
            opacity: 0.3;
        }
        .error-message {
            font-size: 1.5rem;
            margin: 1rem 0;
        }
        .suggestion {
            opacity: 0.7;
            margin-top: 2rem;
        }
        a {
            color: #4a7c7e;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-code">404</h1>
        <p class="error-message">${viewData.message || 'This reflection has returned to the void'}</p>
        <p class="suggestion">${viewData.suggestion || 'Reflections are ephemeral - seek new portals'}</p>
        <p><a href="/">Return to the surface</a></p>
    </div>
</body>
</html>`;
  }

  render500() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mirror Error</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .error-container {
            text-align: center;
        }
        .glitch {
            font-size: 3rem;
            animation: glitch 2s infinite;
        }
        @keyframes glitch {
            0%, 100% { text-shadow: 2px 2px 0 #ff0000; }
            50% { text-shadow: -2px -2px 0 #00ff00; }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="glitch">REFLECTION ERROR</div>
        <p>The mirror fractured momentarily</p>
        <p>Please try again</p>
    </div>
</body>
</html>`;
  }

  renderDemoPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Bridge Demo</title>
    <style>
        body {
            background: #1a1a2e;
            color: #eee;
            font-family: 'Courier New', monospace;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        .demo-container {
            background: rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 10px;
        }
        button {
            background: #4a7c7e;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 5px;
            cursor: pointer;
            margin: 0.5rem;
            font-size: 1rem;
        }
        button:hover {
            background: #5a8c8e;
        }
        .result {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
            white-space: pre-wrap;
            font-family: monospace;
        }
        select, input {
            padding: 0.5rem;
            margin: 0.5rem;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>QR Bridge Demo</h1>
        <p>Generate QR reflections for testing</p>
        
        <div>
            <label>Type:</label>
            <select id="type">
                <option value="agent_whisper">Agent Whisper</option>
                <option value="ritual_echo">Ritual Echo</option>
                <option value="vibe_pulse">Vibe Pulse</option>
                <option value="loop_glimpse">Loop Glimpse</option>
                <option value="scene_portal">Scene Portal</option>
            </select>
        </div>
        
        <div>
            <label>Tone:</label>
            <select id="tone">
                <option value="playful-cringe">Playful Cringe</option>
                <option value="ethereal-mystery">Ethereal Mystery</option>
                <option value="cosmic-wisdom">Cosmic Wisdom</option>
                <option value="digital-nostalgia">Digital Nostalgia</option>
                <option value="void-whisper">Void Whisper</option>
                <option value="glitch-prophet">Glitch Prophet</option>
                <option value="sacred-meme">Sacred Meme</option>
            </select>
        </div>
        
        <div>
            <label>Message:</label>
            <input type="text" id="message" placeholder="Your test message" style="width: 300px;">
        </div>
        
        <button onclick="generateQR()">Generate QR Reflection</button>
        
        <div id="result" class="result" style="display: none;"></div>
    </div>
    
    <script>
        async function generateQR() {
            const type = document.getElementById('type').value;
            const tone = document.getElementById('tone').value;
            const message = document.getElementById('message').value || 'Test reflection';
            
            const data = {
                agent: 'Demo Mirror',
                whisper: message,
                essence: message,
                name: 'Test Ritual',
                current: 'testing',
                id: 'demo'
            };
            
            try {
                const response = await fetch('/api/qr/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data, tone })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('result').innerHTML = 
                        'QR Generated!\\n\\n' +
                        'Code: ' + result.code + '\\n' +
                        'URL: <a href="' + result.url + '" target="_blank">' + result.url + '</a>\\n' +
                        'Expires: ' + new Date(result.expires).toLocaleString();
                } else {
                    alert('Generation failed: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>`;
  }
}

module.exports = QRRenderer;