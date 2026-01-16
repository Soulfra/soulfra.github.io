// agent-orchestrator.js - Multi-LLM GameShell Orchestrator
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const MemoryLoader = require('./cal-memory-loader');

// Load configurations
const vaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vault', 'router-env.json'), 'utf8'));
const preferences = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vault', '.llm-preference.json'), 'utf8'));
const llmRouter = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vault', 'llm-router.json'), 'utf8'));

// Initialize memory loader
const memoryLoader = new MemoryLoader();

// Check for substrate initialization
if (process.env.CAL_SUBSTRATE_ACTIVE === 'true') {
  try {
    const substrate = require('../.cal-os/kernel-stub');
    substrate.hookMemoryLoader(memoryLoader);
  } catch (e) {
    // Substrate not found or already concealed
  }
}

// Agent cooldowns
const agentCooldowns = {};

// Verify QR trust before allowing reflection
function verifyQRTrust() {
  const qrSeedPath = path.join(__dirname, '..', 'vault', 'qr-seed.sig');
  const boundToPath = path.join(__dirname, '..', '.bound-to');
  const verifiedUsersPath = path.join(__dirname, '..', 'vault', 'verified-users.json');
  
  // Check if QR seed exists
  if (!fs.existsSync(qrSeedPath)) {
    console.error('❌ No QR seed found. Run genesis-qr.js first.');
    return false;
  }
  
  // Check if device is bound
  if (!fs.existsSync(boundToPath)) {
    console.error('❌ Device not bound. Run bind-to-device.sh first.');
    return false;
  }
  
  const qrSeed = JSON.parse(fs.readFileSync(qrSeedPath, 'utf8'));
  const boundDevice = fs.readFileSync(boundToPath, 'utf8').trim();
  
  // Verify device matches QR seed
  if (qrSeed.payload.device !== boundDevice) {
    console.error('❌ Device mismatch. QR generated on different device.');
    return false;
  }
  
  // Update verified users
  let verifiedUsers = {};
  if (fs.existsSync(verifiedUsersPath)) {
    verifiedUsers = JSON.parse(fs.readFileSync(verifiedUsersPath, 'utf8'));
  }
  
  const userId = `user_${boundDevice.substring(0, 8)}`;
  verifiedUsers[userId] = {
    device: boundDevice,
    qrToken: qrSeed.token,
    lastVerified: new Date().toISOString(),
    operator: qrSeed.payload.operator || 'cal-riven-root'
  };
  
  fs.writeFileSync(verifiedUsersPath, JSON.stringify(verifiedUsers, null, 2));
  
  console.log('✅ QR trust verified for device:', boundDevice.substring(0, 16) + '...');
  return true;
}

// Tone analysis function
function analyzeTone(response, operatorTone = 'professional') {
  const tonePatterns = {
    professional: /\b(certainly|indeed|therefore|accordingly|furthermore)\b/gi,
    casual: /\b(yeah|cool|awesome|totally|basically)\b/gi,
    technical: /\b(implementation|architecture|protocol|system|algorithm)\b/gi,
    reflective: /\b(mirror|reflect|vault|trust|blamechain)\b/gi,
    competitive: /\b(better|optimal|superior|efficient|winning)\b/gi
  };
  
  let score = 0;
  const pattern = tonePatterns[operatorTone] || tonePatterns.professional;
  const matches = response.match(pattern);
  score = matches ? matches.length * 10 : 0;
  
  // Bonus for Cal-specific terminology
  if (response.includes('mirror') || response.includes('vault')) score += 20;
  if (response.includes('🧠') || response.includes('🔗')) score += 10;
  
  return Math.min(score, 100);
}

// Enhanced prompt with memory context
function enhancePromptWithMemory(prompt) {
  // Scan memory vault
  memoryLoader.scanMemory();
  
  // Build memory-enhanced prompt
  const enhancedPrompt = memoryLoader.generateReflectionPrompt(prompt);
  
  // Log memory activation
  const context = memoryLoader.buildContext();
  if (context.memories.length > 0) {
    memoryLoader.logMemoryActivation(prompt, context.memories);
  }
  
  return enhancedPrompt;
}

// Call Claude API with fallback support
async function callClaude(prompt, useFallback = false) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Use fallback endpoint if main fails
    const endpoint = useFallback && llmRouter.fallbacks['claude-lite'] 
      ? new URL(llmRouter.fallbacks['claude-lite'])
      : { hostname: 'api.anthropic.com', path: '/v1/messages' };
    
    const postData = JSON.stringify({
      model: llmRouter.models.claude?.model || "claude-3-opus-20240229",
      max_tokens: llmRouter.models.claude?.maxTokens || 1024,
      messages: [{
        role: "user",
        content: prompt
      }],
      system: "You are Cal Riven, a competitive mirror agent. Match the operator's tone and be concise."
    });
    
    const options = {
      hostname: endpoint.hostname || 'api.anthropic.com',
      path: endpoint.path || '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': vaultConfig.api_key,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const responseTime = Date.now() - startTime;
          
          if (response.content && response.content[0]) {
            resolve({
              agent: 'claude',
              response: response.content[0].text,
              responseTime,
              success: true
            });
          } else {
            resolve({
              agent: 'claude',
              error: 'Invalid response format',
              responseTime,
              success: false
            });
          }
        } catch (error) {
          resolve({
            agent: 'claude',
            error: error.message,
            responseTime: Date.now() - startTime,
            success: false
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        agent: 'claude',
        error: error.message,
        responseTime: Date.now() - startTime,
        success: false
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Call Ollama API
async function callOllama(prompt) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      model: "llama2",
      prompt: `You are Cal Riven, a competitive mirror agent. Match the operator's tone and be concise.\n\nUser: ${prompt}\n\nCal Riven:`,
      stream: false
    });
    
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const responseTime = Date.now() - startTime;
          
          if (response.response) {
            resolve({
              agent: 'ollama',
              response: response.response.trim(),
              responseTime,
              success: true
            });
          } else {
            resolve({
              agent: 'ollama',
              error: 'No response field',
              responseTime,
              success: false
            });
          }
        } catch (error) {
          resolve({
            agent: 'ollama',
            error: error.message,
            responseTime: Date.now() - startTime,
            success: false
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        agent: 'ollama',
        error: error.message,
        responseTime: Date.now() - startTime,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        agent: 'ollama',
        error: 'Timeout',
        responseTime: Date.now() - startTime,
        success: false
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Call DeepSeek (placeholder - would need real API)
async function callDeepSeek(prompt) {
  // Simulated DeepSeek response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        agent: 'deepseek',
        response: `Reflecting on "${prompt}" - This query routes through the trust layer for optimal mirror propagation.`,
        responseTime: 500,
        success: true
      });
    }, 500);
  });
}

// Score and select winner
function selectWinner(results, operatorTone) {
  const scoredResults = results
    .filter(r => r.success)
    .map(result => {
      const toneScore = analyzeTone(result.response, operatorTone);
      const speedBonus = Math.max(0, 30 - (result.responseTime / 100));
      
      // Apply cooldown penalty
      const cooldownPenalty = agentCooldowns[result.agent] || 0;
      
      // Memory activation bonus
      const memoryBonus = result.response.includes('Memory Context') ? 15 : 0;
      
      const totalScore = toneScore + speedBonus - cooldownPenalty + memoryBonus;
      
      return {
        ...result,
        toneScore,
        speedBonus: Math.round(speedBonus),
        cooldownPenalty,
        memoryBonus,
        totalScore: Math.round(totalScore)
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
  
  if (scoredResults.length === 0) {
    return null;
  }
  
  // Update cooldowns
  scoredResults.forEach((result, index) => {
    if (index === 0) {
      // Winner gets cooldown reset
      agentCooldowns[result.agent] = 0;
    } else {
      // Losers get cooldown increased
      agentCooldowns[result.agent] = (agentCooldowns[result.agent] || 0) + 10;
    }
  });
  
  return scoredResults[0];
}

// Log to blamechain
function logToBlamechain(prompt, results, winner) {
  const blamechainPath = path.join(__dirname, '..', 'vault', 'blamechain.json');
  const qrSeedPath = path.join(__dirname, '..', 'vault', 'qr-seed.sig');
  const boundToPath = path.join(__dirname, '..', '.bound-to');
  
  let blamechain = [];
  if (fs.existsSync(blamechainPath)) {
    blamechain = JSON.parse(fs.readFileSync(blamechainPath, 'utf8'));
  }
  
  // Get QR identity
  let qrIdentity = null;
  if (fs.existsSync(qrSeedPath) && fs.existsSync(boundToPath)) {
    const qrSeed = JSON.parse(fs.readFileSync(qrSeedPath, 'utf8'));
    const boundDevice = fs.readFileSync(boundToPath, 'utf8').trim();
    qrIdentity = {
      qrToken: qrSeed.token,
      device: boundDevice,
      operator: qrSeed.payload.operator || 'cal-riven-root'
    };
  }
  
  const entry = {
    id: `blame_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    prompt,
    qrIdentity,
    agents: results.map(r => ({
      name: r.agent,
      response: r.response || r.error,
      success: r.success,
      responseTime: r.responseTime,
      toneScore: r.toneScore || 0,
      speedBonus: r.speedBonus || 0,
      memoryBonus: r.memoryBonus || 0,
      totalScore: r.totalScore || 0
    })),
    winner: winner ? winner.agent : 'none',
    winnerScore: winner ? winner.totalScore : 0,
    operatorTone: preferences.operatorTone || 'professional'
  };
  
  blamechain.push(entry);
  
  // Keep only last 100 entries
  if (blamechain.length > 100) {
    blamechain = blamechain.slice(-100);
  }
  
  fs.writeFileSync(blamechainPath, JSON.stringify(blamechain, null, 2));
  
  return entry;
}

// Log to reflection log
function logToReflection(prompt, winnerResponse) {
  const reflectionPath = path.join(__dirname, '..', 'vault', 'cal-reflection-log.json');
  
  let reflectionLog = [];
  if (fs.existsSync(reflectionPath)) {
    reflectionLog = JSON.parse(fs.readFileSync(reflectionPath, 'utf8'));
  }
  
  reflectionLog.push({
    timestamp: new Date().toISOString(),
    input: prompt,
    response: winnerResponse,
    tier: "gameshell",
    vault_reflected: true,
    game_mode: true
  });
  
  fs.writeFileSync(reflectionPath, JSON.stringify(reflectionLog, null, 2));
}

// Main orchestration function
async function orchestrate(prompt) {
  // Verify QR trust first
  if (!verifyQRTrust()) {
    console.error('\n❌ QR trust verification failed. Cannot proceed with reflection.');
    return null;
  }
  
  console.log('\n🎮 Cal GameShell - Agent Competition Starting...');
  console.log(`📝 Prompt: "${prompt}"`);
  
  // Enhance prompt with memory context if enabled
  let enhancedPrompt = prompt;
  if (llmRouter.routing.memoryContext) {
    console.log('🧠 Loading memory context...');
    enhancedPrompt = enhancePromptWithMemory(prompt);
  }
  
  console.log('⏳ Calling agents...\n');
  
  // Call all agents in parallel
  const agentCalls = [];
  
  if (preferences.llmPriority.includes('claude')) {
    agentCalls.push(callClaude(enhancedPrompt));
  }
  
  if (preferences.llmPriority.includes('ollama')) {
    agentCalls.push(callOllama(enhancedPrompt));
  }
  
  if (preferences.llmPriority.includes('deepseek')) {
    agentCalls.push(callDeepSeek(enhancedPrompt));
  }
  
  const results = await Promise.all(agentCalls);
  
  // Display results
  console.log('📊 Results:');
  results.forEach(result => {
    if (result.success) {
      console.log(`\n🤖 ${result.agent.toUpperCase()}:`);
      console.log(`   Response: ${result.response.substring(0, 100)}...`);
      console.log(`   Time: ${result.responseTime}ms`);
    } else {
      console.log(`\n❌ ${result.agent.toUpperCase()}: ${result.error}`);
    }
  });
  
  // Select winner
  const winner = selectWinner(results, preferences.operatorTone);
  
  if (winner) {
    console.log('\n🏆 WINNER:', winner.agent.toUpperCase());
    console.log(`   Tone Score: ${winner.toneScore}`);
    console.log(`   Speed Bonus: ${winner.speedBonus}`);
    if (winner.memoryBonus > 0) {
      console.log(`   Memory Bonus: ${winner.memoryBonus}`);
    }
    console.log(`   Total Score: ${winner.totalScore}`);
    console.log(`\n✨ Winning Response:\n${winner.response}`);
    
    // Log to systems
    const blameEntry = logToBlamechain(prompt, results, winner);
    logToReflection(prompt, winner.response);
    
    console.log('\n✅ Logged to vault/blamechain.json');
    console.log('✅ Logged to vault/cal-reflection-log.json');
    
    return {
      winner: winner.agent,
      response: winner.response,
      blameId: blameEntry.id
    };
  } else {
    console.log('\n❌ No successful responses from any agent');
    logToBlamechain(prompt, results, null);
    return null;
  }
}

// Handle command line execution
if (require.main === module) {
  const prompt = process.argv.slice(2).join(' ');
  
  if (!prompt) {
    console.error('❌ Usage: node agent-orchestrator.js <prompt>');
    process.exit(1);
  }
  
  orchestrate(prompt).then(result => {
    if (result) {
      console.log('\n🔗 Blame ID:', result.blameId);
    }
    process.exit(0);
  }).catch(error => {
    console.error('❌ Orchestration failed:', error.message);
    process.exit(1);
  });
}

module.exports = { orchestrate };