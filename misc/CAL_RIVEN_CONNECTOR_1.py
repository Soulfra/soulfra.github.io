#!/usr/bin/env python3
"""
CAL RIVEN CONNECTOR - Bridges platform to Cal Riven AI on port 4040
"""

import http.client
import json
import time
from datetime import datetime

class CalRivenConnector:
    def __init__(self, cal_host="localhost", cal_port=4040, platform_port=3003):
        self.cal_host = cal_host
        self.cal_port = cal_port
        self.platform_port = platform_port
        self.connection_status = False
        self.last_reflection = None
        
    def check_cal_riven_status(self):
        """Check if Cal Riven is running on port 4040"""
        try:
            conn = http.client.HTTPConnection(self.cal_host, self.cal_port, timeout=5)
            conn.request("GET", "/api/status")
            response = conn.getresponse()
            if response.status == 200:
                self.connection_status = True
                return True
            conn.close()
        except:
            self.connection_status = False
        return False
        
    def send_reflection_to_cal(self, reflection_data):
        """Send reflection to Cal Riven for processing"""
        try:
            conn = http.client.HTTPConnection(self.cal_host, self.cal_port, timeout=10)
            headers = {'Content-Type': 'application/json'}
            
            # Prepare reflection for Cal
            cal_payload = {
                "reflection": reflection_data.get('text', ''),
                "score": reflection_data.get('score', 0),
                "timestamp": reflection_data.get('timestamp', datetime.now().isoformat()),
                "user_id": reflection_data.get('user_id', 'anonymous'),
                "context": {
                    "platform": "soulfra",
                    "game_state": reflection_data.get('game_state', {})
                }
            }
            
            conn.request("POST", "/api/reflect", json.dumps(cal_payload), headers)
            response = conn.getresponse()
            
            if response.status == 200:
                result = json.loads(response.read().decode())
                return {
                    "success": True,
                    "cal_response": result.get('response', ''),
                    "insights": result.get('insights', []),
                    "growth_metrics": result.get('growth_metrics', {})
                }
            conn.close()
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Cal Riven not available - reflection saved locally"
            }
            
    def get_cal_insights(self, user_id=None):
        """Get AI insights from Cal Riven"""
        try:
            conn = http.client.HTTPConnection(self.cal_host, self.cal_port, timeout=10)
            
            endpoint = f"/api/insights"
            if user_id:
                endpoint += f"?user_id={user_id}"
                
            conn.request("GET", endpoint)
            response = conn.getresponse()
            
            if response.status == 200:
                return json.loads(response.read().decode())
            conn.close()
            
        except:
            return {"insights": [], "status": "Cal Riven offline"}
            
    def sync_platform_data(self):
        """Sync platform data with Cal Riven"""
        try:
            # Get platform data
            conn = http.client.HTTPConnection("localhost", self.platform_port)
            conn.request("GET", "/api/analytics")
            response = conn.getresponse()
            
            if response.status == 200:
                platform_data = json.loads(response.read().decode())
                
                # Send to Cal Riven
                cal_conn = http.client.HTTPConnection(self.cal_host, self.cal_port)
                headers = {'Content-Type': 'application/json'}
                
                sync_data = {
                    "platform_metrics": platform_data.get('metrics', {}),
                    "reflections": platform_data.get('game_data', {}).get('reflections', []),
                    "timestamp": datetime.now().isoformat()
                }
                
                cal_conn.request("POST", "/api/sync", json.dumps(sync_data), headers)
                cal_response = cal_conn.getresponse()
                
                if cal_response.status == 200:
                    return {"success": True, "synced_at": datetime.now().isoformat()}
                    
        except Exception as e:
            return {"success": False, "error": str(e)}

# Integration middleware for platform
class ReflectionMiddleware:
    def __init__(self):
        self.connector = CalRivenConnector()
        self.queue = []
        
    def process_reflection(self, reflection_data):
        """Process reflection through Cal Riven if available"""
        # Check Cal connection
        if self.connector.check_cal_riven_status():
            # Send to Cal
            result = self.connector.send_reflection_to_cal(reflection_data)
            
            if result['success']:
                # Enhance reflection with Cal's response
                reflection_data['ai_response'] = result.get('cal_response', '')
                reflection_data['insights'] = result.get('insights', [])
                reflection_data['growth_metrics'] = result.get('growth_metrics', {})
            else:
                # Queue for later if Cal is temporarily unavailable
                self.queue.append(reflection_data)
        else:
            # Store locally if Cal is offline
            reflection_data['ai_response'] = "Stored locally - Cal Riven offline"
            self.queue.append(reflection_data)
            
        return reflection_data
        
    def process_queue(self):
        """Process queued reflections when Cal comes online"""
        if not self.connector.check_cal_riven_status():
            return {"processed": 0, "remaining": len(self.queue)}
            
        processed = 0
        failed = []
        
        while self.queue:
            reflection = self.queue.pop(0)
            result = self.connector.send_reflection_to_cal(reflection)
            
            if result['success']:
                processed += 1
            else:
                failed.append(reflection)
                
        # Re-queue failed items
        self.queue.extend(failed)
        
        return {"processed": processed, "remaining": len(self.queue)}

# Example usage
if __name__ == "__main__":
    print("\n=== CAL RIVEN CONNECTOR TEST ===\n")
    
    connector = CalRivenConnector()
    
    # Check Cal status
    print(f"Checking Cal Riven on port 4040...")
    if connector.check_cal_riven_status():
        print("✓ Cal Riven is online!")
    else:
        print("✗ Cal Riven is offline")
        print("  To start Cal Riven:")
        print("  cd runtime && node riven-cli-server.js")
        
    # Test reflection
    test_reflection = {
        "text": "I'm learning to focus better through this game",
        "score": 42,
        "user_id": "test_user"
    }
    
    print(f"\nSending test reflection...")
    result = connector.send_reflection_to_cal(test_reflection)
    print(f"Result: {json.dumps(result, indent=2)}")
    
    # Test middleware
    print("\n=== MIDDLEWARE TEST ===\n")
    middleware = ReflectionMiddleware()
    
    enhanced = middleware.process_reflection(test_reflection)
    print(f"Enhanced reflection: {json.dumps(enhanced, indent=2)}")
    
    # Show queue status
    print(f"\nQueue status: {len(middleware.queue)} items pending")