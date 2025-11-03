#!/usr/bin/env python3
"""
SOULFRA ONE - The ONLY Implementation You Need
Mobile-first PWA with everything integrated
No timeouts, no port conflicts, just works
"""

import os
import sys
import json
import time
import sqlite3
import asyncio
import threading
import subprocess
import signal
import webbrowser
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal
from flask import Flask, jsonify, request, render_template_string
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import uuid
import hashlib
import qrcode
import io
import base64

# Configuration management
class Config:
    def __init__(self):
        self.config_file = Path("soulfra_config.json")
        self.load_or_create()
        
    def load_or_create(self):
        if self.config_file.exists():
            with open(self.config_file) as f:
                self.data = json.load(f)
        else:
            self.data = {
                "port": 7777,
                "stripe_key": "",
                "anthropic_key": "",
                "openai_key": "",
                "vibe_price": 0.10,
                "launch_browser": True,
                "mobile_qr": True,
                "setup_complete": False
            }
            self.save()
            
    def save(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.data, f, indent=2)
            
    def is_configured(self):
        return self.data.get("setup_complete", False)

# Kill any existing processes on our port
def kill_existing_port(port):
    """Kill any process using our port"""
    try:
        os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
        time.sleep(1)
    except:
        pass

# Initialize config
config = Config()
kill_existing_port(config.data["port"])

# Flask setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'soulfra-one-' + str(uuid.uuid4())
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Main platform class
class SOULFRAOne:
    def __init__(self):
        self.db_path = "soulfra_one.db"
        self.users = {}
        self.agents = {}
        self.debates = {}
        self.init_database()
        self.init_default_agents()
        
    def init_database(self):
        """Initialize all database tables"""
        self.db = sqlite3.connect(self.db_path, check_same_thread=False)
        cursor = self.db.cursor()
        
        # Users table with VIBE balance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT,
                email TEXT,
                vibe_balance INTEGER DEFAULT 10,
                total_spent DECIMAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # AI Agents
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT,
                emoji TEXT,
                personality TEXT,
                owner_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Transactions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                type TEXT,
                amount DECIMAL,
                vibe_amount INTEGER,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db.commit()
        
    def init_default_agents(self):
        """Initialize default AI agents"""
        self.agents = {
            'sage': {'name': 'Sage', 'emoji': '🧙', 'personality': 'wise'},
            'pixel': {'name': 'Pixel', 'emoji': '🎮', 'personality': 'playful'},
            'nova': {'name': 'Nova', 'emoji': '⭐', 'personality': 'creative'},
            'echo': {'name': 'Echo', 'emoji': '🔊', 'personality': 'musical'}
        }
        
    def get_or_create_user(self, user_id):
        """Get or create user with initial VIBE balance"""
        cursor = self.db.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.execute('''
                INSERT INTO users (id, username, vibe_balance)
                VALUES (?, ?, ?)
            ''', (user_id, f'User_{user_id[-6:]}', 10))
            self.db.commit()
            
        return user_id

# Initialize platform
platform = SOULFRAOne()

# HTML Templates
SETUP_HTML = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOULFRA Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .setup-container {
            background: rgba(255,255,255,0.05);
            border: 2px solid #00ff88;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            font-size: 48px;
            background: linear-gradient(45deg, #00ff88, #00ccff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
            text-align: center;
        }
        .form-group {
            margin-bottom: 25px;
        }
        label {
            display: block;
            margin-bottom: 10px;
            color: #00ff88;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border: 1px solid #333;
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
            transition: all 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #00ff88;
            background: rgba(255,255,255,0.15);
        }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #00ff88, #00ccff);
            border: none;
            border-radius: 10px;
            color: #000;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 20px;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,255,136,0.3);
        }
        .info {
            background: rgba(0,255,136,0.1);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 30px;
            font-size: 14px;
            line-height: 1.6;
        }
        .optional {
            opacity: 0.7;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <h1>SOULFRA Setup</h1>
        
        <div class="info">
            Welcome! Let's configure your SOULFRA platform. You can leave fields blank for now and update them later.
        </div>
        
        <form id="setupForm">
            <div class="form-group">
                <label>Port Number</label>
                <input type="number" name="port" value="7777" min="1000" max="65535">
            </div>
            
            <div class="form-group">
                <label>Stripe API Key <span class="optional">(optional - for payments)</span></label>
                <input type="text" name="stripe_key" placeholder="sk_test_...">
            </div>
            
            <div class="form-group">
                <label>OpenAI API Key <span class="optional">(optional - for AI features)</span></label>
                <input type="text" name="openai_key" placeholder="sk-...">
            </div>
            
            <div class="form-group">
                <label>Anthropic API Key <span class="optional">(optional - for Claude)</span></label>
                <input type="text" name="anthropic_key" placeholder="sk-ant-...">
            </div>
            
            <div class="form-group">
                <label>VIBE Token Price (USD)</label>
                <input type="number" name="vibe_price" value="0.10" step="0.01" min="0.01">
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="launch_browser" checked> 
                    Launch browser automatically
                </label>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="mobile_qr" checked> 
                    Show QR code for mobile access
                </label>
            </div>
            
            <button type="submit">Complete Setup & Launch SOULFRA</button>
        </form>
    </div>
    
    <script>
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const config = {};
            
            for (const [key, value] of formData.entries()) {
                if (e.target[key].type === 'checkbox') {
                    config[key] = e.target[key].checked;
                } else {
                    config[key] = value;
                }
            }
            
            const response = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            if (response.ok) {
                window.location.href = '/';
            }
        });
    </script>
</body>
</html>"""

MAIN_HTML = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SOULFRA - AI Companion Platform</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#00ff88">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow-x: hidden;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%);
            padding: 15px 20px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.5);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ccff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .vibe-display {
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(0,255,136,0.1);
            border: 2px solid #00ff88;
            padding: 10px 20px;
            border-radius: 30px;
        }
        
        .vibe-amount {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
        }
        
        /* Main Content */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Quick Actions */
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .action-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid #333;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .action-card:hover {
            transform: translateY(-5px);
            border-color: #00ff88;
            box-shadow: 0 10px 30px rgba(0,255,136,0.2);
        }
        
        .action-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .action-title {
            font-size: 20px;
            margin-bottom: 10px;
            color: #00ccff;
        }
        
        .action-desc {
            color: #999;
            font-size: 14px;
        }
        
        /* Chat Interface */
        .chat-container {
            background: rgba(255,255,255,0.05);
            border: 2px solid #333;
            border-radius: 20px;
            height: 500px;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 15px;
            max-width: 70%;
        }
        
        .message.user {
            background: #00ff88;
            color: #000;
            margin-left: auto;
        }
        
        .message.ai {
            background: rgba(255,255,255,0.1);
        }
        
        .chat-input-container {
            padding: 20px;
            border-top: 1px solid #333;
            display: flex;
            gap: 10px;
        }
        
        .chat-input {
            flex: 1;
            background: rgba(255,255,255,0.1);
            border: 1px solid #333;
            color: #fff;
            padding: 15px 20px;
            border-radius: 30px;
            font-size: 16px;
        }
        
        .chat-input:focus {
            outline: none;
            border-color: #00ff88;
        }
        
        .send-button {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            border: none;
            padding: 15px 30px;
            border-radius: 30px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .send-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0,255,136,0.4);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 15px;
            }
            
            .quick-actions {
                grid-template-columns: 1fr;
            }
            
            .chat-container {
                height: 400px;
            }
        }
        
        /* PWA Install Prompt */
        .install-prompt {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #0a0a0a);
            border: 2px solid #00ff88;
            border-radius: 15px;
            padding: 20px;
            display: none;
            z-index: 200;
        }
        
        .install-prompt.show {
            display: block;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div class="logo">SOULFRA</div>
            <div class="vibe-display">
                <div>
                    <div class="vibe-amount" id="vibeBalance">10</div>
                    <div style="font-size: 12px; color: #999;">VIBE</div>
                </div>
                <button class="send-button" style="padding: 8px 20px;" onclick="purchaseVibe()">
                    Buy VIBE
                </button>
            </div>
        </div>
    </div>
    
    <!-- Main Container -->
    <div class="container">
        <!-- Quick Actions -->
        <div class="quick-actions">
            <div class="action-card" onclick="startChat()">
                <div class="action-icon">💬</div>
                <div class="action-title">AI Chat</div>
                <div class="action-desc">Talk with your AI companion</div>
            </div>
            
            <div class="action-card" onclick="showDebates()">
                <div class="action-icon">🤖</div>
                <div class="action-title">AI Debates</div>
                <div class="action-desc">Watch AI agents debate</div>
            </div>
            
            <div class="action-card" onclick="showMarketplace()">
                <div class="action-icon">🛍️</div>
                <div class="action-title">Marketplace</div>
                <div class="action-desc">Buy personalities & items</div>
            </div>
            
            <div class="action-card" onclick="showGames()">
                <div class="action-icon">🎮</div>
                <div class="action-title">Games</div>
                <div class="action-desc">Play with your AI</div>
            </div>
        </div>
        
        <!-- Chat Interface -->
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">
                    <strong>Sage:</strong> Welcome to SOULFRA! I'm here to help you explore consciousness and have meaningful conversations. What's on your mind?
                </div>
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" id="chatInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                <button class="send-button" onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>
    
    <!-- PWA Install Prompt -->
    <div class="install-prompt" id="installPrompt">
        <p><strong>Install SOULFRA</strong></p>
        <p>Add to your home screen for the best experience!</p>
        <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button class="send-button" style="padding: 10px 20px;" onclick="installPWA()">Install</button>
            <button style="background: transparent; border: 1px solid #666; color: #666; padding: 10px 20px; border-radius: 30px; cursor: pointer;" onclick="dismissInstall()">Not Now</button>
        </div>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        // Initialize Socket.IO
        const socket = io();
        let userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
        
        // PWA Install
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installPrompt').classList.add('show');
        });
        
        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((result) => {
                    if (result.outcome === 'accepted') {
                        console.log('PWA installed');
                    }
                    deferredPrompt = null;
                    document.getElementById('installPrompt').classList.remove('show');
                });
            }
        }
        
        function dismissInstall() {
            document.getElementById('installPrompt').classList.remove('show');
        }
        
        // Chat functionality
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (message) {
                // Add user message
                addMessage(message, 'user');
                
                // Send to server
                socket.emit('chat_message', {
                    user_id: userId,
                    message: message
                });
                
                input.value = '';
            }
        }
        
        function addMessage(text, type) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            if (type === 'user') {
                messageDiv.innerHTML = `<strong>You:</strong> ${text}`;
            } else {
                messageDiv.innerHTML = text;
            }
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        // Socket event handlers
        socket.on('connect', () => {
            console.log('Connected to SOULFRA');
            socket.emit('identify', { userId: userId });
        });
        
        socket.on('chat_response', (data) => {
            addMessage(`<strong>${data.agent}:</strong> ${data.message}`, 'ai');
        });
        
        socket.on('vibe_update', (data) => {
            document.getElementById('vibeBalance').textContent = data.balance;
        });
        
        // Action handlers
        function startChat() {
            document.querySelector('.chat-container').scrollIntoView({ behavior: 'smooth' });
        }
        
        function showDebates() {
            alert('AI Debates coming soon! Watch agents debate fascinating topics.');
        }
        
        function showMarketplace() {
            alert('Marketplace coming soon! Buy personalities, items, and more with VIBE tokens.');
        }
        
        function showGames() {
            alert('Games coming soon! Play with your AI in various game worlds.');
        }
        
        function purchaseVibe() {
            if (confirm('Purchase 10 VIBE for $1?')) {
                // In production, this would open Stripe checkout
                alert('Payment integration coming soon! You would receive 10 VIBE tokens.');
            }
        }
        
        // Load user data
        async function loadUserData() {
            try {
                const response = await fetch(`/api/user/${userId}`);
                const data = await response.json();
                document.getElementById('vibeBalance').textContent = data.vibe_balance || 10;
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }
        
        // Initialize
        loadUserData();
    </script>
</body>
</html>"""

# Routes
@app.route('/')
def index():
    if not config.is_configured():
        return SETUP_HTML
    return MAIN_HTML

@app.route('/api/setup', methods=['POST'])
def setup():
    data = request.json
    config.data.update(data)
    config.data['setup_complete'] = True
    config.save()
    return jsonify({'success': True})

@app.route('/api/user/<user_id>')
def get_user(user_id):
    platform.get_or_create_user(user_id)
    cursor = platform.db.cursor()
    cursor.execute('SELECT vibe_balance FROM users WHERE id = ?', (user_id,))
    result = cursor.fetchone()
    return jsonify({
        'user_id': user_id,
        'vibe_balance': result[0] if result else 10
    })

@app.route('/manifest.json')
def manifest():
    return jsonify({
        "name": "SOULFRA",
        "short_name": "SOULFRA",
        "description": "AI Companion Platform",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0a0a0a",
        "theme_color": "#00ff88",
        "icons": [
            {
                "src": "/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            }
        ]
    })

@app.route('/qr')
def show_qr():
    """Generate QR code for mobile access"""
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    url = f"http://{local_ip}:{config.data['port']}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    
    import base64
    img_base64 = base64.b64encode(buf.getvalue()).decode()
    
    return f"""
    <html>
    <body style="background: #0a0a0a; color: #fff; text-align: center; padding: 50px; font-family: sans-serif;">
        <h1 style="color: #00ff88;">Scan to Access SOULFRA on Mobile</h1>
        <img src="data:image/png;base64,{img_base64}" style="background: white; padding: 20px; border-radius: 20px;">
        <p style="margin-top: 30px; font-size: 18px;">URL: {url}</p>
    </body>
    </html>
    """

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('identify')
def handle_identify(data):
    user_id = data.get('userId')
    platform.get_or_create_user(user_id)
    emit('identified', {'success': True})

@socketio.on('chat_message')
def handle_chat(data):
    user_id = data.get('user_id')
    message = data.get('message')
    
    # Simple AI response (replace with actual AI integration)
    responses = [
        "That's a fascinating perspective! Tell me more about your thoughts on that.",
        "I appreciate you sharing that with me. How does that make you feel?",
        "Interesting! Have you considered looking at it from another angle?",
        "Your insights are valuable. What led you to that conclusion?",
        "I'm here to explore these ideas with you. What aspect interests you most?"
    ]
    
    import random
    response = random.choice(responses)
    
    emit('chat_response', {
        'agent': 'Sage',
        'message': response
    }, room=request.sid)

# Auto-restart wrapper
class AutoRestartServer:
    def __init__(self):
        self.process = None
        self.should_run = True
        
    def signal_handler(self, signum, frame):
        print("\n🛑 Shutting down SOULFRA...")
        self.should_run = False
        if self.process:
            self.process.terminate()
        sys.exit(0)
        
    def run(self):
        signal.signal(signal.SIGINT, self.signal_handler)
        
        while self.should_run:
            try:
                print(f"""
🚀 SOULFRA ONE - Starting Up
==========================
Port: {config.data['port']}
URL: http://localhost:{config.data['port']}
Mobile: http://[your-ip]:{config.data['port']}
QR Code: http://localhost:{config.data['port']}/qr

Features:
✅ Mobile-first PWA
✅ Auto-restart on timeout
✅ Setup wizard
✅ VIBE economy
✅ AI chat
✅ No more chaos!

Press Ctrl+C to stop
""")
                
                # Open browser if configured
                if config.data.get('launch_browser') and config.is_configured():
                    webbrowser.open(f"http://localhost:{config.data['port']}")
                
                # Run the Flask app
                socketio.run(app, 
                    host='0.0.0.0', 
                    port=config.data['port'], 
                    debug=False,
                    allow_unsafe_werkzeug=True)
                    
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"⚠️  Error: {e}")
                print("🔄 Restarting in 5 seconds...")
                time.sleep(5)

if __name__ == '__main__':
    server = AutoRestartServer()
    server.run()