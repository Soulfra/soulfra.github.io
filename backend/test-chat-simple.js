#!/usr/bin/env node
// Simple chat test

const fetch = require('node-fetch');

async function testChat() {
    try {
        console.log('🔑 Logging in...');
        
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'demo@soulfra.ai',
                password: 'demo123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginData.token) {
            throw new Error('No token received: ' + JSON.stringify(loginData));
        }
        
        console.log('✅ Login successful');
        
        console.log('💬 Testing chat...');
        
        const chatResponse = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello world' }]
            })
        });
        
        console.log('📊 Chat response status:', chatResponse.status);
        
        const chatData = await chatResponse.json();
        
        console.log('📝 Chat response:', JSON.stringify(chatData, null, 2));
        
        if (chatData.error) {
            console.log('❌ Chat error:', chatData.error);
        } else {
            console.log('✅ Chat working!');
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

testChat();
