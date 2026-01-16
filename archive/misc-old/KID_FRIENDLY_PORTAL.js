#!/usr/bin/env node

/**
 * KID FRIENDLY PORTAL
 * 
 * Big buttons, simple language, fun colors
 * Everything a 5-year-old (or executive) needs
 */

const http = require('http');
const PORT = 5555;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head>
<title>🎮 Soulfra Fun Zone!</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  background: linear-gradient(to bottom, #87CEEB, #98FB98);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  background: white;
  border-radius: 30px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 40px;
}

.header h1 {
  font-size: 48px;
  color: #FF6B6B;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.header p {
  font-size: 24px;
  color: #4ECDC4;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.game-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.game-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.game-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 15px;
}

.game-desc {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.4;
}

.play-button {
  background: #4ECDC4;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 24px;
  border-radius: 50px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(78,205,196,0.4);
}

.play-button:hover {
  background: #45B7D1;
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(78,205,196,0.6);
}

.tutorial {
  background: #FFE66D;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 40px;
  text-align: center;
}

.tutorial h2 {
  font-size: 36px;
  color: #333;
  margin-bottom: 20px;
}

.tutorial-steps {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.step {
  background: white;
  padding: 20px;
  border-radius: 15px;
  flex: 1;
  min-width: 200px;
}

.step-number {
  background: #FF6B6B;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.fun-facts {
  background: #A8E6CF;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 40px;
}

.fact {
  background: white;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 15px;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.fact-icon {
  font-size: 40px;
}

.arena-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  margin-bottom: 40px;
}

.arena-preview h2 {
  font-size: 40px;
  margin-bottom: 20px;
}

.arena-button {
  background: #FFE66D;
  color: #333;
  padding: 20px 50px;
  font-size: 28px;
  border-radius: 50px;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}

.arena-button:hover {
  transform: scale(1.1) rotate(3deg);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.bouncing {
  animation: bounce 2s infinite;
}

@keyframes rainbow {
  0% { color: red; }
  20% { color: orange; }
  40% { color: yellow; }
  60% { color: green; }
  80% { color: blue; }
  100% { color: purple; }
}

.rainbow-text {
  animation: rainbow 3s infinite;
}
</style>
</head>
<body>

<div class="container">
  <div class="header">
    <h1 class="rainbow-text">🎮 Welcome to Soulfra Fun Zone! 🎮</h1>
    <p>Click any game to start playing!</p>
  </div>

  <div class="games-grid">
    <div class="game-card" onclick="window.open('http://localhost:8080', '_blank')">
      <div class="game-icon bouncing">🌟</div>
      <h3 class="game-title">Magic Growth Land</h3>
      <p class="game-desc">Talk to Cal the friendly AI! Earn coins for being awesome!</p>
      <button class="play-button">Play Now!</button>
    </div>

    <div class="game-card" onclick="window.open('http://localhost:3003', '_blank')">
      <div class="game-icon bouncing">🤖</div>
      <h3 class="game-title">Robot Money Race</h3>
      <p class="game-desc">Watch robots compete to earn a billion dollars!</p>
      <button class="play-button">Watch Robots!</button>
    </div>

    <div class="game-card" onclick="window.open('http://localhost:4040', '_blank')">
      <div class="game-icon bouncing">🧠</div>
      <h3 class="game-title">Cal's Thinking Room</h3>
      <p class="game-desc">Share your thoughts and Cal will help you!</p>
      <button class="play-button">Visit Cal!</button>
    </div>
  </div>

  <div class="tutorial">
    <h2>🎯 How to Play</h2>
    <div class="tutorial-steps">
      <div class="step">
        <div class="step-number">1</div>
        <h4>Pick a Game</h4>
        <p>Click any colorful box above!</p>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <h4>Have Fun</h4>
        <p>Play games and earn coins!</p>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <h4>Level Up</h4>
        <p>Get better and help friends!</p>
      </div>
    </div>
  </div>

  <div class="arena-preview">
    <h2>⚔️ Coming Soon: Battle Arena! ⚔️</h2>
    <p style="font-size: 24px;">Fight dragons! Cast spells! Win treasure!</p>
    <button class="arena-button" onclick="alert('Arena coming soon! Keep playing to unlock!')">
      🏰 Enter Arena 🏰
    </button>
  </div>

  <div class="fun-facts">
    <h2 style="font-size: 36px; text-align: center; margin-bottom: 20px;">🌈 Fun Facts!</h2>
    <div class="fact">
      <span class="fact-icon">💰</span>
      <span>You can earn real money by helping others!</span>
    </div>
    <div class="fact">
      <span class="fact-icon">🎮</span>
      <span>Playing games makes you smarter!</span>
    </div>
    <div class="fact">
      <span class="fact-icon">🤝</span>
      <span>You can play with friends from anywhere!</span>
    </div>
    <div class="fact">
      <span class="fact-icon">🏆</span>
      <span>There are secret treasures hidden everywhere!</span>
    </div>
  </div>
</div>

<script>
console.log('🎮 Welcome to the Fun Zone!');
console.log('🦄 Made with love and rainbows!');

// Add some fun interactions
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.background = '#' + Math.floor(Math.random()*16777215).toString(16);
    setTimeout(() => {
      card.style.background = 'white';
    }, 500);
  });
});
</script>

</body>
</html>`);
});

server.listen(PORT, () => {
  console.log(`
🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮
🌈                                             🌈
🌈        KID FRIENDLY PORTAL READY!           🌈
🌈                                             🌈
🌈   🎯 URL: http://localhost:${PORT}           🌈
🌈                                             🌈
🌈   Big buttons! Fun colors! Easy words!      🌈
🌈   Perfect for kids AND executives!          🌈
🌈                                             🌈
🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮
  `);
});