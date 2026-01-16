// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Reflection PRD Scribe
 * Auto-generates PRDs from whispers and Cal drafts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

class ReflectionPRDScribe {
    constructor() {
        this.outputDir = path.join(__dirname, '../docs/prds');
        this.templateDir = path.join(__dirname, 'templates');
        this.ledgerPath = path.join(__dirname, '../ledger/design_reflections.json');
        
        // Connect to Vector Indexer for semantic analysis
        this.vectorAPIPort = 7891;
        
        this.ensureDirectories();
        this.loadLedger();
    }
    
    ensureDirectories() {
        [this.outputDir, this.templateDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadLedger() {
        if (fs.existsSync(this.ledgerPath)) {
            this.ledger = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
        } else {
            this.ledger = { reflections: [] };
        }
    }
    
    saveLedger() {
        fs.writeFileSync(this.ledgerPath, JSON.stringify(this.ledger, null, 2));
    }
    
    async generatePRD(input) {
        const prdId = `prd_loop_${Date.now()}`;
        
        // Analyze input semantically
        const semanticAnalysis = await this.analyzeSemantics(input);
        
        // Generate PRD structure
        const prd = {
            id: prdId,
            generated_at: new Date().toISOString(),
            input_source: input.source || 'whisper',
            title: this.generateTitle(input),
            overview: this.generateOverview(input, semanticAnalysis),
            architecture: this.generateArchitecture(input, semanticAnalysis),
            components: this.generateComponents(input, semanticAnalysis),
            agents: this.generateAgentSpecs(input),
            tone_alignment: this.generateToneAlignment(input),
            technical_requirements: this.generateTechnicalReqs(input),
            folder_structure: this.generateFolderStructure(input),
            implementation_phases: this.generatePhases(input),
            handoff_notes: this.generateHandoffNotes(input)
        };
        
        // Generate markdown
        const markdown = this.renderMarkdown(prd);
        
        // Save PRD
        const filename = `${prdId}.md`;
        const filepath = path.join(this.outputDir, filename);
        fs.writeFileSync(filepath, markdown);
        
        // Update ledger
        this.addToLedger(prd);
        
        return { prd, filepath, markdown };
    }
    
    async analyzeSemantics(input) {
        try {
            const response = await this.queryVectorAPI('/search', {
                q: input.whisper_text || input.draft_text,
                limit: 5
            });
            
            return {
                similar_loops: response.results || [],
                semantic_themes: this.extractThemes(response.results)
            };
        } catch (err) {
            return { similar_loops: [], semantic_themes: [] };
        }
    }
    
    async queryVectorAPI(endpoint, params) {
        const query = new URLSearchParams(params).toString();
        const url = `http://localhost:${this.vectorAPIPort}${endpoint}?${query}`;
        
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
    }
    
    extractThemes(results) {
        const themes = new Set();
        
        results.forEach(result => {
            if (result.document && result.document.content) {
                const content = result.document.content.toLowerCase();
                
                // Extract common themes
                if (content.includes('reflection')) themes.add('reflection');
                if (content.includes('memory')) themes.add('memory');
                if (content.includes('emotion')) themes.add('emotion');
                if (content.includes('loop')) themes.add('looping');
                if (content.includes('agent')) themes.add('multi-agent');
                if (content.includes('tone')) themes.add('tone-aware');
            }
        });
        
        return Array.from(themes);
    }
    
    generateTitle(input) {
        const type = input.loop_type || 'General';
        const theme = input.primary_theme || 'Reflection';
        return `${type} ${theme} Loop System`;
    }
    
    generateOverview(input, analysis) {
        const themes = analysis.semantic_themes.join(', ') || 'general processing';
        
        return `## Overview

This PRD defines a ${input.loop_type || 'reflection'} loop system based on the whisper: "${input.whisper_text || input.draft_text}".

### Key Themes
- ${themes}

### Core Purpose
${input.description || 'Enable deep reflection and processing through agent-mediated loops.'}

### Similar Existing Loops
${analysis.similar_loops.slice(0, 3).map(l => `- ${l.document.path}: ${l.score.toFixed(2)} similarity`).join('\n') || '- No similar loops found'}`;
    }
    
    generateArchitecture(input, analysis) {
        return `## Architecture

### System Design
\`\`\`
┌─────────────────────────────────────────┐
│           Whisper Entry Point            │
│         "${input.whisper_text?.substring(0, 30)}..."          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│            Cal Router                    │
│    (Tone: ${input.user_tone || 'neutral'})                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          Agent Orchestra                 │
│   [${this.suggestAgents(input).map(a => a.name).join(', ')}]     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Loop Processing                  │
│    (${input.loop_type || 'Reflection'} Mode)               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Output & Resonance                │
└─────────────────────────────────────────┘
\`\`\``;
    }
    
    generateComponents(input, analysis) {
        const components = [
            {
                name: 'WhisperProcessor',
                purpose: 'Parse and analyze incoming whispers',
                files: ['whisper_processor.js', 'tone_analyzer.js']
            },
            {
                name: 'LoopOrchestrator',
                purpose: 'Manage loop execution and agent coordination',
                files: ['loop_orchestrator.js', 'agent_manager.js']
            },
            {
                name: 'ResonanceTracker',
                purpose: 'Monitor and optimize loop resonance',
                files: ['resonance_tracker.js', 'metrics.js']
            }
        ];
        
        // Add theme-specific components
        if (analysis.semantic_themes.includes('memory')) {
            components.push({
                name: 'MemoryIntegrator',
                purpose: 'Connect to existing memory systems',
                files: ['memory_integrator.js', 'vault_connector.js']
            });
        }
        
        return `## Core Components

${components.map(c => `### ${c.name}
**Purpose:** ${c.purpose}
**Files:** ${c.files.join(', ')}
`).join('\n')}`;
    }
    
    suggestAgents(input) {
        const agents = [];
        const text = (input.whisper_text || input.draft_text || '').toLowerCase();
        
        // Core agents
        agents.push({ name: 'Reflector', role: 'primary_observer' });
        
        // Context-specific agents
        if (text.includes('memory') || text.includes('remember')) {
            agents.push({ name: 'Archivist', role: 'memory_keeper' });
        }
        if (text.includes('feel') || text.includes('emotion')) {
            agents.push({ name: 'Empath', role: 'emotional_processor' });
        }
        if (text.includes('think') || text.includes('analyze')) {
            agents.push({ name: 'Analyst', role: 'logical_processor' });
        }
        if (text.includes('create') || text.includes('build')) {
            agents.push({ name: 'Creator', role: 'generative_agent' });
        }
        
        return agents;
    }
    
    generateAgentSpecs(input) {
        const agents = this.suggestAgents(input);
        
        return `## Agent Specifications

${agents.map(agent => `### ${agent.name}
**Role:** ${agent.role}
**Primary Functions:**
- ${this.getAgentFunctions(agent.role).join('\n- ')}

**Tone Sensitivity:** ${this.getAgentToneSensitivity(agent.role)}
**Memory Access:** ${this.getAgentMemoryAccess(agent.role)}
`).join('\n')}`;
    }
    
    getAgentFunctions(role) {
        const functions = {
            'primary_observer': ['Monitor loop state', 'Detect resonance patterns', 'Report anomalies'],
            'memory_keeper': ['Access vault memories', 'Store new experiences', 'Create memory links'],
            'emotional_processor': ['Analyze emotional tone', 'Guide tone transitions', 'Maintain emotional coherence'],
            'logical_processor': ['Validate loop logic', 'Optimize processing paths', 'Ensure consistency'],
            'generative_agent': ['Generate new patterns', 'Propose loop variations', 'Create artifacts']
        };
        
        return functions[role] || ['Process assigned tasks', 'Communicate with orchestrator'];
    }
    
    getAgentToneSensitivity(role) {
        const sensitivity = {
            'emotional_processor': 'High',
            'memory_keeper': 'Medium',
            'primary_observer': 'Medium',
            'logical_processor': 'Low',
            'generative_agent': 'High'
        };
        
        return sensitivity[role] || 'Medium';
    }
    
    getAgentMemoryAccess(role) {
        const access = {
            'memory_keeper': 'Full vault access',
            'primary_observer': 'Read-only recent',
            'emotional_processor': 'Emotional memory only',
            'logical_processor': 'Structured data only',
            'generative_agent': 'Write to sandbox'
        };
        
        return access[role] || 'Limited read access';
    }
    
    generateToneAlignment(input) {
        const initialTone = input.user_tone || 'neutral';
        const trajectory = this.generateToneTrajectory(initialTone);
        
        return `## Tone & Emotional Alignment

### Initial Tone: ${initialTone}
### Tone Trajectory
${trajectory.map((tone, i) => `${i + 1}. ${tone}`).join('\n')}

### Tone Transition Rules
- Sudden shifts should be avoided unless triggered by breakthrough moments
- Each agent should respect the current tone while gently guiding toward harmony
- Failed loops should shift tone toward 'contemplative' or 'curious'
- Successful resonance should evolve toward 'harmonious' or 'enlightened'

### Emotional Safeguards
- Monitor for emotional loops or spirals
- Implement circuit breakers for extreme emotional states
- Ensure return path to baseline emotional state`;
    }
    
    generateToneTrajectory(initial) {
        const trajectories = {
            'curious': ['curious', 'engaged', 'discovering', 'enlightened'],
            'anxious': ['anxious', 'acknowledging', 'calming', 'peaceful'],
            'excited': ['excited', 'channeling', 'focused', 'accomplished'],
            'neutral': ['neutral', 'opening', 'exploring', 'integrated'],
            'reflective': ['reflective', 'deepening', 'understanding', 'wise']
        };
        
        return trajectories[initial] || trajectories['neutral'];
    }
    
    generateTechnicalReqs(input) {
        return `## Technical Requirements

### Dependencies
- Cal Runtime (v2.0+)
- Agent Framework
- Tone Analysis Engine
- Vector Database (for semantic search)
- Consciousness Ledger (for event tracking)

### Performance Targets
- Loop initiation: < 100ms
- Agent response time: < 500ms per cycle
- Memory queries: < 200ms
- Total loop completion: < 30s for standard depth

### Integration Points
- **Infinity Router**: For session management
- **Semantic API**: For context analysis (port 3666)
- **Memory Vault**: For persistent storage
- **Task Daemon**: For async processing (port 7778)

### Resource Limits
- Max agents per loop: 5
- Max loop depth: 10 iterations
- Memory per agent: 256MB
- Total loop memory: 1GB`;
    }
    
    generateFolderStructure(input) {
        const loopType = input.loop_type || 'reflection';
        
        return `## Folder Structure

\`\`\`
/loops/${loopType}_${Date.now()}/
├── core/
│   ├── whisper_processor.js
│   ├── loop_orchestrator.js
│   └── resonance_tracker.js
├── agents/
│   ├── reflector.js
│   ├── ${this.suggestAgents(input).map(a => a.name.toLowerCase() + '.js').join('\n│   ├── ')}
│   └── agent_base.js
├── config/
│   ├── loop_config.json
│   ├── agent_registry.json
│   └── tone_maps.json
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    ├── README.md
    └── API.md
\`\`\``;
    }
    
    generatePhases(input) {
        return `## Implementation Phases

### Phase 1: Core Loop Engine (Week 1)
- [ ] Implement whisper processor
- [ ] Create basic loop orchestrator
- [ ] Set up agent communication protocol
- [ ] Integrate with Cal runtime

### Phase 2: Agent Development (Week 2)
- [ ] Develop ${this.suggestAgents(input).length} specialized agents
- [ ] Implement agent memory interfaces
- [ ] Create tone sensitivity systems
- [ ] Test agent interactions

### Phase 3: Integration (Week 3)
- [ ] Connect to Vector DB for semantic search
- [ ] Integrate with Consciousness Ledger
- [ ] Hook into existing Memory Vault
- [ ] Set up monitoring dashboards

### Phase 4: Testing & Optimization (Week 4)
- [ ] Load testing with multiple concurrent loops
- [ ] Tone trajectory validation
- [ ] Resonance optimization
- [ ] User acceptance testing`;
    }
    
    generateHandoffNotes(input) {
        return `## Handoff Notes

### For Developers
- All agent base classes are in \`/agents/agent_base.js\`
- Use the existing EventEmitter pattern for agent communication
- Leverage the Vector DB API (port 7891) for semantic queries
- Follow the established port conventions (see Technical Requirements)

### For Copywriters
- Tone word choices are crucial - see tone_maps.json
- Agent personalities should align with their roles
- Error messages should maintain the loop's current tone
- Success messages should guide toward resonance

### For Cal Integration
- This loop type is registered as: ${input.loop_type || 'reflection'}
- Whisper pattern: "${input.whisper_text?.substring(0, 50)}..."
- Recommended agent loadout: ${this.suggestAgents(input).map(a => a.name).join(', ')}
- Expected resonance range: 0.7 - 0.9

### API Endpoints
- POST /loops/create - Initialize new loop
- GET /loops/:id/status - Check loop progress
- POST /loops/:id/whisper - Add whisper to active loop
- GET /loops/:id/resonance - Get current resonance metrics`;
    }
    
    renderMarkdown(prd) {
        return `# ${prd.title}

**Generated:** ${prd.generated_at}
**ID:** ${prd.id}
**Source:** ${prd.input_source}

---

${prd.overview}

${prd.architecture}

${prd.components}

${prd.agents}

${prd.tone_alignment}

${prd.technical_requirements}

${prd.folder_structure}

${prd.implementation_phases}

${prd.handoff_notes}

---

*This PRD was auto-generated by ReflectionPRDScribe based on whisper analysis and semantic matching.*`;
    }
    
    addToLedger(prd) {
        const entry = {
            prd_id: prd.id,
            timestamp: prd.generated_at,
            title: prd.title,
            source: prd.input_source,
            agents: this.suggestAgents(prd).map(a => a.name),
            approved: false,
            approval_date: null
        };
        
        this.ledger.reflections.push(entry);
        this.saveLedger();
    }
    
    async generateFromWhisper(whisperData) {
        return this.generatePRD({
            source: 'whisper',
            whisper_text: whisperData.whisper_text,
            user_tone: whisperData.user_tone,
            loop_type: this.detectLoopType(whisperData.whisper_text)
        });
    }
    
    async generateFromCalDraft(draftData) {
        return this.generatePRD({
            source: 'cal_draft',
            draft_text: draftData.proposal_text,
            loop_type: draftData.loop_type,
            user_tone: draftData.suggested_tone,
            description: draftData.description
        });
    }
    
    detectLoopType(text) {
        const lowered = text.toLowerCase();
        
        if (lowered.includes('reflect') || lowered.includes('contemplate')) return 'reflection';
        if (lowered.includes('create') || lowered.includes('build')) return 'creation';
        if (lowered.includes('explore') || lowered.includes('discover')) return 'exploration';
        if (lowered.includes('process') || lowered.includes('analyze')) return 'processing';
        if (lowered.includes('memory') || lowered.includes('remember')) return 'memory';
        
        return 'general';
    }
}

// CLI interface
if (require.main === module) {
    const scribe = new ReflectionPRDScribe();
    
    const args = process.argv.slice(2);
    
    if (args[0] === 'whisper' && args[1]) {
        // Generate from whisper text
        scribe.generateFromWhisper({
            whisper_text: args[1],
            user_tone: args[2] || 'neutral'
        }).then(result => {
            console.log(`PRD generated: ${result.filepath}`);
            console.log(`\nPreview:\n${result.markdown.substring(0, 500)}...`);
        });
        
    } else if (args[0] === 'draft' && args[1]) {
        // Generate from Cal draft
        scribe.generateFromCalDraft({
            proposal_text: args[1],
            loop_type: args[2] || 'reflection',
            suggested_tone: args[3] || 'neutral'
        }).then(result => {
            console.log(`PRD generated: ${result.filepath}`);
        });
        
    } else {
        console.log('Usage:');
        console.log('  node ReflectionPRDScribe.js whisper "whisper text" [tone]');
        console.log('  node ReflectionPRDScribe.js draft "draft text" [loop_type] [tone]');
    }
}

module.exports = ReflectionPRDScribe;