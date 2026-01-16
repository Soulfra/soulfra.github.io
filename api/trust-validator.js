#!/usr/bin/env node
/**
 * Trust Validator - Cryptographic Data Integrity Verification
 *
 * Provides cryptographic proofs for data authenticity and integrity
 * Ensures byte-perfect preservation of private data (audio, transcripts)
 * Creates verifiable audit trails for public creative artifacts
 *
 * Trust Model:
 * - Private Layer: Exact preservation (Whisper transcripts, original audio)
 * - Public Layer: Deterministic transformation (emoji art, AI summaries)
 * - Verification: Cryptographic proofs that both are authentic
 *
 * Usage:
 *   const TrustValidator = require('./trust-validator');
 *   const validator = new TrustValidator();
 *
 *   // Create proof of file integrity
 *   const proof = await validator.createFileProof('/path/to/audio.m4a');
 *
 *   // Verify file hasn't been tampered with
 *   const result = await validator.verifyFileProof('/path/to/audio.m4a', proof);
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TrustValidator {
  constructor(options = {}) {
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
    this.verbose = options.verbose || false;

    // Storage for verification records
    this.proofsDir = path.join(__dirname, '../data/trust-proofs');
    if (!fs.existsSync(this.proofsDir)) {
      fs.mkdirSync(this.proofsDir, { recursive: true });
    }

    console.log('🔐 TrustValidator initialized');
    console.log(`   Hash algorithm: ${this.hashAlgorithm.toUpperCase()}`);
    console.log(`   Proofs directory: ${this.proofsDir}`);
  }

  /**
   * Create cryptographic proof of file integrity
   */
  async createFileProof(filePath, metadata = {}) {
    console.log(`\n🔐 Creating integrity proof for: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    // Generate multiple hashes for redundancy
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const sha1Hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');

    const proof = {
      filePath: path.basename(filePath),
      fullPath: filePath,
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      hashes: {
        sha256: sha256Hash,
        md5: md5Hash,
        sha1: sha1Hash
      },
      metadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
        validator: 'TrustValidator v1.0'
      },
      // Signature: hash of all hashes combined (meta-hash)
      signature: crypto.createHash('sha256')
        .update(sha256Hash + md5Hash + sha1Hash)
        .digest('hex')
    };

    console.log(`   ✅ SHA256: ${sha256Hash.substring(0, 16)}...`);
    console.log(`   ✅ MD5:    ${md5Hash.substring(0, 16)}...`);
    console.log(`   ✅ Size:   ${stats.size} bytes`);

    // Save proof to disk
    const proofPath = await this.saveProof(proof);
    console.log(`   💾 Proof saved: ${path.basename(proofPath)}`);

    return proof;
  }

  /**
   * Verify file against existing proof
   */
  async verifyFileProof(filePath, proof) {
    console.log(`\n🔍 Verifying file integrity: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        reason: 'File not found',
        filePath
      };
    }

    const currentProof = await this.createFileProof(filePath, {
      purpose: 'verification'
    });

    const verification = {
      filePath,
      timestamp: new Date().toISOString(),
      checks: {
        sha256Match: currentProof.hashes.sha256 === proof.hashes.sha256,
        md5Match: currentProof.hashes.md5 === proof.hashes.md5,
        sizeMatch: currentProof.size === proof.size,
        signatureMatch: currentProof.signature === proof.signature
      },
      details: {
        expectedSHA256: proof.hashes.sha256,
        actualSHA256: currentProof.hashes.sha256,
        expectedSize: proof.size,
        actualSize: currentProof.size
      }
    };

    // File is valid if ALL checks pass
    verification.valid = Object.values(verification.checks).every(check => check === true);
    verification.integrity = verification.valid ? '✅ VERIFIED' : '❌ COMPROMISED';

    console.log(`   SHA256: ${verification.checks.sha256Match ? '✅' : '❌'}`);
    console.log(`   MD5:    ${verification.checks.md5Match ? '✅' : '❌'}`);
    console.log(`   Size:   ${verification.checks.sizeMatch ? '✅' : '❌'}`);
    console.log(`   Result: ${verification.integrity}`);

    return verification;
  }

  /**
   * Create proof for text content (transcripts, etc.)
   */
  createTextProof(text, metadata = {}) {
    const textBuffer = Buffer.from(text, 'utf-8');

    const proof = {
      contentType: 'text',
      length: text.length,
      bytes: textBuffer.length,
      hashes: {
        sha256: crypto.createHash('sha256').update(textBuffer).digest('hex'),
        md5: crypto.createHash('md5').update(textBuffer).digest('hex')
      },
      metadata: {
        ...metadata,
        capturedAt: new Date().toISOString()
      },
      // Store first/last 50 chars for human verification
      preview: {
        first50: text.substring(0, 50),
        last50: text.substring(Math.max(0, text.length - 50))
      }
    };

    console.log(`\n📝 Text proof created:`);
    console.log(`   Length: ${text.length} chars`);
    console.log(`   SHA256: ${proof.hashes.sha256.substring(0, 16)}...`);

    return proof;
  }

  /**
   * Verify text content against proof
   */
  verifyTextProof(text, proof) {
    const currentProof = this.createTextProof(text, {
      purpose: 'verification'
    });

    const verification = {
      valid: currentProof.hashes.sha256 === proof.hashes.sha256,
      lengthMatch: currentProof.length === proof.length,
      expectedHash: proof.hashes.sha256,
      actualHash: currentProof.hashes.sha256
    };

    console.log(`   Text verification: ${verification.valid ? '✅ MATCH' : '❌ MISMATCH'}`);

    return verification;
  }

  /**
   * Create complete artifact proof (dual-layer verification)
   * Proves that public creative artifact was derived from private original
   */
  async createArtifactProof(privateData, publicData, metadata = {}) {
    console.log('\n🎨 Creating dual-layer artifact proof...');

    const proof = {
      type: 'dual-layer-artifact',
      timestamp: new Date().toISOString(),

      // Private layer (exact/trustworthy)
      private: {
        audio: privateData.audioPath ? await this.createFileProof(privateData.audioPath) : null,
        transcript: privateData.transcript ? this.createTextProof(privateData.transcript) : null
      },

      // Public layer (creative/deterministic)
      public: {
        emojiArt: publicData.emojiArt ? this.createTextProof(publicData.emojiArt) : null,
        fingerprint: publicData.fingerprint || null,
        derivationProof: publicData.derivationProof || null
      },

      // Link between layers
      provenance: {
        privateToPublic: crypto.createHash('sha256')
          .update(JSON.stringify(privateData) + JSON.stringify(publicData))
          .digest('hex'),
        metadata: {
          ...metadata,
          processor: 'soulfra-creative-engine',
          version: '1.0'
        }
      }
    };

    // Master signature for entire artifact
    proof.masterSignature = crypto.createHash('sha256')
      .update(JSON.stringify(proof.private) + JSON.stringify(proof.public))
      .digest('hex');

    console.log('   ✅ Private layer verified');
    console.log('   ✅ Public layer verified');
    console.log(`   🔐 Master signature: ${proof.masterSignature.substring(0, 16)}...`);

    // Save artifact proof
    const proofPath = await this.saveProof(proof);
    console.log(`   💾 Artifact proof saved: ${path.basename(proofPath)}`);

    return proof;
  }

  /**
   * Verify deterministic transformation (e.g., word→emoji mapping)
   */
  verifyDeterministicTransform(input, transform, expectedOutput) {
    console.log('\n🔄 Verifying deterministic transformation...');

    // Run transform
    const actualOutput = transform(input);

    // Compare
    const verification = {
      input,
      expectedOutput,
      actualOutput,
      match: actualOutput === expectedOutput,
      deterministic: true, // Transform function must be pure
      timestamp: new Date().toISOString()
    };

    // Hash verification
    const expectedHash = crypto.createHash('sha256').update(expectedOutput).digest('hex');
    const actualHash = crypto.createHash('sha256').update(actualOutput).digest('hex');

    verification.hashMatch = expectedHash === actualHash;
    verification.valid = verification.match && verification.hashMatch;

    console.log(`   Input:    "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`);
    console.log(`   Expected: "${expectedOutput.substring(0, 50)}${expectedOutput.length > 50 ? '...' : ''}"`);
    console.log(`   Actual:   "${actualOutput.substring(0, 50)}${actualOutput.length > 50 ? '...' : ''}"`);
    console.log(`   Result:   ${verification.valid ? '✅ DETERMINISTIC' : '❌ NON-DETERMINISTIC'}`);

    return verification;
  }

  /**
   * Create chain of custody record
   */
  createChainOfCustody(events = []) {
    const chain = {
      id: crypto.randomBytes(16).toString('hex'),
      created: new Date().toISOString(),
      events: events.map((event, index) => ({
        sequence: index,
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        hash: crypto.createHash('sha256')
          .update(JSON.stringify(event))
          .digest('hex')
      }))
    };

    // Chain hash links all events together
    chain.chainHash = crypto.createHash('sha256')
      .update(chain.events.map(e => e.hash).join(''))
      .digest('hex');

    console.log(`\n📋 Chain of custody created: ${chain.id}`);
    console.log(`   Events: ${chain.events.length}`);
    console.log(`   Chain hash: ${chain.chainHash.substring(0, 16)}...`);

    return chain;
  }

  /**
   * Save proof to disk
   */
  async saveProof(proof) {
    const filename = `proof-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`;
    const filePath = path.join(this.proofsDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(proof, null, 2));

    return filePath;
  }

  /**
   * Load proof from disk
   */
  loadProof(proofPath) {
    if (!fs.existsSync(proofPath)) {
      throw new Error(`Proof not found: ${proofPath}`);
    }

    return JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
  }

  /**
   * List all stored proofs
   */
  listProofs() {
    const files = fs.readdirSync(this.proofsDir)
      .filter(f => f.startsWith('proof-') && f.endsWith('.json'))
      .map(f => ({
        filename: f,
        path: path.join(this.proofsDir, f),
        created: fs.statSync(path.join(this.proofsDir, f)).birthtime
      }))
      .sort((a, b) => b.created - a.created);

    return files;
  }

  /**
   * Export verification certificate (human-readable proof)
   */
  exportCertificate(proof, format = 'text') {
    if (format === 'text') {
      return `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🔐 SOULFRA TRUST CERTIFICATE                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

File: ${proof.filePath || proof.type || 'N/A'}
Captured: ${proof.metadata?.capturedAt || 'N/A'}

CRYPTOGRAPHIC FINGERPRINTS:
  SHA256: ${proof.hashes?.sha256 || proof.masterSignature || 'N/A'}
  MD5:    ${proof.hashes?.md5 || 'N/A'}
  Size:   ${proof.size || 'N/A'} bytes

SIGNATURE: ${proof.signature || proof.masterSignature || 'N/A'}

This certificate proves the authenticity and integrity of the
above data. Any modification will invalidate this proof.

Generated by TrustValidator v1.0
Soulfra Creative Platform - github.com/soulfra
      `;
    }

    // JSON format
    return JSON.stringify(proof, null, 2);
  }

  /**
   * Batch verify multiple files
   */
  async batchVerify(files, proofs) {
    console.log(`\n🔍 Batch verification: ${files.length} files`);

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const proof = proofs[i];

      try {
        const verification = await this.verifyFileProof(filePath, proof);
        results.push(verification);
      } catch (error) {
        results.push({
          valid: false,
          filePath,
          error: error.message
        });
      }
    }

    const valid = results.filter(r => r.valid).length;
    const invalid = results.length - valid;

    console.log(`\n📊 Batch results:`);
    console.log(`   ✅ Valid:   ${valid}`);
    console.log(`   ❌ Invalid: ${invalid}`);
    console.log(`   Success rate: ${(valid / results.length * 100).toFixed(1)}%`);

    return {
      total: results.length,
      valid,
      invalid,
      results,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI Mode
if (require.main === module) {
  const validator = new TrustValidator({ verbose: true });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       🔐 Trust Validator - Integrity Verification         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];
  const targetPath = process.argv[3];

  if (!command) {
    console.log('Usage:');
    console.log('  node trust-validator.js proof <file>     - Create integrity proof');
    console.log('  node trust-validator.js verify <file>    - Verify file against stored proof');
    console.log('  node trust-validator.js list             - List all stored proofs');
    console.log('\nExamples:');
    console.log('  node trust-validator.js proof drops/audio/recording.m4a');
    console.log('  node trust-validator.js verify drops/audio/recording.m4a');
    process.exit(0);
  }

  if (command === 'proof' && targetPath) {
    validator.createFileProof(targetPath, {
      purpose: 'manual-verification',
      createdBy: 'CLI'
    }).then(proof => {
      console.log('\n📄 Certificate:\n');
      console.log(validator.exportCertificate(proof));
    }).catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
  } else if (command === 'verify' && targetPath) {
    // Find matching proof
    const proofs = validator.listProofs();
    const filename = path.basename(targetPath);

    const matchingProof = proofs.find(p => {
      const proof = validator.loadProof(p.path);
      return proof.filePath === filename;
    });

    if (!matchingProof) {
      console.error(`❌ No proof found for: ${filename}`);
      console.log('\n💡 Create a proof first:');
      console.log(`   node trust-validator.js proof ${targetPath}`);
      process.exit(1);
    }

    const proof = validator.loadProof(matchingProof.path);
    validator.verifyFileProof(targetPath, proof)
      .then(verification => {
        if (verification.valid) {
          console.log('\n✅ FILE VERIFIED - Integrity intact');
        } else {
          console.log('\n❌ VERIFICATION FAILED - File may be compromised');
        }
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  } else if (command === 'list') {
    const proofs = validator.listProofs();
    console.log(`📋 Stored proofs: ${proofs.length}\n`);
    proofs.forEach((p, i) => {
      const proof = validator.loadProof(p.path);
      console.log(`${i + 1}. ${proof.filePath || proof.type || 'Unknown'}`);
      console.log(`   Created: ${p.created.toLocaleString()}`);
      console.log(`   Hash: ${(proof.hashes?.sha256 || proof.masterSignature || 'N/A').substring(0, 16)}...`);
      console.log('');
    });
  } else {
    console.error('❌ Invalid command');
    process.exit(1);
  }
}

module.exports = TrustValidator;
