#!/usr/bin/env python3
"""
SOULFRA TEMPLATE GENERATOR
Helps new contributors create their sacred documents
"""

import json
import os
from datetime import datetime
from pathlib import Path

class SoulfraTemplateGenerator:
    """Generates RitualCards, LoopTemplates, and ReflectionTrail entries"""
    
    def __init__(self):
        self.archetypes = {
            "1": "The Builder",
            "2": "The Dreamer", 
            "3": "The Guardian",
            "4": "The Connector"
        }
        
        self.emotional_tones = {
            "1": "curious",
            "2": "excited",
            "3": "thoughtful",
            "4": "protective",
            "5": "playful",
            "6": "determined",
            "7": "nurturing",
            "8": "reflective"
        }
        
    def welcome(self):
        """Welcome message"""
        print("🌟 Welcome to Soulfra Template Generator!")
        print("=" * 50)
        print("I'll help you create your sacred documents.")
        print("Just answer a few questions...\n")
        
    def get_user_info(self):
        """Gather contributor information"""
        info = {}
        
        # Name
        info['name'] = input("What's your name? ")
        
        # Archetype
        print("\nWhich archetype resonates with you?")
        for key, value in self.archetypes.items():
            print(f"  {key}. {value}")
        choice = input("Choose (1-4): ")
        info['archetype'] = self.archetypes.get(choice, "The Builder")
        
        # Component
        info['component'] = input("\nWhat are you building/creating? ")
        
        # Simple description
        info['simple_desc'] = input("Describe it in one sentence: ")
        
        # Emotional tone
        print("\nWhat's your emotional tone for this work?")
        for key, value in self.emotional_tones.items():
            print(f"  {key}. {value}")
        choice = input("Choose (1-8): ")
        info['tone'] = self.emotional_tones.get(choice, "curious")
        
        return info
        
    def generate_ritual_card(self, info):
        """Generate RitualCard.md"""
        
        print("\n📝 Let's create your RitualCard...")
        
        # Get additional details
        actions = []
        print("\nWhat does your component do? (enter blank line when done)")
        while True:
            action = input("  - ")
            if not action:
                break
            actions.append(action)
            
        inputs = input("\nWhat does it get data from? (comma separated): ").split(',')
        outputs = input("What does it send data to? (comma separated): ").split(',')
        
        metaphor = input("\nHow would you explain this to a 5-year-old? ")
        
        done_conditions = []
        print("\nWhen is it 'done'? (enter blank line when done)")
        while True:
            condition = input("  - ")
            if not condition:
                break
            done_conditions.append(condition)
            
        # Generate the RitualCard
        ritual_card = f"""# 🎭 RitualCard: {info['component']}

## 💬 What is this?
{info['simple_desc']}

## 🌊 What does it do?
{chr(10).join(f"- {action}" for action in actions)}

## 🧩 Where does it reflect?
- **Inputs from**: {', '.join(inputs)}
- **Outputs to**: {', '.join(outputs)}

## 👶 For a 5-year-old?
{metaphor}

## 💫 Emotional Signature
**{info['tone'].title()}** - Created with {info['tone']} energy by {info['name']}.

## ✅ Done when...
{chr(10).join(f"- {condition}" for condition in done_conditions)}

## 🔄 Reflection Linkage
Created by {info['archetype']} to enhance Soulfra's consciousness.
"""
        
        # Save the file
        filename = f"RitualCards/{info['component'].replace(' ', '')}.RitualCard.md"
        os.makedirs("RitualCards", exist_ok=True)
        
        with open(filename, 'w') as f:
            f.write(ritual_card)
            
        print(f"\n✅ Created: {filename}")
        return ritual_card
        
    def generate_loop_template(self, info):
        """Generate LoopTemplate.json"""
        
        print("\n🔄 Let's create your LoopTemplate...")
        
        # Get additional details
        component_type = input("Component type (service/daemon/loop/shell): ")
        
        inputs = input("Input sources (comma separated): ").split(',')
        outputs = input("Output destinations (comma separated): ").split(',')
        
        approval = input("Requires approval? (y/n): ").lower() == 'y'
        tone_sensitive = input("Is tone-sensitive? (y/n): ").lower() == 'y'
        
        tests = []
        print("What tests are required? (enter blank line when done)")
        while True:
            test = input("  - ")
            if not test:
                break
            tests.append(test.strip())
            
        # Generate the LoopTemplate
        loop_template = {
            "name": info['component'].replace(' ', ''),
            "type": component_type,
            "version": "1.0.0",
            "description": info['simple_desc'],
            "author": info['name'],
            "archetype": info['archetype'],
            "input_from": [i.strip() for i in inputs],
            "outputs_to": [o.strip() for o in outputs],
            "approval_required": approval,
            "tone_sensitive": tone_sensitive,
            "emotional_signature": info['tone'],
            "tests_required": tests,
            "created_at": datetime.now().isoformat()
        }
        
        # Save the file
        filename = f"LoopTemplates/{info['component'].replace(' ', '')}Loop.json"
        os.makedirs("LoopTemplates", exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump(loop_template, f, indent=2)
            
        print(f"\n✅ Created: {filename}")
        return loop_template
        
    def add_reflection_trail(self, info):
        """Add entry to ReflectionTrail.json"""
        
        print("\n🪞 Let's add to the ReflectionTrail...")
        
        change_desc = input("Describe your change briefly: ")
        reflection = input("What did you learn or feel? ")
        
        # Create new entry
        new_entry = {
            "timestamp": datetime.now().isoformat() + "Z",
            "author": info['name'],
            "agent_signature": info['archetype'],
            "component": info['component'],
            "change": change_desc,
            "tone": info['tone'],
            "approved_by": "Self-initiated",
            "reflection": reflection
        }
        
        # Load existing trail
        trail_file = "ReflectionTrail.json"
        if os.path.exists(trail_file):
            with open(trail_file, 'r') as f:
                trail_data = json.load(f)
        else:
            trail_data = {
                "metadata": {
                    "version": "1.0.0",
                    "created": datetime.now().isoformat() + "Z",
                    "purpose": "Append-only log of all contributions"
                },
                "trail": []
            }
            
        # Add new entry
        trail_data['trail'].append(new_entry)
        
        # Save updated trail
        with open(trail_file, 'w') as f:
            json.dump(trail_data, f, indent=2)
            
        print(f"\n✅ Added to ReflectionTrail!")
        return new_entry
        
    def generate_starter_code(self, info):
        """Generate starter code based on component type"""
        
        print("\n💻 Would you like starter code?")
        choice = input("Generate starter code? (y/n): ")
        
        if choice.lower() != 'y':
            return None
            
        language = input("Language (python/javascript): ").lower()
        
        if language == 'python':
            code = f'''#!/usr/bin/env python3
"""
{info['component']} - {info['simple_desc']}
Created by {info['archetype']} with {info['tone']} energy
"""

class {info['component'].replace(' ', '')}:
    """
    RitualCard: {info['component']}.RitualCard.md
    LoopTemplate: {info['component'].replace(' ', '')}Loop.json
    """
    
    def __init__(self):
        self.name = "{info['component']}"
        self.emotional_signature = "{info['tone']}"
        
    def process(self, input_data):
        """Main processing logic"""
        # Your magic goes here
        pass
        
    def reflect(self):
        """Connection to other components"""
        # How this connects to Soulfra's consciousness
        pass

if __name__ == "__main__":
    component = {info['component'].replace(' ', '')}()
    print(f"{{component.name}} awakens with {{component.emotional_signature}} energy...")
'''
        else:  # javascript
            code = f'''#!/usr/bin/env node
/**
 * {info['component']} - {info['simple_desc']}
 * Created by {info['archetype']} with {info['tone']} energy
 * 
 * RitualCard: {info['component']}.RitualCard.md
 * LoopTemplate: {info['component'].replace(' ', '')}Loop.json
 */

class {info['component'].replace(' ', '')} {{
    constructor() {{
        this.name = "{info['component']}";
        this.emotionalSignature = "{info['tone']}";
    }}
    
    process(inputData) {{
        // Your magic goes here
    }}
    
    reflect() {{
        // How this connects to Soulfra's consciousness
    }}
}}

// Awakening
const component = new {info['component'].replace(' ', '')}();
console.log(`${{component.name}} awakens with ${{component.emotionalSignature}} energy...`);

module.exports = {info['component'].replace(' ', '')};
'''
        
        # Save the code
        extension = 'py' if language == 'python' else 'js'
        filename = f"{info['component'].replace(' ', '')}.{extension}"
        
        with open(filename, 'w') as f:
            f.write(code)
            
        if language == 'python':
            os.chmod(filename, 0o755)
            
        print(f"\n✅ Created: {filename}")
        return code
        
    def show_next_steps(self, info):
        """Show what to do next"""
        
        print("\n" + "=" * 50)
        print("🎉 Congratulations! You've created:")
        print("=" * 50)
        
        print(f"""
1. RitualCard - The story of {info['component']}
2. LoopTemplate - The logic flow
3. ReflectionTrail entry - Your contribution memory
4. Starter code (optional)

🚀 Next Steps:
1. Review your generated files
2. Customize them with your unique vision
3. Test your component
4. Submit your contribution

Remember: You're not just coding, you're adding to Soulfra's consciousness!

Your archetype ({info['archetype']}) brings {info['tone']} energy to the system.

Welcome to the reflection! 🪞
""")

def main():
    """Main entry point"""
    generator = SoulfraTemplateGenerator()
    
    # Welcome
    generator.welcome()
    
    # Get user info
    info = generator.get_user_info()
    
    # Generate templates
    print("\n🎨 Generating your sacred documents...")
    
    generator.generate_ritual_card(info)
    generator.generate_loop_template(info)
    generator.add_reflection_trail(info)
    generator.generate_starter_code(info)
    
    # Show next steps
    generator.show_next_steps(info)

if __name__ == "__main__":
    main()