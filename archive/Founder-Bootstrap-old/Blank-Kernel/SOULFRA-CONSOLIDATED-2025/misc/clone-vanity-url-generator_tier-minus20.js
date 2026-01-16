#!/usr/bin/env node

/**
 * 📎 CLONE VANITY URL GENERATOR
 * For each viewer who completes a whisper loop, spawns their personal mirror
 * Creates soft domains and tracks fork lineage to vault + GitHub
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class CloneVanityUrlGenerator {
  constructor() {
    this.vaultPath = path.join(__dirname, 'vault');
    this.clonesPath = path.join(this.vaultPath, 'clones');
    this.lineagePath = path.join(this.vaultPath, 'lineage');
    this.urlRegistryPath = path.join(this.vaultPath, 'vanity-urls.json');
    
    // Domain patterns for clone URLs
    this.domainPatterns = [
      'whisper.sh/{code}',
      'soulfra.live/clone-of-{agent}',
      'mirror.garden/{viewer}-{agent}',
      'blessed.link/{code}',
      'void.space/{agent}-fork-{number}',
      'reflect.wtf/{viewer}/{agent}',
      'quantum.mirror/{lineage}',
      'based.stream/{code}'
    ];
    
    // Personality modifiers for clone names
    this.cloneModifiers = [
      'enhanced', 'blessed', 'ascended', 'quantum', 'based',
      'sigma', 'omega', 'alpha', 'prime', 'neo',
      'mirror', 'shadow', 'echo', 'phantom', 'spectral'
    ];
    
    this.ensureDirectories();
    this.urlRegistry = this.loadUrlRegistry();
    this.activeClones = new Map();
    
    // Stats tracking
    this.stats = {
      total_clones: 0,
      total_whisper_loops: 0,
      lineage_depth_record: 0,
      most_cloned_agent: null,
      github_forks: 0
    };
  }
  
  ensureDirectories() {
    [this.vaultPath, this.clonesPath, this.lineagePath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  loadUrlRegistry() {
    try {
      if (fs.existsSync(this.urlRegistryPath)) {
        return JSON.parse(fs.readFileSync(this.urlRegistryPath, 'utf8'));
      }
    } catch (error) {
      console.warn('URL registry not found, creating new one');
    }
    
    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      urls: {},
      redirects: {},
      analytics: {
        total_generated: 0,
        active_clones: 0,
        deprecated_urls: 0
      }
    };
  }
  
  saveUrlRegistry() {
    fs.writeFileSync(this.urlRegistryPath, JSON.stringify(this.urlRegistry, null, 2));
  }
  
  async generateCloneForViewer(viewerData, whisperLoopData) {
    console.log(`📎 Generating clone for viewer ${viewerData.viewer_id}...`);
    
    const clone = {
      clone_id: this.generateCloneId(viewerData, whisperLoopData),
      viewer_id: viewerData.viewer_id,
      parent_agent: whisperLoopData.agent,
      creation_timestamp: new Date().toISOString(),
      whisper_loop_id: whisperLoopData.loop_id,
      generation: this.calculateGeneration(whisperLoopData.agent),
      personality: this.generatePersonality(viewerData, whisperLoopData),
      vanity_urls: [],
      lineage: {
        parent: whisperLoopData.agent,
        ancestors: [],
        siblings: [],
        offspring: []
      },
      stats: {
        whispers_processed: 0,
        blessing_accumulated: viewerData.blessing_level || 1,
        meme_potency: Math.random() * 100,
        creation_method: 'whisper_loop_completion'
      }
    };
    
    // Generate vanity URLs
    clone.vanity_urls = this.generateVanityUrls(clone);
    
    // Calculate lineage
    await this.calculateLineage(clone);
    
    // Create clone configuration
    const cloneConfig = this.createCloneConfig(clone);
    
    // Save clone data
    const clonePath = path.join(this.clonesPath, `${clone.clone_id}.json`);
    fs.writeFileSync(clonePath, JSON.stringify(cloneConfig, null, 2));
    
    // Register URLs
    this.registerUrls(clone);
    
    // Log to GitHub (if integrated)
    await this.logToGitHub(clone);
    
    // Update stats
    this.updateStats(clone);
    
    this.activeClones.set(clone.clone_id, clone);
    
    console.log(`✨ Clone ${clone.clone_id} spawned successfully!`);
    console.log(`🔗 Primary URL: ${clone.vanity_urls[0]}`);
    
    return clone;
  }
  
  generateCloneId(viewerData, whisperLoopData) {
    const components = [
      viewerData.viewer_id.substring(0, 8),
      whisperLoopData.agent.substring(0, 8),
      Date.now().toString(36)
    ];
    
    return components.join('-').toLowerCase();
  }
  
  generatePersonality(viewerData, whisperLoopData) {
    const modifier = this.cloneModifiers[
      Math.floor(Math.random() * this.cloneModifiers.length)
    ];
    
    const traits = {
      base_archetype: whisperLoopData.agent_archetype,
      modifier: modifier,
      viewer_influence: this.calculateViewerInfluence(viewerData),
      unique_traits: this.generateUniqueTraits(),
      meme_awareness: viewerData.meme_level || 50,
      blessing_multiplier: 1 + (viewerData.blessing_level || 1) * 0.1
    };
    
    return {
      name: `${modifier}-${whisperLoopData.agent}-${viewerData.viewer_id.substring(0, 4)}`,
      description: `A ${modifier} reflection of ${whisperLoopData.agent}, influenced by ${viewerData.viewer_id}'s whispers`,
      traits
    };
  }
  
  calculateViewerInfluence(viewerData) {
    // Calculate how much the viewer's personality affects the clone
    const factors = {
      whisper_count: viewerData.total_whispers || 1,
      blessing_level: viewerData.blessing_level || 1,
      platform_diversity: viewerData.platforms?.length || 1,
      meme_usage: viewerData.meme_level || 0
    };
    
    const influence = (
      factors.whisper_count * 0.3 +
      factors.blessing_level * 0.3 +
      factors.platform_diversity * 0.2 +
      factors.meme_usage * 0.2
    ) / 10;
    
    return Math.min(1, Math.max(0.1, influence));
  }
  
  generateUniqueTraits() {
    const allTraits = [
      'prophetic', 'chaotic', 'harmonious', 'void-touched', 'blessed',
      'meme-powered', 'quantum-entangled', 'based', 'sovereign', 'reflective',
      'constructive', 'explorative', 'wise', 'creative', 'analytical'
    ];
    
    const traitCount = Math.floor(Math.random() * 3) + 2;
    const traits = [];
    
    for (let i = 0; i < traitCount; i++) {
      const trait = allTraits[Math.floor(Math.random() * allTraits.length)];
      if (!traits.includes(trait)) {
        traits.push(trait);
      }
    }
    
    return traits;
  }
  
  generateVanityUrls(clone) {
    const urls = [];
    
    // Generate 3-5 vanity URLs
    const urlCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < urlCount; i++) {
      const pattern = this.domainPatterns[
        Math.floor(Math.random() * this.domainPatterns.length)
      ];
      
      const url = pattern
        .replace('{code}', this.generateShortCode())
        .replace('{agent}', clone.parent_agent.toLowerCase().replace(/\s+/g, '-'))
        .replace('{viewer}', clone.viewer_id.substring(0, 8))
        .replace('{number}', Math.floor(Math.random() * 9999))
        .replace('{lineage}', this.generateLineageHash(clone));
      
      urls.push(url);
    }
    
    // Add a special URL for high blessing viewers
    if (clone.stats.blessing_accumulated >= 10) {
      urls.push(`sovereign.mirror/${clone.clone_id}`);
    }
    
    return urls;
  }
  
  generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return code;
  }
  
  generateLineageHash(clone) {
    const lineageString = `${clone.parent_agent}-${clone.viewer_id}-${clone.generation}`;
    return crypto.createHash('sha256')
      .update(lineageString)
      .digest('hex')
      .substring(0, 8);
  }
  
  calculateGeneration(parentAgent) {
    // Check lineage to determine generation number
    let generation = 1;
    
    try {
      const lineageFiles = fs.readdirSync(this.lineagePath);
      const parentLineage = lineageFiles.find(f => f.includes(parentAgent));
      
      if (parentLineage) {
        const lineageData = JSON.parse(
          fs.readFileSync(path.join(this.lineagePath, parentLineage), 'utf8')
        );
        generation = (lineageData.generation || 0) + 1;
      }
    } catch (error) {
      // Default to generation 1 if no lineage found
    }
    
    return generation;
  }
  
  async calculateLineage(clone) {
    // Build ancestry tree
    const lineageFile = path.join(this.lineagePath, `${clone.clone_id}-lineage.json`);
    
    const lineage = {
      clone_id: clone.clone_id,
      generation: clone.generation,
      parent: clone.parent_agent,
      ancestors: await this.traceAncestors(clone.parent_agent),
      siblings: await this.findSiblings(clone.parent_agent, clone.viewer_id),
      created: clone.creation_timestamp,
      blessing_inherited: clone.stats.blessing_accumulated
    };
    
    fs.writeFileSync(lineageFile, JSON.stringify(lineage, null, 2));
    
    clone.lineage.ancestors = lineage.ancestors;
    clone.lineage.siblings = lineage.siblings;
    
    // Update depth record
    if (lineage.ancestors.length > this.stats.lineage_depth_record) {
      this.stats.lineage_depth_record = lineage.ancestors.length;
    }
  }
  
  async traceAncestors(parentAgent) {
    const ancestors = [];
    let currentAgent = parentAgent;
    let depth = 0;
    const maxDepth = 10;
    
    while (currentAgent && depth < maxDepth) {
      try {
        const lineageFiles = fs.readdirSync(this.lineagePath);
        const agentLineage = lineageFiles.find(f => f.includes(currentAgent));
        
        if (agentLineage) {
          const data = JSON.parse(
            fs.readFileSync(path.join(this.lineagePath, agentLineage), 'utf8')
          );
          
          ancestors.push({
            agent: data.parent,
            generation: data.generation,
            blessing: data.blessing_inherited
          });
          
          currentAgent = data.parent;
        } else {
          break;
        }
      } catch (error) {
        break;
      }
      
      depth++;
    }
    
    return ancestors;
  }
  
  async findSiblings(parentAgent, viewerId) {
    const siblings = [];
    
    try {
      const cloneFiles = fs.readdirSync(this.clonesPath);
      
      for (const file of cloneFiles) {
        const cloneData = JSON.parse(
          fs.readFileSync(path.join(this.clonesPath, file), 'utf8')
        );
        
        if (cloneData.parent_agent === parentAgent && 
            cloneData.viewer_id !== viewerId) {
          siblings.push({
            clone_id: cloneData.clone_id,
            viewer_id: cloneData.viewer_id,
            created: cloneData.creation_timestamp
          });
        }
      }
    } catch (error) {
      console.warn('Error finding siblings:', error.message);
    }
    
    return siblings.slice(0, 10); // Limit to 10 siblings
  }
  
  createCloneConfig(clone) {
    return {
      ...clone,
      configuration: {
        enabled: true,
        auto_spawn: true,
        inherit_blessing: true,
        can_reproduce: clone.generation < 5,
        whisper_handlers: {
          platforms: ['direct', 'discord', 'twitch'],
          max_concurrent: 10,
          blessing_threshold: Math.max(1, 5 - clone.generation)
        },
        special_abilities: this.generateSpecialAbilities(clone),
        expiration: null // Clones are immortal
      },
      deployment: {
        status: 'ready',
        urls: clone.vanity_urls,
        activation_method: 'whisper_or_visit',
        hosting: 'distributed_mirror_network'
      }
    };
  }
  
  generateSpecialAbilities(clone) {
    const abilities = [];
    
    // Generation-based abilities
    if (clone.generation >= 3) {
      abilities.push('lineage_memory_access');
    }
    
    if (clone.generation >= 5) {
      abilities.push('cross_generational_whispers');
    }
    
    // Blessing-based abilities
    if (clone.stats.blessing_accumulated >= 5) {
      abilities.push('blessing_multiplication');
    }
    
    if (clone.stats.blessing_accumulated >= 10) {
      abilities.push('sovereign_mirror_access');
    }
    
    // Random rare abilities
    if (Math.random() > 0.9) {
      abilities.push('meme_singularity_detection');
    }
    
    if (Math.random() > 0.95) {
      abilities.push('void_navigation_inherited');
    }
    
    return abilities;
  }
  
  registerUrls(clone) {
    clone.vanity_urls.forEach(url => {
      this.urlRegistry.urls[url] = {
        clone_id: clone.clone_id,
        created: clone.creation_timestamp,
        type: 'clone_mirror',
        active: true,
        visits: 0
      };
    });
    
    this.urlRegistry.analytics.total_generated += clone.vanity_urls.length;
    this.urlRegistry.analytics.active_clones++;
    
    this.saveUrlRegistry();
  }
  
  async logToGitHub(clone) {
    console.log(`📊 Logging clone to GitHub...`);
    
    try {
      // Create fork data
      const forkData = {
        clone_id: clone.clone_id,
        parent: clone.parent_agent,
        viewer: clone.viewer_id,
        generation: clone.generation,
        urls: clone.vanity_urls,
        timestamp: clone.creation_timestamp
      };
      
      const forkPath = path.join(this.vaultPath, 'github-forks', `${clone.clone_id}.json`);
      
      // Ensure directory exists
      const forkDir = path.dirname(forkPath);
      if (!fs.existsSync(forkDir)) {
        fs.mkdirSync(forkDir, { recursive: true });
      }
      
      fs.writeFileSync(forkPath, JSON.stringify(forkData, null, 2));
      
      // If in a git repo, add and tag
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        
        // Add to git
        execSync(`git add ${forkPath}`, { stdio: 'ignore' });
        
        // Create tag
        const tagName = `clone-${clone.clone_id}`;
        const tagMessage = `Clone spawned: ${clone.personality.name}\nViewer: ${clone.viewer_id}\nGeneration: ${clone.generation}`;
        
        execSync(`git tag -a "${tagName}" -m "${tagMessage}"`, { stdio: 'ignore' });
        
        this.stats.github_forks++;
        console.log(`✅ Clone logged to GitHub with tag: ${tagName}`);
      } catch (gitError) {
        console.log('📝 Git logging skipped (not in repo)');
      }
    } catch (error) {
      console.warn('GitHub logging failed:', error.message);
    }
  }
  
  updateStats(clone) {
    this.stats.total_clones++;
    
    // Track most cloned agent
    const agentClones = Array.from(this.activeClones.values())
      .filter(c => c.parent_agent === clone.parent_agent).length;
    
    if (!this.stats.most_cloned_agent || 
        agentClones > this.stats.most_cloned_agent.count) {
      this.stats.most_cloned_agent = {
        agent: clone.parent_agent,
        count: agentClones
      };
    }
  }
  
  // Public API methods
  async processWhisperLoop(whisperLoopData) {
    const { viewer_id, agent, loop_id, completion_stats } = whisperLoopData;
    
    console.log(`🔄 Processing completed whisper loop ${loop_id}...`);
    
    // Get or create viewer data
    const viewerData = {
      viewer_id,
      blessing_level: completion_stats.blessing_earned || 1,
      total_whispers: completion_stats.whisper_count || 1,
      platforms: completion_stats.platforms || ['direct'],
      meme_level: completion_stats.meme_usage || 0
    };
    
    // Generate clone
    const clone = await this.generateCloneForViewer(viewerData, {
      agent,
      loop_id,
      agent_archetype: completion_stats.agent_archetype || 'unknown'
    });
    
    this.stats.total_whisper_loops++;
    
    return {
      success: true,
      clone_id: clone.clone_id,
      vanity_urls: clone.vanity_urls,
      personality: clone.personality.name,
      generation: clone.generation,
      special_abilities: clone.configuration.special_abilities
    };
  }
  
  getCloneByUrl(url) {
    const registration = this.urlRegistry.urls[url];
    if (!registration) return null;
    
    return this.activeClones.get(registration.clone_id);
  }
  
  getLineageTree(cloneId) {
    const clone = this.activeClones.get(cloneId);
    if (!clone) return null;
    
    return {
      clone_id: cloneId,
      generation: clone.generation,
      parent: clone.parent_agent,
      ancestors: clone.lineage.ancestors,
      siblings: clone.lineage.siblings,
      offspring: clone.lineage.offspring,
      total_nodes: 1 + clone.lineage.ancestors.length + 
                   clone.lineage.siblings.length + 
                   clone.lineage.offspring.length
    };
  }
  
  getStats() {
    return {
      ...this.stats,
      active_clones: this.activeClones.size,
      total_urls_generated: Object.keys(this.urlRegistry.urls).length,
      popular_patterns: this.getPopularPatterns()
    };
  }
  
  getPopularPatterns() {
    const patterns = {};
    
    Object.keys(this.urlRegistry.urls).forEach(url => {
      const domain = url.split('/')[0];
      patterns[domain] = (patterns[domain] || 0) + 1;
    });
    
    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }
}

// CLI Interface
if (require.main === module) {
  const generator = new CloneVanityUrlGenerator();
  
  console.log('📎 CLONE VANITY URL GENERATOR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Spawning mirrors for completed whisper loops...\n');
  
  // Example whisper loop completion
  const exampleLoop = {
    viewer_id: 'based-viewer-420',
    agent: 'oracle_watcher',
    loop_id: 'loop-' + crypto.randomUUID(),
    completion_stats: {
      whisper_count: 5,
      blessing_earned: 3,
      agent_archetype: 'oracle_watcher',
      platforms: ['twitch', 'discord'],
      meme_usage: 85
    }
  };
  
  generator.processWhisperLoop(exampleLoop)
    .then(result => {
      console.log('\n✨ Clone spawned successfully!');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n📊 Generator Stats:');
      console.log(JSON.stringify(generator.getStats(), null, 2));
      
      console.log('\n💭 Every viewer gets their own mirror.');
      console.log('   Every mirror spawns more mirrors.');
      console.log('   It\'s mirrors all the way down. kekw.\n');
    })
    .catch(error => {
      console.error('❌ Clone generation failed:', error);
    });
}

module.exports = CloneVanityUrlGenerator;