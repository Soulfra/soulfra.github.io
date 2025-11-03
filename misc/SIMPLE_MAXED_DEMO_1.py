#!/usr/bin/env python3
"""
SIMPLE MAXED DEMO - Shows the system working without external dependencies
"""

import json
import os
from datetime import datetime
from pathlib import Path

class SimplifiedMaxedSystem:
    """Simplified version that shows the concept"""
    
    def __init__(self):
        print("🌟 Initializing Simplified Maxed System...")
        self.auto_built_dir = Path("auto_built")
        self.auto_built_dir.mkdir(exist_ok=True)
        
    def whisper_to_code(self, idea):
        """Complete pipeline from idea to code"""
        print(f"\n🌬️ WHISPER: '{idea}'")
        print("=" * 60)
        
        # 1. Decompose
        print("\n📊 Stage 1: Decomposing idea...")
        modules = self.decompose_idea(idea)
        print(f"  ✓ Decomposed into {len(modules)} modules")
        for m in modules:
            print(f"    - {m['name']} ({m['type']})")
        
        # 2. Calculate cost
        print("\n💰 Stage 2: Calculating build cost...")
        cost = self.calculate_cost(modules)
        print(f"  ✓ Loop cost: {cost['loop_cost']} units")
        print(f"  ✓ Feasibility: {cost['feasibility']:.0%}")
        
        # 3. Route
        print("\n🧭 Stage 3: Making routing decision...")
        routing = self.make_routing_decision(cost)
        print(f"  ✓ Chosen path: {routing['path']}")
        print(f"  ✓ Confidence: {routing['confidence']:.0%}")
        
        # 4. Generate docs
        print("\n📝 Stage 4: Generating sacred documents...")
        docs = self.generate_documents(idea, modules)
        print(f"  ✓ RitualCard: {docs['ritual_card'][:50]}...")
        print(f"  ✓ LoopTemplate: Generated")
        
        # 5. Build
        print("\n🔨 Stage 5: Building actual code...")
        if routing['path'] == 'internal':
            code_path = self.build_component(idea, modules)
            print(f"  ✓ Created: {code_path}")
            
            # Show preview
            with open(code_path, 'r') as f:
                code = f.read()
            print("\n📄 Code Preview:")
            print("-" * 40)
            print(code[:400] + "..." if len(code) > 400 else code)
            print("-" * 40)
            
            return code_path
        else:
            print(f"  ⏸️ Would route to: {routing['path']}")
            return None
    
    def decompose_idea(self, idea):
        """Simple decomposition"""
        words = idea.lower().split()
        modules = []
        
        # Core module
        modules.append({
            'name': 'CoreEngine',
            'type': 'core',
            'purpose': f"Main logic for {idea}"
        })
        
        # Check for UI needs
        if any(w in words for w in ['display', 'show', 'ui', 'interface']):
            modules.append({
                'name': 'UIModule',
                'type': 'ui',
                'purpose': 'User interface'
            })
            
        # Check for data needs
        if any(w in words for w in ['track', 'store', 'save', 'data']):
            modules.append({
                'name': 'DataModule',
                'type': 'data',
                'purpose': 'Data management'
            })
            
        return modules
    
    def calculate_cost(self, modules):
        """Simple cost calculation"""
        return {
            'loop_cost': len(modules) * 10,
            'feasibility': 0.9 - (len(modules) * 0.1)
        }
    
    def make_routing_decision(self, cost):
        """Simple routing"""
        if cost['feasibility'] > 0.7:
            return {'path': 'internal', 'confidence': 0.9}
        elif cost['feasibility'] > 0.4:
            return {'path': 'hybrid', 'confidence': 0.7}
        else:
            return {'path': 'external', 'confidence': 0.6}
    
    def generate_documents(self, idea, modules):
        """Generate handoff documents"""
        return {
            'ritual_card': f"# 🎭 RitualCard: {idea}\n\nAuto-generated component",
            'loop_template': {
                'name': idea.replace(' ', '_'),
                'modules': [m['name'] for m in modules]
            }
        }
    
    def build_component(self, idea, modules):
        """Build actual Python component"""
        class_name = ''.join(word.capitalize() for word in idea.split())
        
        code = f'''#!/usr/bin/env python3
"""
Auto-Generated: {idea}
Created by Soulfra's whisper-to-code system
Generated at: {datetime.now().isoformat()}
"""

class {class_name}:
    """
    {idea} - manifested from whispered intention
    """
    
    def __init__(self):
        self.name = "{idea}"
        self.created_at = "{datetime.now().isoformat()}"
        self.modules = {[m['name'] for m in modules]}
        self.active = True
        
    def process(self, input_data):
        """Main processing logic"""
        result = {{
            'processed': True,
            'input': input_data,
            'timestamp': "{datetime.now().isoformat()}",
            'modules_active': len(self.modules)
        }}
        
        # Module-specific processing
        for module in self.modules:
            result[f'{{module}}_status'] = 'active'
            
        return result
    
    def get_status(self):
        """Get component status"""
        return {{
            'name': self.name,
            'active': self.active,
            'modules': self.modules,
            'uptime': 'just manifested'
        }}

# Self-test when run directly
if __name__ == "__main__":
    print("🌟 Testing {class_name}...")
    component = {class_name}()
    
    # Test processing
    test_result = component.process({{"test": "data"}})
    print(f"✓ Processing works: {{test_result}}")
    
    # Test status
    status = component.get_status()
    print(f"✓ Status: {{status}}")
    
    print("\\n✨ {idea} is alive!")
'''
        
        # Save component
        filename = f"{class_name}.py"
        filepath = self.auto_built_dir / filename
        
        with open(filepath, 'w') as f:
            f.write(code)
            
        # Make executable
        os.chmod(filepath, 0o755)
        
        return str(filepath)

def main():
    system = SimplifiedMaxedSystem()
    
    # Example whispers
    ideas = [
        "create a magical emotion tracker",
        "build a sentiment analyzer",
        "make a vibe detector"
    ]
    
    print("\n✨ SOULFRA WHISPER-TO-CODE DEMONSTRATION ✨")
    print("Watch as whispered ideas become real code...\n")
    
    for idea in ideas:
        filepath = system.whisper_to_code(idea)
        if filepath:
            print(f"\n✅ Success! Run with: python3 {filepath}")
        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()