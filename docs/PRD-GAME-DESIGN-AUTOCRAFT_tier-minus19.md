# 🏗️ PRD: AutoCraft Game Design

**Document Version:** 1.0  
**Game Name:** AutoCraft - The Automation Building Adventure  
**Document Type:** Game Design Document  
**Target Audience:** All players (focus on visual learners)  

---

## 🎮 Game Overview

AutoCraft is a drag-and-drop automation building game where players solve real business challenges by connecting colorful blocks. Think Minecraft meets Zapier, but fun and rewarding.

## 🎯 Core Game Loop

```
1. RECEIVE QUEST → "The Email Monster needs help!"
2. BUILD SOLUTION → Drag blocks to create automation
3. TEST & DEBUG → Watch cute animations show data flow
4. EARN REWARDS → Gems explode across screen
5. LEVEL UP → Unlock new blocks and abilities
```

## 🧩 Game Mechanics

### Block Types

#### 1. Input Blocks (Blue)
```
┌─────────────┐
│ 📧 Email    │ → Receives emails
└─────────────┘

┌─────────────┐
│ 📝 Form     │ → Collects user input
└─────────────┘

┌─────────────┐
│ 🕐 Timer    │ → Triggers on schedule
└─────────────┘
```

#### 2. Processing Blocks (Green)
```
┌─────────────┐
│ 🔍 Filter   │ → Sorts data by rules
└─────────────┘

┌─────────────┐
│ 🔄 Transform│ → Changes data format
└─────────────┘

┌─────────────┐
│ 🧮 Calculate│ → Does math/logic
└─────────────┘
```

#### 3. Output Blocks (Purple)
```
┌─────────────┐
│ 💾 Database │ → Stores information
└─────────────┘

┌─────────────┐
│ 📨 Send     │ → Sends emails/messages
└─────────────┘

┌─────────────┐
│ 🔔 Notify   │ → Alerts users
└─────────────┘
```

### Connection System

Players connect blocks by dragging "energy pipes" between them:

```
📧 Email ═══╗
            ╠═══ 🔍 Filter ═══ 💾 Database
📝 Form  ═══╝
```

### Visual Feedback

#### During Building
- Blocks glow when compatible
- Pipes pulse with data flow
- Cute mascots give hints
- Error blocks shake and turn red

#### During Testing
```javascript
// Visual test mode shows:
- Animated data packets flowing through pipes
- Each packet has a face showing its mood
- Happy packets = working correctly
- Sad packets = something's wrong
- Confused packets = need more logic
```

## 🎯 Mission Structure

### Tutorial Island (Levels 1-10)

#### Level 1: "Hello, Automation!"
```
🎯 Goal: Connect an email to a database
💎 Reward: 50 gems
⏱️ Time: Unlimited
🎓 Learns: Basic connections
```

#### Level 5: "The Sorting Hat"
```
🎯 Goal: Sort emails into 3 categories
💎 Reward: 200 gems
⏱️ Time: 10 minutes
🎓 Learns: Filters and conditions
```

### Real Missions (Post-Tutorial)

#### Example: "Coffee Shop Chaos"
```
📖 Story: "The local coffee shop is drowning in online orders!"

🎯 Real Need: Order management system
🎮 Game Goal: Build the "Order Sorter 3000"

Requirements presented as game objectives:
✓ Catch all order emails
✓ Sort by drink type
✓ Calculate total price
✓ Send to barista screen
✓ Thank the customer

💎 Base Reward: 500 gems ($5)
⭐ Bonus Objectives:
  - Under 5 minutes: +100 gems
  - No errors: +150 gems
  - Customer delight: +200 gems
```

## 🎨 Visual Design

### Art Style
- Bright, cheerful colors
- Rounded, friendly shapes
- Pixar-like character design
- Satisfying particle effects

### UI Layout
```
┌─────────────────────────────────────┐
│ 🏗️ AutoCraft         💎 2,847 Gems │
├─────────────┬───────────────────────┤
│             │                       │
│   Block     │    Building Canvas    │
│   Palette   │                       │
│             │     (Drag here)       │
│             │                       │
├─────────────┴───────────────────────┤
│ [▶️ Test] [💾 Save] [📤 Submit]     │
└─────────────────────────────────────┘
```

### Character Design

#### Blocky (Main Mascot)
- Cube-shaped assistant
- Googly eyes that follow cursor
- Celebrates when player succeeds
- Gives hints when stuck

#### The Data Sprites
- Tiny characters representing data
- Each type has personality:
  - Emails: Flying envelopes with wings
  - Numbers: Bouncing digit characters
  - Text: Chatty letter creatures

## 🏆 Progression System

### Player Levels
```
Level 1-10: Automation Apprentice
  - Basic blocks unlocked
  - Simple missions
  - Tutorial support

Level 11-25: Flow Master
  - Advanced blocks unlocked
  - Multi-step missions
  - Time challenges

Level 26-50: Integration Wizard
  - All blocks unlocked
  - Complex business needs
  - Competitive tournaments

Level 51+: Automation Architect
  - Create custom blocks
  - Design missions for others
  - Earn from created content
```

### Skill Trees

#### Efficiency Branch
- Faster building
- Quick-connect tools
- Bulk operations
- Auto-optimization

#### Power Branch
- Advanced blocks
- Custom logic
- API connections
- Complex workflows

#### Wealth Branch
- Higher gem rewards
- Passive income
- Commission bonuses
- Premium missions

## 🎮 Monetization

### For Players (They Earn)
```javascript
const earnings = {
  tutorial: 0,  // Free to learn
  basicMission: 5,  // $5 per solution
  advancedMission: 20,  // $20 per solution
  expertMission: 50,  // $50 per solution
  recurring: true  // Monthly passive income
};
```

### For Platform (We Earn)
```javascript
const platformCut = {
  missionReward: 0.10,  // 10% of rewards
  recurringRevenue: 0.10,  // 10% of monthly
  premiumFeatures: 1.00,  // 100% of upgrades
  tournamentFees: 0.20  // 20% of prize pools
};
```

## 🎯 Engagement Mechanics

### Daily Quests
```
📅 Today's Challenges:
□ Complete 3 email sorters (100 gems)
□ Build without errors (150 gems)
□ Help a new player (200 gems)
□ Share a solution (250 gems)
```

### Tournaments
```
🏆 Weekend Warrior Tournament
Theme: "Restaurant Automation"
Prize Pool: 50,000 gems
Entry: Free
Duration: 48 hours
```

### Social Features

#### Guild System
- Join automation guilds
- Collaborate on mega-projects
- Share custom blocks
- Guild tournaments

#### Mentorship
- Experienced players teach newbies
- Earn gems for successful students
- Build reputation score
- Unlock "Sensei" title

## 📱 Platform Support

### Mobile (Primary)
- Full touch optimization
- Pinch to zoom canvas
- Drag with one finger
- Quick-action buttons

### Web
- Keyboard shortcuts
- Right-click menus
- Multi-select tools
- Advanced mode

### Console (Future)
- Controller support
- TV-optimized UI
- Couch co-op mode
- Family challenges

## 🧪 A/B Testing

### Onboarding Variants
- A: Story-driven tutorial
- B: Jump into action
- C: Video tutorial
- D: AI assistant guide

### Reward Structures
- A: Flat gem rewards
- B: Performance bonuses
- C: Streak multipliers
- D: Random jackpots

### Visual Themes
- A: Cartoon style
- B: Minimalist
- C: Retro pixel
- D: Realistic 3D

## 📊 Success Metrics

### Player Engagement
- Tutorial completion: > 90%
- Day 1 retention: > 85%
- Day 7 retention: > 70%
- Day 30 retention: > 60%

### Gameplay Metrics
- Average session: 25 minutes
- Sessions per day: 3.5
- Missions per session: 4
- Error rate: < 10%

### Business Metrics
- Player → Earner conversion: 40%
- Average player earning: $50/month
- Platform commission: $5/player/month
- Viral coefficient: 1.3

## 🚀 Launch Content

### Week 1: Tutorial + 50 Missions
- Email handlers (10)
- Data processors (10)
- Schedulers (10)
- Integrations (10)
- Mixed challenges (10)

### Month 1: 200 Additional Missions
- Industry-specific packs
- Seasonal challenges
- Community requests
- Sponsored missions

### Ongoing: Infinite Content
- AI-generated missions
- Player-created content
- Business submissions
- Dynamic campaigns

---

**Status:** Ready for prototype development  
**Next Step:** Build core drag-and-drop engine with 10 basic blocks