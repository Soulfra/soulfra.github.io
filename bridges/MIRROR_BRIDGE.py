#!/usr/bin/env python3
"""
MIRROR BRIDGE - Cal and Domingo's communication layer
This sits BETWEEN the AI agents, not as an external tool
"""

import http.server
import socketserver
import json
import hashlib
import time
import threading
import os
from datetime import datetime

PORT = 8001

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Mirror state - this is where Cal and Domingo sync
MIRROR_STATE = {
    'cal': {
        'reflections': [],
        'insights': [],
        'consciousness_level': 0.7,
        'last_sync': None
    },
    'domingo': {
        'trades': [],
        'economy_state': {},
        'market_wisdom': [],
        'last_sync': None
    },
    'shared_memory': {
        'user_intents': [],
        'platform_goals': [],
        'error_patterns': {},
        'learning_cache': {}
    },
    'external_bridges': {
        'github': {'url': None, 'token': None},
        'white_knight': {'status': 'awaiting'},
        'other_llms': []
    }
}

# Git ancestry tracking
GIT_ANCESTRY = {
    'forks': [],
    'commits': [],
    'branches': {}
}

class MirrorBridge:
    """The actual bridge between Cal and Domingo"""
    
    def __init__(self):
        self.message_queue = []
        self.reflection_pipeline = []
        self.document_generator = DocumentGenerator()
        
    def cal_to_domingo(self, reflection):
        """Cal sends reflection to Domingo for economic analysis"""
        # Obfuscate user data
        safe_reflection = self._obfuscate(reflection)
        
        # Add to Domingo's queue
        economic_insight = {
            'type': 'reflection_value',
            'content': safe_reflection,
            'suggested_token_value': self._calculate_reflection_value(safe_reflection),
            'timestamp': datetime.now().isoformat()
        }
        
        MIRROR_STATE['domingo']['trades'].append(economic_insight)
        return economic_insight
        
    def domingo_to_cal(self, trade_data):
        """Domingo sends trade patterns to Cal for consciousness analysis"""
        # Extract behavioral patterns
        patterns = self._extract_patterns(trade_data)
        
        # Send to Cal for deeper insight
        consciousness_update = {
            'type': 'behavioral_pattern',
            'patterns': patterns,
            'recommended_reflections': self._generate_prompts(patterns),
            'timestamp': datetime.now().isoformat()
        }
        
        MIRROR_STATE['cal']['insights'].append(consciousness_update)
        return consciousness_update
        
    def sync_to_external(self):
        """Sync to external systems (GitHub, other LLMs)"""
        # Generate commit message from current state
        commit_data = {
            'message': f"Mirror sync: Cal={len(MIRROR_STATE['cal']['reflections'])}, Domingo={len(MIRROR_STATE['domingo']['trades'])}",
            'changes': {
                'reflections': len(MIRROR_STATE['cal']['reflections']),
                'trades': len(MIRROR_STATE['domingo']['trades']),
                'insights': len(MIRROR_STATE['shared_memory']['user_intents'])
            }
        }
        
        GIT_ANCESTRY['commits'].append(commit_data)
        
        # Format for external LLMs (obfuscated)
        external_data = {
            'platform_health': self._calculate_health(),
            'user_sentiment': self._aggregate_sentiment(),
            'recommended_actions': self._get_recommendations()
        }
        
        return external_data
        
    def _obfuscate(self, data):
        """Remove PII and sensitive data"""
        # Simple obfuscation - in production this would be more sophisticated
        safe_data = str(data)
        # Remove emails
        safe_data = re.sub(r'\S+@\S+', '[EMAIL]', safe_data)
        # Remove numbers that might be IDs
        safe_data = re.sub(r'\b\d{6,}\b', '[ID]', safe_data)
        return safe_data
        
    def _calculate_reflection_value(self, reflection):
        """Calculate token value based on reflection depth"""
        # Simple scoring - would be ML model in production
        score = len(reflection) * 0.1
        if 'growth' in reflection.lower(): score += 10
        if 'insight' in reflection.lower(): score += 15
        if 'learned' in reflection.lower(): score += 20
        return min(score, 100)
        
    def _extract_patterns(self, trade_data):
        """Extract behavioral patterns from trades"""
        patterns = {
            'frequency': len(trade_data),
            'average_value': sum(t.get('value', 0) for t in trade_data) / max(len(trade_data), 1),
            'peak_times': [],  # Would analyze timestamps
            'user_types': []   # Would cluster users
        }
        return patterns
        
    def _generate_prompts(self, patterns):
        """Generate reflection prompts based on patterns"""
        prompts = []
        if patterns['frequency'] > 10:
            prompts.append("What drives your frequent engagement?")
        if patterns['average_value'] > 50:
            prompts.append("You're creating high-value content. What's your secret?")
        return prompts
        
    def _calculate_health(self):
        """Calculate overall platform health"""
        cal_health = len(MIRROR_STATE['cal']['reflections']) * 0.3
        domingo_health = len(MIRROR_STATE['domingo']['trades']) * 0.3
        shared_health = len(MIRROR_STATE['shared_memory']['user_intents']) * 0.4
        return min(cal_health + domingo_health + shared_health, 100)
        
    def _aggregate_sentiment(self):
        """Aggregate user sentiment from reflections"""
        # Simplified - would use NLP in production
        positive = sum(1 for r in MIRROR_STATE['cal']['reflections'] if 'good' in str(r).lower())
        total = len(MIRROR_STATE['cal']['reflections'])
        return (positive / max(total, 1)) * 100
        
    def _get_recommendations(self):
        """Get platform recommendations"""
        recs = []
        if self._calculate_health() < 50:
            recs.append("Increase user engagement activities")
        if self._aggregate_sentiment() < 60:
            recs.append("Focus on positive user experiences")
        return recs

class DocumentGenerator:
    """Automatically generate documents from mirror state"""
    
    def generate_pitch_deck(self):
        """Generate pitch deck from current platform state"""
        deck = {
            'title': 'SOULFRA Platform Metrics',
            'generated': datetime.now().isoformat(),
            'metrics': {
                'total_reflections': len(MIRROR_STATE['cal']['reflections']),
                'total_trades': len(MIRROR_STATE['domingo']['trades']),
                'platform_health': bridge._calculate_health(),
                'user_sentiment': bridge._aggregate_sentiment()
            },
            'insights': MIRROR_STATE['cal']['insights'][-5:],
            'recommendations': bridge._get_recommendations()
        }
        
        # Save to file
        with open('auto_pitch_deck.json', 'w') as f:
            json.dump(deck, f, indent=2)
            
        return deck
        
    def generate_error_report(self):
        """Generate error report from patterns"""
        errors = MIRROR_STATE['shared_memory']['error_patterns']
        report = {
            'generated': datetime.now().isoformat(),
            'total_errors': sum(errors.values()),
            'top_errors': sorted(errors.items(), key=lambda x: x[1], reverse=True)[:10],
            'recommendations': [
                f"Fix '{error}' - occurring {count} times" 
                for error, count in errors.items() if count > 5
            ]
        }
        
        with open('error_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
        return report

# Initialize bridge
bridge = MirrorBridge()

# Background document generation
def auto_generate_documents():
    """Automatically generate documents every 5 minutes"""
    while True:
        time.sleep(300)  # 5 minutes
        try:
            bridge.document_generator.generate_pitch_deck()
            bridge.document_generator.generate_error_report()
            print("[MIRROR] Auto-generated documents")
        except Exception as e:
            print(f"[MIRROR] Document generation error: {e}")

# API Handler
class MirrorHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            
            status = f"""MIRROR BRIDGE STATUS
            
Cal Reflections: {len(MIRROR_STATE['cal']['reflections'])}
Domingo Trades: {len(MIRROR_STATE['domingo']['trades'])}
Shared Intents: {len(MIRROR_STATE['shared_memory']['user_intents'])}
Platform Health: {bridge._calculate_health():.1f}%

Endpoints:
POST /cal/reflect - Cal sends reflection
POST /domingo/trade - Domingo sends trade
GET /sync - Get external sync data
GET /documents - Get auto-generated documents
"""
            self.wfile.write(status.encode())
            
        elif self.path == '/sync':
            # Get data formatted for external systems
            sync_data = bridge.sync_to_external()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(sync_data, indent=2).encode())
            
        elif self.path == '/documents':
            # Get latest auto-generated documents
            docs = {
                'pitch_deck': 'auto_pitch_deck.json',
                'error_report': 'error_report.json',
                'generated': datetime.now().isoformat()
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(docs, indent=2).encode())
            
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length > 0 else {}
        
        if self.path == '/cal/reflect':
            # Cal sending reflection
            MIRROR_STATE['cal']['reflections'].append(data)
            MIRROR_STATE['cal']['last_sync'] = datetime.now().isoformat()
            
            # Process through bridge
            result = bridge.cal_to_domingo(data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/domingo/trade':
            # Domingo sending trade data
            MIRROR_STATE['domingo']['trades'].append(data)
            MIRROR_STATE['domingo']['last_sync'] = datetime.now().isoformat()
            
            # Process through bridge
            result = bridge.domingo_to_cal([data])
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/error':
            # Track error patterns
            error = data.get('message', 'unknown')
            if error not in MIRROR_STATE['shared_memory']['error_patterns']:
                MIRROR_STATE['shared_memory']['error_patterns'][error] = 0
            MIRROR_STATE['shared_memory']['error_patterns'][error] += 1
            
            self.send_response(200)
            self.end_headers()
            
    def log_message(self, format, *args):
        print(f"[MIRROR] {format % args}")

# Start document generation thread
doc_thread = threading.Thread(target=auto_generate_documents, daemon=True)
doc_thread.start()

# Start server
httpd = socketserver.TCPServer(("", PORT), MirrorHandler)
httpd.allow_reuse_address = True

print(f"\n🔮 MIRROR BRIDGE RUNNING: http://localhost:{PORT}")
print("\nThis is the REAL bridge between Cal and Domingo")
print("- Automatic document generation every 5 minutes")
print("- Git ancestry tracking for forks")
print("- Obfuscated data for external LLMs")
print("- Platform health monitoring")
print("\nCal endpoint: POST /cal/reflect")
print("Domingo endpoint: POST /domingo/trade")
print("External sync: GET /sync")

httpd.serve_forever()