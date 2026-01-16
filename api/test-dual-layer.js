#!/usr/bin/env node
/**
 * Dual-Layer Trust Test
 *
 * Demonstrates complete trust model:
 * - Private Layer: Exact transcript preservation
 * - Public Layer: Deterministic emoji art
 * - Verification: Cryptographic proofs for both
 */

const TrustValidator = require('./trust-validator');
const WordToEmojiMapper = require('./word-to-emoji-mapper');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║      🔐 Dual-Layer Trust Verification Demo                ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Initialize systems
const validator = new TrustValidator();
const mapper = new WordToEmojiMapper();

// Simulated Whisper transcript (private/exact)
const privateTranscript = "I love creative coding and building amazing things with AI";

console.log('📝 PRIVATE LAYER (Exact Transcript):');
console.log(`   "${privateTranscript}"\n`);

// Create proof of private transcript
const privateProof = validator.createTextProof(privateTranscript, {
  source: 'whisper-transcription',
  model: 'whisper-1',
  language: 'en'
});

console.log('\n🎨 PUBLIC LAYER (Creative Emoji Art):');
const emojiArt = mapper.textToEmojiArt(privateTranscript);
console.log(`   ${emojiArt}\n`);

// Get fingerprint
const fingerprint = mapper.generateFingerprint(privateTranscript);
console.log(`🔑 Emoji Fingerprint: ${fingerprint.fingerprint.substring(0, 32)}...\n`);

// Create proof of emoji art
const publicProof = validator.createTextProof(emojiArt, {
  source: 'word-emoji-mapper',
  seed: 'soulfra-creative-2026'
});

// Create complete dual-layer artifact proof
console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('🔐 CREATING DUAL-LAYER ARTIFACT PROOF...\n');

const artifactProof = validator.createArtifactProof(
  {
    transcript: privateTranscript,
    metadata: {
      source: 'whisper',
      timestamp: new Date().toISOString()
    }
  },
  {
    emojiArt: emojiArt,
    fingerprint: fingerprint.fingerprint,
    derivationProof: {
      algorithm: 'word-emoji-deterministic-mapping',
      seed: 'soulfra-creative-2026',
      version: '1.0'
    }
  },
  {
    userId: 'test-user',
    projectName: 'dual-layer-demo'
  }
);

artifactProof.then(proof => {
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('✅ VERIFICATION TESTS:\n');

  // Test 1: Verify private transcript hasn't changed
  console.log('Test 1: Private Transcript Integrity');
  const verifyPrivate = validator.verifyTextProof(privateTranscript, privateProof);
  console.log(`   Result: ${verifyPrivate.valid ? '✅ EXACT MATCH' : '❌ TAMPERED'}\n`);

  // Test 2: Verify emoji art is deterministic
  console.log('Test 2: Deterministic Emoji Mapping');
  const verifyDeterministic = validator.verifyDeterministicTransform(
    privateTranscript,
    (text) => mapper.textToEmojiArt(text),
    emojiArt
  );

  // Test 3: Verify emoji art hasn't changed
  console.log('\nTest 3: Public Emoji Art Integrity');
  const verifyPublic = validator.verifyTextProof(emojiArt, publicProof);
  console.log(`   Result: ${verifyPublic.valid ? '✅ EXACT MATCH' : '❌ TAMPERED'}\n`);

  // Test 4: Reproduce emoji art from transcript (prove determinism)
  console.log('Test 4: Reproducibility (Same Input → Same Output)');
  const reproduced = mapper.textToEmojiArt(privateTranscript);
  const reproducedMatch = reproduced === emojiArt;
  console.log(`   Original:    ${emojiArt}`);
  console.log(`   Reproduced:  ${reproduced}`);
  console.log(`   Result: ${reproducedMatch ? '✅ DETERMINISTIC' : '❌ NON-DETERMINISTIC'}\n`);

  // Final verdict
  console.log('═══════════════════════════════════════════════════════════\n');
  const allValid = verifyPrivate.valid && verifyDeterministic.valid &&
                   verifyPublic.valid && reproducedMatch;

  if (allValid) {
    console.log('🎉 ALL TESTS PASSED - COMPLETE TRUST VERIFIED\n');
    console.log('This proves:');
    console.log('  ✅ Private transcript is byte-perfect (not tampered)');
    console.log('  ✅ Emoji art is deterministically derived from transcript');
    console.log('  ✅ Public art is cryptographically verified');
    console.log('  ✅ Transformation is reproducible (same input → same output)\n');
    console.log('💡 You can trust the system for word-for-word Whisper transcripts');
    console.log('   AND creative emoji visualizations!\n');
  } else {
    console.log('❌ VERIFICATION FAILED - TRUST COMPROMISED\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Show what certificate looks like
  console.log('📜 TRUST CERTIFICATE:\n');
  console.log(validator.exportCertificate(proof));

}).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
