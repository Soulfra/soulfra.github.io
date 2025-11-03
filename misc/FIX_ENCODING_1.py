#!/usr/bin/env python3
"""
Fix encoding issues in Python files
Removes emojis and ensures proper UTF-8 handling
"""

import os
import sys
import re

def remove_emojis(text):
    """Remove all emoji characters from text"""
    # Remove common emoji ranges
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642"
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"  # dingbats
        u"\u3030"
                      "]+", flags=re.UNICODE)
    
    # Also remove specific problematic characters
    text = emoji_pattern.sub('', text)
    
    # Replace common emoji text with ASCII
    replacements = {
        '💰': '[money]',
        '🎮': '[game]',
        '🔥': '[fire]',
        '💫': '[star]',
        '🌟': '[star]',
        '✨': '[sparkle]',
        '🚀': '[rocket]',
        '💻': '[computer]',
        '🎯': '[target]',
        '⚡': '[lightning]',
        '🌈': '[rainbow]',
        '✅': '[check]',
        '❌': '[x]',
        '⭐': '[star]',
        '🎰': '[slots]',
        '🎲': '[dice]',
        '♠': '[spades]',
        '♥': '[hearts]',
        '♦': '[diamonds]',
        '♣': '[clubs]',
        '🃏': '[joker]',
        '🎴': '[cards]',
        '🤖': '[robot]',
        '👾': '[alien]',
        '💀': '[skull]',
        '🛡': '[shield]',
        '⚔': '[sword]',
        '🏆': '[trophy]',
        '🎪': '[circus]',
        '🎨': '[art]',
        '🎭': '[masks]',
        '🎸': '[guitar]',
        '🥇': '[gold]',
        '🥈': '[silver]',
        '🥉': '[bronze]',
    }
    
    for emoji, replacement in replacements.items():
        text = text.replace(emoji, replacement)
    
    return text

def fix_file(filepath):
    """Fix encoding issues in a single file"""
    try:
        # Read file with UTF-8 encoding, replacing errors
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        # Remove emojis
        fixed_content = remove_emojis(content)
        
        # Only write if content changed
        if fixed_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"Fixed: {filepath}")
            return True
        else:
            print(f"No changes needed: {filepath}")
            return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    if len(sys.argv) > 1:
        # Fix specific files
        for filepath in sys.argv[1:]:
            if os.path.exists(filepath):
                fix_file(filepath)
            else:
                print(f"File not found: {filepath}")
    else:
        # Fix all Python files in current directory
        fixed_count = 0
        for filename in os.listdir('.'):
            if filename.endswith('.py') and filename != 'FIX_ENCODING.py':
                if fix_file(filename):
                    fixed_count += 1
        
        print(f"\nFixed {fixed_count} files")

if __name__ == "__main__":
    main()