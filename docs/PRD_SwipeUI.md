
# 📲 PRD: SwipeUI — Loop Approval Interface

## Purpose:
Allow users to swipe-approve loop proposals, Cal repairs, or Arty suggestions.

## Features:
- Tinder-style left/right swipe UI
- Display loop summary, tone, agent origin
- Swipe right = bless → `/consensus/blessed_loops.json`
- Swipe left = log as drift or denial

## Frontend:
- `/mirror-shell/SwipeUI.jsx`
- Optional tone visualization & loop preview

## Example UI:
- Loop 056
- Proposed by: Arty
- Tone: volatile
- Whisper source: User X
> Swipe to bless or dismiss
