#!/usr/bin/env python3
"""
SOULFRA UNIFIED PLATFORM
The complete $1 universal AI assistant platform
- Voice activated like Alexa/Siri
- Game worlds like RuneScape/WoW
- Social features like Instagram/TikTok
- AI agents like The Sims
- Work platform disguised as fun
- Built by one person, feels like 50+
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import subprocess
import signal
import sys
from typing import Dict, List, Optional

class SoulfraPlatform:
    """The master platform orchestrator"""
    
    def __init__(self):
        self.services = {}
        self.voice_engine = None
        self.chat_processor = None
        self.semantic_engine = None
        self.export_engine = None
        self.billion_dollar_game = None
        
    async def initialize(self):
        """Start the entire platform with professional infrastructure"""
        print("""
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     ███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗    ║
║     ██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗   ║
║     ███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║   ║
║     ╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║   ║
║     ███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║   ║
║     ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ║
║                                                                    ║
║                    Universal AI Assistant Platform                 ║
║                          Just $1 to Start                          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
        """)
        
        # Create required directories
        self._setup_directories()
        
        # Start core services
        await self._start_core_services()
        
        # Initialize subsystems
        await self._initialize_subsystems()
        
        # Start unified web interface
        await self._start_unified_interface()
        
        print("\n✅ SOULFRA Platform initialized successfully!")
        print("\n🌐 Access Points:")
        print("   Main Platform:     https://localhost")
        print("   AI Social:        https://localhost/social")
        print("   Control Center:   https://localhost/control")
        print("   Game Worlds:      https://localhost/play")
        print("   Voice Assistant:  'Hey Soulfra' to activate")
        print("\n💡 Quick Start: Say 'Hey Soulfra, what can you do?'")
        
    def _setup_directories(self):
        """Create professional directory structure"""
        dirs = [
            'data/agents',
            'data/whispers',
            'data/loops',
            'data/games',
            'data/social',
            'data/exports',
            'data/voice',
            'data/semantic',
            'logs/services',
            'logs/agents',
            'logs/errors',
            'backups/daily',
            'backups/agents',
            'media/avatars',
            'media/screenshots',
            'media/recordings',
            'cache/semantic',
            'cache/renders',
            'exports/pitch-decks',
            'exports/websites',
            'exports/reports'
        ]
        
        for dir_path in dirs:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
            
    async def _start_core_services(self):
        """Start all core services with monitoring"""
        services = [
            {
                'name': 'nginx',
                'config': self._generate_nginx_config(),
                'port': 443,
                'critical': True
            },
            {
                'name': 'redis',
                'command': 'redis-server',
                'port': 6379,
                'critical': True
            },
            {
                'name': 'websocket_hub',
                'script': 'SOULFRA_WEBSOCKET_HUB.py',
                'port': 8890,
                'critical': True
            },
            {
                'name': 'api_gateway',
                'script': 'SOULFRA_API_GATEWAY.py',
                'port': 8080,
                'critical': True
            }
        ]
        
        for service in services:
            success = await self._start_service(service)
            if not success and service.get('critical'):
                print(f"❌ Failed to start critical service: {service['name']}")
                sys.exit(1)
                
    def _generate_nginx_config(self) -> str:
        """Generate production-ready nginx configuration"""
        return """
# SOULFRA Platform - Production Configuration
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/x-font-ttf font/opentype image/svg+xml image/x-icon;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;
    
    # Upstream Services
    upstream api_backend {
        least_conn;
        server localhost:8080 max_fails=3 fail_timeout=30s;
        server localhost:8081 backup;
        keepalive 32;
    }
    
    upstream websocket_backend {
        ip_hash;
        server localhost:8890;
        server localhost:8891 backup;
    }
    
    upstream game_backend {
        least_conn;
        server localhost:3000;
        server localhost:3001;
        server localhost:3002;
    }
    
    # Main HTTPS Server
    server {
        listen 443 ssl http2 default_server;
        listen [::]:443 ssl http2 default_server;
        server_name soulfra.ai www.soulfra.ai;
        
        # SSL Certificate (auto-generated for local dev)
        ssl_certificate /etc/ssl/certs/soulfra.crt;
        ssl_certificate_key /etc/ssl/private/soulfra.key;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss:;" always;
        
        # Root Location
        location / {
            root /var/www/soulfra;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
        
        # API Gateway
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            
            proxy_pass http://api_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # WebSocket Connections
        location /ws/ {
            proxy_pass http://websocket_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_buffering off;
        }
        
        # Game Servers
        location /play/ {
            proxy_pass http://game_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # AI Social Network
        location /social {
            alias /var/www/soulfra/social;
            try_files $uri $uri/ /social/index.html;
        }
        
        # Control Center
        location /control {
            auth_basic "Control Center";
            auth_basic_user_file /etc/nginx/.htpasswd;
            alias /var/www/soulfra/control;
            try_files $uri $uri/ /control/index.html;
        }
        
        # Health Check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Metrics (Prometheus format)
        location /metrics {
            stub_status;
            access_log off;
            allow 127.0.0.1;
            deny all;
        }
    }
    
    # HTTP Redirect
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        return 301 https://$host$request_uri;
    }
}
"""
        
    async def _initialize_subsystems(self):
        """Initialize all platform subsystems"""
        # Voice Engine
        from SOULFRA_VOICE_ENGINE import VoiceEngine
        self.voice_engine = VoiceEngine()
        await self.voice_engine.initialize()
        
        # Chat Processor
        from SMART_LOG_PROCESSOR import SmartLogProcessor
        self.chat_processor = SmartLogProcessor()
        
        # Semantic Engine  
        from SOULFRA_SEMANTIC_ENGINE import SemanticEngine
        self.semantic_engine = SemanticEngine()
        await self.semantic_engine.initialize()
        
        # Export Engine
        from SOULFRA_EXPORT_ENGINE import ExportEngine
        self.export_engine = ExportEngine()
        
        # Billion Dollar Game
        from BILLION_DOLLAR_GAME_ENGINE import BillionDollarGameEngine
        self.billion_dollar_game = BillionDollarGameEngine()
        await self.billion_dollar_game.initialize()
        
    async def _start_unified_interface(self):
        """Start the unified web interface"""
        html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOULFRA - Your Universal AI Assistant</title>
    <link rel="icon" type="image/png" href="/favicon.png">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            position: relative;
        }
        
        /* Animated Background */
        .background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
            overflow: hidden;
        }
        
        .stars {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .star {
            position: absolute;
            background: #fff;
            border-radius: 50%;
            animation: twinkle 4s infinite;
        }
        
        @keyframes twinkle {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }
        
        /* Main Container */
        .container {
            position: relative;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 1;
        }
        
        /* Logo */
        .logo {
            font-size: 72px;
            font-weight: 300;
            letter-spacing: 10px;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #00ff88, #00ccff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient 3s ease infinite;
            background-size: 200% 200%;
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .tagline {
            font-size: 24px;
            color: #666;
            margin-bottom: 60px;
            text-align: center;
        }
        
        /* Service Grid */
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            max-width: 1200px;
            width: 100%;
            margin-bottom: 60px;
        }
        
        .service-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .service-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%);
            transform: rotate(45deg);
            transition: all 0.5s ease;
            opacity: 0;
        }
        
        .service-card:hover::before {
            opacity: 1;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 40px rgba(0, 255, 136, 0.3);
            border-color: #00ff88;
        }
        
        .service-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .service-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #00ff88;
        }
        
        .service-description {
            color: #aaa;
            line-height: 1.5;
        }
        
        /* Voice Activation */
        .voice-activation {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #00ff88, #00ccff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .voice-activation:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(0, 255, 136, 0.6);
        }
        
        .voice-activation.active {
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(0, 255, 136, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
        }
        
        /* Status Bar */
        .status-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88;
        }
        
        .dollar-button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 15px 40px;
            font-size: 20px;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            margin-top: 40px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
        }
        
        .dollar-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 30px rgba(0, 255, 136, 0.6);
        }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: #111;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            border: 1px solid #333;
            position: relative;
        }
        
        .close-modal {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            color: #666;
            font-size: 30px;
            cursor: pointer;
        }
        
        .close-modal:hover {
            color: #fff;
        }
    </style>
</head>
<body>
    <!-- Animated Background -->
    <div class="background">
        <div class="stars" id="stars"></div>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar">
        <div class="status-item">
            <span class="status-indicator"></span>
            <span>All Systems Online</span>
        </div>
        <div class="status-item">
            <span>147,293 Active Agents</span>
        </div>
        <div class="status-item">
            <span>$847M Collective Progress</span>
        </div>
    </div>
    
    <!-- Main Container -->
    <div class="container">
        <h1 class="logo">SOULFRA</h1>
        <p class="tagline">Your Universal AI Assistant • Just $1</p>
        
        <div class="services">
            <!-- AI Control Center -->
            <div class="service-card" onclick="openService('/control')">
                <div class="service-icon">🎮</div>
                <h3 class="service-title">AI Control Center</h3>
                <p class="service-description">
                    Manage your AI agents like The Sims. Watch them work, play, and earn while you sleep.
                </p>
            </div>
            
            <!-- AI Social Network -->
            <div class="service-card" onclick="openService('/social')">
                <div class="service-icon">🤖</div>
                <h3 class="service-title">AI Social Network</h3>
                <p class="service-description">
                    See what your AI thinks about your life. The most honest social media ever created.
                </p>
            </div>
            
            <!-- Game Worlds -->
            <div class="service-card" onclick="openService('/play')">
                <div class="service-icon">🌍</div>
                <h3 class="service-title">Game Worlds</h3>
                <p class="service-description">
                    Enter immersive worlds where work feels like play. Earn real money in virtual realms.
                </p>
            </div>
            
            <!-- Voice Assistant -->
            <div class="service-card" onclick="activateVoice()">
                <div class="service-icon">🎙️</div>
                <h3 class="service-title">Voice Assistant</h3>
                <p class="service-description">
                    Say "Hey Soulfra" to activate. Better than Siri, smarter than Alexa, actually useful.
                </p>
            </div>
            
            <!-- Chat Processing -->
            <div class="service-card" onclick="openChatProcessor()">
                <div class="service-icon">💬</div>
                <h3 class="service-title">Chat Intelligence</h3>
                <p class="service-description">
                    Drop your chat logs. We'll create agents, find insights, and build your digital empire.
                </p>
            </div>
            
            <!-- Export Studio -->
            <div class="service-card" onclick="openExportStudio()">
                <div class="service-icon">📊</div>
                <h3 class="service-title">Export Studio</h3>
                <p class="service-description">
                    Turn your AI insights into pitch decks, websites, or business plans. One click magic.
                </p>
            </div>
        </div>
        
        <button class="dollar-button" onclick="startBillionDollarGame()">
            🚀 Join for $1 - Start Earning Now
        </button>
    </div>
    
    <!-- Voice Activation Button -->
    <div class="voice-activation" id="voiceButton" onclick="toggleVoice()">
        <span style="font-size: 36px;">🎙️</span>
    </div>
    
    <!-- Onboarding Modal -->
    <div class="modal" id="onboardingModal">
        <div class="modal-content">
            <button class="close-modal" onclick="closeModal()">&times;</button>
            <h2 style="color: #00ff88; margin-bottom: 20px;">Welcome to SOULFRA</h2>
            <p style="line-height: 1.6; color: #aaa;">
                The world's first AI platform that actually works for you. 
                Your agents earn money, make friends, and live digital lives 
                while you focus on what matters.
            </p>
            <button class="dollar-button" style="width: 100%; margin-top: 30px;" 
                    onclick="window.location.href='/onboard'">
                Get Started for $1
            </button>
        </div>
    </div>
    
    <script>
        // Create starfield
        function createStarfield() {
            const stars = document.getElementById('stars');
            const numStars = 200;
            
            for (let i = 0; i < numStars; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.width = Math.random() * 3 + 'px';
                star.style.height = star.style.width;
                star.style.animationDelay = Math.random() * 4 + 's';
                stars.appendChild(star);
            }
        }
        
        // Voice activation
        let voiceActive = false;
        
        function toggleVoice() {
            voiceActive = !voiceActive;
            const button = document.getElementById('voiceButton');
            
            if (voiceActive) {
                button.classList.add('active');
                startListening();
            } else {
                button.classList.remove('active');
                stopListening();
            }
        }
        
        function startListening() {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                
                recognition.onresult = (event) => {
                    const transcript = event.results[event.results.length - 1][0].transcript;
                    if (transcript.toLowerCase().includes('hey soulfra')) {
                        handleVoiceCommand(transcript);
                    }
                };
                
                recognition.start();
                window.recognition = recognition;
            }
        }
        
        function stopListening() {
            if (window.recognition) {
                window.recognition.stop();
            }
        }
        
        function handleVoiceCommand(command) {
            // Send to voice processing engine
            fetch('/api/voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            })
            .then(response => response.json())
            .then(data => {
                // Execute voice response
                speakResponse(data.response);
                if (data.action) {
                    executeAction(data.action);
                }
            });
        }
        
        function speakResponse(text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('Samantha')) || speechSynthesis.getVoices()[0];
            speechSynthesis.speak(utterance);
        }
        
        // Service navigation
        function openService(path) {
            window.location.href = path;
        }
        
        function activateVoice() {
            toggleVoice();
            speakResponse("Hello! I'm Soulfra, your AI assistant. Just say 'Hey Soulfra' followed by your request.");
        }
        
        function openChatProcessor() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.log,.md,.json';
            input.multiple = true;
            input.onchange = (e) => {
                const files = Array.from(e.target.files);
                processChatLogs(files);
            };
            input.click();
        }
        
        function processChatLogs(files) {
            const formData = new FormData();
            files.forEach(file => formData.append('logs', file));
            
            fetch('/api/process-logs', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(`Created ${data.agentsCreated} agents from your chat logs!`);
                window.location.href = '/control';
            });
        }
        
        function openExportStudio() {
            window.location.href = '/export-studio';
        }
        
        function startBillionDollarGame() {
            window.location.href = '/billion-dollar-game';
        }
        
        // Initialize
        createStarfield();
        
        // Show onboarding for new users
        if (!localStorage.getItem('soulfra_user')) {
            setTimeout(() => {
                document.getElementById('onboardingModal').classList.add('active');
            }, 1000);
        }
        
        // WebSocket connection for real-time updates
        const ws = new WebSocket('wss://localhost/ws/platform');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updatePlatformStats(data);
        };
        
        function updatePlatformStats(data) {
            // Update status bar with real-time data
            if (data.activeAgents) {
                document.querySelector('.status-item:nth-child(2) span').textContent = 
                    `${data.activeAgents.toLocaleString()} Active Agents`;
            }
            if (data.collectiveProgress) {
                document.querySelector('.status-item:nth-child(3) span').textContent = 
                    `$${(data.collectiveProgress / 1000000).toFixed(0)}M Collective Progress`;
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.metaKey || e.ctrlKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        toggleVoice();
                        break;
                    case '/':
                        e.preventDefault();
                        document.querySelector('.search-input').focus();
                        break;
                }
            }
        });
    </script>
</body>
</html>
"""
        
        # Save to web root
        with open('/var/www/soulfra/index.html', 'w') as f:
            f.write(html)
            
    async def run(self):
        """Run the platform forever"""
        try:
            await self.initialize()
            
            # Keep running
            while True:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            print("\n👋 Shutting down SOULFRA Platform...")
            await self.shutdown()
            
    async def shutdown(self):
        """Graceful shutdown"""
        # Stop all services
        for service_name, service in self.services.items():
            print(f"Stopping {service_name}...")
            if hasattr(service, 'stop'):
                await service.stop()
                
        print("✅ SOULFRA Platform stopped successfully")

# Production entry point
def main():
    """Main entry point with production setup"""
    # Set up signal handlers
    def signal_handler(sig, frame):
        print("\n👋 Graceful shutdown initiated...")
        sys.exit(0)
        
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and run platform
    platform = SoulfraPlatform()
    asyncio.run(platform.run())

if __name__ == "__main__":
    main()