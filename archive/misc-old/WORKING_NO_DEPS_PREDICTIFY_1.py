#!/usr/bin/env python3
"""
WORKING PREDICTIFY - No external dependencies needed
This one ACTUALLY works with just Python standard library
"""

import json
import sqlite3
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import random

print("🎯 WORKING PREDICTIFY - NO DEPENDENCIES")
print("=" * 60)

# Database setup
db = sqlite3.connect('predictify_simple.db', check_same_thread=False)
cursor = db.cursor()

# Create tables
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    balance INTEGER DEFAULT 1000
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    yes_pool INTEGER DEFAULT 0,
    no_pool INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    prediction_id INTEGER,
    amount INTEGER,
    choice TEXT
)
''')

db.commit()

# Seed predictions
predictions = [
    ("Bitcoin $100k", "Will Bitcoin hit $100,000 this year?"),
    ("Rain Tomorrow", "Will it rain in NYC tomorrow?"),
    ("AI Takeover", "Will AI pass the Turing test this month?"),
    ("Sports Upset", "Will the underdog win tonight?")
]

for title, desc in predictions:
    cursor.execute('INSERT OR IGNORE INTO predictions (title, description) VALUES (?, ?)', (title, desc))
db.commit()

# Activity feed (in memory for simplicity)
activity_feed = []

def add_activity(message):
    activity_feed.insert(0, {
        'message': message,
        'time': datetime.now().strftime('%H:%M:%S')
    })
    if len(activity_feed) > 20:
        activity_feed.pop()

# HTML Template
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Predictify - Working!</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, sans-serif;
            background: #0f172a;
            color: white;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            padding: 20px;
            text-align: center;
        }
        
        h1 { font-size: 3em; margin-bottom: 10px; }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .user-info {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .balance {
            font-size: 2em;
            color: #10b981;
        }
        
        .predictions {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .pred-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .pred-card:hover {
            border-color: #3b82f6;
            transform: translateY(-5px);
        }
        
        .pred-title {
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        
        .pred-desc {
            opacity: 0.8;
            margin-bottom: 20px;
        }
        
        .pools {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            padding: 10px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
        }
        
        .pool {
            text-align: center;
        }
        
        .pool-label {
            font-size: 0.9em;
            opacity: 0.7;
        }
        
        .pool-value {
            font-size: 1.3em;
            font-weight: bold;
        }
        
        .yes-pool { color: #10b981; }
        .no-pool { color: #ef4444; }
        
        .bet-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .bet-amount {
            flex: 1;
            padding: 10px;
            border: 2px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.1);
            color: white;
            border-radius: 8px;
            font-size: 1em;
        }
        
        .bet-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .bet-btn {
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bet-yes {
            background: #10b981;
            color: white;
        }
        
        .bet-yes:hover {
            background: #059669;
            transform: scale(1.05);
        }
        
        .bet-no {
            background: #ef4444;
            color: white;
        }
        
        .bet-no:hover {
            background: #dc2626;
            transform: scale(1.05);
        }
        
        .activity {
            position: fixed;
            right: 20px;
            top: 100px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            border-radius: 15px;
            padding: 20px;
            max-height: 500px;
            overflow-y: auto;
        }
        
        .activity h3 {
            margin-bottom: 15px;
        }
        
        .activity-item {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 0.9em;
        }
        
        .activity-time {
            opacity: 0.6;
            font-size: 0.8em;
        }
        
        .login {
            max-width: 400px;
            margin: 100px auto;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 15px;
            text-align: center;
        }
        
        .login input {
            width: 100%;
            padding: 15px;
            margin-bottom: 20px;
            border: 2px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.1);
            color: white;
            border-radius: 8px;
            font-size: 1.1em;
        }
        
        .login button {
            width: 100%;
            padding: 15px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
        }
        
        .login button:hover {
            background: #2563eb;
        }
        
        .message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            font-weight: bold;
            z-index: 1000;
        }
        
        .error {
            background: #ef4444;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ Predictify</h1>
        <p>Bet on Reality - Win Real Rewards</p>
    </div>
    
    <div id="login" class="login">
        <h2>Choose Your Username</h2>
        <input type="text" id="username" placeholder="Enter username...">
        <button onclick="login()">Start Playing</button>
    </div>
    
    <div id="app" style="display: none;">
        <div class="container">
            <div class="user-info">
                <div>
                    <h2>Welcome, <span id="user-name"></span>!</h2>
                    <p>Make your predictions count</p>
                </div>
                <div class="balance">
                    Balance: $<span id="balance">1000</span>
                </div>
            </div>
            
            <h2 style="margin-bottom: 20px;">Active Predictions</h2>
            <div class="predictions" id="predictions"></div>
        </div>
        
        <div class="activity">
            <h3>Live Activity</h3>
            <div id="activity-feed"></div>
        </div>
    </div>
    
    <script>
        let currentUser = null;
        
        function login() {
            const username = document.getElementById('username').value;
            if (!username) return;
            
            fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username})
            })
            .then(r => r.json())
            .then(data => {
                currentUser = data;
                document.getElementById('login').style.display = 'none';
                document.getElementById('app').style.display = 'block';
                document.getElementById('user-name').textContent = username;
                document.getElementById('balance').textContent = data.balance;
                loadPredictions();
                loadActivity();
                showMessage('Welcome! You have $1000 to start betting!');
                
                // Poll for updates
                setInterval(loadPredictions, 5000);
                setInterval(loadActivity, 2000);
            });
        }
        
        function loadPredictions() {
            fetch('/api/predictions')
                .then(r => r.json())
                .then(predictions => {
                    const html = predictions.map(p => `
                        <div class="pred-card">
                            <h3 class="pred-title">${p.title}</h3>
                            <p class="pred-desc">${p.description}</p>
                            <div class="pools">
                                <div class="pool">
                                    <div class="pool-label">YES Pool</div>
                                    <div class="pool-value yes-pool">$${p.yes_pool}</div>
                                </div>
                                <div class="pool">
                                    <div class="pool-label">NO Pool</div>
                                    <div class="pool-value no-pool">$${p.no_pool}</div>
                                </div>
                            </div>
                            <div class="bet-controls">
                                <input type="number" class="bet-amount" id="amount-${p.id}" 
                                       placeholder="Amount" min="1" max="${currentUser.balance}">
                            </div>
                            <div class="bet-buttons">
                                <button class="bet-btn bet-yes" onclick="placeBet(${p.id}, 'yes')">
                                    BET YES
                                </button>
                                <button class="bet-btn bet-no" onclick="placeBet(${p.id}, 'no')">
                                    BET NO
                                </button>
                            </div>
                        </div>
                    `).join('');
                    document.getElementById('predictions').innerHTML = html;
                });
        }
        
        function placeBet(predId, choice) {
            const amount = document.getElementById(`amount-${predId}`).value;
            if (!amount || amount <= 0) {
                showMessage('Enter a bet amount!', 'error');
                return;
            }
            
            fetch('/api/bet', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: currentUser.id,
                    predictionId: predId,
                    amount: parseInt(amount),
                    choice
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showMessage(`Bet placed! $${amount} on ${choice.toUpperCase()}`);
                    document.getElementById('balance').textContent = data.newBalance;
                    currentUser.balance = data.newBalance;
                    loadPredictions();
                    document.getElementById(`amount-${predId}`).value = '';
                } else {
                    showMessage(data.error, 'error');
                }
            });
        }
        
        function loadActivity() {
            fetch('/api/activity')
                .then(r => r.json())
                .then(activities => {
                    const html = activities.map(a => `
                        <div class="activity-item">
                            ${a.message}
                            <div class="activity-time">${a.time}</div>
                        </div>
                    `).join('');
                    document.getElementById('activity-feed').innerHTML = html;
                });
        }
        
        function showMessage(text, type = 'success') {
            const msg = document.createElement('div');
            msg.className = 'message ' + (type === 'error' ? 'error' : '');
            msg.textContent = text;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 3000);
        }
        
        // Auto-fill username for quick testing
        document.getElementById('username').value = 'Player' + Math.floor(Math.random() * 1000);
    </script>
</body>
</html>
'''

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode())
        
        elif self.path == '/api/predictions':
            cursor.execute('SELECT * FROM predictions WHERE active = 1')
            predictions = []
            for row in cursor.fetchall():
                predictions.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'yes_pool': row[3],
                    'no_pool': row[4]
                })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(predictions).encode())
        
        elif self.path == '/api/activity':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(activity_feed[:10]).encode())
        
        else:
            self.send_error(404)
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode())
        
        if self.path == '/api/login':
            username = data['username']
            
            # Get or create user
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            if not user:
                cursor.execute('INSERT INTO users (username) VALUES (?)', (username,))
                db.commit()
                user_id = cursor.lastrowid
                balance = 1000
            else:
                user_id = user[0]
                balance = user[2]
            
            add_activity(f"{username} joined the game!")
            
            response = {
                'id': user_id,
                'username': username,
                'balance': balance
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/bet':
            user_id = data['userId']
            pred_id = data['predictionId']
            amount = data['amount']
            choice = data['choice']
            
            # Check balance
            cursor.execute('SELECT username, balance FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            username = user[0]
            balance = user[1]
            
            if balance < amount:
                response = {'success': False, 'error': 'Insufficient balance!'}
            else:
                # Place bet
                cursor.execute('INSERT INTO bets (user_id, prediction_id, amount, choice) VALUES (?, ?, ?, ?)',
                              (user_id, pred_id, amount, choice))
                
                # Update balance
                new_balance = balance - amount
                cursor.execute('UPDATE users SET balance = ? WHERE id = ?', (new_balance, user_id))
                
                # Update pools
                if choice == 'yes':
                    cursor.execute('UPDATE predictions SET yes_pool = yes_pool + ? WHERE id = ?', (amount, pred_id))
                else:
                    cursor.execute('UPDATE predictions SET no_pool = no_pool + ? WHERE id = ?', (amount, pred_id))
                
                db.commit()
                
                # Get prediction title
                cursor.execute('SELECT title FROM predictions WHERE id = ?', (pred_id,))
                pred_title = cursor.fetchone()[0]
                
                add_activity(f"{username} bet ${amount} on {choice.upper()} for '{pred_title}'")
                
                response = {'success': True, 'newBalance': new_balance}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        pass  # Suppress logs

# Auto-resolution thread
def auto_resolver():
    while True:
        time.sleep(30)  # Every 30 seconds
        
        # Randomly resolve a prediction
        cursor.execute('SELECT id, title FROM predictions WHERE active = 1')
        active_preds = cursor.fetchall()
        
        if active_preds and random.random() > 0.7:  # 30% chance
            pred_id, title = random.choice(active_preds)
            outcome = random.choice(['yes', 'no'])
            
            # Get pools
            cursor.execute('SELECT yes_pool, no_pool FROM predictions WHERE id = ?', (pred_id,))
            yes_pool, no_pool = cursor.fetchone()
            
            # Calculate payouts
            winning_pool = yes_pool if outcome == 'yes' else no_pool
            losing_pool = no_pool if outcome == 'yes' else yes_pool
            total_pool = yes_pool + no_pool
            
            if winning_pool > 0:
                # Get winners
                cursor.execute('SELECT user_id, amount FROM bets WHERE prediction_id = ? AND choice = ?',
                              (pred_id, outcome))
                winners = cursor.fetchall()
                
                for user_id, bet_amount in winners:
                    # Proportional payout
                    payout = int(bet_amount * total_pool / winning_pool)
                    cursor.execute('UPDATE users SET balance = balance + ? WHERE id = ?', (payout, user_id))
                    
                    cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
                    username = cursor.fetchone()[0]
                    add_activity(f"{username} won ${payout} on '{title}'!")
            
            # Mark as resolved
            cursor.execute('UPDATE predictions SET active = 0 WHERE id = ?', (pred_id,))
            
            # Add new prediction
            new_predictions = [
                ("Stock Rally", "Will S&P 500 go up tomorrow?"),
                ("Crypto Surge", "Will ETH break $5000 this week?"),
                ("Weather Alert", "Will there be snow this weekend?"),
                ("Game Night", "Will the home team win?")
            ]
            new_title, new_desc = random.choice(new_predictions)
            cursor.execute('INSERT INTO predictions (title, description) VALUES (?, ?)', (new_title, new_desc))
            
            db.commit()
            
            add_activity(f"'{title}' resolved: {outcome.upper()} wins! Total pool: ${total_pool}")

if __name__ == '__main__':
    # Start auto-resolver
    resolver_thread = threading.Thread(target=auto_resolver)
    resolver_thread.daemon = True
    resolver_thread.start()
    
    # Start server
    server = HTTPServer(('localhost', 8765), RequestHandler)
    
    print("\n✅ PREDICTIFY IS RUNNING!")
    print("=" * 60)
    print("🌐 Open: http://localhost:8765")
    print("\n🎮 Features:")
    print("  ✓ User registration")
    print("  ✓ Real balance tracking")
    print("  ✓ Place bets on predictions")
    print("  ✓ Live activity feed")
    print("  ✓ Auto-resolving predictions")
    print("  ✓ Proportional payouts")
    print("\n💡 No external dependencies needed!")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        db.close()