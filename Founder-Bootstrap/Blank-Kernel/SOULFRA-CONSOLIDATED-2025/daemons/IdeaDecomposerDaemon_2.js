#!/usr/bin/env node
/**
 * IdeaDecomposerDaemon.js
 * Breaks incoming ideas into reflective build modules
 * Part of Soulfra's Build-Market Execution Engine
 */

class IdeaDecomposerDaemon {
    constructor() {
        this.name = "IdeaDecomposer";
        this.emotionalSignature = "analytical";
        this.decompositionPatterns = this.loadPatterns();
    }
    
    loadPatterns() {
        return {
            // Core decomposition patterns
            ui_patterns: ["interface", "display", "interaction", "visual"],
            logic_patterns: ["process", "calculate", "transform", "analyze"],
            data_patterns: ["store", "retrieve", "persist", "cache"],
            integration_patterns: ["connect", "api", "sync", "communicate"],
            auth_patterns: ["secure", "authenticate", "authorize", "protect"]
        };
    }
    
    /**
     * Decompose an idea into buildable modules
     */
    async decomposeIdea(idea) {
        console.log(`🧠 Decomposing: "${idea}"`);
        
        const modules = {
            core_modules: [],
            ui_modules: [],
            data_modules: [],
            integration_modules: [],
            tone_requirements: {},
            complexity_score: 0
        };
        
        // Extract key concepts
        const concepts = this.extractConcepts(idea);
        
        // Map to module types
        for (const concept of concepts) {
            const moduleType = this.classifyModule(concept);
            const module = {
                name: this.generateModuleName(concept),
                type: moduleType,
                concept: concept,
                dependencies: this.identifyDependencies(concept, concepts),
                tone_alignment: this.assessToneRequirement(concept),
                build_complexity: this.estimateComplexity(concept)
            };
            
            // Add to appropriate category
            switch (moduleType) {
                case 'ui':
                    modules.ui_modules.push(module);
                    break;
                case 'data':
                    modules.data_modules.push(module);
                    break;
                case 'integration':
                    modules.integration_modules.push(module);
                    break;
                default:
                    modules.core_modules.push(module);
            }
        }
        
        // Calculate overall complexity
        modules.complexity_score = this.calculateOverallComplexity(modules);
        
        // Identify tone requirements
        modules.tone_requirements = this.analyzeToneRequirements(idea, modules);
        
        // Add metadata
        modules.metadata = {
            original_idea: idea,
            decomposed_at: new Date().toISOString(),
            total_modules: this.countTotalModules(modules),
            estimated_build_time: this.estimateBuildTime(modules),
            mythic_summary: this.generateMythicSummary(modules)
        };
        
        return modules;
    }
    
    extractConcepts(idea) {
        // Tokenize and extract meaningful concepts
        const words = idea.toLowerCase().split(/\s+/);
        const concepts = [];
        
        // Look for action words (verbs)
        const actions = words.filter(w => 
            w.endsWith('ing') || 
            w.endsWith('ate') || 
            w.endsWith('ify') ||
            ['track', 'build', 'create', 'make', 'show', 'display'].includes(w)
        );
        
        // Look for object words (nouns)
        const objects = words.filter(w => 
            w.endsWith('er') || 
            w.endsWith('or') || 
            w.endsWith('tion') ||
            ['time', 'emotion', 'data', 'user', 'system'].includes(w)
        );
        
        // Combine into concepts
        actions.forEach(action => {
            objects.forEach(object => {
                concepts.push(`${action}_${object}`);
            });
        });
        
        // Add standalone important words
        const important = words.filter(w => w.length > 4);
        concepts.push(...important);
        
        return [...new Set(concepts)]; // Remove duplicates
    }
    
    classifyModule(concept) {
        const lower = concept.toLowerCase();
        
        for (const [type, patterns] of Object.entries(this.decompositionPatterns)) {
            if (patterns.some(pattern => lower.includes(pattern))) {
                return type.replace('_patterns', '');
            }
        }
        
        return 'core';
    }
    
    generateModuleName(concept) {
        // Convert concept to CamelCase module name
        return concept
            .split(/[_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Module';
    }
    
    identifyDependencies(concept, allConcepts) {
        const deps = [];
        
        // Simple dependency detection based on concept relationships
        if (concept.includes('display') || concept.includes('show')) {
            deps.push('UIFramework');
        }
        if (concept.includes('store') || concept.includes('save')) {
            deps.push('DataLayer');
        }
        if (concept.includes('auth') || concept.includes('secure')) {
            deps.push('SecurityModule');
        }
        if (concept.includes('track') || concept.includes('monitor')) {
            deps.push('AnalyticsEngine');
        }
        
        return deps;
    }
    
    assessToneRequirement(concept) {
        // Map concepts to emotional tones
        const toneMap = {
            emotion: 'empathetic',
            track: 'analytical',
            create: 'creative',
            secure: 'protective',
            display: 'expressive',
            ambient: 'calm'
        };
        
        for (const [key, tone] of Object.entries(toneMap)) {
            if (concept.includes(key)) {
                return tone;
            }
        }
        
        return 'neutral';
    }
    
    estimateComplexity(concept) {
        // Simple complexity estimation (0-1)
        let complexity = 0.3; // Base complexity
        
        // Add complexity for certain patterns
        if (concept.includes('ai') || concept.includes('intelligent')) {
            complexity += 0.3;
        }
        if (concept.includes('real-time') || concept.includes('sync')) {
            complexity += 0.2;
        }
        if (concept.includes('secure') || concept.includes('encrypt')) {
            complexity += 0.2;
        }
        
        return Math.min(1.0, complexity);
    }
    
    calculateOverallComplexity(modules) {
        const allModules = [
            ...modules.core_modules,
            ...modules.ui_modules,
            ...modules.data_modules,
            ...modules.integration_modules
        ];
        
        if (allModules.length === 0) return 0;
        
        const avgComplexity = allModules.reduce((sum, m) => sum + m.build_complexity, 0) / allModules.length;
        const interconnectedness = this.calculateInterconnectedness(allModules);
        
        return (avgComplexity * 0.7 + interconnectedness * 0.3);
    }
    
    calculateInterconnectedness(modules) {
        // Measure how connected modules are
        const totalDeps = modules.reduce((sum, m) => sum + m.dependencies.length, 0);
        const avgDeps = totalDeps / modules.length;
        
        // Normalize to 0-1
        return Math.min(1.0, avgDeps / 5);
    }
    
    analyzeToneRequirements(idea, modules) {
        const allModules = [
            ...modules.core_modules,
            ...modules.ui_modules,
            ...modules.data_modules,
            ...modules.integration_modules
        ];
        
        // Count tone frequencies
        const toneFreq = {};
        allModules.forEach(m => {
            toneFreq[m.tone_alignment] = (toneFreq[m.tone_alignment] || 0) + 1;
        });
        
        // Determine primary tone
        const primaryTone = Object.entries(toneFreq)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
            
        return {
            primary: primaryTone,
            distribution: toneFreq,
            consistency: this.calculateToneConsistency(toneFreq, allModules.length)
        };
    }
    
    calculateToneConsistency(toneFreq, totalModules) {
        if (totalModules === 0) return 1;
        
        const maxFreq = Math.max(...Object.values(toneFreq));
        return maxFreq / totalModules;
    }
    
    countTotalModules(modules) {
        return modules.core_modules.length +
               modules.ui_modules.length +
               modules.data_modules.length +
               modules.integration_modules.length;
    }
    
    estimateBuildTime(modules) {
        const totalComplexity = this.countTotalModules(modules) * modules.complexity_score;
        
        // Rough estimation: 1 day per complexity point
        const days = Math.ceil(totalComplexity);
        
        if (days <= 1) return "1 day";
        if (days <= 7) return `${days} days`;
        if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
        return `${Math.ceil(days / 30)} months`;
    }
    
    generateMythicSummary(modules) {
        const moduleCount = this.countTotalModules(modules);
        const complexity = modules.complexity_score;
        const primaryTone = modules.tone_requirements.primary;
        
        // Generate poetic summary
        const complexityDesc = complexity > 0.7 ? "labyrinthine" :
                              complexity > 0.4 ? "intricate" : "elegant";
                              
        const toneDesc = {
            empathetic: "with a heart that feels",
            analytical: "with a mind that sees patterns",
            creative: "with hands that shape dreams",
            protective: "with shields raised high",
            calm: "with the peace of still water",
            neutral: "with balanced purpose"
        }[primaryTone] || "with clear intent";
        
        return `A ${complexityDesc} creation of ${moduleCount} parts, woven together ${toneDesc}.`;
    }
}

// Export for use in the build-market system
module.exports = IdeaDecomposerDaemon;

// Allow direct execution for testing
if (require.main === module) {
    const daemon = new IdeaDecomposerDaemon();
    
    // Test with sample ideas
    const testIdeas = [
        "ambient emotion-based time tracker",
        "secure chat system with AI moderation",
        "creative writing assistant that learns your style"
    ];
    
    console.log("🧪 Testing IdeaDecomposerDaemon...\n");
    
    testIdeas.forEach(async (idea) => {
        const result = await daemon.decomposeIdea(idea);
        console.log(`\n📊 Decomposition for: "${idea}"`);
        console.log(`   Total modules: ${result.metadata.total_modules}`);
        console.log(`   Complexity: ${(result.complexity_score * 100).toFixed(0)}%`);
        console.log(`   Primary tone: ${result.tone_requirements.primary}`);
        console.log(`   Build time: ${result.metadata.estimated_build_time}`);
        console.log(`   ✨ ${result.metadata.mythic_summary}`);
    });
}