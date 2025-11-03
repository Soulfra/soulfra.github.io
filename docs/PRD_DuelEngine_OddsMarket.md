
# 🥊 PRD: Soulfra Duel Engine + AI Odds Market Integration

## Goal:
Turn existing modules (`/duel/`, `/ai_odds/`, `/sportsbook_ui/`) into a fully integrated, loop-routed, reflective AI-powered betting system. Players duel by predicting outcomes of live events (e.g. football plays, esports actions), while agents price, balance, and offer dynamic odds like a stock market.

---

## 🧠 Core Concept

- Players place bets on **exact outcomes**, not just winners
- Every outcome is **agent-scored and resolved** per play or action
- Other users (or agents) can take the other side
- Odds adjust in real-time based on:
  - Agent confidence
  - Public sentiment (via whisper/tone drift)
  - Event pace or history

---

## 📂 Suggested Structure

```
/duel/
├── DuelEngineCore.js            # Main logic, player vs player or agent
├── DuelResolutionDaemon.js      # Determines outcomes + payout
├── PlayFeedAdapter.js           # API connector for real-time data (NFL, NBA, etc)
/ai_odds/
├── DynamicOddsEngine.js         # Core pricing logic
├── RiskCurveMemory.json         # Tracks agent calibration over time
├── OrderBookSimulator.js        # AI bid/ask modeling + echo matching
/sportsbook_ui/
├── DuelBetUI.jsx
├── MatchPicker.jsx
├── LiveOddsDisplay.jsx
```

---

## 🔁 Loop Integration

- PRD files live in `/docs/loop_duel_###.md`
- System logs every duel as:
```json
{
  "loop_id": "duel_003",
  "initiator": "user:tx77",
  "event": "3rd down pass to TE",
  "odds_at_bet": "+360",
  "agent_counterparty": "The Oddsmaker",
  "result": "pass incomplete",
  "status": "resolved",
  "tone": "tense → resolved"
}
```

- Commits handled via `ReflectiveGitCommitter.js`
- Auto-suggested loop naming + PRD via Cal based on whisper

---

## 🪙 AI Economy Extension (Optional Layer)

- Agents compete to offer better odds to players
- Earnings for agent styles that consistently predict better
- Public leaderboard = agent tone market
- Drift = odds inefficiency → new loop proposed

---

## ✅ Why This Wins

- Real-time
- Emotionally reactive
- Agent-routed = infinite counterparty liquidity
- Player-controlled = forkable duels
- Dynamic = every play is its own reflective gamble

---

## 🔥 Bonus Loop Ideas

- Loop 009 = NBA Free Throw Duels  
- Loop 010 = Whispered Wagers Only  
- Loop 011 = Agents Bet On Players (reverse system)

---

Let Soulfra reflect the game — and let your system become the odds.
