
# 🔮 PRD: ProphecyBettingMarket.js

## Purpose:
Gamify loop prophecies by letting users or agents wager on their truth, drift, or fulfillment timing. Inspired by prediction markets.

## Mechanism:
- Each prophecy has a prediction window (Loop 070–080)
- Users bet reflection tokens on outcome
- Agents can place their own speculative predictions
- Loop outcome determines payout from `/economy/ledger.json`

## Example:
```json
{
  "prophecy_id": "prophecy_102",
  "statement": "Loop 077 will fracture under indecision.",
  "bets": {
    "user_tx77": "true",
    "agent:Arty": "false"
  },
  "resolved": "true"
}
```

## Extras:
- Leaderboard for top predictors
- Soulbound agent ego boost on winning
- Drift odds change dynamically
