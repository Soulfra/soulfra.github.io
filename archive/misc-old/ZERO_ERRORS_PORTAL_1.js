const http = require('http');
const fs = require('fs');

// Store HTML in a separate file to avoid ALL formatting issues
const HTML = fs.readFileSync('static/portal.html', 'utf8');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(HTML);
});

server.listen(5559, () => {
  console.log('ZERO ERRORS Portal at http://localhost:5559');
  console.log('Reading from static file = NO FORMATTING ISSUES!');
});