const http = require('http');

// Game state
let progress = 847293472;
const goal = 1000000000;

// Create server
http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(`<!DOCTYPE html>
<html>
<head>
<title>Billion Dollar Game</title>
<style>
body { background: #000; color: #0f0; font-family: monospace; text-align: center; padding: 50px; }
h1 { font-size: 50px; }
.progress { font-size: 30px; margin: 20px; }
.bar { width: 80%; height: 40px; background: #111; margin: 20px auto; border: 2px solid #0f0; }
.fill { height: 100%; background: #0f0; width: ${(progress/goal*100)}%; }
button { background: #0f0; color: #000; border: none; padding: 15px 30px; font-size: 20px; cursor: pointer; }
</style>
</head>
<body>
<h1>💰 BILLION DOLLAR GAME</h1>
<div class="progress">$${progress.toLocaleString()} / $1,000,000,000</div>
<div class="bar"><div class="fill"></div></div>
<button onclick="contribute()">Contribute $1000</button>
<script>
function contribute() {
    fetch('/contribute', {method: 'POST'})
    .then(() => location.reload());
}
setInterval(() => location.reload(), 5000);
</script>
</body>
</html>`);
    } 
    else if (req.url === '/contribute' && req.method === 'POST') {
        progress += 1000;
        res.writeHead(200);
        res.end('OK');
    }
    else {
        res.writeHead(404);
        res.end();
    }
}).listen(3003, () => {
    console.log('🎮 Billion Dollar Game running at http://localhost:3003');
    console.log('Current: $' + progress.toLocaleString());
    setInterval(() => {
        progress += Math.floor(Math.random() * 10000);
        if (progress >= goal) console.log('🎉 BILLION REACHED!');
    }, 1000);
});