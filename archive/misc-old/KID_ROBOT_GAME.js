const http = require('http');
const PORT = 3004;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
<title>Robot Money Race</title>
<style>
body {
  margin: 0;
  font-family: Arial;
  background: #222;
  color: white;
  padding: 20px;
}
.game {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}
h1 { color: #FFD700; font-size: 48px; }
.robots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 30px 0;
}
.robot {
  background: #333;
  padding: 20px;
  border-radius: 20px;
  border: 3px solid #444;
}
.robot.working { border-color: #00FF00; animation: pulse 1s infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.robot-face { font-size: 60px; }
.robot-name { font-size: 20px; margin: 10px 0; }
.robot-money { font-size: 24px; color: #FFD700; }
.total {
  font-size: 36px;
  color: #00FF00;
  margin: 30px 0;
}
.btn {
  background: #FFD700;
  color: black;
  border: none;
  padding: 15px 30px;
  font-size: 24px;
  border-radius: 10px;
  cursor: pointer;
  margin: 10px;
}
.btn:hover { transform: scale(1.1); }
</style>
</head>
<body>
<div class="game">
  <h1>🤖 Robot Money Race! 🤖</h1>
  <div class="total">Total: <span id="total">$0</span></div>
  
  <div class="robots" id="robots"></div>
  
  <button class="btn" onclick="addMoney()">Help Robots! +$100</button>
  <button class="btn" onclick="speedUp()">Speed Boost! 🚀</button>
</div>

<script>
let total = 0;
let speed = 1;
const robots = [
  {name: 'Beep', face: '🤖', money: 0},
  {name: 'Boop', face: '🤖', money: 0},
  {name: 'Buzz', face: '🤖', money: 0},
  {name: 'Whirr', face: '🤖', money: 0},
  {name: 'Click', face: '🤖', money: 0},
  {name: 'Zap', face: '🤖', money: 0}
];

function updateDisplay() {
  document.getElementById('total').textContent = '$' + total.toLocaleString();
  
  const container = document.getElementById('robots');
  container.innerHTML = robots.map((robot, i) => `
    <div class="robot" id="robot${i}">
      <div class="robot-face">${robot.face}</div>
      <div class="robot-name">${robot.name}</div>
      <div class="robot-money">$${robot.money.toLocaleString()}</div>
    </div>
  `).join('');
}

function robotWork() {
  const robotIndex = Math.floor(Math.random() * robots.length);
  const earned = Math.floor(Math.random() * 50 + 10) * speed;
  
  robots[robotIndex].money += earned;
  total += earned;
  
  // Animate
  const robotDiv = document.getElementById('robot' + robotIndex);
  robotDiv.classList.add('working');
  setTimeout(() => robotDiv.classList.remove('working'), 500);
  
  updateDisplay();
}

function addMoney() {
  total += 100;
  updateDisplay();
}

function speedUp() {
  speed = 2;
  setTimeout(() => { speed = 1; }, 5000);
}

// Start
updateDisplay();
setInterval(robotWork, 1000);
</script>
</body>
</html>
  `);
});

server.listen(PORT, () => {
  console.log('Kid Robot Game ready at http://localhost:' + PORT);
});