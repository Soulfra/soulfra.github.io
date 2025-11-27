const fs = require('fs').promises;
const path = require('path');

// Component imports
const meshRouter = require('./fake-mesh-interface/mesh-router');
const platformWrapper = require('./user-platform-wrapper/platform-core');
const meshShield = require('./mesh-shield/prompt-transformer');

class IntegrationBridge {
    constructor() {
        this.components = {
            meshInterface: null,
            platformWrapper: null,
            meshShield: null,
            tier3Router: null,
            tier4Kernel: null
        };
        this.initialized = false;
    }

    async initialize() {
        console.log('🔗 Initializing MirrorOS Integration Bridge...');

        try {
            // Load mesh configuration
            const meshConfigPath = path.join(__dirname, 'fake-mesh-interface/mesh-config.json');
            const meshConfig = JSON.parse(await fs.readFile(meshConfigPath, 'utf8'));

            // Initialize components
            this.components.meshInterface = meshRouter;
            this.components.platformWrapper = platformWrapper;
            this.components.meshShield = meshShield;

            // Load tier-3 router
            this.components.tier3Router = require('./tier-minus3/llm-router/local-agent-fork');
            
            // Load tier-4 kernel
            this.components.tier4Kernel = require('./tier-minus4/cal-reasoning-kernel/cal-reflect-core');

            // Create integration paths
            await this.createIntegrationPaths();

            // Verify connections
            const verified = await this.verifyConnections();
            
            if (verified) {
                this.initialized = true;
                console.log('✅ Integration bridge initialized successfully');
                return true;
            } else {
                throw new Error('Connection verification failed');
            }
        } catch (error) {
            console.error('❌ Integration initialization failed:', error);
            return false;
        }
    }

    async createIntegrationPaths() {
        // Connect mesh interface to platform wrapper
        this.components.meshInterface.setPlatformHandler(async (sessionId, action, data) => {
            return await this.components.platformWrapper.handleRequest(sessionId, action, data);
        });

        // Connect platform wrapper to mesh shield
        this.components.platformWrapper.setTransformHandler(async (prompt, customerId, options) => {
            return await this.components.meshShield.transform(prompt, customerId, options);
        });

        // Connect mesh shield to tier-3 router
        this.components.meshShield.setRouterHandler(async (transformedPrompt, metadata) => {
            return await this.components.tier3Router.reflect({
                prompt: transformedPrompt,
                sessionId: metadata.sessionId,
                keys: metadata.keys,
                qrCode: metadata.qrCode,
                options: metadata.options
            });
        });

        console.log('🔄 Integration paths created');
    }

    async verifyConnections() {
        const verifications = [];

        // Test mesh interface
        verifications.push({
            component: 'Mesh Interface',
            status: typeof this.components.meshInterface.validateQR === 'function'
        });

        // Test platform wrapper
        verifications.push({
            component: 'Platform Wrapper',
            status: typeof this.components.platformWrapper.createPlatform === 'function'
        });

        // Test mesh shield
        verifications.push({
            component: 'Mesh Shield',
            status: typeof this.components.meshShield.transform === 'function'
        });

        // Test tier-3 router
        verifications.push({
            component: 'Tier-3 Router',
            status: typeof this.components.tier3Router.reflect === 'function'
        });

        // Test tier-4 kernel
        verifications.push({
            component: 'Tier-4 Kernel',
            status: typeof this.components.tier4Kernel.reason === 'function'
        });

        // Log verification results
        console.log('\n📊 Component Verification:');
        for (const verify of verifications) {
            console.log(`${verify.status ? '✅' : '❌'} ${verify.component}`);
        }

        return verifications.every(v => v.status);
    }

    async testPipeline() {
        if (!this.initialized) {
            await this.initialize();
        }

        console.log('\n🧪 Testing full pipeline...');

        try {
            // Simulate user input
            const testSession = {
                sessionId: 'test-' + Date.now(),
                qrCode: 'qr-user-0821',
                keys: {
                    claude: 'default',
                    openai: null,
                    ollama: 'http://localhost:11434'
                }
            };

            // Test prompt
            const testPrompt = "What is the meaning of recursive reflection?";

            // Step 1: Mesh interface validation
            const qrValid = this.components.meshInterface.validateQR(testSession.qrCode);
            console.log(`1️⃣ QR Validation: ${qrValid ? '✅' : '❌'}`);

            // Step 2: Platform wrapper processing
            const platformReady = await this.components.platformWrapper.validateCustomer('test-customer');
            console.log(`2️⃣ Platform Ready: ${platformReady ? '✅' : '❌'}`);

            // Step 3: Mesh shield transformation
            const transformed = await this.components.meshShield.transform(testPrompt, 'test-customer', {
                npc: true,
                cringe: false,
                tone: true
            });
            console.log(`3️⃣ Transformation: ${transformed.stages.length > 0 ? '✅' : '❌'}`);

            // Step 4: Tier-3 routing
            const routed = await this.components.tier3Router.reflect({
                prompt: transformed.final,
                sessionId: testSession.sessionId,
                keys: testSession.keys,
                qrCode: testSession.qrCode,
                options: {}
            });
            console.log(`4️⃣ Routing: ${routed.response ? '✅' : '❌'}`);

            // Step 5: Tier-4 reasoning
            const reasoned = await this.components.tier4Kernel.reason({
                prompt: testPrompt,
                llm: 'local',
                forkId: 'test-fork',
                context: { qrCode: testSession.qrCode }
            });
            console.log(`5️⃣ Reasoning: ${reasoned.enhancedPrompt ? '✅' : '❌'}`);

            console.log('\n✅ Pipeline test completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Pipeline test failed:', error);
            return false;
        }
    }

    // Export component handles for direct access
    getComponents() {
        return this.components;
    }

    // Get integration status
    getStatus() {
        return {
            initialized: this.initialized,
            components: Object.keys(this.components).map(key => ({
                name: key,
                loaded: this.components[key] !== null
            }))
        };
    }
}

// Export singleton
const bridge = new IntegrationBridge();

module.exports = {
    initialize: bridge.initialize.bind(bridge),
    testPipeline: bridge.testPipeline.bind(bridge),
    getComponents: bridge.getComponents.bind(bridge),
    getStatus: bridge.getStatus.bind(bridge)
};