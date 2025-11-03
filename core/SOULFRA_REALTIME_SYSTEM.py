#!/usr/bin/env python3
"""
SOULFRA REALTIME SYSTEM - Pusher-style channels and beams
Real-time bidirectional communication for all services
"""

import asyncio
import json
import uuid
import time
from datetime import datetime
from typing import Dict, Set, List, Optional, Callable
import websockets
from websockets.server import WebSocketServerProtocol
import sqlite3
from collections import defaultdict
import hashlib

class Channel:
    """A channel that clients can subscribe to"""
    
    def __init__(self, name: str, private: bool = False):
        self.name = name
        self.private = private
        self.subscribers: Set[WebSocketServerProtocol] = set()
        self.presence_data: Dict[str, Dict] = {}  # For presence channels
        
    async def subscribe(self, client: WebSocketServerProtocol, auth: Optional[str] = None):
        """Subscribe a client to this channel"""
        if self.private and not self._verify_auth(auth):
            raise Exception("Authentication failed")
            
        self.subscribers.add(client)
        
        # Notify others of new member (presence channel)
        if self.name.startswith("presence-"):
            await self._member_added(client)
            
    async def unsubscribe(self, client: WebSocketServerProtocol):
        """Unsubscribe a client"""
        self.subscribers.discard(client)
        
        # Notify others of member leaving
        if self.name.startswith("presence-"):
            await self._member_removed(client)
            
    async def publish(self, event: str, data: Dict, exclude: Optional[WebSocketServerProtocol] = None):
        """Publish an event to all subscribers"""
        message = {
            "channel": self.name,
            "event": event,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Send to all subscribers except excluded
        disconnected = []
        for client in self.subscribers:
            if client != exclude:
                try:
                    await client.send(json.dumps(message))
                except:
                    disconnected.append(client)
                    
        # Clean up disconnected clients
        for client in disconnected:
            await self.unsubscribe(client)
            
    def _verify_auth(self, auth: str) -> bool:
        """Verify authentication for private channels"""
        # In production, verify against your auth system
        return auth is not None
        
    async def _member_added(self, client: WebSocketServerProtocol):
        """Handle presence channel member added"""
        user_id = getattr(client, 'user_id', str(id(client)))
        user_info = getattr(client, 'user_info', {"id": user_id})
        
        self.presence_data[user_id] = user_info
        
        # Notify all subscribers
        await self.publish("pusher:member_added", {
            "user_id": user_id,
            "user_info": user_info
        }, exclude=client)
        
    async def _member_removed(self, client: WebSocketServerProtocol):
        """Handle presence channel member removed"""
        user_id = getattr(client, 'user_id', str(id(client)))
        
        if user_id in self.presence_data:
            del self.presence_data[user_id]
            
        await self.publish("pusher:member_removed", {
            "user_id": user_id
        })

class Beam:
    """Push notifications to specific users/devices"""
    
    def __init__(self):
        self.interests: Dict[str, Set[WebSocketServerProtocol]] = defaultdict(set)
        self.user_devices: Dict[str, Set[WebSocketServerProtocol]] = defaultdict(set)
        
    def register_interest(self, interest: str, client: WebSocketServerProtocol):
        """Register client interest"""
        self.interests[interest].add(client)
        
    def register_user(self, user_id: str, client: WebSocketServerProtocol):
        """Register user device"""
        self.user_devices[user_id].add(client)
        
    async def publish_to_interests(self, interests: List[str], notification: Dict):
        """Send notification to all clients with matching interests"""
        clients = set()
        for interest in interests:
            clients.update(self.interests.get(interest, set()))
            
        message = {
            "type": "beam",
            "notification": notification,
            "timestamp": datetime.now().isoformat()
        }
        
        for client in clients:
            try:
                await client.send(json.dumps(message))
            except:
                pass
                
    async def publish_to_users(self, user_ids: List[str], notification: Dict):
        """Send notification to specific users"""
        clients = set()
        for user_id in user_ids:
            clients.update(self.user_devices.get(user_id, set()))
            
        message = {
            "type": "beam",
            "notification": notification,
            "timestamp": datetime.now().isoformat()
        }
        
        for client in clients:
            try:
                await client.send(json.dumps(message))
            except:
                pass

class SoulfraRealtime:
    """Main realtime server"""
    
    def __init__(self):
        self.channels: Dict[str, Channel] = {}
        self.beam = Beam()
        self.clients: Set[WebSocketServerProtocol] = set()
        self.client_channels: Dict[WebSocketServerProtocol, Set[str]] = defaultdict(set)
        
        # Metrics
        self.metrics = {
            "messages_sent": 0,
            "messages_received": 0,
            "connections": 0,
            "channels_active": 0
        }
        
    def get_or_create_channel(self, name: str) -> Channel:
        """Get existing channel or create new one"""
        if name not in self.channels:
            private = name.startswith("private-") or name.startswith("presence-")
            self.channels[name] = Channel(name, private)
            self.metrics["channels_active"] = len(self.channels)
        return self.channels[name]
        
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle a client connection"""
        self.clients.add(websocket)
        self.metrics["connections"] = len(self.clients)
        
        try:
            # Send connection established
            await websocket.send(json.dumps({
                "event": "pusher:connection_established",
                "data": {
                    "socket_id": str(id(websocket)),
                    "activity_timeout": 120
                }
            }))
            
            # Handle messages
            async for message in websocket:
                await self.handle_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            # Clean up
            await self.disconnect_client(websocket)
            
    async def handle_message(self, client: WebSocketServerProtocol, message: str):
        """Handle incoming message from client"""
        self.metrics["messages_received"] += 1
        
        try:
            data = json.loads(message)
            event = data.get("event")
            
            if event == "pusher:subscribe":
                await self.handle_subscribe(client, data)
            elif event == "pusher:unsubscribe":
                await self.handle_unsubscribe(client, data)
            elif event == "client-event":
                await self.handle_client_event(client, data)
            elif event == "pusher:ping":
                await client.send(json.dumps({"event": "pusher:pong"}))
            elif event == "beam:register_interest":
                await self.handle_beam_interest(client, data)
            elif event == "beam:register_user":
                await self.handle_beam_user(client, data)
                
        except Exception as e:
            await client.send(json.dumps({
                "event": "pusher:error",
                "data": {"message": str(e)}
            }))
            
    async def handle_subscribe(self, client: WebSocketServerProtocol, data: Dict):
        """Handle channel subscription"""
        channel_name = data["data"]["channel"]
        auth = data["data"].get("auth")
        
        channel = self.get_or_create_channel(channel_name)
        
        try:
            await channel.subscribe(client, auth)
            self.client_channels[client].add(channel_name)
            
            # Send subscription succeeded
            await client.send(json.dumps({
                "event": "pusher_internal:subscription_succeeded",
                "channel": channel_name,
                "data": {}
            }))
            
            # For presence channels, send members list
            if channel_name.startswith("presence-"):
                await client.send(json.dumps({
                    "event": "pusher_internal:subscription_succeeded",
                    "channel": channel_name,
                    "data": {
                        "presence": {
                            "ids": list(channel.presence_data.keys()),
                            "hash": {},
                            "count": len(channel.presence_data)
                        }
                    }
                }))
                
        except Exception as e:
            await client.send(json.dumps({
                "event": "pusher:subscription_error",
                "channel": channel_name,
                "data": {"message": str(e)}
            }))
            
    async def handle_unsubscribe(self, client: WebSocketServerProtocol, data: Dict):
        """Handle channel unsubscription"""
        channel_name = data["data"]["channel"]
        
        if channel_name in self.channels:
            await self.channels[channel_name].unsubscribe(client)
            self.client_channels[client].discard(channel_name)
            
    async def handle_client_event(self, client: WebSocketServerProtocol, data: Dict):
        """Handle client-triggered events"""
        channel_name = data.get("channel")
        
        if channel_name and channel_name in self.client_channels[client]:
            channel = self.channels[channel_name]
            
            # Only allow client events on private/presence channels
            if channel.private:
                await channel.publish(
                    data["event"],
                    data["data"],
                    exclude=client
                )
                self.metrics["messages_sent"] += len(channel.subscribers) - 1
                
    async def handle_beam_interest(self, client: WebSocketServerProtocol, data: Dict):
        """Handle beam interest registration"""
        interest = data["data"]["interest"]
        self.beam.register_interest(interest, client)
        
    async def handle_beam_user(self, client: WebSocketServerProtocol, data: Dict):
        """Handle beam user registration"""
        user_id = data["data"]["user_id"]
        client.user_id = user_id
        self.beam.register_user(user_id, client)
        
    async def disconnect_client(self, client: WebSocketServerProtocol):
        """Clean up disconnected client"""
        self.clients.discard(client)
        self.metrics["connections"] = len(self.clients)
        
        # Unsubscribe from all channels
        for channel_name in self.client_channels[client]:
            if channel_name in self.channels:
                await self.channels[channel_name].unsubscribe(client)
                
        del self.client_channels[client]
        
    # HTTP API endpoints for server-side publishing
    async def publish_event(self, channel: str, event: str, data: Dict):
        """Publish event from server side"""
        channel_obj = self.get_or_create_channel(channel)
        await channel_obj.publish(event, data)
        self.metrics["messages_sent"] += len(channel_obj.subscribers)
        
    async def send_beam(self, interests: List[str], notification: Dict):
        """Send beam notification"""
        await self.beam.publish_to_interests(interests, notification)

# Example HTTP API server for triggering events
from aiohttp import web

class RealtimeAPI:
    """HTTP API for server-side publishing"""
    
    def __init__(self, realtime: SoulfraRealtime):
        self.realtime = realtime
        self.app = web.Application()
        self.setup_routes()
        
    def setup_routes(self):
        self.app.router.add_post('/channels/{channel}/events', self.publish_event)
        self.app.router.add_post('/beams/publish', self.send_beam)
        self.app.router.add_get('/metrics', self.get_metrics)
        
    async def publish_event(self, request):
        """Publish event to channel"""
        channel = request.match_info['channel']
        data = await request.json()
        
        await self.realtime.publish_event(
            channel,
            data['event'],
            data['data']
        )
        
        return web.json_response({"success": True})
        
    async def send_beam(self, request):
        """Send beam notification"""
        data = await request.json()
        
        await self.realtime.send_beam(
            data['interests'],
            data['notification']
        )
        
        return web.json_response({"success": True})
        
    async def get_metrics(self, request):
        """Get realtime metrics"""
        return web.json_response(self.realtime.metrics)

# JavaScript client example
JS_CLIENT_EXAMPLE = """
// Soulfra Realtime Client Example

class SoulfraClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.channels = {};
        this.connected = false;
    }
    
    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('Connected to Soulfra Realtime');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    subscribe(channelName) {
        this.send({
            event: 'pusher:subscribe',
            data: { channel: channelName }
        });
        
        this.channels[channelName] = {
            callbacks: {}
        };
        
        return {
            bind: (event, callback) => {
                if (!this.channels[channelName].callbacks[event]) {
                    this.channels[channelName].callbacks[event] = [];
                }
                this.channels[channelName].callbacks[event].push(callback);
            }
        };
    }
    
    handleMessage(data) {
        if (data.event === 'pusher:connection_established') {
            this.connected = true;
            this.socketId = data.data.socket_id;
        }
        
        // Channel events
        if (data.channel && this.channels[data.channel]) {
            const callbacks = this.channels[data.channel].callbacks[data.event] || [];
            callbacks.forEach(cb => cb(data.data));
        }
        
        // Beam notifications
        if (data.type === 'beam') {
            this.onNotification(data.notification);
        }
    }
    
    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Usage
const client = new SoulfraClient('ws://localhost:6001');
client.connect();

// Subscribe to a channel
const channel = client.subscribe('chat-room-1');
channel.bind('new-message', (data) => {
    console.log('New message:', data);
});

// Register for beam notifications
client.send({
    event: 'beam:register_interest',
    data: { interest: 'gaming-updates' }
});
"""

async def main():
    """Run the realtime server"""
    realtime = SoulfraRealtime()
    
    # Start WebSocket server
    ws_server = await websockets.serve(
        realtime.handle_client,
        "localhost",
        6001
    )
    
    # Start HTTP API
    api = RealtimeAPI(realtime)
    runner = web.AppRunner(api.app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 6002)
    await site.start()
    
    print("=" * 60)
    print("SOULFRA REALTIME SYSTEM")
    print("=" * 60)
    print()
    print("WebSocket Server: ws://localhost:6001")
    print("HTTP API: http://localhost:6002")
    print()
    print("Features:")
    print("- Public channels")
    print("- Private channels (require auth)")
    print("- Presence channels (see who's online)")
    print("- Client events")
    print("- Beam notifications (push to interests/users)")
    print()
    print("Example HTTP API calls:")
    print("POST http://localhost:6002/channels/test-channel/events")
    print('{"event": "test-event", "data": {"message": "Hello!"}}')
    print()
    print("See JS_CLIENT_EXAMPLE in code for client usage")
    print("=" * 60)
    
    # Keep running
    await asyncio.Future()

if __name__ == "__main__":
    # Write client example to file
    with open('soulfra-realtime-client.js', 'w') as f:
        f.write(JS_CLIENT_EXAMPLE)
    
    asyncio.run(main())