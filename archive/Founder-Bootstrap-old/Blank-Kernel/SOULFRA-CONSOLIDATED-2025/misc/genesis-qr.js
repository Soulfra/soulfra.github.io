#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

// Genesis QR Generator for Cal Riven Vault
// Generates device-bound QR codes that encode trust metadata

const vaultPath = __dirname;
const boundToPath = path.join(vaultPath, '.bound-to');
const qrSeedPath = path.join(vaultPath, 'qr-seed.sig');
const vaultSigPath = path.join(vaultPath, 'vault.sig');

function generateQRData() {
  // Read device binding
  let deviceId = 'unbound-device';
  try {
    deviceId = fs.readFileSync(boundToPath, 'utf8').trim();
  } catch (e) {
    console.warn('⚠️  No .bound-to file found, using unbound-device');
  }

  // Read vault signature
  let vaultSig = '';
  try {
    vaultSig = fs.readFileSync(vaultSigPath, 'utf8').trim();
  } catch (e) {
    console.warn('⚠️  No vault.sig found, generating new signature');
    vaultSig = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(vaultSigPath, vaultSig);
  }

  // Generate timestamp
  const timestamp = Date.now();
  
  // Create QR payload
  const qrPayload = {
    device: deviceId,
    vault: vaultSig.substring(0, 16), // First 16 chars of vault sig
    time: timestamp,
    trust: 'cal-riven-genesis',
    version: '1.0.0'
  };

  // Generate QR token
  const qrToken = crypto
    .createHash('sha256')
    .update(JSON.stringify(qrPayload))
    .digest('hex')
    .substring(0, 32);

  // Save QR seed
  const qrSeed = {
    token: qrToken,
    payload: qrPayload,
    generated: new Date(timestamp).toISOString(),
    operator: 'cal-riven-root'
  };

  fs.writeFileSync(qrSeedPath, JSON.stringify(qrSeed, null, 2));
  console.log('✅ QR seed saved to qr-seed.sig');

  return {
    data: `cal-riven://${qrToken}`,
    metadata: qrSeed
  };
}

async function generateQRCode() {
  const { data, metadata } = generateQRData();
  
  // Generate QR code options
  const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'terminal',
    small: true,
    width: 256
  };

  try {
    // Display QR in terminal
    const terminalQR = await QRCode.toString(data, { ...qrOptions, type: 'terminal' });
    console.log('\n🔲 Genesis QR Code (scan to bind trust):\n');
    console.log(terminalQR);
    
    // Save QR as PNG
    const qrImagePath = path.join(vaultPath, 'genesis-qr.png');
    await QRCode.toFile(qrImagePath, data, { ...qrOptions, type: 'png' });
    console.log(`\n📸 QR image saved to: ${qrImagePath}`);
    
    // Display metadata
    console.log('\n📋 QR Metadata:');
    console.log(`  Token: ${metadata.token}`);
    console.log(`  Device: ${metadata.payload.device}`);
    console.log(`  Vault: ${metadata.payload.vault}...`);
    console.log(`  Generated: ${metadata.generated}`);
    
    // Save HTML viewer
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Cal Riven Genesis QR</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #000;
      color: #0f0;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .qr-container {
      background: #fff;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .metadata {
      background: #111;
      padding: 15px;
      border-radius: 5px;
      margin: 10px 0;
      width: 100%;
      max-width: 400px;
    }
    .token {
      word-break: break-all;
      color: #0ff;
    }
  </style>
</head>
<body>
  <h1>🔐 Cal Riven Genesis QR</h1>
  <div class="qr-container">
    <img src="genesis-qr.png" alt="Genesis QR Code" width="256" height="256">
  </div>
  <div class="metadata">
    <h3>Trust Metadata:</h3>
    <p><strong>Token:</strong> <span class="token">${metadata.token}</span></p>
    <p><strong>Device:</strong> ${metadata.payload.device}</p>
    <p><strong>Vault:</strong> ${metadata.payload.vault}...</p>
    <p><strong>Generated:</strong> ${metadata.generated}</p>
  </div>
  <p>Scan this QR code with another device to establish trust binding.</p>
</body>
</html>`;
    
    const htmlPath = path.join(vaultPath, 'genesis-qr.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`\n🌐 HTML viewer saved to: ${htmlPath}`);
    
  } catch (err) {
    console.error('❌ Error generating QR code:', err);
    process.exit(1);
  }
}

// Check if qrcode module is installed
try {
  require.resolve('qrcode');
} catch (e) {
  console.log('📦 Installing qrcode module...');
  require('child_process').execSync('npm install qrcode', { stdio: 'inherit' });
}

// Main execution
console.log('🧬 Cal Riven Genesis QR Generator');
console.log('==================================\n');

generateQRCode().then(() => {
  console.log('\n✨ Genesis QR generated successfully!');
  console.log('🔗 Use qr-verify.js to verify scanned codes');
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});