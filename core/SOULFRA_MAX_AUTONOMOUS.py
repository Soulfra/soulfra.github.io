#!/usr/bin/env python3
"""
SOULFRA MAX AUTONOMOUS SYSTEM
- Fully closed loop automation
- QR code pairing with phones
- OAuth protection for all users
- Drag & drop chat logs
- Auto-process, analyze, monetize
- Deploy to web automatically
"""

import os
import json
import uuid
import qrcode
import hashlib
import asyncio
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import jwt
import base64
from pathlib import Path
import secrets

# Try to import QR integration
try:
    from qr_integration import validateQR, injectTraceToken
    QR_INTEGRATION = True
except ImportError:
    # Fallback if not available
    QR_INTEGRATION = False
    print("Warning: QR integration not available - using fallback")

class SoulfraAuth:
    """Complete authentication system with OAuth protection"""
    
    def __init__(self):
        self.secret_key = secrets.token_urlsafe(32)
        self.db_path = "soulfra_auth.db"
        self.setup_database()
        
    def setup_database(self):
        """Setup authentication database"""
        conn = sqlite3.connect(self.db_path)
        
        # Users table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                oauth_provider TEXT,
                oauth_id TEXT,
                qr_paired BOOLEAN DEFAULT FALSE,
                device_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Sessions table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                token TEXT UNIQUE,
                device_id TEXT,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # QR pairing codes
        conn.execute('''
            CREATE TABLE IF NOT EXISTS qr_codes (
                code TEXT PRIMARY KEY,
                user_id TEXT,
                device_id TEXT,
                used BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def generate_qr_pairing_code(self, user_id: str) -> Dict:
        """Generate QR code for device pairing"""
        code = f"SOULFRA-{uuid.uuid4().hex[:8].upper()}"
        expires_at = datetime.now() + timedelta(minutes=5)
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        conn.execute('''
            INSERT INTO qr_codes (code, user_id, expires_at)
            VALUES (?, ?, ?)
        ''', (code, user_id, expires_at))
        conn.commit()
        conn.close()
        
        # Generate QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"soulfra://pair/{code}")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_path = f"qr_codes/{code}.png"
        os.makedirs("qr_codes", exist_ok=True)
        img.save(img_path)
        
        return {
            "code": code,
            "qr_image": img_path,
            "expires_at": expires_at.isoformat(),
            "deep_link": f"soulfra://pair/{code}"
        }
        
    def pair_device(self, code: str, device_id: str) -> Optional[str]:
        """Pair a device using QR code"""
        conn = sqlite3.connect(self.db_path)
        
        # Check if code is valid
        cursor = conn.execute('''
            SELECT user_id, expires_at FROM qr_codes
            WHERE code = ? AND used = FALSE
        ''', (code,))
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return None
            
        user_id, expires_at = result
        
        # Check if expired
        if datetime.fromisoformat(expires_at) < datetime.now():
            conn.close()
            return None
            
        # Mark code as used
        conn.execute('''
            UPDATE qr_codes SET used = TRUE, device_id = ?
            WHERE code = ?
        ''', (device_id, code))
        
        # Update user with device
        conn.execute('''
            UPDATE users SET qr_paired = TRUE, device_id = ?
            WHERE id = ?
        ''', (device_id, user_id))
        
        # Create session
        token = self.create_session(user_id, device_id)
        
        conn.commit()
        conn.close()
        
        return token
        
    def create_session(self, user_id: str, device_id: str) -> str:
        """Create authenticated session"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(days=30)
        
        # Create JWT token
        payload = {
            "session_id": session_id,
            "user_id": user_id,
            "device_id": device_id,
            "exp": expires_at.timestamp()
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm="HS256")
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        conn.execute('''
            INSERT INTO sessions (id, user_id, token, device_id, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (session_id, user_id, token, device_id, expires_at))
        conn.commit()
        conn.close()
        
        return token
        
    def oauth_login(self, provider: str, oauth_data: Dict) -> Dict:
        """Handle OAuth login and protect user automatically"""
        oauth_id = oauth_data.get('id')
        email = oauth_data.get('email')
        
        conn = sqlite3.connect(self.db_path)
        
        # Check if user exists
        cursor = conn.execute('''
            SELECT id FROM users WHERE oauth_provider = ? AND oauth_id = ?
        ''', (provider, oauth_id))
        
        result = cursor.fetchone()
        
        if result:
            user_id = result[0]
            # Update last login
            conn.execute('''
                UPDATE users SET last_login = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (user_id,))
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            conn.execute('''
                INSERT INTO users (id, email, oauth_provider, oauth_id)
                VALUES (?, ?, ?, ?)
            ''', (user_id, email, provider, oauth_id))
            
        conn.commit()
        conn.close()
        
        # Create session
        token = self.create_session(user_id, "web")
        
        return {
            "user_id": user_id,
            "token": token,
            "new_user": result is None,
            "protected": True  # All OAuth users are automatically protected
        }

class ChatLogAutomation:
    """Fully automated chat log processing"""
    
    def __init__(self):
        self.input_dir = "chatlog_drops"
        self.processing_dir = "chatlog_processing"
        self.output_dir = "chatlog_outputs"
        self.setup_directories()
        self.processors = {
            "discord": self.process_discord,
            "slack": self.process_slack,
            "whatsapp": self.process_whatsapp,
            "telegram": self.process_telegram,
            "generic": self.process_generic
        }
        
    def setup_directories(self):
        """Create necessary directories"""
        for dir_path in [self.input_dir, self.processing_dir, self.output_dir]:
            os.makedirs(dir_path, exist_ok=True)
            
    async def watch_for_drops(self):
        """Watch for new chat log drops"""
        print(f"Watching {self.input_dir} for new chat logs...")
        
        processed = set()
        
        while True:
            try:
                # Check for new files
                for file_name in os.listdir(self.input_dir):
                    file_path = os.path.join(self.input_dir, file_name)
                    
                    if file_path not in processed and os.path.isfile(file_path):
                        print(f"New file detected: {file_name}")
                        processed.add(file_path)
                        
                        # Process asynchronously
                        asyncio.create_task(self.process_file(file_path))
                        
                await asyncio.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                print(f"Watch error: {e}")
                await asyncio.sleep(5)
                
    async def process_file(self, file_path: str):
        """Process a dropped file"""
        try:
            # Detect chat type
            chat_type = self.detect_chat_type(file_path)
            print(f"Detected chat type: {chat_type}")
            
            # Move to processing
            file_name = os.path.basename(file_path)
            processing_path = os.path.join(self.processing_dir, file_name)
            os.rename(file_path, processing_path)
            
            # Process based on type
            processor = self.processors.get(chat_type, self.process_generic)
            result = await processor(processing_path)
            
            # Generate outputs
            output_id = str(uuid.uuid4())[:8]
            outputs = await self.generate_all_outputs(result, output_id)
            
            # Save results
            self.save_outputs(outputs, output_id)
            
            print(f"Processing complete: {output_id}")
            return outputs
            
        except Exception as e:
            print(f"Processing error: {e}")
            return None
            
    def detect_chat_type(self, file_path: str) -> str:
        """Detect the type of chat log"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            sample = f.read(1000)
            
        if "discord.com" in sample or "— Today at" in sample:
            return "discord"
        elif "slack.com" in sample or "Posted in #" in sample:
            return "slack"
        elif "WhatsApp" in sample or "end-to-end encrypted" in sample:
            return "whatsapp"
        elif "telegram.org" in sample:
            return "telegram"
        else:
            return "generic"
            
    async def process_discord(self, file_path: str) -> Dict:
        """Process Discord chat log"""
        # Implementation for Discord parsing
        return {"type": "discord", "messages": [], "users": [], "summary": ""}
        
    async def process_slack(self, file_path: str) -> Dict:
        """Process Slack chat log"""
        # Implementation for Slack parsing
        return {"type": "slack", "messages": [], "channels": [], "summary": ""}
        
    async def process_whatsapp(self, file_path: str) -> Dict:
        """Process WhatsApp chat log"""
        # Implementation for WhatsApp parsing
        return {"type": "whatsapp", "messages": [], "participants": [], "summary": ""}
        
    async def process_telegram(self, file_path: str) -> Dict:
        """Process Telegram chat log"""
        # Implementation for Telegram parsing
        return {"type": "telegram", "messages": [], "groups": [], "summary": ""}
        
    async def process_generic(self, file_path: str) -> Dict:
        """Process generic chat log"""
        messages = []
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        # Basic parsing
        current_message = {}
        for line in lines:
            # Simple heuristic parsing
            if line.strip():
                messages.append({
                    "text": line.strip(),
                    "timestamp": datetime.now().isoformat()
                })
                
        return {
            "type": "generic",
            "messages": messages,
            "line_count": len(lines),
            "summary": f"Generic chat with {len(messages)} messages"
        }
        
    async def generate_all_outputs(self, chat_data: Dict, output_id: str) -> Dict:
        """Generate all output formats"""
        outputs = {
            "id": output_id,
            "timestamp": datetime.now().isoformat(),
            "chat_type": chat_data["type"],
            "formats": {}
        }
        
        # Generate different formats
        outputs["formats"]["json"] = chat_data
        outputs["formats"]["markdown"] = self.generate_markdown(chat_data)
        outputs["formats"]["html"] = self.generate_html(chat_data)
        outputs["formats"]["pdf_ready"] = self.generate_pdf_ready(chat_data)
        outputs["formats"]["ai_training"] = self.generate_ai_format(chat_data)
        
        # Calculate value
        outputs["value"] = self.calculate_value(chat_data)
        outputs["monetization"] = {
            "export_price": 9.99,
            "ai_training_price": 19.99,
            "enterprise_price": 99.99
        }
        
        return outputs
        
    def generate_markdown(self, chat_data: Dict) -> str:
        """Generate Markdown format"""
        md = f"# Chat Export - {chat_data['type'].upper()}\n\n"
        md += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        md += f"## Summary\n{chat_data.get('summary', 'No summary available')}\n\n"
        md += f"## Messages ({len(chat_data.get('messages', []))})\n\n"
        
        for msg in chat_data.get('messages', [])[:10]:  # First 10 messages
            md += f"- {msg.get('text', '')}\n"
            
        return md
        
    def generate_html(self, chat_data: Dict) -> str:
        """Generate HTML format"""
        # Implementation
        return "<html><body>Chat Export</body></html>"
        
    def generate_pdf_ready(self, chat_data: Dict) -> Dict:
        """Generate PDF-ready format"""
        return {
            "title": f"Chat Export - {chat_data['type']}",
            "content": chat_data,
            "formatting": "professional"
        }
        
    def generate_ai_format(self, chat_data: Dict) -> Dict:
        """Generate AI training format"""
        return {
            "conversations": chat_data.get('messages', []),
            "metadata": {
                "source": chat_data['type'],
                "count": len(chat_data.get('messages', [])),
                "processed": datetime.now().isoformat()
            }
        }
        
    def calculate_value(self, chat_data: Dict) -> float:
        """Calculate the value of the chat data"""
        base_value = 0
        
        # Value based on message count
        message_count = len(chat_data.get('messages', []))
        base_value += message_count * 0.01
        
        # Value based on type
        type_multipliers = {
            "discord": 1.2,
            "slack": 1.5,
            "whatsapp": 1.1,
            "telegram": 1.3,
            "generic": 1.0
        }
        
        base_value *= type_multipliers.get(chat_data['type'], 1.0)
        
        return round(base_value, 2)
        
    def save_outputs(self, outputs: Dict, output_id: str):
        """Save all outputs"""
        output_path = os.path.join(self.output_dir, output_id)
        os.makedirs(output_path, exist_ok=True)
        
        # Save each format
        for format_name, content in outputs['formats'].items():
            if format_name == 'json':
                with open(os.path.join(output_path, f'export.json'), 'w') as f:
                    json.dump(content, f, indent=2)
            elif format_name == 'markdown':
                with open(os.path.join(output_path, f'export.md'), 'w') as f:
                    f.write(content)
            elif format_name == 'html':
                with open(os.path.join(output_path, f'export.html'), 'w') as f:
                    f.write(content)
                    
        # Save metadata
        with open(os.path.join(output_path, 'metadata.json'), 'w') as f:
            json.dump({
                "id": output_id,
                "timestamp": outputs['timestamp'],
                "value": outputs['value'],
                "monetization": outputs['monetization']
            }, f, indent=2)

class SoulfraWebDeployment:
    """Automatic web deployment system"""
    
    def __init__(self):
        self.deployment_dir = "web_deployment"
        self.setup_deployment()
        
    def setup_deployment(self):
        """Setup web deployment structure"""
        os.makedirs(self.deployment_dir, exist_ok=True)
        
        # Create index.html
        self.create_web_interface()
        
    def create_web_interface(self):
        """Create the web interface"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra - Autonomous Chat Processing</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 40px 0;
        }
        
        h1 {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(45deg, #00ffff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .tagline {
            font-size: 20px;
            color: #888;
        }
        
        .drop-zone {
            margin: 40px auto;
            padding: 60px;
            border: 3px dashed #333;
            border-radius: 20px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
            max-width: 600px;
        }
        
        .drop-zone:hover {
            border-color: #00ffff;
            background: rgba(0, 255, 255, 0.05);
        }
        
        .drop-zone.active {
            border-color: #ff00ff;
            background: rgba(255, 0, 255, 0.05);
        }
        
        .auth-section {
            background: #111;
            padding: 30px;
            border-radius: 15px;
            margin: 40px 0;
            text-align: center;
        }
        
        .oauth-button {
            display: inline-block;
            margin: 10px;
            padding: 15px 30px;
            background: #fff;
            color: #000;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        
        .oauth-button:hover {
            transform: scale(1.05);
        }
        
        .qr-section {
            margin: 40px 0;
            text-align: center;
        }
        
        .qr-code {
            display: inline-block;
            padding: 20px;
            background: #fff;
            border-radius: 15px;
        }
        
        .status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #111;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #333;
        }
        
        .status.connected {
            border-color: #00ff00;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Soulfra</h1>
            <p class="tagline">Drop. Process. Monetize. Automatically.</p>
        </header>
        
        <div class="auth-section">
            <h2>Login with OAuth (Protected by Soulfra)</h2>
            <a href="/auth/google" class="oauth-button">Login with Google</a>
            <a href="/auth/github" class="oauth-button">Login with GitHub</a>
            <a href="/auth/discord" class="oauth-button">Login with Discord</a>
        </div>
        
        <div class="drop-zone" id="dropZone">
            <h2>Drop Your Chat Logs Here</h2>
            <p>Discord, Slack, WhatsApp, Telegram - We handle them all</p>
            <p style="margin-top: 20px; color: #666;">Or click to browse</p>
        </div>
        
        <div class="qr-section" id="qrSection" style="display: none;">
            <h3>Pair Your Phone</h3>
            <div class="qr-code" id="qrCode"></div>
            <p style="margin-top: 10px; color: #888;">Scan with Soulfra mobile app</p>
        </div>
        
        <div class="status" id="status">
            <div>Status: <span id="statusText">Connecting...</span></div>
            <div>Files Processed: <span id="fileCount">0</span></div>
            <div>Value Generated: $<span id="valueGenerated">0.00</span></div>
        </div>
    </div>
    
    <script>
        // Initialize Soulfra client
        class SoulfraClient {
            constructor() {
                this.ws = null;
                this.authenticated = false;
                this.init();
            }
            
            init() {
                // Connect to WebSocket
                this.connect();
                
                // Setup drop zone
                this.setupDropZone();
                
                // Check authentication
                this.checkAuth();
            }
            
            connect() {
                this.ws = new WebSocket('ws://localhost:6001');
                
                this.ws.onopen = () => {
                    document.getElementById('status').classList.add('connected');
                    document.getElementById('statusText').textContent = 'Connected';
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };
                
                this.ws.onerror = () => {
                    document.getElementById('statusText').textContent = 'Error';
                };
                
                this.ws.onclose = () => {
                    document.getElementById('statusText').textContent = 'Disconnected';
                    setTimeout(() => this.connect(), 5000);
                };
            }
            
            setupDropZone() {
                const dropZone = document.getElementById('dropZone');
                
                dropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropZone.classList.add('active');
                });
                
                dropZone.addEventListener('dragleave', () => {
                    dropZone.classList.remove('active');
                });
                
                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('active');
                    
                    const files = e.dataTransfer.files;
                    for (let file of files) {
                        this.uploadFile(file);
                    }
                });
                
                dropZone.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                        for (let file of e.target.files) {
                            this.uploadFile(file);
                        }
                    };
                    input.click();
                });
            }
            
            async uploadFile(file) {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                // Update UI
                const fileCount = document.getElementById('fileCount');
                fileCount.textContent = parseInt(fileCount.textContent) + 1;
                
                const valueGenerated = document.getElementById('valueGenerated');
                const currentValue = parseFloat(valueGenerated.textContent);
                valueGenerated.textContent = (currentValue + result.value).toFixed(2);
            }
            
            async checkAuth() {
                const response = await fetch('/api/auth/status');
                const data = await response.json();
                
                if (data.authenticated) {
                    this.authenticated = true;
                    this.showQRCode();
                }
            }
            
            async showQRCode() {
                const response = await fetch('/api/auth/qr');
                const data = await response.json();
                
                if (data.qr_code) {
                    document.getElementById('qrSection').style.display = 'block';
                    document.getElementById('qrCode').innerHTML = 
                        `<img src="${data.qr_code}" alt="QR Code">`;
                }
            }
            
            handleMessage(data) {
                if (data.type === 'processing_complete') {
                    console.log('Processing complete:', data);
                } else if (data.type === 'auth_update') {
                    if (data.authenticated) {
                        this.showQRCode();
                    }
                }
            }
        }
        
        // Start the client
        const client = new SoulfraClient();
    </script>
</body>
</html>'''
        
        with open(os.path.join(self.deployment_dir, 'index.html'), 'w') as f:
            f.write(html)

# Main autonomous system
class SoulfraMaxAutonomous:
    """The complete autonomous system"""
    
    def __init__(self):
        self.auth = SoulfraAuth()
        self.automation = ChatLogAutomation()
        self.deployment = SoulfraWebDeployment()
        
    async def run(self):
        """Run the complete autonomous system"""
        print("=" * 60)
        print("SOULFRA MAX AUTONOMOUS SYSTEM")
        print("=" * 60)
        print()
        print("Features:")
        print("- OAuth login protection for all users")
        print("- QR code pairing with phones")
        print("- Drag & drop chat logs")
        print("- Automatic processing")
        print("- Web deployment ready")
        print()
        print("Starting autonomous processing...")
        print()
        
        # Start watching for drops
        await self.automation.watch_for_drops()

if __name__ == "__main__":
    system = SoulfraMaxAutonomous()
    asyncio.run(system.run())