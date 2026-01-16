// test-suite.js - Test suite for Infinity Router components

const { validateQR } = require('../qr-validator');
const { injectTraceToken } = require('../infinity-router');
const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    testsFailed++;
  }
}

function runTests() {
  console.log("🧪 Running Infinity Router Test Suite...\n");

  // Test QR Validation
  console.log("=== QR Validation Tests ===");
  assert(validateQR("qr-founder-0000") === true, "Valid QR code qr-founder-0000 should pass");
  assert(validateQR("qr-riven-001") === true, "Valid QR code qr-riven-001 should pass");
  assert(validateQR("qr-user-0821") === true, "Valid QR code qr-user-0821 should pass");
  assert(validateQR("invalid-qr") === false, "Invalid QR code should fail");
  assert(validateQR("") === false, "Empty QR code should fail");

  // Test Token Generation
  console.log("\n=== Token Generation Tests ===");
  const testQR = "qr-founder-0000";
  const token = injectTraceToken(testQR);
  
  assert(token !== null, "Token should be generated");
  assert(token.uuid === testQR, "Token UUID should match input QR");
  assert(token.trace_token.startsWith("token_"), "Token should have correct prefix");
  assert(token.tier === "-9", "Token should be from tier -9");
  assert(token.issued_at !== undefined, "Token should have timestamp");

  // Test Token File Creation
  const tokenPath = path.join(__dirname, '..', 'mirror-trace-token.json');
  assert(fs.existsSync(tokenPath), "Token file should be created");
  
  const savedToken = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  assert(savedToken.uuid === testQR, "Saved token should match generated token");

  // Test Cal Riven Integration
  console.log("\n=== Cal Riven Integration Tests ===");
  const blessingPath = path.join(__dirname, '..', 'tier-minus10', 'blessing.json');
  const signaturePath = path.join(__dirname, '..', 'tier-minus10', 'soul-chain.sig');
  
  assert(fs.existsSync(blessingPath), "Blessing file should exist");
  assert(fs.existsSync(signaturePath), "Soul chain signature should exist");
  
  const blessing = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
  assert(blessing.status === "blessed", "Agent should be blessed");
  assert(blessing.can_propagate === true, "Agent should be able to propagate");

  // Summary
  console.log("\n=== Test Summary ===");
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests();