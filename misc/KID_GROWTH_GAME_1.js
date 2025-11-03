const http = require('http');
const PORT = 8081;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
<title>Magic Growth Land</title>
<style>
body { 
  margin: 0;
  font-family: Arial;
  background: linear-gradient(#87CEEB, #98FB98);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.game {
  background: white;
  padding: 40px;
  border-radius: 30px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 600px;
}
h1 { color: #FF6B6B; font-size: 40px; margin-bottom: 20px; }
.cal-face { font-size: 100px; margin: 20px; }
.coins { font-size: 60px; color: #FFD700; margin: 20px; }
.btn {
  background: #4ECDC4;
  color: white;
  border: none;
  padding: 20px 40px;
  font-size: 24px;
  border-radius: 50px;
  margin: 10px;
  cursor: pointer;
}
.btn:hover { transform: scale(1.1); }
.message {
  font-size: 24px;
  color: #666;
  margin: 20px;
  min-height: 60px;
}
</style>
</head>
<body>
<div class="game">
  <h1>Magic Growth Land!</h1>
  <div class="cal-face" id="calFace">😊</div>
  <div class="message" id="message">Hi! I'm Cal! Click buttons to grow!</div>
  <div class="coins" id="coins">🪙 0</div>
  <div>
    <button class="btn" onclick="action('happy')">😊 Be Happy</button>
    <button class="btn" onclick="action('help')">🤝 Help Friend</button>
    <button class="btn" onclick="action('learn')">📚 Learn Something</button>
    <button class="btn" onclick="action('play')">🎮 Play Game</button>
  </div>
</div>

<script>
let coins = 0;
const faces = ['😊', '😄', '🤗', '😎', '🥳', '🌟'];
const messages = {
  happy: ['Great job being happy!', 'Your smile is awesome!', 'Happiness gives you power!'],
  help: ['Helping friends is the best!', 'You are so kind!', 'Friends make everything better!'],
  learn: ['Learning makes you smart!', 'Your brain is growing!', 'Knowledge is super power!'],
  play: ['Playing is important too!', 'Games teach us things!', 'Fun makes us strong!']
};

function action(type) {
  coins += 25;
  document.getElementById('coins').textContent = '🪙 ' + coins;
  
  const face = faces[Math.floor(Math.random() * faces.length)];
  document.getElementById('calFace').textContent = face;
  
  const msgList = messages[type];
  const msg = msgList[Math.floor(Math.random() * msgList.length)];
  document.getElementById('message').textContent = msg;
  
  // Animate
  document.getElementById('calFace').style.transform = 'scale(1.2) rotate(10deg)';
  setTimeout(() => {
    document.getElementById('calFace').style.transform = 'scale(1) rotate(0deg)';
  }, 300);
}
</script>
</body>
</html>
  `);
});

server.listen(PORT, () => {
  console.log('Kid Growth Game ready at http://localhost:' + PORT);
});