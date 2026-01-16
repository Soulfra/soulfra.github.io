// CodePlayground.js - Live code testing environment for developers

const vm = require('vm');
const { EventEmitter } = require('events');

class CodePlayground extends EventEmitter {
  constructor() {
    super();
    this.sandboxes = new Map();
    this.executionHistory = [];
    this.setupDefaultContext();
  }

  setupDefaultContext() {
    this.defaultContext = {
      // Soulfra SDK mock
      SoulfraSDK: class {
        constructor(apiKey) {
          this.apiKey = apiKey;
          this.agents = new Map();
        }

        async createAgent(params) {
          const agent = {
            id: `agent_${Math.random().toString(36).substr(2, 9)}`,
            ...params,
            created: new Date().toISOString(),
            status: 'active'
          };
          this.agents.set(agent.id, agent);
          return agent;
        }

        async getAgent(agentId) {
          return this.agents.get(agentId) || null;
        }

        async sendMessage(agentId, message) {
          const agent = this.agents.get(agentId);
          if (!agent) throw new Error('Agent not found');
          
          return {
            id: `msg_${Math.random().toString(36).substr(2, 9)}`,
            agentId,
            message: `Response to: ${message}`,
            timestamp: new Date().toISOString()
          };
        }

        async deleteAgent(agentId) {
          return this.agents.delete(agentId);
        }
      },

      // Console mock for output capture
      console: {
        log: (...args) => this.emit('console', { type: 'log', args }),
        error: (...args) => this.emit('console', { type: 'error', args }),
        warn: (...args) => this.emit('console', { type: 'warn', args }),
        info: (...args) => this.emit('console', { type: 'info', args })
      },

      // Async utilities
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      Promise: Promise,

      // Data utilities
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,

      // Fetch mock for API testing
      fetch: async (url, options = {}) => {
        this.emit('fetch', { url, options });
        
        // Mock responses for common endpoints
        if (url.includes('/api/agents')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: { id: 'agent_123', name: 'Test Agent' }
            })
          };
        }
        
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: 'Not found' })
        };
      }
    };
  }

  createSandbox(sessionId) {
    const sandbox = {
      id: sessionId,
      context: vm.createContext({ ...this.defaultContext }),
      created: new Date(),
      executions: 0
    };
    
    this.sandboxes.set(sessionId, sandbox);
    return sandbox;
  }

  async executeCode(sessionId, code, options = {}) {
    let sandbox = this.sandboxes.get(sessionId);
    if (!sandbox) {
      sandbox = this.createSandbox(sessionId);
    }

    const execution = {
      id: `exec_${Date.now()}`,
      sessionId,
      code,
      startTime: Date.now(),
      output: [],
      errors: [],
      result: null
    };

    // Capture console output
    const consoleHandler = (event) => {
      execution.output.push({
        type: event.type,
        message: event.args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        timestamp: Date.now() - execution.startTime
      });
    };

    this.on('console', consoleHandler);

    try {
      // Wrap code for async support
      const wrappedCode = `
        (async () => {
          ${code}
        })()
      `;

      const script = new vm.Script(wrappedCode, {
        filename: 'playground.js',
        timeout: options.timeout || 5000
      });

      // Execute with timeout
      const result = await script.runInContext(sandbox.context, {
        timeout: options.timeout || 5000,
        breakOnSigint: true
      });

      // Wait for async completion if result is a promise
      if (result && typeof result.then === 'function') {
        execution.result = await Promise.race([
          result,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Async timeout')), options.asyncTimeout || 10000)
          )
        ]);
      } else {
        execution.result = result;
      }

      execution.status = 'success';
    } catch (error) {
      execution.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now() - execution.startTime
      });
      execution.status = 'error';
      this.emit('error', { sessionId, error });
    } finally {
      this.off('console', consoleHandler);
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
    }

    sandbox.executions++;
    this.executionHistory.push(execution);
    
    return execution;
  }

  // Code snippets and examples
  getExamples() {
    return [
      {
        name: 'Basic Agent Creation',
        description: 'Create and interact with an agent',
        code: `// Initialize SDK
const sdk = new SoulfraSDK('test_api_key');

// Create an agent
const agent = await sdk.createAgent({
  name: 'Assistant',
  personality: 'helpful and friendly',
  capabilities: ['chat', 'analysis']
});

console.log('Created agent:', agent);

// Send a message
const response = await sdk.sendMessage(agent.id, 'Hello!');
console.log('Response:', response.message);`
      },
      {
        name: 'Multiple Agents',
        description: 'Create multiple agents and coordinate them',
        code: `const sdk = new SoulfraSDK('test_api_key');

// Create multiple agents with different personalities
const agents = await Promise.all([
  sdk.createAgent({ name: 'Analyst', personality: 'analytical' }),
  sdk.createAgent({ name: 'Creative', personality: 'creative' }),
  sdk.createAgent({ name: 'Critic', personality: 'critical' })
]);

console.log('Created', agents.length, 'agents');

// Get different perspectives
const question = 'What is consciousness?';
const responses = await Promise.all(
  agents.map(agent => sdk.sendMessage(agent.id, question))
);

responses.forEach((response, i) => {
  console.log(`\n${agents[i].name}:`, response.message);
});`
      },
      {
        name: 'Error Handling',
        description: 'Demonstrate error handling patterns',
        code: `const sdk = new SoulfraSDK('test_api_key');

try {
  // Try to get non-existent agent
  const agent = await sdk.getAgent('invalid_id');
  console.log('Agent:', agent);
} catch (error) {
  console.error('Error:', error.message);
}

// Safe agent creation with validation
function createSafeAgent(params) {
  if (!params.name) {
    throw new Error('Agent name is required');
  }
  
  return sdk.createAgent({
    ...params,
    capabilities: params.capabilities || ['chat'],
    personality: params.personality || 'neutral'
  });
}

try {
  const agent = await createSafeAgent({ name: 'Safe Agent' });
  console.log('Created safe agent:', agent);
} catch (error) {
  console.error('Failed to create agent:', error.message);
}`
      },
      {
        name: 'Async Patterns',
        description: 'Advanced async/await patterns',
        code: `const sdk = new SoulfraSDK('test_api_key');

// Sequential processing
console.log('Sequential execution:');
const agent = await sdk.createAgent({ name: 'Sequential' });
for (let i = 1; i <= 3; i++) {
  const response = await sdk.sendMessage(agent.id, `Message ${i}`);
  console.log(`Response ${i}:`, response.message);
}

// Parallel processing with rate limiting
console.log('\nParallel execution:');
const messages = ['Hello', 'How are you?', 'What can you do?'];
const parallelResponses = await Promise.all(
  messages.map(msg => sdk.sendMessage(agent.id, msg))
);

parallelResponses.forEach((response, i) => {
  console.log(`Parallel ${i + 1}:`, response.message);
});`
      },
      {
        name: 'Memory and State',
        description: 'Working with agent memory and state',
        code: `const sdk = new SoulfraSDK('test_api_key');

// Create agent with memory
const agent = await sdk.createAgent({
  name: 'Memory Agent',
  personality: 'thoughtful',
  memory_enabled: true
});

// Build conversation history
const conversation = [
  "My name is Alice",
  "I like programming",
  "What's my name?",
  "What do I like?"
];

for (const message of conversation) {
  console.log('\nUser:', message);
  const response = await sdk.sendMessage(agent.id, message);
  console.log('Agent:', response.message);
}

// Agent should remember context from earlier messages`
      }
    ];
  }

  // Sandbox management
  getSandbox(sessionId) {
    return this.sandboxes.get(sessionId);
  }

  clearSandbox(sessionId) {
    return this.sandboxes.delete(sessionId);
  }

  getExecutionHistory(sessionId) {
    return this.executionHistory.filter(exec => exec.sessionId === sessionId);
  }

  // Code validation and linting
  validateCode(code) {
    try {
      new vm.Script(code, { timeout: 100 });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: {
          message: error.message,
          line: error.stack ? error.stack.split('\n')[0] : null
        }
      };
    }
  }

  // Export/Import functionality
  exportSession(sessionId) {
    const sandbox = this.sandboxes.get(sessionId);
    const history = this.getExecutionHistory(sessionId);
    
    return {
      sessionId,
      created: sandbox?.created,
      executions: history,
      lastCode: history[history.length - 1]?.code
    };
  }
}

module.exports = CodePlayground;