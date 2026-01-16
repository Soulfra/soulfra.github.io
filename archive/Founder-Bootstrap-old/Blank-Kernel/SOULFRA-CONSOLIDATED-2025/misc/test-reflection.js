#!/usr/bin/env node

// Test script for the reflection engine
const ReflectionOrchestrator = require('./reflection-orchestrator');

async function testReflection() {
    console.log('🧪 Testing Cal\'s Reflection Engine\n');
    
    const orchestrator = new ReflectionOrchestrator();
    
    try {
        // Initialize the engine
        await orchestrator.initialize();
        
        // Sample documents for testing
        const testDocuments = [
            {
                filename: 'startup-lessons.md',
                path: 'test/startup-lessons.md',
                content: `
# Lessons from Failed Startups

Look, here's the thing about failing - it's not the romantic learning experience everyone makes it out to be. When my first startup crashed, I lost $50k of my own money and 18 months of my life. But here's what I actually learned:

## The Real Lessons

1. **Market validation is everything.** I built what I thought was cool, not what people would pay for. Classic founder mistake. Now I talk to 20 potential customers before writing a single line of code.

2. **Burn rate kills more startups than competition.** We had 8 months of runway but acted like we had 18. When you're down to 2 months, it's already too late. Keep that burn low until you have real revenue.

3. **Co-founder relationships are marriages.** My co-founder and I had different visions but never talked about it directly. That killed us faster than any competitor could have. Have the hard conversations early.

The bottom line? Failure taught me that success isn't about having the best idea - it's about executing on a good-enough idea with discipline and focus. That's what I'm doing differently this time.
                `
            },
            {
                filename: 'technical-guide.md',
                path: 'test/technical-guide.md',
                content: `
# Building Scalable APIs

## Introduction

This guide explains how to architect REST APIs that can handle millions of requests without breaking a sweat. We'll cover everything from basic principles to advanced optimization techniques.

## Core Principles

First, understand that scalability isn't just about handling more traffic. It's about building systems that grow efficiently with demand. Here's how:

### 1. Stateless Design

Every request should contain all information needed to process it. This allows horizontal scaling because any server can handle any request. Sessions should live in Redis or another distributed cache, not in server memory.

### 2. Database Optimization

The database is usually your bottleneck. Use read replicas for queries, implement proper indexing, and consider denormalizing data for read-heavy operations. Connection pooling is critical - don't open new connections for every request.

### 3. Caching Strategy

Implement caching at multiple levels:
- CDN for static assets
- Redis for session data and frequent queries  
- Application-level caching for computed results
- HTTP caching headers for client-side optimization

## Implementation Steps

To implement these principles:
1. Start with a simple monolith
2. Add caching layer when you hit 1000 RPS
3. Implement read replicas at 5000 RPS
4. Consider microservices only after 10,000 RPS

Remember: premature optimization is the root of all evil. Build simple, measure everything, optimize what actually matters.
                `
            },
            {
                filename: 'product-thoughts.txt',
                path: 'test/product-thoughts.txt',
                content: `
Random thoughts on product development after 10 years in the game...

The best products solve problems people don't even realize they have. Dropbox is the perfect example - nobody was asking for "cloud file sync" but everyone needed it.

Here's my framework for evaluating product ideas:

If the problem is real, frequent, and painful enough that people have cobbled together their own solutions, you're onto something. Look for the Excel spreadsheets, the email chains, the Post-it notes. That's where products are born.

Also, talk to users but don't listen to what they say they want. Watch what they actually do. The gap between stated preferences and revealed preferences is where insights live.

Speed matters more than perfection. Ship something embarrassing, get feedback, iterate. I've seen too many teams polish products nobody wants. Better to build the right thing wrong than the wrong thing right.

One more thing - your first version will suck and that's okay. Instagram started as Burbn, a check-in app. Twitter was a podcasting platform. The key is starting and learning. The product you end up with rarely resembles what you first imagined, and that's exactly how it should be.
                `
            }
        ];
        
        // Run reflection analysis
        console.log('📊 Analyzing documents...\n');
        const results = await orchestrator.reflectOnDocuments(testDocuments);
        
        // Display results
        console.log('='.repeat(60));
        console.log('REFLECTION RESULTS');
        console.log('='.repeat(60));
        console.log();
        
        // Summary
        console.log(`📋 ${results.summary.headline}`);
        console.log();
        console.log('Key Findings:');
        results.summary.keyFindings.forEach(finding => {
            console.log(`  ${finding}`);
        });
        console.log();
        
        // Cal's insight
        console.log('💬 Cal says:');
        console.log(`   "${results.summary.calSays}"`);
        console.log();
        
        // Document analysis
        console.log('📄 Document Analysis:');
        results.documents.forEach(doc => {
            if (!doc.error) {
                console.log(`\n  ${doc.path}:`);
                console.log(`    - Tone: ${doc.tone.analysis.dominantTone} (${Math.round(doc.tone.confidence * 100)}% confidence)`);
                console.log(`    - Reasoning: ${doc.reasoning.metadata.dominantPatterns.join(', ')}`);
                console.log(`    - Insights: ${doc.reasoning.insights.length} extracted`);
                console.log(`    - Suggested personality: ${doc.combined.agentPersonality.name}`);
            }
        });
        console.log();
        
        // Aggregate analysis
        console.log('🎯 Aggregate Analysis:');
        console.log(`  - Dominant tone: ${results.aggregateAnalysis.dominantTone}`);
        console.log(`  - Reasoning style: ${results.aggregateAnalysis.reasoningStyle}`);
        console.log(`  - Coherence score: ${Math.round(results.aggregateAnalysis.coherenceScore * 100)}%`);
        console.log(`  - Founder alignment: ${Math.round(results.aggregateAnalysis.founderAlignment * 100)}%`);
        console.log(`  - Document consistency: ${Math.round(results.aggregateAnalysis.documentConsistency * 100)}%`);
        console.log();
        
        // Cal insights
        console.log('💡 Cal\'s Insights:');
        results.calInsights.forEach((insight, i) => {
            console.log(`\n  ${i + 1}. [${insight.type.toUpperCase()}] ${insight.insight}`);
            if (insight.recommendation) {
                console.log(`     → ${insight.recommendation}`);
            }
            if (insight.confidence) {
                console.log(`     Confidence: ${Math.round(insight.confidence * 100)}%`);
            }
        });
        console.log();
        
        // Agent recommendations
        console.log('🤖 Agent Recommendations:');
        results.agentRecommendations.forEach((rec, i) => {
            console.log(`\n  ${i + 1}. ${rec.name}`);
            console.log(`     ${rec.description}`);
            if (rec.estimatedValue) {
                console.log(`     Value: ${rec.estimatedValue.tier} tier (${rec.estimatedValue.price})`);
            }
            if (rec.implementation) {
                console.log(`     Personality: ${rec.implementation.personality.name}`);
                console.log(`     Traits: ${rec.implementation.personality.traits.join(', ')}`);
            }
        });
        console.log();
        
        // Next steps
        console.log('⏭️  Next Steps:');
        results.summary.nextSteps.forEach((step, i) => {
            console.log(`  ${i + 1}. ${step.action} - ${step.description}`);
            console.log(`     [${step.cta}]`);
        });
        console.log();
        
        // Export examples
        console.log('📤 Export Options:');
        console.log('  1. JSON format - Full reflection data');
        console.log('  2. Markdown format - Human-readable report');
        console.log('  3. Agent config - Ready-to-deploy agent specification');
        console.log();
        
        // Save sample export
        const markdownExport = await orchestrator.exportReflection(results, 'markdown');
        console.log('📝 Sample Markdown Export:');
        console.log('-'.repeat(60));
        console.log(markdownExport.substring(0, 500) + '...');
        console.log('-'.repeat(60));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testReflection().catch(console.error);