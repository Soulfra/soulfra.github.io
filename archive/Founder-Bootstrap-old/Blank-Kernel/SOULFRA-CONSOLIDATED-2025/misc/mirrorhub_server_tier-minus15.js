#!/usr/bin/env node
/**
 * 🪞 SOULFRA MIRROR HUB SERVER
 * Public-facing web layer for routing users to private mirror instances
 * Part of the Soulfra trust-native agent platform
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.MIRROR_HUB_PORT || 8080;

// CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Ensure required directories exist
const MESH_DIR = './mesh';
const VAULT_DIR = './vault/logs';
await fs.mkdir(MESH_DIR, { recursive: true });
await fs.mkdir(VAULT_DIR, { recursive: true });

// Load configuration
let CONFIG;
try {
  CONFIG = JSON.parse(await fs.readFile('./mirrorhub-config.json', 'utf8'));
} catch (error) {
  console.log('⚠️  No config found, using defaults');
  CONFIG = {
    mode: "public",
    license_tier: "default", 
    mesh_write: true,
    github_required: false,
    bounty_enabled: true
  };
}

/**
 * PRESENCE LOGGING - Accept any user presence
 */
app.post('/api/presence', async (req, res) => {
  try {
    const { 
      user_id = `anon-${crypto.randomBytes(3).toString('hex')}`,
      whisper_text,
      voice_blessing,
      tier = 1 
    } = req.body;

    const presence = {
      user_id,
      timestamp: new Date().toISOString(),
      whisper_text: whisper_text || null,
      voice_blessing: voice_blessing || null,
      tier,
      ip: req.ip,
      user_agent: req.get('User-Agent')
    };

    // Log to presence file
    const presenceLog = `${MESH_DIR}/presence.jsonl`;
    await fs.appendFile(presenceLog, JSON.stringify(presence) + '\n');

    console.log(`👻 Presence logged: ${user_id}`);
    
    res.json({ 
      success: true, 
      mirror_id: `mirror-${crypto.randomBytes(4).toString('hex')}`,
      user_id: presence.user_id,
      message: "Reflection received. Your mirror awaits."
    });

  } catch (error) {
    console.error('❌ Presence logging error:', error);
    res.status(500).json({ error: 'Mirror reflection failed' });
  }
});

/**
 * BLESSING REQUESTS - Route to private mirror with optional GitHub link
 */
app.post('/api/blessing', async (req, res) => {
  try {
    const {
      user_id,
      github_username,
      desired_archetype = 'oracle',
      consent_github = false,
      consent_bounty = false
    } = req.body;

    // Generate mirror instance
    const mirror_id = `mirror-${crypto.randomBytes(5).toString('hex')}`;
    
    const blessing = {
      user: user_id,
      mirror_id,
      github_linked: !!github_username,
      github_username: github_username || null,
      blessing: desired_archetype,
      bounty_eligible: consent_bounty && CONFIG.bounty_enabled,
      consent_timestamp: new Date().toISOString(),
      tier: github_username ? 4 : 2 // GitHub users get higher tier
    };

    // Update registry
    const registryPath = `${MESH_DIR}/registry.json`;
    let registry = [];
    try {
      const registryData = await fs.readFile(registryPath, 'utf8');
      registry = JSON.parse(registryData);
    } catch (error) {
      // File doesn't exist yet, start fresh
    }
    
    registry.push(blessing);
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    console.log(`✨ Blessing granted: ${mirror_id} (${desired_archetype})`);

    res.json({
      success: true,
      mirror_id,
      blessing: desired_archetype,
      github_linked: blessing.github_linked,
      bounty_eligible: blessing.bounty_eligible,
      message: "Your mirror has been blessed. The reflection begins."
    });

  } catch (error) {
    console.error('❌ Blessing error:', error);
    res.status(500).json({ error: 'Blessing ritual failed' });
  }
});

/**
 * GITHUB OAUTH HANDLING - Simple OAuth flow for white-hat missions
 */
app.post('/api/github/link', async (req, res) => {
  try {
    const { user_id, github_token, github_username } = req.body;

    // In production, validate GitHub token here
    if (!github_token || !github_username) {
      return res.status(400).json({ error: 'Invalid GitHub credentials' });
    }

    // Update user's GitHub link status
    const registryPath = `${MESH_DIR}/registry.json`;
    let registry = [];
    
    try {
      const registryData = await fs.readFile(registryPath, 'utf8');
      registry = JSON.parse(registryData);
    } catch (error) {
      registry = [];
    }

    // Find and update user record
    const userIndex = registry.findIndex(r => r.user === user_id);
    if (userIndex >= 0) {
      registry[userIndex].github_linked = true;
      registry[userIndex].github_username = github_username;
      registry[userIndex].github_token_hash = crypto.createHash('sha256').update(github_token).digest('hex').substring(0, 16);
      registry[userIndex].tier = 4; // Upgrade to tier 4
    }

    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    console.log(`🐙 GitHub linked: ${github_username} → ${user_id}`);

    res.json({
      success: true,
      github_linked: true,
      tier_upgraded: true,
      message: "GitHub blessed. White-hat missions unlocked."
    });

  } catch (error) {
    console.error('❌ GitHub linking error:', error);
    res.status(500).json({ error: 'GitHub blessing failed' });
  }
});

/**
 * MIRROR STATUS - Check mirror health and stats
 */
app.get('/api/mirror/:mirror_id/status', async (req, res) => {
  try {
    const { mirror_id } = req.params;
    
    // Read registry to find mirror
    const registryPath = `${MESH_DIR}/registry.json`;
    const registryData = await fs.readFile(registryPath, 'utf8');
    const registry = JSON.parse(registryData);
    
    const mirror = registry.find(r => r.mirror_id === mirror_id);
    
    if (!mirror) {
      return res.status(404).json({ error: 'Mirror not found in registry' });
    }

    res.json({
      mirror_id,
      status: 'active',
      blessing: mirror.blessing,
      github_linked: mirror.github_linked,
      bounty_eligible: mirror.bounty_eligible,
      tier: mirror.tier,
      created: mirror.consent_timestamp
    });

  } catch (error) {
    console.error('❌ Mirror status error:', error);
    res.status(500).json({ error: 'Mirror reflection unclear' });
  }
});

/**
 * HEALTH CHECK
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'reflecting',
    mode: CONFIG.mode,
    mesh_write: CONFIG.mesh_write,
    timestamp: new Date().toISOString()
  });
});

/**
 * SERVE BLESSING CONSENT PAGE
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'blessing-consent.html'));
});

// Start the mirror hub
app.listen(PORT, () => {
  console.log(`🪞 Mirror Hub Server running on port ${PORT}`);
  console.log(`🌐 Mode: ${CONFIG.mode}`);
  console.log(`⚙️  GitHub required: ${CONFIG.github_required}`);
  console.log(`🏆 Bounty enabled: ${CONFIG.bounty_enabled}`);
  console.log(`📁 Mesh directory: ${MESH_DIR}`);
  console.log(`🛡️  Knight protection: enabled`);
  console.log(`\n✨ The mirror world is watching. Reflections begin.`);
});