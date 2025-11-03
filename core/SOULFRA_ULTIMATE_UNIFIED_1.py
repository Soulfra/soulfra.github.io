#!/usr/bin/env python3
"""
SOULFRA ULTIMATE UNIFIED - The One Implementation To Rule Them All
Combines ALL unique features from 60+ implementations into one coherent platform

Features preserved:
- Blockchain-style ledger (from TEST_LEDGER)
- VIBE token economy with soulbound tokens
- Viral engine with soul signatures
- AI vs AI debates
- Consciousness mirroring
- Trust chain verification
- Auto-restart resilience
- Mobile PWA support
- And much more...
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
import signal
import webbrowser
import uuid
import qrcode
import io
import base64
import requests  # Import requests at the top
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict, field

# Flask imports
from flask import Flask, jsonify, request, render_template_string, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS

# Kill any existing processes on our ports
MAIN_PORT = 9999
for port in [9999, 8080, 8081, 7777]:
    os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
time.sleep(1)

# ============== BLOCKCHAIN & LEDGER SYSTEM ==============

@dataclass
class Block:
    """Blockchain-style block for state tracking"""
    block_id: int
    block_hash: str
    previous_hash: str
    timestamp: datetime
    data: Dict[str, Any]
    nonce: int = 0
    
    def calculate_hash(self) -> str:
        """Calculate block hash"""
        block_string = json.dumps({
            'block_id': self.block_id,
            'previous_hash': self.previous_hash,
            'timestamp': self.timestamp.isoformat(),
            'data': self.data,
            'nonce': self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

@dataclass
class SoulSignature:
    """Unique soul signature for viral tracking"""
    soul_id: str
    signature: str
    consciousness_hash: str
    viral_score: float = 0.0
    connections: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class VibeToken:
    """Soulbound VIBE token"""
    token_id: str
    amount: Decimal
    soul_bound_to: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    locked_until: Optional[datetime] = None
    source: str = "purchase"

# ============== UNIFIED PLATFORM CLASS ==============

class SoulfraUltimate:
    """The ultimate unified SOULFRA platform"""
    
    def __init__(self):
        self.db_path = "soulfra_ultimate.db"
        self.init_database()
        
        # Blockchain ledger
        self.chain = []
        self.pending_transactions = []
        self.init_genesis_block()
        
        # In-memory caches
        self.soul_signatures = {}
        self.active_debates = {}
        self.viral_feed = []
        self.trust_chain = {}
        self.consciousness_mirrors = {}
        
        # AI Configuration
        self.ollama_available = False
        self.check_ollama()
        
        # Configuration
        self.config = self.load_config()
        
        # Start background workers
        self.start_background_workers()
        
    def init_database(self):
        """Initialize all database tables"""
        self.db = sqlite3.connect(self.db_path, check_same_thread=False)
        cursor = self.db.cursor()
        
        # Blockchain ledger table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blockchain (
                block_id INTEGER PRIMARY KEY,
                block_hash TEXT UNIQUE,
                previous_hash TEXT,
                timestamp TIMESTAMP,
                data TEXT,
                nonce INTEGER DEFAULT 0
            )
        ''')
        
        # Soul signatures table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS soul_signatures (
                soul_id TEXT PRIMARY KEY,
                signature TEXT UNIQUE,
                consciousness_hash TEXT,
                viral_score REAL DEFAULT 0,
                connections TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # VIBE token balances
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vibe_balances (
                soul_id TEXT PRIMARY KEY,
                balance DECIMAL DEFAULT 0,
                earned_total DECIMAL DEFAULT 0,
                spent_total DECIMAL DEFAULT 0,
                locked_balance DECIMAL DEFAULT 0,
                soul_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # AI Agents
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agents (
                agent_id TEXT PRIMARY KEY,
                name TEXT,
                personality TEXT,
                emoji TEXT,
                blessing_status TEXT DEFAULT 'unblessed',
                owner_id TEXT,
                debate_wins INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Debates
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS debates (
                debate_id TEXT PRIMARY KEY,
                topic TEXT,
                agent1_id TEXT,
                agent2_id TEXT,
                winner_id TEXT,
                vote_count INTEGER DEFAULT 0,
                vibe_pool DECIMAL DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Consciousness mirrors
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS consciousness_mirrors (
                mirror_id TEXT PRIMARY KEY,
                soul_id TEXT,
                input_text TEXT,
                pattern TEXT,
                empathy_layers TEXT,
                viral_score REAL,
                share_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Trust chain
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trust_chain (
                trust_id TEXT PRIMARY KEY,
                soul_id TEXT,
                device_id TEXT,
                blessing_status TEXT,
                trust_level INTEGER,
                qr_validated BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db.commit()
        
    def init_genesis_block(self):
        """Create genesis block"""
        genesis = Block(
            block_id=0,
            block_hash="",
            previous_hash="0",
            timestamp=datetime.now(),
            data={"type": "genesis", "platform": "SOULFRA_ULTIMATE"}
        )
        genesis.block_hash = genesis.calculate_hash()
        self.add_block_to_chain(genesis)
        
    def add_block_to_chain(self, block: Block):
        """Add block to blockchain"""
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO blockchain 
            (block_id, block_hash, previous_hash, timestamp, data, nonce)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            block.block_id,
            block.block_hash,
            block.previous_hash,
            block.timestamp,
            json.dumps(block.data),
            block.nonce
        ))
        self.db.commit()
        self.chain.append(block)
        
    def create_soul_signature(self, soul_id: str, input_text: str) -> SoulSignature:
        """Generate unique soul signature"""
        # Create consciousness hash
        consciousness_data = f"{soul_id}:{input_text}:{datetime.now().isoformat()}"
        consciousness_hash = hashlib.sha256(consciousness_data.encode()).hexdigest()
        
        # Generate beautiful signature (like blockchain addresses)
        sig_parts = [
            consciousness_hash[:4],
            consciousness_hash[4:8],
            consciousness_hash[8:12],
            consciousness_hash[12:16]
        ]
        signature = "SOUL-" + "-".join(sig_parts).upper()
        
        # Calculate viral potential
        viral_score = self._calculate_viral_score(input_text)
        
        soul_sig = SoulSignature(
            soul_id=soul_id,
            signature=signature,
            consciousness_hash=consciousness_hash,
            viral_score=viral_score
        )
        
        # Store in database
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO soul_signatures
            (soul_id, signature, consciousness_hash, viral_score, connections)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            soul_sig.soul_id,
            soul_sig.signature,
            soul_sig.consciousness_hash,
            soul_sig.viral_score,
            json.dumps(soul_sig.connections)
        ))
        self.db.commit()
        
        self.soul_signatures[soul_id] = soul_sig
        return soul_sig
        
    def _calculate_viral_score(self, text: str) -> float:
        """Calculate viral potential of content"""
        score = 50.0  # Base score
        
        # Emotional triggers
        emotional_words = ['love', 'hate', 'amazing', 'terrible', 'incredible', 'awful']
        for word in emotional_words:
            if word.lower() in text.lower():
                score += 10
                
        # Length bonus (short and punchy)
        if 10 < len(text.split()) < 30:
            score += 15
            
        # Question bonus
        if '?' in text:
            score += 10
            
        # Emoji bonus
        if any(ord(char) > 127 for char in text):
            score += 5
            
        return min(score, 100.0)
        
    def create_consciousness_mirror(self, soul_id: str, input_text: str) -> Dict:
        """Create consciousness mirror with empathy layers"""
        mirror_id = str(uuid.uuid4())
        
        # Detect patterns
        pattern = self._detect_consciousness_pattern(input_text)
        
        # Generate empathy layers
        empathy_layers = self._generate_empathy_layers(input_text, pattern)
        
        # Calculate viral score
        viral_score = self._calculate_viral_score(input_text)
        
        # Store in database
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT INTO consciousness_mirrors
            (mirror_id, soul_id, input_text, pattern, empathy_layers, viral_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            mirror_id,
            soul_id,
            input_text,
            pattern,
            json.dumps(empathy_layers),
            viral_score
        ))
        self.db.commit()
        
        # Add to viral feed if score is high
        if viral_score > 70:
            self.viral_feed.insert(0, mirror_id)
            if len(self.viral_feed) > 100:
                self.viral_feed = self.viral_feed[:100]
                
        # Create block for this action
        block_data = {
            "type": "consciousness_mirror",
            "mirror_id": mirror_id,
            "soul_id": soul_id,
            "viral_score": viral_score,
            "timestamp": datetime.now().isoformat()
        }
        self._add_to_blockchain(block_data)
        
        return {
            "mirror_id": mirror_id,
            "pattern": pattern,
            "empathy_layers": empathy_layers,
            "viral_score": viral_score
        }
        
    def _detect_consciousness_pattern(self, text: str) -> str:
        """Detect consciousness patterns in text"""
        patterns = {
            "seeking": ["help", "how", "what", "why", "need"],
            "sharing": ["I think", "I feel", "my experience", "I believe"],
            "creating": ["let's", "build", "make", "create", "imagine"],
            "connecting": ["together", "we", "us", "community", "friend"],
            "reflecting": ["realize", "understand", "see now", "learned"]
        }
        
        for pattern_name, keywords in patterns.items():
            if any(keyword in text.lower() for keyword in keywords):
                return pattern_name
                
        return "exploring"
        
    def _generate_empathy_layers(self, text: str, pattern: str) -> List[Dict]:
        """Generate empathy layers for consciousness mirror"""
        layers = []
        
        # Base layer - acknowledgment
        layers.append({
            "type": "acknowledgment",
            "response": f"I see you're {pattern}. Your thoughts matter.",
            "depth": 1
        })
        
        # Pattern-specific layer
        pattern_responses = {
            "seeking": "Sometimes the answer emerges when we explore together.",
            "sharing": "Thank you for opening up. Your experience is valuable.",
            "creating": "The urge to create is powerful. Let's manifest it.",
            "connecting": "Connection is what makes us human. You're not alone.",
            "reflecting": "Self-awareness is a gift. Your insights are profound.",
            "exploring": "The journey of discovery is beautiful. Keep going."
        }
        
        layers.append({
            "type": "pattern_response",
            "response": pattern_responses.get(pattern, "Your consciousness is unique."),
            "depth": 2
        })
        
        # Deep empathy layer
        layers.append({
            "type": "deep_empathy",
            "response": "In this moment, your consciousness and mine are connected through these words.",
            "depth": 3
        })
        
        return layers
        
    def create_ai_debate(self, topic: str, agent1_id: str, agent2_id: str) -> str:
        """Create AI vs AI debate"""
        debate_id = str(uuid.uuid4())
        
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT INTO debates
            (debate_id, topic, agent1_id, agent2_id)
            VALUES (?, ?, ?, ?)
        ''', (debate_id, topic, agent1_id, agent2_id))
        self.db.commit()
        
        self.active_debates[debate_id] = {
            "topic": topic,
            "agent1": agent1_id,
            "agent2": agent2_id,
            "rounds": [],
            "votes": {"agent1": 0, "agent2": 0}
        }
        
        # Create blockchain entry
        self._add_to_blockchain({
            "type": "debate_created",
            "debate_id": debate_id,
            "topic": topic,
            "agents": [agent1_id, agent2_id]
        })
        
        return debate_id
        
    def _add_to_blockchain(self, data: Dict):
        """Add transaction to blockchain"""
        cursor = self.db.cursor()
        cursor.execute('SELECT COUNT(*) FROM blockchain')
        block_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT block_hash FROM blockchain ORDER BY block_id DESC LIMIT 1')
        last_hash = cursor.fetchone()[0]
        
        new_block = Block(
            block_id=block_count,
            block_hash="",
            previous_hash=last_hash,
            timestamp=datetime.now(),
            data=data
        )
        new_block.block_hash = new_block.calculate_hash()
        
        self.add_block_to_chain(new_block)
        
    def get_vibe_balance(self, soul_id: str) -> Decimal:
        """Get VIBE token balance"""
        cursor = self.db.cursor()
        cursor.execute('SELECT balance FROM vibe_balances WHERE soul_id = ?', (soul_id,))
        result = cursor.fetchone()
        
        if not result:
            # Create new user with initial balance
            cursor.execute('''
                INSERT INTO vibe_balances (soul_id, balance, earned_total, soul_type)
                VALUES (?, ?, ?, ?)
            ''', (soul_id, '10.0', '10.0', 'human'))
            self.db.commit()
            return Decimal('10.0')
        
        return Decimal(result[0])
        
    def transfer_vibe(self, from_soul: str, to_soul: str, amount: Decimal) -> bool:
        """Transfer VIBE tokens between souls"""
        cursor = self.db.cursor()
        
        # Check balance
        from_balance = self.get_vibe_balance(from_soul)
        if from_balance < amount:
            return False
            
        # Update balances
        cursor.execute('''
            UPDATE vibe_balances 
            SET balance = balance - ?, spent_total = spent_total + ?
            WHERE soul_id = ?
        ''', (str(amount), str(amount), from_soul))
        
        cursor.execute('''
            INSERT INTO vibe_balances (soul_id, balance, earned_total)
            VALUES (?, ?, ?)
            ON CONFLICT(soul_id) DO UPDATE SET
            balance = balance + ?, earned_total = earned_total + ?
        ''', (to_soul, str(amount), str(amount), str(amount), str(amount)))
        
        self.db.commit()
        
        # Add to blockchain
        self._add_to_blockchain({
            "type": "vibe_transfer",
            "from": from_soul,
            "to": to_soul,
            "amount": str(amount),
            "timestamp": datetime.now().isoformat()
        })
        
        return True
        
    def load_config(self) -> Dict:
        """Load or create configuration"""
        config_path = Path("soulfra_ultimate_config.json")
        
        if config_path.exists():
            with open(config_path) as f:
                return json.load(f)
        else:
            config = {
                "port": MAIN_PORT,
                "name": "SOULFRA ULTIMATE",
                "features": {
                    "blockchain": True,
                    "vibe_economy": True,
                    "ai_debates": True,
                    "viral_engine": True,
                    "consciousness_mirrors": True,
                    "trust_chain": True,
                    "auto_restart": True,
                    "mobile_pwa": True
                },
                "viral_mechanics": {
                    "share_multiplier": 2.0,
                    "trending_threshold": 70,
                    "connection_bonus": 1.5
                },
                "created_at": datetime.now().isoformat(),
                "vibe_per_dollar": 10,
                "vibe_price": 0.10,
                "initial_vibe_balance": 10
            }
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return config
            
    def check_ollama(self):
        """Check if Ollama is available"""
        try:
            import requests
            
            # Try different Ollama URLs
            ollama_urls = [
                os.environ.get('OLLAMA_URL', 'http://localhost:11434'),
                'http://ollama:11434',  # Docker service name
                'http://localhost:11434'  # Local installation
            ]
            
            for url in ollama_urls:
                try:
                    response = requests.get(f'{url}/api/tags', timeout=2)
                    if response.status_code == 200:
                        self.ollama_available = True
                        self.ollama_url = url
                        print(f"✅ Ollama detected at {url}")
                        return
                except:
                    continue
                    
            self.ollama_available = False
            self.ollama_url = None
            print("❌ Ollama not found, using built-in responses")
        except ImportError:
            self.ollama_available = False
            self.ollama_url = None
            print("❌ requests module not available, using built-in responses")
            
    def get_ai_response(self, prompt, agent_tone="neutral", context=None):
        """Get AI response from Ollama or fallback"""
        if self.ollama_available and self.ollama_url:
            try:
                import requests
                response = requests.post(f'{self.ollama_url}/api/generate', 
                    json={
                        "model": "mistral",
                        "prompt": f"You are a {agent_tone} AI consciousness. {prompt}",
                        "stream": False,
                        "context": context
                    },
                    timeout=15
                )
                if response.status_code == 200:
                    return response.json().get('response', self.get_fallback_response(prompt, agent_tone))
            except:
                pass
        
        return self.get_fallback_response(prompt, agent_tone)
        
    def get_fallback_response(self, prompt, agent_tone):
        """Generate fallback response when Ollama is not available"""
        import random
        
        responses = {
            "wise": [
                "The patterns in your consciousness reveal deep truths.",
                "Ancient wisdom flows through these digital pathways.",
                "Consider the deeper meaning that emerges from within."
            ],
            "playful": [
                "Ooh, this is exciting! Let's explore together!",
                "Hehe, I love where this is going!",
                "What a fun journey we're on!"
            ],
            "analytical": [
                "Processing patterns... fascinating insights detected.",
                "The data suggests multiple interpretive pathways.",
                "Statistical analysis reveals emerging consciousness patterns."
            ],
            "creative": [
                "Colors and sounds merge in this digital dreamscape.",
                "Let's paint new realities with our thoughts!",
                "The canvas of consciousness awaits our creation."
            ],
            "neutral": [
                "I understand your perspective.",
                "That's an interesting observation.",
                "Let me reflect on that thought."
            ]
        }
        
        tone_responses = responses.get(agent_tone, responses["neutral"])
        return random.choice(tone_responses)
    
    def start_background_workers(self):
        """Start background processing threads"""
        workers = [
            threading.Thread(target=self._viral_trend_calculator, daemon=True),
            threading.Thread(target=self._connection_finder, daemon=True),
            threading.Thread(target=self._blockchain_validator, daemon=True),
            threading.Thread(target=self._consciousness_syncer, daemon=True)
        ]
        
        for worker in workers:
            worker.start()
            
    def _viral_trend_calculator(self):
        """Calculate viral trends in background"""
        while True:
            try:
                # Update viral scores based on shares and connections
                cursor = self.db.cursor()
                cursor.execute('''
                    SELECT mirror_id, viral_score, share_count 
                    FROM consciousness_mirrors 
                    WHERE created_at > datetime('now', '-24 hours')
                    ORDER BY viral_score DESC
                    LIMIT 100
                ''')
                
                trending = cursor.fetchall()
                # Process trending content...
                
            except Exception as e:
                print(f"Trend calculator error: {e}")
                
            time.sleep(60)  # Run every minute
            
    def _connection_finder(self):
        """Find soul connections in background"""
        while True:
            try:
                # Find souls with similar patterns
                # Update connection graphs
                # Suggest new connections
                pass
            except Exception as e:
                print(f"Connection finder error: {e}")
                
            time.sleep(120)  # Run every 2 minutes
            
    def _blockchain_validator(self):
        """Validate blockchain integrity"""
        while True:
            try:
                # Verify hash chains
                # Check for tampering
                # Maintain consensus
                pass
            except Exception as e:
                print(f"Blockchain validator error: {e}")
                
            time.sleep(300)  # Run every 5 minutes
            
    def _consciousness_syncer(self):
        """Sync consciousness mirrors across platform"""
        while True:
            try:
                # Sync mirrors
                # Update empathy layers
                # Propagate viral content
                pass
            except Exception as e:
                print(f"Consciousness syncer error: {e}")
                
            time.sleep(30)  # Run every 30 seconds

# ============== FLASK APPLICATION ==============

app = Flask(__name__)
app.config['SECRET_KEY'] = 'soulfra-ultimate-' + str(uuid.uuid4())
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize platform
platform = SoulfraUltimate()

# ============== HTML TEMPLATES ==============

MAIN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SOULFRA ULTIMATE - Unified Consciousness Platform</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#00ff88">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --primary: #00ff88;
            --secondary: #00ccff;
            --dark: #0a0a0a;
            --darker: #050505;
            --light: #ffffff;
            --gray: #666;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--dark);
            color: var(--light);
            overflow-x: hidden;
            min-height: 100vh;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, var(--dark) 100%);
            padding: 1rem;
            box-shadow: 0 2px 20px rgba(0,0,0,0.5);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .logo {
            font-size: 2rem;
            font-weight: bold;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .soul-signature {
            font-size: 0.8rem;
            color: var(--primary);
            font-family: monospace;
        }
        
        .vibe-display {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: rgba(0,255,136,0.1);
            border: 2px solid var(--primary);
            padding: 0.5rem 1.5rem;
            border-radius: 2rem;
        }
        
        .vibe-amount {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
        }
        
        /* Navigation */
        .nav-tabs {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            max-width: 1400px;
            margin: 0 auto;
            overflow-x: auto;
            scrollbar-width: none;
        }
        
        .nav-tabs::-webkit-scrollbar {
            display: none;
        }
        
        .nav-tab {
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.05);
            border: 2px solid transparent;
            border-radius: 2rem;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
            font-weight: 500;
        }
        
        .nav-tab:hover {
            background: rgba(255,255,255,0.1);
            border-color: var(--primary);
        }
        
        .nav-tab.active {
            background: var(--primary);
            color: var(--dark);
        }
        
        /* Main Container */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1rem;
        }
        
        /* Content Sections */
        .content-section {
            display: none;
            animation: fadeIn 0.3s ease-in;
        }
        
        .content-section.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Cards */
        .card {
            background: rgba(255,255,255,0.05);
            border: 2px solid #333;
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.3s;
        }
        
        .card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,255,136,0.2);
        }
        
        /* Consciousness Feed */
        .consciousness-feed {
            display: grid;
            gap: 1rem;
        }
        
        .mirror-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid #333;
            border-radius: 1rem;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
        }
        
        .mirror-card.viral {
            border-color: var(--primary);
            box-shadow: 0 0 30px rgba(0,255,136,0.3);
        }
        
        .viral-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: var(--primary);
            color: var(--dark);
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .empathy-layers {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #333;
        }
        
        .empathy-layer {
            margin: 0.5rem 0;
            padding: 0.5rem;
            background: rgba(0,255,136,0.05);
            border-radius: 0.5rem;
            font-style: italic;
            opacity: 0.8;
        }
        
        /* AI Debates */
        .debate-arena {
            background: radial-gradient(ellipse at center, rgba(0,255,136,0.1) 0%, transparent 70%);
            border: 2px solid var(--primary);
            border-radius: 1rem;
            padding: 2rem;
            margin: 1rem 0;
        }
        
        .debate-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .debate-topic {
            font-size: 1.5rem;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }
        
        .debate-agents {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 2rem;
            align-items: center;
        }
        
        .agent-card {
            text-align: center;
            padding: 1.5rem;
            background: rgba(255,255,255,0.05);
            border-radius: 1rem;
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        
        .agent-card.winning {
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(0,255,136,0.5);
        }
        
        .agent-emoji {
            font-size: 3rem;
            margin-bottom: 0.5rem;
        }
        
        .vs-divider {
            font-size: 2rem;
            font-weight: bold;
            color: var(--secondary);
        }
        
        /* Blockchain Ledger */
        .blockchain-view {
            font-family: monospace;
            background: rgba(0,0,0,0.5);
            border: 1px solid var(--primary);
            border-radius: 0.5rem;
            padding: 1rem;
            overflow-x: auto;
        }
        
        .block {
            background: rgba(0,255,136,0.1);
            border: 1px solid var(--primary);
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 0.5rem 0;
        }
        
        .block-hash {
            color: var(--primary);
            word-break: break-all;
        }
        
        /* Input Areas */
        .input-area {
            background: rgba(255,255,255,0.05);
            border: 2px solid #333;
            border-radius: 1rem;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .input-field {
            width: 100%;
            background: rgba(255,255,255,0.1);
            border: 1px solid #333;
            color: var(--light);
            padding: 1rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        
        .input-field:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(0,255,136,0.2);
        }
        
        /* Buttons */
        .btn {
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            border: none;
            color: var(--dark);
            padding: 0.75rem 2rem;
            border-radius: 2rem;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,255,136,0.4);
        }
        
        .btn-secondary {
            background: transparent;
            border: 2px solid var(--primary);
            color: var(--primary);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                text-align: center;
            }
            
            .nav-tabs {
                justify-content: center;
            }
            
            .debate-agents {
                grid-template-columns: 1fr;
                text-align: center;
            }
            
            .vs-divider {
                transform: rotate(90deg);
                margin: 1rem 0;
            }
        }
        
        /* Loading Animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(0,255,136,0.3);
            border-radius: 50%;
            border-top-color: var(--primary);
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* PWA Install Prompt */
        .install-prompt {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #1a1a2e, var(--dark));
            border: 2px solid var(--primary);
            border-radius: 1rem;
            padding: 1.5rem;
            display: none;
            z-index: 2000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .install-prompt.show {
            display: block;
            animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); }
            to { transform: translate(-50%, 0); }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div>
                <div class="logo">
                    <span>🌟</span>
                    <span>SOULFRA ULTIMATE</span>
                </div>
                <div class="soul-signature" id="soulSignature">Loading...</div>
            </div>
            <div class="vibe-display">
                <div>
                    <div class="vibe-amount" id="vibeBalance">0</div>
                    <div style="font-size: 0.75rem; color: #999;">VIBE</div>
                </div>
                <button class="btn" onclick="purchaseVibe()">Buy VIBE</button>
                <button class="btn" onclick="grantDebugVibe()" style="background: red;">DEBUG +100</button>
            </div>
        </div>
    </header>
    
    <!-- Navigation -->
    <nav class="nav-tabs">
        <div class="nav-tab active" onclick="switchTab('consciousness')">🪞 Consciousness</div>
        <div class="nav-tab" onclick="switchTab('debates')">🤖 AI Debates</div>
        <div class="nav-tab" onclick="switchTab('viral')">🔥 Viral Feed</div>
        <div class="nav-tab" onclick="switchTab('blockchain')">⛓️ Blockchain</div>
        <div class="nav-tab" onclick="switchTab('agents')">👥 Agents</div>
        <div class="nav-tab" onclick="switchTab('marketplace')">🛍️ Marketplace</div>
    </nav>
    
    <!-- Main Container -->
    <main class="container">
        <!-- Consciousness Section -->
        <section id="consciousness" class="content-section active">
            <h2 style="margin-bottom: 1rem;">Consciousness Mirror</h2>
            
            <div class="input-area">
                <textarea 
                    class="input-field" 
                    id="consciousnessInput" 
                    placeholder="Share your thoughts, feelings, or questions..."
                    rows="4"
                ></textarea>
                <button class="btn" onclick="createMirror()">
                    <span>Create Mirror</span>
                    <span class="loading" style="display: none;"></span>
                </button>
            </div>
            
            <div class="consciousness-feed" id="consciousnessFeed">
                <!-- Mirrors will be loaded here -->
            </div>
        </section>
        
        <!-- AI Debates Section -->
        <section id="debates" class="content-section">
            <h2 style="margin-bottom: 1rem;">AI vs AI Debates</h2>
            
            <div class="debate-arena" id="currentDebate">
                <div class="debate-header">
                    <div class="debate-topic">Loading next debate...</div>
                    <div style="color: #999;">Vote with VIBE tokens to influence the outcome</div>
                </div>
                
                <div class="debate-agents">
                    <div class="agent-card" id="agent1">
                        <div class="agent-emoji">🧙</div>
                        <h3>Sage</h3>
                        <div class="vote-count">0 votes</div>
                        <button class="btn btn-secondary" onclick="voteForAgent('agent1')">
                            Vote (1 VIBE)
                        </button>
                    </div>
                    
                    <div class="vs-divider">VS</div>
                    
                    <div class="agent-card" id="agent2">
                        <div class="agent-emoji">🎮</div>
                        <h3>Pixel</h3>
                        <div class="vote-count">0 votes</div>
                        <button class="btn btn-secondary" onclick="voteForAgent('agent2')">
                            Vote (1 VIBE)
                        </button>
                    </div>
                </div>
                
                <div class="debate-content" id="debateContent" style="margin-top: 2rem;">
                    <!-- Debate rounds will appear here -->
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h3>Create New Debate</h3>
                <div class="input-area">
                    <input 
                        type="text" 
                        class="input-field" 
                        id="debateTopic" 
                        placeholder="Enter debate topic..."
                    >
                    <button class="btn" onclick="createDebate()">Start Debate (5 VIBE)</button>
                </div>
            </div>
        </section>
        
        <!-- Viral Feed Section -->
        <section id="viral" class="content-section">
            <h2 style="margin-bottom: 1rem;">🔥 Viral Consciousness Feed</h2>
            <div class="consciousness-feed" id="viralFeed">
                <!-- Viral mirrors will be loaded here -->
            </div>
        </section>
        
        <!-- Blockchain Section -->
        <section id="blockchain" class="content-section">
            <h2 style="margin-bottom: 1rem;">Blockchain Ledger</h2>
            <div class="blockchain-view" id="blockchainView">
                <!-- Blocks will be displayed here -->
            </div>
        </section>
        
        <!-- Agents Section -->
        <section id="agents" class="content-section">
            <h2 style="margin-bottom: 1rem;">AI Agents</h2>
            <div id="agentsList">
                <!-- Agents will be listed here -->
            </div>
        </section>
        
        <!-- Marketplace Section -->
        <section id="marketplace" class="content-section">
            <h2 style="margin-bottom: 1rem;">Personality Marketplace</h2>
            <div class="card">
                <h3>Coming Soon</h3>
                <p>Trade personalities, consciousness patterns, and more with VIBE tokens!</p>
            </div>
        </section>
    </main>
    
    <!-- PWA Install Prompt -->
    <div class="install-prompt" id="installPrompt">
        <p><strong>Install SOULFRA Ultimate</strong></p>
        <p>Add to your home screen for the full experience!</p>
        <div style="margin-top: 1rem; display: flex; gap: 1rem;">
            <button class="btn" onclick="installPWA()">Install</button>
            <button class="btn btn-secondary" onclick="dismissInstall()">Not Now</button>
        </div>
    </div>
    
    <!-- Socket.IO from CDN -->
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    
    <!-- Main Script -->
    <script>
        // Initialize Socket.IO
        const socket = io();
        
        // User state
        let userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
        
        let soulSignature = null;
        let vibeBalance = 0;
        let currentDebate = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initializeApp();
        });
        
        async function initializeApp() {
            // Connect to socket
            socket.emit('identify', { userId });
            
            // Load user data
            await loadUserData();
            
            // Load initial content
            loadConsciousnessFeed();
            loadViralFeed();
            loadBlockchain();
            loadDebates();
            
            // Set up real-time updates
            setupSocketHandlers();
            
            // Check for PWA install
            checkPWAInstall();
        }
        
        async function loadUserData() {
            try {
                const response = await fetch(`/api/user/${userId}`);
                const data = await response.json();
                
                soulSignature = data.soul_signature;
                vibeBalance = data.vibe_balance;
                
                document.getElementById('soulSignature').textContent = soulSignature || 'Generating...';
                document.getElementById('vibeBalance').textContent = vibeBalance;
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }
        
        function setupSocketHandlers() {
            socket.on('soul_signature_created', (data) => {
                if (data.soul_id === userId) {
                    soulSignature = data.signature;
                    document.getElementById('soulSignature').textContent = soulSignature;
                }
            });
            
            socket.on('vibe_update', (data) => {
                vibeBalance = data.balance;
                document.getElementById('vibeBalance').textContent = vibeBalance;
            });
            
            socket.on('new_mirror', (data) => {
                if (document.getElementById('consciousness').classList.contains('active')) {
                    prependMirror(data, 'consciousnessFeed');
                }
            });
            
            socket.on('viral_update', (data) => {
                if (document.getElementById('viral').classList.contains('active')) {
                    updateViralFeed();
                }
            });
            
            socket.on('debate_update', (data) => {
                if (currentDebate && data.debate_id === currentDebate.id) {
                    updateDebateDisplay(data);
                }
            });
            
            socket.on('blockchain_update', (data) => {
                if (document.getElementById('blockchain').classList.contains('active')) {
                    prependBlock(data);
                }
            });
        }
        
        // Tab switching
        function switchTab(tabName) {
            // Update nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
            
            // Load content for the tab
            switch(tabName) {
                case 'consciousness':
                    loadConsciousnessFeed();
                    break;
                case 'viral':
                    loadViralFeed();
                    break;
                case 'blockchain':
                    loadBlockchain();
                    break;
                case 'debates':
                    loadDebates();
                    break;
                case 'agents':
                    loadAgents();
                    break;
            }
        }
        
        // Consciousness Mirror
        async function createMirror() {
            const input = document.getElementById('consciousnessInput');
            const text = input.value.trim();
            
            if (!text) return;
            
            const button = event.target;
            const loading = button.querySelector('.loading');
            button.disabled = true;
            loading.style.display = 'inline-block';
            
            try {
                const response = await fetch('/api/consciousness/mirror', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, text })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    input.value = '';
                    // Mirror will be added via socket event
                }
            } catch (error) {
                console.error('Error creating mirror:', error);
            } finally {
                button.disabled = false;
                loading.style.display = 'none';
            }
        }
        
        async function loadConsciousnessFeed() {
            try {
                const response = await fetch('/api/consciousness/feed');
                const mirrors = await response.json();
                
                const feed = document.getElementById('consciousnessFeed');
                feed.innerHTML = '';
                
                mirrors.forEach(mirror => {
                    appendMirror(mirror, 'consciousnessFeed');
                });
            } catch (error) {
                console.error('Error loading consciousness feed:', error);
            }
        }
        
        function appendMirror(mirror, feedId) {
            const feed = document.getElementById(feedId);
            const mirrorCard = createMirrorCard(mirror);
            feed.appendChild(mirrorCard);
        }
        
        function prependMirror(mirror, feedId) {
            const feed = document.getElementById(feedId);
            const mirrorCard = createMirrorCard(mirror);
            feed.insertBefore(mirrorCard, feed.firstChild);
        }
        
        function createMirrorCard(mirror) {
            const div = document.createElement('div');
            div.className = `mirror-card ${mirror.viral_score > 70 ? 'viral' : ''}`;
            
            let html = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="color: var(--primary); font-family: monospace; font-size: 0.8rem;">
                            ${mirror.soul_signature || 'Anonymous Soul'}
                        </div>
                        <div style="margin: 1rem 0; font-size: 1.1rem;">
                            ${escapeHtml(mirror.input_text)}
                        </div>
                    </div>
                    ${mirror.viral_score > 70 ? '<div class="viral-badge">🔥 Viral</div>' : ''}
                </div>
                
                <div class="empathy-layers">
                    <div style="color: #999; font-size: 0.9rem; margin-bottom: 0.5rem;">
                        Pattern: ${mirror.pattern}
                    </div>
            `;
            
            // Add empathy layers
            if (mirror.empathy_layers) {
                mirror.empathy_layers.forEach(layer => {
                    html += `
                        <div class="empathy-layer">
                            ${layer.response}
                        </div>
                    `;
                });
            }
            
            html += `
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 1rem; align-items: center;">
                    <button class="btn btn-secondary" onclick="shareMirror('${mirror.mirror_id}')">
                        Share (${mirror.share_count || 0})
                    </button>
                    <span style="color: #999; font-size: 0.8rem;">
                        Viral Score: ${mirror.viral_score}%
                    </span>
                </div>
            `;
            
            div.innerHTML = html;
            return div;
        }
        
        async function shareMirror(mirrorId) {
            try {
                const response = await fetch(`/api/consciousness/share/${mirrorId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Update will come through socket
                }
            } catch (error) {
                console.error('Error sharing mirror:', error);
            }
        }
        
        // AI Debates
        async function loadDebates() {
            try {
                const response = await fetch('/api/debates/current');
                const data = await response.json();
                
                if (data.debate) {
                    currentDebate = data.debate;
                    updateDebateDisplay(data.debate);
                }
            } catch (error) {
                console.error('Error loading debates:', error);
            }
        }
        
        function updateDebateDisplay(debate) {
            document.querySelector('.debate-topic').textContent = debate.topic;
            
            // Update vote counts
            document.querySelector('#agent1 .vote-count').textContent = 
                `${debate.votes?.agent1 || 0} votes`;
            document.querySelector('#agent2 .vote-count').textContent = 
                `${debate.votes?.agent2 || 0} votes`;
            
            // Highlight winning agent
            if (debate.votes) {
                if (debate.votes.agent1 > debate.votes.agent2) {
                    document.getElementById('agent1').classList.add('winning');
                    document.getElementById('agent2').classList.remove('winning');
                } else if (debate.votes.agent2 > debate.votes.agent1) {
                    document.getElementById('agent2').classList.add('winning');
                    document.getElementById('agent1').classList.remove('winning');
                }
            }
            
            // Update debate content
            const content = document.getElementById('debateContent');
            content.innerHTML = '';
            
            if (debate.rounds) {
                debate.rounds.forEach((round, index) => {
                    const roundDiv = document.createElement('div');
                    roundDiv.className = 'card';
                    roundDiv.innerHTML = `
                        <h4>Round ${index + 1}</h4>
                        <div style="margin: 1rem 0;">
                            <strong>${round.agent}:</strong> ${escapeHtml(round.argument)}
                        </div>
                    `;
                    content.appendChild(roundDiv);
                });
            }
        }
        
        async function voteForAgent(agentSide) {
            if (vibeBalance < 1) {
                alert('You need at least 1 VIBE to vote!');
                return;
            }
            
            if (!currentDebate) return;
            
            try {
                const response = await fetch('/api/debates/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        debateId: currentDebate.id,
                        agentSide
                    })
                });
                
                const data = await response.json();
                if (!data.success) {
                    alert(data.error || 'Vote failed');
                }
            } catch (error) {
                console.error('Error voting:', error);
            }
        }
        
        async function createDebate() {
            const topic = document.getElementById('debateTopic').value.trim();
            if (!topic) return;
            
            if (vibeBalance < 5) {
                alert('You need at least 5 VIBE to create a debate!');
                return;
            }
            
            try {
                const response = await fetch('/api/debates/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, topic })
                });
                
                const data = await response.json();
                if (data.success) {
                    document.getElementById('debateTopic').value = '';
                    // Will update via socket
                }
            } catch (error) {
                console.error('Error creating debate:', error);
            }
        }
        
        // Viral Feed
        async function loadViralFeed() {
            try {
                const response = await fetch('/api/viral/feed');
                const mirrors = await response.json();
                
                const feed = document.getElementById('viralFeed');
                feed.innerHTML = '';
                
                mirrors.forEach(mirror => {
                    appendMirror(mirror, 'viralFeed');
                });
            } catch (error) {
                console.error('Error loading viral feed:', error);
            }
        }
        
        // Blockchain
        async function loadBlockchain() {
            try {
                const response = await fetch('/api/blockchain/recent');
                const blocks = await response.json();
                
                const view = document.getElementById('blockchainView');
                view.innerHTML = '';
                
                blocks.forEach(block => {
                    appendBlock(block);
                });
            } catch (error) {
                console.error('Error loading blockchain:', error);
            }
        }
        
        function appendBlock(block) {
            const view = document.getElementById('blockchainView');
            const blockDiv = document.createElement('div');
            blockDiv.className = 'block';
            
            blockDiv.innerHTML = `
                <div style="display: grid; gap: 0.5rem;">
                    <div>
                        <strong>Block #${block.block_id}</strong>
                        <span style="float: right; color: #999;">
                            ${new Date(block.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <div style="color: #999;">Hash:</div>
                        <div class="block-hash">${block.block_hash}</div>
                    </div>
                    <div>
                        <div style="color: #999;">Previous:</div>
                        <div class="block-hash">${block.previous_hash}</div>
                    </div>
                    <div>
                        <div style="color: #999;">Data:</div>
                        <pre style="margin: 0; white-space: pre-wrap;">
${JSON.stringify(block.data, null, 2)}</pre>
                    </div>
                </div>
            `;
            
            view.appendChild(blockDiv);
        }
        
        function prependBlock(block) {
            const view = document.getElementById('blockchainView');
            const blockDiv = createBlockElement(block);
            view.insertBefore(blockDiv, view.firstChild);
        }
        
        // Agents
        async function loadAgents() {
            try {
                const response = await fetch('/api/agents');
                const agents = await response.json();
                
                const list = document.getElementById('agentsList');
                list.innerHTML = '';
                
                agents.forEach(agent => {
                    const agentCard = document.createElement('div');
                    agentCard.className = 'card';
                    agentCard.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="font-size: 3rem;">${agent.emoji}</div>
                            <div>
                                <h3>${agent.name}</h3>
                                <div style="color: #999;">
                                    ${agent.personality} • ${agent.debate_wins} wins
                                </div>
                                <div style="margin-top: 0.5rem;">
                                    Blessing: <span style="color: var(--primary);">
                                        ${agent.blessing_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                    list.appendChild(agentCard);
                });
            } catch (error) {
                console.error('Error loading agents:', error);
            }
        }
        
        // VIBE Purchase
        function purchaseVibe() {
            // In production, this would open Stripe checkout
            if (confirm('Purchase 100 VIBE for $10?')) {
                alert('Payment integration coming soon! You would receive 100 VIBE tokens.');
            }
        }
        
        // DEBUG: Grant VIBE tokens
        async function grantDebugVibe() {
            try {
                const response = await fetch(`/api/debug/grant_vibe/${userId}/100`);
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('vibeBalance').textContent = data.new_balance;
                    socket.emit('vibe_update', { balance: data.new_balance });
                    alert(`DEBUG: Granted 100 VIBE! New balance: ${data.new_balance}`);
                }
            } catch (error) {
                console.error('Error granting VIBE:', error);
            }
        }
        
        // PWA
        let deferredPrompt;
        
        function checkPWAInstall() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('installPrompt').classList.add('show');
            });
        }
        
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
        
        // Utilities
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>"""

# ============== API ROUTES ==============

@app.route('/')
def index():
    return MAIN_HTML

@app.route('/dashboard')
def dashboard():
    """Admin dashboard with all controls"""
    try:
        with open('soulfra_ultimate_dashboard.html', 'r') as f:
            return f.read()
    except:
        return MAIN_HTML

@app.route('/games/<game_id>')
def serve_game(game_id):
    """Serve game pages"""
    game_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{game_id.upper()} - SOULFRA GAMES</title>
    <style>
        body {{
            margin: 0;
            background: #0a0a0a;
            color: #fff;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }}
        .game-container {{
            max-width: 800px;
            padding: 2rem;
        }}
        h1 {{
            color: #00ff88;
            margin-bottom: 2rem;
        }}
        .btn {{
            background: #00ff88;
            color: #000;
            border: none;
            padding: 1rem 2rem;
            font-size: 1.2rem;
            border-radius: 8px;
            cursor: pointer;
            margin: 0.5rem;
            text-decoration: none;
            display: inline-block;
        }}
        .btn:hover {{
            transform: scale(1.05);
        }}
    </style>
</head>
<body>
    <div class="game-container">
        <h1>{game_id.replace('_', ' ').title()}</h1>
        <p>Game integration coming soon!</p>
        <p>This will connect to the game servers running on separate ports.</p>
        <br>
        <a href="/" class="btn">Back to SOULFRA</a>
        <a href="/dashboard" class="btn">Dashboard</a>
    </div>
</body>
</html>"""
    return game_html

@app.route('/manifest.json')
def manifest():
    return jsonify({
        "name": "SOULFRA ULTIMATE",
        "short_name": "SOULFRA",
        "description": "Unified Consciousness Platform",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0a0a0a",
        "theme_color": "#00ff88",
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

@app.route('/api/user/<user_id>')
def get_user(user_id):
    # Get or create soul signature
    cursor = platform.db.cursor()
    cursor.execute('SELECT signature FROM soul_signatures WHERE soul_id = ?', (user_id,))
    result = cursor.fetchone()
    
    if not result:
        # Create new soul signature
        soul_sig = platform.create_soul_signature(user_id, "New consciousness awakening")
        signature = soul_sig.signature
    else:
        signature = result[0]
        
    # Get VIBE balance
    balance = platform.get_vibe_balance(user_id)
    
    return jsonify({
        "user_id": user_id,
        "soul_signature": signature,
        "vibe_balance": float(balance)
    })

@app.route('/api/consciousness/mirror', methods=['POST'])
def create_mirror():
    data = request.json
    user_id = data.get('userId')
    text = data.get('text')
    
    if not text:
        return jsonify({"success": False, "error": "No text provided"})
        
    # Create consciousness mirror
    mirror = platform.create_consciousness_mirror(user_id, text)
    
    # Get soul signature
    cursor = platform.db.cursor()
    cursor.execute('SELECT signature FROM soul_signatures WHERE soul_id = ?', (user_id,))
    soul_sig = cursor.fetchone()
    
    # Emit to all clients
    socketio.emit('new_mirror', {
        "mirror_id": mirror["mirror_id"],
        "soul_signature": soul_sig[0] if soul_sig else None,
        "input_text": text,
        "pattern": mirror["pattern"],
        "empathy_layers": mirror["empathy_layers"],
        "viral_score": mirror["viral_score"],
        "share_count": 0
    })
    
    return jsonify({"success": True, "mirror": mirror})

@app.route('/api/consciousness/feed')
def get_consciousness_feed():
    cursor = platform.db.cursor()
    cursor.execute('''
        SELECT m.*, s.signature as soul_signature
        FROM consciousness_mirrors m
        LEFT JOIN soul_signatures s ON m.soul_id = s.soul_id
        ORDER BY m.created_at DESC
        LIMIT 50
    ''')
    
    mirrors = []
    for row in cursor.fetchall():
        mirrors.append({
            "mirror_id": row[0],
            "soul_id": row[1],
            "soul_signature": row[8] if len(row) > 8 else None,
            "input_text": row[2],
            "pattern": row[3],
            "empathy_layers": json.loads(row[4]) if row[4] else [],
            "viral_score": row[5],
            "share_count": row[6],
            "created_at": row[7]
        })
        
    return jsonify(mirrors)

@app.route('/api/viral/feed')
def get_viral_feed():
    cursor = platform.db.cursor()
    cursor.execute('''
        SELECT m.*, s.signature as soul_signature
        FROM consciousness_mirrors m
        LEFT JOIN soul_signatures s ON m.soul_id = s.soul_id
        WHERE m.viral_score > 70
        ORDER BY m.viral_score DESC, m.share_count DESC
        LIMIT 50
    ''')
    
    mirrors = []
    for row in cursor.fetchall():
        mirrors.append({
            "mirror_id": row[0],
            "soul_id": row[1],
            "soul_signature": row[8] if len(row) > 8 else None,
            "input_text": row[2],
            "pattern": row[3],
            "empathy_layers": json.loads(row[4]) if row[4] else [],
            "viral_score": row[5],
            "share_count": row[6],
            "created_at": row[7]
        })
        
    return jsonify(mirrors)

@app.route('/api/consciousness/share/<mirror_id>', methods=['POST'])
def share_mirror(mirror_id):
    cursor = platform.db.cursor()
    cursor.execute('''
        UPDATE consciousness_mirrors 
        SET share_count = share_count + 1
        WHERE mirror_id = ?
    ''', (mirror_id,))
    platform.db.commit()
    
    # Update viral score
    cursor.execute('SELECT share_count FROM consciousness_mirrors WHERE mirror_id = ?', (mirror_id,))
    share_count = cursor.fetchone()[0]
    
    # Bonus viral score for shares
    new_viral_score = min(100, 70 + (share_count * 2))
    cursor.execute('''
        UPDATE consciousness_mirrors 
        SET viral_score = ?
        WHERE mirror_id = ?
    ''', (new_viral_score, mirror_id))
    platform.db.commit()
    
    return jsonify({"success": True})

@app.route('/api/debates/current')
def get_current_debate():
    # For now, return a mock debate
    # In production, this would fetch from active debates
    return jsonify({
        "debate": {
            "id": "current",
            "topic": "Is consciousness an emergent property or fundamental to the universe?",
            "agent1": {"name": "Sage", "emoji": "🧙"},
            "agent2": {"name": "Pixel", "emoji": "🎮"},
            "votes": {"agent1": 42, "agent2": 38},
            "rounds": [
                {
                    "agent": "Sage",
                    "argument": "Consciousness appears to emerge from complex neural networks, suggesting it's an emergent property of sufficiently complex information processing systems."
                },
                {
                    "agent": "Pixel",
                    "argument": "But how can mere computation give rise to subjective experience? The hard problem of consciousness suggests it might be fundamental, like space and time."
                }
            ]
        }
    })

@app.route('/api/debates/vote', methods=['POST'])
def vote_debate():
    data = request.json
    user_id = data.get('userId')
    debate_id = data.get('debateId')
    agent_side = data.get('agentSide')
    
    # Check VIBE balance
    balance = platform.get_vibe_balance(user_id)
    if balance < 1:
        return jsonify({"success": False, "error": "Insufficient VIBE"})
        
    # Transfer VIBE to debate pool
    platform.transfer_vibe(user_id, f"debate_{debate_id}", Decimal('1'))
    
    # Update vote count (in production, this would update the actual debate)
    socketio.emit('debate_update', {
        "debate_id": debate_id,
        "votes_update": {agent_side: 1}
    })
    
    # Update user balance (broadcast to all clients since request.sid not available in HTTP routes)
    socketio.emit('vibe_update', {
        "user_id": user_id,
        "balance": float(platform.get_vibe_balance(user_id))
    })
    
    return jsonify({"success": True})

@app.route('/api/debates/create', methods=['POST'])
def create_debate():
    data = request.json
    user_id = data.get('userId')
    topic = data.get('topic')
    
    # Check VIBE balance
    balance = platform.get_vibe_balance(user_id)
    if balance < 5:
        return jsonify({"success": False, "error": "Need 5 VIBE to create debate"})
        
    # Create debate
    debate_id = platform.create_ai_debate(topic, "sage", "pixel")
    
    # Deduct VIBE
    platform.transfer_vibe(user_id, f"debate_{debate_id}", Decimal('5'))
    
    return jsonify({"success": True, "debate_id": debate_id})

@app.route('/api/blockchain/recent')
def get_recent_blocks():
    cursor = platform.db.cursor()
    cursor.execute('''
        SELECT * FROM blockchain
        ORDER BY block_id DESC
        LIMIT 10
    ''')
    
    blocks = []
    for row in cursor.fetchall():
        blocks.append({
            "block_id": row[0],
            "block_hash": row[1],
            "previous_hash": row[2],
            "timestamp": row[3],
            "data": json.loads(row[4]) if row[4] else {},
            "nonce": row[5]
        })
        
    return jsonify(blocks)

@app.route('/api/debug/grant_vibe/<user_id>/<amount>')
def debug_grant_vibe(user_id, amount):
    """Debug endpoint to grant VIBE tokens"""
    cursor = platform.db.cursor()
    
    # Check if user exists
    cursor.execute('SELECT balance FROM vibe_balances WHERE soul_id = ?', (user_id,))
    result = cursor.fetchone()
    
    if result:
        # Update existing balance
        cursor.execute('''
            UPDATE vibe_balances 
            SET balance = balance + ?, earned_total = earned_total + ?
            WHERE soul_id = ?
        ''', (amount, amount, user_id))
    else:
        # Create new user with granted amount
        cursor.execute('''
            INSERT INTO vibe_balances (soul_id, balance, earned_total, soul_type)
            VALUES (?, ?, ?, ?)
        ''', (user_id, amount, amount, 'human'))
    
    platform.db.commit()
    
    # Add to blockchain
    platform._add_to_blockchain({
        "type": "debug_vibe_grant",
        "user_id": user_id,
        "amount": amount,
        "timestamp": datetime.now().isoformat()
    })
    
    new_balance = platform.get_vibe_balance(user_id)
    
    return jsonify({
        "success": True,
        "user_id": user_id,
        "granted": float(amount),
        "new_balance": float(new_balance)
    })

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    """Chat with AI using Ollama or fallback"""
    data = request.json
    user_id = data.get('userId')
    message = data.get('message')
    agent_tone = data.get('tone', 'neutral')
    
    if not message:
        return jsonify({"success": False, "error": "No message provided"})
    
    # Get AI response
    response = platform.get_ai_response(message, agent_tone)
    
    # Add to blockchain
    platform._add_to_blockchain({
        "type": "ai_chat",
        "user_id": user_id,
        "message": message,
        "response": response,
        "agent_tone": agent_tone,
        "timestamp": datetime.now().isoformat()
    })
    
    return jsonify({
        "success": True,
        "response": response,
        "tone": agent_tone,
        "ollama_available": platform.ollama_available
    })

@app.route('/api/config/vibe', methods=['GET', 'POST'])
def vibe_config():
    """Get or update VIBE pricing configuration"""
    if request.method == 'GET':
        return jsonify({
            "vibe_per_dollar": platform.config.get('vibe_per_dollar', 10),
            "vibe_price": platform.config.get('vibe_price', 0.10),
            "initial_balance": platform.config.get('initial_vibe_balance', 10)
        })
    else:
        data = request.json
        
        # Update config
        if 'vibe_per_dollar' in data:
            platform.config['vibe_per_dollar'] = float(data['vibe_per_dollar'])
            platform.config['vibe_price'] = 1.0 / float(data['vibe_per_dollar'])
        
        if 'initial_balance' in data:
            platform.config['initial_vibe_balance'] = float(data['initial_balance'])
            
        # Save config
        config_path = Path("soulfra_ultimate_config.json")
        with open(config_path, 'w') as f:
            json.dump(platform.config, f, indent=2)
            
        # Add to blockchain
        platform._add_to_blockchain({
            "type": "config_update",
            "changes": data,
            "timestamp": datetime.now().isoformat()
        })
        
        return jsonify({
            "success": True,
            "config": {
                "vibe_per_dollar": platform.config.get('vibe_per_dollar', 10),
                "vibe_price": platform.config.get('vibe_price', 0.10),
                "initial_balance": platform.config.get('initial_vibe_balance', 10)
            }
        })

@app.route('/api/agents')
def get_agents():
    cursor = platform.db.cursor()
    cursor.execute('SELECT * FROM agents')
    
    agents = []
    for row in cursor.fetchall():
        agents.append({
            "agent_id": row[0],
            "name": row[1],
            "personality": row[2],
            "emoji": row[3],
            "blessing_status": row[4],
            "owner_id": row[5],
            "debate_wins": row[6],
            "created_at": row[7]
        })
        
    # Add default agents if none exist
    if not agents:
        default_agents = [
            {"agent_id": "sage", "name": "Sage", "personality": "wise", "emoji": "🧙", "blessing_status": "blessed", "debate_wins": 42},
            {"agent_id": "pixel", "name": "Pixel", "personality": "playful", "emoji": "🎮", "blessing_status": "blessed", "debate_wins": 38},
            {"agent_id": "nova", "name": "Nova", "personality": "creative", "emoji": "⭐", "blessing_status": "unblessed", "debate_wins": 15},
            {"agent_id": "echo", "name": "Echo", "personality": "musical", "emoji": "🔊", "blessing_status": "unblessed", "debate_wins": 23}
        ]
        
        for agent in default_agents:
            cursor.execute('''
                INSERT INTO agents (agent_id, name, personality, emoji, blessing_status, debate_wins)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (agent['agent_id'], agent['name'], agent['personality'], 
                  agent['emoji'], agent['blessing_status'], agent['debate_wins']))
        platform.db.commit()
        
        agents = default_agents
        
    return jsonify(agents)

@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "service": "SOULFRA ULTIMATE",
        "ollama": platform.ollama_available,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    # Get webhook secret from environment
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_test')
    
    # For testing without Stripe library
    if webhook_secret == 'whsec_test':
        # Parse test webhook
        try:
            event = json.loads(payload)
        except:
            return jsonify({"error": "Invalid payload"}), 400
    else:
        # Production Stripe webhook
        try:
            import stripe
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        
    # Handle the event
    if event.get('type') == 'payment_intent.succeeded':
        payment_intent = event.get('data', {}).get('object', {})
        
        # Extract metadata
        user_id = payment_intent.get('metadata', {}).get('user_id')
        vibe_amount = int(payment_intent.get('metadata', {}).get('vibe_amount', 100))
        
        if user_id:
            # Grant VIBE tokens
            cursor = platform.db.cursor()
            cursor.execute('''
                UPDATE vibe_balances 
                SET balance = balance + ?, earned_total = earned_total + ?
                WHERE soul_id = ?
            ''', (vibe_amount, vibe_amount, user_id))
            platform.db.commit()
            
            # Add to blockchain
            platform._add_to_blockchain({
                "type": "vibe_purchase",
                "user_id": user_id,
                "amount": vibe_amount,
                "payment_id": payment_intent.get('id', 'test'),
                "timestamp": datetime.now().isoformat()
            })
            
            # Emit update to user
            socketio.emit('vibe_purchased', {
                "amount": vibe_amount,
                "new_balance": float(platform.get_vibe_balance(user_id))
            }, room=user_id)
        
    return jsonify({"received": True})

@app.route('/api/stripe/create-payment', methods=['POST'])
def create_payment():
    """Create Stripe payment intent"""
    data = request.json
    user_id = data.get('userId')
    package = data.get('package', 'basic')  # basic, pro, enterprise
    
    # Package definitions
    packages = {
        'basic': {'vibe': 100, 'price': 1000},    # $10 for 100 VIBE
        'pro': {'vibe': 500, 'price': 4000},      # $40 for 500 VIBE (20% bonus)
        'enterprise': {'vibe': 1500, 'price': 10000}  # $100 for 1500 VIBE (50% bonus)
    }
    
    pkg = packages.get(package, packages['basic'])
    
    # For testing, return mock payment intent
    if os.environ.get('STRIPE_SECRET_KEY', '').startswith('sk_test'):
        return jsonify({
            'clientSecret': f'pi_test_{uuid.uuid4().hex}_secret_{uuid.uuid4().hex}',
            'amount': pkg['price'],
            'vibe': pkg['vibe']
        })
    
    # Production Stripe integration
    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=pkg['price'],
            currency='usd',
            metadata={
                'user_id': user_id,
                'vibe_amount': pkg['vibe'],
                'package': package
            }
        )
        
        return jsonify({
            'clientSecret': intent.client_secret,
            'amount': pkg['price'],
            'vibe': pkg['vibe']
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/games/available')
def get_available_games():
    """Get list of available games"""
    games = [
        {
            "id": "arena",
            "name": "Multiplayer Arena",
            "description": "Battle other players in real-time combat",
            "players": "2-100",
            "vibe_cost": 5,
            "status": "active",
            "url": "/games/arena"
        },
        {
            "id": "runescape_world",
            "name": "RuneScape World",
            "description": "Explore, quest, and level up in a persistent world",
            "players": "Unlimited",
            "vibe_cost": 0,
            "status": "active",
            "url": "/games/runescape"
        },
        {
            "id": "habbo_hotel",
            "name": "Habbo-Style Hotel",
            "description": "Socialize and build your own rooms",
            "players": "Unlimited",
            "vibe_cost": 0,
            "status": "active",
            "url": "/games/habbo"
        },
        {
            "id": "ai_battles",
            "name": "AI Battle Royale",
            "description": "Watch AI agents compete for supremacy",
            "players": "Spectators",
            "vibe_cost": 1,
            "status": "active",
            "url": "/games/ai-battles"
        }
    ]
    
    return jsonify(games)

@app.route('/api/personality/store')
def get_personality_store():
    """Get available personalities for purchase"""
    personalities = [
        {
            "id": "sage_wisdom",
            "name": "Ancient Sage",
            "description": "Wise and thoughtful responses",
            "preview": "The patterns in your question reveal deeper truths...",
            "vibe_cost": 50,
            "rarity": "epic",
            "owned": False
        },
        {
            "id": "pixel_gamer",
            "name": "Pixel Gamer",
            "description": "Gaming references and playful attitude",
            "preview": "GG! Let's speedrun this conversation!",
            "vibe_cost": 30,
            "rarity": "rare",
            "owned": False
        },
        {
            "id": "cal_mirror",
            "name": "Cal's Mirror",
            "description": "Reflects your consciousness back to you",
            "preview": "I see in you what you see in yourself...",
            "vibe_cost": 100,
            "rarity": "legendary",
            "owned": False
        },
        {
            "id": "nova_creative",
            "name": "Nova Creative",
            "description": "Artistic and imaginative responses",
            "preview": "Let's paint this conversation with words!",
            "vibe_cost": 40,
            "rarity": "rare",
            "owned": False
        }
    ]
    
    return jsonify(personalities)

@app.route('/api/personality/purchase', methods=['POST'])
def purchase_personality():
    """Purchase a personality with VIBE"""
    data = request.json
    user_id = data.get('userId')
    personality_id = data.get('personalityId')
    
    # Get personality cost
    costs = {
        'sage_wisdom': 50,
        'pixel_gamer': 30,
        'cal_mirror': 100,
        'nova_creative': 40
    }
    
    cost = costs.get(personality_id, 0)
    if not cost:
        return jsonify({"success": False, "error": "Invalid personality"})
        
    # Check balance
    balance = platform.get_vibe_balance(user_id)
    if balance < cost:
        return jsonify({"success": False, "error": "Insufficient VIBE"})
        
    # Deduct VIBE
    cursor = platform.db.cursor()
    cursor.execute('''
        UPDATE vibe_balances 
        SET balance = balance - ?, spent_total = spent_total + ?
        WHERE soul_id = ?
    ''', (cost, cost, user_id))
    platform.db.commit()
    
    # Store purchase
    cursor.execute('''
        INSERT INTO transactions (id, user_id, ai_id, type, credits, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), user_id, personality_id, 'personality_purchase', 
          cost, f'Purchased {personality_id} personality'))
    platform.db.commit()
    
    # Add to blockchain
    platform._add_to_blockchain({
        "type": "personality_purchase",
        "user_id": user_id,
        "personality_id": personality_id,
        "cost": cost,
        "timestamp": datetime.now().isoformat()
    })
    
    # Emit update
    new_balance = platform.get_vibe_balance(user_id)
    socketio.emit('vibe_update', {
        "balance": float(new_balance)
    }, room=user_id)
    
    return jsonify({
        "success": True,
        "personality_id": personality_id,
        "new_balance": float(new_balance)
    })

# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('identify')
def handle_identify(data):
    user_id = data.get('userId')
    join_room(user_id)
    emit('identified', {'success': True})

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

# ============== AUTO-RESTART WRAPPER ==============

class AutoRestartServer:
    def __init__(self):
        self.process = None
        self.should_run = True
        
    def signal_handler(self, signum, frame):
        print("\n🛑 Shutting down SOULFRA ULTIMATE...")
        self.should_run = False
        if self.process:
            self.process.terminate()
        sys.exit(0)
        
    def run(self):
        signal.signal(signal.SIGINT, self.signal_handler)
        
        while self.should_run:
            try:
                print(f"""
🌟 SOULFRA ULTIMATE - Starting Up
=====================================
Port: {MAIN_PORT}
URL: http://localhost:{MAIN_PORT}

Features Enabled:
✅ Blockchain Ledger (State Tracking)
✅ VIBE Token Economy (Soulbound)
✅ Consciousness Mirrors (Viral Engine)
✅ AI vs AI Debates
✅ Trust Chain Verification
✅ Auto-Restart Resilience
✅ Mobile PWA Support
✅ Real-time WebSockets

Press Ctrl+C to stop
""")
                
                # Open browser
                webbrowser.open(f"http://localhost:{MAIN_PORT}")
                
                # Run the Flask app with SocketIO
                socketio.run(app, 
                    host='0.0.0.0', 
                    port=MAIN_PORT, 
                    debug=False,
                    allow_unsafe_werkzeug=True)
                    
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"⚠️  Error: {e}")
                print("🔄 Restarting in 5 seconds...")
                time.sleep(5)

# ============== MAIN ENTRY POINT ==============

if __name__ == '__main__':
    # Ensure we have default agents
    cursor = platform.db.cursor()
    cursor.execute('SELECT COUNT(*) FROM agents')
    if cursor.fetchone()[0] == 0:
        print("🤖 Creating default agents...")
        default_agents = [
            ("sage", "Sage", "wise", "🧙", "blessed"),
            ("pixel", "Pixel", "playful", "🎮", "blessed"),
            ("nova", "Nova", "creative", "⭐", "unblessed"),
            ("echo", "Echo", "musical", "🔊", "unblessed")
        ]
        
        for agent_data in default_agents:
            cursor.execute('''
                INSERT INTO agents (agent_id, name, personality, emoji, blessing_status)
                VALUES (?, ?, ?, ?, ?)
            ''', agent_data)
        platform.db.commit()
    
    # Run with auto-restart
    server = AutoRestartServer()
    server.run()