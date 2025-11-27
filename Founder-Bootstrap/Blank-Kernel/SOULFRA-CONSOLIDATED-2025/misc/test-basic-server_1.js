const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 7777;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});

// Keep alive
process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});