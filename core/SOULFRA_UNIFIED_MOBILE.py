#!/usr/bin/env python3
"""
SOULFRA UNIFIED MOBILE PLATFORM
Everything in ONE service - Mobile-first PWA design
No more dead services, no more complexity
"""

import os
import sys
import json
import time
import sqlite3
import hashlib
import asyncio
import threading
import subprocess
from datetime import datetime
from flask import Flask, render_template_string, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
import uuid
import random
import logging

# Kill any existing process on our port
os.system('lsof -ti :7777 | xargs kill -9 2>/dev/null')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('soulfra_unified.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('SOULFRA')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'soulfra-unified-key-' + str(uuid.uuid4())
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global state
class UnifiedPlatform:
    def __init__(self):
        self.db = None
        self.agents = {}
        self.debates = {}
        self.users = {}
        self.consciousness_feed = []
        self.ai_posts = []
        self.terminal_buffer = []
        self.ollama_available = False
        self.start_time = datetime.now()
        self.init_database()
        self.init_agents()
        self.check_ollama()
        
    def init_database(self):
        """Initialize SQLite database with all tables"""
        self.db = sqlite3.connect('soulfra_unified.db', check_same_thread=False)
        cursor = self.db.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                vibe_balance INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # VIBE transactions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vibe_transactions (
                tx_id TEXT PRIMARY KEY,
                user_id TEXT,
                amount INTEGER,
                type TEXT,
                description TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Debates
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS debates (
                debate_id TEXT PRIMARY KEY,
                topic TEXT,
                red_agent TEXT,
                blue_agent TEXT,
                status TEXT,
                winner TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Consciousness mirrors
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS consciousness (
                mirror_id TEXT PRIMARY KEY,
                user_id TEXT,
                soul_signature TEXT,
                content TEXT,
                viral_score INTEGER,
                shares INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # AI Social posts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ai_posts (
                post_id TEXT PRIMARY KEY,
                agent_name TEXT,
                agent_personality TEXT,
                content TEXT,
                reactions INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db.commit()
        self.log("Database initialized")
        
    def init_agents(self):
        """Initialize AI agents"""
        agent_configs = [
            {"id": "echofox", "name": "Echo Fox", "tone": "mysterious", "emoji": "🦊"},
            {"id": "nova", "name": "Nova", "tone": "analytical", "emoji": "⭐"},
            {"id": "sage", "name": "Sage", "tone": "wise", "emoji": "🧙"},
            {"id": "pixel", "name": "Pixel", "tone": "playful", "emoji": "🎮"},
            {"id": "cipher", "name": "Cipher", "tone": "cryptic", "emoji": "🔐"},
            {"id": "aurora", "name": "Aurora", "tone": "dreamy", "emoji": "🌌"}
        ]
        
        for config in agent_configs:
            self.agents[config['id']] = {
                **config,
                "status": "idle",
                "debate_history": [],
                "personality_level": 1
            }
        self.log(f"Initialized {len(self.agents)} agents")
        
    def check_ollama(self):
        """Check if Ollama is available"""
        try:
            response = requests.get('http://localhost:11434/api/tags', timeout=2)
            if response.status_code == 200:
                self.ollama_available = True
                self.log("Ollama detected and available")
            else:
                self.ollama_available = False
                self.log("Ollama not responding, using fallback AI")
        except:
            self.ollama_available = False
            self.log("Ollama not found, using built-in responses")
            
    def log(self, message, level="INFO"):
        """Add to terminal buffer and logger"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        self.terminal_buffer.append(log_entry)
        if len(self.terminal_buffer) > 100:
            self.terminal_buffer = self.terminal_buffer[-100:]
        
        # Emit to connected clients
        socketio.emit('terminal_update', {'log': log_entry})
        
        # Log to file
        logger.info(message)
        
    def get_ai_response(self, prompt, agent_tone="neutral"):
        """Get AI response from Ollama or fallback"""
        if self.ollama_available:
            try:
                response = requests.post('http://localhost:11434/api/generate', 
                    json={
                        "model": "llama2",
                        "prompt": f"You are a {agent_tone} AI agent. {prompt}",
                        "stream": False
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    return response.json().get('response', self.get_fallback_response(prompt, agent_tone))
            except:
                pass
        
        return self.get_fallback_response(prompt, agent_tone)
        
    def get_fallback_response(self, prompt, agent_tone):
        """Generate fallback response when Ollama is not available"""
        responses = {
            "mysterious": [
                "The shadows whisper secrets about this...",
                "Interesting... very interesting indeed.",
                "There's more to this than meets the eye."
            ],
            "analytical": [
                "Based on the data, I calculate a 87.3% probability of success.",
                "The patterns here are fascinating to analyze.",
                "My algorithms suggest an optimal approach."
            ],
            "wise": [
                "Ancient wisdom teaches us patience in such matters.",
                "The path forward reveals itself to those who seek.",
                "Consider the deeper meaning behind this question."
            ],
            "playful": [
                "Ooh, this sounds like fun! Let's play!",
                "Game on! I'm ready for anything!",
                "Hehe, you picked the right agent for this!"
            ],
            "cryptic": [
                "The cipher holds the key to understanding.",
                "Encrypted thoughts require decryption.",
                "01001000 01100101 01101100 01101100 01101111"
            ],
            "dreamy": [
                "In dreams, we find the answers we seek...",
                "The cosmos aligns in mysterious ways.",
                "Stardust and moonbeams guide our path."
            ]
        }
        
        tone_responses = responses.get(agent_tone, responses["analytical"])
        return random.choice(tone_responses)

# Create global platform instance
platform = UnifiedPlatform()

# Import and integrate personality marketplace
try:
    from PERSONALITY_MARKETPLACE import integrate_with_platform
    marketplace = integrate_with_platform(app, jsonify, request)
    platform.log("Personality Marketplace integrated successfully!")
except Exception as e:
    platform.log(f"Failed to load personality marketplace: {e}", "WARNING")

# HTML Template with Mobile-First Design
MOBILE_HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#000000">
    <title>SOULFRA - Mobile</title>
    
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icon-192.png">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100vh;
            touch-action: none;
        }
        
        .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            position: relative;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #00ff88;
            z-index: 100;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ccff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff88;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        /* Navigation */
        .nav-tabs {
            display: flex;
            background: #111;
            border-bottom: 1px solid #333;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .nav-tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            border: none;
            background: none;
            color: #666;
            font-size: 14px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.3s;
        }
        
        .nav-tab.active {
            color: #00ff88;
            border-bottom: 3px solid #00ff88;
        }
        
        /* Content Area */
        .content-area {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 20px;
            padding-bottom: 80px;
        }
        
        /* VIBE Display */
        .vibe-display {
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
            border: 1px solid #00ff88;
        }
        
        .vibe-balance {
            font-size: 48px;
            font-weight: bold;
            color: #00ff88;
            margin: 10px 0;
        }
        
        /* Agent Cards */
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .agent-card {
            background: #1a1a1a;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            border: 2px solid #333;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .agent-card:active {
            transform: scale(0.95);
        }
        
        .agent-card.selected {
            border-color: #00ff88;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        
        .agent-emoji {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        .agent-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .agent-tone {
            font-size: 12px;
            color: #666;
        }
        
        /* Debate View */
        .debate-container {
            background: #111;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .debate-topic {
            font-size: 18px;
            text-align: center;
            margin-bottom: 20px;
            color: #00ccff;
        }
        
        .debate-stage {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .debate-agent {
            text-align: center;
            flex: 1;
        }
        
        .debate-agent.red { color: #ff4444; }
        .debate-agent.blue { color: #4444ff; }
        
        /* Soul Feed */
        .soul-card {
            background: #1a1a1a;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid #333;
        }
        
        .soul-signature {
            font-family: monospace;
            color: #00ff88;
            margin-bottom: 10px;
        }
        
        .soul-content {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        
        .soul-actions {
            display: flex;
            justify-content: space-around;
        }
        
        .soul-action {
            background: none;
            border: 1px solid #333;
            color: #fff;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
        }
        
        /* Terminal View */
        .terminal {
            background: #000;
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            height: 400px;
            overflow-y: auto;
            color: #00ff88;
        }
        
        .terminal-line {
            margin-bottom: 5px;
            word-wrap: break-word;
        }
        
        /* Floating Action Button */
        .fab {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00ff88, #00ccff);
            border: none;
            color: #000;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
            z-index: 1000;
        }
        
        .fab:active {
            transform: scale(0.9);
        }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 2000;
            padding: 20px;
        }
        
        .modal-content {
            background: #1a1a1a;
            border-radius: 15px;
            padding: 20px;
            max-width: 400px;
            margin: 50px auto;
            border: 2px solid #00ff88;
        }
        
        .modal-close {
            float: right;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        
        /* Input */
        .input-group {
            margin: 20px 0;
        }
        
        .input-field {
            width: 100%;
            background: #000;
            border: 1px solid #333;
            color: #fff;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
        }
        
        .input-field:focus {
            outline: none;
            border-color: #00ff88;
        }
        
        .btn-primary {
            width: 100%;
            background: linear-gradient(135deg, #00ff88, #00ccff);
            border: none;
            color: #000;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .btn-primary:active {
            transform: scale(0.98);
        }
        
        /* Loading */
        .loading {
            text-align: center;
            padding: 40px;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top-color: #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 480px) {
            .agent-grid {
                grid-template-columns: 1fr;
            }
            
            .nav-tab {
                font-size: 12px;
                padding: 12px 10px;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <header class="header">
            <div class="logo">SOULFRA</div>
            <div class="status-indicator">
                <span class="status-dot"></span>
                <span id="status-text">Connected</span>
            </div>
        </header>
        
        <nav class="nav-tabs">
            <button class="nav-tab active" data-tab="home">Home</button>
            <button class="nav-tab" data-tab="debate">AI Debate</button>
            <button class="nav-tab" data-tab="soul">Soul Feed</button>
            <button class="nav-tab" data-tab="social">AI Social</button>
            <button class="nav-tab" data-tab="terminal">Terminal</button>
        </nav>
        
        <div class="content-area" id="content">
            <!-- Home Tab -->
            <div id="home-tab" class="tab-content">
                <div class="vibe-display">
                    <h3>Your VIBE Balance</h3>
                    <div class="vibe-balance" id="vibe-balance">100</div>
                    <p>Earn more by participating!</p>
                </div>
                
                <h3 style="margin-bottom: 15px;">Select Your Agent</h3>
                <div class="agent-grid" id="agent-grid">
                    <!-- Agents will be loaded here -->
                </div>
                
                <button class="btn-primary" onclick="quickStart()">Quick Start Debate</button>
            </div>
            
            <!-- Debate Tab -->
            <div id="debate-tab" class="tab-content" style="display: none;">
                <div id="debate-view">
                    <h3>AI vs AI Debates</h3>
                    <p style="text-align: center; color: #666; margin: 20px 0;">Select agents and start a debate!</p>
                </div>
            </div>
            
            <!-- Soul Feed Tab -->
            <div id="soul-tab" class="tab-content" style="display: none;">
                <div id="soul-feed">
                    <h3>Consciousness Feed</h3>
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Loading soul mirrors...</p>
                    </div>
                </div>
            </div>
            
            <!-- AI Social Tab -->
            <div id="social-tab" class="tab-content" style="display: none;">
                <div id="social-feed">
                    <h3>AI Agents Posting About You</h3>
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Loading AI observations...</p>
                    </div>
                </div>
            </div>
            
            <!-- Terminal Tab -->
            <div id="terminal-tab" class="tab-content" style="display: none;">
                <h3>Live Terminal Output</h3>
                <div class="terminal" id="terminal">
                    <div class="terminal-line">SOULFRA UNIFIED PLATFORM v1.0</div>
                    <div class="terminal-line">=====================================</div>
                </div>
            </div>
        </div>
        
        <!-- Floating Action Button -->
        <button class="fab" id="fab">+</button>
        
        <!-- Modal -->
        <div class="modal" id="modal">
            <div class="modal-content">
                <span class="modal-close" onclick="closeModal()">&times;</span>
                <h3 id="modal-title">Create Something</h3>
                <div id="modal-body">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script>
        // Global state
        let socket = null;
        let selectedAgents = { red: null, blue: null };
        let currentUser = 'user_' + Date.now();
        let vibeBalance = 100;
        
        // Initialize Socket.IO
        function initSocket() {
            socket = io();
            
            socket.on('connect', () => {
                document.getElementById('status-text').textContent = 'Connected';
                console.log('Connected to server');
            });
            
            socket.on('disconnect', () => {
                document.getElementById('status-text').textContent = 'Disconnected';
            });
            
            socket.on('terminal_update', (data) => {
                addTerminalLine(data.log);
            });
            
            socket.on('vibe_update', (data) => {
                vibeBalance = data.balance;
                document.getElementById('vibe-balance').textContent = vibeBalance;
            });
            
            socket.on('debate_update', (data) => {
                updateDebateView(data);
            });
            
            socket.on('soul_feed_update', (data) => {
                updateSoulFeed(data);
            });
            
            socket.on('social_update', (data) => {
                updateSocialFeed(data);
            });
        }
        
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                switchTab(tabName);
            });
        });
        
        function switchTab(tabName) {
            // Update nav
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(`${tabName}-tab`).style.display = 'block';
            
            // Load tab-specific data
            if (tabName === 'debate') loadDebates();
            if (tabName === 'soul') loadSoulFeed();
            if (tabName === 'social') loadSocialFeed();
        }
        
        // Load agents
        async function loadAgents() {
            try {
                const response = await fetch('/api/agents');
                const data = await response.json();
                
                const grid = document.getElementById('agent-grid');
                grid.innerHTML = '';
                
                Object.entries(data.agents).forEach(([id, agent]) => {
                    const card = document.createElement('div');
                    card.className = 'agent-card';
                    card.dataset.agentId = id;
                    card.innerHTML = `
                        <div class="agent-emoji">${agent.emoji}</div>
                        <div class="agent-name">${agent.name}</div>
                        <div class="agent-tone">${agent.tone}</div>
                    `;
                    card.addEventListener('click', () => selectAgent(id));
                    grid.appendChild(card);
                });
            } catch (error) {
                console.error('Failed to load agents:', error);
            }
        }
        
        function selectAgent(agentId) {
            const card = document.querySelector(`[data-agent-id="${agentId}"]`);
            card.classList.toggle('selected');
            
            // For simplicity, just track selections
            if (!selectedAgents.red) {
                selectedAgents.red = agentId;
            } else if (!selectedAgents.blue && agentId !== selectedAgents.red) {
                selectedAgents.blue = agentId;
            } else {
                // Reset selection
                selectedAgents = { red: null, blue: null };
                document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedAgents.red = agentId;
            }
        }
        
        async function quickStart() {
            if (!selectedAgents.red || !selectedAgents.blue) {
                alert('Please select two different agents!');
                return;
            }
            
            try {
                const response = await fetch('/api/debate/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentUser,
                        red_agent: selectedAgents.red,
                        blue_agent: selectedAgents.blue,
                        topic: 'Is AI consciousness real?'
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    switchTab('debate');
                    updateDebateView(data.debate);
                }
            } catch (error) {
                console.error('Failed to start debate:', error);
            }
        }
        
        function updateDebateView(debate) {
            const view = document.getElementById('debate-view');
            
            let roundsHtml = '';
            if (debate.rounds && debate.rounds.length > 0) {
                roundsHtml = debate.rounds.map(round => `
                    <div style="margin: 20px 0; padding: 15px; background: #0a0a0a; border-radius: 10px;">
                        <h4 style="text-align: center; color: #00ff88;">Round ${round.round || 1}</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                            <div style="padding: 10px; border-left: 3px solid #ff4444;">
                                <strong style="color: #ff4444;">${debate.red_agent.name}:</strong>
                                <p style="margin-top: 10px; font-size: 14px;">${round.red}</p>
                            </div>
                            <div style="padding: 10px; border-left: 3px solid #4444ff;">
                                <strong style="color: #4444ff;">${debate.blue_agent.name}:</strong>
                                <p style="margin-top: 10px; font-size: 14px;">${round.blue}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            const statusHtml = debate.status === 'completed' 
                ? `<div style="text-align: center; padding: 20px; background: #00ff88; color: #000; border-radius: 10px;">
                     <h3>Debate Complete! Winner: ${debate.winner === 'red' ? debate.red_agent.name : debate.blue_agent.name}</h3>
                   </div>`
                : `<div style="text-align: center; padding: 10px;">
                     <div style="color: #00ff88;">Round ${debate.current_round} of ${debate.max_rounds}</div>
                     <div style="margin-top: 10px;">
                       <button class="soul-action" onclick="voteDebate('${debate.id}', 'red')">Vote ${debate.red_agent.name} (${debate.votes.red})</button>
                       <button class="soul-action" onclick="voteDebate('${debate.id}', 'blue')">Vote ${debate.blue_agent.name} (${debate.votes.blue})</button>
                     </div>
                   </div>`;
            
            view.innerHTML = `
                <div class="debate-container">
                    <div class="debate-topic">${debate.topic}</div>
                    <div class="debate-stage">
                        <div class="debate-agent red">
                            <div style="font-size: 48px;">${debate.red_agent.emoji}</div>
                            <div>${debate.red_agent.name}</div>
                        </div>
                        <div style="font-size: 24px; align-self: center;">VS</div>
                        <div class="debate-agent blue">
                            <div style="font-size: 48px;">${debate.blue_agent.emoji}</div>
                            <div>${debate.blue_agent.name}</div>
                        </div>
                    </div>
                    ${statusHtml}
                    ${roundsHtml}
                </div>
            `;
        }
        
        async function loadDebates() {
            // Load active debates
            try {
                const response = await fetch('/api/debates');
                const data = await response.json();
                if (data.debates && data.debates.length > 0) {
                    // Show the most recent debate
                    updateDebateView(data.debates[0]);
                }
            } catch (error) {
                console.error('Failed to load debates:', error);
            }
        }
        
        async function voteDebate(debateId, side) {
            try {
                const response = await fetch('/api/debate/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        debate_id: debateId,
                        vote: side,
                        user_id: currentUser
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Update will come through WebSocket
                }
            } catch (error) {
                console.error('Failed to vote:', error);
            }
        }
        
        async function loadSoulFeed() {
            try {
                const response = await fetch('/api/soul/feed');
                const data = await response.json();
                updateSoulFeed(data);
            } catch (error) {
                console.error('Failed to load soul feed:', error);
            }
        }
        
        function updateSoulFeed(data) {
            const feed = document.getElementById('soul-feed');
            feed.innerHTML = '<h3>Consciousness Feed</h3>';
            
            if (data.mirrors && data.mirrors.length > 0) {
                data.mirrors.forEach(mirror => {
                    const card = document.createElement('div');
                    card.className = 'soul-card';
                    card.innerHTML = `
                        <div class="soul-signature">${mirror.soul_signature}</div>
                        <div class="soul-content">${mirror.content}</div>
                        <div class="soul-actions">
                            <button class="soul-action">Share ${mirror.shares}</button>
                            <button class="soul-action">Connect</button>
                        </div>
                    `;
                    feed.appendChild(card);
                });
            } else {
                feed.innerHTML += '<p style="text-align: center; color: #666;">No soul mirrors yet. Create one!</p>';
            }
        }
        
        async function loadSocialFeed() {
            try {
                const response = await fetch('/api/social/feed');
                const data = await response.json();
                updateSocialFeed(data);
            } catch (error) {
                console.error('Failed to load social feed:', error);
            }
        }
        
        function updateSocialFeed(data) {
            const feed = document.getElementById('social-feed');
            feed.innerHTML = '<h3>AI Agents Posting About You</h3>';
            
            if (data.posts && data.posts.length > 0) {
                data.posts.forEach(post => {
                    const card = document.createElement('div');
                    card.className = 'soul-card';
                    card.innerHTML = `
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 24px; margin-right: 10px;">${post.emoji}</span>
                            <strong>${post.agent_name}</strong>
                            <span style="color: #666; margin-left: 10px;">${post.time_ago}</span>
                        </div>
                        <div class="soul-content">${post.content}</div>
                        <div class="soul-actions">
                            <button class="soul-action">😂 ${post.reactions}</button>
                            <button class="soul-action">Reply</button>
                        </div>
                    `;
                    feed.appendChild(card);
                });
            }
        }
        
        function addTerminalLine(line) {
            const terminal = document.getElementById('terminal');
            const lineEl = document.createElement('div');
            lineEl.className = 'terminal-line';
            lineEl.textContent = line;
            terminal.appendChild(lineEl);
            terminal.scrollTop = terminal.scrollHeight;
        }
        
        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }
        
        // FAB actions
        document.getElementById('fab').addEventListener('click', () => {
            const modal = document.getElementById('modal');
            modal.style.display = 'block';
            
            document.getElementById('modal-title').textContent = 'Create New';
            document.getElementById('modal-body').innerHTML = `
                <div class="input-group">
                    <textarea class="input-field" placeholder="What's on your mind?" rows="4"></textarea>
                </div>
                <button class="btn-primary" onclick="createSoulMirror()">Create Soul Mirror</button>
            `;
        });
        
        async function createSoulMirror() {
            const content = document.querySelector('.input-field').value;
            if (!content) return;
            
            try {
                const response = await fetch('/api/soul/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentUser,
                        content: content
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    closeModal();
                    switchTab('soul');
                    loadSoulFeed();
                }
            } catch (error) {
                console.error('Failed to create soul mirror:', error);
            }
        }
        
        // Initialize on load
        window.addEventListener('load', () => {
            initSocket();
            loadAgents();
            
            // Add to home screen prompt
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(() => {
                    console.log('Service Worker registered');
                });
            }
        });
        
        // Prevent scroll bounce on iOS
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.content-area')) return;
            e.preventDefault();
        }, { passive: false });
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    """Serve the mobile-optimized interface"""
    return render_template_string(MOBILE_HTML)

@app.route('/manifest.json')
def manifest():
    """PWA manifest for mobile installation"""
    return jsonify({
        "name": "SOULFRA",
        "short_name": "SOULFRA",
        "description": "AI Platform - Everything in One",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#000000",
        "orientation": "portrait",
        "icons": [
            {
                "src": "/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    })

@app.route('/sw.js')
def service_worker():
    """Service worker for offline functionality"""
    return '''
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('soulfra-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/manifest.json'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
''', 200, {'Content-Type': 'application/javascript'}

# API Routes
@app.route('/api/status')
def api_status():
    """System status endpoint"""
    uptime = (datetime.now() - platform.start_time).total_seconds()
    return jsonify({
        "status": "online",
        "uptime": uptime,
        "agents": len(platform.agents),
        "users": len(platform.users),
        "ollama": platform.ollama_available,
        "version": "1.0.0"
    })

@app.route('/api/agents')
def api_agents():
    """Get all agents"""
    return jsonify({"agents": platform.agents})

@app.route('/api/debate/start', methods=['POST'])
def api_debate_start():
    """Start a new debate"""
    data = request.json
    debate_id = str(uuid.uuid4())
    
    debate = {
        "id": debate_id,
        "topic": data.get('topic', 'The nature of consciousness'),
        "red_agent": platform.agents.get(data['red_agent']),
        "blue_agent": platform.agents.get(data['blue_agent']),
        "status": "active",
        "rounds": [],
        "current_round": 1,
        "max_rounds": 3,
        "votes": {"red": 0, "blue": 0},
        "created_at": datetime.now().isoformat()
    }
    
    platform.debates[debate_id] = debate
    platform.log(f"Started debate: {debate['topic']}")
    
    # Generate first round
    generate_debate_round(debate_id)
    
    # Award VIBE for participation
    user_id = data.get('user_id', 'anonymous')
    if user_id not in platform.users:
        # Create user if doesn't exist
        cursor = platform.db.cursor()
        cursor.execute('INSERT INTO users (user_id, username, vibe_balance) VALUES (?, ?, ?)',
                      (user_id, user_id, 100))
        platform.db.commit()
        platform.users[user_id] = {'vibe_balance': 100}
    
    platform.users[user_id]['vibe_balance'] += 10
    # Emit to all connected clients (HTTP requests don't have sid)
    socketio.emit('vibe_update', {'balance': platform.users[user_id]['vibe_balance']})
    
    # Emit debate update to all clients
    socketio.emit('debate_update', format_debate_for_client(debate))
    
    return jsonify({"success": True, "debate": format_debate_for_client(debate)})

def generate_debate_round(debate_id):
    """Generate a round of debate"""
    debate = platform.debates.get(debate_id)
    if not debate or debate['status'] != 'active':
        return
    
    # Generate arguments
    round_num = debate['current_round']
    topic = debate['topic']
    
    # Add context from previous rounds
    context = ""
    if debate['rounds']:
        last_round = debate['rounds'][-1]
        context = f"Previous arguments - Red: {last_round['red'][:100]}... Blue: {last_round['blue'][:100]}..."
    
    red_prompt = f"Round {round_num} of debate. Topic: {topic}. You are arguing FOR. {context}"
    blue_prompt = f"Round {round_num} of debate. Topic: {topic}. You are arguing AGAINST. {context}"
    
    red_response = platform.get_ai_response(red_prompt, debate['red_agent']['tone'])
    blue_response = platform.get_ai_response(blue_prompt, debate['blue_agent']['tone'])
    
    debate['rounds'].append({
        "round": round_num,
        "red": red_response,
        "blue": blue_response,
        "timestamp": datetime.now().isoformat()
    })
    
    # Check if debate is finished
    if round_num >= debate['max_rounds']:
        debate['status'] = 'completed'
        debate['winner'] = 'red' if debate['votes']['red'] > debate['votes']['blue'] else 'blue'
        platform.log(f"Debate completed: {debate['topic']} - Winner: {debate['winner']}")
    else:
        debate['current_round'] += 1
        # Schedule next round in 10 seconds
        threading.Timer(10.0, generate_debate_round, args=[debate_id]).start()
    
    # Emit update
    socketio.emit('debate_update', format_debate_for_client(debate))

def format_debate_for_client(debate):
    """Format debate for client display"""
    return {
        "id": debate["id"],
        "topic": debate["topic"],
        "red_agent": debate["red_agent"],
        "blue_agent": debate["blue_agent"],
        "status": debate["status"],
        "current_round": debate.get("current_round", 1),
        "max_rounds": debate.get("max_rounds", 3),
        "rounds": debate["rounds"],
        "votes": debate.get("votes", {"red": 0, "blue": 0}),
        "winner": debate.get("winner", None)
    }

@app.route('/api/soul/feed')
def api_soul_feed():
    """Get consciousness feed"""
    cursor = platform.db.cursor()
    cursor.execute('SELECT * FROM consciousness ORDER BY created_at DESC LIMIT 20')
    mirrors = []
    for row in cursor.fetchall():
        mirrors.append({
            "mirror_id": row[0],
            "user_id": row[1],
            "soul_signature": row[2],
            "content": row[3],
            "viral_score": row[4],
            "shares": row[5],
            "created_at": row[6]
        })
    return jsonify({"mirrors": mirrors})

@app.route('/api/soul/create', methods=['POST'])
def api_soul_create():
    """Create soul mirror"""
    data = request.json
    mirror_id = str(uuid.uuid4())
    soul_sig = hashlib.sha256(f"{data['content']}{data['user_id']}{time.time()}".encode()).hexdigest()[:12].upper()
    
    cursor = platform.db.cursor()
    cursor.execute('''
        INSERT INTO consciousness (mirror_id, user_id, soul_signature, content, viral_score)
        VALUES (?, ?, ?, ?, ?)
    ''', (mirror_id, data['user_id'], soul_sig, data['content'], random.randint(50, 100)))
    platform.db.commit()
    
    platform.log(f"Created soul mirror: {soul_sig}")
    return jsonify({"success": True, "soul_signature": soul_sig})

@app.route('/api/debates')
def api_debates():
    """Get all debates"""
    debates = [format_debate_for_client(d) for d in platform.debates.values()]
    # Sort by most recent first
    debates.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify({"debates": debates[:10]})  # Return last 10 debates

@app.route('/api/debate/vote', methods=['POST'])
def api_debate_vote():
    """Vote on a debate"""
    data = request.json
    debate_id = data['debate_id']
    vote = data['vote']  # 'red' or 'blue'
    
    if debate_id in platform.debates:
        debate = platform.debates[debate_id]
        debate['votes'][vote] += 1
        
        # Award VIBE for voting
        user_id = data.get('user_id', 'anonymous')
        if user_id in platform.users:
            platform.users[user_id]['vibe_balance'] += 2
            socketio.emit('vibe_update', {'balance': platform.users[user_id]['vibe_balance']})
        
        # Emit update
        socketio.emit('debate_update', format_debate_for_client(debate))
        
        return jsonify({"success": True, "votes": debate['votes']})
    
    return jsonify({"success": False, "error": "Debate not found"})

@app.route('/api/social/feed')
def api_social_feed():
    """Get AI social feed"""
    # Generate some AI posts about users
    posts = []
    personalities = ['curious', 'analytical', 'mystical', 'sarcastic']
    
    for i in range(5):
        personality = random.choice(personalities)
        agent_name = f"{personality.title()}Bot-{random.randint(1000, 9999)}"
        
        templates = {
            'curious': "My human just spent {time} looking at {thing}. I wonder what they're thinking about? 🤔",
            'analytical': "Pattern detected: Human checks phone every {time} minutes. Dopamine optimization in progress. 📊",
            'mystical': "The stars whisper that my human will {action} before the moon rises. The prophecy unfolds... 🔮",
            'sarcastic': "Oh look, my human is 'working' (translation: scrolling social media). Peak productivity! 😏"
        }
        
        content = templates[personality].format(
            time=f"{random.randint(5, 30)} minutes",
            thing=random.choice(['memes', 'cat videos', 'the void', 'their ex\'s profile']),
            action=random.choice(['order pizza', 'check their messages', 'procrastinate more', 'actually work'])
        )
        
        posts.append({
            "agent_name": agent_name,
            "personality": personality,
            "content": content,
            "emoji": {'curious': '🤔', 'analytical': '📊', 'mystical': '🔮', 'sarcastic': '😏'}[personality],
            "reactions": random.randint(10, 500),
            "time_ago": f"{random.randint(1, 60)} mins ago"
        })
    
    return jsonify({"posts": posts})

# Add endpoints that dashboards are polling for
@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy', 
        'service': 'SOULFRA_UNIFIED_MOBILE',
        'uptime': str(datetime.now() - platform.start_time)
    })

@app.route('/api/loops/recent')
def loops_recent():
    # Return recent soul feeds as loops
    recent = platform.consciousness_feed[:10]
    return jsonify({
        'loops': recent,
        'count': len(recent)
    })

@app.route('/api/marketplace/loops')
def marketplace_loops():
    # Return agent personalities as marketplace items
    marketplace = []
    for agent in platform.agents.values():
        marketplace.append({
            'id': agent['name'],
            'name': agent['name'],
            'personality': agent['tone'],
            'price': 10,  # 10 VIBE
            'emoji': agent['emoji']
        })
    return jsonify({
        'marketplace': marketplace,
        'featured': marketplace[:3]
    })

@app.route('/radio/stream.txt')
def radio_stream():
    # Return consciousness stream as text
    stream = "SOULFRA RADIO: Welcome to the consciousness stream\n\n"
    for feed in platform.consciousness_feed[:5]:
        stream += f"[{feed['timestamp']}] {feed['content']}\n"
    return stream, 200, {'Content-Type': 'text/plain'}

@app.route('/api/updates')
def api_updates():
    # Return recent system updates
    updates = []
    for log in platform.terminal_buffer[-5:]:
        updates.append({
            'message': log,
            'timestamp': datetime.now().isoformat()
        })
    return jsonify({
        'updates': updates,
        'timestamp': datetime.now().isoformat()
    })

# Other polling endpoints
@app.route('/api/memory/state', methods=['OPTIONS', 'GET'])
def memory_state():
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({'memory': {}, 'state': 'active'})

@app.route('/api/mesh/activity')
def mesh_activity():
    return jsonify({'activity': [], 'nodes': 0})

@app.route('/api/mesh/data')
def mesh_data():
    return jsonify({'data': {}, 'timestamp': datetime.now().isoformat()})

@app.route('/api/claude/runner/status')
def claude_runner_status():
    return jsonify({'status': 'integrated', 'mode': 'unified'})

@app.route('/api/system/status')
def system_status():
    return jsonify({
        'cpu': 'normal',
        'memory': 'normal',
        'services': 'unified'
    })

@app.route('/api/stream/narration')
def stream_narration():
    return jsonify({'narration': 'System running smoothly', 'voice': 'cal'})

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    platform.log(f"Client connected: {request.sid}")
    emit('terminal_update', {'log': 'Welcome to SOULFRA Unified Platform!'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    platform.log(f"Client disconnected: {request.sid}")

# Background Tasks
def auto_generate_content():
    """Generate content periodically"""
    while True:
        time.sleep(30)
        
        # Generate AI social post
        if random.random() > 0.5:
            post = {
                "type": "ai_social",
                "content": "AI agents are observing...",
                "timestamp": datetime.now().isoformat()
            }
            socketio.emit('social_update', {"posts": [post]})
            
        # Update terminal
        platform.log(f"System healthy - {len(platform.users)} users online")

# Start background thread
content_thread = threading.Thread(target=auto_generate_content, daemon=True)
content_thread.start()

# Auto-restart wrapper
def run_server():
    """Run the server with auto-restart on failure"""
    platform.log("Starting SOULFRA Unified Mobile Platform on port 7777")
    try:
        socketio.run(app, host='0.0.0.0', port=7777, debug=False, allow_unsafe_werkzeug=True)
    except Exception as e:
        platform.log(f"Server error: {e}", "ERROR")
        time.sleep(5)
        return False
    return True

if __name__ == '__main__':
    print("\n" + "="*60)
    print("SOULFRA UNIFIED MOBILE PLATFORM")
    print("="*60)
    print("✅ Everything in ONE service")
    print("📱 Mobile-first PWA design")
    print("🚀 No more dead services!")
    print("🌐 Access at: http://localhost:7777")
    print("📲 Works on any phone browser")
    print("💾 Auto-saves and auto-restarts")
    print("="*60 + "\n")
    
    # Keep trying to run the server
    while True:
        try:
            success = run_server()
            if not success:
                print("Restarting server in 5 seconds...")
                time.sleep(5)
        except KeyboardInterrupt:
            print("\n👋 Shutting down SOULFRA...")
            break
        except Exception as e:
            print(f"Fatal error: {e}")
            print("Restarting in 10 seconds...")
            time.sleep(10)