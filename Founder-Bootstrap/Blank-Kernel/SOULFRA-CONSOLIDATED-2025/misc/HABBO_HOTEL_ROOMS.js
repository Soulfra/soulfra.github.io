const http = require('http');
const PORT = 7777;

// Room state
const rooms = new Map();
const users = new Map();

// Create default rooms
rooms.set('lobby', {
  name: 'Welcome Lobby',
  users: [],
  furniture: [
    { type: 'couch', x: 200, y: 200 },
    { type: 'plant', x: 100, y: 100 },
    { type: 'table', x: 300, y: 250 }
  ],
  messages: []
});

rooms.set('pool', {
  name: 'Pool Party',
  users: [],
  furniture: [
    { type: 'pool', x: 200, y: 200, width: 300, height: 200 },
    { type: 'chair', x: 150, y: 150 },
    { type: 'umbrella', x: 400, y: 150 }
  ],
  messages: []
});

const habboHTML = `<!DOCTYPE html>
<html>
<head>
<title>Habbo Style Rooms</title>
<style>
body { margin: 0; background: #000; font-family: Arial; overflow: hidden; }
.container { display: flex; height: 100vh; }
.room-list { width: 200px; background: #1a1a1a; padding: 20px; overflow-y: auto; }
.room-item { background: #333; padding: 10px; margin: 10px 0; cursor: pointer; color: #fff; border-radius: 5px; }
.room-item:hover { background: #444; }
.room-view { flex: 1; position: relative; background: #87CEEB; }
.room-floor { position: absolute; bottom: 0; width: 100%; height: 60%; background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgMCBNIC0xMCAzMCBMIDMwIC0xMCBNIDEwIDUwIEwgNTAgMTAiIHN0cm9rZT0iI2NkYzljOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+') #f0e6d2; }
.avatar { position: absolute; width: 30px; height: 60px; cursor: pointer; transition: all 0.3s; }
.avatar-head { width: 30px; height: 30px; background: #fdbcb4; border-radius: 50%; }
.avatar-body { width: 30px; height: 30px; background: #333; margin-top: -5px; }
.avatar-name { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; white-space: nowrap; }
.furniture { position: absolute; cursor: move; }
.couch { width: 100px; height: 50px; background: #8b4513; border: 2px solid #654321; }
.plant { width: 40px; height: 60px; background: #228b22; border-radius: 50% 50% 0 0; }
.table { width: 80px; height: 40px; background: #654321; }
.pool { background: #4682b4; border: 10px solid #daa520; }
.chair { width: 40px; height: 40px; background: #d2691e; }
.umbrella { width: 60px; height: 80px; background: linear-gradient(to bottom, #ff6347 70%, #8b4513 70%); }
.chat { position: absolute; bottom: 0; left: 0; right: 200px; height: 200px; background: rgba(0,0,0,0.8); }
.chat-messages { height: 140px; overflow-y: auto; padding: 10px; color: #fff; font-size: 14px; }
.chat-input { display: flex; padding: 10px; }
.chat-input input { flex: 1; padding: 8px; background: #333; border: 1px solid #666; color: #fff; }
.chat-input button { padding: 8px 20px; background: #4CAF50; color: #fff; border: none; cursor: pointer; }
.user-list { width: 200px; background: #2a2a2a; padding: 20px; }
.user-item { padding: 8px; color: #fff; font-size: 14px; }
.room-title { position: absolute; top: 20px; left: 20px; font-size: 24px; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
.dance-btn { position: absolute; top: 20px; right: 20px; padding: 10px 20px; background: #ff6347; color: #fff; border: none; cursor: pointer; border-radius: 20px; }
.dancing { animation: dance 0.5s infinite alternate; }
@keyframes dance { 
  0% { transform: rotate(-5deg) translateY(0); }
  100% { transform: rotate(5deg) translateY(-10px); }
}
.emote { position: absolute; background: #fff; padding: 5px 10px; border-radius: 15px; font-size: 20px; animation: emoteFloat 2s ease-out; }
@keyframes emoteFloat {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-50px); }
}
</style>
</head>
<body>
<div class="container">
  <div class="room-list">
    <h3 style="color: #fff; margin-bottom: 20px;">Rooms</h3>
    <div class="room-item" onclick="joinRoom('lobby')">🏠 Welcome Lobby</div>
    <div class="room-item" onclick="joinRoom('pool')">🏊 Pool Party</div>
    <div class="room-item" onclick="joinRoom('club')">🎵 Dance Club</div>
    <div class="room-item" onclick="joinRoom('game')">🎮 Game Room</div>
    <div class="room-item" onclick="createRoom()">➕ Create Room</div>
  </div>
  
  <div class="room-view" id="roomView">
    <div class="room-title" id="roomTitle">Welcome Lobby</div>
    <button class="dance-btn" onclick="toggleDance()">Dance!</button>
    <div class="room-floor" id="roomFloor"></div>
  </div>
  
  <div class="chat">
    <div class="chat-messages" id="chatMessages">
      <div style="color: #4CAF50;">Welcome to Habbo Rooms! Click to move your avatar.</div>
    </div>
    <div class="chat-input">
      <input type="text" id="chatInput" placeholder="Say something..." onkeypress="if(event.key==='Enter')sendChat()">
      <button onclick="sendChat()">Send</button>
    </div>
  </div>
  
  <div class="user-list">
    <h3 style="color: #fff; margin-bottom: 20px;">In Room</h3>
    <div id="userList"></div>
  </div>
</div>

<script>
let myAvatar = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  name: prompt('Enter your name:') || 'Guest',
  x: 300,
  y: 200,
  room: 'lobby',
  dancing: false,
  color: '#' + Math.floor(Math.random()*16777215).toString(16)
};

let currentRoom = 'lobby';
let avatars = new Map();
avatars.set(myAvatar.id, myAvatar);

// Create avatar element
function createAvatar(user) {
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.id = 'avatar-' + user.id;
  avatar.innerHTML = \`
    <div class="avatar-name">\${user.name}</div>
    <div class="avatar-head"></div>
    <div class="avatar-body" style="background: \${user.color}"></div>
  \`;
  avatar.style.left = user.x + 'px';
  avatar.style.bottom = user.y + 'px';
  
  if (user.id === myAvatar.id) {
    avatar.style.zIndex = 1000;
  }
  
  return avatar;
}

// Initialize room
function initRoom() {
  const floor = document.getElementById('roomFloor');
  floor.innerHTML = '';
  
  // Add my avatar
  floor.appendChild(createAvatar(myAvatar));
  
  // Add furniture
  const roomData = getRoomData(currentRoom);
  roomData.furniture.forEach(item => {
    const furn = document.createElement('div');
    furn.className = 'furniture ' + item.type;
    furn.style.left = item.x + 'px';
    furn.style.bottom = item.y + 'px';
    if (item.width) furn.style.width = item.width + 'px';
    if (item.height) furn.style.height = item.height + 'px';
    floor.appendChild(furn);
  });
  
  // Simulate other users
  if (Math.random() > 0.5) {
    addBotUser('CoolDude', 400, 250);
  }
  if (Math.random() > 0.5) {
    addBotUser('PartyGirl', 200, 300);
  }
}

function getRoomData(roomId) {
  const rooms = {
    lobby: {
      furniture: [
        { type: 'couch', x: 200, y: 200 },
        { type: 'plant', x: 100, y: 100 },
        { type: 'table', x: 300, y: 250 }
      ]
    },
    pool: {
      furniture: [
        { type: 'pool', x: 200, y: 200, width: 300, height: 200 },
        { type: 'chair', x: 150, y: 150 },
        { type: 'umbrella', x: 400, y: 150 }
      ]
    },
    club: {
      furniture: [
        { type: 'couch', x: 100, y: 100 },
        { type: 'couch', x: 400, y: 100 },
        { type: 'table', x: 250, y: 300 }
      ]
    },
    game: {
      furniture: [
        { type: 'table', x: 250, y: 250 },
        { type: 'chair', x: 200, y: 250 },
        { type: 'chair', x: 300, y: 250 }
      ]
    }
  };
  return rooms[roomId] || rooms.lobby;
}

function addBotUser(name, x, y) {
  const bot = {
    id: 'bot_' + Math.random().toString(36).substr(2, 9),
    name: name,
    x: x,
    y: y,
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  };
  avatars.set(bot.id, bot);
  document.getElementById('roomFloor').appendChild(createAvatar(bot));
  updateUserList();
  
  // Bot random movement
  setInterval(() => {
    if (Math.random() > 0.7) {
      bot.x = Math.max(50, Math.min(600, bot.x + (Math.random() - 0.5) * 100));
      bot.y = Math.max(50, Math.min(350, bot.y + (Math.random() - 0.5) * 100));
      const botEl = document.getElementById('avatar-' + bot.id);
      if (botEl) {
        botEl.style.left = bot.x + 'px';
        botEl.style.bottom = bot.y + 'px';
      }
    }
  }, 3000);
}

// Room click to move
document.getElementById('roomFloor').addEventListener('click', (e) => {
  if (e.target.classList.contains('furniture')) return;
  
  const rect = e.currentTarget.getBoundingClientRect();
  myAvatar.x = e.clientX - rect.left;
  myAvatar.y = rect.height - (e.clientY - rect.top);
  
  const avatar = document.getElementById('avatar-' + myAvatar.id);
  avatar.style.left = myAvatar.x + 'px';
  avatar.style.bottom = myAvatar.y + 'px';
});

function joinRoom(roomId) {
  currentRoom = roomId;
  document.getElementById('roomTitle').textContent = getRoomTitle(roomId);
  addChatMessage('System', 'You joined ' + getRoomTitle(roomId));
  initRoom();
  updateUserList();
}

function getRoomTitle(roomId) {
  const titles = {
    lobby: 'Welcome Lobby',
    pool: 'Pool Party',
    club: 'Dance Club',
    game: 'Game Room'
  };
  return titles[roomId] || 'Custom Room';
}

function toggleDance() {
  myAvatar.dancing = !myAvatar.dancing;
  const avatar = document.getElementById('avatar-' + myAvatar.id);
  avatar.classList.toggle('dancing');
  
  if (myAvatar.dancing) {
    showEmote(myAvatar.x, myAvatar.y, '🎵');
    addChatMessage(myAvatar.name, '*dances*');
  }
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  
  addChatMessage(myAvatar.name, message);
  
  // Check for emotes
  if (message.includes(':)')) showEmote(myAvatar.x, myAvatar.y, '😊');
  if (message.includes(':D')) showEmote(myAvatar.x, myAvatar.y, '😄');
  if (message.includes(':(')) showEmote(myAvatar.x, myAvatar.y, '😢');
  if (message.includes('<3')) showEmote(myAvatar.x, myAvatar.y, '❤️');
  
  input.value = '';
}

function addChatMessage(name, message) {
  const chat = document.getElementById('chatMessages');
  const msgEl = document.createElement('div');
  msgEl.innerHTML = \`<strong style="color: #4CAF50;">\${name}:</strong> \${message}\`;
  chat.appendChild(msgEl);
  chat.scrollTop = chat.scrollHeight;
}

function showEmote(x, y, emote) {
  const emoteEl = document.createElement('div');
  emoteEl.className = 'emote';
  emoteEl.textContent = emote;
  emoteEl.style.left = x + 'px';
  emoteEl.style.bottom = (y + 70) + 'px';
  document.getElementById('roomFloor').appendChild(emoteEl);
  setTimeout(() => emoteEl.remove(), 2000);
}

function updateUserList() {
  const list = document.getElementById('userList');
  list.innerHTML = '';
  avatars.forEach(user => {
    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.textContent = user.name;
    list.appendChild(userEl);
  });
}

function createRoom() {
  const roomName = prompt('Room name:');
  if (roomName) {
    addChatMessage('System', 'Created room: ' + roomName);
  }
}

// Initialize
initRoom();
updateUserList();

// Bot chat
setInterval(() => {
  const botMessages = [
    'Hey everyone!',
    'Nice room!',
    'Anyone want to play?',
    ':)',
    'This is fun!',
    '*dances*'
  ];
  
  avatars.forEach(user => {
    if (user.id.startsWith('bot_') && Math.random() > 0.9) {
      addChatMessage(user.name, botMessages[Math.floor(Math.random() * botMessages.length)]);
    }
  });
}, 5000);
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(habboHTML);
});

server.listen(PORT, () => {
  console.log(`\n🏨 HABBO STYLE ROOMS - http://localhost:${PORT}\n`);
  console.log('Features:');
  console.log('- Click to move avatar');
  console.log('- Multiple rooms');
  console.log('- Live chat with emotes');
  console.log('- Dancing');
  console.log('- Other users (bots)');
  console.log('- Furniture');
  console.log('\nJust like old Habbo Hotel!');
});