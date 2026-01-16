#!/usr/bin/env node
/**
 * Claude Prompt Decomposer
 * Splits large generation requests into smaller, runtime-safe chunks
 */

const fs = require('fs');
const path = require('path');

class ClaudePromptSplitter {
    constructor() {
        this.maxTokensPerPrompt = 4000; // Safe limit for Claude
        this.outputDir = './decomposed_prompts';
        this.ledgerPath = './ledger/design_reflections.json';
        
        // Ensure directories exist
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        const dirs = [
            this.outputDir,
            './ledger',
            './tasks/resolved'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * Main decomposition function
     */
    decomposePrompt(originalPrompt, components) {
        const sessionId = `session_${Date.now()}`;
        const prompts = [];
        
        // 1. Initial Context Prompt
        prompts.push({
            id: `${sessionId}_context`,
            type: 'context',
            prompt: this.createContextPrompt(originalPrompt, components),
            order: 0
        });
        
        // 2. Component Prompts
        components.forEach((component, index) => {
            prompts.push({
                id: `${sessionId}_${component.name}`,
                type: 'component',
                prompt: this.createComponentPrompt(component, sessionId),
                order: index + 1,
                outputPath: component.outputPath
            });
        });
        
        // 3. Final Stitching Prompt
        prompts.push({
            id: `${sessionId}_stitch`,
            type: 'stitch',
            prompt: this.createStitchPrompt(sessionId, components),
            order: components.length + 1
        });
        
        // Save decomposed prompts
        this.savePrompts(sessionId, prompts);
        
        // Create execution plan
        this.createExecutionPlan(sessionId, prompts);
        
        return {
            sessionId,
            prompts,
            executionPlan: `${this.outputDir}/${sessionId}/execution_plan.json`
        };
    }
    
    createContextPrompt(original, components) {
        return `## Initial Context for Multi-Part Generation

Original Request: "${original}"

This will be generated in ${components.length + 2} parts:
${components.map((c, i) => `${i + 1}. ${c.description}`).join('\n')}

Please acknowledge this plan and prepare for component generation.

Session Context:
- Each component will reference previous outputs
- Final output will be stitched together
- Maintain consistency across all parts`;
    }
    
    createComponentPrompt(component, sessionId) {
        return `## Component Generation: ${component.name}

Session: ${sessionId}
Previous outputs are available in context.

Task: ${component.description}

Requirements:
${component.requirements.map(r => `- ${r}`).join('\n')}

Output Format:
- File path: ${component.outputPath}
- Type: ${component.type}
- Must be complete and functional
- Reference previous components if needed

Generate only this component now.`;
    }
    
    createStitchPrompt(sessionId, components) {
        return `## Final Stitching and Reflection

Session: ${sessionId}

All components have been generated:
${components.map(c => `- ${c.outputPath}`).join('\n')}

Tasks:
1. Verify all components work together
2. Create integration test: /tasks/resolved/${sessionId}_test.js
3. Add reflection entry to /ledger/design_reflections.json

Reflection should include:
- Session ID
- Components created
- Integration notes
- Any warnings or considerations`;
    }
    
    savePrompts(sessionId, prompts) {
        const sessionDir = path.join(this.outputDir, sessionId);
        fs.mkdirSync(sessionDir, { recursive: true });
        
        // Save individual prompts
        prompts.forEach(prompt => {
            const filename = `${prompt.order}_${prompt.type}.txt`;
            fs.writeFileSync(
                path.join(sessionDir, filename),
                prompt.prompt
            );
        });
        
        // Save full session data
        fs.writeFileSync(
            path.join(sessionDir, 'session.json'),
            JSON.stringify({ sessionId, prompts }, null, 2)
        );
    }
    
    createExecutionPlan(sessionId, prompts) {
        const plan = {
            sessionId,
            created: new Date().toISOString(),
            status: 'pending',
            prompts: prompts.map(p => ({
                id: p.id,
                type: p.type,
                order: p.order,
                status: 'pending',
                outputPath: p.outputPath || null
            })),
            execution: {
                mode: 'sequential',
                pauseBetween: true,
                saveIntermediateOutputs: true
            }
        };
        
        fs.writeFileSync(
            path.join(this.outputDir, sessionId, 'execution_plan.json'),
            JSON.stringify(plan, null, 2)
        );
    }
    
    /**
     * Execute a saved session
     */
    async executeSession(sessionId) {
        const sessionDir = path.join(this.outputDir, sessionId);
        const plan = JSON.parse(
            fs.readFileSync(path.join(sessionDir, 'execution_plan.json'), 'utf8')
        );
        
        console.log(`Executing session: ${sessionId}`);
        console.log(`Total prompts: ${plan.prompts.length}`);
        
        // This would integrate with Claude API
        // For now, we just prepare the structure
        
        for (const prompt of plan.prompts) {
            console.log(`\nReady to execute: ${prompt.type} (order: ${prompt.order})`);
            console.log(`Output to: ${prompt.outputPath || 'console'}`);
            
            // Mark as ready for manual execution
            prompt.status = 'ready';
        }
        
        // Update plan
        plan.status = 'ready_for_execution';
        fs.writeFileSync(
            path.join(sessionDir, 'execution_plan.json'),
            JSON.stringify(plan, null, 2)
        );
        
        return plan;
    }
}

// Example usage
function exampleWorldRouterSplit() {
    const splitter = new ClaudePromptSplitter();
    
    const originalPrompt = "Generate core router, loop bridges, and agent scene simulators for the mythic engine";
    
    const components = [
        {
            name: "CalWorldRouter",
            description: "Core router that observes all surfaces and routes users",
            outputPath: "/core_router/CalWorldRouter.js",
            type: "javascript",
            requirements: [
                "Observe mood_state.json, loop_active.json, agent_signature.json",
                "Route based on attunement, agent match, loop pressure",
                "Include Cal's decision logic"
            ]
        },
        {
            name: "LoopReflectionBridge", 
            description: "Bridge that makes all surfaces aware of each other",
            outputPath: "/bridges/LoopReflectionBridge.js",
            type: "javascript",
            requirements: [
                "Expose shared session_state.json",
                "Allow read/write of loop tone and drift",
                "Connect to CalWorldRouter"
            ]
        },
        {
            name: "WorldManifest",
            description: "Define all game surfaces and their conditions",
            outputPath: "/worlds/world_manifest.json",
            type: "json",
            requirements: [
                "Include entry/exit conditions for each world",
                "Define agent presence",
                "Specify mood triggers"
            ]
        }
    ];
    
    return splitter.decomposePrompt(originalPrompt, components);
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'example') {
        const result = exampleWorldRouterSplit();
        console.log('Decomposition complete!');
        console.log(`Session ID: ${result.sessionId}`);
        console.log(`Prompts generated: ${result.prompts.length}`);
        console.log(`Execution plan: ${result.executionPlan}`);
        
    } else if (args[0] === 'execute' && args[1]) {
        const splitter = new ClaudePromptSplitter();
        splitter.executeSession(args[1]).then(plan => {
            console.log('\nSession ready for execution');
            console.log('Run each prompt file in order');
        });
        
    } else {
        console.log('Usage:');
        console.log('  node ClaudePromptSplitter.js example     - Run example decomposition');
        console.log('  node ClaudePromptSplitter.js execute <sessionId> - Prepare session for execution');
    }
}

module.exports = ClaudePromptSplitter;