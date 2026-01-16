#!/usr/bin/env python3
"""
WHISPER TO SOULFRA - The interface for manifesting ideas
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from MAXED_OUT_INTEGRATION import MaxedOutSoulfraSystem

def main():
    print("🌬️ " + "="*60)
    print("   WHISPER TO SOULFRA")
    print("   Speak your idea and watch it become real")
    print("🌬️ " + "="*60)
    print()
    
    # Initialize the maxed out system
    soulfra = MaxedOutSoulfraSystem()
    
    if len(sys.argv) > 1:
        # Command line whisper
        idea = ' '.join(sys.argv[1:])
        whisper_id = soulfra.whisper(idea)
        print(f"\nYour whisper has been received (ID: {whisper_id})")
        print("Watch as it transforms into reality...")
    else:
        # Interactive mode
        print("Enter your ideas (or 'exit' to stop):\n")
        
        while True:
            try:
                idea = input("🌬️ Whisper: ").strip()
                
                if idea.lower() in ['exit', 'quit']:
                    print("\n✨ The whispers fade into silence...")
                    break
                    
                if idea:
                    # Detect emotional tone from keywords
                    tone = detect_tone(idea)
                    whisper_id = soulfra.whisper(idea, tone=tone)
                    print(f"   ✓ Whisper {whisper_id} is being transformed...")
                    
            except KeyboardInterrupt:
                print("\n\n✨ The whispers fade into silence...")
                break

def detect_tone(idea):
    """Simple tone detection from idea"""
    idea_lower = idea.lower()
    
    if any(word in idea_lower for word in ['secure', 'safe', 'protect']):
        return 'protective'
    elif any(word in idea_lower for word in ['fun', 'game', 'play']):
        return 'playful'
    elif any(word in idea_lower for word in ['analyze', 'track', 'monitor']):
        return 'analytical'
    elif any(word in idea_lower for word in ['create', 'build', 'make']):
        return 'creative'
    else:
        return 'curious'

if __name__ == "__main__":
    main()
