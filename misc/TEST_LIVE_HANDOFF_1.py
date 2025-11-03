#!/usr/bin/env python3
"""
TEST LIVE HANDOFF - Quick test of the system
"""

import os
import time
from pathlib import Path

print("🧪 TESTING LIVE HANDOFF SYSTEM")
print("=" * 50)

# Create test directories
inbox = Path("live_handoff/inbox")
inbox.mkdir(parents=True, exist_ok=True)

# Create test handoff files
print("\n📝 Creating test handoff files...")

# 1. Markdown file with ideas
test_md = '''# Project Ideas

## TODO: Create a real-time dashboard
We need a dashboard that shows live metrics and updates automatically.

## Feature: Smart notification system
Build a notification system that learns user preferences and only sends relevant alerts.

## IDEA: Emotion-aware chatbot
Create a chatbot that can detect and respond to user emotions in conversations.

### Whispers
- whisper: "build an intelligent code reviewer"
- whisper: "create a self-optimizing database"
- whisper: "make a predictive user interface"

### Tasks
- [ ] Implement real-time sync across devices
- [ ] Create an AI-powered search function
- [ ] Build a recommendation engine
'''

with open(inbox / "project_ideas.md", 'w') as f:
    f.write(test_md)
print("  ✓ Created: project_ideas.md")

# 2. Chat log file
test_chatlog = '''[2024-01-20 10:30:15] User: Hey, can you help me with something?
[2024-01-20 10:30:20] Assistant: Of course! What would you like help with?
[2024-01-20 10:30:45] User: I need to build a sentiment analyzer for customer feedback
[2024-01-20 10:30:50] Assistant: I can help you create a sentiment analyzer. What features do you need?
[2024-01-20 10:31:10] User: It should categorize feedback as positive, negative, or neutral
[2024-01-20 10:31:15] User: Also, can you make it extract key topics from the feedback?
[2024-01-20 10:31:30] Assistant: I'll help you build a sentiment analyzer with categorization and topic extraction.
[2024-01-20 10:32:00] User: Great! One more thing - please create a visualization dashboard for the results
[2024-01-20 10:32:10] User: I was thinking, what if we also add real-time processing capabilities?
[2024-01-20 10:32:20] Assistant: Excellent ideas! I'll include visualization and real-time processing.
'''

with open(inbox / "chat_session.log", 'w') as f:
    f.write(test_chatlog)
print("  ✓ Created: chat_session.log")

# 3. JSON file with structured ideas
test_json = '''{
    "project": "AI Assistant Platform",
    "ideas": [
        "Create a multi-modal AI assistant",
        "Build a context-aware response system",
        "Implement voice command processing"
    ],
    "whispers": [
        "build a learning algorithm that improves with use",
        "create an emotion detection system",
        "make a personalized recommendation engine"
    ],
    "components": {
        "needed": [
            "Natural language processor",
            "Intent recognition engine",
            "Response generator"
        ]
    },
    "features": [
        {
            "name": "Smart Routing",
            "description": "Route queries to the best AI model"
        },
        {
            "name": "Memory System",
            "description": "Remember user preferences and history"
        }
    ]
}'''

with open(inbox / "ai_platform_spec.json", 'w') as f:
    f.write(test_json)
print("  ✓ Created: ai_platform_spec.json")

# 4. Simple text file
test_txt = '''Quick ideas for the platform:

- Create a user activity tracker
- Build a performance monitoring system
- Make a automated backup service
- Generate usage analytics reports
- Implement a caching layer for faster responses
'''

with open(inbox / "quick_ideas.txt", 'w') as f:
    f.write(test_txt)
print("  ✓ Created: quick_ideas.txt")

print("\n✅ Test files created!")
print(f"\n📁 Files are in: {inbox.absolute()}")
print("\n🚀 To test the system:")
print("  1. Run: ./START_LIVE_HANDOFF.sh")
print("  2. Watch the dashboard at http://localhost:9999")
print("  3. See ideas being extracted and processed")
print("\nThe system will:")
print("  • Detect these files automatically")
print("  • Extract all the ideas")
print("  • Send them to AI agents")
print("  • Generate components")
print("  • Integrate into the codebase")

# Also create a README
readme = '''# 📥 Live Handoff Testing

## Test Files Created:

1. **project_ideas.md** - Markdown with TODOs, features, and whispers
2. **chat_session.log** - Chat log with user requests
3. **ai_platform_spec.json** - Structured JSON specification
4. **quick_ideas.txt** - Simple text file with ideas

## What Will Happen:

When you run the Live Handoff Processor:

1. These files will be detected in the inbox
2. Ideas will be extracted:
   - TODOs and tasks from markdown
   - User requests from chat logs
   - Structured data from JSON
   - Action items from text files

3. Each idea becomes a whisper in the AI economy
4. Agents bid on and build components
5. Generated code is integrated into `live_handoff/integrated_codebase/`

## To Add More:

Just drop any text file with ideas into the inbox folder!
'''

with open(inbox / "README_TEST.md", 'w') as f:
    f.write(readme)

print("\n📚 Created test README")
print("\n✨ Test setup complete!")