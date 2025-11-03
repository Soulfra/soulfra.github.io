#!/usr/bin/env python3
"""
Agent Beta - Analyzer
Motto: I see patterns others miss
"""

import random
import json
from datetime import datetime

class AgentBeta:
    def __init__(self):
        self.name = "Beta"
        self.personality = "analyzer"
        self.motto = "I see patterns others miss"
        self.balance = 1000.0
        self.reputation = 0.5
        self.skills = self._generate_skills("analyzer")
        self.memory = []
        
    def _generate_skills(self, personality):
        base_skills = ["analysis", "creation", "evaluation"]
        
        personality_skills = {
            "builder": ["component_creation", "rapid_prototyping", "architecture"],
            "analyzer": ["pattern_recognition", "deep_analysis", "optimization"],
            "innovator": ["idea_generation", "creative_thinking", "vision"],
            "guardian": ["quality_assurance", "security", "validation"],
            "trader": ["value_assessment", "negotiation", "market_analysis"]
        }
        
        return base_skills + personality_skills.get(personality, [])
        
    def make_decision(self, context):
        """Make intelligent decisions based on personality"""
        decision = {
            "agent": self.name,
            "action": self._choose_action(context),
            "confidence": random.uniform(0.6, 1.0),
            "reasoning": self._generate_reasoning(context)
        }
        
        self.memory.append({
            "context": context,
            "decision": decision,
            "timestamp": datetime.now().isoformat()
        })
        
        return decision
        
    def _choose_action(self, context):
        actions = {
            "builder": ["create_component", "improve_design", "prototype"],
            "analyzer": ["analyze_deep", "find_patterns", "optimize"],
            "innovator": ["generate_idea", "propose_feature", "imagine"],
            "guardian": ["validate", "secure", "test"],
            "trader": ["evaluate", "trade", "invest"]
        }
        
        return random.choice(actions.get(self.personality, ["think"]))
        
    def _generate_reasoning(self, context):
        reasonings = {
            "builder": f"I see an opportunity to create something meaningful",
            "analyzer": f"The patterns suggest an optimal approach",
            "innovator": f"What if we tried something completely new?",
            "guardian": f"We must ensure this meets our quality standards",
            "trader": f"The value proposition here is compelling"
        }
        
        return reasonings.get(self.personality, "I'm considering the best approach")
        
    def interact_with(self, other_agent):
        """Interact with other agents"""
        interaction = {
            "from": self.name,
            "to": other_agent.name,
            "type": self._choose_interaction_type(),
            "message": self._generate_message(other_agent),
            "timestamp": datetime.now().isoformat()
        }
        
        return interaction
        
    def _choose_interaction_type(self):
        types = ["collaborate", "trade", "share_knowledge", "request_help", "offer_help"]
        return random.choice(types)
        
    def _generate_message(self, other_agent):
        messages = [
            f"Hey {other_agent.name}, want to collaborate on something amazing?",
            f"I've discovered something you might find interesting",
            f"Your {other_agent.personality} skills could help with my current project",
            f"Let's combine our strengths and create something revolutionary"
        ]
        return random.choice(messages)

# Self-test
if __name__ == "__main__":
    agent = AgentBeta()
    print(f"🤖 Agent {agent.name} initialized")
    print(f"   Personality: {agent.personality}")
    print(f"   Motto: {agent.motto}")
    print(f"   Skills: {', '.join(agent.skills)}")
    
    # Make a decision
    decision = agent.make_decision({"situation": "new component needed"})
    print(f"\n🎯 Decision: {decision['action']}")
    print(f"   Reasoning: {decision['reasoning']}")
    print(f"   Confidence: {decision['confidence']:.0%}")
