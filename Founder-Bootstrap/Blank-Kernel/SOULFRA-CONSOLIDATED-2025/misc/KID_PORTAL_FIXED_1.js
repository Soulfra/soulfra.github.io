const http = require('http');
const PORT = 5556;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
<title>Fun Zone!</title>
<style>
body {
  margin: 0;
  font-family: Comic Sans MS, Arial;
  background: linear-gradient(to bottom, #87CEEB, #98FB98);
  min-height: 100vh;
  padding: 20px;
}
.container { max-width: 1200px; margin: 0 auto; }
.header {
  text-align: center;
  background: white;
  border-radius: 30px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
h1 { font-size: 48px; color: #FF6B6B; margin: 0; }
.games {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}
.game {
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.game:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.icon { font-size: 80px; margin-bottom: 20px; }
.title { font-size: 28px; color: #333; margin-bottom: 10px; }
.desc { font-size: 18px; color: #666; margin-bottom: 20px; }
.play-btn {
  background: #4ECDC4;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 24px;
  border-radius: 50px;
  cursor: pointer;
}
.game:hover .icon { animation: bounce 0.5s; }
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Welcome to Fun Zone!</h1>
    <p style="font-size: 24px; color: #4ECDC4; margin-top: 10px;">Pick a game to play!</p>
  </div>
  
  <div class="games">
    <div class="game" onclick="window.location.href='http://localhost:8081'">
      <div class="icon">✨</div>
      <div class="title">Magic Growth Land</div>
      <div class="desc">Help Cal and earn coins!</div>
      <button class="play-btn">PLAY</button>
    </div>
    
    <div class="game" onclick="window.location.href='http://localhost:3004'">
      <div class="icon">🤖</div>
      <div class="title">Robot Money Race</div>
      <div class="desc">Watch robots earn money!</div>
      <button class="play-btn">PLAY</button>
    </div>
    
    <div class="game" onclick="window.location.href='http://localhost:3335'">
      <div class="icon">⚔️</div>
      <div class="title">Battle Arena</div>
      <div class="desc">Fight monsters for gold!</div>
      <button class="play-btn">PLAY</button>
    </div>
  </div>
</div>
</body>
</html>
  `);
});

server.listen(PORT, () => {
  console.log('Fixed Kid Portal ready at http://localhost:' + PORT);
});