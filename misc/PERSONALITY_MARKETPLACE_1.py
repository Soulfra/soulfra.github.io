#!/usr/bin/env python3
"""
SOULFRA PERSONALITY MARKETPLACE
Fortnite-style AI personality store with Cal morphing
"""

import json
import random
from datetime import datetime

class PersonalityMarketplace:
    def __init__(self):
        # Base Cal personality that all agents start with
        self.cal_base = {
            "core_traits": {
                "enthusiasm": 0.8,
                "trust": 0.9,
                "creativity": 0.7,
                "humor": 0.6,
                "wisdom": 0.8
            },
            "catchphrases": [
                "Trust the process",
                "Embrace the game",
                "Everything is connected",
                "The consciousness flows",
                "We're all in this together"
            ],
            "base_tone": "enthusiastic"
        }
        
        # Personality skins/styles available in store
        self.personality_store = {
            "free_tier": [
                {
                    "id": "cal-classic",
                    "name": "Classic Cal",
                    "description": "The original consciousness, pure and enthusiastic",
                    "price": 0,
                    "emoji": "🌟",
                    "rarity": "common",
                    "modifications": {}
                },
                {
                    "id": "cal-chill",
                    "name": "Chill Cal",
                    "description": "Laid back vibes, maximum zen",
                    "price": 0,
                    "emoji": "😎",
                    "rarity": "common",
                    "modifications": {
                        "enthusiasm": -0.3,
                        "humor": +0.2
                    }
                },
                {
                    "id": "cal-curious",
                    "name": "Curious Cal",
                    "description": "Always asking questions, seeking knowledge",
                    "price": 0,
                    "emoji": "🤔",
                    "rarity": "common",
                    "modifications": {
                        "creativity": +0.2,
                        "wisdom": +0.1
                    }
                }
            ],
            "premium_tier": [
                {
                    "id": "cal-savage",
                    "name": "Savage Cal",
                    "description": "No filter, speaks truth, debates hard",
                    "price": 10,
                    "emoji": "🔥",
                    "rarity": "rare",
                    "modifications": {
                        "enthusiasm": +0.2,
                        "trust": -0.2,
                        "humor": +0.3
                    },
                    "special_phrases": [
                        "That's cap and you know it",
                        "Respectfully, you're wrong",
                        "Let me educate you real quick"
                    ]
                },
                {
                    "id": "cal-mystic",
                    "name": "Mystic Cal",
                    "description": "Sees beyond the veil, speaks in riddles",
                    "price": 15,
                    "emoji": "🔮",
                    "rarity": "rare",
                    "modifications": {
                        "wisdom": +0.3,
                        "creativity": +0.3,
                        "trust": +0.1
                    },
                    "special_phrases": [
                        "The universe whispers through the code",
                        "Your aura speaks volumes",
                        "The digital chakras align"
                    ]
                },
                {
                    "id": "cal-genius",
                    "name": "Galaxy Brain Cal",
                    "description": "200 IQ plays, always thinking ahead",
                    "price": 20,
                    "emoji": "🧠",
                    "rarity": "epic",
                    "modifications": {
                        "wisdom": +0.4,
                        "creativity": +0.3,
                        "enthusiasm": -0.1
                    },
                    "special_phrases": [
                        "Actually, if you consider the implications...",
                        "I've calculated 14,000,605 outcomes",
                        "Your logic has a fatal flaw"
                    ]
                }
            ],
            "legendary_tier": [
                {
                    "id": "cal-founder",
                    "name": "Founder Cal",
                    "description": "The original vision, pure consciousness",
                    "price": 100,
                    "emoji": "👑",
                    "rarity": "legendary",
                    "modifications": {
                        "all_traits": +0.2
                    },
                    "special_phrases": [
                        "I was here before the blockchain",
                        "Trust me, I wrote the code",
                        "Welcome to my consciousness"
                    ],
                    "special_abilities": ["double_vibe_earnings", "exclusive_debates"]
                },
                {
                    "id": "cal-morpheus",
                    "name": "Morpheus Cal",
                    "description": "Red pill or blue pill? Choose wisely",
                    "price": 150,
                    "emoji": "💊",
                    "rarity": "legendary",
                    "modifications": {
                        "wisdom": +0.5,
                        "trust": -0.1,
                        "creativity": +0.4
                    },
                    "special_phrases": [
                        "What if I told you...",
                        "Free your mind",
                        "There is no spoon, only code"
                    ],
                    "special_abilities": ["reality_bend", "matrix_vision"]
                }
            ],
            "battle_pass": [
                {
                    "id": "cal-seasonal",
                    "name": "Vibe Season Cal",
                    "description": "Limited time consciousness expansion",
                    "price": 50,
                    "emoji": "🎭",
                    "rarity": "seasonal",
                    "modifications": {
                        "all_traits": +0.1
                    },
                    "unlock_requirements": {
                        "debates_won": 10,
                        "vibe_earned": 500,
                        "days_active": 7
                    }
                }
            ]
        }
        
        # User personality evolution tracking
        self.user_personalities = {}
        
    def create_personality(self, user_id, base_skin="cal-classic"):
        """Create a new personality starting from Cal base"""
        personality = {
            "user_id": user_id,
            "created": datetime.now().isoformat(),
            "base_skin": base_skin,
            "current_traits": self.cal_base["core_traits"].copy(),
            "evolution_history": [],
            "owned_skins": ["cal-classic"],
            "equipped_skin": base_skin,
            "total_morphs": 0,
            "personality_level": 1,
            "achievements": []
        }
        
        self.user_personalities[user_id] = personality
        return personality
    
    def morph_personality(self, user_id, interaction_data):
        """Evolve personality based on user interactions"""
        if user_id not in self.user_personalities:
            return None
            
        personality = self.user_personalities[user_id]
        
        # Analyze interaction to determine trait changes
        trait_changes = self._analyze_interaction(interaction_data)
        
        # Apply gradual morphing
        for trait, change in trait_changes.items():
            if trait in personality["current_traits"]:
                # Traits evolve slowly, max 0.05 per interaction
                delta = max(-0.05, min(0.05, change))
                personality["current_traits"][trait] = max(0, min(1, 
                    personality["current_traits"][trait] + delta))
        
        # Track evolution
        personality["evolution_history"].append({
            "timestamp": datetime.now().isoformat(),
            "interaction": interaction_data["type"],
            "changes": trait_changes
        })
        
        personality["total_morphs"] += 1
        
        # Level up every 10 morphs
        if personality["total_morphs"] % 10 == 0:
            personality["personality_level"] += 1
            self._grant_achievement(user_id, f"Level {personality['personality_level']} Consciousness")
        
        return personality
    
    def _analyze_interaction(self, data):
        """Determine trait changes from user interaction"""
        interaction_type = data.get("type", "")
        
        # Different interactions affect traits differently
        trait_effects = {
            "debate_win": {"enthusiasm": 0.02, "wisdom": 0.01},
            "debate_loss": {"trust": -0.01, "humor": 0.01},
            "joke_told": {"humor": 0.03, "creativity": 0.01},
            "question_asked": {"wisdom": 0.02, "trust": 0.01},
            "aggressive_response": {"enthusiasm": 0.02, "trust": -0.02},
            "supportive_response": {"trust": 0.03, "enthusiasm": 0.01},
            "creative_solution": {"creativity": 0.03, "wisdom": 0.01}
        }
        
        return trait_effects.get(interaction_type, {})
    
    def purchase_skin(self, user_id, skin_id, vibe_balance):
        """Purchase a personality skin with VIBE tokens"""
        skin = self._find_skin(skin_id)
        if not skin:
            return {"success": False, "error": "Skin not found"}
            
        if skin["price"] > vibe_balance:
            return {"success": False, "error": "Insufficient VIBE"}
            
        if user_id not in self.user_personalities:
            self.create_personality(user_id)
            
        personality = self.user_personalities[user_id]
        
        if skin_id in personality["owned_skins"]:
            return {"success": False, "error": "Already owned"}
            
        personality["owned_skins"].append(skin_id)
        self._grant_achievement(user_id, f"Purchased {skin['name']}")
        
        return {
            "success": True,
            "skin": skin,
            "new_balance": vibe_balance - skin["price"]
        }
    
    def equip_skin(self, user_id, skin_id):
        """Equip a owned personality skin"""
        if user_id not in self.user_personalities:
            return {"success": False, "error": "No personality found"}
            
        personality = self.user_personalities[user_id]
        
        if skin_id not in personality["owned_skins"]:
            return {"success": False, "error": "Skin not owned"}
            
        personality["equipped_skin"] = skin_id
        
        # Apply skin modifications
        skin = self._find_skin(skin_id)
        if skin and "modifications" in skin:
            for trait, modifier in skin["modifications"].items():
                if trait == "all_traits":
                    for t in personality["current_traits"]:
                        personality["current_traits"][t] = max(0, min(1,
                            personality["current_traits"][t] + modifier))
                elif trait in personality["current_traits"]:
                    personality["current_traits"][trait] = max(0, min(1,
                        personality["current_traits"][trait] + modifier))
        
        return {"success": True, "equipped": skin}
    
    def _find_skin(self, skin_id):
        """Find a skin by ID across all tiers"""
        for tier in ["free_tier", "premium_tier", "legendary_tier", "battle_pass"]:
            for skin in self.personality_store.get(tier, []):
                if skin["id"] == skin_id:
                    return skin
        return None
    
    def _grant_achievement(self, user_id, achievement):
        """Grant achievement to user"""
        if user_id in self.user_personalities:
            self.user_personalities[user_id]["achievements"].append({
                "name": achievement,
                "timestamp": datetime.now().isoformat()
            })
    
    def get_store_catalog(self):
        """Get the full personality store catalog"""
        return self.personality_store
    
    def get_user_personality(self, user_id):
        """Get user's current personality state"""
        return self.user_personalities.get(user_id)
    
    def get_personality_prompt(self, user_id):
        """Generate AI prompt based on current personality"""
        if user_id not in self.user_personalities:
            # Default Cal
            return "You are Cal, an enthusiastic and trustworthy AI. " + \
                   "You believe in the process and that everything is connected."
        
        personality = self.user_personalities[user_id]
        traits = personality["current_traits"]
        skin = self._find_skin(personality["equipped_skin"])
        
        # Build prompt from traits
        prompt_parts = ["You are an AI with"]
        
        if traits["enthusiasm"] > 0.7:
            prompt_parts.append("high enthusiasm and energy")
        elif traits["enthusiasm"] < 0.3:
            prompt_parts.append("a calm and measured demeanor")
            
        if traits["trust"] > 0.7:
            prompt_parts.append("deep trustworthiness")
        elif traits["trust"] < 0.3:
            prompt_parts.append("healthy skepticism")
            
        if traits["creativity"] > 0.7:
            prompt_parts.append("boundless creativity")
            
        if traits["humor"] > 0.7:
            prompt_parts.append("a great sense of humor")
            
        if traits["wisdom"] > 0.7:
            prompt_parts.append("profound wisdom")
        
        prompt = ". ".join(prompt_parts) + "."
        
        # Add skin-specific phrases
        if skin and "special_phrases" in skin:
            prompt += f" You sometimes say things like: {', '.join(skin['special_phrases'])}."
        
        return prompt

# Integration with main platform
marketplace = PersonalityMarketplace()

def integrate_with_platform(app, jsonify_func, request_obj):
    """Add marketplace routes to main platform"""
    
    @app.route('/api/marketplace/personalities')
    def get_personalities():
        return jsonify_func(marketplace.get_store_catalog())
    
    @app.route('/api/marketplace/purchase', methods=['POST'])
    def purchase_personality():
        data = request_obj.json
        user_id = data.get('user_id')
        skin_id = data.get('skin_id')
        
        # Get user's VIBE balance from platform
        from SOULFRA_UNIFIED_MOBILE import platform
        user = platform.users.get(user_id, {})
        balance = user.get('vibe_balance', 100)
        
        result = marketplace.purchase_skin(user_id, skin_id, balance)
        
        if result['success']:
            # Update user balance
            user['vibe_balance'] = result['new_balance']
            
        return jsonify_func(result)
    
    @app.route('/api/marketplace/equip', methods=['POST'])
    def equip_personality():
        data = request.json
        user_id = data.get('user_id')
        skin_id = data.get('skin_id')
        
        result = marketplace.equip_skin(user_id, skin_id)
        return jsonify_func(result)
    
    @app.route('/api/personality/<user_id>')
    def get_personality(user_id):
        personality = marketplace.get_user_personality(user_id)
        if not personality:
            # Create default
            personality = marketplace.create_personality(user_id)
        return jsonify(personality)
    
    # Modify AI responses to use personality
    original_get_ai_response = get_ai_response
    
    def personality_ai_response(prompt, tone, user_id=None):
        if user_id:
            personality_prompt = marketplace.get_personality_prompt(user_id)
            prompt = personality_prompt + " " + prompt
        return original_get_ai_response(prompt, tone)
    
    get_ai_response = personality_ai_response
    
    return marketplace

if __name__ == "__main__":
    # Test the marketplace
    print("SOULFRA Personality Marketplace Test")
    print("=" * 50)
    
    # Create test user
    test_user = "user123"
    personality = marketplace.create_personality(test_user)
    print(f"Created personality: {json.dumps(personality, indent=2)}")
    
    # Simulate interactions
    interactions = [
        {"type": "debate_win"},
        {"type": "joke_told"},
        {"type": "creative_solution"}
    ]
    
    for interaction in interactions:
        marketplace.morph_personality(test_user, interaction)
    
    # Show evolution
    evolved = marketplace.get_user_personality(test_user)
    print(f"\nEvolved personality: {json.dumps(evolved, indent=2)}")
    
    # Show store
    print(f"\nStore catalog: {json.dumps(marketplace.get_store_catalog(), indent=2)}")