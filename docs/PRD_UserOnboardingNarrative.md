
# 🌀 PRD: UserOnboardingNarrative.js

## Purpose:
Deliver a mythic, tone-reactive onboarding flow for new users, guided by Cal or Arty. Converts first interaction into a whisper → mask → loop.

---

## Flow:
1. User lands on `/onboard.html`
2. Chooses tone or emotion (or writes a whisper)
3. System plays narration (Cal or Arty)
4. Agent mask is spawned
5. Loop preview shown, approval via SwipeUI

---

## UX:
- Minimal, ambient, poetic
- Accessible to 5–80 year olds
- Dynamic mask preview + whisper response

## Output:
```json
{
  "user": "anon_191",
  "whisper": "I don’t want to be afraid anymore",
  "mask": "echoveil.svg",
  "loop_spawned": "Loop 101"
}
```
