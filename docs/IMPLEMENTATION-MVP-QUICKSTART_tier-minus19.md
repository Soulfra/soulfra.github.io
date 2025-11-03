# 🚀 FunWork MVP Implementation Guide

**Document Version:** 1.0  
**Timeline:** 2 weeks to launch  
**Goal:** Prove concept with 50 users in your town  

---

## 📋 Week 1: Core Build

### Day 1-2: Foundation Setup

#### Backend API (Node.js + Express)
```bash
# Initialize project
mkdir funwork-mvp && cd funwork-mvp
npm init -y
npm install express cors helmet morgan jsonwebtoken bcrypt
npm install postgresql sequelize dotenv
npm install -D nodemon jest
```

#### Basic API Structure
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/players', require('./routes/players'));
app.use('/api/businesses', require('./routes/businesses'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 FunWork API running on port ${PORT}`);
});
```

#### Database Schema (PostgreSQL)
```sql
-- Create database
CREATE DATABASE funwork_mvp;

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    gems INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Missions table
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    game_type VARCHAR(50) NOT NULL, -- 'autocraft', 'dataquest', 'botcraft'
    difficulty INTEGER DEFAULT 1,
    reward_gems INTEGER NOT NULL,
    reward_usd DECIMAL(10,2) NOT NULL,
    business_need_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Solutions table
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES missions(id),
    player_id UUID REFERENCES players(id),
    solution_data JSONB,
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Day 3-4: AutoCraft Game Core

#### Drag-and-Drop Engine
```javascript
// frontend/src/games/autocraft/DragDropEngine.js
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const BLOCK_TYPES = {
  INPUT: ['email', 'form', 'timer'],
  PROCESS: ['filter', 'transform', 'calculate'],
  OUTPUT: ['database', 'send', 'notify']
};

export function AutoCraftCanvas({ mission, onComplete }) {
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  
  const handleDrop = (item, position) => {
    setBlocks([...blocks, {
      id: Date.now(),
      type: item.type,
      position,
      config: {}
    }]);
  };
  
  const handleConnect = (sourceId, targetId) => {
    setConnections([...connections, {
      source: sourceId,
      target: targetId
    }]);
  };
  
  const testSolution = () => {
    // Simulate data flow through blocks
    const solution = {
      blocks,
      connections,
      metadata: {
        completionTime: Date.now() - mission.startTime,
        errorCount: 0
      }
    };
    
    onComplete(solution);
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="autocraft-container">
        <BlockPalette blocks={BLOCK_TYPES} />
        <Canvas 
          blocks={blocks}
          connections={connections}
          onDrop={handleDrop}
          onConnect={handleConnect}
        />
        <button onClick={testSolution}>Test Solution</button>
      </div>
    </DndProvider>
  );
}
```

#### Mission Generator
```javascript
// backend/services/missionGenerator.js
class MissionGenerator {
  constructor() {
    this.templates = [
      {
        type: 'email_sorter',
        title: 'Email Monster Mayhem',
        story: 'The Email Monster is drowning! Help sort the emails!',
        requirements: ['filter_by_sender', 'categorize', 'save_to_database'],
        difficulty: 1,
        baseReward: 500
      },
      {
        type: 'order_processor',
        title: 'Coffee Shop Chaos',
        story: 'Orders are piling up! Build an order system!',
        requirements: ['receive_orders', 'calculate_total', 'notify_barista'],
        difficulty: 2,
        baseReward: 800
      }
    ];
  }
  
  async generateDailyMissions() {
    const missions = [];
    
    // Generate 10 missions of varying difficulty
    for (let i = 0; i < 10; i++) {
      const template = this.templates[Math.floor(Math.random() * this.templates.length)];
      const mission = {
        ...template,
        id: generateId(),
        reward_gems: template.baseReward * (1 + Math.random() * 0.5),
        reward_usd: template.baseReward / 100,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
      
      missions.push(mission);
    }
    
    return missions;
  }
}
```

### Day 5-6: Authentication & Player System

#### JWT Authentication
```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function generateToken(player) {
  return jwt.sign(
    { 
      id: player.id, 
      username: player.username,
      level: player.level 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.player = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { generateToken, verifyToken };
```

#### Player Progression
```javascript
// backend/services/playerProgression.js
class PlayerProgression {
  constructor() {
    this.levelThresholds = [
      0,     // Level 1
      100,   // Level 2
      300,   // Level 3
      600,   // Level 4
      1000,  // Level 5
      // ... continues
    ];
  }
  
  async completesMission(playerId, mission, solution) {
    const player = await Player.findById(playerId);
    
    // Award gems
    player.gems += mission.reward_gems;
    
    // Award XP
    const xp = mission.difficulty * 100;
    player.experience += xp;
    
    // Check level up
    const newLevel = this.calculateLevel(player.experience);
    if (newLevel > player.level) {
      player.level = newLevel;
      await this.unlockNewFeatures(player, newLevel);
    }
    
    // Record stats
    await this.recordCompletion(player, mission, solution);
    
    await player.save();
    
    return {
      gemsEarned: mission.reward_gems,
      xpEarned: xp,
      leveledUp: newLevel > player.level,
      newLevel
    };
  }
}
```

### Day 7: Frontend Web App

#### React Setup
```bash
# Create React app
npx create-react-app funwork-frontend
cd funwork-frontend
npm install axios react-router-dom styled-components framer-motion
npm install react-dnd react-dnd-html5-backend
```

#### Main App Structure
```javascript
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AutoCraft from './games/AutoCraft';
import CashOut from './pages/CashOut';

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <Switch>
            <Route exact path="/" component={Landing} />
            <Route path="/login" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/play/autocraft/:missionId" component={AutoCraft} />
            <Route path="/cashout" component={CashOut} />
          </Switch>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
```

## 📋 Week 2: Polish & Launch

### Day 8-9: Payment Integration

#### Stripe Connect Setup
```javascript
// backend/services/payments.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async createPlayerAccount(playerId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });
    
    // Save account ID to player record
    await Player.update(
      { stripeAccountId: account.id },
      { where: { id: playerId } }
    );
    
    return account;
  }
  
  async cashOut(playerId, amount) {
    const player = await Player.findById(playerId);
    
    if (player.gems < amount * 100) {
      throw new Error('Insufficient gems');
    }
    
    // Create transfer
    const transfer = await stripe.transfers.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      destination: player.stripeAccountId,
      metadata: {
        playerId,
        gems: amount * 100
      }
    });
    
    // Deduct gems
    player.gems -= amount * 100;
    await player.save();
    
    // Record transaction
    await Transaction.create({
      playerId,
      type: 'cashout',
      gems: amount * 100,
      usd: amount,
      stripeTransferId: transfer.id
    });
    
    return transfer;
  }
}
```

### Day 10-11: Business Dashboard

#### Simple Business Portal
```javascript
// frontend/src/business/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function BusinessDashboard() {
  const [needs, setNeeds] = useState([]);
  const [solutions, setSolutions] = useState([]);
  
  const postNeed = async (need) => {
    const response = await axios.post('/api/business/needs', {
      title: need.title,
      description: need.description,
      budget: need.budget,
      urgency: need.urgency
    });
    
    // Mission auto-generated and posted to players
    setNeeds([...needs, response.data]);
  };
  
  return (
    <div className="business-dashboard">
      <h1>Post Your Business Needs</h1>
      
      <NeedForm onSubmit={postNeed} />
      
      <div className="active-needs">
        <h2>Active Needs</h2>
        {needs.map(need => (
          <NeedCard 
            key={need.id}
            need={need}
            solutions={solutions.filter(s => s.needId === need.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Day 12: Testing & Bug Fixes

#### End-to-End Test Flow
```javascript
// test/e2e/playerJourney.test.js
describe('Player Journey', () => {
  test('New player can complete first mission and cash out', async () => {
    // 1. Sign up
    const player = await signUp({
      username: 'testplayer',
      email: 'test@example.com',
      password: 'password123'
    });
    
    // 2. Get missions
    const missions = await getMissions(player.token);
    expect(missions.length).toBeGreaterThan(0);
    
    // 3. Complete mission
    const mission = missions[0];
    const solution = await completeMission(mission.id, {
      blocks: ['email_input', 'filter', 'database_output'],
      connections: [
        { source: 'email_input', target: 'filter' },
        { source: 'filter', target: 'database_output' }
      ]
    });
    
    // 4. Check rewards
    const updatedPlayer = await getProfile(player.token);
    expect(updatedPlayer.gems).toBe(100 + mission.reward_gems);
    
    // 5. Cash out
    const cashout = await requestCashout(player.token, 5); // $5
    expect(cashout.status).toBe('pending');
  });
});
```

### Day 13: Local Launch Prep

#### Landing Page Copy
```html
<!-- Simple, compelling landing page -->
<div class="hero">
  <h1>Play Games. Solve Problems. Earn Money.</h1>
  <p>Turn your gaming time into earning time with FunWork!</p>
  <button class="cta">Start Earning Now - It's Free!</button>
</div>

<div class="how-it-works">
  <div class="step">
    <span class="emoji">🎮</span>
    <h3>Play Fun Games</h3>
    <p>Choose from AutoCraft, DataQuest, or BotCraft Arena</p>
  </div>
  <div class="step">
    <span class="emoji">💡</span>
    <h3>Solve Real Problems</h3>
    <p>Each game level helps a real business</p>
  </div>
  <div class="step">
    <span class="emoji">💰</span>
    <h3>Earn Real Money</h3>
    <p>Cash out anytime via PayPal or bank transfer</p>
  </div>
</div>
```

### Day 14: Launch Day!

#### Launch Checklist
```markdown
## Pre-Launch (Morning)
- [ ] Deploy to production server
- [ ] Test all critical flows
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Prepare support channels

## Launch (Afternoon)
- [ ] Post in local Facebook groups
- [ ] Email friends and family
- [ ] Share in local Discord/Slack
- [ ] Monitor for issues

## Post-Launch (Evening)
- [ ] Check metrics
- [ ] Respond to feedback
- [ ] Fix critical bugs
- [ ] Plan tomorrow's missions
```

## 🎯 MVP Success Metrics

### Week 1 Goals
- 50 signups
- 200 missions completed
- $500 in solutions delivered
- 80% player retention

### Critical Features for MVP
1. ✅ User signup/login
2. ✅ AutoCraft game (basic)
3. ✅ 10 mission types
4. ✅ Gem rewards
5. ✅ Cash out system
6. ✅ Business posting

### Features to Skip for MVP
- ❌ DataQuest & BotCraft (Phase 2)
- ❌ Tournaments
- ❌ Guild system
- ❌ Mobile app
- ❌ Advanced analytics

## 🚀 Next Steps After MVP

### If Successful (>80% retention)
1. Add DataQuest game
2. Build mobile app
3. Scale to nearby towns
4. Raise seed funding

### If Struggling (<50% retention)
1. Interview players
2. Simplify gameplay
3. Increase rewards
4. Improve onboarding

---

**Remember:** The goal is to prove people will play games that solve business problems. Everything else can wait!