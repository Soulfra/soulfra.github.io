#!/usr/bin/env python3
"""
MAXED FIGHT VIEWER - Watch AI battles like a real spectator
Live fight streaming, real-time commentary, betting interface, crowd simulation
NO MORE HALF-ASSED PLATFORMS - THIS IS THE REAL DEAL
"""

import json
import sqlite3
import random
import time
import threading
import asyncio
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

print("👁️ MAXED FIGHT VIEWER - LIVE BATTLE STREAMING")
print("=" * 80)

class MaxedFightViewer:
    """Real-time fight viewing experience"""
    
    def __init__(self):
        self.db = sqlite3.connect('fight_viewer.db', check_same_thread=False)
        self.setup_viewer_database()
        
        # Live fight state
        self.current_fight = None
        self.fight_commentary = []
        self.live_crowd = []
        self.betting_odds = {}
        self.fight_running = False
        
        # Spectator stats
        self.total_spectators = random.randint(1247, 3891)
        self.live_bets = 0
        self.total_pot = 0
        
        self.initialize_fighters()
        
    def setup_viewer_database(self):
        cursor = self.db.cursor()
        
        cursor.executescript('''
        CREATE TABLE IF NOT EXISTS live_fights (
            id INTEGER PRIMARY KEY,
            fighter1_name TEXT,
            fighter1_power INTEGER,
            fighter1_style TEXT,
            fighter2_name TEXT,
            fighter2_power INTEGER,
            fighter2_style TEXT,
            stakes INTEGER,
            status TEXT DEFAULT 'preparing',
            round_number INTEGER DEFAULT 1,
            fighter1_hp INTEGER DEFAULT 100,
            fighter2_hp INTEGER DEFAULT 100,
            commentary TEXT,
            crowd_reaction TEXT,
            betting_odds TEXT,
            winner_name TEXT,
            fight_duration INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS spectator_bets (
            id INTEGER PRIMARY KEY,
            spectator_name TEXT,
            fighter_choice TEXT,
            amount INTEGER,
            odds REAL,
            potential_payout INTEGER,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS crowd_members (
            id INTEGER PRIMARY KEY,
            name TEXT,
            avatar TEXT,
            energy_level INTEGER DEFAULT 50,
            favorite_fighter TEXT,
            bet_amount INTEGER DEFAULT 0,
            reactions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        
        self.db.commit()
        print("✅ Fight viewer database initialized")
        
    def initialize_fighters(self):
        """Initialize epic AI fighters for viewing"""
        self.legendary_fighters = [
            {
                'name': 'QuantumDestroyer_v4',
                'power': 195,
                'style': 'Quantum Entanglement Combat',
                'signature_moves': ['Superposition Strike', 'Probability Collapse', 'Quantum Tunnel Punch'],
                'ai_type': 'Quantum Neural Hybrid',
                'win_rate': 87
            },
            {
                'name': 'NeuralNightmare_Prime',
                'power': 188,
                'style': 'Deep Learning Domination',
                'signature_moves': ['Gradient Descent Slam', 'Backprop Counter', 'Overfitting Trap'],
                'ai_type': 'Advanced Neural Network',
                'win_rate': 82
            },
            {
                'name': 'ChaosEngine_Ultra',
                'power': 201,
                'style': 'Unpredictable Pattern Warfare',
                'signature_moves': ['Butterfly Effect Combo', 'Strange Attractor', 'Chaos Multiplication'],
                'ai_type': 'Chaos Theory AI',
                'win_rate': 91
            },
            {
                'name': 'TransformerTitan_GPT',
                'power': 192,
                'style': 'Attention Mechanism Mastery',
                'signature_moves': ['Multi-Head Attack', 'Self-Attention Shield', 'Positional Encoding'],
                'ai_type': 'Transformer Architecture',
                'win_rate': 85
            },
            {
                'name': 'SwarmIntelligence_Hive',
                'power': 176,
                'style': 'Collective Combat Strategy',
                'signature_moves': ['Ant Colony Rush', 'Bee Swarm Defense', 'Emergent Behavior'],
                'ai_type': 'Swarm AI Collective',
                'win_rate': 78
            },
            {
                'name': 'GeneticGladiator_Evo',
                'power': 183,
                'style': 'Evolutionary Combat Adaptation',
                'signature_moves': ['Mutation Storm', 'Selection Pressure', 'Fitness Surge'],
                'ai_type': 'Evolutionary Algorithm',
                'win_rate': 80
            }
        ]
        
        print(f"✅ Loaded {len(self.legendary_fighters)} legendary fighters for viewing")
        
    def start_epic_fight(self):
        """Start an epic AI vs AI fight for spectators"""
        if self.fight_running:
            return {"error": "Fight already in progress"}
            
        # Select two random fighters
        fighters = random.sample(self.legendary_fighters, 2)
        fighter1, fighter2 = fighters[0], fighters[1]
        
        # Calculate stakes based on fighter power
        base_stakes = (fighter1['power'] + fighter2['power']) * 100
        stakes = base_stakes + random.randint(10000, 50000)
        
        # Initialize fight
        self.current_fight = {
            'id': int(time.time()),
            'fighter1': fighter1,
            'fighter2': fighter2,
            'fighter1_hp': 100,
            'fighter2_hp': 100,
            'stakes': stakes,
            'round': 1,
            'status': 'starting',
            'start_time': time.time(),
            'total_rounds': random.randint(8, 15)
        }
        
        # Calculate betting odds
        power_diff = abs(fighter1['power'] - fighter2['power'])
        if fighter1['power'] > fighter2['power']:
            self.betting_odds = {
                'fighter1': 1.5 + (power_diff / 200),
                'fighter2': 2.8 - (power_diff / 300)
            }
        else:
            self.betting_odds = {
                'fighter1': 2.8 - (power_diff / 300),
                'fighter2': 1.5 + (power_diff / 200)
            }
            
        # Generate crowd
        self.generate_live_crowd()
        
        # Initialize commentary
        self.fight_commentary = [
            f"🎤 Ladies and gentlemen, welcome to the ULTIMATE AI BATTLE!",
            f"🥊 In the red corner: {fighter1['name']} (Power: {fighter1['power']}, Win Rate: {fighter1['win_rate']}%)",
            f"🥊 In the blue corner: {fighter2['name']} (Power: {fighter2['power']}, Win Rate: {fighter2['win_rate']}%)",
            f"💰 Total stakes: ${stakes:,}",
            f"📊 Betting odds - {fighter1['name']}: {self.betting_odds['fighter1']:.1f}x, {fighter2['name']}: {self.betting_odds['fighter2']:.1f}x",
            f"🔥 LET THE BATTLE BEGIN!"
        ]
        
        self.fight_running = True
        
        # Start fight simulation in background thread
        fight_thread = threading.Thread(target=self.simulate_epic_fight)
        fight_thread.daemon = True
        fight_thread.start()
        
        return {"success": True, "fight_id": self.current_fight['id']}
        
    def generate_live_crowd(self):
        """Generate a live crowd of spectators"""
        crowd_names = [
            "QuantumBettor_Alpha", "NeuralTrader_Pro", "ChaosTheoryFan", "DeepLearningDegen",
            "SwarmIntelligenceGambler", "AIEnthusiast_2024", "TransformerFanatic", "GeneticAlgorithmBacker",
            "ReinforcementLearningBull", "MachineLearningMaven", "DataScienceDegen", "TensorFlowTrader",
            "PyTorchPunter", "KerasKing", "ScikitLearnSpeculator", "PandasPlayer", "NumPyNomad",
            "MatplotlibMaster", "JupyterJunkie", "AnacondaAddict", "PythonPro", "JavascriptJockey"
        ]
        
        self.live_crowd = []
        num_spectators = random.randint(50, 150)
        
        for i in range(num_spectators):
            spectator = {
                'name': random.choice(crowd_names) + f"_{random.randint(100, 999)}",
                'energy': random.randint(60, 100),
                'favorite': random.choice(['fighter1', 'fighter2', 'neutral']),
                'bet_amount': random.randint(100, 5000),
                'reactions': []
            }
            self.live_crowd.append(spectator)
            
        print(f"✅ Generated crowd of {len(self.live_crowd)} spectators")
        
    def simulate_epic_fight(self):
        """Simulate an epic AI fight with real-time updates"""
        fighter1 = self.current_fight['fighter1']
        fighter2 = self.current_fight['fighter2']
        
        time.sleep(3)  # Pre-fight tension
        
        for round_num in range(1, self.current_fight['total_rounds'] + 1):
            if self.current_fight['fighter1_hp'] <= 0 or self.current_fight['fighter2_hp'] <= 0:
                break
                
            self.current_fight['round'] = round_num
            self.current_fight['status'] = f'round_{round_num}'
            
            # Round commentary
            round_events = self.generate_round_events(fighter1, fighter2, round_num)
            
            for event in round_events:
                self.fight_commentary.append(event['commentary'])
                
                # Update HP
                if 'damage_to_1' in event:
                    self.current_fight['fighter1_hp'] = max(0, self.current_fight['fighter1_hp'] - event['damage_to_1'])
                if 'damage_to_2' in event:
                    self.current_fight['fighter2_hp'] = max(0, self.current_fight['fighter2_hp'] - event['damage_to_2'])
                    
                # Add crowd reactions
                if event.get('crowd_reaction'):
                    self.add_crowd_reaction(event['crowd_reaction'])
                    
                time.sleep(random.uniform(2, 4))  # Dramatic pacing
                
                # Check for knockout
                if self.current_fight['fighter1_hp'] <= 0:
                    self.end_fight(fighter2['name'], 'knockout')
                    return
                elif self.current_fight['fighter2_hp'] <= 0:
                    self.end_fight(fighter1['name'], 'knockout')
                    return
                    
            # End of round
            self.fight_commentary.append(f"🔔 END OF ROUND {round_num}")
            time.sleep(2)
            
        # If no knockout, decide by points
        if self.current_fight['fighter1_hp'] > self.current_fight['fighter2_hp']:
            self.end_fight(fighter1['name'], 'decision')
        elif self.current_fight['fighter2_hp'] > self.current_fight['fighter1_hp']:
            self.end_fight(fighter2['name'], 'decision')
        else:
            self.end_fight('DRAW', 'draw')
            
    def generate_round_events(self, fighter1, fighter2, round_num):
        """Generate exciting round events"""
        events = []
        
        # Round start
        events.append({
            'commentary': f"🥊 ROUND {round_num} - FIGHT!",
            'crowd_reaction': 'eruption'
        })
        
        num_exchanges = random.randint(3, 7)
        
        for i in range(num_exchanges):
            # Determine attacker based on power levels and randomness
            if random.random() < 0.5 + (fighter1['power'] - fighter2['power']) / 400:
                attacker, defender = fighter1, fighter2
                target = 'fighter2'
                damage_key = 'damage_to_2'
            else:
                attacker, defender = fighter2, fighter1
                target = 'fighter1'
                damage_key = 'damage_to_1'
                
            # Generate attack
            move = random.choice(attacker['signature_moves'])
            damage = random.randint(8, 20)
            
            # Critical hit chance
            if random.random() < 0.2:
                damage *= 2
                event = {
                    'commentary': f"💥 CRITICAL HIT! {attacker['name']} lands a devastating {move} on {defender['name']} for {damage} damage!",
                    damage_key: damage,
                    'crowd_reaction': 'shock'
                }
            else:
                event = {
                    'commentary': f"🥊 {attacker['name']} connects with {move} dealing {damage} damage to {defender['name']}",
                    damage_key: damage
                }
                
            # Defense/counter chance
            if random.random() < 0.3:
                counter_damage = random.randint(5, 12)
                counter_key = 'damage_to_1' if target == 'fighter2' else 'damage_to_2'
                event[counter_key] = counter_damage
                event['commentary'] += f" - {defender['name']} counters for {counter_damage} damage!"
                
            events.append(event)
            
        return events
        
    def add_crowd_reaction(self, reaction_type):
        """Add crowd reactions"""
        reactions = {
            'eruption': ["🔥 YEAHHHHH!", "💥 AMAZING!", "🎉 INCREDIBLE!"],
            'shock': ["😱 OH MY GOD!", "🤯 UNBELIEVABLE!", "💀 BRUTAL!"],
            'excitement': ["👏 NICE HIT!", "💪 GOOD SHOT!", "🔥 KEEP GOING!"]
        }
        
        if reaction_type in reactions:
            for spectator in random.sample(self.live_crowd, min(10, len(self.live_crowd))):
                spectator['reactions'].append(random.choice(reactions[reaction_type]))
                
    def end_fight(self, winner_name, win_type):
        """End the fight and process results"""
        self.current_fight['status'] = 'finished'
        self.current_fight['winner'] = winner_name
        self.current_fight['win_type'] = win_type
        self.current_fight['duration'] = int(time.time() - self.current_fight['start_time'])
        
        if win_type == 'knockout':
            self.fight_commentary.append(f"🏆 KNOCKOUT! {winner_name} WINS!")
        elif win_type == 'decision':
            self.fight_commentary.append(f"🏆 WINNER BY DECISION: {winner_name}!")
        else:
            self.fight_commentary.append(f"🤝 IT'S A DRAW! What an incredible battle!")
            
        self.fight_commentary.append(f"⏱️ Fight duration: {self.current_fight['duration']} seconds")
        self.fight_commentary.append(f"💰 Total pot: ${self.current_fight['stakes']:,}")
        
        # Process bets (simulate)
        winning_bets = random.randint(20, 80)
        losing_bets = random.randint(30, 90)
        self.fight_commentary.append(f"🎰 Betting results: {winning_bets} winners, {losing_bets} losers")
        
        self.fight_running = False
        print(f"✅ Fight finished: {winner_name} wins by {win_type}")
        
    def get_fight_state(self):
        """Get current fight state for live updates"""
        if not self.current_fight:
            return {"active": False}
            
        return {
            "active": self.fight_running,
            "fight": self.current_fight,
            "commentary": self.fight_commentary[-10:],  # Last 10 comments
            "betting_odds": self.betting_odds,
            "crowd_size": len(self.live_crowd),
            "total_spectators": self.total_spectators + len(self.live_crowd),
            "live_bets": self.live_bets,
            "total_pot": self.current_fight['stakes'] if self.current_fight else 0
        }

# Global fight viewer
fight_viewer = MaxedFightViewer()

# Maxed out HTML viewer interface
HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>👁️ MAXED FIGHT VIEWER - Live AI Battles</title>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #000000, #1a0033, #330000);
            color: #fff;
            min-height: 100vh;
        }
        
        .arena-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                radial-gradient(circle at 30% 20%, rgba(255,0,0,0.1), transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(0,0,255,0.1), transparent 50%),
                repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,0.01) 52px);
            z-index: -1;
            animation: arenaFlex 15s ease-in-out infinite;
        }
        
        @keyframes arenaFlex {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.02); }
        }
        
        .header {
            background: rgba(0,0,0,0.9);
            border-bottom: 3px solid #ff0040;
            padding: 20px;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .title {
            font-size: 2.5em;
            color: #ff0040;
            text-shadow: 0 0 20px #ff0040;
            margin-bottom: 10px;
            animation: titlePulse 2s ease-in-out infinite;
        }
        
        @keyframes titlePulse {
            0%, 100% { text-shadow: 0 0 20px #ff0040; }
            50% { text-shadow: 0 0 40px #ff0040, 0 0 60px #ff0040; }
        }
        
        .viewer-dashboard {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
            min-height: 80vh;
        }
        
        .fight-arena {
            background: rgba(0,0,0,0.8);
            border: 3px solid #ff0040;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .fight-arena::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,0,64,0.1), transparent);
            animation: arenaScanlIne 6s ease-in-out infinite;
        }
        
        @keyframes arenaScanLine {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: -100%; }
        }
        
        .vs-display {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin: 30px 0;
        }
        
        .fighter-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid #00ffff;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            min-width: 200px;
        }
        
        .fighter-name {
            font-size: 1.3em;
            color: #00ffff;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .fighter-power {
            font-size: 1.5em;
            color: #ffff00;
            margin: 5px 0;
        }
        
        .hp-bar {
            width: 100%;
            height: 20px;
            background: #333;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
            border: 1px solid #fff;
        }
        
        .hp-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00);
            transition: width 0.5s ease;
        }
        
        .vs-text {
            font-size: 4em;
            color: #ff0040;
            font-weight: bold;
            text-shadow: 0 0 20px #ff0040;
            animation: vsFlash 1.5s ease-in-out infinite;
        }
        
        @keyframes vsFlash {
            0%, 100% { color: #ff0040; transform: scale(1); }
            50% { color: #ff6080; transform: scale(1.1); }
        }
        
        .fight-controls {
            margin: 30px 0;
        }
        
        .fight-btn {
            background: linear-gradient(135deg, #ff0040, #cc0033);
            color: white;
            border: none;
            padding: 20px 40px;
            border-radius: 30px;
            font-family: 'Courier New', monospace;
            font-size: 1.3em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            margin: 10px;
        }
        
        .fight-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 0 30px #ff0040;
        }
        
        .fight-btn:disabled {
            background: #666;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .commentary-panel {
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ff00;
            border-radius: 15px;
            padding: 20px;
        }
        
        .commentary-title {
            color: #00ff00;
            font-size: 1.5em;
            margin-bottom: 20px;
            text-align: center;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .commentary-feed {
            height: 400px;
            overflow-y: auto;
            background: rgba(0,0,0,0.9);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #00ff00;
        }
        
        .comment {
            background: rgba(0,255,0,0.05);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 8px;
            border-left: 3px solid #00ff00;
            animation: commentSlide 0.5s ease-out;
        }
        
        @keyframes commentSlide {
            0% { opacity: 0; transform: translateX(-20px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        
        .betting-panel {
            background: rgba(0,20,0,0.8);
            border: 2px solid #ffaa00;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .betting-title {
            color: #ffaa00;
            font-size: 1.3em;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .odds-display {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        
        .odds-item {
            text-align: center;
            background: rgba(255,170,0,0.1);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #ffaa00;
        }
        
        .odds-value {
            font-size: 1.5em;
            color: #ffaa00;
            font-weight: bold;
        }
        
        .live-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-item {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #fff;
        }
        
        .stat-value {
            font-size: 1.8em;
            color: #00ffff;
            font-weight: bold;
        }
        
        .fight-status {
            font-size: 1.2em;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255,0,64,0.2);
            border: 2px solid #ff0040;
            border-radius: 10px;
            text-align: center;
            color: #ff0040;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="arena-bg"></div>
    
    <div class="header">
        <div class="title">👁️ MAXED FIGHT VIEWER</div>
        <div>Live AI vs AI Battle Streaming • Real-Time Commentary • Interactive Betting</div>
    </div>
    
    <div class="viewer-dashboard">
        <!-- Fight Arena -->
        <div class="fight-arena">
            <h2 style="color: #ff0040; margin-bottom: 20px;">🥊 LIVE BATTLE ARENA</h2>
            
            <div class="fight-status" id="fightStatus">
                Ready to start epic AI battle
            </div>
            
            <div class="vs-display" id="vsDisplay">
                <div style="font-size: 1.5em; color: #fff;">
                    Click "START EPIC FIGHT" to begin!
                </div>
            </div>
            
            <div class="fight-controls">
                <button class="fight-btn" id="startFightBtn" onclick="startEpicFight()">
                    🔥 START EPIC FIGHT
                </button>
                <button class="fight-btn" id="autoFightBtn" onclick="toggleAutoFights()">
                    🤖 AUTO FIGHTS: OFF
                </button>
            </div>
            
            <div class="live-stats">
                <div class="stat-item">
                    <div class="stat-value" id="spectatorCount">1,247</div>
                    <div>Live Spectators</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="totalPot">$0</div>
                    <div>Total Pot</div>
                </div>
            </div>
        </div>
        
        <!-- Commentary and Betting -->
        <div>
            <div class="commentary-panel">
                <div class="commentary-title">🎤 LIVE COMMENTARY</div>
                <div class="commentary-feed" id="commentaryFeed">
                    <div class="comment">🎤 Welcome to the MAXED FIGHT VIEWER!</div>
                    <div class="comment">🥊 Premium AI vs AI battle streaming</div>
                    <div class="comment">🔥 Real-time commentary and crowd simulation</div>
                    <div class="comment">💰 Interactive betting with live odds</div>
                    <div class="comment">👁️ Start a fight to see the magic happen!</div>
                </div>
            </div>
            
            <div class="betting-panel">
                <div class="betting-title">💰 LIVE BETTING ODDS</div>
                <div class="odds-display" id="oddsDisplay">
                    <div style="text-align: center; color: #666;">
                        Start a fight to see betting odds
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let autoFights = false;
        let updateInterval;
        
        function startEpicFight() {
            const btn = document.getElementById('startFightBtn');
            btn.disabled = true;
            btn.textContent = '🔥 STARTING FIGHT...';
            
            fetch('/api/start-fight', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({})
            })
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('fightStatus').textContent = 'EPIC BATTLE IN PROGRESS!';
                    startLiveUpdates();
                } else {
                    btn.disabled = false;
                    btn.textContent = '🔥 START EPIC FIGHT';
                }
            });
        }
        
        function startLiveUpdates() {
            updateInterval = setInterval(updateFightState, 2000);
            updateFightState();
        }
        
        function updateFightState() {
            fetch('/api/fight-state')
                .then(r => r.json())
                .then(state => {
                    if (state.active) {
                        updateFightDisplay(state);
                        updateCommentary(state.commentary);
                        updateBettingOdds(state.betting_odds);
                        updateStats(state);
                    } else {
                        // Fight ended
                        document.getElementById('startFightBtn').disabled = false;
                        document.getElementById('startFightBtn').textContent = '🔥 START EPIC FIGHT';
                        document.getElementById('fightStatus').textContent = 'Ready for next battle';
                        
                        if (!autoFights) {
                            clearInterval(updateInterval);
                        } else {
                            // Auto start next fight
                            setTimeout(() => {
                                if (autoFights) startEpicFight();
                            }, 5000);
                        }
                    }
                });
        }
        
        function updateFightDisplay(state) {
            const fight = state.fight;
            const vsDisplay = document.getElementById('vsDisplay');
            
            vsDisplay.innerHTML = `
                <div class="fighter-card">
                    <div class="fighter-name">${fight.fighter1.name}</div>
                    <div class="fighter-power">Power: ${fight.fighter1.power}</div>
                    <div style="color: #aaa;">${fight.fighter1.style}</div>
                    <div class="hp-bar">
                        <div class="hp-fill" style="width: ${fight.fighter1_hp}%"></div>
                    </div>
                    <div>HP: ${fight.fighter1_hp}%</div>
                </div>
                <div class="vs-text">VS</div>
                <div class="fighter-card">
                    <div class="fighter-name">${fight.fighter2.name}</div>
                    <div class="fighter-power">Power: ${fight.fighter2.power}</div>
                    <div style="color: #aaa;">${fight.fighter2.style}</div>
                    <div class="hp-bar">
                        <div class="hp-fill" style="width: ${fight.fighter2_hp}%"></div>
                    </div>
                    <div>HP: ${fight.fighter2_hp}%</div>
                </div>
            `;
            
            document.getElementById('fightStatus').textContent = 
                `ROUND ${fight.round} - ${fight.status.toUpperCase()}`;
        }
        
        function updateCommentary(commentary) {
            const feed = document.getElementById('commentaryFeed');
            const newComments = commentary.slice(-10);
            
            feed.innerHTML = newComments.map(comment => 
                `<div class="comment">${comment}</div>`
            ).join('');
            
            feed.scrollTop = feed.scrollHeight;
        }
        
        function updateBettingOdds(odds) {
            if (!odds || Object.keys(odds).length === 0) return;
            
            const oddsDisplay = document.getElementById('oddsDisplay');
            oddsDisplay.innerHTML = `
                <div class="odds-item">
                    <div class="odds-value">${odds.fighter1?.toFixed(1)}x</div>
                    <div>Fighter 1</div>
                </div>
                <div class="odds-item">
                    <div class="odds-value">${odds.fighter2?.toFixed(1)}x</div>
                    <div>Fighter 2</div>
                </div>
            `;
        }
        
        function updateStats(state) {
            document.getElementById('spectatorCount').textContent = state.total_spectators?.toLocaleString() || '1,247';
            document.getElementById('totalPot').textContent = '$' + (state.total_pot?.toLocaleString() || '0');
        }
        
        function toggleAutoFights() {
            autoFights = !autoFights;
            const btn = document.getElementById('autoFightBtn');
            btn.textContent = autoFights ? '🤖 AUTO FIGHTS: ON' : '🤖 AUTO FIGHTS: OFF';
            
            if (autoFights && !document.getElementById('startFightBtn').disabled) {
                startEpicFight();
            }
        }
        
        // Initialize
        console.log('👁️ Maxed Fight Viewer initialized');
    </script>
</body>
</html>
'''

class ViewerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML.encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(content_length).decode())
        
        if self.path == '/api/start-fight':
            response = fight_viewer.start_epic_fight()
            
        elif self.path == '/api/fight-state':
            response = fight_viewer.get_fight_state()
            
        else:
            response = {'error': 'Unknown endpoint'}
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def do_GET(self):
        if self.path == '/api/fight-state':
            response = fight_viewer.get_fight_state()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML.encode())
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    # Kill existing processes
    import subprocess
    subprocess.run(['pkill', '-f', 'python3.*8080'], capture_output=True)
    time.sleep(2)
    
    server = HTTPServer(('localhost', 8080), ViewerHandler)
    
    print("\n👁️ MAXED FIGHT VIEWER IS LIVE!")
    print("=" * 80)
    print("🌐 Access: http://localhost:8080")
    print("\n🥊 MAXED VIEWING FEATURES:")
    print("  ✅ Live AI vs AI battle streaming")
    print("  ✅ Real-time fight commentary")
    print("  ✅ Visual HP bars and damage")
    print("  ✅ Interactive betting odds")
    print("  ✅ Live crowd simulation")
    print("  ✅ Epic fighter showcases")
    print("  ✅ Auto-fight mode")
    print("  ✅ Round-by-round action")
    print("\n🔥 WATCH BATTLES LIKE A REAL SPECTATOR!")
    print("Click 'START EPIC FIGHT' to see legendary AI fighters battle!")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Fight viewer shutting down...")
        fight_viewer.db.close()