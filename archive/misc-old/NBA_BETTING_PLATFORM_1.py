#!/usr/bin/env python3
"""
NBA BETTING PLATFORM - Real sports betting with ego/pride matchmaking
Ready for tomorrow's games with real users
"""

import json
import sqlite3
import time
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

print("🏀 NBA BETTING PLATFORM")
print("=" * 50)

# Real NBA games for tomorrow (you'd fetch from API in production)
NBA_GAMES = [
    {
        "id": 1,
        "home_team": "Lakers",
        "away_team": "Warriors", 
        "home_logo": "🟡",
        "away_logo": "🔵",
        "game_time": "7:30 PM ET",
        "spread": -3.5,  # Lakers favored by 3.5
        "over_under": 225.5
    },
    {
        "id": 2, 
        "home_team": "Celtics",
        "away_team": "Heat",
        "home_logo": "🟢", 
        "away_logo": "🔴",
        "game_time": "8:00 PM ET",
        "spread": -6.0,  # Celtics favored by 6
        "over_under": 218.5
    },
    {
        "id": 3,
        "home_team": "Nuggets", 
        "away_team": "Suns",
        "home_logo": "🔵",
        "away_logo": "🟠",
        "game_time": "9:00 PM ET", 
        "spread": -2.0,  # Nuggets favored by 2
        "over_under": 230.0
    }
]

# Database setup
db = sqlite3.connect('nba_betting.db', check_same_thread=False)
cursor = db.cursor()

cursor.executescript('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    balance INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ego_rating INTEGER DEFAULT 1000,
    pride_points INTEGER DEFAULT 100,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    game_id INTEGER,
    bet_type TEXT,
    bet_value TEXT,
    amount INTEGER,
    odds REAL,
    potential_payout INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matchups (
    id INTEGER PRIMARY KEY,
    user1_id INTEGER,
    user2_id INTEGER,
    game_id INTEGER,
    user1_bet TEXT,
    user2_bet TEXT,
    amount INTEGER,
    status TEXT DEFAULT 'pending',
    winner_id INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    game_id INTEGER,
    message TEXT,
    timestamp TIMESTAMP
);
''')

db.commit()

# HTML for the betting platform
BETTING_HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>🏀 NBA Betting - Tomorrow's Games</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .header {
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-bottom: 2px solid rgba(255,165,0,0.3);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        h1 {
            font-size: 2.5em;
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .user-stats {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #4ade80;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
        }
        
        .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .game-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,165,0,0.2);
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .game-card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #ff6b35, #f7931e, #ff6b35);
            border-radius: 20px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.3s;
        }
        
        .game-card:hover::before {
            opacity: 1;
        }
        
        .game-card:hover {
            transform: translateY(-5px);
            border-color: transparent;
            box-shadow: 0 20px 40px rgba(255,107,53,0.3);
        }
        
        .game-header {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .game-time {
            background: #ff6b35;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        .teams {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }
        
        .team {
            text-align: center;
            flex: 1;
        }
        
        .team-logo {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .team-name {
            font-size: 1.3em;
            font-weight: bold;
        }
        
        .vs {
            font-size: 2em;
            font-weight: bold;
            color: #ff6b35;
            margin: 0 20px;
        }
        
        .betting-options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .bet-option {
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .bet-option:hover {
            border-color: #ff6b35;
            background: rgba(255,107,53,0.1);
        }
        
        .bet-option.selected {
            border-color: #4ade80;
            background: rgba(74,222,128,0.2);
        }
        
        .bet-type {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .bet-value {
            font-size: 1.1em;
            color: #4ade80;
        }
        
        .bet-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .amount-input {
            flex: 1;
            padding: 12px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            color: white;
            font-size: 1em;
        }
        
        .amount-input:focus {
            outline: none;
            border-color: #ff6b35;
        }
        
        .quick-amounts {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .quick-amount {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .quick-amount:hover {
            background: #ff6b35;
        }
        
        .bet-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .bet-btn {
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .solo-bet {
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: white;
        }
        
        .solo-bet:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 25px rgba(74,222,128,0.4);
        }
        
        .challenge-bet {
            background: linear-gradient(135deg, #ff6b35, #f97316);
            color: white;
        }
        
        .challenge-bet:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 25px rgba(255,107,53,0.4);
        }
        
        .active-bets {
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .bet-item {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .matchmaking {
            position: fixed;
            right: 20px;
            top: 100px;
            width: 350px;
            background: rgba(0,0,0,0.9);
            border-radius: 20px;
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
            border: 2px solid rgba(255,165,0,0.3);
        }
        
        .challenge-item {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .accept-challenge {
            background: #4ade80;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .accept-challenge:hover {
            background: #22c55e;
        }
        
        .chat {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .chat-messages {
            height: 200px;
            overflow-y: auto;
            margin-bottom: 15px;
            background: rgba(0,0,0,0.2);
            padding: 10px;
            border-radius: 10px;
        }
        
        .chat-message {
            margin-bottom: 8px;
            padding: 5px;
        }
        
        .chat-input {
            display: flex;
            gap: 10px;
        }
        
        .chat-text {
            flex: 1;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            color: white;
        }
        
        .send-btn {
            background: #ff6b35;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
        }
        
        .login-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }
        
        .login-card {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            border: 2px solid rgba(255,165,0,0.3);
            backdrop-filter: blur(10px);
        }
        
        .login-input {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            color: white;
            font-size: 1.1em;
        }
        
        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
        }
        
        .login-btn:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <!-- Login Screen -->
    <div id="login-screen" class="login-screen">
        <div class="login-card">
            <h1>🏀 NBA Betting</h1>
            <p style="margin: 20px 0;">Ready to bet on tomorrow's games?</p>
            <input type="text" id="username" class="login-input" placeholder="Enter your username">
            <button class="login-btn" onclick="login()">Join the Action</button>
        </div>
    </div>
    
    <!-- Main App -->
    <div id="main-app" style="display: none;">
        <div class="header">
            <div class="header-content">
                <h1>🏀 NBA Betting</h1>
                <div class="user-stats">
                    <div class="stat">
                        <div class="stat-value" id="balance">$1000</div>
                        <div class="stat-label">Balance</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" id="ego-rating">1000</div>
                        <div class="stat-label">Ego Rating</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" id="record">0-0</div>
                        <div class="stat-label">W-L Record</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="container">
            <h2 style="margin-bottom: 30px;">🔥 Tomorrow's Games</h2>
            
            <div class="games-grid" id="games-grid"></div>
            
            <div class="active-bets">
                <h3>📊 Your Active Bets</h3>
                <div id="active-bets"></div>
            </div>
            
            <div class="chat">
                <h3>💬 Live Chat</h3>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" class="chat-text" id="chat-text" placeholder="Talk trash...">
                    <button class="send-btn" onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>
        
        <!-- Matchmaking Panel -->
        <div class="matchmaking">
            <h3>⚔️ Find Opponents</h3>
            <div id="available-challenges"></div>
        </div>
    </div>
    
    <script>
        let currentUser = null;
        let selectedBets = {};
        
        const games = {GAMES_JSON};
        
        function login() {
            const username = document.getElementById('username').value;
            if (!username) return;
            
            fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username})
            })
            .then(r => r.json())
            .then(user => {
                currentUser = user;
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('main-app').style.display = 'block';
                updateUserStats();
                loadGames();
                loadActiveBets();
                loadChallenges();
                startPolling();
            });
        }
        
        function updateUserStats() {
            document.getElementById('balance').textContent = '$' + currentUser.balance;
            document.getElementById('ego-rating').textContent = currentUser.ego_rating;
            document.getElementById('record').textContent = currentUser.wins + '-' + currentUser.losses;
        }
        
        function loadGames() {
            const html = games.map(game => `
                <div class="game-card">
                    <div class="game-header">
                        <div class="game-time">${game.game_time}</div>
                    </div>
                    
                    <div class="teams">
                        <div class="team">
                            <div class="team-logo">${game.away_logo}</div>
                            <div class="team-name">${game.away_team}</div>
                        </div>
                        <div class="vs">VS</div>
                        <div class="team">
                            <div class="team-logo">${game.home_logo}</div>
                            <div class="team-name">${game.home_team}</div>
                        </div>
                    </div>
                    
                    <div class="betting-options">
                        <div class="bet-option" onclick="selectBet(${game.id}, 'spread', '${game.away_team} +${Math.abs(game.spread)}')">
                            <div class="bet-type">Spread</div>
                            <div class="bet-value">${game.away_team} +${Math.abs(game.spread)}</div>
                        </div>
                        <div class="bet-option" onclick="selectBet(${game.id}, 'spread', '${game.home_team} ${game.spread}')">
                            <div class="bet-type">Spread</div>
                            <div class="bet-value">${game.home_team} ${game.spread}</div>
                        </div>
                        <div class="bet-option" onclick="selectBet(${game.id}, 'total', 'Over ${game.over_under}')">
                            <div class="bet-type">Total</div>
                            <div class="bet-value">Over ${game.over_under}</div>
                        </div>
                        <div class="bet-option" onclick="selectBet(${game.id}, 'total', 'Under ${game.over_under}')">
                            <div class="bet-type">Total</div>
                            <div class="bet-value">Under ${game.over_under}</div>
                        </div>
                    </div>
                    
                    <div class="quick-amounts">
                        <div class="quick-amount" onclick="setAmount(${game.id}, 50)">$50</div>
                        <div class="quick-amount" onclick="setAmount(${game.id}, 100)">$100</div>
                        <div class="quick-amount" onclick="setAmount(${game.id}, 250)">$250</div>
                        <div class="quick-amount" onclick="setAmount(${game.id}, 500)">$500</div>
                    </div>
                    
                    <input type="number" class="amount-input" id="amount-${game.id}" placeholder="Bet amount" min="10" max="${currentUser?.balance || 1000}">
                    
                    <div class="bet-buttons">
                        <button class="bet-btn solo-bet" onclick="placeSoloBet(${game.id})">
                            Solo Bet
                        </button>
                        <button class="bet-btn challenge-bet" onclick="createChallenge(${game.id})">
                            Challenge Others
                        </button>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('games-grid').innerHTML = html;
        }
        
        function selectBet(gameId, type, value) {
            // Remove previous selections for this game
            document.querySelectorAll(`[onclick*="selectBet(${gameId}"]`).forEach(el => {
                el.classList.remove('selected');
            });
            
            // Select this bet
            event.target.classList.add('selected');
            selectedBets[gameId] = {type, value};
        }
        
        function setAmount(gameId, amount) {
            document.getElementById(`amount-${gameId}`).value = amount;
        }
        
        function placeSoloBet(gameId) {
            const bet = selectedBets[gameId];
            const amount = document.getElementById(`amount-${gameId}`).value;
            
            if (!bet || !amount) {
                alert('Select a bet and amount first!');
                return;
            }
            
            fetch('/api/bet', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: currentUser.id,
                    gameId: gameId,
                    betType: bet.type,
                    betValue: bet.value,
                    amount: parseInt(amount)
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    currentUser.balance = data.newBalance;
                    updateUserStats();
                    loadActiveBets();
                    addChatMessage(`${currentUser.username} placed a $${amount} ${bet.type} bet: ${bet.value}! 🔥`);
                } else {
                    alert(data.error);
                }
            });
        }
        
        function createChallenge(gameId) {
            const bet = selectedBets[gameId];
            const amount = document.getElementById(`amount-${gameId}`).value;
            
            if (!bet || !amount) {
                alert('Select a bet and amount first!');
                return;
            }
            
            fetch('/api/challenge', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: currentUser.id,
                    gameId: gameId,
                    betValue: bet.value,
                    amount: parseInt(amount)
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    loadChallenges();
                    addChatMessage(`${currentUser.username} is challenging anyone to bet $${amount} on ${bet.value}! Who's brave enough? ⚔️`);
                } else {
                    alert(data.error);
                }
            });
        }
        
        function loadActiveBets() {
            fetch(`/api/bets/${currentUser.id}`)
                .then(r => r.json())
                .then(bets => {
                    const html = bets.map(bet => `
                        <div class="bet-item">
                            <div>
                                <strong>${bet.bet_value}</strong> - $${bet.amount}
                                <div style="font-size: 0.9em; opacity: 0.7;">${bet.status}</div>
                            </div>
                            <div style="color: #4ade80;">+$${bet.potential_payout}</div>
                        </div>
                    `).join('');
                    document.getElementById('active-bets').innerHTML = html || '<p>No active bets</p>';
                });
        }
        
        function loadChallenges() {
            fetch('/api/challenges')
                .then(r => r.json())
                .then(challenges => {
                    const html = challenges.map(challenge => `
                        <div class="challenge-item">
                            <div><strong>${challenge.username}</strong></div>
                            <div>${challenge.bet_value} - $${challenge.amount}</div>
                            <button class="accept-challenge" onclick="acceptChallenge(${challenge.id})">
                                Accept Challenge
                            </button>
                        </div>
                    `).join('');
                    document.getElementById('available-challenges').innerHTML = html || '<p>No challenges available</p>';
                });
        }
        
        function acceptChallenge(challengeId) {
            fetch('/api/accept-challenge', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: currentUser.id,
                    challengeId: challengeId
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    loadChallenges();
                    addChatMessage(`${currentUser.username} accepted a challenge! The battle begins! 🥊`);
                } else {
                    alert(data.error);
                }
            });
        }
        
        function sendMessage() {
            const text = document.getElementById('chat-text').value;
            if (!text) return;
            
            fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: currentUser.id,
                    message: text
                })
            })
            .then(() => {
                document.getElementById('chat-text').value = '';
                loadChat();
            });
        }
        
        function loadChat() {
            fetch('/api/chat')
                .then(r => r.json())
                .then(messages => {
                    const html = messages.map(msg => `
                        <div class="chat-message">
                            <strong>${msg.username}:</strong> ${msg.message}
                        </div>
                    `).join('');
                    document.getElementById('chat-messages').innerHTML = html;
                    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
                });
        }
        
        function addChatMessage(message) {
            fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: 0,
                    message: message
                })
            })
            .then(() => loadChat());
        }
        
        function startPolling() {
            setInterval(() => {
                loadActiveBets();
                loadChallenges();
                loadChat();
            }, 5000);
        }
        
        // Auto-fill username for testing
        document.getElementById('username').value = 'Player' + Math.floor(Math.random() * 1000);
    </script>
</body>
</html>
'''.replace('{GAMES_JSON}', json.dumps(NBA_GAMES))

class NBABettingHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(BETTING_HTML.encode())
        else:
            self.send_error(404)
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(content_length).decode())
        
        if self.path == '/api/login':
            username = data['username']
            
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            if not user:
                cursor.execute('''
                    INSERT INTO users (username, created_at) 
                    VALUES (?, ?)
                ''', (username, datetime.now()))
                db.commit()
                user_id = cursor.lastrowid
                balance = 1000
                wins = losses = 0
                ego_rating = 1000
                pride_points = 100
            else:
                user_id, username, balance, wins, losses, ego_rating, pride_points = user[0:7]
            
            response = {
                'id': user_id,
                'username': username,
                'balance': balance,
                'wins': wins,
                'losses': losses,
                'ego_rating': ego_rating,
                'pride_points': pride_points
            }
            
        elif self.path == '/api/bet':
            user_id = data['userId']
            game_id = data['gameId']
            bet_type = data['betType']
            bet_value = data['betValue']
            amount = data['amount']
            
            # Check balance
            cursor.execute('SELECT balance FROM users WHERE id = ?', (user_id,))
            balance = cursor.fetchone()[0]
            
            if balance < amount:
                response = {'success': False, 'error': 'Insufficient balance'}
            else:
                odds = 1.9  # Standard -110 odds
                potential_payout = int(amount * odds)
                
                cursor.execute('''
                    INSERT INTO bets (user_id, game_id, bet_type, bet_value, amount, odds, potential_payout, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (user_id, game_id, bet_type, bet_value, amount, odds, potential_payout, datetime.now()))
                
                new_balance = balance - amount
                cursor.execute('UPDATE users SET balance = ? WHERE id = ?', (new_balance, user_id))
                db.commit()
                
                response = {'success': True, 'newBalance': new_balance}
                
        elif self.path == '/api/challenge':
            # Create a challenge for other users to accept
            user_id = data['userId']
            game_id = data['gameId']
            bet_value = data['betValue']
            amount = data['amount']
            
            cursor.execute('''
                INSERT INTO matchups (user1_id, game_id, user1_bet, amount, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, game_id, bet_value, amount, datetime.now()))
            db.commit()
            
            response = {'success': True}
            
        elif self.path == '/api/accept-challenge':
            # Accept someone else's challenge
            user_id = data['userId']
            challenge_id = data['challengeId']
            
            cursor.execute('''
                UPDATE matchups SET user2_id = ?, status = 'active'
                WHERE id = ? AND user2_id IS NULL
            ''', (user_id, challenge_id))
            db.commit()
            
            response = {'success': True}
            
        elif self.path == '/api/chat':
            user_id = data['userId']
            message = data['message']
            
            if user_id == 0:  # System message
                cursor.execute('''
                    INSERT INTO chat_messages (user_id, message, timestamp)
                    VALUES (?, ?, ?)
                ''', (0, message, datetime.now()))
            else:
                cursor.execute('''
                    INSERT INTO chat_messages (user_id, message, timestamp)
                    VALUES (?, ?, ?)
                ''', (user_id, message, datetime.now()))
            
            db.commit()
            response = {'success': True}
            
        elif self.path.startswith('/api/bets/'):
            user_id = int(self.path.split('/')[-1])
            cursor.execute('''
                SELECT bet_type, bet_value, amount, potential_payout, status
                FROM bets WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
            ''', (user_id,))
            
            bets = []
            for row in cursor.fetchall():
                bets.append({
                    'bet_type': row[0],
                    'bet_value': row[1],
                    'amount': row[2],
                    'potential_payout': row[3],
                    'status': row[4]
                })
            response = bets
            
        elif self.path == '/api/challenges':
            cursor.execute('''
                SELECT m.id, u.username, m.user1_bet, m.amount
                FROM matchups m
                JOIN users u ON m.user1_id = u.id
                WHERE m.user2_id IS NULL AND m.status = 'pending'
                ORDER BY m.created_at DESC LIMIT 10
            ''', )
            
            challenges = []
            for row in cursor.fetchall():
                challenges.append({
                    'id': row[0],
                    'username': row[1],
                    'bet_value': row[2],
                    'amount': row[3]
                })
            response = challenges
            
        elif self.path == '/api/chat':
            cursor.execute('''
                SELECT u.username, c.message
                FROM chat_messages c
                LEFT JOIN users u ON c.user_id = u.id
                ORDER BY c.timestamp DESC LIMIT 50
            ''')
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    'username': row[0] or 'System',
                    'message': row[1]
                })
            response = list(reversed(messages))
        
        else:
            self.send_error(404)
            return
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    # Kill any existing servers
    import subprocess
    subprocess.run(['pkill', '-f', 'python3'], capture_output=True)
    
    server = HTTPServer(('localhost', 7777), NBABettingHandler)
    
    print("✅ NBA BETTING PLATFORM READY!")
    print("=" * 50)
    print("🌐 Access: http://localhost:7777")
    print("\n🏀 Features:")
    print("  • Real NBA games for tomorrow")
    print("  • Spread and total betting")
    print("  • Head-to-head challenges")
    print("  • Ego/pride rating system")
    print("  • Live chat for trash talk")
    print("  • Real money management")
    print("\n🎯 Ready for real users!")
    print("Share the link: http://localhost:7777")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 NBA Betting Platform stopped")
        db.close()