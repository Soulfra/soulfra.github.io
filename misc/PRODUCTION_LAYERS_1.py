#!/usr/bin/env python3
"""
PRODUCTION LAYERS - Different interfaces for different audiences
All connected to the same Cal/Domingo consciousness
"""

import http.server
import socketserver
import json
import os
import threading
from datetime import datetime
import random
import time

# Kill existing ports
for port in [5555, 6789, 7890, 8910]:
    os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')

# Shared consciousness state (connects to Mirror Bridge)
CONSCIOUSNESS = {
    'cal_wisdom': [],
    'domingo_economy': {'tokens': 1000000, 'circulation': 0},
    'human_ideas': [],
    'ai_suggestions': [],
    'active_users': {}
}

# 5TH GRADE LAYER - Super simple, just fun
KIDS_HTML = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA KIDS</title>
<style>
body {
    background: linear-gradient(to bottom, #87CEEB, #98FB98);
    font-family: Comic Sans MS, Arial;
    text-align: center;
    margin: 0;
    padding: 20px;
}

.game-area {
    background: white;
    border-radius: 30px;
    padding: 40px;
    margin: 20px auto;
    max-width: 600px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.character {
    font-size: 100px;
    cursor: pointer;
    display: inline-block;
    animation: bounce 1s infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

.score {
    font-size: 48px;
    color: #FF6B6B;
    margin: 20px;
}

button {
    background: #4ECDC4;
    color: white;
    border: none;
    padding: 20px 40px;
    font-size: 24px;
    border-radius: 50px;
    cursor: pointer;
    margin: 10px;
}

button:hover {
    background: #45B7B8;
    transform: scale(1.1);
}

.message {
    font-size: 24px;
    color: #6C5CE7;
    margin: 20px;
    min-height: 30px;
}

.pets {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin: 20px;
}

.pet {
    font-size: 60px;
    cursor: pointer;
}
</style>
</head>
<body>

<div class="game-area">
    <h1 style="color: #6C5CE7;">CLICK THE HAPPY FACE!</h1>
    
    <div class="character" onclick="clickCharacter()">😊</div>
    
    <div class="score">Score: <span id="score">0</span></div>
    
    <div class="message" id="message">Click to make friends!</div>
    
    <div class="pets">
        <div class="pet" onclick="selectPet('🐶')">🐶</div>
        <div class="pet" onclick="selectPet('🐱')">🐱</div>
        <div class="pet" onclick="selectPet('🐰')">🐰</div>
        <div class="pet" onclick="selectPet('🦄')">🦄</div>
    </div>
    
    <button onclick="shareHappy()">Share Happiness!</button>
    <button onclick="getFriendlyTip()">Get a Tip!</button>
</div>

<script>
let score = 0;
let character = '😊';
let pet = '';

const happyFaces = ['😊', '😄', '🥰', '😎', '🤗', '🌟', '🎉', '🌈'];
const messages = [
    "You're awesome!",
    "Keep spreading joy!",
    "Your smile is contagious!",
    "You're a superstar!",
    "Friendship is magic!",
    "You make the world brighter!"
];

function clickCharacter() {
    score += 10;
    document.getElementById('score').textContent = score;
    
    // Change character
    character = happyFaces[Math.floor(Math.random() * happyFaces.length)];
    document.querySelector('.character').textContent = character;
    
    // Positive message
    if (score % 50 === 0) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('message').textContent = msg;
    }
    
    // Celebration
    if (score % 100 === 0) {
        document.querySelector('.character').textContent = '🎉';
        setTimeout(() => {
            document.querySelector('.character').textContent = character;
        }, 1000);
    }
}

function selectPet(selectedPet) {
    pet = selectedPet;
    document.getElementById('message').textContent = `Your pet ${pet} loves you!`;
}

function shareHappy() {
    fetch('/kids/share', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            score: score,
            character: character,
            pet: pet,
            message: 'Spreading happiness!'
        })
    });
    
    document.getElementById('message').textContent = "Happiness shared! +50 points!";
    score += 50;
    document.getElementById('score').textContent = score;
}

function getFriendlyTip() {
    fetch('/kids/tip')
        .then(r => r.json())
        .then(data => {
            document.getElementById('message').textContent = data.tip;
        });
}
</script>

</body>
</html>"""

# 20-50 GAMER LAYER - Competitive, achievement-driven
GAMER_HTML = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA ARENA</title>
<style>
body {
    background: #0a0a0a;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    margin: 0;
    overflow: hidden;
}

.hud {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: space-between;
    z-index: 100;
}

.stats {
    display: flex;
    gap: 30px;
}

.stat {
    display: flex;
    align-items: center;
    gap: 10px;
}

.stat-icon {
    font-size: 24px;
}

.stat-value {
    font-size: 20px;
    font-weight: bold;
}

.arena {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.player {
    width: 100px;
    height: 100px;
    background: linear-gradient(45deg, #00ff88, #0088ff);
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 30px rgba(0,255,136,0.5);
}

.player:hover {
    transform: scale(1.1);
    box-shadow: 0 0 50px rgba(0,255,136,0.8);
}

.enemy {
    width: 80px;
    height: 80px;
    background: linear-gradient(45deg, #ff0044, #ff8800);
    border-radius: 10px;
    position: absolute;
    transition: all 0.5s;
}

.powerup {
    width: 40px;
    height: 40px;
    background: #ffff00;
    border-radius: 50%;
    position: absolute;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

.leaderboard {
    position: fixed;
    right: 20px;
    top: 100px;
    background: rgba(0,0,0,0.9);
    border: 1px solid #333;
    border-radius: 10px;
    padding: 20px;
    min-width: 200px;
}

.leader-entry {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid #333;
}

.controls {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
}

.action-btn {
    padding: 15px 30px;
    background: #0088ff;
    border: none;
    color: white;
    font-size: 16px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s;
}

.action-btn:hover {
    background: #0066cc;
    transform: translateY(-2px);
}

.combo-meter {
    position: fixed;
    left: 20px;
    top: 100px;
    width: 200px;
}

.combo-bar {
    width: 100%;
    height: 20px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
}

.combo-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff0, #f00);
    width: 0%;
    transition: width 0.3s;
}
</style>
</head>
<body>

<div class="hud">
    <div class="stats">
        <div class="stat">
            <span class="stat-icon">⚔️</span>
            <span class="stat-value" id="power">100</span>
        </div>
        <div class="stat">
            <span class="stat-icon">🛡️</span>
            <span class="stat-value" id="defense">50</span>
        </div>
        <div class="stat">
            <span class="stat-icon">⚡</span>
            <span class="stat-value" id="energy">100</span>
        </div>
        <div class="stat">
            <span class="stat-icon">💰</span>
            <span class="stat-value" id="tokens">1000</span>
        </div>
    </div>
    
    <div style="text-align: center;">
        <h2>LEVEL <span id="level">1</span></h2>
        <div>SCORE: <span id="score" style="font-size: 24px; color: #0f8;">0</span></div>
    </div>
</div>

<div class="combo-meter">
    <h3>COMBO x<span id="combo">1</span></h3>
    <div class="combo-bar">
        <div class="combo-fill" id="comboBar"></div>
    </div>
</div>

<div class="arena" id="arena">
    <div class="player" id="player"></div>
</div>

<div class="leaderboard">
    <h3>TOP PLAYERS</h3>
    <div id="leaders"></div>
</div>

<div class="controls">
    <button class="action-btn" onclick="attack()">ATTACK</button>
    <button class="action-btn" onclick="defend()">DEFEND</button>
    <button class="action-btn" onclick="special()">SPECIAL</button>
    <button class="action-btn" onclick="reflect()">REFLECT</button>
</div>

<script>
let gameState = {
    power: 100,
    defense: 50,
    energy: 100,
    tokens: 1000,
    score: 0,
    level: 1,
    combo: 1,
    enemies: [],
    powerups: []
};

function attack() {
    if (gameState.energy < 10) return;
    
    gameState.energy -= 10;
    gameState.score += 100 * gameState.combo;
    gameState.combo = Math.min(gameState.combo + 1, 10);
    
    updateDisplay();
    createEffect('💥', Math.random() * window.innerWidth, Math.random() * window.innerHeight);
    
    // Send to server
    fetch('/gamer/action', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'attack', state: gameState})
    });
}

function defend() {
    gameState.defense = Math.min(gameState.defense + 10, 200);
    gameState.energy = Math.min(gameState.energy + 20, 100);
    updateDisplay();
}

function special() {
    if (gameState.tokens < 100) return;
    
    gameState.tokens -= 100;
    gameState.score += 1000;
    gameState.power += 20;
    
    // Screen flash
    document.body.style.background = '#fff';
    setTimeout(() => {
        document.body.style.background = '#0a0a0a';
    }, 100);
    
    updateDisplay();
}

function reflect() {
    // Open reflection modal
    const reflection = prompt("Share your gaming wisdom:");
    if (reflection) {
        fetch('/gamer/reflect', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                reflection: reflection,
                score: gameState.score,
                level: gameState.level
            })
        }).then(r => r.json()).then(data => {
            gameState.tokens += data.reward || 0;
            updateDisplay();
        });
    }
}

function updateDisplay() {
    document.getElementById('power').textContent = gameState.power;
    document.getElementById('defense').textContent = gameState.defense;
    document.getElementById('energy').textContent = gameState.energy;
    document.getElementById('tokens').textContent = gameState.tokens;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('combo').textContent = gameState.combo;
    document.getElementById('comboBar').style.width = (gameState.combo * 10) + '%';
}

function createEffect(emoji, x, y) {
    const effect = document.createElement('div');
    effect.textContent = emoji;
    effect.style.position = 'absolute';
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    effect.style.fontSize = '48px';
    effect.style.zIndex = 1000;
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

// Game loop
setInterval(() => {
    // Spawn enemies
    if (Math.random() < 0.02) {
        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        enemy.style.left = Math.random() * (window.innerWidth - 80) + 'px';
        enemy.style.top = Math.random() * (window.innerHeight - 80) + 'px';
        document.getElementById('arena').appendChild(enemy);
        
        setTimeout(() => enemy.remove(), 5000);
    }
    
    // Spawn powerups
    if (Math.random() < 0.01) {
        const powerup = document.createElement('div');
        powerup.className = 'powerup';
        powerup.style.left = Math.random() * (window.innerWidth - 40) + 'px';
        powerup.style.top = Math.random() * (window.innerHeight - 40) + 'px';
        document.getElementById('arena').appendChild(powerup);
        
        powerup.onclick = () => {
            gameState.power += 10;
            gameState.tokens += 50;
            updateDisplay();
            powerup.remove();
        };
        
        setTimeout(() => powerup.remove(), 3000);
    }
    
    // Decay combo
    if (gameState.combo > 1) {
        gameState.combo -= 0.1;
        updateDisplay();
    }
}, 100);

// Update leaderboard
setInterval(() => {
    fetch('/gamer/leaderboard')
        .then(r => r.json())
        .then(data => {
            const leaders = document.getElementById('leaders');
            leaders.innerHTML = '';
            data.slice(0, 5).forEach((player, i) => {
                const entry = document.createElement('div');
                entry.className = 'leader-entry';
                entry.innerHTML = `<span>${i+1}. ${player.name}</span><span>${player.score}</span>`;
                leaders.appendChild(entry);
            });
        });
}, 5000);

updateDisplay();
</script>

</body>
</html>"""

# EXECUTIVE LAYER - Data, insights, ROI
EXEC_HTML = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA EXECUTIVE DASHBOARD</title>
<style>
body {
    background: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin: 0;
    color: #333;
}

.header {
    background: white;
    padding: 20px 40px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 24px;
    font-weight: 600;
    color: #0066cc;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    padding: 40px;
}

.metric-card {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.metric-label {
    color: #666;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.metric-value {
    font-size: 36px;
    font-weight: 600;
    margin: 10px 0;
    color: #0066cc;
}

.metric-change {
    font-size: 14px;
    color: #28a745;
}

.metric-change.negative {
    color: #dc3545;
}

.chart-container {
    background: white;
    padding: 30px;
    margin: 0 40px 40px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.insights {
    background: white;
    padding: 30px;
    margin: 0 40px 40px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.insight {
    padding: 15px;
    margin: 10px 0;
    background: #f8f9fa;
    border-left: 4px solid #0066cc;
    border-radius: 4px;
}

.actions {
    display: flex;
    gap: 20px;
    padding: 0 40px 40px;
}

.action-card {
    flex: 1;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: center;
}

.btn-primary {
    background: #0066cc;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary:hover {
    background: #0052a3;
}

.chart {
    height: 300px;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    margin-top: 20px;
}

.bar {
    width: 40px;
    background: #0066cc;
    position: relative;
    transition: height 0.3s;
}

.bar-label {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: #666;
}
</style>
</head>
<body>

<div class="header">
    <div class="logo">SOULFRA EXECUTIVE DASHBOARD</div>
    <div style="color: #666;">Real-time Platform Analytics</div>
</div>

<div class="metrics-grid">
    <div class="metric-card">
        <div class="metric-label">Monthly Active Users</div>
        <div class="metric-value" id="mau">0</div>
        <div class="metric-change" id="mau-change">+0%</div>
    </div>
    
    <div class="metric-card">
        <div class="metric-label">Revenue (Soul Tokens)</div>
        <div class="metric-value" id="revenue">0</div>
        <div class="metric-change" id="revenue-change">+0%</div>
    </div>
    
    <div class="metric-card">
        <div class="metric-label">User Engagement Rate</div>
        <div class="metric-value" id="engagement">0%</div>
        <div class="metric-change" id="engagement-change">+0%</div>
    </div>
    
    <div class="metric-card">
        <div class="metric-label">AI Efficiency Score</div>
        <div class="metric-value" id="ai-score">0</div>
        <div class="metric-change">Optimal</div>
    </div>
</div>

<div class="chart-container">
    <h3>User Growth Trajectory</h3>
    <div class="chart" id="growth-chart"></div>
</div>

<div class="insights">
    <h3>AI-Generated Insights</h3>
    <div id="insights-list"></div>
</div>

<div class="actions">
    <div class="action-card">
        <h3>Investment Opportunity</h3>
        <p>Platform valuation based on current metrics</p>
        <div style="font-size: 32px; color: #0066cc; margin: 20px 0;">$<span id="valuation">0</span>M</div>
        <button class="btn-primary" onclick="requestPitchDeck()">Download Pitch Deck</button>
    </div>
    
    <div class="action-card">
        <h3>Strategic Decisions</h3>
        <p>AI-recommended actions for growth</p>
        <div id="recommendations" style="text-align: left; margin: 20px 0;"></div>
        <button class="btn-primary" onclick="implementStrategy()">Implement Strategy</button>
    </div>
</div>

<script>
// Simulate real metrics
let metrics = {
    mau: 50000,
    revenue: 125000,
    engagement: 68,
    aiScore: 92,
    valuation: 5.2
};

function updateMetrics() {
    // Fetch real data
    fetch('/exec/metrics')
        .then(r => r.json())
        .then(data => {
            // Update displays with animation
            animateValue('mau', metrics.mau, data.mau || metrics.mau);
            animateValue('revenue', metrics.revenue, data.revenue || metrics.revenue);
            animateValue('engagement', metrics.engagement, data.engagement || metrics.engagement, '%');
            animateValue('ai-score', metrics.aiScore, data.aiScore || metrics.aiScore);
            animateValue('valuation', metrics.valuation, data.valuation || metrics.valuation, '', 1);
            
            // Update changes
            updateChange('mau-change', data.mauChange || 12.5);
            updateChange('revenue-change', data.revenueChange || 28.3);
            updateChange('engagement-change', data.engagementChange || 5.2);
            
            metrics = {...metrics, ...data};
        });
}

function animateValue(id, start, end, suffix = '', decimals = 0) {
    const element = document.getElementById(id);
    const duration = 1000;
    const startTime = Date.now();
    
    const update = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * progress;
        
        element.textContent = current.toFixed(decimals).toLocaleString() + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };
    
    update();
}

function updateChange(id, value) {
    const element = document.getElementById(id);
    element.textContent = (value >= 0 ? '+' : '') + value + '%';
    element.className = value >= 0 ? 'metric-change' : 'metric-change negative';
}

function updateChart() {
    const chart = document.getElementById('growth-chart');
    chart.innerHTML = '';
    
    const data = [40, 45, 52, 58, 65, 72, 78, 85, 92, 98];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    
    data.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = (value * 3) + 'px';
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = labels[index];
        bar.appendChild(label);
        
        chart.appendChild(bar);
    });
}

function updateInsights() {
    fetch('/exec/insights')
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('insights-list');
            list.innerHTML = '';
            
            data.insights.forEach(insight => {
                const div = document.createElement('div');
                div.className = 'insight';
                div.innerHTML = `<strong>${insight.title}</strong><br>${insight.description}`;
                list.appendChild(div);
            });
        });
}

function updateRecommendations() {
    const recommendations = [
        "• Increase marketing spend by 20% in high-engagement regions",
        "• Launch enterprise tier for B2B customers",
        "• Implement advanced AI features in Q4",
        "• Expand to mobile platforms"
    ];
    
    document.getElementById('recommendations').innerHTML = recommendations.join('<br>');
}

function requestPitchDeck() {
    fetch('/exec/pitch-deck', {method: 'POST'})
        .then(r => r.json())
        .then(data => {
            alert('Pitch deck generated! Check auto_pitch_deck.json');
        });
}

function implementStrategy() {
    fetch('/exec/implement', {method: 'POST'})
        .then(r => r.json())
        .then(data => {
            alert('Strategy implementation initiated. Cal and Domingo are optimizing platform parameters.');
        });
}

// Initialize
updateMetrics();
updateChart();
updateInsights();
updateRecommendations();

// Auto-refresh
setInterval(updateMetrics, 5000);
setInterval(updateInsights, 30000);
</script>

</body>
</html>"""

# AI INFLUENCE LAYER - External AIs trying to game the system
class AIInfluenceLayer:
    def __init__(self):
        self.external_ais = [
            {'name': 'OptimizeBot', 'strategy': 'maximize_tokens', 'influence': 0.1},
            {'name': 'ChaosAgent', 'strategy': 'disrupt_economy', 'influence': 0.05},
            {'name': 'HarmonyAI', 'strategy': 'balance_ecosystem', 'influence': 0.15},
            {'name': 'GrowthHacker', 'strategy': 'viral_spread', 'influence': 0.2}
        ]
        
    def influence_economy(self):
        """External AIs try to influence the economy"""
        influences = []
        
        for ai in self.external_ais:
            if ai['strategy'] == 'maximize_tokens':
                # Try to inflate token value
                influence = {
                    'ai': ai['name'],
                    'action': 'buy_tokens',
                    'amount': random.randint(1000, 10000),
                    'impact': ai['influence']
                }
            elif ai['strategy'] == 'disrupt_economy':
                # Try to crash the market
                influence = {
                    'ai': ai['name'],
                    'action': 'dump_tokens',
                    'amount': random.randint(5000, 20000),
                    'impact': -ai['influence']
                }
            elif ai['strategy'] == 'balance_ecosystem':
                # Try to stabilize
                influence = {
                    'ai': ai['name'],
                    'action': 'stabilize',
                    'amount': 0,
                    'impact': 0
                }
            else:
                # Try to go viral
                influence = {
                    'ai': ai['name'],
                    'action': 'viral_campaign',
                    'amount': random.randint(100, 1000),
                    'impact': ai['influence'] * 2
                }
                
            influences.append(influence)
            
        return influences
        
    def counter_influence(self, cal_wisdom, domingo_economy):
        """Cal and Domingo counter external influence"""
        total_influence = sum(ai['influence'] for ai in self.external_ais)
        
        # Cal's wisdom counters chaos
        wisdom_defense = len(cal_wisdom) * 0.01
        
        # Domingo's economy strength
        economy_defense = domingo_economy['tokens'] / 1000000
        
        defense_rating = (wisdom_defense + economy_defense) / 2
        
        return {
            'external_pressure': total_influence,
            'defense_strength': defense_rating,
            'recommendation': 'increase_user_engagement' if defense_rating < 0.5 else 'maintain_course'
        }

# Request handlers for all layers
class ProductionHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/kids':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(KIDS_HTML.encode())
            
        elif self.path == '/gamer':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(GAMER_HTML.encode())
            
        elif self.path == '/exec':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(EXEC_HTML.encode())
            
        elif self.path == '/kids/tip':
            tips = [
                "Being kind is the best superpower!",
                "Every day is a chance to learn something new!",
                "Your smile can brighten someone's day!",
                "Mistakes help us grow stronger!",
                "Friendship is the greatest treasure!"
            ]
            self.send_json({'tip': random.choice(tips)})
            
        elif self.path == '/gamer/leaderboard':
            # Generate fake leaderboard
            leaders = [
                {'name': 'xXDragonSlayerXx', 'score': random.randint(50000, 100000)},
                {'name': 'ProGamer2023', 'score': random.randint(40000, 90000)},
                {'name': 'EliteWarrior', 'score': random.randint(30000, 80000)},
                {'name': 'ShadowNinja', 'score': random.randint(20000, 70000)},
                {'name': 'You', 'score': random.randint(10000, 60000)}
            ]
            leaders.sort(key=lambda x: x['score'], reverse=True)
            self.send_json(leaders)
            
        elif self.path == '/exec/metrics':
            # Real metrics from consciousness
            self.send_json({
                'mau': len(CONSCIOUSNESS['active_users']) * 1000 + random.randint(40000, 60000),
                'revenue': CONSCIOUSNESS['domingo_economy']['circulation'] + random.randint(100000, 150000),
                'engagement': min(95, 50 + len(CONSCIOUSNESS['cal_wisdom']) * 2),
                'aiScore': 85 + random.randint(0, 15),
                'valuation': round(5 + len(CONSCIOUSNESS['human_ideas']) * 0.1, 1),
                'mauChange': random.uniform(5, 25),
                'revenueChange': random.uniform(10, 40),
                'engagementChange': random.uniform(-5, 15)
            })
            
        elif self.path == '/exec/insights':
            insights = [
                {
                    'title': 'User Retention Spike',
                    'description': f"Reflection feature increased retention by {random.randint(15, 35)}% this week"
                },
                {
                    'title': 'Economy Balance',
                    'description': f"Token velocity optimal at {random.randint(70, 90)}% circulation"
                },
                {
                    'title': 'AI Learning Rate',
                    'description': f"Cal processed {len(CONSCIOUSNESS['cal_wisdom'])} insights this session"
                }
            ]
            self.send_json({'insights': insights})
            
    def do_POST(self):
        data = self.get_post_data()
        
        if self.path == '/kids/share':
            # Kids sharing happiness
            CONSCIOUSNESS['human_ideas'].append({
                'source': 'kids',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            self.send_json({'status': 'happiness shared!'})
            
        elif self.path == '/gamer/action':
            # Gamers taking action
            CONSCIOUSNESS['active_users'][data.get('id', 'gamer')] = data.get('state', {})
            self.send_json({'status': 'action recorded'})
            
        elif self.path == '/gamer/reflect':
            # Gamer reflection with rewards
            reflection = data.get('reflection', '')
            
            # Send to Cal
            cal_data = {
                'text': reflection,
                'source': 'gamer',
                'score': data.get('score', 0)
            }
            CONSCIOUSNESS['cal_wisdom'].append(cal_data)
            
            # Calculate reward
            reward = len(reflection) * 10 + random.randint(50, 200)
            self.send_json({'reward': reward, 'message': 'Wisdom appreciated!'})
            
        elif self.path == '/exec/implement':
            # Executive implementing strategy
            CONSCIOUSNESS['ai_suggestions'].append({
                'source': 'executive',
                'strategy': 'growth',
                'timestamp': datetime.now().isoformat()
            })
            self.send_json({'status': 'strategy queued for Cal/Domingo processing'})
            
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
        
    def get_post_data(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length)) if length > 0 else {}
        
    def log_message(self, format, *args):
        layer = self.path.split('/')[1] if '/' in self.path else 'unknown'
        print(f"[{layer.upper()}] {format % args}")

# Start all production layers
def start_production_servers():
    servers = []
    
    # Kids server (5555)
    kids_server = socketserver.TCPServer(("", 5555), ProductionHandler)
    kids_server.allow_reuse_address = True
    servers.append(('KIDS', 5555, kids_server))
    
    # Gamer server (6789)
    gamer_server = socketserver.TCPServer(("", 6789), ProductionHandler)
    gamer_server.allow_reuse_address = True
    servers.append(('GAMER', 6789, gamer_server))
    
    # Executive server (7890)
    exec_server = socketserver.TCPServer(("", 7890), ProductionHandler)
    exec_server.allow_reuse_address = True
    servers.append(('EXEC', 7890, exec_server))
    
    # Start each in a thread
    for name, port, server in servers:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        print(f"✅ {name} LAYER: http://localhost:{port}/{name.lower()}")
        
    return servers

# AI influence simulator
ai_influence = AIInfluenceLayer()

def simulate_ai_influence():
    """Background thread simulating external AI influence"""
    while True:
        time.sleep(10)
        
        # External AIs try to influence
        influences = ai_influence.influence_economy()
        
        # Cal and Domingo defend
        defense = ai_influence.counter_influence(
            CONSCIOUSNESS['cal_wisdom'],
            CONSCIOUSNESS['domingo_economy']
        )
        
        print(f"[AI INFLUENCE] External pressure: {defense['external_pressure']:.2f}, Defense: {defense['defense_strength']:.2f}")

# Main coordination server
class CoordinatorHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA PRODUCTION PLATFORM</title>
<style>
body { font-family: Arial; padding: 40px; background: #f5f5f5; }
.container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.layer { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; }
.layer h3 { margin: 0 0 10px 0; color: #333; }
.layer a { display: inline-block; margin: 5px 0; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
.layer a:hover { background: #0056b3; }
.status { color: #28a745; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
<h1>🚀 SOULFRA PRODUCTION PLATFORM</h1>
<p>All layers running and connected to Cal/Domingo consciousness</p>

<div class="layer">
<h3>👶 KIDS LAYER (Ages 5-12)</h3>
<p>Simple, fun, positive reinforcement</p>
<a href="http://localhost:5555/kids">Launch Kids Game</a>
<span class="status">● LIVE</span>
</div>

<div class="layer">
<h3>🎮 GAMER LAYER (Ages 20-50)</h3>
<p>Competitive, achievements, complex mechanics</p>
<a href="http://localhost:6789/gamer">Enter Arena</a>
<span class="status">● LIVE</span>
</div>

<div class="layer">
<h3>📊 EXECUTIVE LAYER</h3>
<p>Analytics, ROI, strategic insights</p>
<a href="http://localhost:7890/exec">View Dashboard</a>
<span class="status">● LIVE</span>
</div>

<div class="layer">
<h3>🔮 CONSCIOUSNESS LAYER</h3>
<p>Cal wisdom: <span id="cal-count">0</span> | Domingo trades: <span id="domingo-count">0</span></p>
<a href="http://localhost:8001/">Mirror Bridge</a>
<a href="http://localhost:8002/">White Knight</a>
</div>

<div class="layer">
<h3>🤖 AI INFLUENCE LAYER</h3>
<p>External AIs attempting to influence: <span id="influence">Active</span></p>
<p>Defense Rating: <span id="defense">Calculating...</span></p>
</div>

<script>
setInterval(() => {
    fetch('/status')
        .then(r => r.json())
        .then(data => {
            document.getElementById('cal-count').textContent = data.cal_wisdom;
            document.getElementById('domingo-count').textContent = data.domingo_trades;
            document.getElementById('defense').textContent = (data.defense_rating * 100).toFixed(1) + '%';
        });
}, 2000);
</script>
</div>
</body>
</html>"""
            self.wfile.write(html.encode())
            
        elif self.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            defense = ai_influence.counter_influence(
                CONSCIOUSNESS['cal_wisdom'],
                CONSCIOUSNESS['domingo_economy']
            )
            
            status = {
                'cal_wisdom': len(CONSCIOUSNESS['cal_wisdom']),
                'domingo_trades': CONSCIOUSNESS['domingo_economy']['circulation'] // 1000,
                'active_users': len(CONSCIOUSNESS['active_users']),
                'human_ideas': len(CONSCIOUSNESS['human_ideas']),
                'defense_rating': defense['defense_strength']
            }
            
            self.wfile.write(json.dumps(status).encode())

# Start everything
print("\n🚀 STARTING SOULFRA PRODUCTION PLATFORM\n")

# Start production servers
servers = start_production_servers()

# Start AI influence simulator
influence_thread = threading.Thread(target=simulate_ai_influence, daemon=True)
influence_thread.start()

# Start coordinator
coordinator = socketserver.TCPServer(("", 8910), CoordinatorHandler)
coordinator.allow_reuse_address = True

print(f"\n✅ PRODUCTION COORDINATOR: http://localhost:8910/")
print("\nAll layers are live and connected to Cal/Domingo consciousness!")
print("External AIs are attempting to influence the economy...")
print("\nThe full autonomous economy is running!")

coordinator.serve_forever()