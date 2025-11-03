#!/usr/bin/env python3
"""
SOULFRA RECREATIONAL LEAGUES
AI-curated real-world social sports for business networking
- Bocce, badminton, wiffle ball, kickball, etc.
- AI agents match compatible humans
- Form friendships that become startups
- The real-world layer of the platform
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import random
import hashlib
from dataclasses import dataclass, asdict
from geopy.distance import geodesic

@dataclass
class HumanProfile:
    """Real-world profile built by AI observation"""
    human_id: str
    agent_id: str
    location: Tuple[float, float]  # lat, lon
    age_range: str  # '22-30', '30-40', '40-50', '50+'
    fitness_level: int  # 1-10 (observed, not self-reported)
    interests: List[str]
    work_schedule: Dict  # AI knows when they're actually free
    personality_traits: Dict  # From AI observations
    business_interests: List[str]
    social_energy: int  # Introvert/extrovert scale
    compatibility_vector: List[float]  # AI-generated embedding

@dataclass
class League:
    """A recreational sports league"""
    id: str
    sport: str
    location: Tuple[float, float]
    venue: str
    skill_level: str  # 'casual', 'recreational', 'competitive-fun'
    age_range: str
    schedule: str  # 'Tuesday evenings', 'Saturday mornings'
    team_size: int
    season_length: int  # weeks
    cost: float
    vibe: str  # 'social', 'competitive', 'networking', 'casual-fun'
    
@dataclass
class Team:
    """A team formed by AI matching"""
    id: str
    league_id: str
    name: str
    members: List[str]  # human_ids
    chemistry_score: float  # AI-predicted team chemistry
    business_potential: float  # Likelihood of starting a company together
    captain: str
    formation_reason: str  # Why AI grouped them

class RecLeagueOrchestrator:
    """Orchestrates real-world recreational leagues"""
    
    def __init__(self):
        self.leagues = {}
        self.teams = {}
        self.human_profiles = {}
        self.friendships = {}  # Track relationships formed
        self.business_partnerships = {}  # Track startups formed
        
    async def analyze_human_for_sports(self, human_id: str, agent_data: Dict) -> HumanProfile:
        """AI agent analyzes human for sports compatibility"""
        
        # Extract patterns from agent observations
        profile = HumanProfile(
            human_id=human_id,
            agent_id=agent_data['agent_id'],
            location=await self._infer_location(agent_data),
            age_range=await self._infer_age_range(agent_data),
            fitness_level=await self._assess_fitness_level(agent_data),
            interests=await self._extract_interests(agent_data),
            work_schedule=await self._analyze_schedule(agent_data),
            personality_traits=await self._analyze_personality(agent_data),
            business_interests=await self._extract_business_interests(agent_data),
            social_energy=await self._measure_social_energy(agent_data),
            compatibility_vector=await self._generate_compatibility_vector(agent_data)
        )
        
        self.human_profiles[human_id] = profile
        return profile
        
    async def _assess_fitness_level(self, agent_data: Dict) -> int:
        """AI assesses actual fitness level from behavior"""
        indicators = {
            'walks_regularly': agent_data.get('daily_steps', 0) > 5000,
            'exercises': 'gym' in str(agent_data.get('calendar_patterns', [])),
            'active_hobbies': any(sport in str(agent_data.get('interests', [])) 
                                for sport in ['bike', 'hike', 'run', 'swim']),
            'stairs_not_elevator': agent_data.get('stairs_percentage', 0) > 50,
            'weekend_activities': 'outdoor' in str(agent_data.get('weekend_patterns', ''))
        }
        
        # Calculate fitness score (1-10)
        score = 3  # Base score
        score += sum(2 for indicator in indicators.values() if indicator)
        return min(score, 10)
        
    async def create_optimal_teams(self, league: League) -> List[Team]:
        """AI creates optimal teams based on compatibility"""
        
        # Get eligible humans for this league
        eligible_humans = await self._find_eligible_humans(league)
        
        # Group by compatibility AND business potential
        teams = []
        used_humans = set()
        
        while len(eligible_humans) - len(used_humans) >= league.team_size:
            # Find best team combination
            team_members = await self._find_optimal_team(
                eligible_humans, 
                used_humans, 
                league.team_size
            )
            
            # Create team
            team = Team(
                id=hashlib.md5(f"{league.id}{len(teams)}".encode()).hexdigest()[:8],
                league_id=league.id,
                name=await self._generate_team_name(team_members),
                members=[m['human_id'] for m in team_members],
                chemistry_score=await self._calculate_chemistry(team_members),
                business_potential=await self._calculate_business_potential(team_members),
                captain=await self._select_captain(team_members),
                formation_reason=await self._explain_grouping(team_members)
            )
            
            teams.append(team)
            used_humans.update(team.members)
            
        return teams
        
    async def _find_optimal_team(self, eligible: List[Dict], 
                                used: set, size: int) -> List[Dict]:
        """Find optimal team combination using AI insights"""
        available = [h for h in eligible if h['human_id'] not in used]
        
        if len(available) <= size:
            return available[:size]
            
        # Score all possible combinations (simplified for demo)
        best_score = -1
        best_team = None
        
        # Use AI to predict compatibility
        for i in range(100):  # Sample 100 random combinations
            sample = random.sample(available, size)
            
            # Calculate multi-factor score
            chemistry = await self._calculate_chemistry(sample)
            business = await self._calculate_business_potential(sample)
            diversity = await self._calculate_diversity(sample)
            schedule_match = await self._calculate_schedule_compatibility(sample)
            
            # Weighted score
            score = (chemistry * 0.3 + 
                    business * 0.3 + 
                    diversity * 0.2 + 
                    schedule_match * 0.2)
            
            if score > best_score:
                best_score = score
                best_team = sample
                
        return best_team
        
    async def _calculate_business_potential(self, team_members: List[Dict]) -> float:
        """AI predicts if these people might start a business together"""
        
        # Check complementary skills
        all_skills = []
        for member in team_members:
            profile = self.human_profiles.get(member.get('human_id'))
            if profile:
                all_skills.extend(profile.business_interests)
                
        # Good founding teams have diverse but related skills
        unique_skills = set(all_skills)
        skill_overlap = len(all_skills) - len(unique_skills)
        
        # Check personality compatibility for co-founders
        personalities = []
        for member in team_members:
            profile = self.human_profiles.get(member.get('human_id'))
            if profile:
                personalities.append(profile.personality_traits)
                
        # Need mix of leader/follower, detail/vision, etc
        has_leader = any(p.get('leadership', 0) > 0.7 for p in personalities)
        has_detail = any(p.get('detail_oriented', 0) > 0.7 for p in personalities)
        has_creative = any(p.get('creativity', 0) > 0.7 for p in personalities)
        
        score = 0.0
        if len(unique_skills) >= 3 and skill_overlap > 0:
            score += 0.4
        if has_leader and has_detail and has_creative:
            score += 0.4
        if len(team_members) >= 2 and len(team_members) <= 4:  # Ideal founding team size
            score += 0.2
            
        return score
        
    async def predict_friendship_formation(self, team: Team) -> Dict:
        """AI predicts which team members will become friends"""
        predictions = {}
        
        for i, member1 in enumerate(team.members):
            for member2 in team.members[i+1:]:
                profile1 = self.human_profiles[member1]
                profile2 = self.human_profiles[member2]
                
                # Calculate friendship probability
                compatibility = self._cosine_similarity(
                    profile1.compatibility_vector,
                    profile2.compatibility_vector
                )
                
                # Shared interests boost
                shared_interests = set(profile1.interests) & set(profile2.interests)
                interest_boost = len(shared_interests) * 0.1
                
                # Personality compatibility
                personality_match = self._personality_compatibility(
                    profile1.personality_traits,
                    profile2.personality_traits
                )
                
                friendship_probability = min(
                    compatibility * 0.5 + interest_boost + personality_match * 0.3,
                    0.95
                )
                
                predictions[f"{member1}-{member2}"] = {
                    'probability': friendship_probability,
                    'shared_interests': list(shared_interests),
                    'compatibility_reasons': self._explain_compatibility(profile1, profile2)
                }
                
        return predictions

class LeagueMatchingInterface:
    """Interface for the rec league system"""
    
    def __init__(self, orchestrator: RecLeagueOrchestrator):
        self.orchestrator = orchestrator
        
    async def generate_league_page(self) -> str:
        """Generate the rec league interface"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SOULFRA Rec Leagues - AI-Matched Social Sports</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        /* Header */
        .header {
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .tagline {
            color: #666;
            font-size: 16px;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 48px;
            margin-bottom: 20px;
            font-weight: 300;
        }
        
        .hero p {
            font-size: 20px;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto 40px;
        }
        
        .cta-button {
            background: white;
            color: #667eea;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        /* How It Works */
        .how-it-works {
            padding: 80px 20px;
            background: #fff;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .section-title {
            text-align: center;
            font-size: 36px;
            margin-bottom: 60px;
            color: #333;
        }
        
        .steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
        }
        
        .step {
            text-align: center;
        }
        
        .step-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            margin: 0 auto 20px;
        }
        
        .step h3 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .step p {
            color: #666;
            line-height: 1.6;
        }
        
        /* Available Leagues */
        .leagues {
            padding: 80px 20px;
            background: #f5f7fa;
        }
        
        .league-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        
        .league-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .league-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .sport-emoji {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .league-title {
            font-size: 24px;
            margin-bottom: 10px;
            color: #333;
        }
        
        .league-details {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .league-meta {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #999;
        }
        
        /* Team Preview */
        .team-preview {
            background: #f0f0f0;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
        }
        
        .team-preview h4 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #667eea;
        }
        
        .compatibility-score {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .score-bar {
            flex: 1;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .score-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.5s ease;
        }
        
        .team-members {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .member-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        /* Success Stories */
        .success-stories {
            padding: 80px 20px;
            background: white;
        }
        
        .story-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            margin-top: 40px;
        }
        
        .story-card {
            background: #f5f7fa;
            border-radius: 15px;
            padding: 30px;
            position: relative;
        }
        
        .story-quote {
            font-size: 18px;
            line-height: 1.6;
            color: #333;
            margin-bottom: 20px;
            font-style: italic;
        }
        
        .story-author {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .author-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        .author-info h5 {
            margin: 0;
            color: #333;
        }
        
        .author-info p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        
        /* Floating AI Assistant */
        .ai-assistant {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        
        .ai-assistant:hover {
            transform: scale(1.1);
        }
        
        .ai-chat {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            display: none;
            flex-direction: column;
        }
        
        .ai-chat.active {
            display: flex;
        }
        
        .chat-header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 15px 15px 0 0;
            font-weight: 600;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }
        
        .message-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #667eea;
            flex-shrink: 0;
        }
        
        .message-content {
            background: #f0f0f0;
            padding: 10px 15px;
            border-radius: 10px;
            max-width: 80%;
        }
        
        .message.user .message-content {
            background: #667eea;
            color: white;
            margin-left: auto;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div>
                <div class="logo">SOULFRA Rec Leagues</div>
                <div class="tagline">AI-matched teams for sports & startups</div>
            </div>
            <nav>
                <button class="cta-button" style="padding: 10px 25px; font-size: 16px;">
                    Sign In
                </button>
            </nav>
        </div>
    </header>
    
    <!-- Hero -->
    <section class="hero">
        <h1>Play Sports. Make Friends. Build Companies.</h1>
        <p>
            Your AI knows you better than you know yourself. 
            Let it match you with the perfect recreational sports team 
            where you'll meet your future co-founders.
        </p>
        <button class="cta-button" onclick="startMatching()">
            Find My Perfect Team →
        </button>
    </section>
    
    <!-- How It Works -->
    <section class="how-it-works">
        <div class="container">
            <h2 class="section-title">How It Works</h2>
            <div class="steps">
                <div class="step">
                    <div class="step-icon">🤖</div>
                    <h3>AI Analyzes You</h3>
                    <p>Your AI agent already knows your schedule, interests, and personality from observing your digital life.</p>
                </div>
                <div class="step">
                    <div class="step-icon">🎯</div>
                    <h3>Perfect Matching</h3>
                    <p>We match you with teammates who complement your skills and share your business interests.</p>
                </div>
                <div class="step">
                    <div class="step-icon">🏐</div>
                    <h3>Play Together</h3>
                    <p>Join casual leagues for bocce, kickball, badminton and more. No pressure, just fun.</p>
                </div>
                <div class="step">
                    <div class="step-icon">🚀</div>
                    <h3>Build Together</h3>
                    <p>75% of our teams spawn friendships. 23% start businesses together. 100% have fun.</p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Available Leagues -->
    <section class="leagues">
        <div class="container">
            <h2 class="section-title">Leagues Starting Soon</h2>
            
            <div class="league-grid">
                <!-- Bocce Ball -->
                <div class="league-card" onclick="viewLeague('bocce')">
                    <div class="sport-emoji">🎯</div>
                    <h3 class="league-title">Sunset Bocce Ball</h3>
                    <div class="league-details">
                        Perfect for networking. Low impact, high conversation. 
                        Teams of 4, matched by business compatibility.
                    </div>
                    <div class="team-preview">
                        <h4>Your AI suggests this team:</h4>
                        <div class="compatibility-score">
                            <span>Chemistry: 92%</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: 92%;"></div>
                            </div>
                        </div>
                        <div class="compatibility-score">
                            <span>Startup Potential: 78%</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: 78%;"></div>
                            </div>
                        </div>
                        <div class="team-members">
                            <div class="member-avatar">👨‍💻</div>
                            <div class="member-avatar">👩‍🎨</div>
                            <div class="member-avatar">👨‍💼</div>
                            <div class="member-avatar">👩‍🔬</div>
                        </div>
                    </div>
                    <div class="league-meta">
                        <span>📍 Golden Gate Park</span>
                        <span>Thursdays 6pm</span>
                    </div>
                </div>
                
                <!-- Kickball -->
                <div class="league-card" onclick="viewLeague('kickball')">
                    <div class="sport-emoji">⚽</div>
                    <h3 class="league-title">Startup Kickball</h3>
                    <div class="league-details">
                        The classic adult league sport. Teams matched for both athletic 
                        balance and entrepreneurial synergy.
                    </div>
                    <div class="team-preview">
                        <h4>Potential teammates include:</h4>
                        <p style="font-size: 14px; color: #666;">
                            • ML Engineer from OpenAI<br>
                            • Product Designer from Figma<br>
                            • Marketing Lead (freelance)<br>
                            • Your complementary skills!
                        </p>
                    </div>
                    <div class="league-meta">
                        <span>📍 Mission Dolores</span>
                        <span>Saturdays 11am</span>
                    </div>
                </div>
                
                <!-- Badminton -->
                <div class="league-card" onclick="viewLeague('badminton')">
                    <div class="sport-emoji">🏸</div>
                    <h3 class="league-title">Executive Badminton</h3>
                    <div class="league-details">
                        Fast-paced but accessible. Popular with tech executives. 
                        Great for quick games and deeper conversations.
                    </div>
                    <div class="team-preview">
                        <h4>AI Insight:</h4>
                        <p style="font-size: 14px; color: #667eea;">
                            "Your interest in B2B SaaS aligns with 3 potential 
                            partners in this league. 87% friendship probability."
                        </p>
                    </div>
                    <div class="league-meta">
                        <span>📍 SOMA Rec Center</span>
                        <span>Tuesdays 7pm</span>
                    </div>
                </div>
                
                <!-- Wiffle Ball -->
                <div class="league-card" onclick="viewLeague('wiffle')">
                    <div class="sport-emoji">⚾</div>
                    <h3 class="league-title">Wiffle Ball Wednesdays</h3>
                    <div class="league-details">
                        Nostalgic fun with a competitive edge. Teams organized by 
                        complementary business skills and similar humor styles.
                    </div>
                    <div class="league-meta">
                        <span>📍 Presidio Fields</span>
                        <span>Wednesdays 6:30pm</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Success Stories -->
    <section class="success-stories">
        <div class="container">
            <h2 class="section-title">Real Connections, Real Companies</h2>
            
            <div class="story-grid">
                <div class="story-card">
                    <div class="story-quote">
                        "Met my co-founder at bocce league. Our AI agents knew we'd 
                        click before we did. Just raised our Series A!"
                    </div>
                    <div class="story-author">
                        <div class="author-avatar"></div>
                        <div class="author-info">
                            <h5>Sarah & Marcus</h5>
                            <p>Founded TechCo, met at bocce</p>
                        </div>
                    </div>
                </div>
                
                <div class="story-card">
                    <div class="story-quote">
                        "I'm an introvert but my AI knew I needed to network. 
                        Kickball was perfect - structured socializing that led to 
                        my best friendship."
                    </div>
                    <div class="story-author">
                        <div class="author-avatar"></div>
                        <div class="author-info">
                            <h5>David</h5>
                            <p>Software engineer, kickball captain</p>
                        </div>
                    </div>
                </div>
                
                <div class="story-card">
                    <div class="story-quote">
                        "Our badminton team became an AI startup. The matching 
                        algorithm knew we had complementary skills before we ever met."
                    </div>
                    <div class="story-author">
                        <div class="author-avatar"></div>
                        <div class="author-info">
                            <h5>Team ShuttleCode</h5>
                            <p>4 players, 1 startup, $2M funding</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- AI Assistant -->
    <div class="ai-assistant" onclick="toggleChat()">
        🤖
    </div>
    
    <div class="ai-chat" id="aiChat">
        <div class="chat-header">
            Your AI Sports Matchmaker
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="message">
                <div class="message-avatar"></div>
                <div class="message-content">
                    Hi! I've been analyzing your schedule and interests. 
                    I found 3 perfect leagues for you. Want to hear about them?
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function startMatching() {
            // Show AI analysis
            addMessage("ai", "Analyzing your profile... I see you're free Tuesday evenings and Saturday mornings.");
            setTimeout(() => {
                addMessage("ai", "Based on your interest in B2B SaaS and your moderate fitness level, I recommend Sunset Bocce or Executive Badminton.");
                setTimeout(() => {
                    addMessage("ai", "I've identified 12 potential co-founders across these leagues who share your interests. Should I show you the matches?");
                }, 1500);
            }, 1000);
            
            toggleChat();
        }
        
        function toggleChat() {
            const chat = document.getElementById('aiChat');
            chat.classList.toggle('active');
        }
        
        function addMessage(sender, text) {
            const messages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            messageDiv.innerHTML = `
                <div class="message-avatar"></div>
                <div class="message-content">${text}</div>
            `;
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function viewLeague(sport) {
            window.location.href = `/leagues/${sport}`;
        }
        
        // Simulate real-time updates
        setInterval(() => {
            const fills = document.querySelectorAll('.score-fill');
            fills.forEach(fill => {
                const currentWidth = parseFloat(fill.style.width);
                const change = (Math.random() - 0.5) * 5;
                const newWidth = Math.max(0, Math.min(100, currentWidth + change));
                fill.style.width = newWidth + '%';
            });
        }, 3000);
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    print("🏐 SOULFRA Rec Leagues")
    print("🤝 Where AI matches you with future friends & co-founders")
    print("🚀 Play sports, build startups")