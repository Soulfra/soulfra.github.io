// Test script for obfuscation layers

import PromptObfuscator from './layers/obfuscation/prompt/index.js';
import ContextObfuscator from './layers/obfuscation/context/index.js';
import ResponseObfuscator from './layers/obfuscation/response/index.js';

async function testObfuscationLayers() {
    console.log('🧪 Testing obfuscation layers...');
    
    // Test prompt obfuscation
    const promptObfuscator = new PromptObfuscator();
    const promptResult = await promptObfuscator.obfuscate(
        "Hi, my name is John and my email is john@example.com. How should I price Soulfra?",
        123
    );
    console.log('📝 Prompt obfuscation test:', promptResult);
    
    // Test context obfuscation
    const contextObfuscator = new ContextObfuscator();
    const contextResult = await contextObfuscator.obfuscateContext(
        {
            user_context: { trust_score: 85, tier: 'premium' },
            system_context: { layer1_active: true, cal_riven_status: 'active' }
        },
        { interaction_count: 5, trust_score: 85 }
    );
    console.log('🔄 Context obfuscation test:', contextResult);
    
    // Test response obfuscation
    const responseObfuscator = new ResponseObfuscator();
    const responseResult = await responseObfuscator.obfuscateResponse(
        {
            response: "Based on Soulfra's CAL RIVEN analysis, your competitive advantage is the proprietary bootstrap approach.",
            cost: 0.001
        },
        { tier: 'premium' }
    );
    console.log('📤 Response obfuscation test:', responseResult);
    
    console.log('✅ All obfuscation layers working!');
}

testObfuscationLayers().catch(console.error);
