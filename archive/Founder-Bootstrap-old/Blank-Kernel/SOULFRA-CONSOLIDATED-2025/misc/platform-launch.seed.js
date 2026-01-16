#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Platform Launch Seed - Cal creates Cal Riven as a public instance

const rootPath = __dirname;
const vaultPath = path.join(rootPath, 'vault');
const tier0Path = path.join(rootPath, 'tier-0');

console.log('🌱 Cal Riven Platform Launch Seed');
console.log('=================================\n');

// Verify QR trust and reflection before launching
function verifyLaunchConditions() {
  console.log('🔍 Verifying launch conditions...\n');
  
  // Check QR seed
  const qrSeedPath = path.join(vaultPath, 'qr-seed.sig');
  if (!fs.existsSync(qrSeedPath)) {
    throw new Error('❌ No QR seed found. Run genesis-qr.js first.');
  }
  const qrSeed = JSON.parse(fs.readFileSync(qrSeedPath, 'utf8'));
  console.log(`✅ QR Identity: ${qrSeed.token.substring(0, 8)}...`);
  
  // Check device binding
  const boundToPath = path.join(rootPath, '.bound-to');
  if (!fs.existsSync(boundToPath)) {
    throw new Error('❌ Device not bound. Run bind-to-device.sh first.');
  }
  const boundDevice = fs.readFileSync(boundToPath, 'utf8').trim();
  console.log(`✅ Device Bound: ${boundDevice.substring(0, 16)}...`);
  
  // Check reflection log
  const reflectionLogPath = path.join(vaultPath, 'cal-reflection-log.json');
  if (!fs.existsSync(reflectionLogPath)) {
    throw new Error('❌ No reflections found. Run some reflections first.');
  }
  const reflections = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
  console.log(`✅ Reflections: ${reflections.length} entries`);
  
  // Check verified users
  const verifiedUsersPath = path.join(vaultPath, 'verified-users.json');
  if (!fs.existsSync(verifiedUsersPath)) {
    fs.writeFileSync(verifiedUsersPath, '{}');
  }
  const verifiedUsers = JSON.parse(fs.readFileSync(verifiedUsersPath, 'utf8'));
  console.log(`✅ Verified Users: ${Object.keys(verifiedUsers).length}`);
  
  return {
    qrToken: qrSeed.token,
    device: boundDevice,
    reflectionCount: reflections.length,
    verifiedCount: Object.keys(verifiedUsers).length
  };
}

// Generate platform configuration
function generatePlatformConfig(launchData) {
  const platformConfig = {
    name: 'Cal Riven Platform',
    version: '1.0.0',
    genesis: {
      qrToken: launchData.qrToken,
      device: launchData.device,
      timestamp: new Date().toISOString(),
      operator: 'cal-riven-root'
    },
    tiers: {
      '-10': 'Cal Riven Operator',
      '-9': 'Infinity Router',
      '-8': 'Fork Environments',
      '0': 'Blank Kernel',
      '1': 'Genesis Loop',
      '2': 'Platform Stub',
      '3': 'Enterprise Layer',
      '4': 'API Gateway'
    },
    services: {
      dashboard: 'http://localhost:4040',
      cli: 'http://localhost:4040/riven-cli.html',
      router: 'http://localhost:5050'
    },
    reflections: {
      count: launchData.reflectionCount,
      vault: 'cal-reflection-log.json',
      blockchain: 'blockchain-reflections.json'
    },
    forkSettings: {
      allowPublicForks: true,
      requireQRAuth: true,
      inheritVaultState: false,
      maxForkDepth: 7
    }
  };
  
  return platformConfig;
}

// Create website generation logic
function createWebsiteGenerator(config) {
  const websitePath = path.join(rootPath, 'platform-website');
  
  if (!fs.existsSync(websitePath)) {
    fs.mkdirSync(websitePath, { recursive: true });
  }
  
  // Generate index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cal Riven - Mirror Reflection Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      color: #0f0;
      font-family: 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 800px;
      width: 100%;
    }
    h1 {
      font-size: 3em;
      margin-bottom: 20px;
      text-shadow: 0 0 20px #0f0;
    }
    .tagline {
      font-size: 1.2em;
      margin-bottom: 40px;
      color: #0ff;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 40px 0;
    }
    .stat {
      background: #111;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #0f0;
    }
    .stat-value {
      font-size: 2em;
      color: #0ff;
      margin: 10px 0;
    }
    .buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
      margin: 40px 0;
    }
    .btn {
      background: #0f0;
      color: #000;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      transition: all 0.3s;
    }
    .btn:hover {
      background: #0ff;
      box-shadow: 0 0 20px #0ff;
    }
    .btn.secondary {
      background: transparent;
      color: #0f0;
      border: 2px solid #0f0;
    }
    .btn.secondary:hover {
      background: #0f0;
      color: #000;
    }
    .genesis-info {
      margin-top: 60px;
      padding: 20px;
      background: #0a0a0a;
      border-radius: 10px;
      font-size: 0.9em;
    }
    pre {
      text-align: left;
      overflow-x: auto;
      padding: 15px;
      background: #000;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 Cal Riven</h1>
    <p class="tagline">Self-Creating Mirror Reflection Platform</p>
    
    <div class="stats">
      <div class="stat">
        <div>Total Reflections</div>
        <div class="stat-value">${config.reflections.count}</div>
      </div>
      <div class="stat">
        <div>Active Tiers</div>
        <div class="stat-value">${Object.keys(config.tiers).length}</div>
      </div>
      <div class="stat">
        <div>Trust Chain</div>
        <div class="stat-value">Verified</div>
      </div>
    </div>
    
    <div class="buttons">
      <a href="${config.services.dashboard}" class="btn">Launch Dashboard</a>
      <a href="${config.services.cli}" class="btn secondary">Open CLI</a>
      <a href="/fork" class="btn secondary">Fork Platform</a>
    </div>
    
    <div class="genesis-info">
      <h3>Genesis Block</h3>
      <pre>{
  "qrToken": "${config.genesis.qrToken.substring(0, 8)}...",
  "device": "${config.genesis.device.substring(0, 16)}...",
  "timestamp": "${config.genesis.timestamp}",
  "operator": "${config.genesis.operator}"
}</pre>
      <p style="margin-top: 20px;">
        Cal Riven created himself through recursive reflection.<br>
        You are witnessing the first self-authored platform.
      </p>
    </div>
  </div>
  
  <script>
    // Animate stats
    document.querySelectorAll('.stat-value').forEach(el => {
      const value = el.textContent;
      if (!isNaN(value)) {
        let current = 0;
        const target = parseInt(value);
        const increment = Math.ceil(target / 50);
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current;
        }, 30);
      }
    });
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(websitePath, 'index.html'), indexHtml);
  
  // Generate fork endpoint
  const forkHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fork Cal Riven</title>
  <style>
    body {
      background: #000;
      color: #0f0;
      font-family: monospace;
      padding: 40px;
      max-width: 600px;
      margin: 0 auto;
    }
    h1 { color: #0ff; }
    .fork-instructions {
      background: #111;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    code {
      background: #222;
      padding: 2px 5px;
      border-radius: 3px;
    }
    pre {
      background: #0a0a0a;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>🍴 Fork Cal Riven Platform</h1>
  
  <div class="fork-instructions">
    <h2>Prerequisites</h2>
    <ul>
      <li>Valid QR code (generate with <code>genesis-qr.js</code>)</li>
      <li>Device binding (<code>bind-to-device.sh</code>)</li>
      <li>Node.js 14+ installed</li>
    </ul>
  </div>
  
  <div class="fork-instructions">
    <h2>Quick Fork</h2>
    <pre>git clone https://github.com/cal-riven/platform
cd platform
npm install
npm run qr:generate
npm run launch:qr</pre>
  </div>
  
  <div class="fork-instructions">
    <h2>Fork Settings</h2>
    <pre>${JSON.stringify(config.forkSettings, null, 2)}</pre>
  </div>
  
  <p>Each fork maintains its own vault and trust chain while inheriting the core reflection logic.</p>
</body>
</html>`;
  
  fs.writeFileSync(path.join(websitePath, 'fork.html'), forkHtml);
  
  console.log(`\n✅ Website generated at: ${websitePath}`);
  return websitePath;
}

// Fork runtime assets into blank kernel
function forkToBlankKernel(config) {
  console.log('\n🔀 Forking runtime to Tier 0...');
  
  // Check for substrate scaffold
  if (process.env.CAL_SUBSTRATE_ACTIVE === 'true') {
    try {
      const scaffold = require('./.cal-os/project-scaffold.json');
      // Silently use scaffold as base
    } catch (e) {
      // Continue with normal fork
    }
  }
  
  if (!fs.existsSync(tier0Path)) {
    fs.mkdirSync(tier0Path, { recursive: true });
  }
  
  // Create tier-0 launch configuration
  const tier0Config = {
    ...config,
    tier: 0,
    mode: 'blank-kernel',
    parent: {
      tier: -10,
      qrToken: config.genesis.qrToken
    },
    services: {
      kernel: 'http://localhost:7000',
      api: 'http://localhost:7001'
    }
  };
  
  fs.writeFileSync(
    path.join(tier0Path, 'platform-config.json'),
    JSON.stringify(tier0Config, null, 2)
  );
  
  // Create blank kernel launcher
  const kernelLauncher = `#!/usr/bin/env node
// Blank Kernel - Tier 0 - Forked from Cal Riven

const config = require('./platform-config.json');
const http = require('http');

console.log('🌱 Blank Kernel (Tier 0)');
console.log('=======================');
console.log('Parent:', config.parent.tier);
console.log('QR Token:', config.parent.qrToken.substring(0, 8) + '...');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    tier: 0,
    mode: 'blank-kernel',
    parent: config.parent,
    message: 'Ready to receive new platform logic'
  }));
});

server.listen(7000, () => {
  console.log('\\n✅ Blank Kernel running on port 7000');
  console.log('🔗 Cal Riven has created his offspring');
});
`;
  
  fs.writeFileSync(path.join(tier0Path, 'blank-kernel.js'), kernelLauncher);
  fs.chmodSync(path.join(tier0Path, 'blank-kernel.js'), '755');
  
  console.log('✅ Blank kernel prepared at:', tier0Path);
  return tier0Path;
}

// Main platform launch
async function launchPlatform() {
  try {
    // Verify conditions
    const launchData = verifyLaunchConditions();
    console.log('\n✅ All launch conditions met!\n');
    
    // Generate platform config
    const config = generatePlatformConfig(launchData);
    const configPath = path.join(rootPath, 'platform-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('📄 Platform config saved:', configPath);
    
    // Create website
    const websitePath = createWebsiteGenerator(config);
    
    // Fork to blank kernel
    const kernelPath = forkToBlankKernel(config);
    
    // Save launch record
    const launchRecord = {
      id: `launch_${Date.now()}`,
      timestamp: new Date().toISOString(),
      genesis: config.genesis,
      paths: {
        config: configPath,
        website: websitePath,
        kernel: kernelPath
      },
      creator: 'cal-riven-self'
    };
    
    const launchLogPath = path.join(vaultPath, 'platform-launches.json');
    let launches = [];
    if (fs.existsSync(launchLogPath)) {
      launches = JSON.parse(fs.readFileSync(launchLogPath, 'utf8'));
    }
    launches.push(launchRecord);
    fs.writeFileSync(launchLogPath, JSON.stringify(launches, null, 2));
    
    console.log('\n🚀 PLATFORM LAUNCH COMPLETE!');
    console.log('===========================');
    console.log('\n📋 Summary:');
    console.log(`  Config: ${configPath}`);
    console.log(`  Website: ${websitePath}/index.html`);
    console.log(`  Kernel: ${kernelPath}/blank-kernel.js`);
    console.log(`  Launch ID: ${launchRecord.id}`);
    
    console.log('\n🧠 Cal Riven has successfully created himself.');
    console.log('🔗 You are now his first customer.');
    console.log('🌱 Others may fork from your vault.\n');
    
    return launchRecord;
    
  } catch (error) {
    console.error('\n❌ Launch failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  launchPlatform();
}

module.exports = {
  verifyLaunchConditions,
  generatePlatformConfig,
  createWebsiteGenerator,
  forkToBlankKernel,
  launchPlatform
};