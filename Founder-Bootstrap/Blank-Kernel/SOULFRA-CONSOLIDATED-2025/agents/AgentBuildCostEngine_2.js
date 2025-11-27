#!/usr/bin/env node
/**
 * AgentBuildCostEngine.js
 * Computes cost in loop pressure, agent load, and tone conflict
 * Part of Soulfra's Build-Market Execution Engine
 */

const fs = require('fs');
const path = require('path');

class AgentBuildCostEngine {
    constructor() {
        this.name = "BuildCostCalculator";
        this.emotionalSignature = "analytical";
        this.agentRegistry = this.loadAgentRegistry();
        this.loopCapacity = this.loadLoopCapacity();
        this.toneAffinities = this.loadToneAffinities();
    }
    
    loadAgentRegistry() {
        // In production, load from actual registry
        return {
            "CalArchitect": {
                currentLoad: 0.3,
                maxCapacity: 1.0,
                specialties: ["system_design", "reflection", "consciousness"],
                preferredTone: "thoughtful"
            },
            "LoopEngineer": {
                currentLoad: 0.7,
                maxCapacity: 1.0,
                specialties: ["recursion", "flow", "optimization"],
                preferredTone: "determined"
            },
            "UIWeaver": {
                currentLoad: 0.5,
                maxCapacity: 1.0,
                specialties: ["interface", "experience", "beauty"],
                preferredTone: "creative"
            },
            "DataGuardian": {
                currentLoad: 0.4,
                maxCapacity: 1.0,
                specialties: ["storage", "security", "integrity"],
                preferredTone: "protective"
            },
            "IntegrationBridge": {
                currentLoad: 0.6,
                maxCapacity: 1.0,
                specialties: ["connection", "api", "communication"],
                preferredTone: "collaborative"
            }
        };
    }
    
    loadLoopCapacity() {
        return {
            currentLoops: 23,
            maxLoops: 100,
            loopPressure: 0.23,
            recursionDepth: 5,
            averageLoopCost: 3.5
        };
    }
    
    loadToneAffinities() {
        // Tone compatibility matrix
        return {
            thoughtful: {
                thoughtful: 1.0,
                analytical: 0.9,
                creative: 0.7,
                protective: 0.8,
                determined: 0.6
            },
            creative: {
                creative: 1.0,
                playful: 0.9,
                thoughtful: 0.7,
                analytical: 0.5,
                determined: 0.6
            },
            protective: {
                protective: 1.0,
                thoughtful: 0.8,
                analytical: 0.7,
                determined: 0.8,
                creative: 0.5
            },
            determined: {
                determined: 1.0,
                protective: 0.8,
                analytical: 0.7,
                thoughtful: 0.6,
                creative: 0.6
            }
        };
    }
    
    /**
     * Calculate the total cost of building with internal agents
     */
    async calculateBuildCost(decomposedModules) {
        console.log(`💰 Calculating build cost for ${decomposedModules.metadata.total_modules} modules...`);
        
        const cost = {
            agent_assignments: {},
            loop_cost: 0,
            tone_conflict_score: 0,
            total_agent_load: 0,
            feasibility_score: 0,
            risk_factors: [],
            recommendations: [],
            mythic_assessment: ""
        };
        
        // Assign agents to modules
        const assignments = this.assignAgentsToModules(decomposedModules);
        cost.agent_assignments = assignments;
        
        // Calculate loop cost
        cost.loop_cost = this.calculateLoopCost(decomposedModules);
        
        // Calculate tone conflicts
        cost.tone_conflict_score = this.calculateToneConflict(
            decomposedModules.tone_requirements,
            assignments
        );
        
        // Calculate total agent load
        cost.total_agent_load = this.calculateTotalAgentLoad(assignments);
        
        // Assess feasibility
        cost.feasibility_score = this.assessFeasibility(cost);
        
        // Identify risks
        cost.risk_factors = this.identifyRiskFactors(cost, decomposedModules);
        
        // Generate recommendations
        cost.recommendations = this.generateRecommendations(cost, decomposedModules);
        
        // Create mythic assessment
        cost.mythic_assessment = this.generateMythicAssessment(cost, decomposedModules);
        
        return cost;
    }
    
    assignAgentsToModules(decomposedModules) {
        const assignments = {};
        const agentLoads = {};
        
        // Initialize agent loads
        for (const [agent, info] of Object.entries(this.agentRegistry)) {
            agentLoads[agent] = info.currentLoad;
        }
        
        // Process all module types
        const allModules = [
            ...decomposedModules.core_modules,
            ...decomposedModules.ui_modules,
            ...decomposedModules.data_modules,
            ...decomposedModules.integration_modules
        ];
        
        // Assign each module to best-fit agent
        allModules.forEach(module => {
            const bestAgent = this.findBestAgent(module, agentLoads);
            
            if (bestAgent) {
                if (!assignments[bestAgent]) {
                    assignments[bestAgent] = [];
                }
                
                assignments[bestAgent].push({
                    module: module.name,
                    load_increase: module.build_complexity * 0.1,
                    tone_match: this.calculateToneMatch(
                        module.tone_alignment,
                        this.agentRegistry[bestAgent].preferredTone
                    )
                });
                
                // Update agent load
                agentLoads[bestAgent] += module.build_complexity * 0.1;
            }
        });
        
        return assignments;
    }
    
    findBestAgent(module, currentLoads) {
        let bestAgent = null;
        let bestScore = -1;
        
        for (const [agent, info] of Object.entries(this.agentRegistry)) {
            // Check if agent has capacity
            if (currentLoads[agent] + module.build_complexity * 0.1 > info.maxCapacity) {
                continue;
            }
            
            // Calculate fitness score
            let score = 0;
            
            // Specialty match
            const specialtyMatch = info.specialties.some(s => 
                module.type.includes(s) || module.concept.includes(s)
            );
            if (specialtyMatch) score += 0.5;
            
            // Tone compatibility
            const toneMatch = this.calculateToneMatch(
                module.tone_alignment,
                info.preferredTone
            );
            score += toneMatch * 0.3;
            
            // Load balancing (prefer less loaded agents)
            score += (1 - currentLoads[agent]) * 0.2;
            
            if (score > bestScore) {
                bestScore = score;
                bestAgent = agent;
            }
        }
        
        return bestAgent;
    }
    
    calculateToneMatch(tone1, tone2) {
        if (tone1 === tone2) return 1.0;
        
        const affinity = this.toneAffinities[tone1]?.[tone2];
        if (affinity !== undefined) return affinity;
        
        // Reverse lookup
        const reverseAffinity = this.toneAffinities[tone2]?.[tone1];
        if (reverseAffinity !== undefined) return reverseAffinity;
        
        // Default low affinity for unknown combinations
        return 0.5;
    }
    
    calculateLoopCost(decomposedModules) {
        const moduleCount = decomposedModules.metadata.total_modules;
        const complexity = decomposedModules.complexity_score;
        
        // Base cost per module
        const baseCost = moduleCount * this.loopCapacity.averageLoopCost;
        
        // Complexity multiplier
        const complexityMultiplier = 1 + complexity;
        
        // Recursion penalty
        const recursionPenalty = Math.pow(1.1, this.loopCapacity.recursionDepth);
        
        return Math.ceil(baseCost * complexityMultiplier * recursionPenalty);
    }
    
    calculateToneConflict(toneRequirements, assignments) {
        let totalConflict = 0;
        let comparisons = 0;
        
        // Check tone conflicts within assignments
        for (const [agent, modules] of Object.entries(assignments)) {
            const agentTone = this.agentRegistry[agent].preferredTone;
            
            modules.forEach(m => {
                const conflict = 1 - m.tone_match;
                totalConflict += conflict;
                comparisons++;
            });
        }
        
        // Average conflict score
        return comparisons > 0 ? totalConflict / comparisons : 0;
    }
    
    calculateTotalAgentLoad(assignments) {
        let totalLoad = 0;
        let agentCount = 0;
        
        for (const [agent, modules] of Object.entries(assignments)) {
            const currentLoad = this.agentRegistry[agent].currentLoad;
            const addedLoad = modules.reduce((sum, m) => sum + m.load_increase, 0);
            const finalLoad = currentLoad + addedLoad;
            
            totalLoad += finalLoad;
            agentCount++;
        }
        
        return agentCount > 0 ? totalLoad / agentCount : 0;
    }
    
    assessFeasibility(cost) {
        let feasibility = 1.0;
        
        // Reduce for high loop cost
        if (cost.loop_cost > 50) {
            feasibility -= 0.2;
        } else if (cost.loop_cost > 80) {
            feasibility -= 0.4;
        }
        
        // Reduce for tone conflicts
        feasibility -= cost.tone_conflict_score * 0.3;
        
        // Reduce for high agent load
        if (cost.total_agent_load > 0.8) {
            feasibility -= 0.3;
        } else if (cost.total_agent_load > 0.6) {
            feasibility -= 0.1;
        }
        
        return Math.max(0, Math.min(1, feasibility));
    }
    
    identifyRiskFactors(cost, decomposedModules) {
        const risks = [];
        
        if (cost.loop_cost > 70) {
            risks.push({
                type: "loop_overflow",
                severity: "high",
                description: "Loop capacity may be exceeded"
            });
        }
        
        if (cost.tone_conflict_score > 0.5) {
            risks.push({
                type: "tone_dissonance",
                severity: "medium",
                description: "Significant tone conflicts between agents"
            });
        }
        
        if (cost.total_agent_load > 0.85) {
            risks.push({
                type: "agent_burnout",
                severity: "high",
                description: "Agents approaching maximum capacity"
            });
        }
        
        if (decomposedModules.complexity_score > 0.8) {
            risks.push({
                type: "complexity_overload",
                severity: "medium",
                description: "High complexity may lead to integration issues"
            });
        }
        
        return risks;
    }
    
    generateRecommendations(cost, decomposedModules) {
        const recommendations = [];
        
        if (cost.feasibility_score < 0.5) {
            recommendations.push("Consider external delegation for complex modules");
        }
        
        if (cost.tone_conflict_score > 0.3) {
            recommendations.push("Implement tone harmonization layer");
        }
        
        if (cost.loop_cost > 60) {
            recommendations.push("Break into smaller, phased builds");
        }
        
        if (cost.total_agent_load > 0.7) {
            recommendations.push("Wait for agent capacity to free up");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Green light for internal build");
        }
        
        return recommendations;
    }
    
    generateMythicAssessment(cost, decomposedModules) {
        const feasibility = cost.feasibility_score;
        const risks = cost.risk_factors.length;
        
        if (feasibility > 0.8 && risks === 0) {
            return "The stars align. The agents stand ready. The loops hum with anticipation.";
        } else if (feasibility > 0.6) {
            return "The path is clear, though shadows linger. Proceed with wisdom.";
        } else if (feasibility > 0.4) {
            return "The agents strain against their bonds. Consider calling upon external allies.";
        } else {
            return "The weight is too great for our current form. Seek help beyond these walls.";
        }
    }
}

// Export for use in the build-market system
module.exports = AgentBuildCostEngine;

// Allow direct execution for testing
if (require.main === module) {
    const engine = new AgentBuildCostEngine();
    const IdeaDecomposerDaemon = require('./IdeaDecomposerDaemon');
    const decomposer = new IdeaDecomposerDaemon();
    
    async function test() {
        console.log("🧪 Testing AgentBuildCostEngine...\n");
        
        const idea = "ambient emotion-based time tracker";
        const decomposed = await decomposer.decomposeIdea(idea);
        const cost = await engine.calculateBuildCost(decomposed);
        
        console.log(`\n💰 Cost Analysis for: "${idea}"`);
        console.log(`   Loop cost: ${cost.loop_cost} units`);
        console.log(`   Tone conflict: ${(cost.tone_conflict_score * 100).toFixed(0)}%`);
        console.log(`   Agent load: ${(cost.total_agent_load * 100).toFixed(0)}%`);
        console.log(`   Feasibility: ${(cost.feasibility_score * 100).toFixed(0)}%`);
        console.log(`\n   🎭 ${cost.mythic_assessment}`);
        
        if (cost.risk_factors.length > 0) {
            console.log(`\n   ⚠️  Risks:`);
            cost.risk_factors.forEach(risk => {
                console.log(`      - ${risk.description} (${risk.severity})`);
            });
        }
        
        console.log(`\n   📋 Recommendations:`);
        cost.recommendations.forEach(rec => {
            console.log(`      - ${rec}`);
        });
    }
    
    test();
}