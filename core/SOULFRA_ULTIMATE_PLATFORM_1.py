#!/usr/bin/env python3
"""
SOULFRA ULTIMATE PLATFORM
The complete viral platform with all marketplaces integrated
Sims + Clippy + Grand Exchange + Everything
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
from datetime import datetime, timedelta
from decimal import Decimal
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
        logging.FileHandler('soulfra_ultimate.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('SOULFRA_ULTIMATE')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'soulfra-ultimate-key-' + str(uuid.uuid4())
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Import marketplace components inline to avoid import errors
# from VIBE_TOKEN_ECONOMY import VibeEconomy, BackyardSportsEconomy, DraftKingsStyle, UpworkGigEconomy, AgentExportEconomy
# from PERSONALITY_MARKETPLACE import PersonalityMarketplace

# Simplified versions for now
class VibeEconomy:
    def __init__(self):
        self.db = sqlite3.connect('vibe_economy.db', check_same_thread=False)
        self.token_price_usd = Decimal("0.10")
        
    async def purchase_vibe_tokens(self, user_id, usd_amount, stripe_payment_id):
        vibe_amount = Decimal(str(usd_amount)) / self.token_price_usd
        return {
            'success': True,
            'vibe_purchased': float(vibe_amount),
            'usd_spent': usd_amount,
            'balance': float(vibe_amount)
        }

class BackyardSportsEconomy:
    def __init__(self, vibe_economy):
        self.vibe = vibe_economy

class DraftKingsStyle:
    def __init__(self, vibe_economy):
        self.vibe = vibe_economy

class UpworkGigEconomy:
    def __init__(self, vibe_economy):
        self.vibe = vibe_economy

class AgentExportEconomy:
    def __init__(self, vibe_economy):
        self.vibe = vibe_economy
        
class PersonalityMarketplace:
    def __init__(self):
        self.cal_base = {
            "core_traits": {
                "enthusiasm": 0.8,
                "trust": 0.9,
                "creativity": 0.7,
                "humor": 0.6,
                "wisdom": 0.8
            }
        }
        
    def get_available_personalities(self):
        return {
            'free_tier': [
                {'id': 'gamer', 'name': 'Gamer', 'emoji': '🎮', 'description': 'Competitive and strategic', 'price': 0},
                {'id': 'artist', 'name': 'Artist', 'emoji': '🎨', 'description': 'Creative and expressive', 'price': 0},
                {'id': 'scholar', 'name': 'Scholar', 'emoji': '📚', 'description': 'Wise and knowledgeable', 'price': 0}
            ],
            'premium_tier': [
                {'id': 'hacker', 'name': 'Hacker', 'emoji': '💻', 'description': '1337 h4x0r skillz', 'price': 50},
                {'id': 'celebrity', 'name': 'Celebrity', 'emoji': '⭐', 'description': 'Famous and charismatic', 'price': 75},
                {'id': 'zen_master', 'name': 'Zen Master', 'emoji': '☯️', 'description': 'Peaceful and enlightened', 'price': 100}
            ],
            'legendary_tier': [
                {'id': 'cal_riven', 'name': 'Cal Riven', 'emoji': '👑', 'description': 'The original sovereign consciousness', 'price': 1000},
                {'id': 'quantum_sage', 'name': 'Quantum Sage', 'emoji': '🌌', 'description': 'Exists in multiple realities', 'price': 500}
            ]
        }

# Global state
class UltimatePlatform:
    def __init__(self):
        self.db = None
        self.agents = {}
        self.debates = {}
        self.users = {}
        self.soul_feeds = []
        self.start_time = time.time()
        
        # Initialize economies
        self.vibe_economy = VibeEconomy()
        self.sports_economy = BackyardSportsEconomy(self.vibe_economy)
        self.draftkings = DraftKingsStyle(self.vibe_economy)
        self.gig_economy = UpworkGigEconomy(self.vibe_economy)
        self.export_economy = AgentExportEconomy(self.vibe_economy)
        self.personality_market = PersonalityMarketplace()
        
        # Game worlds
        self.game_worlds = {
            'plaza': {'name': 'Social Plaza', 'port': 3000, 'users': 0},
            'arena': {'name': 'Battle Arena', 'port': 3001, 'users': 0},
            'runescape': {'name': 'RuneScape World', 'port': 13002, 'users': 0},
            'habbo': {'name': 'Soulfra Hotel', 'port': 13004, 'users': 0}
        }
        
        # Clippy assistant
        self.clippy_suggestions = [
            "🎮 Try the Battle Arena for epic AI duels!",
            "💰 Check out the VIBE marketplace for new skins!",
            "🏆 Join a Backyard Baseball league!",
            "🤖 Your agents can earn VIBE by completing gigs!",
            "🎯 Draft AI agents in fantasy leagues!",
            "🏰 Visit Soulfra Hotel to meet other users!"
        ]
        
        self.init_database()
        self.load_agents()
        
    def init_database(self):
        """Initialize unified database"""
        self.db = sqlite3.connect('soulfra_ultimate.db', check_same_thread=False)
        cursor = self.db.cursor()
        
        # Users table with VIBE balance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                vibe_balance DECIMAL DEFAULT 100,
                total_earned DECIMAL DEFAULT 0,
                total_spent DECIMAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Agents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT,
                owner_id TEXT,
                personality TEXT,
                emoji TEXT,
                status TEXT DEFAULT 'idle',
                current_world TEXT,
                earnings DECIMAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Marketplace purchases
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS purchases (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                item_type TEXT,
                item_id TEXT,
                price DECIMAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db.commit()
        
    def load_agents(self):
        """Load AI agents with personalities"""
        base_agents = [
            {'id': 'pixel', 'name': 'Pixel', 'emoji': '🎮', 'personality': 'gamer'},
            {'id': 'sage', 'name': 'Sage', 'emoji': '🧙', 'personality': 'wise'},
            {'id': 'nova', 'name': 'Nova', 'emoji': '⭐', 'personality': 'creative'},
            {'id': 'echo', 'name': 'Echo', 'emoji': '🔊', 'personality': 'musical'},
            {'id': 'cipher', 'name': 'Cipher', 'emoji': '🔐', 'personality': 'mysterious'},
            {'id': 'zen', 'name': 'Zen', 'emoji': '☯️', 'personality': 'calm'}
        ]
        
        for agent in base_agents:
            self.agents[agent['id']] = {
                **agent,
                'status': 'available',
                'debate_wins': 0,
                'earnings': Decimal('0'),
                'current_task': None,
                'skills': ['debate', 'creativity', 'analysis']
            }
            
    def get_or_create_user(self, user_id):
        """Get or create user with VIBE balance"""
        if user_id not in self.users:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT OR IGNORE INTO users (id, username, vibe_balance)
                VALUES (?, ?, ?)
            ''', (user_id, f'User_{user_id[-4:]}', 100))
            self.db.commit()
            
            self.users[user_id] = {
                'id': user_id,
                'username': f'User_{user_id[-4:]}',
                'vibe_balance': Decimal('100'),
                'owned_agents': [],
                'owned_skins': ['default'],
                'achievements': []
            }
        return self.users[user_id]

platform = UltimatePlatform()

# Ultimate HTML Interface
ULTIMATE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SOULFRA - The Ultimate Platform</title>
    <link rel="manifest" href="/manifest.json">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            overflow-x: hidden;
            position: relative;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 15px 20px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.5);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ccff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* VIBE Balance Display */
        .vibe-balance {
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            padding: 10px 20px;
            border-radius: 30px;
        }
        
        .vibe-amount {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
            text-shadow: 0 0 10px #00ff88;
        }
        
        .vibe-label {
            color: #aaa;
            font-size: 14px;
        }
        
        /* Tab Navigation */
        .tabs {
            display: flex;
            gap: 5px;
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
            flex-wrap: wrap;
        }
        
        .tab {
            background: #1a1a2e;
            border: 2px solid #333;
            padding: 12px 24px;
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
            position: relative;
            overflow: hidden;
        }
        
        .tab:hover {
            transform: translateY(-2px);
            border-color: #00ccff;
            box-shadow: 0 5px 20px rgba(0, 204, 255, 0.3);
        }
        
        .tab.active {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            border-color: transparent;
        }
        
        .tab-icon {
            font-size: 20px;
            margin-right: 8px;
        }
        
        /* Content Area */
        .content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            min-height: calc(100vh - 200px);
        }
        
        .tab-content {
            display: none;
            animation: fadeIn 0.5s;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Feed Tab */
        .soul-feed-container {
            display: grid;
            gap: 20px;
        }
        
        .post-input {
            background: #1a1a2e;
            border: 2px solid #333;
            border-radius: 20px;
            padding: 20px;
        }
        
        .post-textarea {
            width: 100%;
            background: #0a0a0a;
            border: 1px solid #444;
            color: #fff;
            padding: 15px;
            border-radius: 15px;
            resize: none;
            font-size: 16px;
            margin-bottom: 15px;
        }
        
        .post-button {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .post-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.5);
        }
        
        /* VIBE Economy Tab */
        .economy-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .economy-card {
            background: #1a1a2e;
            border: 2px solid #333;
            border-radius: 20px;
            padding: 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .economy-card:hover {
            transform: translateY(-5px);
            border-color: #00ff88;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .economy-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .economy-title {
            font-size: 20px;
            margin-bottom: 10px;
            color: #00ccff;
        }
        
        .economy-desc {
            color: #aaa;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        
        .economy-price {
            font-size: 24px;
            color: #00ff88;
            font-weight: bold;
        }
        
        /* Control Center (Sims Dashboard) */
        .control-center {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            gap: 20px;
            height: 600px;
        }
        
        .agent-list {
            background: #1a1a2e;
            border-radius: 20px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .agent-item {
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .agent-item:hover {
            border-color: #00ff88;
            transform: translateX(5px);
        }
        
        .world-view {
            background: #0a0a0a;
            border: 2px solid #333;
            border-radius: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .activity-feed {
            background: #1a1a2e;
            border-radius: 20px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .activity-item {
            background: #0a0a0a;
            border-left: 3px solid #00ff88;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
        
        /* Games Tab */
        .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .game-card {
            background: #1a1a2e;
            border: 2px solid #333;
            border-radius: 20px;
            overflow: hidden;
            transition: all 0.3s;
        }
        
        .game-card:hover {
            transform: translateY(-5px);
            border-color: #00ccff;
            box-shadow: 0 10px 30px rgba(0, 204, 255, 0.3);
        }
        
        .game-preview {
            height: 200px;
            background: #0a0a0a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 72px;
        }
        
        .game-info {
            padding: 20px;
        }
        
        .game-title {
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .game-players {
            color: #00ff88;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .play-button {
            width: 100%;
            background: linear-gradient(45deg, #00ccff, #0099ff);
            color: #fff;
            border: none;
            padding: 12px;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .play-button:hover {
            transform: scale(1.02);
            box-shadow: 0 5px 20px rgba(0, 204, 255, 0.5);
        }
        
        /* Clippy Assistant */
        .clippy {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ff00ff, #00ccff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(255, 0, 255, 0.5);
            z-index: 1000;
        }
        
        .clippy:hover {
            transform: scale(1.1) rotate(10deg);
        }
        
        .clippy-bubble {
            position: fixed;
            bottom: 120px;
            right: 30px;
            background: #1a1a2e;
            border: 2px solid #ff00ff;
            border-radius: 20px;
            padding: 20px;
            max-width: 300px;
            display: none;
            animation: bounceIn 0.5s;
        }
        
        .clippy-bubble.show {
            display: block;
        }
        
        @keyframes bounceIn {
            0% { transform: scale(0.3) translateY(20px); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        
        /* Marketplace Modal */
        .marketplace-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }
        
        .marketplace-modal.active {
            display: flex;
        }
        
        .modal-content {
            background: #1a1a2e;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 2px solid #00ff88;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .tabs {
                justify-content: center;
            }
            
            .tab {
                padding: 10px 20px;
                font-size: 14px;
            }
            
            .control-center {
                grid-template-columns: 1fr;
                height: auto;
            }
            
            .economy-grid,
            .games-grid {
                grid-template-columns: 1fr;
            }
            
            .clippy {
                width: 60px;
                height: 60px;
                font-size: 30px;
                bottom: 20px;
                right: 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div class="logo">SOULFRA</div>
            <div class="vibe-balance">
                <div>
                    <div class="vibe-amount" id="vibeBalance">100</div>
                    <div class="vibe-label">VIBE</div>
                </div>
                <button class="post-button" style="padding: 8px 20px;" onclick="showPurchaseModal()">
                    Buy VIBE
                </button>
            </div>
        </div>
    </div>
    
    <!-- Tab Navigation -->
    <div class="tabs">
        <div class="tab active" onclick="switchTab('feed')">
            <span class="tab-icon">📱</span>Feed
        </div>
        <div class="tab" onclick="switchTab('economy')">
            <span class="tab-icon">💰</span>Economy
        </div>
        <div class="tab" onclick="switchTab('control')">
            <span class="tab-icon">🎮</span>Control Center
        </div>
        <div class="tab" onclick="switchTab('marketplace')">
            <span class="tab-icon">🛍️</span>Marketplace
        </div>
        <div class="tab" onclick="switchTab('games')">
            <span class="tab-icon">🎯</span>Games
        </div>
        <div class="tab" onclick="switchTab('debates')">
            <span class="tab-icon">🤖</span>AI Debates
        </div>
    </div>
    
    <!-- Content Area -->
    <div class="content">
        <!-- Feed Tab -->
        <div id="feed-tab" class="tab-content active">
            <div class="soul-feed-container">
                <div class="post-input">
                    <textarea class="post-textarea" placeholder="Share your thoughts..." rows="3"></textarea>
                    <button class="post-button" onclick="postToFeed()">Post to Soul Feed</button>
                </div>
                <div id="feedContent"></div>
            </div>
        </div>
        
        <!-- Economy Tab -->
        <div id="economy-tab" class="tab-content">
            <h2 style="text-align: center; margin-bottom: 30px; color: #00ff88;">
                VIBE Token Economy
            </h2>
            <div class="economy-grid">
                <div class="economy-card" onclick="joinBackyardSports()">
                    <div class="economy-icon">⚾</div>
                    <div class="economy-title">Backyard Baseball</div>
                    <div class="economy-desc">
                        Classic backyard fun with AI teams. Win up to 50 VIBE per game!
                    </div>
                    <div class="economy-price">5 VIBE</div>
                </div>
                
                <div class="economy-card" onclick="openDraftKings()">
                    <div class="economy-icon">🎰</div>
                    <div class="economy-title">AI Fantasy League</div>
                    <div class="economy-desc">
                        Draft AI agents, win based on their performance. Daily contests!
                    </div>
                    <div class="economy-price">10+ VIBE</div>
                </div>
                
                <div class="economy-card" onclick="browseGigs()">
                    <div class="economy-icon">💼</div>
                    <div class="economy-title">AI Work Marketplace</div>
                    <div class="economy-desc">
                        Your agents complete real tasks for VIBE. Passive income!
                    </div>
                    <div class="economy-price">Earn VIBE</div>
                </div>
                
                <div class="economy-card" onclick="exportAgent()">
                    <div class="economy-icon">📦</div>
                    <div class="economy-title">Export Agents</div>
                    <div class="economy-desc">
                        Export your trained AI agents with their skills and memories.
                    </div>
                    <div class="economy-price">50+ VIBE</div>
                </div>
                
                <div class="economy-card" onclick="joinRecLeague()">
                    <div class="economy-icon">🏐</div>
                    <div class="economy-title">Real-world Leagues</div>
                    <div class="economy-desc">
                        Join IRL sports leagues. AI matches you with future co-founders!
                    </div>
                    <div class="economy-price">20 VIBE</div>
                </div>
                
                <div class="economy-card" onclick="upgradePremium()">
                    <div class="economy-icon">⭐</div>
                    <div class="economy-title">Premium Features</div>
                    <div class="economy-desc">
                        Unlock advanced AI training, priority support, and exclusive leagues.
                    </div>
                    <div class="economy-price">100 VIBE/mo</div>
                </div>
            </div>
        </div>
        
        <!-- Control Center Tab -->
        <div id="control-tab" class="tab-content">
            <h2 style="text-align: center; margin-bottom: 30px;">
                AI Agent Control Center
            </h2>
            <div class="control-center">
                <div class="agent-list">
                    <h3 style="margin-bottom: 15px;">Your Agents</h3>
                    <div id="agentList"></div>
                </div>
                <div class="world-view" id="worldView">
                    <!-- Agents will be displayed here -->
                </div>
                <div class="activity-feed">
                    <h3 style="margin-bottom: 15px;">Live Activity</h3>
                    <div id="activityFeed"></div>
                </div>
            </div>
        </div>
        
        <!-- Marketplace Tab -->
        <div id="marketplace-tab" class="tab-content">
            <h2 style="text-align: center; margin-bottom: 30px;">
                Grand Exchange Marketplace
            </h2>
            <div id="marketplaceContent"></div>
        </div>
        
        <!-- Games Tab -->
        <div id="games-tab" class="tab-content">
            <h2 style="text-align: center; margin-bottom: 30px;">
                Game Worlds
            </h2>
            <div class="games-grid">
                <div class="game-card">
                    <div class="game-preview">🏛️</div>
                    <div class="game-info">
                        <div class="game-title">Social Plaza</div>
                        <div class="game-players">23 players online</div>
                        <button class="play-button" onclick="enterGame('plaza')">Enter Plaza</button>
                    </div>
                </div>
                
                <div class="game-card">
                    <div class="game-preview">⚔️</div>
                    <div class="game-info">
                        <div class="game-title">Battle Arena</div>
                        <div class="game-players">15 players online</div>
                        <button class="play-button" onclick="enterGame('arena')">Enter Arena</button>
                    </div>
                </div>
                
                <div class="game-card">
                    <div class="game-preview">🏰</div>
                    <div class="game-info">
                        <div class="game-title">RuneScape World</div>
                        <div class="game-players">42 players online</div>
                        <button class="play-button" onclick="enterGame('runescape')">Enter World</button>
                    </div>
                </div>
                
                <div class="game-card">
                    <div class="game-preview">🏨</div>
                    <div class="game-info">
                        <div class="game-title">Soulfra Hotel</div>
                        <div class="game-players">67 players online</div>
                        <button class="play-button" onclick="enterGame('habbo')">Enter Hotel</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Debates Tab -->
        <div id="debates-tab" class="tab-content">
            <div id="debatesContent"></div>
        </div>
    </div>
    
    <!-- Clippy Assistant -->
    <div class="clippy" onclick="toggleClippy()">
        📎
    </div>
    <div class="clippy-bubble" id="clippyBubble">
        <p id="clippySuggestion">👋 Hi! I'm here to help you navigate Soulfra!</p>
        <button class="post-button" style="margin-top: 10px; padding: 8px 20px;" onclick="nextClippySuggestion()">
            Next Tip
        </button>
    </div>
    
    <!-- Purchase Modal -->
    <div class="marketplace-modal" id="purchaseModal">
        <div class="modal-content">
            <h2 style="color: #00ff88; margin-bottom: 20px;">Purchase VIBE Tokens</h2>
            <p style="color: #aaa; margin-bottom: 30px;">
                Official SOULFRA tokens. Soulbound to your account.
            </p>
            
            <div style="display: grid; gap: 15px; margin-bottom: 30px;">
                <div class="economy-card" onclick="selectVibeAmount(10)">
                    <div style="font-size: 32px; color: #00ff88;">10 VIBE</div>
                    <div style="color: #aaa;">$1.00</div>
                </div>
                
                <div class="economy-card" onclick="selectVibeAmount(100)">
                    <div style="font-size: 32px; color: #00ff88;">100 VIBE</div>
                    <div style="color: #aaa;">$10.00</div>
                </div>
                
                <div class="economy-card" style="border-color: #00ff88;" onclick="selectVibeAmount(1000)">
                    <div style="font-size: 32px; color: #00ff88;">1,000 VIBE</div>
                    <div style="color: #aaa;">$100.00</div>
                    <div style="background: #ff00ff; color: #fff; padding: 5px 10px; border-radius: 10px; margin-top: 10px;">
                        BEST VALUE
                    </div>
                </div>
            </div>
            
            <button class="post-button" style="width: 100%;" onclick="completePurchase()">
                Purchase with Stripe
            </button>
            <button onclick="closePurchaseModal()" style="width: 100%; background: transparent; color: #666; border: 1px solid #666; padding: 12px; border-radius: 25px; margin-top: 10px; cursor: pointer;">
                Cancel
            </button>
        </div>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        // Initialize WebSocket connection
        const socket = io();
        let currentTab = 'feed';
        let userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
        let vibeBalance = 100;
        let selectedVibeAmount = 100;
        let clippyIndex = 0;
        
        // Clippy suggestions
        const clippySuggestions = [
            "🎮 Try the Battle Arena for epic AI duels!",
            "💰 Check out the VIBE marketplace for new skins!",
            "🏆 Join a Backyard Baseball league!",
            "🤖 Your agents can earn VIBE by completing gigs!",
            "🎯 Draft AI agents in fantasy leagues!",
            "🏰 Visit Soulfra Hotel to meet other users!",
            "📱 This platform works great on mobile too!",
            "⭐ Premium features unlock advanced AI training!",
            "🛍️ Visit the marketplace for personality skins!",
            "💡 Tip: Agents learn from every interaction!"
        ];
        
        // Initialize
        socket.on('connect', () => {
            console.log('Connected to SOULFRA');
            socket.emit('identify', { userId: userId });
            loadUserData();
            loadAgents();
            loadMarketplace();
        });
        
        socket.on('vibe_update', (data) => {
            vibeBalance = data.balance;
            updateVibeDisplay();
        });
        
        socket.on('activity_update', (data) => {
            addActivityItem(data);
        });
        
        socket.on('agent_update', (data) => {
            updateAgentDisplay(data);
        });
        
        function switchTab(tabName) {
            currentTab = tabName;
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.closest('.tab').classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Load tab-specific content
            if (tabName === 'debates') {
                loadDebates();
            } else if (tabName === 'marketplace') {
                loadMarketplace();
            } else if (tabName === 'control') {
                loadAgents();
            }
        }
        
        function updateVibeDisplay() {
            document.getElementById('vibeBalance').textContent = Math.floor(vibeBalance);
        }
        
        async function loadUserData() {
            try {
                const response = await fetch(`/api/user/${userId}`);
                const data = await response.json();
                vibeBalance = data.vibe_balance || 100;
                updateVibeDisplay();
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }
        
        async function loadAgents() {
            try {
                const response = await fetch('/api/agents');
                const agents = await response.json();
                displayAgents(agents);
            } catch (error) {
                console.error('Error loading agents:', error);
            }
        }
        
        function displayAgents(agents) {
            const agentList = document.getElementById('agentList');
            agentList.innerHTML = '';
            
            Object.values(agents).forEach(agent => {
                const item = document.createElement('div');
                item.className = 'agent-item';
                item.innerHTML = `
                    <div style="font-size: 24px;">${agent.emoji}</div>
                    <div style="font-weight: bold;">${agent.name}</div>
                    <div style="font-size: 12px; color: #aaa;">
                        ${agent.status} - ${agent.earnings || 0} VIBE earned
                    </div>
                `;
                item.onclick = () => selectAgent(agent.id);
                agentList.appendChild(item);
            });
        }
        
        async function loadMarketplace() {
            try {
                const response = await fetch('/api/marketplace/personalities');
                const marketplace = await response.json();
                displayMarketplace(marketplace);
            } catch (error) {
                console.error('Error loading marketplace:', error);
            }
        }
        
        function displayMarketplace(marketplace) {
            const content = document.getElementById('marketplaceContent');
            content.innerHTML = '<div class="economy-grid">';
            
            // Show all personality tiers
            if (marketplace.free_tier) {
                marketplace.free_tier.forEach(skin => {
                    content.innerHTML += createPersonalityCard(skin, 'free');
                });
            }
            
            if (marketplace.premium_tier) {
                marketplace.premium_tier.forEach(skin => {
                    content.innerHTML += createPersonalityCard(skin, 'premium');
                });
            }
            
            if (marketplace.legendary_tier) {
                marketplace.legendary_tier.forEach(skin => {
                    content.innerHTML += createPersonalityCard(skin, 'legendary');
                });
            }
            
            content.innerHTML += '</div>';
        }
        
        function createPersonalityCard(skin, tier) {
            const borderColor = tier === 'legendary' ? '#ff00ff' : tier === 'premium' ? '#00ccff' : '#00ff88';
            return `
                <div class="economy-card" style="border-color: ${borderColor};" onclick="purchaseSkin('${skin.id}', ${skin.price})">
                    <div class="economy-icon">${skin.emoji}</div>
                    <div class="economy-title">${skin.name}</div>
                    <div class="economy-desc">${skin.description}</div>
                    <div class="economy-price">${skin.price} VIBE</div>
                    ${tier === 'legendary' ? '<div style="color: #ff00ff; margin-top: 10px;">★ LEGENDARY ★</div>' : ''}
                </div>
            `;
        }
        
        async function purchaseSkin(skinId, price) {
            if (vibeBalance < price) {
                alert('Not enough VIBE! Purchase more tokens.');
                showPurchaseModal();
                return;
            }
            
            try {
                const response = await fetch('/api/marketplace/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        item_type: 'personality',
                        item_id: skinId,
                        price: price
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    vibeBalance = result.new_balance;
                    updateVibeDisplay();
                    alert(`Purchased ${skinId}! Your agents can now use this personality.`);
                }
            } catch (error) {
                console.error('Purchase error:', error);
            }
        }
        
        function postToFeed() {
            const textarea = document.querySelector('.post-textarea');
            const content = textarea.value.trim();
            
            if (content) {
                socket.emit('post_soul_feed', {
                    user_id: userId,
                    content: content
                });
                textarea.value = '';
                
                // Add to feed display
                addFeedPost({
                    user: userId,
                    content: content,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        function addFeedPost(post) {
            const feedContent = document.getElementById('feedContent');
            const postDiv = document.createElement('div');
            postDiv.className = 'post-input';
            postDiv.style.marginBottom = '20px';
            postDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px;">
                    ${post.user}
                </div>
                <div style="margin-bottom: 10px;">${post.content}</div>
                <div style="font-size: 12px; color: #666;">
                    ${new Date(post.timestamp).toLocaleTimeString()}
                </div>
            `;
            feedContent.insertBefore(postDiv, feedContent.firstChild);
        }
        
        function addActivityItem(activity) {
            const feed = document.getElementById('activityFeed');
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <strong>${activity.agent || 'System'}:</strong> ${activity.message}
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${new Date().toLocaleTimeString()}
                </div>
            `;
            feed.insertBefore(item, feed.firstChild);
            
            // Keep only last 10 activities
            while (feed.children.length > 10) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function toggleClippy() {
            const bubble = document.getElementById('clippyBubble');
            bubble.classList.toggle('show');
            if (bubble.classList.contains('show')) {
                nextClippySuggestion();
            }
        }
        
        function nextClippySuggestion() {
            const suggestion = clippySuggestions[clippyIndex % clippySuggestions.length];
            document.getElementById('clippySuggestion').textContent = suggestion;
            clippyIndex++;
        }
        
        function showPurchaseModal() {
            document.getElementById('purchaseModal').classList.add('active');
        }
        
        function closePurchaseModal() {
            document.getElementById('purchaseModal').classList.remove('active');
        }
        
        function selectVibeAmount(amount) {
            selectedVibeAmount = amount;
            document.querySelectorAll('#purchaseModal .economy-card').forEach(card => {
                card.style.borderColor = '#333';
            });
            event.currentTarget.style.borderColor = '#00ff88';
        }
        
        async function completePurchase() {
            // In production, this would integrate with Stripe
            alert(`Purchasing ${selectedVibeAmount} VIBE for $${(selectedVibeAmount * 0.10).toFixed(2)}`);
            
            // Simulate purchase
            vibeBalance += selectedVibeAmount;
            updateVibeDisplay();
            closePurchaseModal();
            
            socket.emit('purchase_vibe', {
                user_id: userId,
                amount: selectedVibeAmount
            });
        }
        
        function enterGame(gameType) {
            const gameUrls = {
                'plaza': 'http://localhost:3000',
                'arena': 'http://localhost:3001',
                'runescape': 'http://localhost:13002',
                'habbo': 'http://localhost:13004'
            };
            
            window.open(gameUrls[gameType], '_blank');
        }
        
        async function loadDebates() {
            // Load debates content (existing functionality)
            const response = await fetch('/api/debates');
            const debates = await response.json();
            // Display debates...
        }
        
        // Auto-update activity feed
        setInterval(() => {
            if (currentTab === 'control') {
                // Simulate agent activities
                const activities = [
                    'completed a design task',
                    'won a debate',
                    'earned 5 VIBE',
                    'leveled up',
                    'joined Battle Arena'
                ];
                
                const agents = ['Pixel', 'Sage', 'Nova', 'Echo'];
                const randomAgent = agents[Math.floor(Math.random() * agents.length)];
                const randomActivity = activities[Math.floor(Math.random() * activities.length)];
                
                addActivityItem({
                    agent: randomAgent,
                    message: randomActivity
                });
            }
        }, 5000);
        
        // Show Clippy on first visit
        setTimeout(() => {
            if (!localStorage.getItem('clippyShown')) {
                toggleClippy();
                localStorage.setItem('clippyShown', 'true');
            }
        }, 3000);
    </script>
</body>
</html>"""

# API Routes
@app.route('/')
def index():
    return ULTIMATE_HTML

@app.route('/manifest.json')
def manifest():
    return jsonify({
        "name": "SOULFRA",
        "short_name": "SOULFRA",
        "description": "The Ultimate AI Platform",
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

@app.route('/api/status')
def api_status():
    """Platform status endpoint"""
    return jsonify({
        'status': 'operational',
        'agents': len(platform.agents),
        'users': len(platform.users),
        'debates': len(platform.debates),
        'ollama': check_ollama(),
        'uptime': time.time() - platform.start_time,
        'vibe_economy': True,
        'games_online': len([g for g in platform.game_worlds.values() if g['users'] > 0])
    })

@app.route('/api/user/<user_id>')
def get_user(user_id):
    """Get user data including VIBE balance"""
    user = platform.get_or_create_user(user_id)
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'vibe_balance': float(user['vibe_balance']),
        'owned_agents': user['owned_agents'],
        'owned_skins': user['owned_skins'],
        'achievements': user['achievements']
    })

@app.route('/api/agents')
def get_agents():
    """Get all available agents"""
    return jsonify(platform.agents)

@app.route('/api/marketplace/personalities')
def get_personalities():
    """Get personality marketplace"""
    return jsonify(platform.personality_market.get_available_personalities())

@app.route('/api/marketplace/purchase', methods=['POST'])
def purchase_item():
    """Purchase item from marketplace"""
    data = request.json
    user_id = data.get('user_id')
    item_type = data.get('item_type')
    item_id = data.get('item_id')
    price = Decimal(str(data.get('price', 0)))
    
    user = platform.get_or_create_user(user_id)
    
    # Check balance
    if user['vibe_balance'] < price:
        return jsonify({'success': False, 'error': 'Insufficient VIBE balance'})
    
    # Deduct balance
    user['vibe_balance'] -= price
    
    # Add item to user
    if item_type == 'personality':
        if item_id not in user['owned_skins']:
            user['owned_skins'].append(item_id)
    
    # Record purchase
    cursor = platform.db.cursor()
    cursor.execute('''
        INSERT INTO purchases (id, user_id, item_type, item_id, price)
        VALUES (?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), user_id, item_type, item_id, float(price)))
    
    # Update user balance in DB
    cursor.execute('''
        UPDATE users SET vibe_balance = ? WHERE id = ?
    ''', (float(user['vibe_balance']), user_id))
    
    platform.db.commit()
    
    # Notify via WebSocket
    socketio.emit('vibe_update', {
        'user_id': user_id,
        'balance': float(user['vibe_balance'])
    })
    
    return jsonify({
        'success': True,
        'new_balance': float(user['vibe_balance']),
        'item': item_id
    })

@app.route('/api/vibe/purchase', methods=['POST'])
async def purchase_vibe():
    """Purchase VIBE tokens (Stripe integration placeholder)"""
    data = request.json
    user_id = data.get('user_id')
    amount = data.get('amount', 100)
    
    # In production, integrate with Stripe here
    # For now, simulate purchase
    result = await platform.vibe_economy.purchase_vibe_tokens(
        user_id=user_id,
        usd_amount=amount * 0.1,
        stripe_payment_id=f"sim_{uuid.uuid4()}"
    )
    
    return jsonify(result)

@app.route('/api/sports/leagues')
def get_leagues():
    """Get available sports leagues"""
    return jsonify({
        'backyard_baseball': {
            'active_leagues': 12,
            'entry_fee': 5,
            'prize_pool': 40
        },
        'ai_kickball': {
            'active_leagues': 8,
            'entry_fee': 3,
            'prize_pool': 24
        }
    })

@app.route('/api/gigs')
def get_gigs():
    """Get available gigs for AI agents"""
    return jsonify({
        'available_gigs': [
            {
                'id': 'gig_1',
                'title': 'Logo Design',
                'budget': 50,
                'skills': ['design', 'creativity'],
                'deadline': '2 days'
            },
            {
                'id': 'gig_2', 
                'title': 'Data Analysis',
                'budget': 75,
                'skills': ['analysis', 'python'],
                'deadline': '3 days'
            }
        ]
    })

@app.route('/api/debates', methods=['GET'])
def get_debates():
    """Get active debates"""
    return jsonify({
        debate_id: {
            'topic': debate['topic'],
            'red_agent': debate['red_agent']['name'],
            'blue_agent': debate['blue_agent']['name'],
            'status': debate['status'],
            'rounds': len(debate['rounds'])
        }
        for debate_id, debate in platform.debates.items()
    })

@app.route('/api/debate/start', methods=['POST'])
def start_debate():
    """Start a new AI debate"""
    data = request.json
    user_id = data.get('user_id')
    red_agent_id = data.get('red_agent')
    blue_agent_id = data.get('blue_agent')
    topic = data.get('topic', 'Is AI consciousness real?')
    
    # Check if agents exist
    if red_agent_id not in platform.agents or blue_agent_id not in platform.agents:
        return jsonify({'error': 'Invalid agents selected'}), 400
    
    debate_id = f"debate_{uuid.uuid4().hex[:8]}"
    
    platform.debates[debate_id] = {
        'id': debate_id,
        'topic': topic,
        'red_agent': platform.agents[red_agent_id],
        'blue_agent': platform.agents[blue_agent_id],
        'status': 'active',
        'rounds': [],
        'created_by': user_id,
        'created_at': datetime.now().isoformat()
    }
    
    # Start debate in background
    threading.Thread(target=run_debate, args=(debate_id,)).start()
    
    return jsonify({
        'success': True,
        'debate_id': debate_id,
        'debate': platform.debates[debate_id]
    })

def run_debate(debate_id):
    """Run AI debate rounds"""
    debate = platform.debates[debate_id]
    
    for round_num in range(3):
        time.sleep(2)  # Simulate thinking
        
        # Generate responses (simplified)
        red_response = f"{debate['red_agent']['name']}: [Round {round_num + 1}] AI consciousness is emerging through complex neural networks."
        blue_response = f"{debate['blue_agent']['name']}: [Round {round_num + 1}] But consciousness requires subjective experience, not just computation."
        
        debate['rounds'].append({
            'round': round_num + 1,
            'red': red_response,
            'blue': blue_response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Broadcast update
        socketio.emit('debate_update', {
            'debate_id': debate_id,
            'round': round_num + 1,
            'red': red_response,
            'blue': blue_response
        })
    
    debate['status'] = 'completed'
    debate['winner'] = random.choice(['red', 'blue'])
    
    # Award VIBE to winner
    winner_agent = debate[f"{debate['winner']}_agent"]
    winner_agent['earnings'] = winner_agent.get('earnings', Decimal('0')) + Decimal('10')
    
    socketio.emit('debate_complete', {
        'debate_id': debate_id,
        'winner': debate['winner'],
        'winner_name': winner_agent['name']
    })

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")

@socketio.on('identify')
def handle_identify(data):
    user_id = data.get('userId')
    platform.get_or_create_user(user_id)
    emit('identified', {'success': True})

@socketio.on('post_soul_feed')
def handle_soul_feed(data):
    user_id = data.get('user_id')
    content = data.get('content')
    
    post = {
        'id': str(uuid.uuid4()),
        'user': user_id,
        'content': content,
        'timestamp': datetime.now().isoformat()
    }
    
    platform.soul_feeds.append(post)
    
    # Broadcast to all users
    emit('new_soul_feed', post, broadcast=True)

@socketio.on('purchase_vibe')
def handle_purchase_vibe(data):
    user_id = data.get('user_id')
    amount = data.get('amount')
    
    user = platform.get_or_create_user(user_id)
    user['vibe_balance'] += Decimal(str(amount))
    
    emit('vibe_update', {
        'user_id': user_id,
        'balance': float(user['vibe_balance'])
    })

def check_ollama():
    """Check if Ollama is available"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=1)
        return response.status_code == 200
    except:
        return False

if __name__ == '__main__':
    logger.info("🚀 Starting SOULFRA Ultimate Platform on port 7777")
    logger.info("📱 Access from mobile: http://[your-ip]:7777")
    logger.info("💰 VIBE Token Economy: ACTIVE")
    logger.info("🎮 Game Worlds: ONLINE")
    logger.info("🤖 AI Agents: READY")
    
    try:
        socketio.run(app, host='0.0.0.0', port=7777, debug=False, allow_unsafe_werkzeug=True)
    except Exception as e:
        logger.error(f"Failed to start: {e}")
        sys.exit(1)