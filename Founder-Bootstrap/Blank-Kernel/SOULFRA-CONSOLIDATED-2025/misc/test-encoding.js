#!/usr/bin/env node

/**
 * TEST CHARACTER ENCODING
 * 
 * Tests that emojis and special characters work properly
 */

const http = require('http');
const CharacterEncodingFix = require('./character-encoding-fix');

// Test data with problematic characters
const TEST_DATA = {
    emojis: {
        basic: '😀 😃 😄 😁 😆',
        complex: '👨‍👩‍👧‍👦 🏳️‍🌈 👨‍💻',
        flags: '🇺🇸 🇬🇧 🇯🇵 🇩🇪 🇫🇷',
        symbols: '✨ 🔥 💯 🚀 🌟'
    },
    special: {
        quotes: '"Hello" 'World' « French » „German"',
        dashes: '— Em dash – En dash - Hyphen',
        currency: '$ € £ ¥ ₹ ₽',
        math: '∑ ∏ √ ∞ ≈ ≠',
        arrows: '← → ↑ ↓ ⇐ ⇒'
    },
    unicode: {
        chinese: '你好世界',
        japanese: 'こんにちは世界',
        korean: '안녕하세요 세계',
        arabic: 'مرحبا بالعالم',
        hebrew: 'שלום עולם',
        russian: 'Привет мир'
    }
};

// Create test server with problematic content
const createTestServer = (port) => {
    const server = http.createServer((req, res) => {
        if (req.url === '/api/test') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Test response with emojis 🚀✨',
                data: TEST_DATA,
                timestamp: new Date().toISOString()
            }));
        } else if (req.url === '/api/echo' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    echo: body,
                    received: JSON.parse(body)
                }));
            });
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
    
    server.listen(port, () => {
        console.log(`Test server running on port ${port}`);
    });
    
    return server;
};

// Test the encoding fix
const runTests = async () => {
    console.log('🧪 CHARACTER ENCODING TEST SUITE\n');
    
    // Start test server
    const testServer = createTestServer(9999);
    
    // Start fixed proxy server
    const fix = new CharacterEncodingFix();
    const proxyServer = fix.createFixedProxyServer({
        '/': 'http://localhost:9999'
    }, 8888);
    
    // Wait for servers to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 1: GET request with emoji response
    console.log('📋 Test 1: GET request with emoji response');
    http.get('http://localhost:8888/api/test', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('✅ Response received');
                console.log('   Message:', json.message);
                console.log('   Emojis:', json.data.emojis.basic);
                console.log('   Unicode:', json.data.unicode.japanese);
            } catch (e) {
                console.log('❌ Failed to parse response:', e.message);
            }
            
            // Test 2: POST request with emoji data
            console.log('\n📋 Test 2: POST request with emoji data');
            testPostRequest();
        });
    });
};

const testPostRequest = () => {
    const postData = JSON.stringify({
        message: 'Hello with emojis! 🎉🎊',
        data: {
            emoji: '🚀',
            text: 'Testing — special "characters"'
        }
    });
    
    const options = {
        hostname: 'localhost',
        port: 8888,
        path: '/api/echo',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('✅ Echo response received');
                console.log('   Original:', json.received.message);
                console.log('   Emoji preserved:', json.received.data.emoji === '🚀' ? '✅' : '❌');
                
                // All tests complete
                console.log('\n✨ All tests completed!');
                console.log('\nTo use the fix in your nginx setup:');
                console.log('1. The nginx config files have been updated with UTF-8 support');
                console.log('2. Restart nginx: sudo nginx -s reload');
                console.log('3. Or use the character-encoding-fix.js proxy directly');
                
                process.exit(0);
            } catch (e) {
                console.log('❌ Failed to parse echo response:', e.message);
                process.exit(1);
            }
        });
    });
    
    req.on('error', (e) => {
        console.log('❌ Request error:', e.message);
        process.exit(1);
    });
    
    req.write(postData);
    req.end();
};

// Run tests
runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});