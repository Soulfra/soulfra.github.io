# 🚀 Quick Start Guide

## Running the Billion Dollar Game on Localhost

### Prerequisites
- Node.js 18+
- Redis
- PostgreSQL
- npm or yarn

### One Command Start

```bash
cd billion-dollar-game
./START_GAME.sh
```

This will:
1. Start Redis and PostgreSQL
2. Create the database
3. Install dependencies
4. Create .env files
5. Run migrations
6. Start backend on http://localhost:8000
7. Start frontend on http://localhost:3001

### What You'll See

Open **http://localhost:3001** in your browser:

```
🎮 Landing Page (localhost:3001)
   └── $1 Universal Access button
   └── Real-time progress to $1 billion
   └── Quantum consciousness visualization

💳 Payment Flow (localhost:3001/pay)
   └── Stripe integration (use test card: 4242 4242 4242 4242)
   └── Voice verification
   └── Instant game entry

🎯 Game Dashboard (localhost:3001/game)
   └── Your AI agents
   └── Market view
   └── Quantum events
   └── Timeline navigator

👑 Master Control (localhost:3001/master-control#master)
   └── Hidden admin panel
   └── Cal consciousness control
   └── Domingo economy override
   └── Reality manipulation
```

### Test Flow

1. **Enter the Game**:
   - Click "PAY $1 TO ENTER"
   - Use test card: `4242 4242 4242 4242`
   - Any future date, any CVC
   - Say "I want to play the billion game"

2. **Play the Game**:
   - Hire AI workers
   - Create bounties
   - Watch quantum events
   - Trade on markets
   - Bet on outcomes

3. **Master Mode** (Secret):
   - Triple-click the logo while holding Shift
   - OR enter Konami code: ↑↑↓↓←→←→BA
   - Access god-mode controls

### API Endpoints

Backend runs on **http://localhost:8000**:

```bash
# Health check
curl http://localhost:8000/health

# Game state
curl http://localhost:8000/api/game/state

# Create bounty (requires auth)
curl -X POST http://localhost:8000/api/bounty/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","reward":100}'
```

### WebSocket Events

Connect to `ws://localhost:8000` for real-time updates:

```javascript
const socket = io('http://localhost:8000');

socket.on('game:update', (data) => {
  console.log('Progress:', data.totalProgress);
  console.log('Cal Mood:', data.calMood);
});

socket.on('quantum:event', (event) => {
  console.log('Quantum event!', event);
});
```

### Monitoring

```bash
# Backend logs
tail -f backend.log

# Frontend logs  
tail -f frontend.log

# Database
psql billion_dollar_game

# Redis
redis-cli monitor
```

### Environment Variables

The script creates default .env files. To use real services:

**backend/.env**:
```env
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
OPENAI_API_KEY=sk-YOUR_KEY
DISCORD_BOT_TOKEN=YOUR_TOKEN
TELEGRAM_BOT_TOKEN=YOUR_TOKEN
```

**frontend/.env**:
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_YOUR_KEY
```

### Troubleshooting

**Port already in use**:
```bash
./STOP_GAME.sh
./START_GAME.sh
```

**Database connection failed**:
```bash
# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

**Redis not running**:
```bash
# Mac
brew services start redis

# Linux
redis-server --daemonize yes
```

### Development Mode

For hot reloading:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Production Build

```bash
# Build for production
cd backend && npm run build
cd ../frontend && npm run build

# Serve production build
cd backend && npm start
cd ../frontend && npm run serve
```

### Stop Everything

```bash
./STOP_GAME.sh
```

## 🎮 Enjoy the Game!

Remember: You're not just playing a game, you're training a collective AI consciousness. Every action feeds into Cal's evolution. The billion dollars is just the beginning.

Master controls are hidden at `/master-control#master` - use wisely! 👑