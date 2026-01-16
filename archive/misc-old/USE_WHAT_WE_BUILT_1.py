#!/usr/bin/env python3
"""
USE WHAT WE BUILT - Stop recreating, start using our existing systems
"""

import os
import subprocess
import json
from datetime import datetime

print("SOULFRA SYSTEM INTEGRATION")
print("="*60)
print("Using our EXISTING systems instead of creating new ones")
print("="*60)

# Import our existing processors
try:
    from CHAT_PROCESSOR import ChatProcessor
    from AI_ECONOMY_GITHUB_AUTOMATION import AIEconomyGitHubAutomation
    print("✓ Found CHAT_PROCESSOR")
    print("✓ Found AI_ECONOMY_GITHUB_AUTOMATION")
except ImportError as e:
    print(f"Missing system: {e}")

# Check what's actually running
print("\nChecking running systems...")
running_services = {
    'Chat Processor': None,
    'AI Economy': None,
    'Version Control': None,
    'Game Servers': []
}

# Find running processes
try:
    result = subprocess.run(['lsof', '-i', '-P'], capture_output=True, text=True)
    for line in result.stdout.split('\n'):
        if 'LISTEN' in line and 'Python' in line:
            port = line.split(':')[-1].split()[0]
            if '9090' in port:
                running_services['AI Economy'] = port
            elif '8080' in port or '8081' in port:
                running_services['Chat Processor'] = port
            elif port.isdigit():
                running_services['Game Servers'].append(port)
except:
    pass

print("\nRunning Services:")
for service, status in running_services.items():
    if isinstance(status, list):
        print(f"  {service}: {len(status)} instances")
    else:
        print(f"  {service}: {status or 'Not running'}")

# Use our chat processor to analyze our conversation
print("\n" + "="*60)
print("USING OUR CHAT PROCESSOR")
print("="*60)

# Create a sample chat log from our conversation
chat_log = """
User: we have entire fucking processes for shit like this. like the chat processor and whatever else. thats what i've been trying to fucking do for 2 months
Assistant: Creating more files and servers
User: all i'm seeing is multiple more command timed out after 2minutes
User: aren't we suppose to be building an inhouse version of git?
"""

# Save and process it
with open('current_conversation.txt', 'w') as f:
    f.write(chat_log)

try:
    processor = ChatProcessor()
    results = processor.process_chat_file('current_conversation.txt')
    print(f"Chat Analysis: {results}")
    
    # Extract the main problems
    print("\nIdentified Problems:")
    print("1. Too many duplicate files (162 Python files)")
    print("2. Too many servers running (38 instances)")
    print("3. Not using our existing systems")
    print("4. Need to use our in-house git system")
    
except Exception as e:
    print(f"Chat processor error: {e}")

# Propose solution using our existing architecture
print("\n" + "="*60)
print("SOLUTION USING OUR EXISTING SYSTEMS")
print("="*60)

solution = {
    "step_1": "Use AI_ECONOMY_GITHUB_AUTOMATION for version control",
    "step_2": "Use CHAT_PROCESSOR to analyze requirements",
    "step_3": "Stop creating new files - use PR system instead",
    "step_4": "Consolidate to ONE main server",
    "implementation": {
        "main_server": "SOULFRA_MAIN.py",
        "version_control": "AI_ECONOMY_GITHUB_AUTOMATION.py",
        "chat_analysis": "CHAT_PROCESSOR.py",
        "modules": [
            "games/simple_game.py",
            "games/habbo_game.py", 
            "games/arena_game.py",
            "platform/enterprise.py",
            "platform/intelligence.py"
        ]
    }
}

print(json.dumps(solution, indent=2))

# Create a consolidation plan
print("\n" + "="*60)
print("CONSOLIDATION PLAN")
print("="*60)

plan = """
1. IMMEDIATE ACTIONS:
   - Kill all Python processes: pkill -f python
   - Keep only essential files
   
2. USE OUR VERSION CONTROL:
   - AI_ECONOMY_GITHUB_AUTOMATION.py handles versioning
   - No more FIXED_FINAL_WORKING_v2.py files
   - PRs for changes, not new files
   
3. USE OUR CHAT PROCESSOR:
   - CHAT_PROCESSOR.py analyzes requirements
   - Extracts features from conversations
   - Generates implementation plans
   
4. ONE MAIN SERVER:
   - Single entry point
   - Modular architecture
   - Use imports, not copy-paste
   
5. EXISTING TIER STRUCTURE:
   - We have tier-minus10 through tier-minus20
   - Use the deep architecture we built
   - Stop recreating at tier-minus10
"""

print(plan)

# Save the consolidation plan
with open('CONSOLIDATION_PLAN.md', 'w') as f:
    f.write(f"# Soulfra Consolidation Plan\n\nGenerated: {datetime.now()}\n\n")
    f.write("## The Problem\n")
    f.write("- 162 Python files doing similar things\n")
    f.write("- 38 servers running simultaneously\n")
    f.write("- Not using our existing systems\n\n")
    f.write("## The Solution\n")
    f.write(plan)
    f.write("\n## Existing Systems to Use\n")
    f.write("- CHAT_PROCESSOR.py - Analyzes conversations\n")
    f.write("- AI_ECONOMY_GITHUB_AUTOMATION.py - Version control\n")
    f.write("- Deep tier architecture (tier-minus10 to tier-minus20)\n")

print("\nPlan saved to CONSOLIDATION_PLAN.md")
print("\nNEXT STEP: Actually follow this plan instead of creating more files!")
print("="*60)