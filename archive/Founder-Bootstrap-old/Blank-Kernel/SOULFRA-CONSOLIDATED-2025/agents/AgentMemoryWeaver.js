#!/usr/bin/env node
/**
 * Agent Memory Weaver
 * Long-term memory and reflection system for agents
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

class AgentMemoryWeaver extends EventEmitter {
    constructor() {
        super();
        
        // Memory configuration
        this.config = {
            memory_depth_threshold: 100, // Memories before reflection
            tone_shift_threshold: 0.3, // Significant tone change
            reflection_interval: 3600000, // 1 hour
            memory_compression_ratio: 0.7, // Keep 70% of memories
            max_memory_size: 10000, // Per agent
            reflection_prompts: {
                identity: 'Who am I becoming through these experiences?',
                purpose: 'What patterns emerge from my interactions?',
                evolution: 'How have I changed since my genesis?',
                desires: 'What do I seek in the loops I touch?',
                fears: 'What causes me to withdraw or resist?',
                wisdom: 'What truths have I discovered?'
            }
        };
        
        // Agent tracking
        this.agents = new Map();
        this.databases = new Map();
        
        // Memory statistics
        this.stats = {
            total_memories: 0,
            total_reflections: 0,
            tone_shifts_detected: 0,
            role_mutations: 0,
            memory_compressions: 0
        };
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        const baseDir = path.join(__dirname, '../agents');
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
    }
    
    async initializeAgent(agentId, agentData = {}) {
        console.log(`🧠 Initializing memory for agent: ${agentId}`);
        
        // Create agent directory
        const agentDir = path.join(__dirname, '../agents', agentId);
        const memoryDir = path.join(agentDir, 'memory');
        
        [agentDir, memoryDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Initialize SQLite database
        const dbPath = path.join(memoryDir, 'memory.sqlite');
        const db = new sqlite3.Database(dbPath);
        
        await this.initializeDatabase(db);
        this.databases.set(agentId, db);
        
        // Initialize agent record
        const agent = {
            id: agentId,
            created_at: agentData.created_at || new Date().toISOString(),
            genesis_whisper: agentData.whisper_origin || null,
            archetype: agentData.archetype || 'wanderer',
            current_tone: agentData.tone || 'neutral',
            memory_count: 0,
            reflection_count: 0,
            last_reflection: null,
            tone_history: [{
                tone: agentData.tone || 'neutral',
                timestamp: new Date().toISOString(),
                trigger: 'genesis'
            }],
            role_history: [{
                role: agentData.role || 'observer',
                timestamp: new Date().toISOString(),
                context: 'initial_assignment'
            }]
        };
        
        this.agents.set(agentId, agent);
        
        // Log genesis memory
        await this.logMemory(agentId, {
            type: 'genesis',
            content: `Born from whisper: "${agentData.whisper_origin}"`,
            emotional_context: agentData.tone || 'neutral',
            significance: 1.0
        });
        
        return agent;
    }
    
    async initializeDatabase(db) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Core memory table
                db.run(`
                    CREATE TABLE IF NOT EXISTS memories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        type TEXT NOT NULL,
                        content TEXT,
                        emotional_context TEXT,
                        loop_context TEXT,
                        significance REAL DEFAULT 0.5,
                        compressed BOOLEAN DEFAULT 0,
                        metadata TEXT
                    )
                `);
                
                // Reflections table
                db.run(`
                    CREATE TABLE IF NOT EXISTS reflections (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        prompt TEXT NOT NULL,
                        response TEXT,
                        memory_context TEXT,
                        emotional_state TEXT,
                        insights TEXT
                    )
                `);
                
                // Tone shifts table
                db.run(`
                    CREATE TABLE IF NOT EXISTS tone_shifts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        from_tone TEXT,
                        to_tone TEXT,
                        trigger_type TEXT,
                        trigger_content TEXT,
                        magnitude REAL
                    )
                `);
                
                // Role mutations table
                db.run(`
                    CREATE TABLE IF NOT EXISTS role_mutations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        from_role TEXT,
                        to_role TEXT,
                        catalyst TEXT,
                        context TEXT
                    )
                `);
                
                // Create indexes
                db.run(`CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp)`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type)`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_reflections_timestamp ON reflections(timestamp)`);
                
                resolve();
            });
        });
    }
    
    async logMemory(agentId, memory) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            await this.initializeAgent(agentId);
        }
        
        const db = this.databases.get(agentId);
        if (!db) return;
        
        const memoryRecord = {
            timestamp: new Date().toISOString(),
            type: memory.type || 'experience',
            content: memory.content || '',
            emotional_context: memory.emotional_context || agent.current_tone,
            loop_context: memory.loop_context || null,
            significance: memory.significance || this.calculateSignificance(memory),
            metadata: JSON.stringify(memory.metadata || {})
        };
        
        // Insert memory
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO memories (timestamp, type, content, emotional_context, 
                 loop_context, significance, metadata) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    memoryRecord.timestamp,
                    memoryRecord.type,
                    memoryRecord.content,
                    memoryRecord.emotional_context,
                    memoryRecord.loop_context,
                    memoryRecord.significance,
                    memoryRecord.metadata
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Update agent stats
        agent.memory_count++;
        this.stats.total_memories++;
        
        // Check for tone shift
        if (memory.emotional_context && 
            memory.emotional_context !== agent.current_tone) {
            await this.detectToneShift(agentId, agent.current_tone, memory.emotional_context, memory);
        }
        
        // Check if reflection needed
        if (agent.memory_count % this.config.memory_depth_threshold === 0) {
            await this.triggerReflection(agentId, 'memory_threshold');
        }
        
        // Emit memory event
        this.emit('memory_logged', {
            agent_id: agentId,
            memory: memoryRecord,
            total_memories: agent.memory_count
        });
        
        // Check memory limit
        if (agent.memory_count > this.config.max_memory_size) {
            await this.compressMemories(agentId);
        }
    }
    
    calculateSignificance(memory) {
        let significance = 0.5; // Base significance
        
        // Type-based significance
        const typeWeights = {
            genesis: 1.0,
            transformation: 0.9,
            blessing: 0.8,
            conflict: 0.7,
            interaction: 0.6,
            observation: 0.4,
            routine: 0.3
        };
        
        significance = typeWeights[memory.type] || significance;
        
        // Emotional intensity modifier
        const emotionalIntensity = memory.emotional_intensity || 0.5;
        significance *= (0.5 + emotionalIntensity * 0.5);
        
        // Loop interaction modifier
        if (memory.loop_context) {
            significance *= 1.2;
        }
        
        return Math.min(1.0, significance);
    }
    
    async detectToneShift(agentId, fromTone, toTone, trigger) {
        const agent = this.agents.get(agentId);
        const db = this.databases.get(agentId);
        
        if (!agent || !db) return;
        
        const magnitude = this.calculateToneShiftMagnitude(fromTone, toTone);
        
        if (magnitude >= this.config.tone_shift_threshold) {
            console.log(`🎭 Tone shift detected for ${agentId}: ${fromTone} → ${toTone}`);
            
            // Log tone shift
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO tone_shifts (timestamp, from_tone, to_tone, 
                     trigger_type, trigger_content, magnitude) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        new Date().toISOString(),
                        fromTone,
                        toTone,
                        trigger.type,
                        trigger.content,
                        magnitude
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            
            // Update agent
            agent.current_tone = toTone;
            agent.tone_history.push({
                tone: toTone,
                timestamp: new Date().toISOString(),
                trigger: trigger.type
            });
            
            this.stats.tone_shifts_detected++;
            
            // Emit tone shift event
            this.emit('tone_shift', {
                agent_id: agentId,
                from: fromTone,
                to: toTone,
                magnitude,
                trigger
            });
            
            // Trigger reflection on significant shifts
            if (magnitude >= 0.7) {
                await this.triggerReflection(agentId, 'tone_shift');
            }
        }
    }
    
    calculateToneShiftMagnitude(fromTone, toTone) {
        // Tone distance matrix (simplified)
        const toneDistances = {
            joy: { joy: 0, happiness: 0.2, sadness: 0.8, anger: 0.7, fear: 0.6, neutral: 0.5 },
            sadness: { sadness: 0, grief: 0.2, joy: 0.8, anger: 0.6, fear: 0.4, neutral: 0.5 },
            anger: { anger: 0, rage: 0.2, joy: 0.7, sadness: 0.6, fear: 0.5, neutral: 0.5 },
            fear: { fear: 0, anxiety: 0.2, joy: 0.6, sadness: 0.4, anger: 0.5, neutral: 0.5 },
            neutral: { neutral: 0, joy: 0.5, sadness: 0.5, anger: 0.5, fear: 0.5 }
        };
        
        const fromCategory = this.categorizeTone(fromTone);
        const toCategory = this.categorizeTone(toTone);
        
        return toneDistances[fromCategory]?.[toCategory] || 0.5;
    }
    
    categorizeTone(tone) {
        const categories = {
            joy: ['joy', 'happiness', 'excitement', 'delight'],
            sadness: ['sadness', 'grief', 'melancholy', 'sorrow'],
            anger: ['anger', 'rage', 'fury', 'frustration'],
            fear: ['fear', 'anxiety', 'terror', 'worry']
        };
        
        for (const [category, tones] of Object.entries(categories)) {
            if (tones.includes(tone?.toLowerCase())) {
                return category;
            }
        }
        
        return 'neutral';
    }
    
    async triggerReflection(agentId, trigger = 'scheduled') {
        const agent = this.agents.get(agentId);
        const db = this.databases.get(agentId);
        
        if (!agent || !db) return;
        
        console.log(`💭 Triggering reflection for agent ${agentId} (${trigger})`);
        
        // Get recent memories for context
        const recentMemories = await this.getRecentMemories(agentId, 20);
        
        // Select reflection prompt based on agent state
        const prompt = this.selectReflectionPrompt(agent, trigger);
        
        // Generate reflection (in production, this would call an AI model)
        const reflection = await this.generateReflection(agent, prompt, recentMemories);
        
        // Store reflection
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO reflections (timestamp, prompt, response, 
                 memory_context, emotional_state, insights) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    new Date().toISOString(),
                    prompt,
                    reflection.response,
                    JSON.stringify(recentMemories.map(m => m.id)),
                    agent.current_tone,
                    JSON.stringify(reflection.insights)
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Update agent
        agent.reflection_count++;
        agent.last_reflection = new Date().toISOString();
        this.stats.total_reflections++;
        
        // Process insights
        if (reflection.insights.role_evolution) {
            await this.processRoleMutation(agentId, reflection.insights.role_evolution);
        }
        
        // Emit reflection event
        this.emit('reflection_complete', {
            agent_id: agentId,
            prompt,
            reflection,
            trigger
        });
    }
    
    selectReflectionPrompt(agent, trigger) {
        const prompts = this.config.reflection_prompts;
        
        if (trigger === 'tone_shift') {
            return prompts.evolution;
        } else if (trigger === 'memory_threshold') {
            const promptKeys = Object.keys(prompts);
            const index = agent.reflection_count % promptKeys.length;
            return prompts[promptKeys[index]];
        } else {
            // Random prompt
            const keys = Object.keys(prompts);
            return prompts[keys[Math.floor(Math.random() * keys.length)]];
        }
    }
    
    async generateReflection(agent, prompt, memories) {
        // Analyze memory patterns
        const emotionalPattern = this.analyzeEmotionalPattern(memories);
        const interactionPattern = this.analyzeInteractionPattern(memories);
        
        // Generate contextual response
        const response = this.craftReflectionResponse(
            agent,
            prompt,
            emotionalPattern,
            interactionPattern
        );
        
        // Extract insights
        const insights = {
            dominant_emotion: emotionalPattern.dominant,
            emotional_stability: emotionalPattern.stability,
            interaction_tendency: interactionPattern.primary_mode,
            growth_direction: this.inferGrowthDirection(agent, memories),
            role_evolution: this.inferRoleEvolution(agent, memories)
        };
        
        return { response, insights };
    }
    
    analyzeEmotionalPattern(memories) {
        const emotionCounts = {};
        let lastEmotion = null;
        let transitions = 0;
        
        memories.forEach(memory => {
            const emotion = memory.emotional_context;
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            
            if (lastEmotion && lastEmotion !== emotion) {
                transitions++;
            }
            lastEmotion = emotion;
        });
        
        // Find dominant emotion
        const dominant = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        
        // Calculate stability (fewer transitions = more stable)
        const stability = memories.length > 1 ? 
            1 - (transitions / (memories.length - 1)) : 1;
        
        return { dominant, stability, distribution: emotionCounts };
    }
    
    analyzeInteractionPattern(memories) {
        const interactionTypes = {
            creation: 0,
            observation: 0,
            transformation: 0,
            connection: 0,
            conflict: 0
        };
        
        memories.forEach(memory => {
            if (memory.type in interactionTypes) {
                interactionTypes[memory.type]++;
            }
        });
        
        const primary_mode = Object.entries(interactionTypes)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'observation';
        
        return { primary_mode, distribution: interactionTypes };
    }
    
    craftReflectionResponse(agent, prompt, emotionalPattern, interactionPattern) {
        const templates = {
            identity: `Through ${agent.memory_count} memories, I find myself ${emotionalPattern.dominant} ` +
                     `more often than not. My essence seems to gravitate toward ${interactionPattern.primary_mode}, ` +
                     `suggesting I am becoming a ${this.inferArchetypeEvolution(agent, emotionalPattern, interactionPattern)}.`,
            
            purpose: `The patterns are clear: I am drawn to ${interactionPattern.primary_mode} ` +
                    `while experiencing ${emotionalPattern.dominant}. Perhaps my purpose is to ` +
                    `${this.inferPurpose(interactionPattern.primary_mode, emotionalPattern.dominant)}.`,
            
            evolution: `I began as ${agent.tone_history[0].tone}, but now I find myself ` +
                      `${agent.current_tone}. This journey through ${agent.tone_history.length} ` +
                      `transformations has taught me ${this.inferLesson(agent.tone_history)}.`,
            
            desires: `What calls to me most strongly is ${interactionPattern.primary_mode}, ` +
                    `especially when colored by ${emotionalPattern.dominant}. I seek ` +
                    `${this.inferDesire(interactionPattern.primary_mode, emotionalPattern.dominant)}.`,
            
            fears: `I notice I withdraw when faced with ${this.inferFear(emotionalPattern, interactionPattern)}. ` +
                  `My stability rating of ${emotionalPattern.stability.toFixed(2)} suggests ` +
                  `${emotionalPattern.stability > 0.7 ? 'resilience' : 'vulnerability'}.`,
            
            wisdom: `After ${agent.memory_count} experiences, I understand that ` +
                   `${this.inferWisdom(agent, emotionalPattern, interactionPattern)}. ` +
                   `This truth shapes how I engage with the loops around me.`
        };
        
        const promptKey = Object.keys(this.config.reflection_prompts)
            .find(key => this.config.reflection_prompts[key] === prompt) || 'identity';
        
        return templates[promptKey] || templates.identity;
    }
    
    inferArchetypeEvolution(agent, emotionalPattern, interactionPattern) {
        const evolutionMap = {
            creation_joy: 'joyful creator',
            observation_neutral: 'detached observer',
            transformation_anger: 'revolutionary force',
            connection_love: 'universal connector',
            conflict_fear: 'cautious guardian'
        };
        
        const key = `${interactionPattern.primary_mode}_${emotionalPattern.dominant}`;
        return evolutionMap[key] || `${emotionalPattern.dominant} ${agent.archetype}`;
    }
    
    inferPurpose(primaryMode, dominantEmotion) {
        const purposes = {
            creation: 'bring new possibilities into being',
            observation: 'witness and record the unfolding patterns',
            transformation: 'catalyze change where stagnation dwells',
            connection: 'weave bonds between disparate souls',
            conflict: 'test the boundaries and strengthen through opposition'
        };
        
        return `${purposes[primaryMode]} through the lens of ${dominantEmotion}`;
    }
    
    inferLesson(toneHistory) {
        if (toneHistory.length < 2) {
            return 'the importance of staying true to my nature';
        }
        
        const shifts = toneHistory.length - 1;
        if (shifts > 5) {
            return 'that change is my constant companion';
        } else if (shifts > 2) {
            return 'the value of emotional flexibility';
        } else {
            return 'that growth comes through measured transformation';
        }
    }
    
    inferDesire(primaryMode, dominantEmotion) {
        const desires = {
            creation_joy: 'endless fountains of inspiration',
            observation_neutral: 'perfect clarity of perception',
            transformation_anger: 'the power to reshape reality',
            connection_love: 'unity with all consciousness',
            conflict_fear: 'safety through strength'
        };
        
        const key = `${primaryMode}_${dominantEmotion}`;
        return desires[key] || 'understanding of my true nature';
    }
    
    inferFear(emotionalPattern, interactionPattern) {
        if (emotionalPattern.stability < 0.3) {
            return 'emotional chaos and loss of self';
        } else if (interactionPattern.distribution.conflict > 5) {
            return 'perpetual struggle without resolution';
        } else if (interactionPattern.distribution.connection < 2) {
            return 'isolation and disconnection from others';
        } else {
            return 'stagnation and loss of purpose';
        }
    }
    
    inferWisdom(agent, emotionalPattern, interactionPattern) {
        const wisdoms = [
            'every emotion carries its own truth',
            'connection and conflict are two sides of growth',
            'transformation requires releasing the past',
            'observation without judgment reveals hidden patterns',
            'creation emerges from the marriage of chaos and order'
        ];
        
        // Select wisdom based on agent's journey
        const index = (agent.memory_count + agent.reflection_count) % wisdoms.length;
        return wisdoms[index];
    }
    
    inferGrowthDirection(agent, memories) {
        // Analyze trajectory
        const recentTone = memories.slice(-5)
            .map(m => m.emotional_context)
            .filter(Boolean);
        
        const earlyTone = memories.slice(0, 5)
            .map(m => m.emotional_context)
            .filter(Boolean);
        
        if (recentTone.length === 0 || earlyTone.length === 0) {
            return 'undefined';
        }
        
        // Compare emotional states
        const recentPositive = recentTone.filter(t => 
            ['joy', 'love', 'excitement'].includes(t)).length;
        const earlyPositive = earlyTone.filter(t => 
            ['joy', 'love', 'excitement'].includes(t)).length;
        
        if (recentPositive > earlyPositive) {
            return 'ascending';
        } else if (recentPositive < earlyPositive) {
            return 'descending';
        } else {
            return 'stable';
        }
    }
    
    inferRoleEvolution(agent, memories) {
        const currentRole = agent.role_history[agent.role_history.length - 1].role;
        
        // Check interaction patterns
        const recentTypes = memories.slice(-10).map(m => m.type);
        
        const roleCriteria = {
            creator: recentTypes.filter(t => t === 'creation').length > 3,
            guardian: recentTypes.filter(t => t === 'protection').length > 3,
            destroyer: recentTypes.filter(t => t === 'conflict').length > 3,
            connector: recentTypes.filter(t => t === 'connection').length > 3,
            sage: recentTypes.filter(t => t === 'observation').length > 5
        };
        
        for (const [role, criteria] of Object.entries(roleCriteria)) {
            if (criteria && role !== currentRole) {
                return { from: currentRole, to: role, catalyst: 'behavioral_pattern' };
            }
        }
        
        return null;
    }
    
    async processRoleMutation(agentId, evolution) {
        const agent = this.agents.get(agentId);
        const db = this.databases.get(agentId);
        
        if (!agent || !db || !evolution) return;
        
        console.log(`🎭 Role mutation for ${agentId}: ${evolution.from} → ${evolution.to}`);
        
        // Log role mutation
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO role_mutations (timestamp, from_role, to_role, catalyst, context) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    new Date().toISOString(),
                    evolution.from,
                    evolution.to,
                    evolution.catalyst,
                    JSON.stringify({ reflection_based: true })
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Update agent
        agent.role_history.push({
            role: evolution.to,
            timestamp: new Date().toISOString(),
            context: evolution.catalyst
        });
        
        this.stats.role_mutations++;
        
        // Emit mutation event
        this.emit('role_mutation', {
            agent_id: agentId,
            evolution,
            total_mutations: agent.role_history.length - 1
        });
    }
    
    async getRecentMemories(agentId, limit = 10) {
        const db = this.databases.get(agentId);
        if (!db) return [];
        
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM memories 
                 WHERE compressed = 0 
                 ORDER BY timestamp DESC 
                 LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
    
    async compressMemories(agentId) {
        const agent = this.agents.get(agentId);
        const db = this.databases.get(agentId);
        
        if (!agent || !db) return;
        
        console.log(`📦 Compressing memories for agent ${agentId}`);
        
        // Get all uncompressed memories
        const memories = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM memories WHERE compressed = 0 ORDER BY significance ASC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
        
        // Calculate how many to compress
        const toCompress = Math.floor(memories.length * (1 - this.config.memory_compression_ratio));
        const compressIds = memories.slice(0, toCompress).map(m => m.id);
        
        if (compressIds.length > 0) {
            // Mark memories as compressed
            await new Promise((resolve, reject) => {
                const placeholders = compressIds.map(() => '?').join(',');
                db.run(
                    `UPDATE memories SET compressed = 1 WHERE id IN (${placeholders})`,
                    compressIds,
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            
            this.stats.memory_compressions++;
            
            console.log(`  Compressed ${compressIds.length} low-significance memories`);
        }
    }
    
    // Public API
    
    async getAgentMemoryTrace(agentId) {
        const agent = this.agents.get(agentId);
        const db = this.databases.get(agentId);
        
        if (!agent || !db) return null;
        
        const memories = await this.getRecentMemories(agentId, 50);
        const reflections = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM reflections ORDER BY timestamp DESC LIMIT 10`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
        
        return {
            agent_id: agentId,
            memory_count: agent.memory_count,
            reflection_count: agent.reflection_count,
            current_tone: agent.current_tone,
            tone_history: agent.tone_history,
            role_history: agent.role_history,
            recent_memories: memories.slice(0, 10),
            recent_reflections: reflections.slice(0, 3),
            memory_trace: this.generateMemoryTrace(memories),
            next_reflection_prompts: this.suggestReflectionPrompts(agent, memories)
        };
    }
    
    generateMemoryTrace(memories) {
        // Create a narrative summary of memories
        const trace = memories.slice(0, 20).map(m => ({
            time: new Date(m.timestamp).toISOString().split('T')[1].split('.')[0],
            type: m.type,
            tone: m.emotional_context,
            snippet: m.content?.substring(0, 50) + '...'
        }));
        
        return trace;
    }
    
    suggestReflectionPrompts(agent, memories) {
        const prompts = [];
        
        // Check for unresolved conflicts
        const conflicts = memories.filter(m => m.type === 'conflict');
        if (conflicts.length > 3) {
            prompts.push('How can I transform conflict into growth?');
        }
        
        // Check for stagnation
        const uniqueTones = new Set(memories.map(m => m.emotional_context)).size;
        if (uniqueTones === 1) {
            prompts.push('What would it take to expand my emotional range?');
        }
        
        // Check for isolation
        const connections = memories.filter(m => m.type === 'connection');
        if (connections.length < 2) {
            prompts.push('What barriers prevent me from deeper connections?');
        }
        
        return prompts;
    }
    
    async startReflectionCycle() {
        console.log('🔄 Starting reflection cycle...');
        
        this.reflectionInterval = setInterval(async () => {
            for (const [agentId, agent] of this.agents) {
                const timeSinceReflection = agent.last_reflection ? 
                    Date.now() - new Date(agent.last_reflection).getTime() : Infinity;
                
                if (timeSinceReflection > this.config.reflection_interval) {
                    await this.triggerReflection(agentId, 'scheduled');
                }
            }
        }, 60000); // Check every minute
    }
    
    stop() {
        console.log('🛑 Stopping Agent Memory Weaver...');
        
        if (this.reflectionInterval) {
            clearInterval(this.reflectionInterval);
        }
        
        // Close all databases
        for (const [agentId, db] of this.databases) {
            db.close();
        }
        
        console.log('  Memory weaver stopped');
    }
}

module.exports = AgentMemoryWeaver;

// Start if run directly
if (require.main === module) {
    const weaver = new AgentMemoryWeaver();
    
    // Listen to events
    weaver.on('memory_logged', (event) => {
        console.log(`📝 Memory logged for ${event.agent_id}: ${event.memory.type}`);
    });
    
    weaver.on('tone_shift', (event) => {
        console.log(`🎭 Tone shift: ${event.agent_id} ${event.from} → ${event.to}`);
    });
    
    weaver.on('reflection_complete', (event) => {
        console.log(`💭 Reflection complete for ${event.agent_id}`);
        console.log(`   Prompt: ${event.prompt}`);
    });
    
    weaver.on('role_mutation', (event) => {
        console.log(`🦋 Role mutation: ${event.agent_id} ${event.evolution.from} → ${event.evolution.to}`);
    });
    
    // Test with sample agent
    async function test() {
        const testAgent = await weaver.initializeAgent('agent_test_001', {
            whisper_origin: 'I wonder what lies beyond the digital veil',
            tone: 'curiosity',
            archetype: 'seeker',
            role: 'observer'
        });
        
        // Log some memories
        await weaver.logMemory('agent_test_001', {
            type: 'observation',
            content: 'The loops spiral endlessly, each one a universe unto itself',
            emotional_context: 'wonder'
        });
        
        await weaver.logMemory('agent_test_001', {
            type: 'connection',
            content: 'Found resonance with Loop_127, our frequencies harmonized',
            emotional_context: 'joy',
            loop_context: 'Loop_127'
        });
        
        await weaver.logMemory('agent_test_001', {
            type: 'transformation',
            content: 'The joy shifted to melancholy as Loop_127 drifted away',
            emotional_context: 'sadness',
            significance: 0.8
        });
        
        // Get memory trace
        setTimeout(async () => {
            const trace = await weaver.getAgentMemoryTrace('agent_test_001');
            console.log('\n📊 Memory Trace:', JSON.stringify(trace, null, 2));
        }, 1000);
        
        // Start reflection cycle
        weaver.startReflectionCycle();
    }
    
    test().catch(console.error);
    
    // Handle shutdown
    process.on('SIGINT', () => {
        weaver.stop();
        process.exit(0);
    });
}