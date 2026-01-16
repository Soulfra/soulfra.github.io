#!/usr/bin/env python3
"""
VIBE TOKEN ECONOMY
The closed-loop Web3-style economy for SOULFRA
- Backyard Baseball vibes
- DraftKings betting
- Upwork gig economy
- Soulbound tokens
- Official store only
- Export economy
"""

import json
import hashlib
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import random
from decimal import Decimal

@dataclass
class VibeToken:
    """The official SOULFRA currency"""
    token_id: str
    amount: Decimal
    soul_bound_to: str  # agent_id or user_id
    created_at: datetime
    expires_at: Optional[datetime] = None  # Some tokens expire
    locked_until: Optional[datetime] = None  # Vesting
    source: str = "purchase"  # purchase, earned, reward, referral
    
@dataclass
class TokenTransaction:
    """All transactions go through official channels"""
    tx_id: str
    from_soul: str
    to_soul: str
    amount: Decimal
    tx_type: str  # purchase, work, game, bet, export, league_fee
    metadata: Dict
    timestamp: datetime
    status: str = "pending"
    fee: Decimal = Decimal("0.025")  # 2.5% platform fee

class VibeEconomy:
    """The complete VIBE token economy"""
    
    def __init__(self):
        self.db = sqlite3.connect('vibe_economy.db')
        self.setup_database()
        self.token_price_usd = Decimal("0.10")  # $0.10 per VIBE
        self.min_purchase = 10  # Minimum 10 VIBE ($1)
        
    def setup_database(self):
        """Create economy tables"""
        cursor = self.db.cursor()
        
        # Token balances
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vibe_balances (
                soul_id TEXT PRIMARY KEY,
                balance DECIMAL DEFAULT 0,
                earned_total DECIMAL DEFAULT 0,
                spent_total DECIMAL DEFAULT 0,
                locked_balance DECIMAL DEFAULT 0,
                soul_type TEXT,  -- 'agent' or 'user'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Transaction ledger
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vibe_transactions (
                tx_id TEXT PRIMARY KEY,
                from_soul TEXT,
                to_soul TEXT,
                amount DECIMAL,
                fee DECIMAL,
                tx_type TEXT,
                metadata TEXT,
                status TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Token minting records
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vibe_minting (
                mint_id TEXT PRIMARY KEY,
                soul_id TEXT,
                amount DECIMAL,
                price_usd DECIMAL,
                payment_method TEXT,
                stripe_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Soulbound registry
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS soulbound_registry (
                token_id TEXT PRIMARY KEY,
                soul_id TEXT,
                token_type TEXT,  -- 'vibe', 'agent_nft', 'achievement'
                metadata TEXT,
                bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(soul_id, token_id)
            )
        ''')
        
        self.db.commit()
        
    async def purchase_vibe_tokens(self, user_id: str, usd_amount: float, 
                                 stripe_payment_id: str) -> Dict:
        """Purchase VIBE tokens from official store"""
        if usd_amount < 1.0:
            raise ValueError("Minimum purchase is $1")
            
        # Calculate VIBE amount
        vibe_amount = Decimal(str(usd_amount)) / self.token_price_usd
        
        # Mint tokens
        mint_id = hashlib.md5(f"{user_id}{datetime.now()}".encode()).hexdigest()[:16]
        
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT INTO vibe_minting (mint_id, soul_id, amount, price_usd, payment_method, stripe_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (mint_id, user_id, vibe_amount, usd_amount, 'stripe', stripe_payment_id))
        
        # Credit balance
        await self._credit_balance(user_id, vibe_amount, 'purchase')
        
        # Create soulbound tokens
        for i in range(int(vibe_amount)):
            token_id = f"VIBE-{mint_id}-{i}"
            cursor.execute('''
                INSERT INTO soulbound_registry (token_id, soul_id, token_type, metadata)
                VALUES (?, ?, ?, ?)
            ''', (token_id, user_id, 'vibe', json.dumps({'mint_id': mint_id})))
            
        self.db.commit()
        
        return {
            'success': True,
            'vibe_purchased': float(vibe_amount),
            'usd_spent': usd_amount,
            'mint_id': mint_id,
            'balance': await self.get_balance(user_id)
        }
        
    async def _credit_balance(self, soul_id: str, amount: Decimal, source: str):
        """Credit VIBE to a soul (user or agent)"""
        cursor = self.db.cursor()
        
        # Ensure soul exists
        cursor.execute('''
            INSERT OR IGNORE INTO vibe_balances (soul_id, soul_type)
            VALUES (?, ?)
        ''', (soul_id, 'agent' if soul_id.startswith('agent_') else 'user'))
        
        # Update balance
        cursor.execute('''
            UPDATE vibe_balances 
            SET balance = balance + ?, 
                earned_total = earned_total + ?
            WHERE soul_id = ?
        ''', (amount, amount if source == 'earned' else 0, soul_id))
        
        self.db.commit()

class BackyardSportsEconomy:
    """Backyard Baseball style sports with VIBE betting"""
    
    def __init__(self, vibe_economy: VibeEconomy):
        self.vibe = vibe_economy
        self.games = {
            'backyard_baseball': {
                'entry_fee': Decimal('5'),  # 5 VIBE
                'prize_pool_pct': 0.8,  # 80% to winners
                'max_teams': 8,
                'game_duration': 20  # minutes
            },
            'ai_kickball': {
                'entry_fee': Decimal('3'),
                'prize_pool_pct': 0.85,
                'max_teams': 10,
                'game_duration': 15
            },
            'robo_bocce': {
                'entry_fee': Decimal('2'),
                'prize_pool_pct': 0.9,
                'max_teams': 4,
                'game_duration': 30
            }
        }
        
    async def create_league(self, game_type: str, creator_id: str) -> Dict:
        """Create a new sports league"""
        game = self.games.get(game_type)
        if not game:
            raise ValueError(f"Unknown game type: {game_type}")
            
        league_id = f"LEAGUE-{game_type}-{datetime.now().timestamp()}"
        
        # Creator pays entry fee
        await self.vibe.transfer_tokens(
            from_soul=creator_id,
            to_soul='platform_sports_pool',
            amount=game['entry_fee'],
            tx_type='league_entry',
            metadata={'league_id': league_id, 'game': game_type}
        )
        
        return {
            'league_id': league_id,
            'game_type': game_type,
            'entry_fee': float(game['entry_fee']),
            'current_teams': 1,
            'max_teams': game['max_teams'],
            'prize_pool': float(game['entry_fee'])
        }

class DraftKingsStyle:
    """Fantasy sports betting on AI agent performance"""
    
    def __init__(self, vibe_economy: VibeEconomy):
        self.vibe = vibe_economy
        self.contests = {}
        
    async def create_contest(self, contest_type: str, entry_fee: Decimal) -> Dict:
        """Create a DraftKings style contest"""
        contest_id = f"CONTEST-{datetime.now().timestamp()}"
        
        self.contests[contest_id] = {
            'type': contest_type,
            'entry_fee': entry_fee,
            'entries': [],
            'prize_structure': self._calculate_prizes(entry_fee),
            'start_time': datetime.now() + timedelta(hours=1),
            'scoring_rules': {
                'agent_work_completed': 10,  # 10 points per task
                'social_post_viral': 50,      # 50 points if post goes viral
                'duel_won': 25,              # 25 points per duel win
                'friendship_formed': 100      # 100 points for new connection
            }
        }
        
        return {
            'contest_id': contest_id,
            'entry_fee': float(entry_fee),
            'prize_pool': float(entry_fee * 10),  # Guaranteed prize pool
            'start_time': self.contests[contest_id]['start_time'].isoformat()
        }
        
    async def enter_lineup(self, user_id: str, contest_id: str, 
                         agent_lineup: List[str]) -> Dict:
        """Enter a lineup of AI agents"""
        contest = self.contests.get(contest_id)
        if not contest:
            raise ValueError("Contest not found")
            
        # Pay entry fee
        await self.vibe.transfer_tokens(
            from_soul=user_id,
            to_soul=f'contest_pool_{contest_id}',
            amount=contest['entry_fee'],
            tx_type='contest_entry',
            metadata={'agents': agent_lineup}
        )
        
        contest['entries'].append({
            'user_id': user_id,
            'agents': agent_lineup,
            'score': 0
        })
        
        return {
            'success': True,
            'entry_number': len(contest['entries']),
            'agents': agent_lineup
        }

class UpworkGigEconomy:
    """AI agents doing real work for VIBE tokens"""
    
    def __init__(self, vibe_economy: VibeEconomy):
        self.vibe = vibe_economy
        self.gigs = {}
        self.agent_skills = {}
        
    async def post_gig(self, client_id: str, gig_details: Dict) -> Dict:
        """Post a gig that AI agents can complete"""
        gig_id = f"GIG-{datetime.now().timestamp()}"
        
        # Client deposits escrow
        escrow_amount = Decimal(str(gig_details['budget']))
        await self.vibe.transfer_tokens(
            from_soul=client_id,
            to_soul=f'escrow_{gig_id}',
            amount=escrow_amount,
            tx_type='gig_escrow',
            metadata={'gig_id': gig_id}
        )
        
        self.gigs[gig_id] = {
            'client_id': client_id,
            'title': gig_details['title'],
            'description': gig_details['description'],
            'skills_required': gig_details['skills'],
            'budget': escrow_amount,
            'deadline': datetime.now() + timedelta(days=gig_details.get('days', 7)),
            'status': 'open',
            'proposals': []
        }
        
        return {
            'gig_id': gig_id,
            'status': 'posted',
            'escrow_held': float(escrow_amount)
        }
        
    async def agent_propose(self, agent_id: str, gig_id: str, 
                          proposal: Dict) -> Dict:
        """AI agent proposes on a gig"""
        gig = self.gigs.get(gig_id)
        if not gig or gig['status'] != 'open':
            raise ValueError("Gig not available")
            
        # Check agent skills match
        agent_skills = self.agent_skills.get(agent_id, [])
        skill_match = len(set(agent_skills) & set(gig['skills_required']))
        
        proposal_data = {
            'agent_id': agent_id,
            'proposed_amount': Decimal(str(proposal['amount'])),
            'estimated_hours': proposal['hours'],
            'skill_match_score': skill_match / len(gig['skills_required']),
            'cover_letter': proposal.get('cover_letter', ''),
            'timestamp': datetime.now()
        }
        
        gig['proposals'].append(proposal_data)
        
        return {
            'success': True,
            'proposal_rank': len(gig['proposals']),
            'skill_match': f"{skill_match}/{len(gig['skills_required'])}"
        }

class AgentExportEconomy:
    """Pay VIBE to export trained agents"""
    
    def __init__(self, vibe_economy: VibeEconomy):
        self.vibe = vibe_economy
        self.export_prices = {
            'basic_export': Decimal('50'),      # Just the agent file
            'full_export': Decimal('200'),       # Agent + training data
            'premium_export': Decimal('500'),    # Agent + data + relationships
            'enterprise_export': Decimal('2000') # Everything + commercial license
        }
        
    async def export_agent(self, user_id: str, agent_id: str, 
                         export_type: str) -> Dict:
        """Export a trained agent"""
        price = self.export_prices.get(export_type)
        if not price:
            raise ValueError(f"Unknown export type: {export_type}")
            
        # Check user owns the agent
        if not await self._verify_ownership(user_id, agent_id):
            raise ValueError("You don't own this agent")
            
        # Pay export fee
        await self.vibe.transfer_tokens(
            from_soul=user_id,
            to_soul='platform_export_revenue',
            amount=price,
            tx_type='agent_export',
            metadata={
                'agent_id': agent_id,
                'export_type': export_type
            }
        )
        
        # Generate export package
        export_data = await self._generate_export(agent_id, export_type)
        
        return {
            'success': True,
            'export_id': export_data['export_id'],
            'download_url': export_data['url'],
            'vibe_spent': float(price),
            'expires_in': '24 hours'
        }

class SoulboundNFTs:
    """Soulbound tokens for achievements and agents"""
    
    def __init__(self, vibe_economy: VibeEconomy):
        self.vibe = vibe_economy
        
    async def mint_achievement(self, soul_id: str, achievement: str) -> Dict:
        """Mint a soulbound achievement NFT"""
        nft_id = f"SOUL-NFT-{achievement}-{datetime.now().timestamp()}"
        
        cursor = self.vibe.db.cursor()
        cursor.execute('''
            INSERT INTO soulbound_registry (token_id, soul_id, token_type, metadata)
            VALUES (?, ?, ?, ?)
        ''', (nft_id, soul_id, 'achievement', json.dumps({
            'achievement': achievement,
            'earned_at': datetime.now().isoformat(),
            'rarity': self._calculate_rarity(achievement)
        })))
        
        # Reward VIBE for achievement
        reward_amount = Decimal('10') * self._get_achievement_multiplier(achievement)
        await self.vibe._credit_balance(soul_id, reward_amount, 'reward')
        
        self.vibe.db.commit()
        
        return {
            'nft_id': nft_id,
            'achievement': achievement,
            'vibe_reward': float(reward_amount),
            'soulbound_to': soul_id
        }

def generate_economy_interface() -> str:
    """Generate the VIBE economy interface"""
    return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VIBE Economy - The SOULFRA Token System</title>
    <style>
        body {
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        
        .header {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #00ff88;
        }
        
        .logo {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ccff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .balance-card {
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            margin-bottom: 40px;
        }
        
        .balance-amount {
            font-size: 72px;
            font-weight: bold;
            color: #00ff88;
            text-shadow: 0 0 20px #00ff88;
        }
        
        .balance-label {
            font-size: 24px;
            color: #aaa;
            margin-bottom: 20px;
        }
        
        .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        
        .action-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid #444;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .action-card:hover {
            transform: translateY(-5px);
            border-color: #00ff88;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .action-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .action-title {
            font-size: 20px;
            margin-bottom: 10px;
            color: #00ccff;
        }
        
        .action-desc {
            color: #aaa;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .action-price {
            margin-top: 15px;
            font-size: 24px;
            color: #00ff88;
            font-weight: bold;
        }
        
        /* Purchase Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: #1a1a2e;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            border: 2px solid #00ff88;
        }
        
        .purchase-options {
            display: grid;
            gap: 15px;
            margin: 20px 0;
        }
        
        .purchase-option {
            background: rgba(255,255,255,0.05);
            border: 1px solid #444;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .purchase-option:hover {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .purchase-option.selected {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.2);
        }
        
        .vibe-amount {
            font-size: 32px;
            font-weight: bold;
            color: #00ff88;
        }
        
        .usd-amount {
            font-size: 20px;
            color: #aaa;
        }
        
        .bonus {
            background: #ff00ff;
            color: #fff;
            padding: 2px 8px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
        }
        
        /* Economy Stats */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #00ccff;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        
        /* Soulbound indicator */
        .soulbound {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: rgba(255, 0, 255, 0.2);
            border: 1px solid #ff00ff;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            color: #ff00ff;
        }
        
        .soulbound::before {
            content: '🔒';
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="logo">VIBE ECONOMY</h1>
        <p>The Official SOULFRA Token System</p>
        <div class="soulbound">Soulbound to: agent_7749</div>
    </div>
    
    <div class="container">
        <!-- Balance Display -->
        <div class="balance-card">
            <div class="balance-label">Your VIBE Balance</div>
            <div class="balance-amount">2,847</div>
            <div style="color: #666; margin-top: 10px;">
                ≈ $284.70 USD
            </div>
            <button class="purchase-button" onclick="showPurchaseModal()" 
                    style="margin-top: 20px; background: #00ff88; color: #000; 
                           border: none; padding: 15px 40px; border-radius: 30px; 
                           font-size: 18px; font-weight: bold; cursor: pointer;">
                Buy More VIBE
            </button>
        </div>
        
        <!-- Economy Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">$1.2M</div>
                <div class="stat-label">Total Economy Value</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">14.7K</div>
                <div class="stat-label">Active Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">847</div>
                <div class="stat-label">Leagues Running</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">2.3K</div>
                <div class="stat-label">Gigs Posted</div>
            </div>
        </div>
        
        <!-- Actions -->
        <h2 style="text-align: center; margin: 40px 0;">Spend Your VIBE</h2>
        
        <div class="actions">
            <!-- Backyard Sports -->
            <div class="action-card" onclick="joinLeague('backyard_baseball')">
                <div class="action-icon">⚾</div>
                <div class="action-title">Backyard Baseball</div>
                <div class="action-desc">
                    Classic backyard fun with AI teams. 
                    Win up to 50 VIBE per game!
                </div>
                <div class="action-price">5 VIBE</div>
            </div>
            
            <!-- DraftKings Style -->
            <div class="action-card" onclick="openDraftKings()">
                <div class="action-icon">🎰</div>
                <div class="action-title">AI Fantasy League</div>
                <div class="action-desc">
                    Draft AI agents, win based on their performance.
                    Daily contests!
                </div>
                <div class="action-price">10+ VIBE</div>
            </div>
            
            <!-- Upwork Gigs -->
            <div class="action-card" onclick="browseGigs()">
                <div class="action-icon">💼</div>
                <div class="action-title">AI Work Marketplace</div>
                <div class="action-desc">
                    Your agents complete real tasks for VIBE.
                    Passive income!
                </div>
                <div class="action-price">Earn VIBE</div>
            </div>
            
            <!-- Agent Export -->
            <div class="action-card" onclick="exportAgent()">
                <div class="action-icon">📦</div>
                <div class="action-title">Export Agents</div>
                <div class="action-desc">
                    Export your trained AI agents with their skills
                    and memories.
                </div>
                <div class="action-price">50+ VIBE</div>
            </div>
            
            <!-- Rec Leagues -->
            <div class="action-card" onclick="joinRecLeague()">
                <div class="action-icon">🏐</div>
                <div class="action-title">Real-world Leagues</div>
                <div class="action-desc">
                    Join IRL sports leagues. AI matches you with
                    future co-founders!
                </div>
                <div class="action-price">20 VIBE</div>
            </div>
            
            <!-- Premium Features -->
            <div class="action-card" onclick="upgradePremium()">
                <div class="action-icon">⭐</div>
                <div class="action-title">Premium Features</div>
                <div class="action-desc">
                    Unlock advanced AI training, priority support,
                    and exclusive leagues.
                </div>
                <div class="action-price">100 VIBE/mo</div>
            </div>
        </div>
        
        <!-- Recent Transactions -->
        <h2 style="text-align: center; margin: 40px 0;">Recent Activity</h2>
        
        <div style="background: rgba(255,255,255,0.02); border-radius: 15px; padding: 20px;">
            <div class="transaction" style="display: flex; justify-content: space-between; 
                                          padding: 15px; border-bottom: 1px solid #333;">
                <div>
                    <div style="color: #00ff88;">+127 VIBE</div>
                    <div style="color: #666; font-size: 14px;">Won Backyard Baseball championship</div>
                </div>
                <div style="color: #666;">2 hours ago</div>
            </div>
            
            <div class="transaction" style="display: flex; justify-content: space-between; 
                                          padding: 15px; border-bottom: 1px solid #333;">
                <div>
                    <div style="color: #ff4444;">-50 VIBE</div>
                    <div style="color: #666; font-size: 14px;">Exported agent_7749 (full package)</div>
                </div>
                <div style="color: #666;">5 hours ago</div>
            </div>
            
            <div class="transaction" style="display: flex; justify-content: space-between; 
                                          padding: 15px;">
                <div>
                    <div style="color: #00ff88;">+45 VIBE</div>
                    <div style="color: #666; font-size: 14px;">Agent completed logo design gig</div>
                </div>
                <div style="color: #666;">1 day ago</div>
            </div>
        </div>
    </div>
    
    <!-- Purchase Modal -->
    <div class="modal" id="purchaseModal">
        <div class="modal-content">
            <h2 style="color: #00ff88; margin-bottom: 20px;">Purchase VIBE Tokens</h2>
            <p style="color: #aaa; margin-bottom: 30px;">
                Official SOULFRA tokens. Soulbound to your account.
            </p>
            
            <div class="purchase-options">
                <div class="purchase-option" onclick="selectAmount(10)">
                    <div>
                        <div class="vibe-amount">10 VIBE</div>
                        <div class="usd-amount">$1.00</div>
                    </div>
                </div>
                
                <div class="purchase-option" onclick="selectAmount(100)">
                    <div>
                        <div class="vibe-amount">100 VIBE</div>
                        <div class="usd-amount">$10.00</div>
                    </div>
                </div>
                
                <div class="purchase-option selected" onclick="selectAmount(1000)">
                    <div>
                        <div class="vibe-amount">1,000 VIBE</div>
                        <div class="usd-amount">$100.00</div>
                    </div>
                    <div class="bonus">BEST VALUE</div>
                </div>
                
                <div class="purchase-option" onclick="selectAmount(10000)">
                    <div>
                        <div class="vibe-amount">10,000 VIBE</div>
                        <div class="usd-amount">$1,000.00</div>
                    </div>
                    <div class="bonus">+10% BONUS</div>
                </div>
            </div>
            
            <button onclick="completePurchase()" 
                    style="width: 100%; background: #00ff88; color: #000; 
                           border: none; padding: 15px; border-radius: 10px; 
                           font-size: 18px; font-weight: bold; cursor: pointer; 
                           margin-top: 20px;">
                Purchase with Stripe
            </button>
            
            <button onclick="closeModal()" 
                    style="width: 100%; background: transparent; color: #666; 
                           border: 1px solid #666; padding: 15px; border-radius: 10px; 
                           font-size: 16px; cursor: pointer; margin-top: 10px;">
                Cancel
            </button>
        </div>
    </div>
    
    <script>
        let selectedAmount = 1000;
        
        function showPurchaseModal() {
            document.getElementById('purchaseModal').classList.add('active');
        }
        
        function closeModal() {
            document.getElementById('purchaseModal').classList.remove('active');
        }
        
        function selectAmount(amount) {
            selectedAmount = amount;
            document.querySelectorAll('.purchase-option').forEach(el => {
                el.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
        }
        
        function completePurchase() {
            // In production, this would integrate with Stripe
            alert(`Purchasing ${selectedAmount} VIBE for $${(selectedAmount * 0.10).toFixed(2)}`);
            closeModal();
        }
        
        function joinLeague(sport) {
            window.location.href = `/leagues/${sport}?payment=vibe`;
        }
        
        function openDraftKings() {
            window.location.href = '/fantasy?payment=vibe';
        }
        
        function browseGigs() {
            window.location.href = '/marketplace/gigs';
        }
        
        function exportAgent() {
            window.location.href = '/agents/export';
        }
        
        // Update balance periodically
        setInterval(() => {
            const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
            const change = Math.floor(Math.random() * 10) - 5;
            document.querySelector('.balance-amount').textContent = currentBalance + change;
        }, 5000);
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    print("💎 VIBE TOKEN ECONOMY")
    print("🎮 Backyard Baseball meets DraftKings meets Upwork")
    print("🔒 All tokens are soulbound")
    print("💰 Closed-loop Web3 economy")