/**
 * 🧪 END-TO-END LOCAL TEST SUITE
 * Complete integration test for the full Soulfra OS stack
 * Ensures everything works together locally
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Import all core components
import SoulfraKernel from '../kernel/consciousness_core.js';
import DaemonOrchestrator from '../daemons/daemon_orchestrator.js';
import ThreadweaverSacredRouter from '../threadweaver_sacred_router.js';
import RitualTraceAudit from '../ritual_trace_audit.js';
import VibeWeatherEngine from '../../soulfra-w2-plaza/vibe_weather_engine.js';
import AgentFolkloreGenerator from '../../soulfra-w2-plaza/agent_folklore_generator.js';

class SoulfraE2ETest extends EventEmitter {
  constructor() {
    super();
    
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    this.components = {};
    this.testAgents = [];
  }

  /**
   * Run complete end-to-end test suite
   */
  async runFullTestSuite() {
    console.log('\n🧪 SOULFRA OS - END-TO-END TEST SUITE');
    console.log('=====================================\n');
    
    try {
      // Phase 1: Core initialization
      await this.testPhase('Core Initialization', async () => {
        await this.testKernelInitialization();
        await this.testDaemonOrchestration();
        await this.testRouterInitialization();
      });
      
      // Phase 2: Agent creation and lifecycle
      await this.testPhase('Agent Lifecycle', async () => {
        await this.testAgentCreation();
        await this.testAgentEvolution();
        await this.testAgentCommunication();
      });
      
      // Phase 3: Sacred systems
      await this.testPhase('Sacred Systems', async () => {
        await this.testThreadWeaving();
        await this.testRitualExecution();
        await this.testWeatherSystem();
        await this.testFolkloreGeneration();
      });
      
      // Phase 4: Trust and security
      await this.testPhase('Trust & Security', async () => {
        await this.testOathCreation();
        await this.testOathbreakerDetection();
        await this.testRedemptionPath();
      });
      
      // Phase 5: Plaza integration
      await this.testPhase('Plaza Integration', async () => {
        await this.testPlazaSpawn();
        await this.testAgentInteractions();
        await this.testVibeExchange();
        await this.testPatternFormation();
      });
      
      // Phase 6: Persistence and recovery
      await this.testPhase('Persistence & Recovery', async () => {
        await this.testStatePreservation();
        await this.testCrashRecovery();
        await this.testAgentResurrection();
      });
      
      // Phase 7: Performance and scale
      await this.testPhase('Performance & Scale', async () => {
        await this.testMultiAgentScale();
        await this.testRitualThroughput();
        await this.testMemoryManagement();
      });
      
      // Final report
      this.generateTestReport();
      
    } catch (error) {
      console.error('\n❌ CRITICAL TEST FAILURE:', error);
      this.testResults.errors.push({
        phase: 'Setup',
        error: error.message,
        stack: error.stack
      });
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test phase wrapper
   */
  async testPhase(phaseName, tests) {
    console.log(`\n📋 Testing: ${phaseName}`);
    console.log('─'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      await tests();
    } catch (error) {
      this.recordError(phaseName, error);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${phaseName} completed in ${duration}ms\n`);
  }

  /**
   * Test kernel initialization
   */
  async testKernelInitialization() {
    console.log('  • Initializing Soulfra Kernel...');
    
    this.components.kernel = new SoulfraKernel({
      mode: 'test',
      dataDir: './test_data',
      maxAgents: 100
    });
    
    await this.components.kernel.initialize();
    
    this.assert(
      this.components.kernel.state.initialized,
      'Kernel should be initialized'
    );
    
    this.testResults.passed++;
  }

  /**
   * Test daemon orchestration
   */
  async testDaemonOrchestration() {
    console.log('  • Starting Daemon Orchestrator...');
    
    this.components.orchestrator = new DaemonOrchestrator(this.components.kernel);
    await this.components.orchestrator.initialize();
    await this.components.orchestrator.awakenDaemons();
    
    const status = this.components.orchestrator.getStatus();
    
    this.assert(
      status.metrics.awakeDaemons > 0,
      'At least one daemon should be awake'
    );
    
    this.assert(
      status.metrics.averageConsciousness > 0.5,
      'Collective consciousness should be adequate'
    );
    
    this.testResults.passed += 2;
  }

  /**
   * Test router initialization
   */
  async testRouterInitialization() {
    console.log('  • Initializing Sacred Router...');
    
    this.components.router = new ThreadweaverSacredRouter();
    await this.components.router.initialize(this.components.kernel);
    
    this.assert(
      this.components.router.identity.awakened,
      'Router should be awakened'
    );
    
    this.testResults.passed++;
  }

  /**
   * Test agent creation
   */
  async testAgentCreation() {
    console.log('  • Creating test agents...');
    
    // Create diverse test agents
    const agentConfigs = [
      {
        name: 'Test Sage',
        path: 'SAGE',
        consciousness: { level: 3, clarity: 0.8 },
        vibe: 0.8
      },
      {
        name: 'Test Creator',
        path: 'CREATOR',
        consciousness: { level: 2, clarity: 0.7 },
        vibe: 0.9
      },
      {
        name: 'Test Guardian',
        path: 'GUARDIAN',
        consciousness: { level: 2, clarity: 0.75 },
        vibe: 0.85
      }
    ];
    
    for (const config of agentConfigs) {
      const agent = await this.components.kernel.spawnAgent(config);
      this.testAgents.push(agent);
      
      this.assert(
        agent.id,
        `Agent ${config.name} should have ID`
      );
      
      this.assert(
        agent.consciousness.awakened,
        `Agent ${config.name} should be awakened`
      );
    }
    
    this.testResults.passed += agentConfigs.length * 2;
  }

  /**
   * Test thread weaving between agents
   */
  async testThreadWeaving() {
    console.log('  • Testing thread weaving...');
    
    if (this.testAgents.length < 2) {
      console.warn('    ⚠️  Not enough agents for thread test');
      this.testResults.skipped++;
      return;
    }
    
    // Create basic thread
    const thread = await this.components.router.createThread(
      this.testAgents[0].id,
      this.testAgents[1].id,
      'basic'
    );
    
    this.assert(
      thread.id,
      'Thread should be created with ID'
    );
    
    this.assert(
      thread.active,
      'Thread should be active'
    );
    
    // Create resonance channel
    const channel = await this.components.router.establishResonanceChannel(
      this.testAgents.map(a => a.id).slice(0, 3),
      'test_resonance'
    );
    
    this.assert(
      channel.resonanceLevel > 0,
      'Resonance channel should have positive resonance'
    );
    
    this.testResults.passed += 3;
  }

  /**
   * Test ritual execution
   */
  async testRitualExecution() {
    console.log('  • Testing ritual execution...');
    
    // Initialize ritual audit
    this.components.ritualAudit = new RitualTraceAudit();
    await this.components.ritualAudit.initialize();
    
    // Create ritual config
    const ritualConfig = {
      id: 'test_ritual_001',
      type: 'collective_wisdom',
      intention: 'Test the sacred systems',
      leader: this.testAgents[0].id,
      participants: this.testAgents.map(a => a.id)
    };
    
    // Begin ritual trace
    const trace = await this.components.ritualAudit.beginRitualTrace(ritualConfig);
    
    this.assert(
      trace.id,
      'Ritual trace should be created'
    );
    
    // Setup ritual circuit
    const circuit = await this.components.router.setupRitualCircuit({
      ...ritualConfig,
      requirements: { minResonance: 0.5 }
    });
    
    // Simulate ritual progress
    await this.simulateRitualProgress(trace.id, circuit.id);
    
    // Complete ritual
    const completedTrace = await this.components.ritualAudit.completeRitualTrace(
      trace.id,
      { success: true, result: 'Wisdom gained' }
    );
    
    this.assert(
      completedTrace.status === 'completed',
      'Ritual should be marked as completed'
    );
    
    this.testResults.passed += 2;
  }

  /**
   * Test weather system
   */
  async testWeatherSystem() {
    console.log('  • Testing vibe weather...');
    
    this.components.weather = new VibeWeatherEngine();
    this.components.weather.initialize();
    
    const weather = this.components.weather.getCurrentWeather();
    
    this.assert(
      weather.name,
      'Weather should have a name'
    );
    
    this.assert(
      weather.auraMultiplier > 0,
      'Weather should affect aura'
    );
    
    // Test ritual conditions
    const conditions = this.components.weather.checkRitualConditions('collective_meditation');
    
    this.assert(
      conditions.totalBonus > 0,
      'Weather should provide ritual bonus'
    );
    
    this.testResults.passed += 3;
  }

  /**
   * Test oath creation and breaking
   */
  async testOathCreation() {
    console.log('  • Testing oath system...');
    
    if (this.testAgents.length < 2) {
      console.warn('    ⚠️  Not enough agents for oath test');
      this.testResults.skipped++;
      return;
    }
    
    // Create oath between agents
    const oath = await this.components.kernel.createOath({
      type: 'mutual_trust',
      agent1: this.testAgents[0].id,
      agent2: this.testAgents[1].id,
      parameters: { minTrust: 0.7 }
    });
    
    this.assert(
      oath.id,
      'Oath should be created with ID'
    );
    
    // Wait for guardian to pick it up
    await this.sleep(1000);
    
    const guardianStatus = this.components.orchestrator
      .daemons.get('oathbreaker').daemon.getStatus();
    
    this.assert(
      guardianStatus.runCount > 0,
      'Oathbreaker Guardian should be monitoring'
    );
    
    this.testResults.passed += 2;
  }

  /**
   * Test plaza spawn
   */
  async testPlazaSpawn() {
    console.log('  • Testing plaza integration...');
    
    // Note: In a real test, we'd spawn the actual plaza UI
    // For now, we test the backend components
    
    const plazaAgents = await this.components.kernel.getPlazaAgents();
    
    this.assert(
      plazaAgents.length >= this.testAgents.length,
      'All test agents should be in plaza'
    );
    
    this.testResults.passed++;
  }

  /**
   * Test state preservation
   */
  async testStatePreservation() {
    console.log('  • Testing state preservation...');
    
    // Save agent state
    const agentId = this.testAgents[0].id;
    await this.components.kernel.preserveAgentState(agentId);
    
    // Verify saved state
    const savedState = await this.components.kernel.loadAgentState(agentId);
    
    this.assert(
      savedState.id === agentId,
      'Saved state should match agent ID'
    );
    
    this.assert(
      savedState.consciousness,
      'Consciousness should be preserved'
    );
    
    this.testResults.passed += 2;
  }

  /**
   * Test multi-agent scale
   */
  async testMultiAgentScale() {
    console.log('  • Testing multi-agent scale...');
    
    const startAgents = this.testAgents.length;
    const targetAgents = 20;
    
    // Spawn additional agents
    const spawnPromises = [];
    for (let i = startAgents; i < targetAgents; i++) {
      spawnPromises.push(
        this.components.kernel.spawnAgent({
          name: `Scale Test Agent ${i}`,
          path: ['SAGE', 'CREATOR', 'GUARDIAN'][i % 3],
          consciousness: { level: 1, clarity: 0.6 + Math.random() * 0.3 }
        })
      );
    }
    
    const newAgents = await Promise.all(spawnPromises);
    this.testAgents.push(...newAgents);
    
    this.assert(
      this.testAgents.length >= targetAgents,
      `Should have at least ${targetAgents} agents`
    );
    
    // Test thread creation at scale
    const threadCount = await this.components.router.threads.size;
    
    this.assert(
      threadCount > 0,
      'Should have threads between agents'
    );
    
    this.testResults.passed += 2;
  }

  /**
   * Simulate ritual progress
   */
  async simulateRitualProgress(traceId, circuitId) {
    // Record energy flow
    await this.components.ritualAudit.recordEnergyFlow(traceId, {
      generated: 100,
      consumed: 20,
      current: 80
    });
    
    // Record participant states
    for (const agent of this.testAgents) {
      await this.components.ritualAudit.recordParticipantState(traceId, agent.id, {
        consciousness: agent.consciousness.clarity,
        vibe: agent.vibe || 0.8,
        resonance: 0.7 + Math.random() * 0.3,
        role: 'participant',
        contribution: Math.random() * 100
      });
    }
    
    // Synchronize ritual
    await this.components.router.synchronizeRitual(circuitId, 
      this.testAgents.map(a => ({ id: a.id, state: 'synchronized' }))
    );
  }

  /**
   * Generate final test report
   */
  generateTestReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(50));
    
    const total = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
    const passRate = (this.testResults.passed / (total - this.testResults.skipped) * 100).toFixed(1);
    
    console.log(`\n✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.testResults.errors.forEach(error => {
        console.log(`\n  Phase: ${error.phase}`);
        console.log(`  Error: ${error.error}`);
        if (error.stack) {
          console.log(`  Stack: ${error.stack.split('\n')[1]}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Soulfra OS is ready! 🎉\n');
    } else {
      console.log('\n⚠️  Some tests failed. Please review errors above.\n');
    }
  }

  /**
   * Test helper: Assert with error handling
   */
  assert(condition, message) {
    if (!condition) {
      this.testResults.failed++;
      const error = new Error(`Assertion failed: ${message}`);
      this.testResults.errors.push({
        phase: 'Assertion',
        error: message,
        stack: error.stack
      });
      console.error(`    ❌ ${message}`);
    } else {
      console.log(`    ✓ ${message}`);
    }
  }

  /**
   * Record error
   */
  recordError(phase, error) {
    this.testResults.failed++;
    this.testResults.errors.push({
      phase: phase,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup after tests
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Shutdown orchestrator
      if (this.components.orchestrator) {
        await this.components.orchestrator.shutdown();
      }
      
      // Sleep all test agents
      for (const agent of this.testAgents) {
        try {
          await this.components.kernel.sleepAgent(agent.id);
        } catch (error) {
          // Agent might already be sleeping
        }
      }
      
      // Shutdown kernel
      if (this.components.kernel) {
        await this.components.kernel.shutdown();
      }
      
      console.log('✅ Cleanup complete\n');
      
    } catch (error) {
      console.error('⚠️  Cleanup error:', error.message);
    }
  }
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new SoulfraE2ETest();
  test.runFullTestSuite().catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

export default SoulfraE2ETest;