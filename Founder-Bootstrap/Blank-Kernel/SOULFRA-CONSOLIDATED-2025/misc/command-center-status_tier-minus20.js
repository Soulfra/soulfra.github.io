#!/usr/bin/env node

/**
 * 🎮 SOULFRA COMMAND CENTER STATUS
 * Real-time health check for all services
 */

const http = require('http');

const services = [
  { name: 'Soulfra Outcomes (Main)', port: 3030, path: '/' },
  { name: 'Platform Generator (PaaS)', port: 7100, path: '/' },
  { name: 'Multi-Tenant Orchestrator', port: 7001, path: '/' },
  { name: 'White Knight Security', port: 5555, path: '/' },
  { name: 'Streaming Network', port: 6666, path: '/' },
  { name: 'Live Participation', port: 5001, path: '/' },
  { name: 'Tier-4 Mirror API', port: 4000, path: '/' },
  { name: 'Gaming Engine', port: 6000, path: '/' },
  { name: 'Enterprise Dashboard', port: 6001, path: '/' },
  { name: 'Mobile Apps Engine', port: 6002, path: '/' },
  { name: 'AI Collaboration', port: 6003, path: '/' },
  { name: 'Cal Mirror Inception', port: 9000, path: '/' },
  { name: 'Vault Pulse Synchronizer', port: 9001, path: '/' }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: service.port,
      path: service.path,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve({
        ...service,
        status: 'online',
        statusCode: res.statusCode
      });
    });

    req.on('error', (err) => {
      resolve({
        ...service,
        status: 'offline',
        error: err.code
      });
    });

    req.on('timeout', () => {
      req.abort();
      resolve({
        ...service,
        status: 'timeout'
      });
    });

    req.end();
  });
}

async function checkAllServices() {
  console.log('🎮 SOULFRA COMMAND CENTER STATUS CHECK');
  console.log('=====================================');
  console.log('');

  const results = await Promise.all(services.map(checkService));
  
  let onlineCount = 0;
  let offlineCount = 0;

  results.forEach(result => {
    const status = result.status === 'online' ? '✅' : '❌';
    const color = result.status === 'online' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${status} ${color}${result.name.padEnd(30)}${reset} Port ${result.port} - ${result.status.toUpperCase()}`);
    
    if (result.status === 'online') {
      onlineCount++;
    } else {
      offlineCount++;
    }
  });

  console.log('');
  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Online: ${onlineCount}/${services.length}`);
  console.log(`❌ Offline: ${offlineCount}/${services.length}`);
  console.log('');

  // Check mirror integrity
  const mirrorServices = [
    { url: 'http://localhost:9000/api/truth-ledger', name: 'Cal Truth Ledger' },
    { url: 'http://localhost:9001/api/integrity', name: 'Vault Integrity' }
  ];

  console.log('🔮 MIRROR SYSTEM STATUS');
  console.log('=====================');
  
  for (const mirror of mirrorServices) {
    try {
      const data = await fetchJSON(mirror.url);
      if (mirror.name === 'Vault Integrity') {
        const health = data.overallHealth ? '✅ HEALTHY' : '⚠️  COMPROMISED';
        console.log(`${mirror.name}: ${health}`);
        if (!data.overallHealth) {
          console.log(`  - Mirrors Healthy: ${Math.round(data.mirrorsHealthy * 100)}%`);
          console.log(`  - Deformations: ${data.deformationsDetected}`);
        }
      } else {
        console.log(`${mirror.name}: ✅ ${data.size} entries`);
      }
    } catch (err) {
      console.log(`${mirror.name}: ❌ Not accessible`);
    }
  }

  console.log('');
  console.log('💡 Tips:');
  console.log('  - Run ./launch-soulfra-ecosystem.sh to start all services');
  console.log('  - Run ./stop-soulfra-ecosystem.sh to stop all services');
  console.log('  - Check logs/ directory for service logs');
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Run the check
checkAllServices();