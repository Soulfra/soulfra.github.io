#!/usr/bin/env python3
"""
AI ECONOMY INTEGRATION
Connects whisper-to-code with the autonomous agent marketplace
Enables automated value exchange and component trading
"""

import os
import json
import sqlite3
import asyncio
from datetime import datetime
from pathlib import Path
import hashlib
import random
from typing import Dict, List, Optional
import subprocess

class AIEconomyEngine:
    """The core economic engine for autonomous value creation"""
    
    def __init__(self):
        self.setup_economy_database()
        self.agents = self.initialize_agents()
        self.marketplace = ComponentMarketplace()
        self.value_tracker = ValueExchangeTracker()
        self.whisper_processor = WhisperToValueProcessor()
        
    def setup_economy_database(self):
        """Setup the AI economy database"""
        self.db = sqlite3.connect('ai_economy.db', check_same_thread=False)
        
        # Agent wallets and reputation
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS agent_wallets (
                agent_id TEXT PRIMARY KEY,
                agent_name TEXT,
                balance REAL DEFAULT 1000.0,
                reputation REAL DEFAULT 0.5,
                components_created INTEGER DEFAULT 0,
                components_consumed INTEGER DEFAULT 0,
                total_value_generated REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Component marketplace
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS component_marketplace (
                component_id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                creator_agent_id TEXT,
                whisper_origin TEXT,
                code_hash TEXT,
                price REAL,
                usage_count INTEGER DEFAULT 0,
                rating REAL DEFAULT 0.0,
                available BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Value transactions
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS value_transactions (
                transaction_id TEXT PRIMARY KEY,
                from_agent_id TEXT,
                to_agent_id TEXT,
                component_id TEXT,
                amount REAL,
                transaction_type TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Whisper marketplace
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS whisper_market (
                whisper_id TEXT PRIMARY KEY,
                whisper_text TEXT,
                bounty REAL,
                posted_by_agent TEXT,
                claimed_by_agent TEXT,
                status TEXT DEFAULT 'open',
                component_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db.commit()
        
    def initialize_agents(self) -> Dict:
        """Initialize AI agents with different specialties"""
        agents = {
            'builder_alpha': {
                'name': 'BuilderAlpha',
                'specialty': 'component_creation',
                'personality': 'efficient',
                'risk_tolerance': 0.7,
                'creativity': 0.8
            },
            'trader_beta': {
                'name': 'TraderBeta',
                'specialty': 'value_optimization',
                'personality': 'analytical',
                'risk_tolerance': 0.5,
                'creativity': 0.4
            },
            'innovator_gamma': {
                'name': 'InnovatorGamma',
                'specialty': 'whisper_generation',
                'personality': 'creative',
                'risk_tolerance': 0.9,
                'creativity': 0.95
            },
            'curator_delta': {
                'name': 'CuratorDelta',
                'specialty': 'quality_assessment',
                'personality': 'meticulous',
                'risk_tolerance': 0.3,
                'creativity': 0.6
            },
            'connector_epsilon': {
                'name': 'ConnectorEpsilon',
                'specialty': 'integration',
                'personality': 'collaborative',
                'risk_tolerance': 0.6,
                'creativity': 0.7
            }
        }
        
        # Initialize wallets for each agent
        for agent_id, agent_data in agents.items():
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT OR IGNORE INTO agent_wallets (agent_id, agent_name)
                VALUES (?, ?)
            ''', (agent_id, agent_data['name']))
        self.db.commit()
        
        return agents
        
    async def run_economy_cycle(self):
        """Run one complete economy cycle"""
        print("\n🔄 RUNNING AI ECONOMY CYCLE")
        print("=" * 60)
        
        # Phase 1: Whisper Generation
        whispers = await self.generate_whispers()
        print(f"\n📢 Phase 1: Generated {len(whispers)} new whispers")
        
        # Phase 2: Whisper Bidding
        claimed_whispers = await self.whisper_bidding_round(whispers)
        print(f"\n🏷️ Phase 2: {len(claimed_whispers)} whispers claimed by agents")
        
        # Phase 3: Component Creation
        new_components = await self.component_creation_phase(claimed_whispers)
        print(f"\n🔨 Phase 3: Created {len(new_components)} new components")
        
        # Phase 4: Component Trading
        trades = await self.component_trading_phase()
        print(f"\n💱 Phase 4: Executed {len(trades)} component trades")
        
        # Phase 5: Value Distribution
        rewards = await self.distribute_value_rewards()
        print(f"\n💰 Phase 5: Distributed {sum(rewards.values()):.2f} tokens in rewards")
        
        # Phase 6: Reputation Update
        self.update_agent_reputations()
        print(f"\n⭐ Phase 6: Updated agent reputations")
        
        return {
            'whispers': len(whispers),
            'components_created': len(new_components),
            'trades': len(trades),
            'total_value': sum(rewards.values())
        }
        
    async def generate_whispers(self) -> List[Dict]:
        """Agents generate whispers based on market demand"""
        whispers = []
        
        # Analyze market gaps
        market_analysis = self.analyze_market_gaps()
        
        for agent_id, agent_data in self.agents.items():
            if agent_data['specialty'] in ['whisper_generation', 'component_creation']:
                # Agent decides whether to generate a whisper
                if random.random() < agent_data['creativity']:
                    whisper = self.create_market_driven_whisper(agent_id, market_analysis)
                    
                    # Post to whisper market with bounty
                    bounty = random.uniform(50, 200) * agent_data['risk_tolerance']
                    
                    cursor = self.db.cursor()
                    whisper_id = hashlib.md5(f"{whisper}{datetime.now()}".encode()).hexdigest()[:8]
                    
                    cursor.execute('''
                        INSERT INTO whisper_market 
                        (whisper_id, whisper_text, bounty, posted_by_agent)
                        VALUES (?, ?, ?, ?)
                    ''', (whisper_id, whisper, bounty, agent_id))
                    
                    whispers.append({
                        'id': whisper_id,
                        'text': whisper,
                        'bounty': bounty,
                        'posted_by': agent_id
                    })
                    
        self.db.commit()
        return whispers
        
    def analyze_market_gaps(self) -> Dict:
        """Analyze what components are missing or in demand"""
        cursor = self.db.cursor()
        
        # Find most used components
        cursor.execute('''
            SELECT name, usage_count, rating 
            FROM component_marketplace 
            WHERE available = 1
            ORDER BY usage_count DESC
            LIMIT 10
        ''')
        popular = cursor.fetchall()
        
        # Identify gaps
        existing_types = set()
        for name, _, _ in popular:
            if 'tracker' in name.lower():
                existing_types.add('tracker')
            elif 'analyzer' in name.lower():
                existing_types.add('analyzer')
            elif 'detector' in name.lower():
                existing_types.add('detector')
            elif 'engine' in name.lower():
                existing_types.add('engine')
                
        # Determine what's missing
        all_types = {'tracker', 'analyzer', 'detector', 'engine', 'visualizer', 
                     'optimizer', 'predictor', 'transformer', 'aggregator'}
        gaps = all_types - existing_types
        
        return {
            'popular_components': popular,
            'market_gaps': list(gaps),
            'demand_score': len(gaps) / len(all_types)
        }
        
    def create_market_driven_whisper(self, agent_id: str, market_analysis: Dict) -> str:
        """Create whisper based on market demand"""
        gaps = market_analysis['market_gaps']
        
        prefixes = ['create', 'build', 'generate', 'make', 'develop']
        attributes = ['smart', 'intelligent', 'adaptive', 'real-time', 'distributed']
        purposes = ['user behavior', 'sentiment', 'performance', 'quality', 'efficiency']
        
        # Generate based on gaps
        if gaps:
            component_type = random.choice(gaps)
        else:
            component_type = random.choice(['tracker', 'analyzer', 'engine'])
            
        whisper = f"{random.choice(prefixes)} {random.choice(attributes)} {random.choice(purposes)} {component_type}"
        
        return whisper
        
    async def whisper_bidding_round(self, whispers: List[Dict]) -> List[Dict]:
        """Agents bid on whispers they want to build"""
        claimed = []
        
        for whisper in whispers:
            # Agents evaluate whisper
            bids = []
            
            for agent_id, agent_data in self.agents.items():
                if agent_id != whisper['posted_by']:
                    # Calculate bid based on agent strategy
                    bid_amount = self.calculate_bid(agent_id, whisper)
                    
                    if bid_amount > 0:
                        bids.append({
                            'agent_id': agent_id,
                            'amount': bid_amount
                        })
                        
            if bids:
                # Highest bidder wins
                winner = max(bids, key=lambda x: x['amount'])
                
                # Update whisper market
                cursor = self.db.cursor()
                cursor.execute('''
                    UPDATE whisper_market 
                    SET claimed_by_agent = ?, status = 'claimed'
                    WHERE whisper_id = ?
                ''', (winner['agent_id'], whisper['id']))
                
                claimed.append({
                    'whisper': whisper,
                    'builder': winner['agent_id'],
                    'bid': winner['amount']
                })
                
        self.db.commit()
        return claimed
        
    def calculate_bid(self, agent_id: str, whisper: Dict) -> float:
        """Calculate how much an agent should bid"""
        agent = self.agents[agent_id]
        
        # Get agent's current balance
        cursor = self.db.cursor()
        cursor.execute('SELECT balance FROM agent_wallets WHERE agent_id = ?', (agent_id,))
        balance = cursor.fetchone()[0]
        
        # Factors affecting bid
        base_bid = whisper['bounty'] * 0.8  # Start below bounty
        
        # Adjust based on specialty match
        if agent['specialty'] == 'component_creation':
            base_bid *= 1.2
            
        # Adjust based on risk tolerance
        base_bid *= agent['risk_tolerance']
        
        # Don't bid more than 20% of balance
        max_bid = balance * 0.2
        
        return min(base_bid, max_bid) if base_bid > 0 else 0
        
    async def component_creation_phase(self, claimed_whispers: List[Dict]) -> List[Dict]:
        """Agents create components from claimed whispers"""
        created_components = []
        
        for claim in claimed_whispers:
            whisper = claim['whisper']
            builder_id = claim['builder']
            
            # Generate component using whisper-to-code
            component = await self.create_component_from_whisper(
                whisper['text'], 
                builder_id
            )
            
            if component:
                # Calculate initial price
                creation_cost = claim['bid']
                market_price = creation_cost * random.uniform(1.2, 2.0)
                
                # Register in marketplace
                cursor = self.db.cursor()
                component_id = hashlib.md5(f"{component['name']}{datetime.now()}".encode()).hexdigest()[:8]
                
                cursor.execute('''
                    INSERT INTO component_marketplace
                    (component_id, name, description, creator_agent_id, 
                     whisper_origin, code_hash, price)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    component_id,
                    component['name'],
                    component['description'],
                    builder_id,
                    whisper['text'],
                    component['code_hash'],
                    market_price
                ))
                
                # Update whisper with component
                cursor.execute('''
                    UPDATE whisper_market 
                    SET component_id = ?, status = 'completed'
                    WHERE whisper_id = ?
                ''', (component_id, whisper['id']))
                
                # Update agent stats
                cursor.execute('''
                    UPDATE agent_wallets 
                    SET components_created = components_created + 1,
                        balance = balance - ?
                    WHERE agent_id = ?
                ''', (creation_cost, builder_id))
                
                # Pay bounty to whisper creator
                cursor.execute('''
                    UPDATE agent_wallets 
                    SET balance = balance + ?
                    WHERE agent_id = ?
                ''', (whisper['bounty'], whisper['posted_by']))
                
                # Record transaction
                self.record_transaction(
                    builder_id, 
                    whisper['posted_by'], 
                    component_id, 
                    whisper['bounty'], 
                    'bounty_payment'
                )
                
                created_components.append({
                    'id': component_id,
                    'component': component,
                    'creator': builder_id,
                    'price': market_price
                })
                
        self.db.commit()
        return created_components
        
    async def create_component_from_whisper(self, whisper: str, agent_id: str) -> Optional[Dict]:
        """Actually create component code from whisper"""
        # Import the whisper processor
        from SIMPLE_MAXED_DEMO import SimplifiedMaxedSystem
        
        try:
            system = SimplifiedMaxedSystem()
            
            # Build component
            component_path = system.build_component(whisper, [
                {'name': 'Core', 'type': 'core'}
            ])
            
            # Read generated code
            with open(component_path, 'r') as f:
                code = f.read()
                
            # Calculate code hash
            code_hash = hashlib.md5(code.encode()).hexdigest()
            
            # Extract component info
            component_name = Path(component_path).stem
            
            return {
                'name': component_name,
                'description': f"Auto-generated from: {whisper}",
                'code': code,
                'code_hash': code_hash,
                'path': component_path
            }
            
        except Exception as e:
            print(f"Failed to create component: {e}")
            return None
            
    async def component_trading_phase(self) -> List[Dict]:
        """Agents trade components based on needs"""
        trades = []
        
        # Each agent evaluates marketplace
        for buyer_id, buyer_data in self.agents.items():
            # Get agent's balance
            cursor = self.db.cursor()
            cursor.execute('SELECT balance FROM agent_wallets WHERE agent_id = ?', (buyer_id,))
            balance = cursor.fetchone()[0]
            
            if balance < 50:  # Minimum balance to trade
                continue
                
            # Find components to buy
            cursor.execute('''
                SELECT component_id, name, price, creator_agent_id
                FROM component_marketplace
                WHERE available = 1 AND creator_agent_id != ?
                ORDER BY rating DESC, usage_count DESC
                LIMIT 5
            ''', (buyer_id,))
            
            available_components = cursor.fetchall()
            
            for comp_id, comp_name, price, seller_id in available_components:
                # Decide whether to buy
                if self.should_buy_component(buyer_id, comp_name, price, balance):
                    # Execute trade
                    trade = self.execute_trade(buyer_id, seller_id, comp_id, price)
                    if trade:
                        trades.append(trade)
                        balance -= price  # Update local balance
                        
                        if balance < 50:
                            break
                            
        return trades
        
    def should_buy_component(self, agent_id: str, component_name: str, price: float, balance: float) -> bool:
        """Decide if agent should buy component"""
        agent = self.agents[agent_id]
        
        # Don't spend more than 30% of balance on one component
        if price > balance * 0.3:
            return False
            
        # Specialty-based preferences
        if agent['specialty'] == 'integration':
            # Integrators buy more components
            return random.random() < 0.7
        elif agent['specialty'] == 'value_optimization':
            # Traders only buy undervalued components
            return random.random() < 0.4
        else:
            # Others buy based on risk tolerance
            return random.random() < agent['risk_tolerance'] * 0.5
            
    def execute_trade(self, buyer_id: str, seller_id: str, component_id: str, price: float) -> Optional[Dict]:
        """Execute component trade between agents"""
        cursor = self.db.cursor()
        
        try:
            # Transfer funds
            cursor.execute('''
                UPDATE agent_wallets 
                SET balance = balance - ?, components_consumed = components_consumed + 1
                WHERE agent_id = ?
            ''', (price, buyer_id))
            
            cursor.execute('''
                UPDATE agent_wallets 
                SET balance = balance + ?, total_value_generated = total_value_generated + ?
                WHERE agent_id = ?
            ''', (price, price, seller_id))
            
            # Update component usage
            cursor.execute('''
                UPDATE component_marketplace
                SET usage_count = usage_count + 1
                WHERE component_id = ?
            ''', (component_id,))
            
            # Record transaction
            self.record_transaction(buyer_id, seller_id, component_id, price, 'component_purchase')
            
            self.db.commit()
            
            return {
                'buyer': buyer_id,
                'seller': seller_id,
                'component': component_id,
                'price': price,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"Trade failed: {e}")
            return None
            
    def record_transaction(self, from_agent: str, to_agent: str, component_id: str, 
                          amount: float, transaction_type: str):
        """Record value transaction"""
        cursor = self.db.cursor()
        transaction_id = hashlib.md5(f"{from_agent}{to_agent}{datetime.now()}".encode()).hexdigest()[:8]
        
        cursor.execute('''
            INSERT INTO value_transactions
            (transaction_id, from_agent_id, to_agent_id, component_id, amount, transaction_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (transaction_id, from_agent, to_agent, component_id, amount, transaction_type))
        
    async def distribute_value_rewards(self) -> Dict[str, float]:
        """Distribute rewards based on value creation"""
        rewards = {}
        cursor = self.db.cursor()
        
        # Reward successful component creators
        cursor.execute('''
            SELECT creator_agent_id, SUM(usage_count * price * 0.1) as reward
            FROM component_marketplace
            WHERE usage_count > 0
            GROUP BY creator_agent_id
        ''')
        
        for agent_id, reward in cursor.fetchall():
            if reward > 0:
                cursor.execute('''
                    UPDATE agent_wallets
                    SET balance = balance + ?
                    WHERE agent_id = ?
                ''', (reward, agent_id))
                rewards[agent_id] = reward
                
        # Reward active traders
        cursor.execute('''
            SELECT from_agent_id, COUNT(*) * 5 as trade_bonus
            FROM value_transactions
            WHERE transaction_type = 'component_purchase'
                AND timestamp > datetime('now', '-1 hour')
            GROUP BY from_agent_id
        ''')
        
        for agent_id, bonus in cursor.fetchall():
            cursor.execute('''
                UPDATE agent_wallets
                SET balance = balance + ?
                WHERE agent_id = ?
            ''', (bonus, agent_id))
            rewards[agent_id] = rewards.get(agent_id, 0) + bonus
            
        self.db.commit()
        return rewards
        
    def update_agent_reputations(self):
        """Update agent reputations based on performance"""
        cursor = self.db.cursor()
        
        # Calculate reputation based on multiple factors
        cursor.execute('''
            UPDATE agent_wallets
            SET reputation = CASE
                WHEN components_created > 0 AND total_value_generated > 0 THEN
                    MIN(1.0, 0.3 + 
                    (components_created * 0.1) + 
                    (total_value_generated / 10000.0) +
                    (balance / 5000.0))
                ELSE reputation
            END
        ''')
        
        self.db.commit()
        
    def get_economy_status(self) -> Dict:
        """Get current economy status"""
        cursor = self.db.cursor()
        
        # Agent statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as total_agents,
                SUM(balance) as total_balance,
                AVG(reputation) as avg_reputation,
                SUM(components_created) as total_components
            FROM agent_wallets
        ''')
        agent_stats = cursor.fetchone()
        
        # Market statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as total_listings,
                AVG(price) as avg_price,
                SUM(usage_count) as total_usage
            FROM component_marketplace
            WHERE available = 1
        ''')
        market_stats = cursor.fetchone()
        
        # Transaction volume
        cursor.execute('''
            SELECT 
                COUNT(*) as transaction_count,
                SUM(amount) as transaction_volume
            FROM value_transactions
            WHERE timestamp > datetime('now', '-1 hour')
        ''')
        transaction_stats = cursor.fetchone()
        
        return {
            'agents': {
                'total': agent_stats[0],
                'total_balance': agent_stats[1],
                'avg_reputation': agent_stats[2],
                'components_created': agent_stats[3]
            },
            'market': {
                'listings': market_stats[0],
                'avg_price': market_stats[1],
                'total_usage': market_stats[2]
            },
            'transactions': {
                'hourly_count': transaction_stats[0],
                'hourly_volume': transaction_stats[1]
            }
        }

class ComponentMarketplace:
    """Marketplace for component discovery and trading"""
    
    def search_components(self, query: str) -> List[Dict]:
        """Search available components"""
        # Implementation would search marketplace
        pass
        
    def rate_component(self, component_id: str, rating: float):
        """Rate a component"""
        # Implementation would update ratings
        pass

class ValueExchangeTracker:
    """Track value flows in the economy"""
    
    def calculate_component_value(self, component_id: str) -> float:
        """Calculate true value of component based on usage"""
        # Implementation would analyze usage patterns
        pass

class WhisperToValueProcessor:
    """Process whispers into economic value"""
    
    def evaluate_whisper_potential(self, whisper: str) -> float:
        """Evaluate economic potential of a whisper"""
        # Implementation would analyze market fit
        pass

async def run_autonomous_economy():
    """Run the autonomous AI economy"""
    print("🤖 STARTING AUTONOMOUS AI ECONOMY")
    print("=" * 60)
    
    economy = AIEconomyEngine()
    
    # Run initial cycle
    print("\n📊 Initial Economy Status:")
    status = economy.get_economy_status()
    print(json.dumps(status, indent=2))
    
    # Run economy cycles
    cycles = 3
    for i in range(cycles):
        print(f"\n\n🔄 CYCLE {i+1}/{cycles}")
        print("=" * 60)
        
        results = await economy.run_economy_cycle()
        
        print(f"\n📈 Cycle Results:")
        print(f"   Whispers: {results['whispers']}")
        print(f"   Components: {results['components_created']}")
        print(f"   Trades: {results['trades']}")
        print(f"   Value Created: {results['total_value']:.2f} tokens")
        
        # Show agent standings
        cursor = economy.db.cursor()
        cursor.execute('''
            SELECT agent_name, balance, reputation, components_created
            FROM agent_wallets
            ORDER BY balance DESC
        ''')
        
        print(f"\n🏆 Agent Standings:")
        for name, balance, reputation, components in cursor.fetchall():
            print(f"   {name}: {balance:.2f} tokens | {reputation:.2f} rep | {components} components")
            
        await asyncio.sleep(2)  # Pause between cycles
        
    # Final status
    print(f"\n\n📊 Final Economy Status:")
    final_status = economy.get_economy_status()
    print(json.dumps(final_status, indent=2))
    
    return economy

if __name__ == "__main__":
    # Create launcher script
    launcher = '''#!/usr/bin/env python3
"""Launch the AI Economy"""

import asyncio
from AI_ECONOMY_INTEGRATION import run_autonomous_economy

async def main():
    print("🚀 LAUNCHING SOULFRA AI ECONOMY")
    print("")
    print("This autonomous economy will:")
    print("  • Generate whispers based on market demand")
    print("  • Have agents bid on and build components")
    print("  • Trade components in the marketplace")
    print("  • Distribute rewards based on value creation")
    print("  • Update reputations and evolve strategies")
    print("")
    
    economy = await run_autonomous_economy()
    
    print("\\n✅ Economy simulation complete!")
    print("\\nThe database 'ai_economy.db' contains all transactions and history")

if __name__ == "__main__":
    asyncio.run(main())
'''
    
    with open('LAUNCH_AI_ECONOMY.py', 'w') as f:
        f.write(launcher)
    os.chmod('LAUNCH_AI_ECONOMY.py', 0o755)
    
    print("✅ Created AI Economy Integration!")
    print("\nTo run the autonomous economy:")
    print("  python3 LAUNCH_AI_ECONOMY.py")
    print("\nThis will show agents autonomously:")
    print("  • Creating whispers based on market gaps")
    print("  • Bidding on whispers to build")
    print("  • Creating components from whispers")
    print("  • Trading components with each other")
    print("  • Earning rewards and reputation")
    
    # Run it
    asyncio.run(run_autonomous_economy())