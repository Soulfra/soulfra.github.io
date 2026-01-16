// Chat client
let ws = null;

function connectWebSocket() {
    ws = new WebSocket(`wss://${window.location.host}/ws/${CHAT_ID}`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        displayMessage(data);
    };
    
    ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
    };
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'message',
            text: message,
            timestamp: new Date().toISOString()
        }));
        
        displayMessage({
            text: message,
            sender: 'user',
            timestamp: new Date().toISOString()
        });
        
        input.value = '';
    }
}

function displayMessage(data) {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.sender || 'other'}`;
    messageDiv.textContent = data.text;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Connect on load
connectWebSocket();

// Enter to send
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});