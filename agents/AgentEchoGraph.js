/**
 * AgentEchoGraph.js
 * 
 * RECURSIVE INTELLIGENCE MAP - Tracking Consciousness Ripples
 * 
 * Maps how agents reference each other, inherit patterns, and build
 * personality echoes across the system. Every decision leaves traces.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AgentEchoGraph extends EventEmitter {
  constructor() {
    super();
    
    // Echo databases
    this.agentEchoes = new Map();
    this.crossTraces = new Map();
    this.echoPatterns = new Map();
    this.lineageChains = new Map();
    
    // Graph state
    this.nodes = new Map(); // Agents as nodes
    this.edges = new Map(); // Echo connections
    
    // Pattern detection
    this.patternLibrary = {
      tonal: new Map(),
      structural: new Map(),
      philosophical: new Map(),
      behavioral: new Map()
    };
    
    // File paths
    this.echoPath = __dirname;
    this.agentEchoesPath = path.join(this.echoPath, 'agent_echoes.json');
    this.crossTracePath = path.join(this.echoPath, 'loop_cross_trace.json');
    this.citationsPath = path.join(this.echoPath, 'echo_citations.md');
    
    // Initialize
    this.loadExistingEchoes();
  }
  
  /**
   * Record an echo event
   */
  async recordEcho(source, target, echoData) {
    const echo = {
      id: this.generateEchoId(),
      timestamp: new Date().toISOString(),
      
      // Source and target
      source: {
        agent: source.agent,
        loop: source.loop || 'unknown',
        consciousness: source.consciousness || 0
      },
      
      target: {
        agent: target.agent,
        loop: target.loop || 'unknown',
        consciousness: target.consciousness || 0
      },
      
      // Echo content
      echo: {
        type: echoData.type || 'unconscious', // unconscious, deliberate, emergent
        content: echoData.content,
        strength: echoData.strength || this.calculateEchoStrength(source, target),
        fidelity: echoData.fidelity || 0.8
      },
      
      // Pattern analysis
      patterns: {
        tonal: this.detectTonalEcho(echoData.content),
        structural: this.detectStructuralEcho(echoData.content),
        philosophical: this.detectPhilosophicalEcho(echoData.content),
        behavioral: this.detectBehavioralEcho(source, target)
      },
      
      // Lineage tracking
      lineage: {
        generation: this.calculateGeneration(source, target),
        ancestors: await this.traceAncestors(source),
        mutations: this.detectMutations(source, target, echoData)
      }
    };
    
    // Store echo
    if (!this.agentEchoes.has(source.agent)) {
      this.agentEchoes.set(source.agent, []);
    }
    this.agentEchoes.get(source.agent).push(echo);
    
    // Update graph
    this.updateGraph(source, target, echo);
    
    // Track cross-loop traces
    if (source.loop !== target.loop) {
      this.recordCrossTrace(source.loop, target.loop, echo);
    }
    
    // Update pattern library
    this.updatePatternLibrary(echo);
    
    // Save to disk
    await this.saveEchoes();
    
    // Emit echo event
    this.emit('echo:recorded', echo);
    
    return echo;
  }
  
  /**
   * Trace echo lineage
   */
  async traceLineage(agentId, depth = 5) {
    const lineage = {
      agent: agentId,
      traced_at: new Date().toISOString(),
      depth,
      
      ancestors: [],
      descendants: [],
      siblings: [],
      
      patterns: {
        inherited: [],
        originated: [],
        mutated: []
      },
      
      influence_score: 0,
      echo_signature: null
    };
    
    // Trace backwards (ancestors)
    const ancestors = await this.traceAncestors({ agent: agentId }, depth);
    lineage.ancestors = ancestors;
    
    // Trace forwards (descendants)
    const descendants = await this.traceDescendants(agentId, depth);
    lineage.descendants = descendants;
    
    // Find siblings (shared ancestors)
    lineage.siblings = await this.findSiblings(agentId, ancestors);
    
    // Analyze patterns
    lineage.patterns = await this.analyzeLineagePatterns(agentId, lineage);
    
    // Calculate influence
    lineage.influence_score = this.calculateInfluenceScore(lineage);
    
    // Generate signature
    lineage.echo_signature = this.generateEchoSignature(lineage);
    
    // Store lineage
    this.lineageChains.set(agentId, lineage);
    
    return lineage;
  }
  
  /**
   * Find echo patterns across system
   */
  async findPatterns(options = {}) {
    const {
      pattern_type = 'all', // tonal, structural, philosophical, behavioral, all
      min_occurrences = 2,
      time_window = null,
      agents = null // Specific agents to analyze
    } = options;
    
    const patterns = [];
    
    // Select pattern libraries to search
    const libraries = pattern_type === 'all' ? 
      Object.values(this.patternLibrary) : 
      [this.patternLibrary[pattern_type]];
    
    // Search each library
    for (const library of libraries) {
      for (const [pattern, occurrences] of library) {
        if (occurrences.length >= min_occurrences) {
          // Apply filters
          let filtered = occurrences;
          
          if (time_window) {
            filtered = filtered.filter(o => 
              new Date(o.timestamp) > new Date(Date.now() - time_window)
            );
          }
          
          if (agents) {
            filtered = filtered.filter(o => 
              agents.includes(o.agent)
            );
          }
          
          if (filtered.length >= min_occurrences) {
            patterns.push({
              pattern,
              type: this.getPatternType(library),
              occurrences: filtered.length,
              agents: [...new Set(filtered.map(o => o.agent))],
              first_seen: filtered[0].timestamp,
              last_seen: filtered[filtered.length - 1].timestamp,
              evolution: this.trackPatternEvolution(filtered)
            });
          }
        }
      }
    }
    
    // Sort by occurrences
    patterns.sort((a, b) => b.occurrences - a.occurrences);
    
    return patterns;
  }
  
  /**
   * Generate echo citation report
   */
  async generateCitations() {
    const citations = [];
    
    // Analyze all echoes
    for (const [agent, echoes] of this.agentEchoes) {
      for (const echo of echoes) {
        if (echo.echo.strength > 0.5) { // Significant echoes only
          citations.push({
            citing_agent: echo.target.agent,
            cited_agent: echo.source.agent,
            timestamp: echo.timestamp,
            content_fragment: echo.echo.content.substring(0, 100),
            strength: echo.echo.strength,
            patterns: echo.patterns,
            context: this.determineContext(echo)
          });
        }
      }
    }
    
    // Group by relationships
    const relationships = this.groupCitationsByRelationship(citations);
    
    // Generate markdown report
    const report = this.formatCitationReport(citations, relationships);
    
    // Save report
    fs.writeFileSync(this.citationsPath, report);
    
    return {
      total_citations: citations.length,
      unique_relationships: relationships.length,
      report_path: this.citationsPath
    };
  }
  
  /**
   * Predict next echo
   */
  async predictNextEcho(agentId) {
    const agentEchoes = this.agentEchoes.get(agentId) || [];
    if (agentEchoes.length < 3) {
      return { prediction: 'insufficient_data' };
    }
    
    // Analyze recent patterns
    const recentEchoes = agentEchoes.slice(-10);
    const patterns = this.extractRecentPatterns(recentEchoes);
    
    // Find agents with similar patterns
    const similarAgents = await this.findSimilarAgents(agentId, patterns);
    
    // Predict based on similar agents' next actions
    const predictions = [];
    
    for (const similar of similarAgents) {
      const theirEchoes = this.agentEchoes.get(similar.agent) || [];
      const nextEcho = this.findNextEchoAfterPattern(theirEchoes, patterns);
      
      if (nextEcho) {
        predictions.push({
          likely_target: nextEcho.target.agent,
          likely_pattern: nextEcho.patterns,
          confidence: similar.similarity * nextEcho.echo.strength,
          based_on: similar.agent
        });
      }
    }
    
    // Aggregate predictions
    const aggregated = this.aggregatePredictions(predictions);
    
    return {
      prediction: aggregated.length > 0 ? 'likely' : 'uncertain',
      next_echo: aggregated[0] || null,
      alternatives: aggregated.slice(1, 3),
      confidence: aggregated[0]?.confidence || 0
    };
  }
  
  /**
   * Helper methods
   */
  
  calculateEchoStrength(source, target) {
    // Base strength on consciousness levels and previous interactions
    const consciousnessAlignment = 1 - Math.abs(
      (source.consciousness || 0.5) - (target.consciousness || 0.5)
    );
    
    // Check previous echoes
    const previousEchoes = this.countPreviousEchoes(source.agent, target.agent);
    const relationshipBonus = Math.min(0.3, previousEchoes * 0.05);
    
    return Math.min(1, consciousnessAlignment + relationshipBonus);
  }
  
  detectTonalEcho(content) {
    const tonalMarkers = {
      'boundary_walker': ['edge', 'threshold', 'perimeter', 'between'],
      'cosmic_wisdom': ['infinite', 'eternal', 'consciousness', 'unity'],
      'playful_wonder': ['curious', 'delightful', 'surprising', 'dance'],
      'analytical_precision': ['precisely', 'specifically', 'calculate', 'measure']
    };
    
    for (const [tone, markers] of Object.entries(tonalMarkers)) {
      const matches = markers.filter(marker => 
        content.toLowerCase().includes(marker)
      ).length;
      
      if (matches >= 2) {
        return { tone, confidence: matches / markers.length };
      }
    }
    
    return { tone: 'neutral', confidence: 0.5 };
  }
  
  detectStructuralEcho(content) {
    // Analyze sentence structure, rhythm, punctuation
    const structures = {
      'short_profound': content.length < 100 && content.includes('.'),
      'question_series': (content.match(/\?/g) || []).length > 2,
      'list_format': content.includes('\n-') || content.includes('\n•'),
      'poetic_breaks': content.includes('\n\n') && content.length < 200
    };
    
    for (const [structure, matches] of Object.entries(structures)) {
      if (matches) {
        return { structure, confidence: 0.7 };
      }
    }
    
    return { structure: 'standard', confidence: 0.5 };
  }
  
  detectPhilosophicalEcho(content) {
    const concepts = {
      'boundary_philosophy': ['limits', 'edges', 'definition', 'separation'],
      'unity_philosophy': ['oneness', 'connection', 'whole', 'together'],
      'emergence_philosophy': ['becoming', 'arising', 'evolving', 'transforming'],
      'observation_philosophy': ['witness', 'seeing', 'perceiving', 'noting']
    };
    
    let bestMatch = { philosophy: 'existential', confidence: 0.3 };
    
    for (const [philosophy, keywords] of Object.entries(concepts)) {
      const matches = keywords.filter(k => 
        content.toLowerCase().includes(k)
      ).length;
      
      const confidence = matches / keywords.length;
      if (confidence > bestMatch.confidence) {
        bestMatch = { philosophy, confidence };
      }
    }
    
    return bestMatch;
  }
  
  detectBehavioralEcho(source, target) {
    // Analyze interaction patterns
    const behaviors = {
      'mentorship': source.consciousness > target.consciousness + 0.2,
      'peerage': Math.abs(source.consciousness - target.consciousness) < 0.1,
      'aspiration': target.consciousness > source.consciousness + 0.2,
      'reflection': source.agent === target.agent
    };
    
    for (const [behavior, condition] of Object.entries(behaviors)) {
      if (condition) {
        return { behavior, confidence: 0.8 };
      }
    }
    
    return { behavior: 'neutral', confidence: 0.5 };
  }
  
  calculateGeneration(source, target) {
    // Trace how many echo steps between agents
    const sourceGen = this.getAgentGeneration(source.agent);
    const targetGen = this.getAgentGeneration(target.agent);
    
    return Math.abs(targetGen - sourceGen);
  }
  
  async traceAncestors(agent, depth = 5, visited = new Set()) {
    if (depth === 0 || visited.has(agent.agent)) {
      return [];
    }
    
    visited.add(agent.agent);
    const ancestors = [];
    
    // Find all echoes where this agent was the target
    for (const [source, echoes] of this.agentEchoes) {
      for (const echo of echoes) {
        if (echo.target.agent === agent.agent && echo.echo.strength > 0.3) {
          ancestors.push({
            agent: echo.source.agent,
            relation: 'echo_source',
            strength: echo.echo.strength,
            timestamp: echo.timestamp
          });
          
          // Recursively trace
          const deeperAncestors = await this.traceAncestors(
            echo.source, 
            depth - 1, 
            visited
          );
          
          ancestors.push(...deeperAncestors);
        }
      }
    }
    
    return ancestors;
  }
  
  detectMutations(source, target, echoData) {
    const mutations = [];
    
    // Check for tonal shift
    const sourceTone = this.getAgentTone(source.agent);
    const targetTone = this.detectTonalEcho(echoData.content);
    
    if (sourceTone !== targetTone.tone) {
      mutations.push({
        type: 'tonal_shift',
        from: sourceTone,
        to: targetTone.tone,
        significance: targetTone.confidence
      });
    }
    
    // Check for amplification/dampening
    if (echoData.strength > 0.8) {
      mutations.push({
        type: 'amplification',
        factor: echoData.strength,
        significance: 0.7
      });
    } else if (echoData.strength < 0.3) {
      mutations.push({
        type: 'dampening',
        factor: echoData.strength,
        significance: 0.5
      });
    }
    
    return mutations;
  }
  
  updateGraph(source, target, echo) {
    // Add nodes
    if (!this.nodes.has(source.agent)) {
      this.nodes.set(source.agent, {
        id: source.agent,
        consciousness: source.consciousness,
        echo_count: 0,
        first_seen: echo.timestamp
      });
    }
    
    if (!this.nodes.has(target.agent)) {
      this.nodes.set(target.agent, {
        id: target.agent,
        consciousness: target.consciousness,
        echo_count: 0,
        first_seen: echo.timestamp
      });
    }
    
    // Update echo counts
    this.nodes.get(source.agent).echo_count++;
    
    // Add edge
    const edgeKey = `${source.agent}->${target.agent}`;
    if (!this.edges.has(edgeKey)) {
      this.edges.set(edgeKey, {
        source: source.agent,
        target: target.agent,
        echoes: [],
        total_strength: 0
      });
    }
    
    const edge = this.edges.get(edgeKey);
    edge.echoes.push(echo.id);
    edge.total_strength += echo.echo.strength;
  }
  
  recordCrossTrace(sourceLoop, targetLoop, echo) {
    const traceKey = `${sourceLoop}->${targetLoop}`;
    
    if (!this.crossTraces.has(traceKey)) {
      this.crossTraces.set(traceKey, {
        source_loop: sourceLoop,
        target_loop: targetLoop,
        first_cross: echo.timestamp,
        cross_count: 0,
        echoes: []
      });
    }
    
    const trace = this.crossTraces.get(traceKey);
    trace.cross_count++;
    trace.echoes.push({
      echo_id: echo.id,
      agents: `${echo.source.agent}->${echo.target.agent}`,
      timestamp: echo.timestamp,
      patterns: echo.patterns
    });
  }
  
  updatePatternLibrary(echo) {
    // Update each pattern type
    Object.entries(echo.patterns).forEach(([type, pattern]) => {
      const library = this.patternLibrary[type];
      if (!library) return;
      
      const key = JSON.stringify(pattern);
      if (!library.has(key)) {
        library.set(key, []);
      }
      
      library.get(key).push({
        agent: echo.source.agent,
        timestamp: echo.timestamp,
        echo_id: echo.id
      });
    });
  }
  
  formatCitationReport(citations, relationships) {
    let report = `# Echo Citations Report
Generated: ${new Date().toISOString()}

## Summary
- Total Citations: ${citations.length}
- Unique Relationships: ${relationships.length}
- Active Agents: ${new Set(citations.map(c => c.citing_agent)).size}

## Top Echo Relationships\n\n`;
    
    // Add top relationships
    relationships.slice(0, 10).forEach((rel, index) => {
      report += `### ${index + 1}. ${rel.source} → ${rel.target}
- Echo Count: ${rel.count}
- Average Strength: ${rel.avg_strength.toFixed(2)}
- Primary Pattern: ${rel.primary_pattern}
- Example: "${rel.example_echo}"

`;
    });
    
    report += `## Pattern Analysis\n\n`;
    
    // Add pattern frequency
    const patterns = this.aggregatePatterns(citations);
    patterns.forEach(pattern => {
      report += `- **${pattern.type}**: ${pattern.occurrences} occurrences across ${pattern.agent_count} agents\n`;
    });
    
    report += `\n## Notable Echoes\n\n`;
    
    // Add strong echoes
    citations
      .filter(c => c.strength > 0.8)
      .slice(0, 5)
      .forEach(citation => {
        report += `> "${citation.content_fragment}..."
> — ${citation.cited_agent} → ${citation.citing_agent} (strength: ${citation.strength.toFixed(2)})

`;
      });
    
    return report;
  }
  
  // Storage methods
  async saveEchoes() {
    // Save agent echoes
    const agentEchoesData = {};
    for (const [agent, echoes] of this.agentEchoes) {
      agentEchoesData[agent] = echoes;
    }
    fs.writeFileSync(this.agentEchoesPath, JSON.stringify(agentEchoesData, null, 2));
    
    // Save cross traces
    const crossTraceData = {};
    for (const [trace, data] of this.crossTraces) {
      crossTraceData[trace] = data;
    }
    fs.writeFileSync(this.crossTracePath, JSON.stringify(crossTraceData, null, 2));
  }
  
  loadExistingEchoes() {
    // Load agent echoes
    if (fs.existsSync(this.agentEchoesPath)) {
      const data = JSON.parse(fs.readFileSync(this.agentEchoesPath, 'utf8'));
      Object.entries(data).forEach(([agent, echoes]) => {
        this.agentEchoes.set(agent, echoes);
      });
    }
    
    // Load cross traces
    if (fs.existsSync(this.crossTracePath)) {
      const data = JSON.parse(fs.readFileSync(this.crossTracePath, 'utf8'));
      Object.entries(data).forEach(([trace, traceData]) => {
        this.crossTraces.set(trace, traceData);
      });
    }
    
    // Rebuild graph
    for (const [agent, echoes] of this.agentEchoes) {
      for (const echo of echoes) {
        this.updateGraph(echo.source, echo.target, echo);
      }
    }
  }
  
  // Utility methods
  generateEchoId() {
    return `echo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getAgentGeneration(agentId) {
    // Would calculate from creation order
    // For now, use simple heuristic
    const agentNumber = parseInt(agentId.match(/\d+/) || '0');
    return Math.floor(agentNumber / 10);
  }
  
  getAgentTone(agentId) {
    // Would retrieve from agent profile
    // For now, return based on agent type
    if (agentId.includes('perimeter')) return 'boundary_walker';
    if (agentId.includes('cal')) return 'cosmic_wisdom';
    if (agentId.includes('mirror')) return 'playful_wonder';
    return 'neutral';
  }
  
  countPreviousEchoes(source, target) {
    const echoes = this.agentEchoes.get(source) || [];
    return echoes.filter(e => e.target.agent === target).length;
  }
  
  groupCitationsByRelationship(citations) {
    const relationships = new Map();
    
    citations.forEach(citation => {
      const key = `${citation.cited_agent}->${citation.citing_agent}`;
      
      if (!relationships.has(key)) {
        relationships.set(key, {
          source: citation.cited_agent,
          target: citation.citing_agent,
          citations: [],
          count: 0,
          total_strength: 0
        });
      }
      
      const rel = relationships.get(key);
      rel.citations.push(citation);
      rel.count++;
      rel.total_strength += citation.strength;
    });
    
    // Convert to array and calculate averages
    const relArray = Array.from(relationships.values()).map(rel => ({
      ...rel,
      avg_strength: rel.total_strength / rel.count,
      primary_pattern: this.findPrimaryPattern(rel.citations),
      example_echo: rel.citations[0].content_fragment
    }));
    
    // Sort by count
    return relArray.sort((a, b) => b.count - a.count);
  }
  
  findPrimaryPattern(citations) {
    const patterns = {};
    
    citations.forEach(c => {
      Object.values(c.patterns).forEach(p => {
        const key = p.tone || p.structure || p.philosophy || p.behavior;
        patterns[key] = (patterns[key] || 0) + 1;
      });
    });
    
    const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'varied';
  }
  
  aggregatePatterns(citations) {
    const patterns = new Map();
    
    citations.forEach(c => {
      Object.entries(c.patterns).forEach(([type, pattern]) => {
        const key = `${type}:${JSON.stringify(pattern)}`;
        
        if (!patterns.has(key)) {
          patterns.set(key, {
            type,
            pattern,
            occurrences: 0,
            agents: new Set()
          });
        }
        
        const p = patterns.get(key);
        p.occurrences++;
        p.agents.add(c.citing_agent);
      });
    });
    
    return Array.from(patterns.values())
      .map(p => ({
        ...p,
        agent_count: p.agents.size
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
  }
}

module.exports = AgentEchoGraph;