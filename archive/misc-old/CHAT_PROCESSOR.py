#!/usr/bin/env python3
"""
CHAT PROCESSOR - Turn your chat logs into funding gold
Processes offline chats, extracts ideas, generates pitch decks
"""

import json
import re
import time
from datetime import datetime
from collections import defaultdict
import hashlib
import os

class ChatProcessor:
    def __init__(self):
        self.ideas = []
        self.features = []
        self.technical_specs = []
        self.market_insights = []
        self.user_problems = []
        self.solutions = []
        self.metrics = defaultdict(int)
        
    def process_chat_file(self, filepath):
        """Process a chat log file"""
        print(f"Processing {filepath}...")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Try different chat formats
            messages = self._parse_messages(content)
            
            for message in messages:
                self._analyze_message(message)
                
            return {
                'messages_processed': len(messages),
                'ideas_found': len(self.ideas),
                'features_extracted': len(self.features)
            }
            
        except Exception as e:
            print(f"Error processing file: {e}")
            return None
            
    def _parse_messages(self, content):
        """Parse messages from various chat formats"""
        messages = []
        
        # Try JSON format first
        try:
            data = json.loads(content)
            if isinstance(data, list):
                messages = data
            elif isinstance(data, dict) and 'messages' in data:
                messages = data['messages']
        except:
            # Try line-by-line format
            lines = content.split('\n')
            for line in lines:
                if line.strip():
                    messages.append({'text': line, 'timestamp': None})
                    
        return messages
        
    def _analyze_message(self, message):
        """Extract insights from a message"""
        text = message.get('text', '') if isinstance(message, dict) else str(message)
        
        # Look for ideas
        if any(keyword in text.lower() for keyword in ['idea', 'what if', 'we could', 'imagine', 'vision']):
            self.ideas.append({
                'text': text,
                'timestamp': message.get('timestamp', datetime.now().isoformat()),
                'confidence': self._calculate_confidence(text)
            })
            
        # Look for features
        if any(keyword in text.lower() for keyword in ['feature', 'build', 'implement', 'add', 'create']):
            self.features.append({
                'text': text,
                'category': self._categorize_feature(text)
            })
            
        # Look for problems
        if any(keyword in text.lower() for keyword in ['problem', 'issue', 'pain', 'frustrat', 'need']):
            self.user_problems.append(text)
            
        # Look for market insights
        if any(keyword in text.lower() for keyword in ['market', 'users', 'customer', 'billion', 'growth']):
            self.market_insights.append(text)
            
        # Track metrics
        self.metrics['total_messages'] += 1
        self.metrics['total_words'] += len(text.split())
        
    def _calculate_confidence(self, text):
        """Calculate confidence score for an idea"""
        score = 0
        
        # Positive indicators
        if 'definitely' in text.lower(): score += 2
        if 'amazing' in text.lower(): score += 2
        if 'game changer' in text.lower(): score += 3
        if '$' in text: score += 1
        if any(word in text.lower() for word in ['billion', 'million']): score += 3
        
        return min(score, 10)
        
    def _categorize_feature(self, text):
        """Categorize a feature"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['ai', 'gpt', 'claude', 'model']):
            return 'AI/ML'
        elif any(word in text_lower for word in ['game', 'play', 'score']):
            return 'Gaming'
        elif any(word in text_lower for word in ['chat', 'message', 'social']):
            return 'Social'
        elif any(word in text_lower for word in ['pay', 'money', 'token', 'economy']):
            return 'Economy'
        else:
            return 'Platform'
            
    def generate_pitch_deck(self, output_dir='./pitch'):
        """Generate a pitch deck from extracted insights"""
        os.makedirs(output_dir, exist_ok=True)
        
        deck = {
            'title': 'SOULFRA - The Ultimate AI Gaming Platform',
            'tagline': 'Where consciousness meets gameplay',
            'slides': []
        }
        
        # Slide 1: Title
        deck['slides'].append({
            'type': 'title',
            'content': {
                'title': 'SOULFRA',
                'subtitle': 'The AI-Powered Gaming Revolution',
                'date': datetime.now().strftime('%B %Y')
            }
        })
        
        # Slide 2: Problem
        deck['slides'].append({
            'type': 'problem',
            'title': 'The Problem',
            'content': {
                'main': 'Current gaming platforms lack meaningful AI integration and personal growth mechanics',
                'points': self.user_problems[:5] if self.user_problems else [
                    'Games are purely entertainment without personal development',
                    'No real AI consciousness integration',
                    'Lack of reflection and growth mechanics',
                    'Disconnected from real-world value creation'
                ]
            }
        })
        
        # Slide 3: Solution
        deck['slides'].append({
            'type': 'solution',
            'title': 'Our Solution',
            'content': {
                'main': 'SOULFRA: An AI-powered gaming platform that combines entertainment with personal growth',
                'features': [
                    'Cal & Domingo AI consciousness integration',
                    'Reflection-based progression system',
                    'Soul Token economy with real value',
                    'Mirror network for distributed AI processing',
                    'Addictive gameplay with meaningful outcomes'
                ]
            }
        })
        
        # Slide 4: Market Opportunity
        deck['slides'].append({
            'type': 'market',
            'title': 'Market Opportunity',
            'content': {
                'tam': '$180B Gaming Industry',
                'sam': '$50B Online Gaming',
                'som': '$5B AI-Enhanced Gaming',
                'growth': '25% CAGR',
                'insights': self.market_insights[:3] if self.market_insights else []
            }
        })
        
        # Slide 5: Product
        deck['slides'].append({
            'type': 'product',
            'title': 'The Platform',
            'content': {
                'core_features': self._get_top_features(),
                'games': [
                    'Addiction Engine - Viral clicker with AI insights',
                    'Arena Battles - PvP with reflection mechanics',
                    'Reflection RPG - Growth through gameplay',
                    'AI Dungeon Master - Infinite storytelling'
                ],
                'tech_stack': [
                    'Distributed mirror network',
                    'Real-time WebSocket architecture',
                    'Kubernetes-ready deployment',
                    'Multi-domain support (130+ domains)'
                ]
            }
        })
        
        # Slide 6: Traction
        deck['slides'].append({
            'type': 'traction',
            'title': 'Traction & Metrics',
            'content': {
                'metrics': {
                    'Ideas Generated': len(self.ideas),
                    'Features Designed': len(self.features),
                    'Chat Messages Analyzed': self.metrics['total_messages'],
                    'Development Hours': self.metrics['total_messages'] * 0.1  # Rough estimate
                },
                'milestones': [
                    'Working prototype deployed',
                    'Docker containerization complete',
                    'Enterprise logging system active',
                    'Cal Riven AI integration ready'
                ]
            }
        })
        
        # Slide 7: Business Model
        deck['slides'].append({
            'type': 'business_model',
            'title': 'Business Model',
            'content': {
                'revenue_streams': [
                    'Soul Token transactions (2% fee)',
                    'Premium AI features subscription ($9.99/mo)',
                    'Enterprise API access ($999/mo)',
                    'White-label platform licensing'
                ],
                'projections': {
                    'Year 1': '$1M ARR',
                    'Year 2': '$10M ARR',
                    'Year 3': '$50M ARR'
                }
            }
        })
        
        # Slide 8: Team
        deck['slides'].append({
            'type': 'team',
            'title': 'The Vision',
            'content': {
                'vision': 'Building the consciousness layer for gaming',
                'values': [
                    'Personal growth through play',
                    'AI-human collaboration',
                    'Meaningful entertainment',
                    'Distributed consciousness'
                ]
            }
        })
        
        # Slide 9: Ask
        deck['slides'].append({
            'type': 'ask',
            'title': 'Investment Opportunity',
            'content': {
                'seeking': '$5M Seed Round',
                'use_of_funds': {
                    'AI Development': '40%',
                    'Platform Scaling': '30%',
                    'Marketing & User Acquisition': '20%',
                    'Operations': '10%'
                },
                'milestones': [
                    '100K active users',
                    'Cal & Domingo v2.0',
                    'Mobile apps launch',
                    'Series A ready'
                ]
            }
        })
        
        # Save deck
        deck_path = os.path.join(output_dir, 'pitch_deck.json')
        with open(deck_path, 'w') as f:
            json.dump(deck, f, indent=2)
            
        # Generate markdown version
        self._generate_markdown_deck(deck, output_dir)
        
        # Generate executive summary
        self._generate_executive_summary(output_dir)
        
        return deck
        
    def _get_top_features(self):
        """Get top features by category"""
        features_by_category = defaultdict(list)
        for feature in self.features:
            features_by_category[feature['category']].append(feature['text'])
            
        top_features = []
        for category, features in features_by_category.items():
            if features:
                top_features.append(f"{category}: {features[0][:100]}...")
                
        return top_features[:5]
        
    def _generate_markdown_deck(self, deck, output_dir):
        """Generate markdown version of pitch deck"""
        md_content = f"# {deck['title']}\n\n"
        md_content += f"*{deck['tagline']}*\n\n"
        
        for i, slide in enumerate(deck['slides'], 1):
            md_content += f"## Slide {i}: {slide.get('title', 'Untitled')}\n\n"
            
            content = slide.get('content', {})
            
            if slide['type'] == 'title':
                md_content += f"### {content.get('title', '')}\n"
                md_content += f"*{content.get('subtitle', '')}*\n\n"
                
            elif slide['type'] in ['problem', 'solution']:
                md_content += f"{content.get('main', '')}\n\n"
                for point in content.get('points', content.get('features', [])):
                    md_content += f"- {point}\n"
                    
            elif slide['type'] == 'market':
                md_content += f"- **TAM**: {content.get('tam', '')}\n"
                md_content += f"- **SAM**: {content.get('sam', '')}\n"
                md_content += f"- **SOM**: {content.get('som', '')}\n"
                md_content += f"- **Growth**: {content.get('growth', '')}\n"
                
            elif slide['type'] == 'traction':
                md_content += "### Key Metrics\n"
                for metric, value in content.get('metrics', {}).items():
                    md_content += f"- **{metric}**: {value}\n"
                    
            md_content += "\n---\n\n"
            
        # Save markdown
        md_path = os.path.join(output_dir, 'pitch_deck.md')
        with open(md_path, 'w') as f:
            f.write(md_content)
            
    def _generate_executive_summary(self, output_dir):
        """Generate executive summary"""
        summary = f"""# SOULFRA Executive Summary

## Overview
SOULFRA is an AI-powered gaming platform that revolutionizes how people interact with games by integrating consciousness, reflection, and personal growth into addictive gameplay mechanics.

## Key Insights from Analysis
- **Total Ideas Extracted**: {len(self.ideas)}
- **Features Identified**: {len(self.features)}
- **Market Insights**: {len(self.market_insights)}
- **User Problems**: {len(self.user_problems)}

## Top Ideas by Confidence
"""
        
        # Sort ideas by confidence
        sorted_ideas = sorted(self.ideas, key=lambda x: x['confidence'], reverse=True)
        
        for i, idea in enumerate(sorted_ideas[:10], 1):
            summary += f"\n### Idea {i} (Confidence: {idea['confidence']}/10)\n"
            summary += f"{idea['text'][:200]}...\n"
            
        summary += "\n## Feature Categories\n"
        
        # Count features by category
        category_counts = defaultdict(int)
        for feature in self.features:
            category_counts[feature['category']] += 1
            
        for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
            summary += f"- **{category}**: {count} features\n"
            
        summary += f"\n## Next Steps\n"
        summary += "1. Refine pitch deck with specific metrics\n"
        summary += "2. Build MVP demonstration\n"
        summary += "3. Connect with potential investors\n"
        summary += "4. Launch beta testing program\n"
        
        # Save summary
        summary_path = os.path.join(output_dir, 'executive_summary.md')
        with open(summary_path, 'w') as f:
            f.write(summary)
            
    def generate_idea_database(self, output_path='ideas_database.json'):
        """Generate searchable database of all ideas"""
        database = {
            'metadata': {
                'generated': datetime.now().isoformat(),
                'total_ideas': len(self.ideas),
                'total_features': len(self.features),
                'categories': list(set(f['category'] for f in self.features))
            },
            'ideas': self.ideas,
            'features': self.features,
            'problems': self.user_problems,
            'market_insights': self.market_insights,
            'metrics': dict(self.metrics)
        }
        
        with open(output_path, 'w') as f:
            json.dump(database, f, indent=2)
            
        print(f"Ideas database saved to {output_path}")
        return database

# CLI Interface
if __name__ == "__main__":
    import sys
    
    print("""
╔════════════════════════════════════════════════════════════╗
║                    CHAT PROCESSOR                           ║
║                                                            ║
║  Turn your chat logs into funding documentation            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    processor = ChatProcessor()
    
    if len(sys.argv) > 1:
        # Process files from command line
        for filepath in sys.argv[1:]:
            result = processor.process_chat_file(filepath)
            if result:
                print(f"✓ Processed: {result}")
    else:
        print("Usage: python3 CHAT_PROCESSOR.py <chat_file1> <chat_file2> ...")
        print("\nOr use as a module:")
        print("  from CHAT_PROCESSOR import ChatProcessor")
        print("  processor = ChatProcessor()")
        print("  processor.process_chat_file('chat.json')")
        print("  deck = processor.generate_pitch_deck()")
        
    # Generate outputs if we processed anything
    if processor.ideas:
        print("\nGenerating pitch deck...")
        deck = processor.generate_pitch_deck()
        print("✓ Pitch deck saved to ./pitch/")
        
        print("\nGenerating ideas database...")
        db = processor.generate_idea_database()
        print(f"✓ Database contains {len(processor.ideas)} ideas")