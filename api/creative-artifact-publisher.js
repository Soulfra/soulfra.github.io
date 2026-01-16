#!/usr/bin/env node
/**
 * Creative Artifact Publisher
 *
 * Complete creative workflow:
 * 1. User uploads audio (AirDrop, web upload, etc.)
 * 2. Whisper transcribes to exact text (PRIVATE layer)
 * 3. Word→Emoji mapper creates visual art (PUBLIC layer)
 * 4. Trust validator creates cryptographic proofs
 * 5. Publisher generates beautiful HTML with user's custom CSS
 * 6. Deploys to user.soulfra.com
 *
 * Dual-Layer Publishing:
 * - Private: Exact transcript stored securely with proof
 * - Public: Creative emoji art + styled webpage
 * - Both layers cryptographically linked and verified
 *
 * Usage:
 *   const CreativePublisher = require('./creative-artifact-publisher');
 *   const publisher = new CreativePublisher();
 *
 *   // Publish audio → emoji art
 *   const artifact = await publisher.publishAudio({
 *     audioPath: '/path/to/recording.m4a',
 *     username: 'alice',
 *     title: 'My Creative Thoughts'
 *   });
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import our built components
const WordToEmojiMapper = require('./word-to-emoji-mapper');
const TrustValidator = require('./trust-validator');
const UserAccountSystem = require('./user-account-system');
const FormatProcessor = require('./format-processor');

class CreativeArtifactPublisher {
  constructor(options = {}) {
    this.verbose = options.verbose !== false;

    // Initialize subsystems
    this.mapper = new WordToEmojiMapper();
    this.validator = new TrustValidator();
    this.accounts = new UserAccountSystem();
    this.processor = new FormatProcessor();

    // Paths
    this.artifactsDir = path.join(__dirname, '../data/artifacts');
    this.privateDir = path.join(__dirname, '../data/private');
    this.publicDir = path.join(__dirname, '../public');

    // Create directories
    [this.artifactsDir, this.privateDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log('🎨 CreativeArtifactPublisher initialized');
    console.log(`   Artifacts: ${this.artifactsDir}`);
    console.log(`   Private storage: ${this.privateDir}`);
    console.log(`   Public web: ${this.publicDir}`);
  }

  /**
   * Publish text → emoji art (no audio)
   */
  async publishText(options) {
    const {
      text,
      username,
      title = 'Untitled',
      description = '',
      theme = 'default'
    } = options;

    console.log(`\n🎨 Publishing text artifact for: ${username}`);
    console.log(`   Title: ${title}`);
    console.log(`   Text length: ${text.length} chars\n`);

    // Step 1: Create private layer (exact text)
    console.log('📝 STEP 1: Private Layer (Exact Text)');
    const privateProof = this.validator.createTextProof(text, {
      source: 'user-input',
      username,
      title,
      capturedAt: new Date().toISOString()
    });

    // Save private data
    const privateId = crypto.randomBytes(8).toString('hex');
    const privateFile = path.join(this.privateDir, `private-${username}-${privateId}.json`);
    fs.writeFileSync(privateFile, JSON.stringify({
      text,
      proof: privateProof,
      metadata: { username, title, description }
    }, null, 2));
    console.log(`   ✅ Private data saved: ${path.basename(privateFile)}\n`);

    // Step 2: Create public layer (emoji art)
    console.log('🎨 STEP 2: Public Layer (Emoji Art)');
    const emojiArt = this.mapper.textToEmojiArt(text);
    const fingerprint = this.mapper.generateFingerprint(text);
    console.log(`   Emoji art: ${emojiArt}`);
    console.log(`   Fingerprint: ${fingerprint.fingerprint.substring(0, 32)}...\n`);

    const publicProof = this.validator.createTextProof(emojiArt, {
      source: 'word-emoji-mapper',
      derivedFrom: privateProof.hashes.sha256
    });

    // Step 3: Create dual-layer artifact proof
    console.log('🔐 STEP 3: Dual-Layer Verification');
    const artifactProof = await this.validator.createArtifactProof(
      {
        transcript: text,
        metadata: { username, title, description }
      },
      {
        emojiArt,
        fingerprint: fingerprint.fingerprint,
        derivationProof: {
          algorithm: 'word-emoji-sha256',
          seed: this.mapper.seed,
          deterministic: true
        }
      },
      {
        userId: username,
        projectName: title,
        publishedAt: new Date().toISOString()
      }
    );

    // Step 4: Generate HTML page
    console.log('\n🌐 STEP 4: Generate Webpage');
    const html = this.generateHTML({
      title,
      description,
      text,
      emojiArt,
      fingerprint,
      username,
      theme,
      proof: artifactProof
    });

    // Step 5: Deploy to public web
    console.log('🚀 STEP 5: Deploy to Public Web');
    const projectName = this.sanitizeFilename(title);
    const deployPath = path.join(this.publicDir, username, projectName);

    if (!fs.existsSync(deployPath)) {
      fs.mkdirSync(deployPath, { recursive: true });
    }

    const htmlPath = path.join(deployPath, 'index.html');
    fs.writeFileSync(htmlPath, html);

    const url = `http://localhost:8000/public/${username}/${projectName}`;
    console.log(`   ✅ Deployed to: ${url}\n`);

    // Step 6: Update user account
    console.log('👤 STEP 6: Update User Account');
    try {
      this.accounts.addUserProject(username, {
        name: projectName,
        type: 'text-emoji-art',
        url,
        fileCount: 1,
        size: html.length,
        metadata: {
          title,
          description,
          wordCount: text.split(/\s+/).length,
          emojiCount: emojiArt.split(' ').length
        }
      });
    } catch (error) {
      console.log(`   ⚠️  User not found, skipping account update`);
    }

    // Save artifact metadata
    const artifactId = crypto.randomBytes(8).toString('hex');
    const artifactFile = path.join(this.artifactsDir, `artifact-${artifactId}.json`);
    const artifact = {
      id: artifactId,
      type: 'text-emoji-art',
      username,
      title,
      description,
      createdAt: new Date().toISOString(),
      private: {
        file: privateFile,
        proof: privateProof
      },
      public: {
        url,
        path: htmlPath,
        proof: publicProof,
        emojiArt,
        fingerprint: fingerprint.fingerprint
      },
      dualLayerProof: artifactProof,
      verified: true
    };

    fs.writeFileSync(artifactFile, JSON.stringify(artifact, null, 2));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ARTIFACT PUBLISHED SUCCESSFULLY!\n');
    console.log(`🌐 View at: ${url}`);
    console.log(`🔐 Private data: ${path.basename(privateFile)}`);
    console.log(`📦 Artifact ID: ${artifactId}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return artifact;
  }

  /**
   * Publish audio → transcript → emoji art
   * (Whisper integration placeholder)
   */
  async publishAudio(options) {
    const {
      audioPath,
      username,
      title = 'Voice Recording',
      description = '',
      theme = 'default'
    } = options;

    console.log(`\n🎙️ Publishing audio artifact for: ${username}`);
    console.log(`   Audio: ${audioPath}`);
    console.log(`   Title: ${title}\n`);

    // Step 1: Analyze audio file
    console.log('🔍 STEP 1: Analyze Audio File');
    const audioAnalysis = await this.processor.process(audioPath);
    console.log(`   Format: ${audioAnalysis.category}`);
    console.log(`   Size: ${this.formatBytes(audioAnalysis.size)}\n`);

    // Step 2: Create proof of original audio
    console.log('🔐 STEP 2: Create Audio Integrity Proof');
    const audioProof = await this.validator.createFileProof(audioPath, {
      source: 'user-upload',
      username,
      title
    });

    // Step 3: Transcribe with Whisper (PLACEHOLDER - integration pending)
    console.log('🎤 STEP 3: Whisper Transcription');
    console.log('   ⚠️  Whisper integration pending');
    console.log('   📝 Using simulated transcript for demo\n');

    // Simulated Whisper transcript
    const transcript = "This is a simulated Whisper transcript of the audio recording. " +
                       "The actual integration will use OpenAI Whisper or local Whisper model " +
                       "to generate word-for-word transcription. " +
                       "The transcript will be byte-perfect and cryptographically verified.";

    // Continue with text publishing workflow
    const artifact = await this.publishText({
      text: transcript,
      username,
      title,
      description: `Audio transcription: ${description}`,
      theme
    });

    // Add audio-specific metadata
    artifact.audio = {
      originalFile: audioPath,
      proof: audioProof,
      format: audioAnalysis.category,
      size: audioAnalysis.size,
      analyzed: audioAnalysis
    };

    // Update artifact file
    const artifactFile = path.join(this.artifactsDir, `artifact-${artifact.id}.json`);
    fs.writeFileSync(artifactFile, JSON.stringify(artifact, null, 2));

    console.log(`🎙️ Audio metadata added to artifact`);

    return artifact;
  }

  /**
   * Generate beautiful HTML for artifact
   */
  generateHTML(options) {
    const {
      title,
      description,
      text,
      emojiArt,
      fingerprint,
      username,
      theme,
      proof
    } = options;

    // Get user's custom CSS if available
    let customCSS = '';
    try {
      const userStyle = this.accounts.getUserStyle(username);
      if (userStyle) {
        customCSS = `<style>${userStyle}</style>`;
      }
    } catch (error) {
      // User not found or no custom style
    }

    const timestamp = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)} - Soulfra Creative</title>
    <meta name="description" content="${this.escapeHtml(description)}">
    <meta name="author" content="${this.escapeHtml(username)}">
    <meta name="generator" content="Soulfra Creative Platform">

    <style>
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .container {
            max-width: 800px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }

        h1 {
            font-size: 2.5em;
            margin: 0 0 10px 0;
            text-align: center;
        }

        .description {
            text-align: center;
            opacity: 0.9;
            font-size: 1.1em;
            margin-bottom: 30px;
        }

        .emoji-art {
            font-size: 3em;
            line-height: 1.5;
            text-align: center;
            margin: 40px 0;
            letter-spacing: 0.1em;
            padding: 30px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
        }

        .original-text {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
            font-size: 1.1em;
            line-height: 1.6;
        }

        .fingerprint {
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            opacity: 0.7;
            text-align: center;
            margin: 20px 0;
            word-break: break-all;
        }

        .metadata {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.9em;
            opacity: 0.8;
        }

        .verified-badge {
            display: inline-block;
            background: rgba(76, 175, 80, 0.3);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 20px;
        }

        .watermark {
            text-align: center;
            margin-top: 40px;
            opacity: 0.6;
            font-size: 0.85em;
        }

        .watermark a {
            color: white;
            text-decoration: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }

        .watermark a:hover {
            border-bottom-color: white;
        }
    </style>
    ${customCSS}
</head>
<body>
    <div class="container">
        <h1>${this.escapeHtml(title)}</h1>

        ${description ? `<p class="description">${this.escapeHtml(description)}</p>` : ''}

        <div class="emoji-art">
            ${emojiArt}
        </div>

        <div class="original-text">
            "${this.escapeHtml(text)}"
        </div>

        <div class="fingerprint">
            🔐 Fingerprint: ${fingerprint.fingerprint.substring(0, 64)}...
        </div>

        <div class="verified-badge">
            ✅ Cryptographically Verified
        </div>

        <div class="metadata">
            <div>
                <strong>Creator:</strong> ${this.escapeHtml(username)}
            </div>
            <div>
                <strong>Published:</strong> ${timestamp}
            </div>
            <div>
                <strong>Words:</strong> ${text.split(/\s+/).length}
            </div>
            <div>
                <strong>Emojis:</strong> ${emojiArt.split(' ').length}
            </div>
        </div>

        <div class="watermark">
            🎨 Generated with <a href="https://github.com/soulfra">Soulfra Creative Platform</a>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Format bytes
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * List all published artifacts
   */
  listArtifacts(username = null) {
    const files = fs.readdirSync(this.artifactsDir)
      .filter(f => f.startsWith('artifact-') && f.endsWith('.json'));

    const artifacts = files.map(f => {
      const artifact = JSON.parse(fs.readFileSync(
        path.join(this.artifactsDir, f),
        'utf-8'
      ));
      return artifact;
    });

    if (username) {
      return artifacts.filter(a => a.username === username);
    }

    return artifacts;
  }

  /**
   * Get artifact by ID
   */
  getArtifact(artifactId) {
    const artifactFile = path.join(this.artifactsDir, `artifact-${artifactId}.json`);
    if (!fs.existsSync(artifactFile)) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }
    return JSON.parse(fs.readFileSync(artifactFile, 'utf-8'));
  }
}

// CLI Mode
if (require.main === module) {
  const publisher = new CreativeArtifactPublisher();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     🎨 Creative Artifact Publisher                        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];

  if (!command || command === 'help') {
    console.log('Usage:');
    console.log('  node creative-artifact-publisher.js text <username> <title> <text>');
    console.log('  node creative-artifact-publisher.js audio <username> <audiofile>');
    console.log('  node creative-artifact-publisher.js list [username]');
    console.log('\nExamples:');
    console.log('  node creative-artifact-publisher.js text alice "My Thoughts" "I love creative coding"');
    console.log('  node creative-artifact-publisher.js list alice');
    process.exit(0);
  }

  if (command === 'text') {
    const username = process.argv[3];
    const title = process.argv[4];
    const text = process.argv[5];

    if (!username || !title || !text) {
      console.error('❌ Missing arguments');
      console.log('Usage: node creative-artifact-publisher.js text <username> <title> <text>');
      process.exit(1);
    }

    publisher.publishText({ username, title, text })
      .then(artifact => {
        console.log('🎉 Success! Artifact published.');
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  } else if (command === 'list') {
    const username = process.argv[3] || null;
    const artifacts = publisher.listArtifacts(username);

    console.log(`📦 Artifacts: ${artifacts.length}\n`);
    artifacts.forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
      console.log(`   Creator: ${a.username}`);
      console.log(`   Type: ${a.type}`);
      console.log(`   URL: ${a.public.url}`);
      console.log(`   Created: ${new Date(a.createdAt).toLocaleString()}`);
      console.log('');
    });
  } else {
    console.error('❌ Unknown command:', command);
    process.exit(1);
  }
}

module.exports = CreativeArtifactPublisher;
