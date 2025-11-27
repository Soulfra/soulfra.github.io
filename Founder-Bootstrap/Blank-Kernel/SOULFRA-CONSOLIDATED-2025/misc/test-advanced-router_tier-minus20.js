#!/usr/bin/env node

/**
 * Test Client for Advanced Infinity Router
 * Demonstrates all routing capabilities
 */

const http = require('http');

// Colors for output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Test scenarios
const testScenarios = [
  {
    name: 'IP Capture Test',
    request: {
      prompt: 'Create a machine learning model to predict stock prices',
      operation: 'ml-model-creation',
      involveCode: true,
      capability: 'coding',
      userId: 'test-user-1',
      projectId: 'stock-predictor'
    }
  },
  {
    name: 'Multi-Platform Routing Test',
    request: {
      prompt: 'Compare the philosophical implications of AI consciousness across different cultural perspectives',
      operation: 'multi-platform-analysis',
      capability: 'analysis',
      multiPlatformStrategy: { type: 'multi-platform' },
      userId: 'test-user-2'
    }
  },
  {
    name: 'AI World Creation Test',
    request: {
      prompt: 'Create an AI world for collaborative game development with specialized agents',
      operation: 'ai-world-creation',
      aiWorldOperation: true,
      agentRequests: [
        { agentId: 'cal', operation: 'create-game-engine' },
        { agentId: 'cal', operation: 'spawn-dev-agents' }
      ],
      userId: 'test-user-3',
      aiWorldId: 'game-dev-world'
    }
  },
  {
    name: 'Cost Optimization Test',
    request: {
      prompt: 'Summarize this text in 3 bullet points',
      operation: 'simple-summary',
      capability: 'general',
      costSensitive: true,
      userId: 'budget-user'
    }
  },
  {
    name: 'GitHub Integration Test',
    request: {
      prompt: 'Create a React component for a todo list with TypeScript',
      operation: 'code-generation',
      involveCode: true,
      capability: 'coding',
      githubIntegration: true,
      userId: 'dev-user',
      projectId: 'todo-app'
    }
  }
];

// Make HTTP request to router
async function makeRequest(scenario) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(scenario.request);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/route',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Get router statistics
async function getStats() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/stats', (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const stats = JSON.parse(body);
          resolve(stats);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Display results
function displayResult(scenario, result) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}📋 Test: ${scenario.name}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (result.success) {
    console.log(`${colors.green}✅ Success!${colors.reset}`);
    
    // Routing path
    console.log(`\n${colors.yellow}🛤️  Routing Path:${colors.reset}`);
    result.routingPath.forEach((layer, index) => {
      const arrow = index < result.routingPath.length - 1 ? '→' : '';
      console.log(`   ${layer.layer} (${layer.processingTime}ms) ${arrow}`);
    });
    
    // Revenue
    console.log(`\n${colors.green}💰 Revenue Generated: $${result.revenue.toFixed(2)}${colors.reset}`);
    
    // IP Captured
    if (result.ipCaptured) {
      console.log(`\n${colors.magenta}🧠 IP Captured:${colors.reset}`);
      console.log(`   Value: $${result.ipCaptured.value}`);
      console.log(`   Patterns: ${JSON.stringify(result.ipCaptured.patterns)}`);
    }
    
    // Switching costs
    console.log(`\n${colors.yellow}🔒 Switching Costs: ${result.switchingCosts}${colors.reset}`);
    
    // Response preview
    if (result.result.response) {
      console.log(`\n${colors.cyan}📝 Response Preview:${colors.reset}`);
      const preview = JSON.stringify(result.result.response).substring(0, 200) + '...';
      console.log(`   ${preview}`);
    }
    
  } else {
    console.log(`${colors.red}❌ Failed: ${result.error}${colors.reset}`);
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.green}🚀 ADVANCED INFINITY ROUTER TEST SUITE${colors.reset}`);
  console.log(`${colors.green}=====================================\n${colors.reset}`);
  
  // Check if router is running
  try {
    await getStats();
  } catch (error) {
    console.log(`${colors.red}❌ Router is not running. Please start it with: ./launch-advanced-router.sh${colors.reset}`);
    process.exit(1);
  }
  
  // Run each test scenario
  for (const scenario of testScenarios) {
    try {
      console.log(`${colors.yellow}⏳ Running: ${scenario.name}...${colors.reset}`);
      const result = await makeRequest(scenario);
      displayResult(scenario, result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`${colors.red}❌ Error in ${scenario.name}: ${error.message}${colors.reset}`);
    }
  }
  
  // Display final statistics
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}📊 FINAL STATISTICS${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  try {
    const stats = await getStats();
    console.log(`Total Requests: ${stats.stats.totalRequests}`);
    console.log(`IP Captured: ${stats.stats.ipCaptured}`);
    console.log(`Total Revenue: $${Object.values(stats.stats.revenue).reduce((a, b) => a + b, 0).toFixed(2)}`);
    console.log(`Platform Usage:`);
    for (const [platform, count] of Object.entries(Object.fromEntries(stats.stats.platformUsage))) {
      console.log(`   ${platform}: ${count} requests`);
    }
    console.log(`Total Moat Strength: ${stats.totalMoatStrength}`);
  } catch (error) {
    console.log(`${colors.red}Failed to get statistics${colors.reset}`);
  }
  
  console.log(`\n${colors.green}✅ All tests completed!${colors.reset}`);
}

// Run tests
runTests().catch(console.error);