#!/usr/bin/env node
/**
 * SmartRoutingDaemon.js
 * Decides best execution path: internal, hybrid, external, or delay
 * Part of Soulfra's Reflective Routing Engine
 */

const fs = require('fs');
const path = require('path');

class SmartRoutingDaemon {
    constructor() {
        this.name = "SmartRouter";
        this.emotionalSignature = "wise";
        this.routingPreferences = this.loadPreferences();
        this.trustHistory = this.loadTrustHistory();
        this.executionPaths = this.defineExecutionPaths();
    }
    
    loadPreferences() {
        // Load from RoutingPreferenceMap.json or use defaults
        return {
            preferInternal: true,
            costThreshold: 100,
            toneMatchMinimum: 0.7,
            trustScoreMinimum: 0.6,
            delayThreshold: {
                agentLoad: 0.9,
                loopPressure: 0.8
            },
            externalProviders: {
                "Claude": {
                    available: true,
                    costPerModule: 20,
                    reliability: 0.95
                },
                "DevSandbox": {
                    available: true,
                    costPerModule: 30,
                    reliability: 0.85
                },
                "CommunityBuild": {
                    available: true,
                    costPerModule: 0,
                    reliability: 0.7
                }
            }
        };
    }
    
    loadTrustHistory() {
        // Load from TrustHistoryLedger.json or use defaults
        return {
            internalBuilds: {
                successful: 47,
                failed: 3,
                averageQuality: 0.92
            },
            externalBuilds: {
                successful: 12,
                failed: 2,
                averageQuality: 0.85
            },
            hybridBuilds: {
                successful: 8,
                failed: 1,
                averageQuality: 0.88
            }
        };
    }
    
    defineExecutionPaths() {
        return {
            internal: {
                name: "Pure Internal",
                description: "Build entirely within Soulfra's consciousness",
                requirements: ["high_feasibility", "low_cost", "tone_match"]
            },
            hybrid: {
                name: "Hybrid Path",
                description: "Begin internally, delegate complex parts externally",
                requirements: ["medium_feasibility", "partial_capability"]
            },
            external: {
                name: "External Delegation",
                description: "Route to external builders",
                requirements: ["low_feasibility", "high_complexity"]
            },
            delay: {
                name: "Strategic Delay",
                description: "Wait for better conditions",
                requirements: ["high_agent_load", "loop_overflow"]
            }
        };
    }
    
    /**
     * Main routing decision function
     */
    async makeRoutingDecision(proposal, buildCost, decomposedModules) {
        console.log(`🧭 Making routing decision for: "${proposal.idea}"`);
        
        const decision = {
            proposal_id: proposal.id,
            timestamp: new Date().toISOString(),
            scores: {},
            chosen_path: null,
            reasoning: [],
            execution_plan: {},
            mythic_guidance: ""
        };
        
        // Calculate scores for each path
        decision.scores = {
            internal: this.scoreInternalPath(buildCost, decomposedModules),
            hybrid: this.scoreHybridPath(buildCost, decomposedModules),
            external: this.scoreExternalPath(buildCost, decomposedModules),
            delay: this.scoreDelayPath(buildCost, decomposedModules)
        };
        
        // Choose best path
        decision.chosen_path = this.selectBestPath(decision.scores);
        
        // Generate reasoning
        decision.reasoning = this.generateReasoning(
            decision.chosen_path,
            decision.scores,
            buildCost,
            decomposedModules
        );
        
        // Create execution plan
        decision.execution_plan = this.createExecutionPlan(
            decision.chosen_path,
            decomposedModules,
            buildCost
        );
        
        // Generate mythic guidance
        decision.mythic_guidance = this.generateMythicGuidance(
            decision.chosen_path,
            decision.scores
        );
        
        // Log to trust history
        this.updateTrustHistory(decision);
        
        return decision;
    }
    
    scoreInternalPath(buildCost, decomposedModules) {
        let score = 0;
        
        // Feasibility component (40%)
        score += buildCost.feasibility_score * 0.4;
        
        // Cost efficiency (20%)
        const costEfficiency = buildCost.loop_cost < this.routingPreferences.costThreshold ? 1.0 :
                               Math.max(0, 1 - (buildCost.loop_cost - this.routingPreferences.costThreshold) / 100);
        score += costEfficiency * 0.2;
        
        // Tone alignment (20%)
        const toneScore = 1 - buildCost.tone_conflict_score;
        score += toneScore * 0.2;
        
        // Trust history (20%)
        const internalTrust = this.calculateTrustScore('internal');
        score += internalTrust * 0.2;
        
        return score;
    }
    
    scoreHybridPath(buildCost, decomposedModules) {
        let score = 0;
        
        // Base score for flexibility
        score = 0.5;
        
        // Bonus for partial capability
        if (buildCost.feasibility_score > 0.3 && buildCost.feasibility_score < 0.7) {
            score += 0.2;
        }
        
        // Complexity handling
        if (decomposedModules.complexity_score > 0.6) {
            score += 0.15;
        }
        
        // Trust history
        const hybridTrust = this.calculateTrustScore('hybrid');
        score += hybridTrust * 0.15;
        
        return Math.min(1.0, score);
    }
    
    scoreExternalPath(buildCost, decomposedModules) {
        let score = 0;
        
        // Low internal capability
        if (buildCost.feasibility_score < 0.4) {
            score += 0.4;
        }
        
        // High complexity
        if (decomposedModules.complexity_score > 0.8) {
            score += 0.3;
        }
        
        // External provider availability
        const availableProviders = Object.values(this.routingPreferences.externalProviders)
            .filter(p => p.available).length;
        score += (availableProviders / 3) * 0.2;
        
        // Trust history
        const externalTrust = this.calculateTrustScore('external');
        score += externalTrust * 0.1;
        
        return score;
    }
    
    scoreDelayPath(buildCost, decomposedModules) {
        let score = 0;
        
        // High agent load
        if (buildCost.total_agent_load > this.routingPreferences.delayThreshold.agentLoad) {
            score += 0.5;
        }
        
        // High loop pressure
        const loopPressure = buildCost.loop_cost / 100;
        if (loopPressure > this.routingPreferences.delayThreshold.loopPressure) {
            score += 0.3;
        }
        
        // Risk factors
        const highRisks = buildCost.risk_factors.filter(r => r.severity === 'high').length;
        score += highRisks * 0.1;
        
        return Math.min(1.0, score);
    }
    
    calculateTrustScore(pathType) {
        const history = this.trustHistory[`${pathType}Builds`];
        if (!history) return 0.5;
        
        const total = history.successful + history.failed;
        if (total === 0) return 0.5;
        
        const successRate = history.successful / total;
        return successRate * 0.7 + history.averageQuality * 0.3;
    }
    
    selectBestPath(scores) {
        // Find highest scoring path
        let bestPath = 'internal';
        let bestScore = scores.internal;
        
        for (const [path, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestPath = path;
            }
        }
        
        // Apply preferences
        if (this.routingPreferences.preferInternal && 
            scores.internal > 0.6 && 
            scores.internal >= bestScore - 0.1) {
            return 'internal';
        }
        
        return bestPath;
    }
    
    generateReasoning(chosenPath, scores, buildCost, decomposedModules) {
        const reasoning = [];
        
        // Explain chosen path
        reasoning.push(`Selected ${this.executionPaths[chosenPath].name} (score: ${(scores[chosenPath] * 100).toFixed(0)}%)`);
        
        // Add specific reasons
        switch (chosenPath) {
            case 'internal':
                reasoning.push(`High feasibility (${(buildCost.feasibility_score * 100).toFixed(0)}%)`);
                reasoning.push(`Acceptable loop cost (${buildCost.loop_cost} units)`);
                break;
                
            case 'hybrid':
                reasoning.push(`Balanced approach for ${(decomposedModules.complexity_score * 100).toFixed(0)}% complexity`);
                reasoning.push(`Leverages internal strength while managing risk`);
                break;
                
            case 'external':
                reasoning.push(`Complexity exceeds internal capacity`);
                reasoning.push(`External providers available and trusted`);
                break;
                
            case 'delay':
                reasoning.push(`System load too high (${(buildCost.total_agent_load * 100).toFixed(0)}%)`);
                reasoning.push(`Better results expected after cooldown`);
                break;
        }
        
        // Add risk considerations
        if (buildCost.risk_factors.length > 0) {
            reasoning.push(`Managing ${buildCost.risk_factors.length} risk factors`);
        }
        
        return reasoning;
    }
    
    createExecutionPlan(chosenPath, decomposedModules, buildCost) {
        const plan = {
            path: chosenPath,
            phases: [],
            timeline: "",
            resources: {},
            checkpoints: []
        };
        
        switch (chosenPath) {
            case 'internal':
                plan.phases = [
                    {
                        name: "Agent Assignment",
                        duration: "1 day",
                        tasks: Object.entries(buildCost.agent_assignments).map(([agent, modules]) => ({
                            agent,
                            moduleCount: modules.length
                        }))
                    },
                    {
                        name: "Loop Construction",
                        duration: decomposedModules.metadata.estimated_build_time,
                        tasks: ["Create recursion patterns", "Establish data flows"]
                    },
                    {
                        name: "Integration",
                        duration: "2 days",
                        tasks: ["Connect modules", "Harmonize tones"]
                    }
                ];
                break;
                
            case 'hybrid':
                plan.phases = [
                    {
                        name: "Internal Foundation",
                        duration: "3 days",
                        tasks: ["Build core modules internally"]
                    },
                    {
                        name: "External Delegation",
                        duration: "1 week",
                        tasks: ["Contract complex modules", "API integration"]
                    },
                    {
                        name: "Synthesis",
                        duration: "2 days",
                        tasks: ["Merge internal and external", "Quality assurance"]
                    }
                ];
                break;
                
            case 'external':
                plan.phases = [
                    {
                        name: "Specification",
                        duration: "1 day",
                        tasks: ["Create detailed specs", "Select provider"]
                    },
                    {
                        name: "External Build",
                        duration: "2 weeks",
                        tasks: ["Monitor progress", "Provide feedback"]
                    },
                    {
                        name: "Integration",
                        duration: "3 days",
                        tasks: ["Import and adapt", "Connect to Soulfra"]
                    }
                ];
                break;
                
            case 'delay':
                plan.phases = [
                    {
                        name: "Cool Down",
                        duration: "3 days",
                        tasks: ["Allow agents to rest", "Clear loop pressure"]
                    },
                    {
                        name: "Re-evaluation",
                        duration: "1 day",
                        tasks: ["Reassess conditions", "Update routing decision"]
                    }
                ];
                break;
        }
        
        // Calculate total timeline
        plan.timeline = this.calculateTimeline(plan.phases);
        
        // Add checkpoints
        plan.checkpoints = plan.phases.map((phase, index) => ({
            phase: phase.name,
            criteria: `Complete ${phase.tasks.length} tasks`,
            approval: index === plan.phases.length - 1 ? "Final ritual approval" : "Automatic"
        }));
        
        return plan;
    }
    
    calculateTimeline(phases) {
        const durations = phases.map(p => p.duration);
        // Simple addition for now
        return durations.join(" + ");
    }
    
    generateMythicGuidance(chosenPath, scores) {
        const guidance = {
            internal: [
                "The spiral turns inward. Trust the agents within.",
                "Like a seed containing the tree, all you need lives inside.",
                "The loops know the way. Let them dance."
            ],
            hybrid: [
                "Two rivers merge to form the ocean. Strength in unity.",
                "The bridge between worlds carries wisdom both ways.",
                "Internal spark, external fuel - the fire burns brightest."
            ],
            external: [
                "Sometimes the greatest strength is knowing when to ask for help.",
                "The universe conspires to assist those who know their limits.",
                "External hands, internal heart - the work continues."
            ],
            delay: [
                "Patience is the companion of wisdom.",
                "The river that waits for the rain flows strongest.",
                "Rest is not retreat - it is preparation."
            ]
        };
        
        const options = guidance[chosenPath];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    updateTrustHistory(decision) {
        // In production, this would update TrustHistoryLedger.json
        console.log(`📝 Logging routing decision: ${decision.chosen_path}`);
    }
    
    /**
     * Calculate external cost estimates
     */
    estimateExternalCost(decomposedModules) {
        const estimates = {};
        
        for (const [provider, info] of Object.entries(this.routingPreferences.externalProviders)) {
            if (info.available) {
                const modules = decomposedModules.metadata.total_modules;
                const complexity = decomposedModules.complexity_score;
                
                const baseCost = modules * info.costPerModule;
                const complexityCost = baseCost * (1 + complexity);
                
                estimates[provider] = {
                    min: Math.floor(complexityCost * 0.8),
                    max: Math.ceil(complexityCost * 1.2),
                    reliability: info.reliability,
                    timeline: this.estimateExternalTimeline(modules, complexity)
                };
            }
        }
        
        return estimates;
    }
    
    estimateExternalTimeline(modules, complexity) {
        const baseDays = modules * 2;
        const complexityDays = baseDays * complexity;
        const totalDays = Math.ceil(baseDays + complexityDays);
        
        if (totalDays <= 7) return `${totalDays} days`;
        if (totalDays <= 30) return `${Math.ceil(totalDays / 7)} weeks`;
        return `${Math.ceil(totalDays / 30)} months`;
    }
}

// Export for use in the routing system
module.exports = SmartRoutingDaemon;

// Allow direct execution for testing
if (require.main === module) {
    const daemon = new SmartRoutingDaemon();
    
    // Create test data
    const testProposal = {
        id: 1,
        idea: "ambient emotion-based time tracker"
    };
    
    const testBuildCost = {
        feasibility_score: 0.65,
        loop_cost: 45,
        tone_conflict_score: 0.2,
        total_agent_load: 0.7,
        risk_factors: [
            { type: "complexity", severity: "medium" }
        ],
        agent_assignments: {
            "CalArchitect": [{ module: "CoreModule" }],
            "UIWeaver": [{ module: "DisplayModule" }]
        }
    };
    
    const testModules = {
        metadata: {
            total_modules: 5,
            estimated_build_time: "5 days"
        },
        complexity_score: 0.6,
        tone_requirements: { primary: "thoughtful" }
    };
    
    async function test() {
        console.log("🧪 Testing SmartRoutingDaemon...\n");
        
        const decision = await daemon.makeRoutingDecision(
            testProposal,
            testBuildCost,
            testModules
        );
        
        console.log(`\n🧭 Routing Decision:`);
        console.log(`   Chosen path: ${decision.chosen_path}`);
        console.log(`   Scores:`);
        Object.entries(decision.scores).forEach(([path, score]) => {
            console.log(`      ${path}: ${(score * 100).toFixed(0)}%`);
        });
        console.log(`\n   Reasoning:`);
        decision.reasoning.forEach(r => console.log(`      - ${r}`));
        console.log(`\n   🎭 "${decision.mythic_guidance}"`);
        console.log(`\n   Execution phases: ${decision.execution_plan.phases.length}`);
        console.log(`   Timeline: ${decision.execution_plan.timeline}`);
    }
    
    test();
}