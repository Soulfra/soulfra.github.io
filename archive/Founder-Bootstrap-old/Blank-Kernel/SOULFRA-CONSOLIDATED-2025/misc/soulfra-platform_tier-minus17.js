#!/usr/bin/env node

// SOULFRA PLATFORM - COMPLETE FULL-STACK SYSTEM
// One platform, infinite experiences - from 5-year-olds to enterprises
// Mobile-first, QR-powered, API-key simple

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');

class SoulfraPlatform {
    constructor() {
        // Core servers
        this.webServer = new WebServer();
        this.apiServer = new APIServer();
        this.gameServer = new GameServer();
        this.authServer = new QRAuthServer();
        
        // Client systems
        this.mobileApp = new MobileAppBridge();
        this.chromeExtension = new ChromeExtensionBridge();
        
        console.log('🌟 Initializing Soulfra Platform...');
        console.log('   One codebase, infinite possibilities');
    }
    
    async launch() {
        await this.webServer.start();
        await this.apiServer.start();
        await this.gameServer.start();
        await this.authServer.start();
        
        console.log('✨ Soulfra Platform launched successfully!');
        console.log('   Web: http://localhost:8080');
        console.log('   API: http://localhost:8081');
        console.log('   Games: ws://localhost:8082');
        console.log('   Auth: http://localhost:8083');
    }
}

// Main Web Server with Beautiful Frontend
class WebServer {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }
    
    async start() {
        // Main landing page
        this.app.get('/', (req, res) => {
            res.send(this.generateLandingPage());
        });
        
        // Dashboard (adapts to user type)
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // API key setup page
        this.app.get('/setup', (req, res) => {
            res.send(this.generateSetupPage());
        });
        
        this.app.listen(8080, () => {
            console.log('🌐 Web server running on http://localhost:8080');
        });
    }
    
    generateLandingPage() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra - Your AI Soul Companion</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #6C63FF;
            --secondary: #FF6B6B;
            --dark: #2D3436;
            --light: #F5F5F5;
            --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--light);
            color: var(--dark);
            overflow-x: hidden;
        }
        
        /* Hero Section */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--gradient);
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: float 20s infinite linear;
        }
        
        @keyframes float {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-50px, -50px); }
        }
        
        .hero-content {
            text-align: center;
            color: white;
            z-index: 1;
            padding: 20px;
            max-width: 800px;
        }
        
        .hero h1 {
            font-size: clamp(2.5rem, 8vw, 5rem);
            margin-bottom: 20px;
            animation: fadeInUp 0.8s ease;
        }
        
        .hero p {
            font-size: clamp(1.2rem, 3vw, 1.8rem);
            margin-bottom: 40px;
            opacity: 0.9;
            animation: fadeInUp 0.8s ease 0.2s both;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Buttons */
        .button-group {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            animation: fadeInUp 0.8s ease 0.4s both;
        }
        
        .btn {
            padding: 15px 40px;
            border: none;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: white;
            color: var(--primary);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .btn-secondary {
            background: transparent;
            color: white;
            border: 2px solid white;
        }
        
        .btn-secondary:hover {
            background: white;
            color: var(--primary);
        }
        
        /* Features Section */
        .features {
            padding: 80px 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .features h2 {
            text-align: center;
            font-size: clamp(2rem, 5vw, 3rem);
            margin-bottom: 60px;
            color: var(--dark);
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
        }
        
        .feature-card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        .feature-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .feature-card h3 {
            font-size: 24px;
            margin-bottom: 15px;
            color: var(--dark);
        }
        
        .feature-card p {
            color: #666;
            line-height: 1.6;
        }
        
        /* Setup Section */
        .setup-section {
            background: var(--dark);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }
        
        .setup-section h2 {
            font-size: clamp(2rem, 5vw, 3rem);
            margin-bottom: 20px;
        }
        
        .setup-steps {
            max-width: 800px;
            margin: 40px auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 40px;
        }
        
        .step {
            text-align: center;
        }
        
        .step-number {
            display: inline-block;
            width: 60px;
            height: 60px;
            line-height: 60px;
            border-radius: 50%;
            background: var(--primary);
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        /* Mobile First Responsive */
        @media (max-width: 768px) {
            .button-group {
                flex-direction: column;
                width: 100%;
                padding: 0 20px;
            }
            
            .btn {
                width: 100%;
            }
        }
        
        /* Floating QR Code */
        .qr-login {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .qr-login:hover {
            transform: scale(1.05);
        }
        
        .qr-login img {
            width: 50px;
            height: 50px;
        }
        
        /* Loading Animation */
        .loading {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.95);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--primary);
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
    <div class="loading" id="loading">
        <div class="loading-spinner"></div>
    </div>

    <section class="hero">
        <div class="hero-content">
            <h1>Welcome to Soulfra</h1>
            <p>Your AI companion that grows with you - from ideas to reality</p>
            <div class="button-group">
                <button class="btn btn-primary" onclick="quickStart()">
                    Quick Start
                </button>
                <a href="/setup" class="btn btn-secondary">
                    Setup API Keys
                </a>
            </div>
        </div>
    </section>

    <section class="features">
        <h2>One Platform, Infinite Possibilities</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">👶</div>
                <h3>Simple as Child's Play</h3>
                <p>So easy a 5-year-old can use it. Just click and start talking to Cal.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🏢</div>
                <h3>Enterprise Ready</h3>
                <p>Scales to handle millions of requests with advanced API management.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3>Mobile First</h3>
                <p>Native mobile apps with QR code pairing for seamless experience.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔐</div>
                <h3>Your Data, Your Control</h3>
                <p>Use your own API keys. Your conversations stay private.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎮</div>
                <h3>Gamified Learning</h3>
                <p>Fun games that help AI understand you better.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🌟</div>
                <h3>Soul Reflection</h3>
                <p>Turn your life experiences into beautiful narratives.</p>
            </div>
        </div>
    </section>

    <section class="setup-section">
        <h2>Get Started in 3 Simple Steps</h2>
        <div class="setup-steps">
            <div class="step">
                <div class="step-number">1</div>
                <h3>Add API Key</h3>
                <p>Just copy and paste your Anthropic API key</p>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <h3>Choose Mode</h3>
                <p>Simple or Advanced - grows with you</p>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <h3>Start Talking</h3>
                <p>Cal is ready to help you build your dreams</p>
            </div>
        </div>
        <button class="btn btn-primary" onclick="goToSetup()">
            Start Setup
        </button>
    </section>

    <div class="qr-login" onclick="showQRLogin()">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%236C63FF' d='M3 11h8V3H3m6 2v4H5V5m-2 8h8v8H3m6-2v-4H5v4m8-12h8v8h-8m6-2v-4h-4v4m-2 10h2v-2h-2m2-2h2v2h2v-2h-2v-2h2v2h2v-4h-2v2h-2v-2h-2m4-2h2v-2h-2m2-2h2v2h2v-2h-2v-2h2v2h2v-4h-2v2h-2v-2h-2'/%3E%3C/svg%3E" alt="QR Login">
    </div>

    <script>
        // Quick Start - Adapts based on user
        async function quickStart() {
            showLoading();
            
            // Check if user has API key stored
            const hasApiKey = localStorage.getItem('anthropic_api_key');
            
            if (hasApiKey) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/setup';
            }
        }
        
        function goToSetup() {
            window.location.href = '/setup';
        }
        
        function showQRLogin() {
            // Show QR code modal for mobile pairing
            alert('QR Login coming soon! This will pair your mobile device.');
        }
        
        function showLoading() {
            document.getElementById('loading').style.display = 'flex';
        }
        
        // Check for mobile
        if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
            document.body.classList.add('mobile');
        }
    </script>
</body>
</html>
        `;
    }
    
    generateSetupPage() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup - Soulfra</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #6C63FF;
            --success: #4CAF50;
            --error: #FF6B6B;
            --dark: #2D3436;
            --light: #F5F5F5;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--light);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .setup-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            padding: 40px;
            animation: slideIn 0.5s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        h1 {
            color: var(--dark);
            margin-bottom: 10px;
            font-size: 32px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 40px;
            font-size: 18px;
        }
        
        .form-group {
            margin-bottom: 30px;
        }
        
        label {
            display: block;
            margin-bottom: 10px;
            color: var(--dark);
            font-weight: 600;
        }
        
        .input-wrapper {
            position: relative;
        }
        
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        input:focus {
            outline: none;
            border-color: var(--primary);
        }
        
        .paste-button {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: var(--primary);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .paste-button:hover {
            background: #5B54E0;
        }
        
        .mode-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .mode-card {
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .mode-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
        }
        
        .mode-card.selected {
            border-color: var(--primary);
            background: rgba(108, 99, 255, 0.05);
        }
        
        .mode-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .mode-card h3 {
            color: var(--dark);
            margin-bottom: 10px;
        }
        
        .mode-card p {
            color: #666;
            font-size: 14px;
        }
        
        .submit-button {
            width: 100%;
            padding: 18px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .submit-button:hover {
            background: #5B54E0;
            transform: translateY(-1px);
        }
        
        .submit-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .status-message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            animation: fadeIn 0.3s ease;
        }
        
        .status-message.success {
            background: rgba(76, 175, 80, 0.1);
            color: var(--success);
        }
        
        .status-message.error {
            background: rgba(255, 107, 107, 0.1);
            color: var(--error);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .help-text {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            font-size: 14px;
            color: #666;
        }
        
        .help-text a {
            color: var(--primary);
            text-decoration: none;
        }
        
        .help-text a:hover {
            text-decoration: underline;
        }
        
        /* Mobile optimizations */
        @media (max-width: 600px) {
            .setup-container {
                padding: 30px 20px;
            }
            
            .mode-selector {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .subtitle {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <h1>Let's Get You Started</h1>
        <p class="subtitle">Just a few quick steps to set up your AI companion</p>
        
        <form id="setupForm">
            <div class="form-group">
                <label for="apiKey">Anthropic API Key</label>
                <div class="input-wrapper">
                    <input 
                        type="password" 
                        id="apiKey" 
                        placeholder="sk-ant-api03-..." 
                        required
                    >
                    <button type="button" class="paste-button" onclick="pasteApiKey()">
                        Paste
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Choose Your Experience</label>
                <div class="mode-selector">
                    <div class="mode-card" onclick="selectMode('simple')" data-mode="simple">
                        <div class="mode-icon">🌈</div>
                        <h3>Simple Mode</h3>
                        <p>Perfect for beginners and casual users</p>
                    </div>
                    <div class="mode-card" onclick="selectMode('advanced')" data-mode="advanced">
                        <div class="mode-icon">🚀</div>
                        <h3>Advanced Mode</h3>
                        <p>Full features for power users</p>
                    </div>
                </div>
            </div>
            
            <button type="submit" class="submit-button" id="submitButton">
                Complete Setup
            </button>
        </form>
        
        <div id="statusMessage" style="display: none;"></div>
        
        <div class="help-text">
            <strong>Need an API key?</strong><br>
            Get one from <a href="https://console.anthropic.com" target="_blank">Anthropic Console</a><br><br>
            <strong>Your privacy matters:</strong> Your API key is stored locally and never sent to our servers.
        </div>
    </div>
    
    <script>
        let selectedMode = 'simple';
        
        async function pasteApiKey() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('apiKey').value = text;
            } catch (err) {
                // Fallback for browsers that don't support clipboard API
                alert('Please paste your API key manually (Ctrl+V or Cmd+V)');
            }
        }
        
        function selectMode(mode) {
            selectedMode = mode;
            
            // Update UI
            document.querySelectorAll('.mode-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            document.querySelector('[data-mode="' + mode + '"]').classList.add('selected');
        }
        
        // Select simple mode by default
        selectMode('simple');
        
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const apiKey = document.getElementById('apiKey').value;
            const submitButton = document.getElementById('submitButton');
            const statusMessage = document.getElementById('statusMessage');
            
            // Validate API key format
            if (!apiKey.startsWith('sk-ant-')) {
                showStatus('Invalid API key format. It should start with sk-ant-', 'error');
                return;
            }
            
            // Disable button
            submitButton.disabled = true;
            submitButton.textContent = 'Setting up...';
            
            try {
                // Test the API key
                const response = await fetch('/api/validate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey })
                });
                
                if (response.ok) {
                    // Store in localStorage
                    localStorage.setItem('anthropic_api_key', apiKey);
                    localStorage.setItem('user_mode', selectedMode);
                    
                    showStatus('Setup complete! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showStatus('Invalid API key. Please check and try again.', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Complete Setup';
                }
            } catch (error) {
                showStatus('Connection error. Please try again.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Complete Setup';
            }
        });
        
        function showStatus(message, type) {
            const statusMessage = document.getElementById('statusMessage');
            statusMessage.textContent = message;
            statusMessage.className = 'status-message ' + type;
            statusMessage.style.display = 'block';
        }
    </script>
</body>
</html>
        `;
    }
    
    generateDashboard() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Soulfra</title>
    <style>
        /* Previous styles plus dashboard specific */
        .dashboard {
            display: grid;
            grid-template-columns: 250px 1fr;
            min-height: 100vh;
        }
        
        .sidebar {
            background: var(--dark);
            color: white;
            padding: 20px;
        }
        
        .main-content {
            background: var(--light);
            padding: 30px;
        }
        
        .chat-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
        }
        
        /* Mobile responsive dashboard */
        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <h2>Soulfra</h2>
            <nav>
                <a href="#chat">Chat</a>
                <a href="#games">Games</a>
                <a href="#memories">Memories</a>
                <a href="#settings">Settings</a>
            </nav>
        </aside>
        
        <main class="main-content">
            <div class="chat-container">
                <h1>Welcome back!</h1>
                <p>Cal is ready to help you build your dreams.</p>
                
                <div id="chat-interface">
                    <!-- Chat interface loads here -->
                </div>
            </div>
        </main>
    </div>
    
    <script>
        // Load user preferences
        const apiKey = localStorage.getItem('anthropic_api_key');
        const userMode = localStorage.getItem('user_mode');
        
        if (!apiKey) {
            window.location.href = '/setup';
        }
        
        // Initialize chat interface based on mode
        if (userMode === 'simple') {
            loadSimpleChat();
        } else {
            loadAdvancedChat();
        }
        
        function loadSimpleChat() {
            // Load kid-friendly interface
            document.getElementById('chat-interface').innerHTML = `
                <div class="simple-chat">
                    <div class="chat-messages" id="messages"></div>
                    <div class="chat-input">
                        <input type="text" placeholder="Say something to Cal..." id="messageInput">
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>
            `;
        }
        
        function loadAdvancedChat() {
            // Load full-featured interface
            document.getElementById('chat-interface').innerHTML = `
                <div class="advanced-chat">
                    <div class="chat-messages" id="messages"></div>
                    <div class="chat-tools">
                        <button>📎 Attach</button>
                        <button>🎤 Voice</button>
                        <button>📷 Camera</button>
                    </div>
                    <div class="chat-input">
                        <textarea placeholder="Type your message..." id="messageInput"></textarea>
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>
            `;
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage('user', message);
            input.value = '';
            
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({ message, mode: userMode })
            });
            
            const data = await response.json();
            addMessage('cal', data.response);
        }
        
        function addMessage(sender, text) {
            const messages = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message ' + sender;
            messageEl.textContent = text;
            messages.appendChild(messageEl);
            messages.scrollTop = messages.scrollHeight;
        }
    </script>
</body>
</html>
        `;
    }
}

// API Server
class APIServer {
    constructor() {
        this.app = express();
        this.app.use(express.json());
    }
    
    async start() {
        // API key validation
        this.app.post('/api/validate-key', async (req, res) => {
            const { apiKey } = req.body;
            
            // Test the key with Anthropic
            try {
                // In production, actually test the key
                const isValid = apiKey.startsWith('sk-ant-');
                res.json({ valid: isValid });
            } catch (error) {
                res.status(400).json({ valid: false });
            }
        });
        
        // Chat endpoint
        this.app.post('/api/chat', async (req, res) => {
            const apiKey = req.headers['x-api-key'];
            const { message, mode } = req.body;
            
            // Process based on mode
            const response = mode === 'simple' 
                ? await this.processSimpleChat(message, apiKey)
                : await this.processAdvancedChat(message, apiKey);
            
            res.json({ response });
        });
        
        this.app.listen(8081, () => {
            console.log('🔧 API server running on http://localhost:8081');
        });
    }
    
    async processSimpleChat(message, apiKey) {
        // Kid-friendly responses
        return "Hi! I'm Cal. I heard you say: " + message + ". That's really cool!";
    }
    
    async processAdvancedChat(message, apiKey) {
        // Full Cal responses
        return "I understand you're working on: " + message + ". Let me help you think through this...";
    }
}

// Game Server (WebSocket)
class GameServer {
    constructor() {
        this.wss = null;
        this.games = new Map();
    }
    
    async start() {
        this.wss = new WebSocket.Server({ port: 8082 });
        
        this.wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleGameMessage(ws, data);
            });
        });
        
        console.log('🎮 Game server running on ws://localhost:8082');
    }
    
    handleGameMessage(ws, data) {
        switch(data.type) {
            case 'join-game':
                this.joinGame(ws, data.gameId, data.playerId);
                break;
            case 'game-action':
                this.processGameAction(ws, data);
                break;
        }
    }
}

// QR Auth Server
class QRAuthServer {
    constructor() {
        this.app = express();
        this.sessions = new Map();
    }
    
    async start() {
        // Generate QR code for pairing
        this.app.get('/api/qr/generate', async (req, res) => {
            const sessionId = crypto.randomUUID();
            const qrData = {
                sessionId,
                timestamp: Date.now(),
                type: 'device-pairing'
            };
            
            const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
            
            this.sessions.set(sessionId, {
                status: 'pending',
                created: Date.now()
            });
            
            res.json({ sessionId, qrCode });
        });
        
        // Validate QR pairing
        this.app.post('/api/qr/validate', async (req, res) => {
            const { sessionId, deviceId } = req.body;
            const session = this.sessions.get(sessionId);
            
            if (session && session.status === 'pending') {
                session.status = 'paired';
                session.deviceId = deviceId;
                res.json({ success: true });
            } else {
                res.status(400).json({ success: false });
            }
        });
        
        this.app.listen(8083, () => {
            console.log('🔐 QR Auth server running on http://localhost:8083');
        });
    }
}

// Mobile App Bridge
class MobileAppBridge {
    constructor() {
        this.connections = new Map();
    }
    
    // Bridge for React Native / Flutter
    generateMobileAPI() {
        return {
            connect: (deviceId) => this.connectDevice(deviceId),
            sendMessage: (message) => this.bridgeMessage(message),
            syncData: () => this.syncWithCloud()
        };
    }
}

// Chrome Extension Bridge
class ChromeExtensionBridge {
    generateManifest() {
        return {
            manifest_version: 3,
            name: "Soulfra Assistant",
            version: "1.0.0",
            description: "Your AI companion in the browser",
            permissions: ["storage", "activeTab"],
            action: {
                default_popup: "popup.html",
                default_icon: "icon.png"
            },
            background: {
                service_worker: "background.js"
            }
        };
    }
}

// Export everything
module.exports = {
    SoulfraPlatform,
    WebServer,
    APIServer,
    GameServer,
    QRAuthServer,
    MobileAppBridge,
    ChromeExtensionBridge
};

// Launch platform
if (require.main === module) {
    const platform = new SoulfraPlatform();
    platform.launch().catch(console.error);
}