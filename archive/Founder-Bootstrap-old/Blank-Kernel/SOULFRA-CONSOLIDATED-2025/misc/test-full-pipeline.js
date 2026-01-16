#!/usr/bin/env node

const integrationBridge = require('./integration-bridge');

async function testFullPipeline() {
    console.log('🧪 MirrorOS Full Pipeline Test');
    console.log('==============================\n');

    try {
        // Initialize integration bridge
        console.log('1️⃣ Initializing integration bridge...');
        const initialized = await integrationBridge.initialize();
        
        if (!initialized) {
            throw new Error('Failed to initialize integration bridge');
        }

        // Get system status
        console.log('\n2️⃣ System Status:');
        const status = integrationBridge.getStatus();
        console.log(JSON.stringify(status, null, 2));

        // Run pipeline test
        console.log('\n3️⃣ Running pipeline test...');
        const testResult = await integrationBridge.testPipeline();
        
        if (!testResult) {
            throw new Error('Pipeline test failed');
        }

        // Test specific flows
        console.log('\n4️⃣ Testing specific flows:');
        
        // Test A: Direct reflection
        console.log('\n🔹 Test A: Direct Reflection');
        await testDirectReflection();
        
        // Test B: Platform creation
        console.log('\n🔹 Test B: Platform Creation');
        await testPlatformCreation();
        
        // Test C: Transformation pipeline
        console.log('\n🔹 Test C: Transformation Pipeline');
        await testTransformationPipeline();

        console.log('\n✅ All tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- Integration bridge: ✅');
        console.log('- Full pipeline: ✅');
        console.log('- Direct reflection: ✅');
        console.log('- Platform creation: ✅');
        console.log('- Transformation: ✅');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function testDirectReflection() {
    const components = integrationBridge.getComponents();
    const tier3Router = components.tier3Router;
    
    const result = await tier3Router.reflect({
        prompt: 'Test direct reflection',
        sessionId: 'test-direct',
        keys: { claude: 'default' },
        qrCode: 'qr-user-0821',
        options: {}
    });
    
    console.log(`   Response length: ${result.response.length}`);
    console.log(`   LLM used: ${result.metadata.llm}`);
}

async function testPlatformCreation() {
    const components = integrationBridge.getComponents();
    const platformWrapper = components.platformWrapper;
    
    const result = await platformWrapper.createPlatform('test-customer', {
        name: 'Test Platform',
        theme: 'dark',
        features: ['reflection', 'vault']
    });
    
    console.log(`   Platform created: ${result.success ? '✅' : '❌'}`);
    if (result.platformId) {
        console.log(`   Platform ID: ${result.platformId}`);
    }
}

async function testTransformationPipeline() {
    const components = integrationBridge.getComponents();
    const meshShield = components.meshShield;
    
    const result = await meshShield.transform('Transform this prompt', 'test-customer', {
        npc: true,
        cringe: true,
        tone: true
    });
    
    console.log(`   Transformation stages: ${result.stages.length}`);
    console.log(`   Final length: ${result.final.length}`);
    console.log(`   Compression ratio: ${result.metadata.compressionRatio.toFixed(2)}`);
}

// Run tests if executed directly
if (require.main === module) {
    testFullPipeline().catch(console.error);
}

module.exports = { testFullPipeline };