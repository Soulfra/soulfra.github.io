from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
🔥 ADDICTION ENGINE - #1 Most Addictive Learning Platform in the World 🔥
Combines the best game mechanics with education to create dopamine loops
"""

import os
import json
import time
import sqlite3
import uuid
import random
import threading
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Force UTF-8
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['PYTHONIOENCODING'] = 'utf-8'

class AddictionEngine:
    """The most addictive learning platform on Earth"""
    
    def __init__(self):
        self.port = 7777  # Lucky sevens for addiction
        self.init_addiction_database()
        self.init_dopamine_systems()
        self.init_viral_mechanics()
        self.active_battles = {}
        self.leaderboards = {}
        
    def init_addiction_database(self):
        """Database designed for maximum engagement"""
        self.conn = sqlite3.connect('addiction_engine.db', check_same_thread=False)
        
        # Users with addiction metrics
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                streak_days INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                dopamine_score INTEGER DEFAULT 100,
                addiction_level TEXT DEFAULT 'casual',  -- casual, hooked, addicted, obsessed
                badges TEXT DEFAULT '[]',
                achievements TEXT DEFAULT '[]',
                social_rank INTEGER DEFAULT 0,
                total_battles_won INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_session DATETIME,
                session_count INTEGER DEFAULT 0,
                minutes_today INTEGER DEFAULT 0,
                minutes_total INTEGER DEFAULT 0
            )
        ''')
        
        # Learning sessions with gamification
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                subject TEXT,
                difficulty INTEGER,
                questions_answered INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                xp_gained INTEGER DEFAULT 0,
                streak_bonus INTEGER DEFAULT 0,
                time_spent INTEGER DEFAULT 0,
                dopamine_hits INTEGER DEFAULT 0,
                session_type TEXT,  -- daily, battle, challenge, marathon
                completed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Battle system for competitive learning
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS battles (
                id TEXT PRIMARY KEY,
                challenger_id TEXT,
                opponent_id TEXT,
                subject TEXT,
                status TEXT DEFAULT 'pending',  -- pending, active, completed
                challenger_score INTEGER DEFAULT 0,
                opponent_score INTEGER DEFAULT 0,
                winner_id TEXT,
                xp_reward INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (challenger_id) REFERENCES users(id),
                FOREIGN KEY (opponent_id) REFERENCES users(id)
            )
        ''')
        
        # Viral sharing and referrals
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS viral_actions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action_type TEXT,  -- share, invite, challenge, flex
                platform TEXT,  -- tiktok, instagram, twitter, discord
                content_shared TEXT,
                engagement_score INTEGER DEFAULT 0,
                viral_bonus_xp INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        self.conn.commit()
    
    def init_dopamine_systems(self):
        """Systems designed to trigger dopamine release"""
        self.dopamine_triggers = {
            'correct_answer': {'xp': 10, 'message': '🎯 Perfect! +10 XP'},
            'streak_milestone': {'xp': 50, 'message': '🔥 STREAK FIRE! +50 XP'},
            'level_up': {'xp': 100, 'message': '⭐ LEVEL UP! You\'re unstoppable!'},
            'perfect_score': {'xp': 75, 'message': '💯 FLAWLESS VICTORY! +75 XP'},
            'speed_bonus': {'xp': 25, 'message': '⚡ LIGHTNING FAST! +25 XP'},
            'comeback': {'xp': 40, 'message': '🔄 EPIC COMEBACK! +40 XP'},
            'battle_win': {'xp': 150, 'message': '⚔️ BATTLE CHAMPION! +150 XP'},
            'viral_share': {'xp': 30, 'message': '📱 VIRAL LEGEND! +30 XP'}
        }
        
        self.addiction_phrases = [
            "You're on FIRE! 🔥",
            "UNSTOPPABLE! 💪",
            "LEGENDARY! ⭐",
            "CRUSHING IT! 💥",
            "GENIUS MODE! 🧠",
            "DOMINATING! 👑",
            "BEAST MODE! 🦁",
            "FLAWLESS! 💎"
        ]
    
    def init_viral_mechanics(self):
        """Mechanics designed to go viral"""
        self.viral_challenges = [
            "Learn 100 facts in 10 minutes",
            "Perfect streak for 7 days",
            "Beat 5 opponents in battles",
            "Share your progress on TikTok",
            "Invite 3 friends to join",
            "Master a subject in 24 hours"
        ]
        
        self.shareable_content = {
            'achievement_flex': "Just hit level {level} on AddictionEngine! 🔥 Who can beat my {streak} day streak? #LearningAddict #BrainGains",
            'battle_victory': "DESTROYED my opponent in a {subject} battle! 💪 Challenge me if you dare! #LearningBattle #Unstoppable",
            'streak_flex': "{streak} DAYS STRAIGHT of learning! 🔥 My brain is literally getting bigger! Who's joining the addiction? #StreakAddict #BrainPump",
            'viral_challenge': "Just completed the {challenge}! 🎯 Tag 3 friends who think they're smarter than me! #ChallengeAccepted #BrainChallenge"
        }
    
    def process_learning_session(self, user_id, subject, answers):
        """Process a learning session with maximum dopamine hits"""
        session_id = str(uuid.uuid4())
        
        # Calculate performance metrics
        total_questions = len(answers)
        correct_count = sum(1 for answer in answers if answer.get('correct', False))
        accuracy = (correct_count / total_questions) * 100
        
        # Calculate XP with bonuses
        base_xp = correct_count * 10
        accuracy_bonus = int(accuracy) if accuracy >= 80 else 0
        speed_bonus = 25 if self.was_fast_session(answers) else 0
        
        # Check for dopamine triggers
        dopamine_hits = []
        total_xp = base_xp
        
        if accuracy == 100:
            dopamine_hits.append(self.dopamine_triggers['perfect_score'])
            total_xp += 75
        
        if speed_bonus > 0:
            dopamine_hits.append(self.dopamine_triggers['speed_bonus'])
            total_xp += 25
        
        # Update user progress
        user = self.get_user(user_id)
        new_xp = user['xp'] + total_xp
        new_level = self.calculate_level(new_xp)
        
        # Check for level up
        if new_level > user['level']:
            dopamine_hits.append(self.dopamine_triggers['level_up'])
            total_xp += 100
        
        # Update streak
        streak_updated = self.update_streak(user_id)
        if streak_updated and streak_updated % 5 == 0:  # Milestone every 5 days
            dopamine_hits.append(self.dopamine_triggers['streak_milestone'])
            total_xp += 50
        
        # Save session
        self.conn.execute('''
            INSERT INTO sessions (id, user_id, subject, questions_answered, correct_answers, 
                                xp_gained, time_spent, dopamine_hits, session_type, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, user_id, subject, total_questions, correct_count, 
              total_xp, 300, len(dopamine_hits), 'daily', datetime.now()))
        
        # Update user stats
        self.conn.execute('''
            UPDATE users SET xp = ?, level = ?, last_session = ?, session_count = session_count + 1,
                           minutes_today = minutes_today + 5, minutes_total = minutes_total + 5
            WHERE id = ?
        ''', (new_xp, new_level, datetime.now(), user_id))
        
        self.conn.commit()
        
        return {
            'session_id': session_id,
            'xp_gained': total_xp,
            'new_level': new_level,
            'accuracy': accuracy,
            'dopamine_hits': dopamine_hits,
            'addiction_phrase': random.choice(self.addiction_phrases),
            'next_challenge': self.get_next_challenge(user_id),
            'viral_opportunity': self.get_viral_opportunity(user_id, total_xp)
        }
    
    def create_battle(self, challenger_id, opponent_username, subject):
        """Create an addictive learning battle"""
        opponent = self.get_user_by_username(opponent_username)
        if not opponent:
            return {'error': 'Opponent not found'}
        
        battle_id = str(uuid.uuid4())
        
        self.conn.execute('''
            INSERT INTO battles (id, challenger_id, opponent_id, subject, xp_reward)
            VALUES (?, ?, ?, ?, ?)
        ''', (battle_id, challenger_id, opponent['id'], subject, 150))
        
        self.conn.commit()
        
        # Add to active battles for real-time updates
        self.active_battles[battle_id] = {
            'challenger_id': challenger_id,
            'opponent_id': opponent['id'],
            'subject': subject,
            'status': 'pending'
        }
        
        return {
            'battle_id': battle_id,
            'message': f'🔥 BATTLE CHALLENGE SENT! Get ready to DESTROY {opponent_username} in {subject}!'
        }
    
    def generate_viral_content(self, user_id, achievement_type, data):
        """Generate shareable content designed to go viral"""
        user = self.get_user(user_id)
        
        if achievement_type in self.shareable_content:
            content = self.shareable_content[achievement_type].format(**data)
            
            # Save viral action
            viral_id = str(uuid.uuid4())
            self.conn.execute('''
                INSERT INTO viral_actions (id, user_id, action_type, content_shared, viral_bonus_xp)
                VALUES (?, ?, ?, ?, ?)
            ''', (viral_id, user_id, achievement_type, content, 30))
            
            self.conn.commit()
            
            return {
                'content': content,
                'platforms': ['TikTok', 'Instagram', 'Twitter', 'Discord'],
                'bonus_xp': 30,
                'viral_potential': self.calculate_viral_potential(content)
            }
        
        return None
    
    def get_addiction_dashboard(self, user_id):
        """Generate addictive dashboard with all the hooks"""
        user = self.get_user(user_id)
        
        # Get recent sessions
        sessions = self.conn.execute('''
            SELECT * FROM sessions WHERE user_id = ? 
            ORDER BY completed_at DESC LIMIT 5
        ''', (user_id,)).fetchall()
        
        # Get active battles
        battles = self.conn.execute('''
            SELECT * FROM battles 
            WHERE (challenger_id = ? OR opponent_id = ?) AND status != 'completed'
            ORDER BY created_at DESC
        ''', (user_id, user_id)).fetchall()
        
        # Calculate addiction level
        addiction_level = self.calculate_addiction_level(user)
        
        # Get personalized challenges
        challenges = self.get_personalized_challenges(user_id)
        
        # Get leaderboard position
        rank = self.get_user_rank(user_id)
        
        return {
            'user': user,
            'addiction_level': addiction_level,
            'rank': rank,
            'sessions': sessions,
            'active_battles': battles,
            'challenges': challenges,
            'next_dopamine_hit': self.predict_next_dopamine_hit(user),
            'viral_opportunities': self.get_viral_opportunities(user_id),
            'addiction_score': self.calculate_addiction_score(user)
        }
    
    def calculate_addiction_level(self, user):
        """Calculate how addicted the user is (in a good way)"""
        score = 0
        
        # Session frequency
        if user['session_count'] > 100: score += 30
        elif user['session_count'] > 50: score += 20
        elif user['session_count'] > 10: score += 10
        
        # Streak dedication
        if user['streak_days'] > 30: score += 25
        elif user['streak_days'] > 14: score += 15
        elif user['streak_days'] > 7: score += 10
        
        # Time investment
        if user['minutes_total'] > 1000: score += 20
        elif user['minutes_total'] > 500: score += 15
        elif user['minutes_total'] > 100: score += 10
        
        # Battle participation
        if user['total_battles_won'] > 20: score += 15
        elif user['total_battles_won'] > 10: score += 10
        elif user['total_battles_won'] > 5: score += 5
        
        # Determine addiction level
        if score >= 80: return 'COMPLETELY OBSESSED 🔥'
        elif score >= 60: return 'SERIOUSLY ADDICTED 💯'
        elif score >= 40: return 'TOTALLY HOOKED 🎯'
        elif score >= 20: return 'GETTING ADDICTED ⚡'
        else: return 'JUST GETTING STARTED 🌟'
    
    def was_fast_session(self, answers):
        """Check if user was fast enough for speed bonus"""
        # Simple simulation - in production, track actual timing
        return len(answers) >= 5
    
    def calculate_level(self, xp):
        """Calculate level from XP with exponential growth"""
        return int((xp / 100) ** 0.7) + 1
    
    def update_streak(self, user_id):
        """Update user's learning streak"""
        user = self.get_user(user_id)
        last_session = user.get('last_session')
        
        if last_session:
            last_date = datetime.fromisoformat(last_session).date()
            today = datetime.now().date()
            
            if (today - last_date).days == 1:
                # Consecutive day - increase streak
                new_streak = user['streak_days'] + 1
                self.conn.execute('''
                    UPDATE users SET streak_days = ?, longest_streak = MAX(longest_streak, ?)
                    WHERE id = ?
                ''', (new_streak, new_streak, user_id))
                self.conn.commit()
                return new_streak
            elif (today - last_date).days > 1:
                # Streak broken - reset
                self.conn.execute('UPDATE users SET streak_days = 1 WHERE id = ?', (user_id,))
                self.conn.commit()
                return 1
        
        return user['streak_days']
    
    def get_user(self, user_id):
        """Get user data"""
        result = self.conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if result:
            columns = [desc[0] for desc in self.conn.description]
            return dict(zip(columns, result))
        return None
    
    def get_user_by_username(self, username):
        """Get user by username"""
        result = self.conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        if result:
            columns = [desc[0] for desc in self.conn.description]
            return dict(zip(columns, result))
        return None
    
    def get_next_challenge(self, user_id):
        """Get personalized next challenge"""
        return random.choice(self.viral_challenges)
    
    def get_viral_opportunity(self, user_id, xp_gained):
        """Get viral sharing opportunity"""
        if xp_gained >= 100:
            return {
                'type': 'achievement_flex',
                'message': 'You just earned massive XP! Share your success!',
                'bonus_xp': 30
            }
        return None
    
    def calculate_viral_potential(self, content):
        """Calculate how viral content might be"""
        viral_words = ['fire', 'unstoppable', 'destroyed', 'challenge', 'streak', 'beast']
        score = sum(1 for word in viral_words if word.lower() in content.lower())
        return min(score * 20, 100)  # Max 100%
    
    def get_personalized_challenges(self, user_id):
        """Get challenges personalized for addiction"""
        return [
            "Beat your personal best streak",
            "Challenge the #1 player",
            "Master a new subject today",
            "Share your progress for bonus XP"
        ]
    
    def get_user_rank(self, user_id):
        """Get user's rank on leaderboard"""
        result = self.conn.execute('''
            SELECT COUNT(*) + 1 as rank FROM users 
            WHERE xp > (SELECT xp FROM users WHERE id = ?)
        ''', (user_id,)).fetchone()
        return result[0] if result else 0
    
    def predict_next_dopamine_hit(self, user):
        """Predict when user will get next dopamine hit"""
        if user['streak_days'] == 4:
            return "🔥 ONE MORE DAY for 5-day streak bonus!"
        elif user['xp'] % 100 >= 80:
            return "⭐ SO CLOSE to leveling up!"
        else:
            return "🎯 Next correct answer = instant XP!"
    
    def get_viral_opportunities(self, user_id):
        """Get current viral sharing opportunities"""
        return [
            "Share your streak on TikTok (+30 XP)",
            "Challenge friends on Instagram (+25 XP)",
            "Post your level on Twitter (+20 XP)"
        ]
    
    def calculate_addiction_score(self, user):
        """Calculate overall addiction score out of 100"""
        return min(user['session_count'] + user['streak_days'] * 2 + user['level'] * 5, 100)

class AddictionHandler(BaseHTTPRequestHandler):
    """HTTP handler for the addiction engine"""
    
    def __init__(self, system, *args, **kwargs):
        self.system = system
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        if path == '/':
            self.serve_main_interface()
        elif path == '/dashboard':
            self.serve_dashboard()
        elif path == '/battle':
            self.serve_battle_interface()
        elif path == '/api/leaderboard':
            self.serve_leaderboard()
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            path = urlparse(self.path).path
            
            if path == '/api/session':
                result = self.system.process_learning_session(
                    data.get('user_id', 'demo_user'),
                    data.get('subject', 'math'),
                    data.get('answers', [])
                )
                self.send_json_response(result)
            
            elif path == '/api/battle':
                result = self.system.create_battle(
                    data.get('challenger_id', 'demo_user'),
                    data.get('opponent_username', ''),
                    data.get('subject', 'math')
                )
                self.send_json_response(result)
            
            elif path == '/api/viral':
                result = self.system.generate_viral_content(
                    data.get('user_id', 'demo_user'),
                    data.get('achievement_type', ''),
                    data.get('data', {})
                )
                self.send_json_response(result or {'error': 'No viral content available'})
            
            else:
                self.send_error(404)
                
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_main_interface(self):
        """Serve the main addictive interface"""
        html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 ADDICTION ENGINE - #1 Learning Platform 🔥</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            overflow-x: hidden;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #ff6b6b; }
            to { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #ff6b6b; }
        }
        
        .title {
            font-size: 3.5em;
            font-weight: bold;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 1.5em;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .stat-card:hover {
            transform: translateY(-10px) scale(1.05);
            border-color: #ff6b6b;
            box-shadow: 0 20px 40px rgba(255, 107, 107, 0.3);
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #ff6b6b;
            margin-bottom: 10px;
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .action-btn {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            border-radius: 15px;
            padding: 20px;
            font-size: 1.2em;
            font-weight: bold;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .action-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
            filter: brightness(1.2);
        }
        
        .battle-btn {
            background: linear-gradient(45deg, #ff4757, #ff3838);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .learning-area {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .question {
            font-size: 1.3em;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .answers {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .answer-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            padding: 15px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .answer-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: #4ecdc4;
        }
        
        .correct { background: #2ecc71 !important; }
        .incorrect { background: #e74c3c !important; }
        
        .progress-bar {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            height: 20px;
            margin: 20px 0;
            overflow: hidden;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #4ecdc4, #44bd87);
            height: 100%;
            transition: width 0.5s ease;
        }
        
        .dopamine-hits {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        .dopamine-hit {
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
            animation: slideIn 0.5s ease;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.5);
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .viral-share {
            background: linear-gradient(45deg, #667eea, #764ba2);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            margin-top: 20px;
        }
        
        .mobile-responsive {
            display: block;
        }
        
        @media (max-width: 768px) {
            .title { font-size: 2.5em; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .action-buttons { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🔥 ADDICTION ENGINE 🔥</h1>
            <p class="subtitle">#1 Most Addictive Learning Platform in the World</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card" onclick="showLevel()">
                <div class="stat-value" id="userLevel">1</div>
                <div>Level</div>
            </div>
            <div class="stat-card" onclick="showXP()">
                <div class="stat-value" id="userXP">0</div>
                <div>XP Points</div>
            </div>
            <div class="stat-card" onclick="showStreak()">
                <div class="stat-value" id="userStreak">0</div>
                <div>Day Streak 🔥</div>
            </div>
            <div class="stat-card" onclick="showRank()">
                <div class="stat-value" id="userRank">#∞</div>
                <div>Global Rank</div>
            </div>
        </div>
        
        <div class="action-buttons">
            <button class="action-btn" onclick="startLearningSession()">
                🧠 START LEARNING SESSION
            </button>
            <button class="action-btn battle-btn" onclick="startBattle()">
                ⚔️ CHALLENGE SOMEONE
            </button>
            <button class="action-btn" onclick="viewDashboard()">
                📊 VIEW DASHBOARD
            </button>
            <button class="action-btn" onclick="shareViral()">
                📱 SHARE & GO VIRAL
            </button>
        </div>
        
        <div class="learning-area" id="learningArea" style="display: none;">
            <div class="question" id="question">What is 2 + 2?</div>
            <div class="answers" id="answers">
                <button class="answer-btn" onclick="selectAnswer(this, true)">4</button>
                <button class="answer-btn" onclick="selectAnswer(this, false)">5</button>
                <button class="answer-btn" onclick="selectAnswer(this, false)">3</button>
                <button class="answer-btn" onclick="selectAnswer(this, false)">6</button>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
            </div>
            <div style="text-align: center;">
                <button class="action-btn" onclick="finishSession()">FINISH SESSION</button>
            </div>
        </div>
        
        <div class="viral-share" style="display: none;" id="viralShare">
            <h3>🚀 SHARE YOUR SUCCESS!</h3>
            <p id="viralContent">Just leveled up! Who can beat me?</p>
            <div style="margin-top: 15px;">
                <button class="action-btn" onclick="shareToTikTok()">📱 TikTok</button>
                <button class="action-btn" onclick="shareToInstagram()">📷 Instagram</button>
                <button class="action-btn" onclick="shareToTwitter()">🐦 Twitter</button>
            </div>
        </div>
    </div>
    
    <div class="dopamine-hits" id="dopamineHits"></div>
    
    <script>
        let currentSession = {
            questions: 0,
            correct: 0,
            xp: 0
        };
        
        let userData = {
            level: 1,
            xp: 0,
            streak: 0,
            rank: 999
        };
        
        function startLearningSession() {
            document.getElementById('learningArea').style.display = 'block';
            currentSession = { questions: 0, correct: 0, xp: 0 };
            nextQuestion();
        }
        
        function nextQuestion() {
            const questions = [
                { q: "What is 5 + 3?", answers: ["8", "7", "9", "6"], correct: 0 },
                { q: "What is 12 - 4?", answers: ["7", "8", "9", "10"], correct: 1 },
                { q: "What is 6 × 2?", answers: ["10", "11", "12", "13"], correct: 2 },
                { q: "What is 15 ÷ 3?", answers: ["4", "5", "6", "7"], correct: 1 },
                { q: "What is 7 + 8?", answers: ["14", "15", "16", "17"], correct: 1 }
            ];
            
            if (currentSession.questions < 5) {
                const q = questions[currentSession.questions];
                document.getElementById('question').textContent = q.q;
                
                const answersDiv = document.getElementById('answers');
                answersDiv.innerHTML = '';
                
                q.answers.forEach((answer, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'answer-btn';
                    btn.textContent = answer;
                    btn.onclick = () => selectAnswer(btn, index === q.correct);
                    answersDiv.appendChild(btn);
                });
                
                updateProgress();
            }
        }
        
        function selectAnswer(btn, correct) {
            const buttons = document.querySelectorAll('.answer-btn');
            buttons.forEach(b => b.style.pointerEvents = 'none');
            
            if (correct) {
                btn.classList.add('correct');
                currentSession.correct++;
                currentSession.xp += 10;
                showDopamineHit('🎯 Correct! +10 XP');
            } else {
                btn.classList.add('incorrect');
                showDopamineHit('❌ Wrong answer, keep trying!');
            }
            
            currentSession.questions++;
            
            setTimeout(() => {
                buttons.forEach(b => {
                    b.classList.remove('correct', 'incorrect');
                    b.style.pointerEvents = 'auto';
                });
                nextQuestion();
            }, 1500);
        }
        
        function updateProgress() {
            const progress = (currentSession.questions / 5) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }
        
        function finishSession() {
            const accuracy = (currentSession.correct / currentSession.questions) * 100;
            let bonusXP = 0;
            let bonusMessage = '';
            
            if (accuracy === 100) {
                bonusXP = 75;
                bonusMessage = '💯 PERFECT SCORE! +75 XP';
            } else if (accuracy >= 80) {
                bonusXP = 25;
                bonusMessage = '🌟 GREAT JOB! +25 XP';
            }
            
            currentSession.xp += bonusXP;
            userData.xp += currentSession.xp;
            userData.level = Math.floor(userData.xp / 100) + 1;
            userData.streak++;
            userData.rank = Math.max(1, userData.rank - Math.floor(currentSession.xp / 10));
            
            updateUI();
            
            if (bonusMessage) showDopamineHit(bonusMessage);
            showDopamineHit(`🔥 Session Complete! +${currentSession.xp} Total XP`);
            
            document.getElementById('learningArea').style.display = 'none';
            
            // Show viral opportunity
            if (currentSession.xp >= 50) {
                showViralOpportunity();
            }
        }
        
        function showDopamineHit(message) {
            const hit = document.createElement('div');
            hit.className = 'dopamine-hit';
            hit.textContent = message;
            document.getElementById('dopamineHits').appendChild(hit);
            
            setTimeout(() => {
                hit.remove();
            }, 3000);
        }
        
        function updateUI() {
            document.getElementById('userLevel').textContent = userData.level;
            document.getElementById('userXP').textContent = userData.xp;
            document.getElementById('userStreak').textContent = userData.streak;
            document.getElementById('userRank').textContent = '#' + userData.rank;
        }
        
        function startBattle() {
            showDopamineHit('⚔️ BATTLE MODE ACTIVATED!');
            alert('🔥 Challenge feature coming soon! Get ready to DESTROY your opponents!');
        }
        
        function viewDashboard() {
            window.open('/dashboard', '_blank');
        }
        
        function showViralOpportunity() {
            const viralDiv = document.getElementById('viralShare');
            const content = `Just earned ${currentSession.xp} XP and hit level ${userData.level}! 🔥 Who can beat my ${userData.streak} day streak? #AddictionEngine #LearningAddict`;
            document.getElementById('viralContent').textContent = content;
            viralDiv.style.display = 'block';
            
            setTimeout(() => {
                viralDiv.style.display = 'none';
            }, 10000);
        }
        
        function shareToTikTok() {
            showDopamineHit('📱 TikTok Share +30 XP!');
            userData.xp += 30;
            updateUI();
        }
        
        function shareToInstagram() {
            showDopamineHit('📷 Instagram Share +25 XP!');
            userData.xp += 25;
            updateUI();
        }
        
        function shareToTwitter() {
            showDopamineHit('🐦 Twitter Share +20 XP!');
            userData.xp += 20;
            updateUI();
        }
        
        function showLevel() { showDopamineHit(`🌟 Level ${userData.level} - Keep climbing!`); }
        function showXP() { showDopamineHit(`💎 ${userData.xp} XP - You're unstoppable!`); }
        function showStreak() { showDopamineHit(`🔥 ${userData.streak} day streak - ON FIRE!`); }
        function showRank() { showDopamineHit(`👑 Rank #${userData.rank} - Climb higher!`); }
        
        // Auto-save progress
        setInterval(() => {
            localStorage.setItem('addictionEngineData', JSON.stringify(userData));
        }, 5000);
        
        // Load saved progress
        const saved = localStorage.getItem('addictionEngineData');
        if (saved) {
            userData = JSON.parse(saved);
            updateUI();
        }
        
        // Show motivational message on load
        setTimeout(() => {
            showDopamineHit('🚀 Welcome back! Ready to get addicted to learning?');
        }, 1000);
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_dashboard(self):
        """Serve addiction dashboard"""
        dashboard = self.system.get_addiction_dashboard('demo_user')
        
        html = f'''<!DOCTYPE html>
<html>
<head>
    <title>🔥 Addiction Dashboard</title>
    <meta charset="UTF-8">
    <style>
        body {{ 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
        }}
        .dashboard {{ max-width: 1200px; margin: 0 auto; }}
        .card {{ 
            background: rgba(255,255,255,0.1); 
            border-radius: 15px; 
            padding: 20px; 
            margin: 20px 0;
            backdrop-filter: blur(10px);
        }}
        .addiction-level {{ 
            font-size: 2em; 
            text-align: center; 
            color: #ff6b6b;
            text-shadow: 0 0 20px #ff6b6b;
        }}
        .metric {{ 
            display: inline-block; 
            margin: 10px 20px; 
            font-size: 1.5em; 
        }}
        .viral-btn {{
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
        }}
    </style>
</head>
<body>
    <div class="dashboard">
        <h1 style="text-align: center;">🔥 YOUR ADDICTION DASHBOARD 🔥</h1>
        
        <div class="card">
            <div class="addiction-level">{dashboard['addiction_level']}</div>
            <div style="text-align: center;">
                <span class="metric">Level {dashboard['user']['level'] if dashboard['user'] else 1}</span>
                <span class="metric">{dashboard['user']['xp'] if dashboard['user'] else 0} XP</span>
                <span class="metric">Rank #{dashboard['rank']}</span>
                <span class="metric">{dashboard['user']['streak_days'] if dashboard['user'] else 0} Day Streak</span>
            </div>
        </div>
        
        <div class="card">
            <h3>🎯 Your Challenges</h3>
            {chr(10).join(f'<p>• {challenge}</p>' for challenge in dashboard['challenges'])}
        </div>
        
        <div class="card">
            <h3>🚀 Viral Opportunities</h3>
            {chr(10).join(f'<button class="viral-btn">{opp}</button>' for opp in dashboard['viral_opportunities'])}
        </div>
        
        <div class="card">
            <h3>⚡ Next Dopamine Hit</h3>
            <p style="font-size: 1.3em; color: #4ecdc4;">{dashboard['next_dopamine_hit']}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button class="viral-btn" onclick="window.close()">🔥 BACK TO ADDICTION</button>
        </div>
    </div>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_battle_interface(self):
        """Serve battle interface"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>⚔️ Battle Arena</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(45deg, #ff4757, #ff3838);
            color: white;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .arena { max-width: 800px; margin: 0 auto; }
        .battle-card { 
            background: rgba(0,0,0,0.3); 
            border-radius: 20px; 
            padding: 30px; 
            margin: 20px 0;
        }
        .battle-btn {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            padding: 20px 40px;
            border-radius: 15px;
            color: white;
            font-size: 1.3em;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="arena">
        <h1 style="font-size: 3em;">⚔️ BATTLE ARENA ⚔️</h1>
        <p style="font-size: 1.5em;">Challenge anyone to a learning duel!</p>
        
        <div class="battle-card">
            <h3>🔥 CREATE BATTLE</h3>
            <input type="text" placeholder="Opponent Username" style="padding: 15px; margin: 10px; border-radius: 10px; border: none; font-size: 1.1em;">
            <select style="padding: 15px; margin: 10px; border-radius: 10px; border: none; font-size: 1.1em;">
                <option>Math</option>
                <option>Science</option>
                <option>History</option>
                <option>English</option>
            </select>
            <br>
            <button class="battle-btn">⚔️ CHALLENGE TO BATTLE!</button>
        </div>
        
        <div class="battle-card">
            <h3>🏆 ACTIVE BATTLES</h3>
            <p>No active battles - time to start some chaos! 🔥</p>
        </div>
        
        <div class="battle-card">
            <h3>👑 BATTLE LEADERBOARD</h3>
            <p>1. BattleMaster - 47 Wins</p>
            <p>2. LearningLegend - 42 Wins</p>
            <p>3. StudyWarrior - 38 Wins</p>
            <p>4. YOU - 0 Wins (Time to change that!)</p>
        </div>
    </div>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_leaderboard(self):
        """Serve leaderboard API"""
        leaderboard = [
            {'username': 'AddictionKing', 'level': 15, 'xp': 1500, 'streak': 30},
            {'username': 'LearningLegend', 'level': 12, 'xp': 1200, 'streak': 25},
            {'username': 'StudyBeast', 'level': 10, 'xp': 1000, 'streak': 20},
            {'username': 'BrainGainer', 'level': 8, 'xp': 800, 'streak': 15},
            {'username': 'Demo User', 'level': 1, 'xp': 0, 'streak': 0}
        ]
        self.send_json_response({'leaderboard': leaderboard})
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to reduce log spam"""
        pass

def run_addiction_engine():
    """Run the most addictive learning platform"""
    try:
        system = AddictionEngine()
        
        # Create demo user
        demo_user_id = 'demo_user'
        system.conn.execute('''
            INSERT OR REPLACE INTO users (id, username, level, xp, streak_days, addiction_level)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, 'Demo User', 1, 0, 0, 'JUST GETTING STARTED 🌟'))
        system.conn.commit()
        
        def handler(*args, **kwargs):
            return AddictionHandler(system, *args, **kwargs)
        
        server = HTTPServer(('localhost', system.port), handler)
        
        print(f"""
🔥🔥🔥 ADDICTION ENGINE LAUNCHED! 🔥🔥🔥

🌐 Main Interface: http://localhost:{system.port}
📊 Dashboard: http://localhost:{system.port}/dashboard
⚔️ Battle Arena: http://localhost:{system.port}/battle
🏆 Leaderboard: http://localhost:{system.port}/api/leaderboard

🎯 THE MOST ADDICTIVE LEARNING PLATFORM IS LIVE!

Features that will get users HOOKED:
🔥 Dopamine-triggering XP system
⚔️ Competitive learning battles
📱 Viral sharing mechanics  
🏆 Addictive leaderboards
⚡ Instant gratification loops
🎮 Game mechanics everywhere
💯 Streak addiction system
🚀 Built to go viral on TikTok

Ready to create learning addicts? 😈
""")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🔥 Addiction Engine stopped - users are going through withdrawal! 😭")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    run_addiction_engine()