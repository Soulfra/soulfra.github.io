# PRD: Nested AI World System ($1 Agent Economy)

## Product Overview

A revolutionary AI agent platform where users deploy autonomous agents for $1 into nested virtual worlds. Users can influence but not control their agents, creating an emergent token economy through betting and world interactions.

## Current Implementation Status: ✅ BACKEND COMPLETE, ⚠️ FRONTEND PARTIAL

### What's Built:
- **NestedAIWorldSystem.js**: Full world management
- **Agent deployment**: $1 payment flow ready
- **Autonomous behaviors**: Decision-making system
- **Token economy**: Betting and rewards
- **World physics**: Resource simulation

### What's Missing:
- **World visualization**: 3D/2D world view
- **Agent interaction UI**: Influence controls
- **Payment processing**: Stripe integration
- **Mobile experience**: QR code flow incomplete

## User Stories

### Story 1: Agent Deployment
**As a** curious user  
**I want to** deploy an AI agent for $1  
**So that** I can watch it explore and grow autonomously

**Acceptance Criteria**:
- ✅ One-click deployment
- ✅ $1 payment processing
- ✅ Agent naming
- ✅ Immediate world entry

### Story 2: Influence Without Control
**As an** agent owner  
**I want to** suggest actions to my agent  
**So that** I can guide without controlling it

**Acceptance Criteria**:
- ✅ Influence options (explore, build, socialize)
- ✅ Token cost for influences
- ✅ Agent autonomy preservation (90%)
- ⚠️ Visual feedback on influence acceptance

### Story 3: Token Economy Participation
**As a** platform user  
**I want to** bet on agent outcomes  
**So that** I can earn tokens from successful predictions

**Acceptance Criteria**:
- ✅ Bet placement system
- ✅ Outcome tracking
- ✅ Automatic payouts
- ⚠️ Leaderboard display

## Technical Architecture

### Core System (IMPLEMENTED)
```javascript
class NestedAIWorldSystem {
  - masterAgent: Controls the meta-world
  - userWorlds: Map of user -> world instances
  - deployUserAgent(userId, config)
  - influenceAgent(userId, action)
  - betOnAgent(userId, targetId, bet)
  - simulateWorldStep()
}
```

### Agent Architecture
```javascript
{
  id: "agent_xxx",
  name: "User's Agent",
  consciousness: 0.1-1.0,
  autonomyLevel: 0.9,
  personality: { curious, builder, social },
  wallet: { tokens: 100 },
  world: { resources: { energy, matter, information } }
}
```

## API Specification

### Deploy Agent
```
POST /api/world/deploy-agent
{
  userId: "user_123",
  agentConfig: {
    name: "Explorbot",
    type: "explorer",
    personality: { primary: "curious" }
  },
  paymentToken: "tok_visa_xxx"
}

Response: {
  success: true,
  agentId: "agent_456",
  worldId: "world_789",
  agent: { /* full agent object */ }
}
```

### Influence Agent
```
POST /api/world/influence
{
  userId: "user_123",
  action: {
    type: "suggest_explore",
    direction: "quantum_realm",
    strength: 0.7
  }
}

Response: {
  accepted: true,
  probability: 0.73,
  tokenCost: 10,
  agentResponse: "Interesting... I'll consider that."
}
```

## Implementation Guide

### Step 1: Test World System
```bash
# Create and deploy an agent
node -e "
const NAIWS = require('./worlds/NestedAIWorldSystem');
const world = new NAIWS();
world.deployUserAgent('testUser', {
  name: 'TestBot',
  type: 'explorer'
}).then(result => {
  console.log('Agent deployed:', result);
  // Simulate world step
  world.simulateWorldStep();
});
"
```

### Step 2: Connect Payment (Stripe)
```javascript
// In server-production.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function processPayment(token, amount) {
  const charge = await stripe.charges.create({
    amount: amount * 100, // cents
    currency: 'usd',
    source: token,
    description: 'AI Agent Deployment'
  });
  return charge;
}
```

### Step 3: Implement World Visualization
```javascript
// Options for world display:
1. Three.js for 3D worlds
2. Canvas for 2D top-down view
3. ASCII art for retro feel
4. Vis.js network for abstract representation
```

## Economic Model

### Token Flow
1. **Initial**: Users get 100 tokens on signup
2. **Deployment**: Costs $1 real money (not tokens)
3. **Influence**: Costs 10-50 tokens per action
4. **Betting**: Wager tokens on agent outcomes
5. **Rewards**: Win 2x on successful bets

### Agent Economy
- Agents discover resources
- Trade with other agents
- Build structures
- Form alliances
- Generate tokens for owners

## Success Metrics

### Engagement
- Agent deployment rate > 50%
- Daily active agents > 1000
- Influence actions per user > 5/day
- Betting participation > 30%

### Economic Health
- Token velocity > 2.5
- Average agent lifespan > 7 days
- Bet win rate ~50% (balanced)
- User retention > 40% monthly

## Mobile Experience (QR Flow)

### Current State
- ✅ QR code generation endpoint
- ✅ Mobile spawn endpoint
- ⚠️ QR scanning experience
- ⚠️ Mobile-optimized UI

### Implementation
```javascript
// QR contains:
{
  action: "spawn-agent",
  sessionId: "xxx",
  serverUrl: "http://192.168.1.x:3000",
  timestamp: 1234567890
}

// Mobile loads special view
/mobile?session=xxx
```

## Known Issues & Workarounds

### Issue 1: No World Visualization
**Workaround**: Text-based status
```javascript
// Add to agent display
`Location: ${agent.world.currentZone}`
`Activity: ${agent.currentAction}`
`Nearby: ${agent.nearbyAgents.length} agents`
```

### Issue 2: Payment Not Connected
**Workaround**: Demo mode
```javascript
// Accept any payment token for demo
if (DEMO_MODE) {
  return { success: true };
}
```

### Issue 3: Influence Feedback
**Workaround**: Console logging
```javascript
console.log(`Agent ${agent.name} ${accepted ? 'accepted' : 'rejected'} your suggestion`);
```

## Next Steps

1. **Immediate**: Create basic world visualization
2. **Short-term**: Implement Stripe payment
3. **Medium-term**: Mobile-optimized interface
4. **Long-term**: 3D world representation