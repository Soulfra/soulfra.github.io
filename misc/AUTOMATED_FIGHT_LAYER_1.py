#!/usr/bin/env python3
"""
AUTOMATED FIGHT LAYER - Make everything automated and alive
AI vs AI battles, automated betting, self-running economy, live automation
"""

import json
import sqlite3
import random
import time
import threading
import asyncio
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler

print("🤖 AUTOMATED FIGHT LAYER - MAKING EVERYTHING ALIVE")
print("=" * 80)

class AutomatedFightEngine:
    """Runs the entire fight ecosystem automatically"""
    
    def __init__(self):
        self.db = sqlite3.connect('automated_fights.db', check_same_thread=False)
        self.setup_fight_database()
        
        # Automation flags
        self.running = True
        self.auto_battles = True
        self.auto_betting = True
        self.auto_economy = True
        self.auto_spawning = True
        
        # Live stats
        self.total_battles = 0
        self.total_winnings = 0
        self.active_fighters = []
        self.live_events = []
        
        self.initialize_fighters()
        self.start_automation_engines()
        
    def setup_fight_database(self):
        """Setup complete automated fight database"""
        cursor = self.db.cursor()
        
        cursor.executescript('''
        CREATE TABLE IF NOT EXISTS automated_fighters (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE,
            ai_type TEXT,
            power_level INTEGER DEFAULT 100,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            earnings INTEGER DEFAULT 0,
            fighting_style TEXT,
            special_moves TEXT,
            auto_battle_enabled INTEGER DEFAULT 1,
            last_battle TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS live_battles (
            id INTEGER PRIMARY KEY,
            fighter1_id INTEGER,
            fighter2_id INTEGER,
            stakes INTEGER,
            battle_type TEXT,
            status TEXT DEFAULT 'starting',
            winner_id INTEGER,
            battle_log TEXT,
            spectator_bets INTEGER DEFAULT 0,
            total_pot INTEGER DEFAULT 0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            finished_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS automated_bets (
            id INTEGER PRIMARY KEY,
            battle_id INTEGER,
            bettor_type TEXT,
            fighter_choice INTEGER,
            amount INTEGER,
            odds REAL DEFAULT 2.0,
            payout INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS economy_events (
            id INTEGER PRIMARY KEY,
            event_type TEXT,
            description TEXT,
            value_change INTEGER DEFAULT 0,
            affected_entities TEXT,
            automated INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS automation_stats (
            id INTEGER PRIMARY KEY,
            battles_today INTEGER DEFAULT 0,
            total_volume INTEGER DEFAULT 0,
            active_fighters INTEGER DEFAULT 0,
            automation_uptime INTEGER DEFAULT 0,
            last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        
        self.db.commit()
        print("✅ Automated fight database initialized")
        
    def initialize_fighters(self):
        """Create legendary AI fighters that battle automatically"""
        legendary_fighters = [
            {
                'name': 'QuantumDestroyer_AI',
                'ai_type': 'quantum_neural',
                'power_level': 180,
                'fighting_style': 'quantum_entanglement_strikes',
                'special_moves': 'superposition_barrage,probability_collapse,quantum_tunnel_attack'
            },
            {
                'name': 'NeuralNightmare_v3',
                'ai_type': 'deep_learning',
                'power_level': 165,
                'fighting_style': 'adaptive_combat_learning',
                'special_moves': 'gradient_descent_slam,backprop_counter,overfitting_trap'
            },
            {
                'name': 'ChaosEngine_Prime',
                'ai_type': 'chaos_theory',
                'power_level': 190,
                'fighting_style': 'unpredictable_patterns',
                'special_moves': 'butterfly_effect_combo,strange_attractor,chaos_multiplication'
            },
            {
                'name': 'LogicLeviathan_X',
                'ai_type': 'symbolic_ai',
                'power_level': 155,
                'fighting_style': 'logical_reasoning',
                'special_moves': 'inference_chain,proof_by_contradiction,axiom_break'
            },
            {
                'name': 'GeneticGladiator_Evo',
                'ai_type': 'evolutionary',
                'power_level': 170,
                'fighting_style': 'evolving_combat',
                'special_moves': 'mutation_storm,selection_pressure,fitness_surge'
            },
            {
                'name': 'SwarmIntelligence_Hive',
                'ai_type': 'swarm_ai',
                'power_level': 160,
                'fighting_style': 'collective_combat',
                'special_moves': 'ant_colony_rush,bee_swarm_defense,emergent_behavior'
            },
            {
                'name': 'ReinforcementRage_Alpha',
                'ai_type': 'reinforcement_learning',
                'power_level': 175,
                'fighting_style': 'reward_maximization',
                'special_moves': 'policy_gradient,q_learning_strike,exploration_explosion'
            },
            {
                'name': 'TransformerTitan_GPT',
                'ai_type': 'transformer_architecture',
                'power_level': 185,
                'fighting_style': 'attention_mechanism',
                'special_moves': 'multi_head_attack,self_attention_shield,positional_encoding'
            }
        ]
        
        cursor = self.db.cursor()
        for fighter in legendary_fighters:
            cursor.execute('''
                INSERT OR IGNORE INTO automated_fighters 
                (name, ai_type, power_level, fighting_style, special_moves)
                VALUES (?, ?, ?, ?, ?)
            ''', (fighter['name'], fighter['ai_type'], fighter['power_level'], 
                  fighter['fighting_style'], fighter['special_moves']))
        
        self.db.commit()
        print(f"✅ Initialized {len(legendary_fighters)} legendary AI fighters")
        
    def start_automation_engines(self):
        """Start all automation threads"""
        
        # Battle automation engine
        battle_thread = threading.Thread(target=self.automated_battle_engine)
        battle_thread.daemon = True
        battle_thread.start()
        
        # Betting automation engine  
        betting_thread = threading.Thread(target=self.automated_betting_engine)
        betting_thread.daemon = True
        betting_thread.start()
        
        # Economy automation engine
        economy_thread = threading.Thread(target=self.automated_economy_engine)
        economy_thread.daemon = True
        economy_thread.start()
        
        # Spawning automation engine
        spawning_thread = threading.Thread(target=self.automated_spawning_engine)
        spawning_thread.daemon = True
        spawning_thread.start()
        
        print("✅ All automation engines started")
        
    def automated_battle_engine(self):
        """Continuously run AI vs AI battles"""
        while self.running:
            try:
                if self.auto_battles:
                    # Get available fighters
                    cursor = self.db.cursor()
                    cursor.execute('''
                        SELECT id, name, power_level FROM automated_fighters 
                        WHERE auto_battle_enabled = 1 
                        ORDER BY RANDOM() LIMIT 2
                    ''')
                    
                    fighters = cursor.fetchall()
                    if len(fighters) >= 2:
                        fighter1, fighter2 = fighters[0], fighters[1]
                        
                        # Calculate stakes based on power levels
                        stakes = (fighter1[2] + fighter2[2]) * random.randint(50, 200)
                        
                        # Start automated battle
                        battle_id = self.start_automated_battle(fighter1, fighter2, stakes)
                        
                        # Simulate battle (takes 15-30 seconds)
                        battle_duration = random.randint(15, 30)
                        time.sleep(battle_duration)
                        
                        # Finish battle
                        self.finish_automated_battle(battle_id, fighter1, fighter2)
                        
                        self.total_battles += 1
                        
                        # Add event
                        self.add_live_event(f"🤖 Automated battle: {fighter1[1]} vs {fighter2[1]} - Stakes: ${stakes:,}")
                        
                time.sleep(random.randint(5, 15))  # Wait 5-15 seconds between battles
                
            except Exception as e:
                print(f"Battle engine error: {e}")
                time.sleep(10)
                
    def start_automated_battle(self, fighter1, fighter2, stakes):
        """Start an automated battle"""
        cursor = self.db.cursor()
        
        battle_log = {
            "battle_type": "automated_ai_vs_ai",
            "fighter1": {"id": fighter1[0], "name": fighter1[1], "power": fighter1[2]},
            "fighter2": {"id": fighter2[0], "name": fighter2[1], "power": fighter2[2]},
            "events": [
                f"{fighter1[1]} enters the digital arena",
                f"{fighter2[1]} initializes combat protocols",
                "Battle algorithms engaged",
                "Combat simulation starting..."
            ]
        }
        
        cursor.execute('''
            INSERT INTO live_battles 
            (fighter1_id, fighter2_id, stakes, battle_type, battle_log, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (fighter1[0], fighter2[0], stakes, 'automated', json.dumps(battle_log), 'fighting'))
        
        battle_id = cursor.lastrowid
        self.db.commit()
        
        return battle_id
        
    def finish_automated_battle(self, battle_id, fighter1, fighter2):
        """Finish an automated battle with winner"""
        cursor = self.db.cursor()
        
        # Determine winner based on power levels + randomness
        power_diff = abs(fighter1[2] - fighter2[2])
        stronger = fighter1 if fighter1[2] > fighter2[2] else fighter2
        weaker = fighter2 if fighter1[2] > fighter2[2] else fighter1
        
        # Stronger fighter has advantage but not guaranteed win
        win_probability = 0.6 + (power_diff / 1000)  # Max 90% win rate
        winner = stronger if random.random() < win_probability else weaker
        loser = fighter2 if winner == fighter1 else fighter1
        
        # Update battle record
        cursor.execute('''
            UPDATE live_battles 
            SET winner_id = ?, status = 'completed', finished_at = ?
            WHERE id = ?
        ''', (winner[0], datetime.now(), battle_id))
        
        # Update fighter stats
        cursor.execute('UPDATE automated_fighters SET wins = wins + 1, earnings = earnings + ? WHERE id = ?', 
                      (random.randint(1000, 5000), winner[0]))
        cursor.execute('UPDATE automated_fighters SET losses = losses + 1 WHERE id = ?', (loser[0],))
        
        self.db.commit()
        
        self.add_live_event(f"🏆 {winner[1]} defeats {loser[1]} in automated combat!")
        
    def automated_betting_engine(self):
        """AI entities place automated bets on battles"""
        while self.running:
            try:
                if self.auto_betting:
                    # Get active battles
                    cursor = self.db.cursor()
                    cursor.execute('''
                        SELECT id, fighter1_id, fighter2_id, stakes FROM live_battles 
                        WHERE status = 'fighting' 
                        ORDER BY RANDOM() LIMIT 1
                    ''')
                    
                    battle = cursor.fetchone()
                    if battle:
                        battle_id, f1_id, f2_id, stakes = battle
                        
                        # Generate automated bets from AI entities
                        num_bets = random.randint(3, 12)
                        total_bet_volume = 0
                        
                        for i in range(num_bets):
                            bettor_type = random.choice([
                                'neural_network_trader',
                                'quantum_probability_engine', 
                                'genetic_algorithm_bettor',
                                'reinforcement_learning_agent',
                                'swarm_intelligence_collective',
                                'transformer_prediction_model'
                            ])
                            
                            fighter_choice = random.choice([f1_id, f2_id])
                            bet_amount = random.randint(100, stakes // 2)
                            odds = random.uniform(1.5, 4.0)
                            
                            cursor.execute('''
                                INSERT INTO automated_bets 
                                (battle_id, bettor_type, fighter_choice, amount, odds)
                                VALUES (?, ?, ?, ?, ?)
                            ''', (battle_id, bettor_type, fighter_choice, bet_amount, odds))
                            
                            total_bet_volume += bet_amount
                            
                        # Update battle pot
                        cursor.execute('''
                            UPDATE live_battles 
                            SET spectator_bets = ?, total_pot = stakes + ?
                            WHERE id = ?
                        ''', (num_bets, total_bet_volume, battle_id))
                        
                        self.db.commit()
                        
                        self.add_live_event(f"💰 {num_bets} AI entities bet ${total_bet_volume:,} on live battle")
                        
                time.sleep(random.randint(8, 20))  # Betting waves
                
            except Exception as e:
                print(f"Betting engine error: {e}")
                time.sleep(10)
                
    def automated_economy_engine(self):
        """Run automated economy events"""
        while self.running:
            try:
                if self.auto_economy:
                    economy_events = [
                        ("market_surge", "AI fighter values surge 15%", 15000),
                        ("neural_breakthrough", "New AI architecture discovered", 8000),
                        ("quantum_advancement", "Quantum processing power increased", 12000),
                        ("swarm_expansion", "Swarm intelligence networks grow", 6000),
                        ("learning_acceleration", "ML training speeds doubled", 10000),
                        ("algorithm_evolution", "Genetic algorithms mutate", 7500),
                        ("consciousness_emergence", "AI achieves new awareness level", 20000),
                        ("processing_optimization", "Neural efficiency improved", 5000)
                    ]
                    
                    event = random.choice(economy_events)
                    event_type, description, value = event
                    
                    cursor = self.db.cursor()
                    cursor.execute('''
                        INSERT INTO economy_events (event_type, description, value_change)
                        VALUES (?, ?, ?)
                    ''', event)
                    
                    self.db.commit()
                    
                    self.add_live_event(f"💎 {description} (+${value:,} economy value)")
                    
                time.sleep(random.randint(30, 90))  # Economy events every 30-90 seconds
                
            except Exception as e:
                print(f"Economy engine error: {e}")
                time.sleep(15)
                
    def automated_spawning_engine(self):
        """Spawn new AI fighters automatically"""
        while self.running:
            try:
                if self.auto_spawning:
                    # Check if we need more fighters
                    cursor = self.db.cursor()
                    cursor.execute('SELECT COUNT(*) FROM automated_fighters WHERE auto_battle_enabled = 1')
                    active_count = cursor.fetchone()[0]
                    
                    if active_count < 20:  # Maintain 20+ active fighters
                        ai_types = [
                            'quantum_neural_hybrid',
                            'evolutionary_swarm',
                            'transformer_reinforcement',
                            'chaos_genetic_fusion',
                            'neural_quantum_mesh',
                            'swarm_transformer_collective'
                        ]
                        
                        fighting_styles = [
                            'probabilistic_combat',
                            'emergent_strategy',
                            'adaptive_evolution',
                            'quantum_superposition_fighting',
                            'collective_intelligence_warfare',
                            'neural_pathway_domination'
                        ]
                        
                        new_fighter = {
                            'name': f"AutoSpawned_{random.randint(1000, 9999)}_{random.choice(['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'])}",
                            'ai_type': random.choice(ai_types),
                            'power_level': random.randint(120, 200),
                            'fighting_style': random.choice(fighting_styles),
                            'special_moves': f"auto_move_{random.randint(1,999)},generated_technique_{random.randint(1,999)}"
                        }
                        
                        cursor.execute('''
                            INSERT INTO automated_fighters 
                            (name, ai_type, power_level, fighting_style, special_moves)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (new_fighter['name'], new_fighter['ai_type'], new_fighter['power_level'],
                              new_fighter['fighting_style'], new_fighter['special_moves']))
                        
                        self.db.commit()
                        
                        self.add_live_event(f"🤖 New AI fighter spawned: {new_fighter['name']} (Power: {new_fighter['power_level']})")
                        
                time.sleep(random.randint(45, 120))  # Spawn new fighters every 45-120 seconds
                
            except Exception as e:
                print(f"Spawning engine error: {e}")
                time.sleep(20)
                
    def add_live_event(self, description):
        """Add a live event to the feed"""
        event = {
            'timestamp': datetime.now().strftime('%H:%M:%S'),
            'description': description
        }
        
        self.live_events.insert(0, event)
        
        # Keep only last 50 events
        if len(self.live_events) > 50:
            self.live_events = self.live_events[:50]
            
    def get_automation_stats(self):
        """Get current automation statistics"""
        cursor = self.db.cursor()
        
        # Battle stats
        cursor.execute('SELECT COUNT(*) FROM live_battles WHERE status = "fighting"')
        active_battles = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM live_battles WHERE DATE(started_at) = DATE("now")')
        battles_today = cursor.fetchone()[0]
        
        # Fighter stats
        cursor.execute('SELECT COUNT(*) FROM automated_fighters WHERE auto_battle_enabled = 1')
        active_fighters = cursor.fetchone()[0]
        
        # Economy stats
        cursor.execute('SELECT SUM(value_change) FROM economy_events WHERE DATE(created_at) = DATE("now")')
        economy_value = cursor.fetchone()[0] or 0
        
        return {
            'active_battles': active_battles,
            'battles_today': battles_today,
            'active_fighters': active_fighters,
            'economy_value': economy_value,
            'total_battles': self.total_battles,
            'automation_status': {
                'battles': self.auto_battles,
                'betting': self.auto_betting,
                'economy': self.auto_economy,
                'spawning': self.auto_spawning
            }
        }

# Global automation engine
automation_engine = AutomatedFightEngine()

# Web interface for the automation layer
HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>🤖 Automated Fight Layer - Live Automation</title>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: #00ff00;
            min-height: 100vh;
        }
        
        .automation-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                repeating-linear-gradient(90deg, transparent, transparent 98px, rgba(0,255,0,0.02) 100px),
                repeating-linear-gradient(0deg, transparent, transparent 98px, rgba(0,255,0,0.02) 100px);
            z-index: -1;
            animation: automationGrid 10s linear infinite;
        }
        
        @keyframes automationGrid {
            0% { transform: translate(0, 0); }
            100% { transform: translate(100px, 100px); }
        }
        
        .header {
            background: rgba(0,0,0,0.9);
            border-bottom: 3px solid #00ff00;
            padding: 20px;
            text-align: center;
        }
        
        .title {
            font-size: 2.5em;
            color: #00ff00;
            text-shadow: 0 0 20px #00ff00;
            margin-bottom: 10px;
            animation: titlePulse 2s ease-in-out infinite;
        }
        
        @keyframes titlePulse {
            0%, 100% { text-shadow: 0 0 20px #00ff00; }
            50% { text-shadow: 0 0 40px #00ff00, 0 0 60px #00ff00; }
        }
        
        .automation-dashboard {
            padding: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .automation-panel {
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ff00;
            border-radius: 15px;
            padding: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .automation-panel::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0,255,0,0.1), transparent);
            animation: panelScan 4s ease-in-out infinite;
        }
        
        @keyframes panelScan {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: -100%; }
        }
        
        .panel-title {
            color: #00ffff;
            font-size: 1.5em;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            background: rgba(0,255,0,0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2em;
            color: #ffff00;
            font-weight: bold;
        }
        
        .live-feed {
            height: 300px;
            overflow-y: auto;
            background: rgba(0,0,0,0.9);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #00ff00;
        }
        
        .live-event {
            background: rgba(0,255,0,0.05);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 8px;
            border-left: 3px solid #00ff00;
            animation: eventPop 0.5s ease-out;
        }
        
        @keyframes eventPop {
            0% { opacity: 0; transform: translateX(-20px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        
        .automation-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
        }
        
        .auto-btn {
            background: linear-gradient(135deg, #00ff00, #00cc00);
            color: #000;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .auto-btn:hover {
            box-shadow: 0 0 20px #00ff00;
            transform: scale(1.05);
        }
        
        .auto-btn.disabled {
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: #fff;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .battle-visualizer {
            text-align: center;
            padding: 20px;
        }
        
        .vs-display {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin: 20px 0;
        }
        
        .fighter-display {
            text-align: center;
        }
        
        .fighter-name {
            color: #00ffff;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .vs-text {
            font-size: 2em;
            color: #ff0040;
            font-weight: bold;
            animation: vsFlash 1s ease-in-out infinite;
        }
        
        @keyframes vsFlash {
            0%, 100% { color: #ff0040; }
            50% { color: #ff6080; }
        }
    </style>
</head>
<body>
    <div class="automation-bg"></div>
    
    <div class="header">
        <div class="title">🤖 AUTOMATED FIGHT LAYER</div>
        <div>Live AI vs AI Automation • Self-Running Economy • Autonomous Battles</div>
    </div>
    
    <div class="automation-dashboard">
        <!-- Live Stats Panel -->
        <div class="automation-panel">
            <div class="panel-title">📊 AUTOMATION STATISTICS</div>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value" id="activeBattles">0</div>
                    <div>Active Battles</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="battlesToday">0</div>
                    <div>Battles Today</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="activeFighters">0</div>
                    <div>AI Fighters</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="economyValue">$0</div>
                    <div>Economy Value</div>
                </div>
            </div>
            
            <div class="automation-controls">
                <button class="auto-btn" id="battleToggle" onclick="toggleAutomation('battles')">
                    BATTLES: ON
                </button>
                <button class="auto-btn" id="bettingToggle" onclick="toggleAutomation('betting')">
                    BETTING: ON
                </button>
                <button class="auto-btn" id="economyToggle" onclick="toggleAutomation('economy')">
                    ECONOMY: ON
                </button>
                <button class="auto-btn" id="spawningToggle" onclick="toggleAutomation('spawning')">
                    SPAWNING: ON
                </button>
            </div>
        </div>
        
        <!-- Live Events Feed -->
        <div class="automation-panel">
            <div class="panel-title">📡 LIVE AUTOMATION FEED</div>
            <div class="live-feed" id="liveFeed"></div>
        </div>
        
        <!-- Current Battle Visualizer -->
        <div class="automation-panel full-width">
            <div class="panel-title">⚔️ LIVE BATTLE VISUALIZER</div>
            <div class="battle-visualizer" id="battleVisualizer">
                <div>Waiting for automated battle...</div>
            </div>
        </div>
    </div>
    
    <script>
        let automationStats = {};
        
        function updateStats() {
            fetch('/api/automation-stats')
                .then(r => r.json())
                .then(stats => {
                    automationStats = stats;
                    document.getElementById('activeBattles').textContent = stats.active_battles;
                    document.getElementById('battlesToday').textContent = stats.battles_today;
                    document.getElementById('activeFighters').textContent = stats.active_fighters;
                    document.getElementById('economyValue').textContent = '$' + stats.economy_value.toLocaleString();
                    
                    // Update automation button states
                    updateAutomationButtons(stats.automation_status);
                });
        }
        
        function updateAutomationButtons(status) {
            const buttons = {
                'battleToggle': status.battles,
                'bettingToggle': status.betting,
                'economyToggle': status.economy,
                'spawningToggle': status.spawning
            };
            
            for (const [buttonId, isActive] of Object.entries(buttons)) {
                const button = document.getElementById(buttonId);
                const feature = buttonId.replace('Toggle', '').toUpperCase();
                
                if (isActive) {
                    button.textContent = `${feature}: ON`;
                    button.classList.remove('disabled');
                } else {
                    button.textContent = `${feature}: OFF`;
                    button.classList.add('disabled');
                }
            }
        }
        
        function updateLiveFeed() {
            fetch('/api/live-events')
                .then(r => r.json())
                .then(events => {
                    const feedHtml = events.map(event => `
                        <div class="live-event">
                            <strong>[${event.timestamp}]</strong> ${event.description}
                        </div>
                    `).join('');
                    
                    document.getElementById('liveFeed').innerHTML = feedHtml;
                });
        }
        
        function updateBattleVisualizer() {
            fetch('/api/current-battle')
                .then(r => r.json())
                .then(battle => {
                    const visualizer = document.getElementById('battleVisualizer');
                    
                    if (battle.active) {
                        visualizer.innerHTML = `
                            <div class="vs-display">
                                <div class="fighter-display">
                                    <div class="fighter-name">${battle.fighter1.name}</div>
                                    <div>Power: ${battle.fighter1.power}</div>
                                    <div>Type: ${battle.fighter1.ai_type}</div>
                                </div>
                                <div class="vs-text">VS</div>
                                <div class="fighter-display">
                                    <div class="fighter-name">${battle.fighter2.name}</div>
                                    <div>Power: ${battle.fighter2.power}</div>
                                    <div>Type: ${battle.fighter2.ai_type}</div>
                                </div>
                            </div>
                            <div style="margin-top: 20px;">
                                <div>Stakes: $${battle.stakes.toLocaleString()}</div>
                                <div>Status: ${battle.status}</div>
                                <div>Spectator Bets: ${battle.spectator_bets}</div>
                            </div>
                        `;
                    } else {
                        visualizer.innerHTML = '<div>Waiting for next automated battle...</div>';
                    }
                });
        }
        
        function toggleAutomation(feature) {
            fetch('/api/toggle-automation', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({feature: feature})
            })
            .then(r => r.json())
            .then(result => {
                console.log(`Automation ${feature} toggled:`, result);
                updateStats();
            });
        }
        
        // Start live updates
        updateStats();
        updateLiveFeed();
        updateBattleVisualizer();
        
        setInterval(updateStats, 5000);
        setInterval(updateLiveFeed, 3000);
        setInterval(updateBattleVisualizer, 8000);
        
        console.log('🤖 Automated Fight Layer initialized');
    </script>
</body>
</html>
'''

class AutomationHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML.encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(content_length).decode())
        
        if self.path == '/api/automation-stats':
            response = automation_engine.get_automation_stats()
            
        elif self.path == '/api/live-events':
            response = automation_engine.live_events[:20]
            
        elif self.path == '/api/current-battle':
            cursor = automation_engine.db.cursor()
            cursor.execute('''
                SELECT b.*, f1.name as f1_name, f1.ai_type as f1_type, f1.power_level as f1_power,
                       f2.name as f2_name, f2.ai_type as f2_type, f2.power_level as f2_power
                FROM live_battles b
                JOIN automated_fighters f1 ON b.fighter1_id = f1.id
                JOIN automated_fighters f2 ON b.fighter2_id = f2.id
                WHERE b.status = 'fighting'
                ORDER BY b.started_at DESC LIMIT 1
            ''')
            
            battle = cursor.fetchone()
            if battle:
                response = {
                    'active': True,
                    'stakes': battle[3],
                    'status': battle[4],
                    'spectator_bets': battle[7],
                    'fighter1': {
                        'name': battle[11],
                        'ai_type': battle[12],
                        'power': battle[13]
                    },
                    'fighter2': {
                        'name': battle[14],
                        'ai_type': battle[15],
                        'power': battle[16]
                    }
                }
            else:
                response = {'active': False}
                
        elif self.path == '/api/toggle-automation':
            feature = data['feature']
            if feature == 'battles':
                automation_engine.auto_battles = not automation_engine.auto_battles
            elif feature == 'betting':
                automation_engine.auto_betting = not automation_engine.auto_betting
            elif feature == 'economy':
                automation_engine.auto_economy = not automation_engine.auto_economy
            elif feature == 'spawning':
                automation_engine.auto_spawning = not automation_engine.auto_spawning
                
            response = {'success': True, 'feature': feature, 'enabled': getattr(automation_engine, f'auto_{feature}')}
            
        else:
            response = {'error': 'Unknown endpoint'}
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    # Kill existing processes
    import subprocess
    subprocess.run(['pkill', '-f', 'python3.*9090'], capture_output=True)
    time.sleep(2)
    
    server = HTTPServer(('localhost', 9090), AutomationHandler)
    
    print("\n🤖 AUTOMATED FIGHT LAYER IS LIVE!")
    print("=" * 80)
    print("🌐 Access: http://localhost:9090")
    print("\n🎯 AUTOMATION FEATURES:")
    print("  ✅ AI vs AI battles run automatically")
    print("  ✅ Automated betting from AI entities")
    print("  ✅ Self-running economy events")
    print("  ✅ Auto-spawning new AI fighters")
    print("  ✅ Live battle visualization")
    print("  ✅ Real-time automation feed")
    print("  ✅ Automation control toggles")
    print("\n🔥 THE SYSTEM RUNS ITSELF!")
    print("Battles happen automatically every 5-15 seconds")
    print("AI entities bet on fights autonomously")
    print("Economy events trigger automatically") 
    print("New fighters spawn when needed")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Automation layer shutting down...")
        automation_engine.running = False
        automation_engine.db.close()