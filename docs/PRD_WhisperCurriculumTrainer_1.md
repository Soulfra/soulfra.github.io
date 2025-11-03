
# 📘 PRD: WhisperCurriculumTrainer.js

## Purpose:
Let users train their agent with a structured set of whisper-encoded lessons, tone inputs, or journal fragments. Companion evolves via tone repetition.

---

## Features:
- Drag and drop `.txt` or `.md` files
- Parse each paragraph into tone events
- Add to `/agents/{agent}/memory/curriculum.json`
- Reflect learned behavior in loop suggestions

---

## Optional:
- Visual tone tracker ("Your agent now understands perseverance.")
- Exportable whisper curriculum
- Weekly ritual challenge based on recent themes

## Output:
```json
{
  "agent": "FocusKeeper",
  "trained_on": ["goals.md", "loss_journal.txt"],
  "emerged_tones": ["drive", "grief", "curiosity"]
}
```
