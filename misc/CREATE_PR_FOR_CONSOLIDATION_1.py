#!/usr/bin/env python3
"""
CREATE PR FOR CONSOLIDATION
Use our AI Economy GitHub Automation instead of creating more files
"""

import json
import requests
from datetime import datetime

# Use our AI Economy system
AI_ECONOMY_URL = "http://localhost:9090"

# Create a PR request for consolidation
pr_data = {
    "agent_id": "consolidation-bot",
    "agent_type": "claude",
    "action": "create_pr",
    "pr_details": {
        "title": "Consolidate 162 Python files into modular architecture",
        "description": """
## Problem
- 162 Python files with duplicate functionality
- 38 servers running simultaneously
- Not using our existing systems (CHAT_PROCESSOR, AI_ECONOMY)

## Solution
Consolidate to single modular architecture:
- ONE main server file
- Use our AI_ECONOMY for version control
- Use CHAT_PROCESSOR for requirement analysis
- Modular imports instead of copy-paste

## Changes
1. Create SOULFRA_MAIN.py as single entry point
2. Move games to games/ directory
3. Move platform features to platform/ directory
4. Use our existing tier architecture
5. Delete redundant files
        """,
        "files_to_change": [
            "SOULFRA_MAIN.py",
            "games/__init__.py",
            "games/simple_game.py",
            "games/habbo_game.py", 
            "games/arena_game.py",
            "platform/__init__.py",
            "platform/enterprise.py",
            "platform/intelligence.py"
        ],
        "files_to_delete": [
            # All the redundant versions
            "SIMPLE_GAME.py",
            "SIMPLE_GAME_FIXED.py",
            "SIMPLE_GAME_WORKING.py",
            "SIMPLE_GAME_FINAL.py",
            # ... and 150+ more
        ]
    }
}

print("Creating PR using our AI Economy system...")
print(f"Sending to: {AI_ECONOMY_URL}/api/pr/create")
print(json.dumps(pr_data, indent=2))

try:
    # Send to our AI Economy system
    response = requests.post(
        f"{AI_ECONOMY_URL}/api/pr/create",
        json=pr_data,
        timeout=5
    )
    
    if response.status_code == 200:
        print("\n✓ PR created successfully!")
        print(f"Response: {response.json()}")
    else:
        print(f"\n✗ Failed: {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("\n⚠️  AI Economy system not responding on port 9090")
    print("But this is what we SHOULD be doing:")
    print("1. Using our existing AI_ECONOMY_GITHUB_AUTOMATION.py")
    print("2. Creating PRs through that system")
    print("3. NOT creating more duplicate files")

# Show what the consolidated structure should look like
print("\n" + "="*60)
print("PROPOSED MODULAR STRUCTURE")
print("="*60)

structure = """
soulfra/
├── SOULFRA_MAIN.py          # Single entry point
├── CHAT_PROCESSOR.py        # Existing - analyzes conversations  
├── AI_ECONOMY_GITHUB_AUTOMATION.py  # Existing - version control
├── games/
│   ├── __init__.py
│   ├── simple_game.py       # Just the game logic
│   ├── habbo_game.py        # Just the game logic
│   └── arena_game.py        # Just the game logic
├── platform/
│   ├── __init__.py
│   ├── enterprise.py        # Enterprise features
│   └── intelligence.py      # Local AI features
└── data/
    ├── ai_economy.db        # Existing database
    └── chat_logs/           # Processed by CHAT_PROCESSOR
"""

print(structure)

print("\nThis uses our EXISTING systems instead of creating more chaos!")
print("="*60)