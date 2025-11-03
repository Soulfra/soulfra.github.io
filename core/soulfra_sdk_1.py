#!/usr/bin/env python3
"""
SOULFRA SDK - Enterprise Game Platform SDK
Full licensing, API integration, game deployment
"""

import requests
import json
import websocket
import threading
import time
from typing import Dict, List, Optional, Callable
import uuid

class SoulfraSDK:
    """Main SDK class for Soulfra Enterprise Platform"""
    
    def __init__(self, api_key: str, tenant_id: str, base_url: str = "http://localhost:16000"):
        self.api_key = api_key
        self.tenant_id = tenant_id
        self.base_url = base_url
        self.ws = None
        self.event_handlers = {}
        
    def create_instance(self, game_type: str, name: str, config: Dict = None) -> 'GameInstance':
        """Create a new game instance"""
        response = self._api_post('/api/v1/instances', {
            'tenant_id': self.tenant_id,
            'type': game_type,
            'name': name,
            'config': config or {}
        })
        
        return GameInstance(self, response['instance_id'], response['port'])
    
    def get_instance(self, instance_id: str) -> 'GameInstance':
        """Get existing game instance"""
        response = self._api_get(f'/api/v1/instances/{instance_id}')
        return GameInstance(self, instance_id, response['port'])
    
    def list_instances(self) -> List[Dict]:
        """List all instances for tenant"""
        return self._api_get('/api/v1/instances')['data']
    
    def get_analytics(self, start_date: str = None, end_date: str = None) -> Dict:
        """Get analytics data"""
        params = {}
        if start_date:
            params['start'] = start_date
        if end_date:
            params['end'] = end_date
            
        return self._api_get('/api/v1/analytics', params)
    
    def connect_realtime(self):
        """Connect to realtime websocket"""
        ws_url = self.base_url.replace('http', 'ws') + '/ws'
        self.ws = websocket.WebSocketApp(
            ws_url,
            on_open=self._on_ws_open,
            on_message=self._on_ws_message,
            on_error=self._on_ws_error,
            on_close=self._on_ws_close
        )
        
        # Run in thread
        ws_thread = threading.Thread(target=self.ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()
    
    def on(self, event: str, handler: Callable):
        """Register event handler"""
        if event not in self.event_handlers:
            self.event_handlers[event] = []
        self.event_handlers[event].append(handler)
    
    def _api_get(self, endpoint: str, params: Dict = None) -> Dict:
        """Make GET request to API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'X-Tenant-ID': self.tenant_id
        }
        
        response = requests.get(
            self.base_url + endpoint,
            headers=headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def _api_post(self, endpoint: str, data: Dict) -> Dict:
        """Make POST request to API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'X-Tenant-ID': self.tenant_id,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            self.base_url + endpoint,
            headers=headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def _on_ws_open(self, ws):
        """WebSocket opened"""
        ws.send(json.dumps({
            'type': 'auth',
            'api_key': self.api_key,
            'tenant_id': self.tenant_id
        }))
    
    def _on_ws_message(self, ws, message):
        """Handle WebSocket message"""
        data = json.loads(message)
        event_type = data.get('type')
        
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                handler(data)
    
    def _on_ws_error(self, ws, error):
        """Handle WebSocket error"""
        print(f"WebSocket error: {error}")
    
    def _on_ws_close(self, ws):
        """WebSocket closed"""
        print("WebSocket connection closed")


class GameInstance:
    """Represents a game instance"""
    
    def __init__(self, sdk: SoulfraSDK, instance_id: str, port: int):
        self.sdk = sdk
        self.instance_id = instance_id
        self.port = port
        self.url = f"http://localhost:{port}"
        
    def add_player(self, player_id: str, player_data: Dict = None) -> Dict:
        """Add player to instance"""
        return self.sdk._api_post(
            f'/api/v1/instances/{self.instance_id}/players',
            {
                'player_id': player_id,
                'data': player_data or {}
            }
        )
    
    def remove_player(self, player_id: str) -> Dict:
        """Remove player from instance"""
        return self.sdk._api_post(
            f'/api/v1/instances/{self.instance_id}/players/{player_id}/remove',
            {}
        )
    
    def get_players(self) -> List[Dict]:
        """Get all players in instance"""
        return self.sdk._api_get(
            f'/api/v1/instances/{self.instance_id}/players'
        )['players']
    
    def update_config(self, config: Dict) -> Dict:
        """Update instance configuration"""
        return self.sdk._api_post(
            f'/api/v1/instances/{self.instance_id}/config',
            config
        )
    
    def get_analytics(self) -> Dict:
        """Get instance-specific analytics"""
        return self.sdk._api_get(
            f'/api/v1/instances/{self.instance_id}/analytics'
        )
    
    def broadcast(self, message: Dict) -> Dict:
        """Broadcast message to all players"""
        return self.sdk._api_post(
            f'/api/v1/instances/{self.instance_id}/broadcast',
            message
        )
    
    def shutdown(self) -> Dict:
        """Shutdown instance"""
        return self.sdk._api_post(
            f'/api/v1/instances/{self.instance_id}/shutdown',
            {}
        )
    
    def embed_code(self) -> str:
        """Get HTML embed code"""
        return f'''<iframe 
    src="{self.url}" 
    width="800" 
    height="600" 
    frameborder="0"
    allowfullscreen>
</iframe>'''
    
    def __repr__(self):
        return f"<GameInstance {self.instance_id} on port {self.port}>"


class LicenseManager:
    """Manage Soulfra licenses"""
    
    def __init__(self, license_key: str):
        self.license_key = license_key
        self._validate_license()
    
    def _validate_license(self):
        """Validate license key"""
        # In production, this would check with license server
        parts = self.license_key.split('-')
        if len(parts) != 4 or parts[0] not in ['STARTER', 'PRO', 'ENTERPRISE']:
            raise ValueError("Invalid license key")
    
    def get_tier(self) -> str:
        """Get license tier"""
        return self.license_key.split('-')[0].lower()
    
    def get_limits(self) -> Dict:
        """Get license limits"""
        tier = self.get_tier()
        
        limits = {
            'starter': {
                'max_instances': 5,
                'max_players': 500,
                'features': ['basic_analytics', 'email_support']
            },
            'pro': {
                'max_instances': 50,
                'max_players': 5000,
                'features': ['advanced_analytics', 'priority_support', 'white_label', 'api_access']
            },
            'enterprise': {
                'max_instances': None,  # Unlimited
                'max_players': None,    # Unlimited
                'features': ['custom_analytics', 'dedicated_support', 'source_code', 'custom_dev']
            }
        }
        
        return limits.get(tier, limits['starter'])
    
    def can_create_instance(self, current_count: int) -> bool:
        """Check if can create more instances"""
        limits = self.get_limits()
        max_instances = limits['max_instances']
        
        if max_instances is None:
            return True
        
        return current_count < max_instances
    
    def generate_api_key(self) -> str:
        """Generate API key for license"""
        return f"API-{self.get_tier().upper()}-{uuid.uuid4().hex[:16]}"


# Example usage
if __name__ == "__main__":
    # Initialize SDK
    sdk = SoulfraSDK(
        api_key="API-ENTERPRISE-abc123def456",
        tenant_id="demo-tenant-001"
    )
    
    # Create instance
    instance = sdk.create_instance(
        game_type="habbo",
        name="My Hotel",
        config={
            "max_players": 100,
            "theme": "tropical"
        }
    )
    
    print(f"Created instance: {instance}")
    print(f"Embed code:\n{instance.embed_code()}")
    
    # Connect to realtime events
    sdk.on('player-joined', lambda data: print(f"Player joined: {data}"))
    sdk.on('player-left', lambda data: print(f"Player left: {data}"))
    sdk.connect_realtime()
    
    # License management
    license_mgr = LicenseManager("ENTERPRISE-XXXX-YYYY-ZZZZ")
    print(f"License tier: {license_mgr.get_tier()}")
    print(f"License limits: {license_mgr.get_limits()}")