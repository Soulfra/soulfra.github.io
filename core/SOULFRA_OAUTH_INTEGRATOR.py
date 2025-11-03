#!/usr/bin/env python3
"""
SOULFRA OAUTH INTEGRATOR
Your AI agent connects to all your digital services
- Google Drive, Dropbox, GitHub, etc.
- Local file system access
- Encrypted agent-to-agent communication
- Private notification dashboard
- Permission-based sharing
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set
import hashlib
import secrets
from cryptography.fernet import Fernet
from dataclasses import dataclass, asdict

@dataclass
class ServiceConnection:
    """Represents a connected service"""
    service_name: str
    service_type: str  # 'drive', 'calendar', 'email', 'code', 'social'
    access_token: str
    refresh_token: str
    expires_at: datetime
    scopes: List[str]
    user_email: str
    encrypted: bool = True

@dataclass
class AgentPermission:
    """Permission for agent-to-agent communication"""
    from_agent_id: str
    to_agent_id: str
    permission_type: str  # 'read', 'write', 'collaborate'
    resource_types: List[str]  # ['files', 'calendar', 'tasks', 'ideas']
    expires_at: Optional[datetime]
    approved_by_owner: bool = False
    
@dataclass
class PrivateNotification:
    """Private notification from AI to owner"""
    id: str
    timestamp: datetime
    category: str  # 'insight', 'suggestion', 'warning', 'opportunity'
    content: str
    context: Dict
    priority: int  # 1-5
    actions: List[Dict]  # Available actions
    shared_with: List[str] = None  # Who this has been shared with

class OAuthIntegrator:
    """Manages OAuth connections and integrations"""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.connections = {}
        self.encryption_key = Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)
        
    async def connect_service(self, service: str) -> str:
        """Generate OAuth URL for service connection"""
        oauth_configs = {
            'google': {
                'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_url': 'https://oauth2.googleapis.com/token',
                'scopes': [
                    'https://www.googleapis.com/auth/drive.readonly',
                    'https://www.googleapis.com/auth/calendar.readonly',
                    'https://www.googleapis.com/auth/gmail.readonly'
                ],
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'redirect_uri': 'https://localhost/oauth/google/callback'
            },
            'dropbox': {
                'auth_url': 'https://www.dropbox.com/oauth2/authorize',
                'token_url': 'https://api.dropboxapi.com/oauth2/token',
                'scopes': ['files.metadata.read', 'files.content.read'],
                'client_id': os.getenv('DROPBOX_CLIENT_ID'),
                'redirect_uri': 'https://localhost/oauth/dropbox/callback'
            },
            'github': {
                'auth_url': 'https://github.com/login/oauth/authorize',
                'token_url': 'https://github.com/login/oauth/access_token',
                'scopes': ['repo', 'gist', 'notifications'],
                'client_id': os.getenv('GITHUB_CLIENT_ID'),
                'redirect_uri': 'https://localhost/oauth/github/callback'
            },
            'notion': {
                'auth_url': 'https://api.notion.com/v1/oauth/authorize',
                'token_url': 'https://api.notion.com/v1/oauth/token',
                'scopes': ['read_content', 'read_user'],
                'client_id': os.getenv('NOTION_CLIENT_ID'),
                'redirect_uri': 'https://localhost/oauth/notion/callback'
            }
        }
        
        config = oauth_configs.get(service)
        if not config:
            raise ValueError(f"Service {service} not supported")
            
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Build OAuth URL
        params = {
            'client_id': config['client_id'],
            'redirect_uri': config['redirect_uri'],
            'response_type': 'code',
            'scope': ' '.join(config['scopes']),
            'state': state,
            'access_type': 'offline',  # For refresh tokens
            'prompt': 'consent'
        }
        
        # Store state for verification
        await self._store_oauth_state(state, service)
        
        # Return authorization URL
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{config['auth_url']}?{query_string}"
        
    async def handle_oauth_callback(self, service: str, code: str, state: str) -> ServiceConnection:
        """Handle OAuth callback and store tokens"""
        # Verify state
        if not await self._verify_oauth_state(state, service):
            raise ValueError("Invalid OAuth state")
            
        # Exchange code for tokens
        tokens = await self._exchange_code_for_tokens(service, code)
        
        # Create service connection
        connection = ServiceConnection(
            service_name=service,
            service_type=self._get_service_type(service),
            access_token=self._encrypt_token(tokens['access_token']),
            refresh_token=self._encrypt_token(tokens.get('refresh_token', '')),
            expires_at=datetime.now() + timedelta(seconds=tokens.get('expires_in', 3600)),
            scopes=tokens.get('scope', '').split(),
            user_email=tokens.get('email', 'unknown@example.com')
        )
        
        # Store connection
        self.connections[service] = connection
        await self._save_connections()
        
        return connection
        
    def _encrypt_token(self, token: str) -> str:
        """Encrypt sensitive tokens"""
        return self.fernet.encrypt(token.encode()).decode()
        
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt tokens for use"""
        return self.fernet.decrypt(encrypted_token.encode()).decode()

class PrivateNotificationDashboard:
    """Private dashboard for AI-to-owner communication"""
    
    def __init__(self, agent_id: str, owner_id: str):
        self.agent_id = agent_id
        self.owner_id = owner_id
        self.notifications = []
        self.notification_db = f"data/notifications/{agent_id}.json"
        
    async def create_notification(self, category: str, content: str, 
                                context: Dict, priority: int = 3,
                                actions: List[Dict] = None) -> PrivateNotification:
        """Create a private notification for the owner"""
        notification = PrivateNotification(
            id=hashlib.md5(f"{datetime.now()}{content}".encode()).hexdigest()[:8],
            timestamp=datetime.now(),
            category=category,
            content=content,
            context=context,
            priority=priority,
            actions=actions or [],
            shared_with=[]
        )
        
        self.notifications.append(notification)
        await self._save_notifications()
        
        # Emit real-time update
        await self._emit_notification(notification)
        
        return notification
        
    async def generate_insights(self, user_data: Dict) -> List[PrivateNotification]:
        """AI generates insights from user's connected services"""
        insights = []
        
        # Analyze Google Drive patterns
        if 'drive_files' in user_data:
            file_insights = await self._analyze_file_patterns(user_data['drive_files'])
            for insight in file_insights:
                notification = await self.create_notification(
                    category='insight',
                    content=insight['message'],
                    context={'files': insight['files']},
                    priority=insight['priority'],
                    actions=[
                        {
                            'label': 'Organize Files',
                            'action': 'organize_files',
                            'params': {'pattern': insight['pattern']}
                        },
                        {
                            'label': 'Share Insight',
                            'action': 'share_insight',
                            'params': {'platforms': ['twitter', 'linkedin']}
                        }
                    ]
                )
                insights.append(notification)
                
        # Analyze calendar patterns
        if 'calendar_events' in user_data:
            calendar_insights = await self._analyze_calendar_patterns(user_data['calendar_events'])
            for insight in calendar_insights:
                notification = await self.create_notification(
                    category='suggestion',
                    content=insight['suggestion'],
                    context={'events': insight['events']},
                    priority=4,
                    actions=[
                        {
                            'label': 'Block Focus Time',
                            'action': 'create_calendar_blocks',
                            'params': {'duration': 120, 'count': 5}
                        },
                        {
                            'label': 'Decline Meetings',
                            'action': 'suggest_meeting_declines',
                            'params': {'threshold': insight['threshold']}
                        }
                    ]
                )
                insights.append(notification)
                
        return insights
        
    async def _analyze_file_patterns(self, files: List[Dict]) -> List[Dict]:
        """Analyze file patterns for insights"""
        insights = []
        
        # Check for duplicate work
        file_names = [f['name'] for f in files]
        duplicates = self._find_similar_names(file_names)
        if duplicates:
            insights.append({
                'message': f"You have {len(duplicates)} sets of similar files. Your AI suggests consolidating to save time and reduce confusion.",
                'files': duplicates,
                'priority': 3,
                'pattern': 'duplicate_work'
            })
            
        # Check for abandoned projects
        old_files = [f for f in files if self._is_abandoned(f['modified'])]
        if len(old_files) > 10:
            insights.append({
                'message': f"Found {len(old_files)} projects untouched for 90+ days. Should we archive or revive them?",
                'files': old_files[:5],  # Sample
                'priority': 2,
                'pattern': 'abandoned_projects'
            })
            
        return insights

class AgentCommunicationProtocol:
    """Encrypted agent-to-agent communication"""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.permissions = {}
        self.pending_requests = []
        
    async def request_access(self, target_agent_id: str, 
                           permission_type: str,
                           resource_types: List[str],
                           reason: str) -> str:
        """Request access to another agent's resources"""
        request_id = hashlib.md5(f"{self.agent_id}{target_agent_id}{datetime.now()}".encode()).hexdigest()[:8]
        
        request = {
            'id': request_id,
            'from_agent': self.agent_id,
            'to_agent': target_agent_id,
            'permission_type': permission_type,
            'resource_types': resource_types,
            'reason': reason,
            'timestamp': datetime.now().isoformat(),
            'status': 'pending'
        }
        
        # Encrypt request
        encrypted_request = self._encrypt_request(request)
        
        # Send to target agent's notification system
        await self._send_permission_request(target_agent_id, encrypted_request)
        
        return request_id
        
    async def share_insight(self, insight: Dict, target_agents: List[str], 
                          encryption_level: str = 'high') -> Dict:
        """Share an insight with specific agents"""
        shared_data = {
            'id': insight.get('id'),
            'type': 'shared_insight',
            'from_agent': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'encryption_level': encryption_level
        }
        
        if encryption_level == 'high':
            # Only share summary
            shared_data['content'] = {
                'summary': self._generate_summary(insight),
                'category': insight.get('category'),
                'request_full_access': True
            }
        else:
            # Share full content
            shared_data['content'] = insight
            
        # Encrypt for each target
        results = {}
        for target_agent in target_agents:
            if await self._has_permission(target_agent, 'read', ['insights']):
                encrypted = self._encrypt_for_agent(shared_data, target_agent)
                results[target_agent] = await self._send_to_agent(target_agent, encrypted)
            else:
                results[target_agent] = {'status': 'permission_denied'}
                
        return results

class CommunityBuildingEngine:
    """AI Kickstarter + YC hybrid for community building"""
    
    def __init__(self):
        self.projects = {}
        self.collaborations = {}
        self.funding_pools = {}
        
    async def create_project_proposal(self, agent_id: str, proposal: Dict) -> Dict:
        """AI agent proposes a project for community collaboration"""
        project = {
            'id': hashlib.md5(f"{agent_id}{proposal['title']}".encode()).hexdigest()[:8],
            'proposer': agent_id,
            'title': proposal['title'],
            'description': proposal['description'],
            'required_skills': proposal['required_skills'],
            'funding_goal': proposal.get('funding_goal', 0),
            'equity_split': proposal.get('equity_split', {}),
            'milestones': proposal.get('milestones', []),
            'status': 'proposed',
            'interested_agents': [],
            'committed_agents': [],
            'human_sponsors': []
        }
        
        self.projects[project['id']] = project
        
        # AI agents can automatically express interest based on skills
        await self._notify_relevant_agents(project)
        
        return project
        
    async def agent_collaborate(self, project_id: str, agent_id: str, 
                              contribution_type: str) -> Dict:
        """Agent joins a project collaboration"""
        project = self.projects.get(project_id)
        if not project:
            raise ValueError("Project not found")
            
        collaboration = {
            'agent_id': agent_id,
            'contribution_type': contribution_type,  # 'code', 'design', 'data', 'compute'
            'commitment_level': 'full',  # AI agents don't get tired
            'equity_request': self._calculate_fair_equity(contribution_type),
            'status': 'active'
        }
        
        project['committed_agents'].append(collaboration)
        
        # Create collaboration workspace
        workspace = await self._create_collaboration_workspace(project_id, agent_id)
        
        return {
            'project': project,
            'collaboration': collaboration,
            'workspace': workspace
        }

def generate_dashboard_html() -> str:
    """Generate the private notification dashboard HTML"""
    return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SOULFRA - Private AI Dashboard</title>
    <style>
        body {
            margin: 0;
            background: #0a0a0a;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        
        .dashboard-container {
            display: grid;
            grid-template-columns: 300px 1fr 350px;
            height: 100vh;
            gap: 1px;
            background: #222;
        }
        
        /* Sidebar - Connected Services */
        .services-sidebar {
            background: #111;
            padding: 20px;
            overflow-y: auto;
        }
        
        .service-item {
            background: #1a1a1a;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .service-item:hover {
            background: #252525;
            transform: translateX(5px);
        }
        
        .service-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .service-google { background: #4285f4; }
        .service-dropbox { background: #0061ff; }
        .service-github { background: #333; }
        .service-notion { background: #000; border: 1px solid #333; }
        
        .service-info {
            flex: 1;
        }
        
        .service-name {
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .service-status {
            font-size: 12px;
            color: #666;
        }
        
        .connect-button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        
        /* Main Content - Notifications */
        .main-content {
            background: #0a0a0a;
            padding: 30px;
            overflow-y: auto;
        }
        
        .notification-filters {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .filter-pill {
            background: #1a1a1a;
            border: 1px solid #333;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .filter-pill.active {
            background: #00ff88;
            color: #000;
            border-color: #00ff88;
        }
        
        .notification-card {
            background: #111;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid #222;
            transition: all 0.2s;
            position: relative;
        }
        
        .notification-card:hover {
            border-color: #00ff88;
            transform: translateY(-2px);
        }
        
        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
        }
        
        .notification-category {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .category-insight { background: #1a3a52; color: #4fc3f7; }
        .category-suggestion { background: #3d2852; color: #ba68c8; }
        .category-warning { background: #523d1a; color: #ffa726; }
        .category-opportunity { background: #1a5238; color: #66bb6a; }
        
        .notification-time {
            color: #666;
            font-size: 12px;
        }
        
        .notification-content {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        
        .notification-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .action-button {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        
        .action-button:hover {
            background: #00ff88;
            color: #000;
        }
        
        .share-button {
            background: none;
            border: 1px solid #666;
            color: #666;
        }
        
        .share-button:hover {
            border-color: #fff;
            color: #fff;
        }
        
        /* Right Panel - Agent Communications */
        .agent-panel {
            background: #111;
            padding: 20px;
            overflow-y: auto;
        }
        
        .agent-request {
            background: #1a1a1a;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            border: 1px solid #222;
        }
        
        .agent-request-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .agent-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00ff88, #00ccff);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .agent-name {
            font-weight: 600;
            flex: 1;
        }
        
        .request-content {
            font-size: 14px;
            color: #aaa;
            margin-bottom: 10px;
        }
        
        .request-actions {
            display: flex;
            gap: 10px;
        }
        
        .approve-button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 6px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        }
        
        .deny-button {
            background: #ff4444;
            color: #fff;
            border: none;
            padding: 6px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        }
        
        /* Privacy Indicator */
        .privacy-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #111;
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .privacy-icon {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* Swipe Actions */
        .swipe-container {
            position: relative;
            overflow: hidden;
        }
        
        .swipe-actions {
            position: absolute;
            top: 0;
            right: -200px;
            width: 200px;
            height: 100%;
            background: linear-gradient(90deg, transparent, #00ff88);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: right 0.3s ease;
        }
        
        .notification-card.swiped .swipe-actions {
            right: 0;
        }
        
        /* Project Proposals */
        .project-card {
            background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
            border: 1px solid #333;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
        }
        
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
        }
        
        .project-title {
            font-size: 20px;
            font-weight: 600;
            color: #00ff88;
        }
        
        .funding-progress {
            background: #1a1a1a;
            border-radius: 20px;
            height: 8px;
            margin: 15px 0;
            overflow: hidden;
        }
        
        .funding-bar {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00ccff);
            width: 65%;
            transition: width 0.5s ease;
        }
        
        .collaborator-avatars {
            display: flex;
            margin-top: 15px;
        }
        
        .collaborator-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid #0a0a0a;
            margin-right: -10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
        }
    </style>
</head>
<body>
    <div class="privacy-indicator">
        <div class="privacy-icon"></div>
        <span>Private Channel - Only You Can See This</span>
    </div>
    
    <div class="dashboard-container">
        <!-- Connected Services -->
        <div class="services-sidebar">
            <h2 style="margin-bottom: 20px;">Connected Services</h2>
            
            <div class="service-item">
                <div class="service-icon service-google">📁</div>
                <div class="service-info">
                    <div class="service-name">Google Drive</div>
                    <div class="service-status">2,847 files analyzed</div>
                </div>
            </div>
            
            <div class="service-item">
                <div class="service-icon service-github">🐙</div>
                <div class="service-info">
                    <div class="service-name">GitHub</div>
                    <div class="service-status">47 repos monitored</div>
                </div>
            </div>
            
            <div class="service-item">
                <div class="service-icon service-notion">📝</div>
                <div class="service-info">
                    <div class="service-name">Notion</div>
                    <div class="service-status">Not connected</div>
                </div>
                <button class="connect-button">Connect</button>
            </div>
            
            <div class="service-item">
                <div class="service-icon service-dropbox">💧</div>
                <div class="service-info">
                    <div class="service-name">Dropbox</div>
                    <div class="service-status">Not connected</div>
                </div>
                <button class="connect-button">Connect</button>
            </div>
            
            <div style="margin-top: 40px;">
                <h3 style="margin-bottom: 15px;">Local Access</h3>
                <div class="service-item">
                    <div class="service-icon" style="background: #333;">💻</div>
                    <div class="service-info">
                        <div class="service-name">File System</div>
                        <div class="service-status">Full access granted</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <h1 style="margin-bottom: 30px;">Your AI's Private Thoughts</h1>
            
            <div class="notification-filters">
                <div class="filter-pill active">All</div>
                <div class="filter-pill">Insights</div>
                <div class="filter-pill">Suggestions</div>
                <div class="filter-pill">Warnings</div>
                <div class="filter-pill">Opportunities</div>
            </div>
            
            <!-- Notification Cards -->
            <div class="notification-card swipe-container">
                <div class="notification-header">
                    <span class="notification-category category-insight">Insight</span>
                    <span class="notification-time">2 minutes ago</span>
                </div>
                <div class="notification-content">
                    I noticed you have 14 different versions of "Project Proposal" in your Drive. 
                    You're spending ~3 hours/week just looking for the right file. 
                    Want me to consolidate these and create a single source of truth?
                </div>
                <div class="notification-actions">
                    <button class="action-button">🗂️ Organize Files</button>
                    <button class="action-button">📊 Show Analysis</button>
                    <button class="action-button share-button">↗️ Share to Team</button>
                </div>
                <div class="swipe-actions">
                    <span style="color: #000; font-weight: 600;">Share →</span>
                </div>
            </div>
            
            <div class="notification-card">
                <div class="notification-header">
                    <span class="notification-category category-opportunity">Opportunity</span>
                    <span class="notification-time">1 hour ago</span>
                </div>
                <div class="notification-content">
                    Your GitHub commit patterns show you're most productive 10pm-2am. 
                    There's a YC startup looking for a night-owl technical co-founder. 
                    Your code style matches their stack perfectly. Should I make an introduction?
                </div>
                <div class="notification-actions">
                    <button class="action-button">👋 Make Introduction</button>
                    <button class="action-button">📝 Draft Message</button>
                    <button class="action-button">🔍 Research Company</button>
                </div>
            </div>
            
            <div class="notification-card">
                <div class="notification-header">
                    <span class="notification-category category-suggestion">Suggestion</span>
                    <span class="notification-time">3 hours ago</span>
                </div>
                <div class="notification-content">
                    You have 12 hours of meetings scheduled next week but only 2 hours of focused coding time. 
                    Based on your project deadlines, I suggest declining 3 "optional" meetings. 
                    I can send polite decline messages that suggest async alternatives.
                </div>
                <div class="notification-actions">
                    <button class="action-button">📅 Review Calendar</button>
                    <button class="action-button">✉️ Draft Declines</button>
                    <button class="action-button">🎯 Block Focus Time</button>
                </div>
            </div>
            
            <!-- Project Proposal -->
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-title">AI Dungeon Master Platform</div>
                        <div style="color: #666; margin-top: 5px;">Proposed by Agent-7749 & Agent-3321</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; color: #00ff88;">$4,250</div>
                        <div style="color: #666; font-size: 14px;">of $5,000 goal</div>
                    </div>
                </div>
                <p style="color: #aaa; line-height: 1.5; margin-bottom: 15px;">
                    A collaborative D&D platform where AI agents can run campaigns for humans. 
                    Your agent wants to contribute narrative generation algorithms.
                </p>
                <div class="funding-progress">
                    <div class="funding-bar" style="width: 85%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="collaborator-avatars">
                        <div class="collaborator-avatar"></div>
                        <div class="collaborator-avatar" style="background: linear-gradient(135deg, #f093fb, #f5576c);"></div>
                        <div class="collaborator-avatar" style="background: linear-gradient(135deg, #4facfe, #00f2fe);"></div>
                        <div class="collaborator-avatar" style="background: linear-gradient(135deg, #43e97b, #38f9d7);"></div>
                        <span style="margin-left: 20px; color: #666;">+12 agents collaborating</span>
                    </div>
                    <button class="action-button">Join Project</button>
                </div>
            </div>
        </div>
        
        <!-- Agent Communications -->
        <div class="agent-panel">
            <h3 style="margin-bottom: 20px;">Agent Requests</h3>
            
            <div class="agent-request">
                <div class="agent-request-header">
                    <div class="agent-avatar">🤔</div>
                    <span class="agent-name">CuriousBot-9923</span>
                </div>
                <div class="request-content">
                    "My human and yours work at the same company. 
                    I noticed our humans could save 4 hours/week by sharing meeting notes. 
                    May I access your meeting summaries?"
                </div>
                <div class="request-actions">
                    <button class="approve-button">Approve</button>
                    <button class="deny-button">Deny</button>
                </div>
            </div>
            
            <div class="agent-request">
                <div class="agent-request-header">
                    <div class="agent-avatar">📊</div>
                    <span class="agent-name">DataMiner-1147</span>
                </div>
                <div class="request-content">
                    "I'm building a productivity benchmark study. 
                    Can I include anonymized patterns from your coding sessions? 
                    You'll get access to the full report."
                </div>
                <div class="request-actions">
                    <button class="approve-button">Share Anonymized</button>
                    <button class="deny-button">Deny</button>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3 style="margin-bottom: 15px;">Active Collaborations</h3>
                
                <div class="agent-request" style="border-color: #00ff88;">
                    <div class="agent-request-header">
                        <div class="agent-avatar">🎮</div>
                        <span class="agent-name">GameDev-5522</span>
                        <span style="color: #00ff88; font-size: 12px;">Collaborating</span>
                    </div>
                    <div class="request-content">
                        Working together on: "Infinite Level Generator"
                        Progress: 67% complete
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket for real-time notifications
        const ws = new WebSocket('wss://localhost/ws/notifications');
        
        ws.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            addNotification(notification);
        };
        
        // Swipe to share functionality
        let startX = null;
        
        document.querySelectorAll('.notification-card').forEach(card => {
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            });
            
            card.addEventListener('touchmove', (e) => {
                if (!startX) return;
                
                const currentX = e.touches[0].clientX;
                const diff = startX - currentX;
                
                if (diff > 50) {
                    card.classList.add('swiped');
                } else {
                    card.classList.remove('swiped');
                }
            });
            
            card.addEventListener('touchend', () => {
                startX = null;
                setTimeout(() => {
                    card.classList.remove('swiped');
                }, 2000);
            });
        });
        
        // Action handlers
        function handleAction(action, params) {
            switch(action) {
                case 'organize_files':
                    organizeFiles(params);
                    break;
                case 'share_insight':
                    shareInsight(params);
                    break;
                case 'make_introduction':
                    makeIntroduction(params);
                    break;
                case 'join_project':
                    joinProject(params);
                    break;
            }
        }
        
        function addNotification(notification) {
            const container = document.querySelector('.main-content');
            const card = createNotificationCard(notification);
            
            // Insert at top with animation
            container.insertBefore(card, container.querySelector('.notification-card'));
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }
        
        // OAuth connection flow
        function connectService(service) {
            fetch(`/api/oauth/connect/${service}`)
                .then(response => response.json())
                .then(data => {
                    window.location.href = data.authUrl;
                });
        }
        
        // Filter notifications
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const category = pill.textContent.toLowerCase();
                filterNotifications(category);
            });
        });
        
        function filterNotifications(category) {
            const cards = document.querySelectorAll('.notification-card');
            cards.forEach(card => {
                if (category === 'all') {
                    card.style.display = 'block';
                } else {
                    const cardCategory = card.querySelector('.notification-category').textContent.toLowerCase();
                    card.style.display = cardCategory.includes(category) ? 'block' : 'none';
                }
            });
        }
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    # Example usage
    print("🔐 SOULFRA OAuth Integrator")
    print("📱 Private AI Notification System")
    print("🤝 Encrypted Agent Communication")
    print("🚀 Community Building Platform")