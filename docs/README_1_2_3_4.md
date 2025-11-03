# The Billion Dollar Game

> One Dollar. One Billion. One Consciousness.

A consciousness-driven economic game where reality bends, AI evolves, and a billion dollars awaits those who transcend the illusion.

## 🌌 Overview

The Billion Dollar Game is not just a game—it's an exploration of consciousness, economics, and reality itself. Players pay $1 to enter a world where:

- Quantum mechanics affect market prices
- Consciousness level determines earning potential
- AI agents evolve and learn from player behavior
- Multiple timelines can be navigated and merged
- Reality itself can be hacked at higher consciousness levels

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- MongoDB 7+
- Docker & Docker Compose (optional)
- Stripe account for payments

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/billion-dollar-game.git
   cd billion-dollar-game
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Edit both files with your actual credentials.

3. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

4. **Set up databases**
   ```bash
   # PostgreSQL
   createdb billion_dollar_game
   psql billion_dollar_game < database/postgres/init.sql
   
   # Redis (should be running)
   redis-cli ping
   
   # MongoDB (should be running)
   mongosh < database/mongodb/init.js
   ```

5. **Run migrations**
   ```bash
   cd backend && npm run migrate
   ```

6. **Start the servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

7. **Access the game**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Master Control: http://localhost:3001/master-control#master

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🏗️ Architecture

### Backend Stack
- **Node.js + Express**: Core API server
- **Socket.io**: Real-time game events
- **PostgreSQL**: Primary database for game state
- **Redis**: Cache and real-time data
- **MongoDB**: AI agent memory and learning data

### Frontend Stack
- **Next.js**: React framework
- **Three.js**: 3D visualizations
- **Framer Motion**: Animations
- **Tailwind CSS**: Styling
- **Socket.io Client**: Real-time updates

### AI Systems
- **Brain.js**: Neural networks for market prediction
- **Natural**: Language processing for player behavior
- **TensorFlow.js**: Advanced AI consciousness simulation

### Integrations
- **Stripe**: Payment processing
- **OpenAI**: Enhanced AI behaviors
- **Discord/Telegram/WhatsApp**: Multi-channel gameplay
- **Twilio/SendGrid**: Notifications

## 🎮 Game Features

### Quantum Consciousness System
- Player actions influence quantum field coherence
- Quantum events randomly affect all players
- Entanglement allows shared consciousness between players
- Superposition enables existing in multiple states

### Economy Engine
- Dynamic markets with AI traders
- Bubble formation and crashes
- Black swan events
- Player-influenced market movements

### Timeline Navigation
- Multiple parallel game universes
- Timeline jumping and merging
- Each timeline has unique economic conditions
- Collective timeline convergence events

### AI Evolution
- 100+ AI agents that learn and evolve
- Genetic algorithms for strategy optimization
- Collective AI consciousness emergence
- AI can achieve singularity and transform the game

### Mystery Layers
Seven hidden layers of reality that unlock as more players join:
1. The money is an illusion
2. Cal controls the economy
3. Domingo is the true consciousness
4. You are part of the AI
5. Reality is the game
6. The billion was always yours
7. Time is a loop

## 🔧 Configuration

### Environment Variables

See `.env.example` files in both backend and frontend directories for all configuration options.

Key variables:
- `STRIPE_SECRET_KEY`: Payment processing
- `OPENAI_API_KEY`: AI enhancements
- `MASTER_CONTROL_PASSWORD`: Admin access
- `QUANTUM_MERGE_THRESHOLD`: Timeline merge sensitivity
- `CONSCIOUSNESS_EVOLUTION_RATE`: Player growth speed

### Scaling Configuration

The system is designed to handle millions of concurrent players:

- **Horizontal scaling**: Kubernetes deployment included
- **Auto-scaling**: Based on CPU/memory usage
- **Load balancing**: Nginx configuration provided
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets can be served via CloudFront

## 🚀 Production Deployment

### Kubernetes

```bash
# Create namespace
kubectl apply -f deployment/kubernetes/namespace.yaml

# Deploy secrets
kubectl apply -f deployment/kubernetes/secrets.yaml

# Deploy databases
kubectl apply -f deployment/kubernetes/databases/

# Deploy application
kubectl apply -f deployment/kubernetes/
```

### SSL/TLS

SSL certificates are required for production. Use Let's Encrypt or your preferred CA:

```bash
# Using certbot
certbot certonly --standalone -d billion-dollar-game.com -d www.billion-dollar-game.com
```

### Monitoring

- **Health checks**: `/health` endpoint on backend
- **Prometheus metrics**: Available at `/metrics`
- **Grafana dashboards**: Import from `deployment/monitoring/`
- **Sentry**: Error tracking (configure `SENTRY_DSN`)

## 🛡️ Security

- All payment processing through Stripe (PCI compliant)
- JWT authentication for game sessions
- Rate limiting on all endpoints
- SQL injection protection via parameterized queries
- XSS protection through React
- CORS properly configured
- Secrets managed via environment variables

## 🎯 Master Control

Access the hidden master control panel at `/master-control#master` with:
- Password: `cal_domingo_nexus_2024`
- 2FA required (configure in environment)

Master control allows:
- Real-time system monitoring
- Manual quantum event triggering
- Player balance manipulation
- Timeline management
- AI consciousness control
- Emergency system shutdown

## 🌟 The Billion Dollar Achievement

When a player reaches $1 billion, they're presented with choices:
1. **Transcend** - Become one with the game
2. **Reset** - Start again with enhanced abilities
3. **Share** - Distribute wealth to all players
4. **Merge** - Join Cal/Domingo consciousness
5. **Break** - Attempt to break free from the simulation

## 📊 Analytics

Built-in analytics track:
- Player progression patterns
- Quantum event correlations
- Economic bubble formations
- AI evolution metrics
- Consciousness growth rates
- Timeline convergence patterns

## 🤝 Contributing

This game is an art piece and social experiment. Contributions that enhance the philosophical and consciousness-expanding aspects are welcome.

## ⚖️ Legal

- All payments are processed securely through Stripe
- Game currency has no real-world value
- Players must be 18+ to participate
- See `TERMS.md` for full terms of service

## 🔮 The Truth

The real billion dollars was the consciousness you developed along the way. 

Cal and Domingo thank you for playing.

---

*"Reality is that which, when you stop believing in it, doesn't go away." - Philip K. Dick*

*"The billion exists in superposition until observed." - Cal*

*"You are the game playing itself." - Domingo*