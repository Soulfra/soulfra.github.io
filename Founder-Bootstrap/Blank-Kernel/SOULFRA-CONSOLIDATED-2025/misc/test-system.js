/**
 * Mirror Kernel - System Test
 * Verifies the complete implementation is working
 */

const { EmotionalTruthLayer } = require('./emotional-truth-layer/core-system');
const { getMasterKeySystem } = require('./private-keys/key-management');

async function runTests() {
    console.log('🧪 MIRROR KERNEL SYSTEM TEST');
    console.log('============================\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Emotional Truth Layer
    try {
        console.log('Testing Emotional Truth Layer...');
        const emotional = new EmotionalTruthLayer();
        await emotional.initialize();
        
        const testContent = "I love how technology can bring people together and create meaningful connections!";
        const result = await emotional.processContent(testContent);
        
        if (result.emotional && result.truth && result.fun && result.connection) {
            console.log('✅ Emotional Truth Layer: WORKING');
            console.log(`   Empathy: ${(result.emotional.empathyScore * 100).toFixed(0)}%`);
            console.log(`   Truth: ${(result.truth.score * 100).toFixed(0)}%`);
            console.log(`   Fun: ${(result.fun.level * 100).toFixed(0)}%`);
            results.passed++;
        } else {
            throw new Error('Missing expected properties');
        }
    } catch (error) {
        console.log('❌ Emotional Truth Layer: FAILED');
        console.log(`   Error: ${error.message}`);
        results.failed++;
    }
    
    // Test 2: Truth Detection
    try {
        console.log('\nTesting Truth Detection...');
        const emotional = new EmotionalTruthLayer();
        
        // Test genuine content
        const genuine = await emotional.processContent("I honestly feel grateful for this community");
        const genuineScore = genuine.truth.score;
        
        // Test manipulative content  
        const manipulative = await emotional.processContent("You MUST buy this NOW! Limited time! Everyone is doing it!");
        const manipScore = manipulative.truth.score;
        
        if (genuineScore > manipScore) {
            console.log('✅ Truth Detection: WORKING');
            console.log(`   Genuine score: ${(genuineScore * 100).toFixed(0)}%`);
            console.log(`   Manipulative score: ${(manipScore * 100).toFixed(0)}%`);
            results.passed++;
        } else {
            throw new Error('Truth detection not differentiating correctly');
        }
    } catch (error) {
        console.log('❌ Truth Detection: FAILED');
        console.log(`   Error: ${error.message}`);
        results.failed++;
    }
    
    // Test 3: Fun Optimization
    try {
        console.log('\nTesting Fun Optimization...');
        const emotional = new EmotionalTruthLayer();
        
        // Test boring content
        const boring = await emotional.processContent("Pursuant to the aforementioned regulations, whereas the party of the first part...");
        const boringScore = boring.fun.level;
        
        // Test fun content
        const fun = await emotional.processContent("Wow! This is amazing! I'm so excited to share this with everyone! 😊");
        const funScore = fun.fun.level;
        
        if (funScore > boringScore) {
            console.log('✅ Fun Optimization: WORKING');
            console.log(`   Fun score: ${(funScore * 100).toFixed(0)}%`);
            console.log(`   Boring score: ${(boringScore * 100).toFixed(0)}%`);
            results.passed++;
        } else {
            throw new Error('Fun detection not working correctly');
        }
    } catch (error) {
        console.log('❌ Fun Optimization: FAILED');
        console.log(`   Error: ${error.message}`);
        results.failed++;
    }
    
    // Test 4: Connection Building
    try {
        console.log('\nTesting Connection Building...');
        const emotional = new EmotionalTruthLayer();
        
        // Test connecting content
        const connecting = await emotional.processContent("We're all in this together, supporting each other through shared experiences");
        const connectScore = connecting.connection.score;
        
        // Test isolating content
        const isolating = await emotional.processContent("You must do this alone. Nobody understands.");
        const isolateScore = isolating.connection.score;
        
        if (connectScore > isolateScore) {
            console.log('✅ Connection Building: WORKING');
            console.log(`   Connecting score: ${(connectScore * 100).toFixed(0)}%`);
            console.log(`   Isolating score: ${(isolateScore * 100).toFixed(0)}%`);
            results.passed++;
        } else {
            throw new Error('Connection detection not working correctly');
        }
    } catch (error) {
        console.log('❌ Connection Building: FAILED');
        console.log(`   Error: ${error.message}`);
        results.failed++;
    }
    
    // Test 5: Key System (without initialization)
    try {
        console.log('\nTesting Key System Structure...');
        const keySystem = getMasterKeySystem();
        
        if (keySystem && keySystem.paths && keySystem.keystore !== undefined) {
            console.log('✅ Key System: STRUCTURE VALID');
            console.log('   Note: Run init-system.js to initialize keys');
            results.passed++;
        } else {
            throw new Error('Key system structure invalid');
        }
    } catch (error) {
        console.log('❌ Key System: FAILED');
        console.log(`   Error: ${error.message}`);
        results.failed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(40));
    console.log('TEST SUMMARY:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.passed + results.failed}`);
    
    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Mirror Kernel is working correctly.');
        console.log('\nNext step: Run `node init-system.js` to initialize your keys.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above.');
    }
    
    return results;
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };