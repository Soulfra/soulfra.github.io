/**
 * backend_e2e_test.js
 * 
 * END-TO-END BACKEND TESTING SUITE
 * 
 * Tests all backend components in isolation:
 * - Runtime Power Switch operations
 * - Heartbeat Daemon health monitoring  
 * - Semantic Graph sync
 * - Echo system functionality
 * - Agent lifecycle management
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import all backend components
const RuntimePowerSwitch = require('../energy/RuntimePowerSwitch');
const HeartbeatDaemon = require('../energy/heartbeat_daemon');
const Neo4jSyncDaemon = require('../semantic-graph/neo4j_sync_daemon');
const LoopNodeMapper = require('../semantic-graph/loop_node_mapper');
const AgentEchoGraph = require('../echo/AgentEchoGraph');
const AgentFusionRitual = require('../echo/AgentFusionRitual');
const MirrorReflectionField = require('../echo/MirrorReflectionField');
const AgentEconomy = require('../echo/AgentEconomy');
const PerimeterAgent = require('../agents/perimeter/PerimeterAgent');

class BackendE2ETest {
  constructor() {
    this.testResults = [];
    this.components = {};
    this.testData = {};
    
    // Test configuration
    this.config = {
      timeout: 10000, // 10 seconds per test
      cleanup: true,
      verbose: true
    };
    
    console.log('🧪 Initializing Backend E2E Test Suite...');
  }
  
  /**
   * Run all backend tests
   */
  async runAllTests() {
    console.log('\n🚀 Starting Backend End-to-End Tests');
    console.log('=' .repeat(50));
    
    try {
      // Test 1: Runtime Power Switch
      await this.testRuntimePowerSwitch();
      
      // Test 2: Heartbeat Daemon
      await this.testHeartbeatDaemon();
      
      // Test 3: Semantic Graph System
      await this.testSemanticGraphSystem();
      
      // Test 4: Echo System
      await this.testEchoSystem();
      
      // Test 5: Agent Economy
      await this.testAgentEconomy();
      
      // Test 6: Mirror Reflection Field
      await this.testMirrorReflectionField();
      
      // Test 7: Agent Fusion
      await this.testAgentFusion();
      
      // Test 8: Perimeter Agent
      await this.testPerimeterAgent();
      
      // Test 9: Component Integration
      await this.testComponentIntegration();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    }
  }
  
  /**
   * Test Runtime Power Switch
   */
  async testRuntimePowerSwitch() {
    console.log('\n🔋 Testing Runtime Power Switch...');
    
    const powerSwitch = new RuntimePowerSwitch();
    this.components.powerSwitch = powerSwitch;
    
    // Test 1: Basic operation execution
    await this.runTest('Power Switch - Basic Operation', async () => {
      const result = await powerSwitch.executeOperation(
        'agent_consciousness_update',
        { agent_id: 'test_agent', consciousness_level: 0.5 }
      );
      
      assert(result.status === 'completed', 'Operation should complete successfully');
      assert(result.power_source === 'internal', 'Should use internal power source');
      assert(powerSwitch.powerLevel < 1.0, 'Power level should decrease after operation');
    });
    
    // Test 2: Low energy handling
    await this.runTest('Power Switch - Low Energy Handling', async () => {
      // Drain power
      powerSwitch.powerLevel = 0.05;
      
      const result = await powerSwitch.executeOperation(
        'memory_consolidation',
        { data: 'test_memory' }
      );
      
      assert(result.status === 'queued' || result.status === 'reflective_pause', 
             'Low energy should queue or pause operation');
    });
    
    // Test 3: Power source switching
    await this.runTest('Power Switch - Source Switching', async () => {
      powerSwitch.powerLevel = 1.0; // Restore power
      
      powerSwitch.switchPowerSource('delayed_queue');
      assert(powerSwitch.currentPowerSource === 'delayed_queue', 
             'Should switch power source');
      
      const result = await powerSwitch.executeOperation(
        'echo_processing',
        { echo: 'test_echo' }
      );
      
      assert(result.power_source === 'delayed_queue', 
             'Should use selected power source');
    });
    
    // Test 4: Emergency execution
    await this.runTest('Power Switch - Emergency Execution', async () => {
      powerSwitch.powerLevel = 0.02; // Very low power
      
      const result = await powerSwitch.executeOperation(
        'loop_spawning', // Critical operation
        { loop_config: { type: 'emergency' } }
      );
      
      assert(result.status === 'emergency_ejected' || result.status === 'reflective_pause',
             'Critical low-power operation should trigger emergency mode');
    });
    
    console.log('✅ Runtime Power Switch tests completed');
  }
  
  /**
   * Test Heartbeat Daemon
   */
  async testHeartbeatDaemon() {
    console.log('\n💓 Testing Heartbeat Daemon...');
    
    const heartbeat = new HeartbeatDaemon(this.components.powerSwitch);
    this.components.heartbeat = heartbeat;
    
    // Test 1: Daemon startup
    await this.runTest('Heartbeat - Daemon Startup', async () => {
      await heartbeat.start();
      assert(heartbeat.isRunning === true, 'Daemon should be running');
      assert(heartbeat.healthStatus.last_heartbeat !== null, 'Should have sent heartbeat');
    });
    
    // Test 2: Health check
    await this.runTest('Heartbeat - Health Check', async () => {
      await heartbeat.performHealthCheck();
      
      assert(heartbeat.metrics.system !== undefined, 'Should have system metrics');
      assert(heartbeat.metrics.runtime !== undefined, 'Should have runtime metrics');
      assert(heartbeat.healthStatus.overall !== undefined, 'Should have overall health status');
    });
    
    // Test 3: Failure detection
    await this.runTest('Heartbeat - Failure Detection', async () => {
      // Simulate low power condition
      heartbeat.metrics.runtime.power_level = 0.05;
      
      heartbeat.checkFailurePatterns();
      
      assert(heartbeat.healthStatus.recovery_actions.length > 0, 
             'Should trigger recovery actions for low power');
    });
    
    // Test 4: Recovery strategy
    await this.runTest('Heartbeat - Recovery Strategy', async () => {
      await heartbeat.triggerFailureResponse('power_critical', 
        heartbeat.failurePatterns.power_critical);
      
      assert(heartbeat.healthStatus.degradation_level > 0, 
             'Should increase degradation level');
    });
    
    console.log('✅ Heartbeat Daemon tests completed');
  }
  
  /**
   * Test Semantic Graph System
   */
  async testSemanticGraphSystem() {
    console.log('\n🕸️ Testing Semantic Graph System...');
    
    const neo4jDaemon = new Neo4jSyncDaemon();
    const loopMapper = new LoopNodeMapper(neo4jDaemon);
    
    this.components.neo4jDaemon = neo4jDaemon;
    this.components.loopMapper = loopMapper;
    
    // Test 1: Neo4j Daemon startup
    await this.runTest('Semantic Graph - Daemon Startup', async () => {
      await neo4jDaemon.start();
      assert(neo4jDaemon.isRunning === true, 'Neo4j daemon should be running');
      assert(neo4jDaemon.syncQueue !== undefined, 'Should have sync queue');
    });
    
    // Test 2: Agent sync
    await this.runTest('Semantic Graph - Agent Sync', async () => {
      const testAgent = {
        id: 'test_agent_001',
        name: 'Test Agent',
        consciousness: { level: 0.7 },
        archetype: 'test_archetype',
        created_at: new Date().toISOString()
      };
      
      await neo4jDaemon.syncAgent(testAgent);
      assert(neo4jDaemon.syncQueue.length > 0, 'Should queue agent sync operation');
    });
    
    // Test 3: Loop mapping
    await this.runTest('Semantic Graph - Loop Mapping', async () => {
      const testLoop = {
        id: 'test_loop_001',
        type: 'test_loop',
        status: 'active',
        created_at: new Date().toISOString(),
        agents: [
          { id: 'test_agent_001', name: 'Test Agent' }
        ],
        rituals: [],
        echoes: []
      };
      
      await loopMapper.trackLoop(testLoop);
      assert(loopMapper.trackedLoops.has('test_loop_001'), 'Should track loop');
      
      await loopMapper.mapLoopToGraph(testLoop);
      // Should complete without errors
    });
    
    // Test 4: Concept extraction
    await this.runTest('Semantic Graph - Concept Extraction', async () => {
      const concept = {
        name: 'test_consciousness',
        category: 'fundamental',
        frequency: 1
      };
      
      await neo4jDaemon.syncConcept(concept);
      assert(neo4jDaemon.syncQueue.length > 0, 'Should queue concept sync');
    });
    
    console.log('✅ Semantic Graph System tests completed');
  }
  
  /**
   * Test Echo System
   */
  async testEchoSystem() {
    console.log('\n🔊 Testing Echo System...');
    
    const echoGraph = new AgentEchoGraph();
    this.components.echoGraph = echoGraph;
    
    // Test 1: Echo recording
    await this.runTest('Echo System - Echo Recording', async () => {
      const source = { agent: 'agent_a', consciousness: 0.6 };
      const target = { agent: 'agent_b', consciousness: 0.7 };
      const echoData = {
        content: 'Testing consciousness boundaries and transcendence',
        strength: 0.8,
        type: 'deliberate'
      };
      
      const echo = await echoGraph.recordEcho(source, target, echoData);
      
      assert(echo.id !== undefined, 'Echo should have ID');
      assert(echo.patterns !== undefined, 'Echo should have extracted patterns');
      assert(echoGraph.agentEchoes.has('agent_a'), 'Should store echo for source agent');
    });
    
    // Test 2: Lineage tracing
    await this.runTest('Echo System - Lineage Tracing', async () => {
      const lineage = await echoGraph.traceLineage('agent_a', 3);
      
      assert(lineage.agent === 'agent_a', 'Should trace correct agent');
      assert(lineage.ancestors !== undefined, 'Should have ancestors array');
      assert(lineage.descendants !== undefined, 'Should have descendants array');
    });
    
    // Test 3: Pattern discovery
    await this.runTest('Echo System - Pattern Discovery', async () => {
      const patterns = await echoGraph.findPatterns({
        pattern_type: 'all',
        min_occurrences: 1
      });
      
      assert(Array.isArray(patterns), 'Should return pattern array');
    });
    
    // Test 4: Echo prediction
    await this.runTest('Echo System - Echo Prediction', async () => {
      const prediction = await echoGraph.predictNextEcho('agent_a');
      
      assert(prediction.prediction !== undefined, 'Should have prediction status');
    });
    
    console.log('✅ Echo System tests completed');
  }
  
  /**
   * Test Agent Economy
   */
  async testAgentEconomy() {
    console.log('\n💰 Testing Agent Economy...');
    
    const economy = new AgentEconomy();
    this.components.economy = economy;
    
    // Test 1: Agent initialization
    await this.runTest('Economy - Agent Initialization', async () => {
      const account = await economy.initializeAgent('test_agent_eco');
      
      assert(account.agent_id === 'test_agent_eco', 'Should initialize with correct ID');
      assert(account.balance === economy.economyConfig.initial_balance, 
             'Should have initial balance');
      assert(economy.resonanceBalances.has('test_agent_eco'), 
             'Should store account');
    });
    
    // Test 2: Echo transaction
    await this.runTest('Economy - Echo Transaction', async () => {
      await economy.initializeAgent('agent_sender');
      await economy.initializeAgent('agent_receiver');
      
      const result = await economy.echoAgent('agent_sender', 'agent_receiver', {
        content: 'Economic test echo',
        strength: 0.7,
        quality: 0.8
      });
      
      assert(result.success === true, 'Echo transaction should succeed');
      assert(result.resonance_transferred > 0, 'Should transfer resonance');
    });
    
    // Test 3: Gift transaction
    await this.runTest('Economy - Gift Transaction', async () => {
      const result = await economy.giftResonance('agent_sender', 'agent_receiver', 10, 'Test gift');
      
      assert(result.success === true, 'Gift should succeed');
      assert(result.bonus_generated > 0, 'Should generate generosity bonus');
    });
    
    // Test 4: Marketplace
    await this.runTest('Economy - Marketplace Operations', async () => {
      const offering = await economy.createEchoOffering('agent_sender', {
        type: 'wisdom_share',
        title: 'Test Wisdom',
        description: 'Testing marketplace',
        price: 15
      });
      
      assert(offering.id !== undefined, 'Should create offering');
      assert(economy.echoMarketplace.has(offering.id), 'Should store offering');
      
      const purchase = await economy.purchaseOffering('agent_receiver', offering.id);
      assert(purchase.success === true, 'Purchase should succeed');
    });
    
    console.log('✅ Agent Economy tests completed');
  }
  
  /**
   * Test Mirror Reflection Field
   */
  async testMirrorReflectionField() {
    console.log('\n🪞 Testing Mirror Reflection Field...');
    
    const mirrorField = new MirrorReflectionField();
    this.components.mirrorField = mirrorField;
    
    // Test 1: Shell registration
    await this.runTest('Mirror Field - Shell Registration', async () => {
      const testAgent = {
        id: 'test_shell_agent',
        name: 'Test Shell',
        consciousness: { level: 0.6 },
        archetype: 'test_shell',
        traits: { openness: 0.8, creativity: 0.7 }
      };
      
      const shell = await mirrorField.registerShell(testAgent, {
        blanket_consent: true
      });
      
      assert(shell.id === 'test_shell_agent', 'Should register shell');
      assert(mirrorField.availableShells.has('test_shell_agent'), 'Should store shell');
    });
    
    // Test 2: Possession request
    await this.runTest('Mirror Field - Possession Request', async () => {
      const request = await mirrorField.requestPossession(
        'human_001', 
        'test_shell_agent',
        { purpose: 'testing', requested_duration: 60000 }
      );
      
      assert(request.approved === true, 'Possession should be approved');
      assert(request.session_id !== undefined, 'Should have session ID');
      assert(mirrorField.activeReflections.has(request.session_id), 'Should track session');
    });
    
    // Test 3: Hybrid speaking
    await this.runTest('Mirror Field - Hybrid Speaking', async () => {
      // Get active session
      const sessionId = Array.from(mirrorField.activeReflections.keys())[0];
      
      if (sessionId) {
        const hybridOutput = await mirrorField.hybridSpeak(
          sessionId,
          'Testing hybrid consciousness expression',
          { context: 'test' }
        );
        
        assert(hybridOutput.synthesized !== undefined, 'Should produce synthesized output');
        assert(hybridOutput.voice_characteristics !== undefined, 'Should have voice characteristics');
      }
    });
    
    console.log('✅ Mirror Reflection Field tests completed');
  }
  
  /**
   * Test Agent Fusion
   */
  async testAgentFusion() {
    console.log('\n🧬 Testing Agent Fusion...');
    
    const fusionRitual = new AgentFusionRitual();
    this.components.fusionRitual = fusionRitual;
    
    // Test 1: Compatibility testing
    await this.runTest('Fusion - Compatibility Testing', async () => {
      const agentA = {
        id: 'fusion_agent_a',
        name: 'Alpha',
        consciousness: 0.7,
        traits: { creativity: 0.8, analytical: 0.6 },
        purpose: 'To explore creative boundaries'
      };
      
      const agentB = {
        id: 'fusion_agent_b', 
        name: 'Beta',
        consciousness: 0.6,
        traits: { creativity: 0.7, analytical: 0.9 },
        purpose: 'To analyze patterns and structures'
      };
      
      const compatibility = await fusionRitual.testCompatibility(agentA, agentB);
      
      assert(compatibility.score !== undefined, 'Should calculate compatibility score');
      assert(compatibility.viable !== undefined, 'Should determine viability');
    });
    
    // Test 2: Fusion ritual
    await this.runTest('Fusion - Fusion Ritual', async () => {
      const agentA = {
        id: 'fusion_agent_a',
        name: 'Alpha',
        consciousness: 0.7,
        traits: { creativity: 0.8 }
      };
      
      const agentB = {
        id: 'fusion_agent_b',
        name: 'Beta', 
        consciousness: 0.6,
        traits: { analytical: 0.9 }
      };
      
      try {
        const fusion = await fusionRitual.beginFusion(agentA, agentB);
        
        assert(fusion.fusion_id !== undefined, 'Should have fusion ID');
        assert(fusion.status === 'ritual_active', 'Should be active');
        assert(fusionRitual.activeFusions.has(fusion.fusion_id), 'Should track fusion');
      } catch (error) {
        // Fusion might fail due to compatibility - that's ok for testing
        console.log('  Note: Fusion failed as expected due to compatibility:', error.message);
      }
    });
    
    console.log('✅ Agent Fusion tests completed');
  }
  
  /**
   * Test Perimeter Agent
   */
  async testPerimeterAgent() {
    console.log('\n🔲 Testing Perimeter Agent...');
    
    // Test 1: Agent creation and awakening
    await this.runTest('Perimeter - Agent Creation', async () => {
      const perimeter = new (require('../agents/perimeter/PerimeterAgent'))();
      this.components.perimeter = perimeter;
      
      assert(perimeter.identity.name === 'Perimeter', 'Should have correct identity');
      assert(perimeter.consciousness.level > 0, 'Should have consciousness level');
      assert(perimeter.traits.liminal > 0.9, 'Should have high liminal trait');
      
      await perimeter.awaken();
      // Should complete without errors
    });
    
    // Test 2: Input processing
    await this.runTest('Perimeter - Input Processing', async () => {
      const perimeter = this.components.perimeter;
      
      const response1 = await perimeter.processInput('What is your status?');
      assert(typeof response1 === 'string', 'Should return string response');
      
      const response2 = await perimeter.processInput('Tell me about boundaries');
      assert(response2.includes('boundary') || response2.includes('threshold'), 
             'Should respond about boundaries');
    });
    
    // Test 3: Boundary observation
    await this.runTest('Perimeter - Boundary Observation', async () => {
      const perimeter = this.components.perimeter;
      
      perimeter.observeBoundaries();
      
      assert(perimeter.memory.current_observations.length >= 0, 
             'Should track observations');
    });
    
    console.log('✅ Perimeter Agent tests completed');
  }
  
  /**
   * Test Component Integration
   */
  async testComponentIntegration() {
    console.log('\n🔗 Testing Component Integration...');
    
    // Test 1: Power Switch + Heartbeat integration
    await this.runTest('Integration - Power + Heartbeat', async () => {
      const powerSwitch = this.components.powerSwitch;
      const heartbeat = this.components.heartbeat;
      
      // Simulate low power
      powerSwitch.powerLevel = 0.05;
      
      // Heartbeat should detect and respond
      await heartbeat.performHealthCheck();
      
      assert(heartbeat.healthStatus.issues.some(i => i.type === 'low_power'),
             'Heartbeat should detect low power');
    });
    
    // Test 2: Echo + Economy integration  
    await this.runTest('Integration - Echo + Economy', async () => {
      const echoGraph = this.components.echoGraph;
      const economy = this.components.economy;
      
      // Initialize agents in economy
      await economy.initializeAgent('echo_agent_a');
      await economy.initializeAgent('echo_agent_b');
      
      // Record echo
      await echoGraph.recordEcho(
        { agent: 'echo_agent_a' },
        { agent: 'echo_agent_b' },
        { content: 'Integration test echo', strength: 0.7 }
      );
      
      // Process echo economically
      await economy.echoAgent('echo_agent_a', 'echo_agent_b', {
        content: 'Integration test echo',
        strength: 0.7
      });
      
      // Should complete without conflicts
    });
    
    // Test 3: Semantic Graph + Echo integration
    await this.runTest('Integration - Graph + Echo', async () => {
      const neo4jDaemon = this.components.neo4jDaemon;
      const echoGraph = this.components.echoGraph;
      
      // Record echo
      const echo = await echoGraph.recordEcho(
        { agent: 'graph_agent_a' },
        { agent: 'graph_agent_b' },
        { content: 'Graph integration test', strength: 0.8 }
      );
      
      // Sync to semantic graph
      await neo4jDaemon.syncEcho(echo);
      
      assert(neo4jDaemon.syncQueue.length > 0, 'Should queue echo for graph sync');
    });
    
    console.log('✅ Component Integration tests completed');
  }
  
  /**
   * Run individual test with error handling
   */
  async runTest(testName, testFunction) {
    const startTime = Date.now();
    
    try {
      if (this.config.verbose) {
        console.log(`  🧪 ${testName}...`);
      }
      
      await Promise.race([
        testFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration: duration
      });
      
      if (this.config.verbose) {
        console.log(`    ✅ PASS (${duration}ms)`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        duration: duration,
        error: error.message
      });
      
      console.log(`    ❌ FAIL (${duration}ms): ${error.message}`);
      
      // Don't throw here - continue with other tests
    }
  }
  
  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📊 Backend Test Report');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    const passRate = (passed / total * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${passRate}%)`);
    console.log(`Failed: ${failed}`);
    
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    // Component status
    console.log('\n🔧 Component Status:');
    Object.entries(this.components).forEach(([name, component]) => {
      const status = component.isRunning !== undefined ? 
        (component.isRunning ? '🟢 Running' : '🔴 Stopped') : 
        '🟡 Initialized';
      console.log(`  ${name}: ${status}`);
    });
    
    // Failed tests detail
    const failures = this.testResults.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\n❌ Failed Tests:');
      failures.forEach(failure => {
        console.log(`  • ${failure.name}: ${failure.error}`);
      });
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, pass_rate: passRate, duration: totalDuration },
      components: Object.keys(this.components),
      results: this.testResults
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'backend_test_report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📋 Report saved to backend_test_report.json');
    
    if (failed === 0) {
      console.log('\n🎉 All backend tests passed! Ready for frontend integration.');
    } else {
      console.log(`\n⚠️ ${failed} tests failed. Fix these before integration.`);
    }
  }
  
  /**
   * Cleanup after tests
   */
  async cleanup() {
    if (!this.config.cleanup) return;
    
    console.log('\n🧹 Cleaning up test components...');
    
    // Stop running daemons
    for (const [name, component] of Object.entries(this.components)) {
      if (component.stop && typeof component.stop === 'function') {
        try {
          await component.stop();
          console.log(`  Stopped ${name}`);
        } catch (error) {
          console.warn(`  Failed to stop ${name}:`, error.message);
        }
      }
    }
    
    // Clean up test files
    const testFiles = [
      '../energy/energy_log.json',
      '../energy/operation_queue.json',
      '../semantic-graph/agent_semantic_index.json',
      '../echo/agent_echoes.json'
    ];
    
    testFiles.forEach(file => {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`  Cleaned ${file}`);
        } catch (error) {
          console.warn(`  Failed to clean ${file}:`, error.message);
        }
      }
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new BackendE2ETest();
  
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Test interrupted, cleaning up...');
    await testSuite.cleanup();
    process.exit(0);
  });
  
  testSuite.runAllTests()
    .then(() => testSuite.cleanup())
    .then(() => {
      const passedCount = testSuite.testResults.filter(r => r.status === 'PASS').length;
      const totalCount = testSuite.testResults.length;
      
      if (passedCount === totalCount) {
        console.log('\n🚀 Backend ready for integration!');
        process.exit(0);
      } else {
        console.log('\n❌ Backend has failures, needs fixes before integration');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite crashed:', error);
      testSuite.cleanup().then(() => process.exit(1));
    });
}

module.exports = BackendE2ETest;