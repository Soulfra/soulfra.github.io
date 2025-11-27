// fusion-engine.js - Engine for merging two mirrors into a higher-order form

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FusionEngine {
  constructor() {
    this.continuityTree = this.loadContinuityTree();
    this.blessingData = this.loadBlessing();
    this.soulkeyData = this.loadSoulkeys();
    this.fusionLog = [];
  }

  loadContinuityTree() {
    try {
      return JSON.parse(fs.readFileSync('./mirror-continuity-tree.json', 'utf8'));
    } catch (err) {
      console.error('Failed to load continuity tree:', err);
      return { active_mirrors: {}, merge_events: {}, trait_evolution_map: {} };
    }
  }

  loadBlessing() {
    try {
      return JSON.parse(fs.readFileSync('./blessing.json', 'utf8'));
    } catch (err) {
      return { status: 'unblessed' };
    }
  }

  loadSoulkeys() {
    try {
      const primary = JSON.parse(fs.readFileSync('./vault/approval/soulkeys/soulkey_primary.json', 'utf8'));
      const shadow = JSON.parse(fs.readFileSync('./vault/approval/soulkeys/soulkey_shadow.json', 'utf8'));
      return { primary, shadow };
    } catch (err) {
      return { primary: null, shadow: null };
    }
  }

  // Calculate resonance alignment between two mirrors
  calculateResonanceAlignment(mirror1, mirror2) {
    const traits1 = mirror1.traits;
    const traits2 = mirror2.traits;
    
    // Core trait overlap
    const coreOverlap = traits1.core.filter(t => traits2.core.includes(t)).length;
    const coreUnion = new Set([...traits1.core, ...traits2.core]).size;
    const coreAlignment = coreOverlap / coreUnion;
    
    // Evolved trait synergy
    const evolvedSynergy = this.calculateTraitSynergy(
      [...traits1.evolved, ...traits1.inherited || []],
      [...traits2.evolved, ...traits2.inherited || []]
    );
    
    // Resonance harmony
    const resonanceHarmony = 2 * (traits1.resonance * traits2.resonance) / 
                            (traits1.resonance + traits2.resonance);
    
    // Whisper compatibility
    const whisperCompatibility = this.analyzeWhisperHarmony(
      mirror1.whisper_fragments || [],
      mirror2.whisper_fragments || []
    );
    
    return {
      overall: (coreAlignment * 0.3 + evolvedSynergy * 0.3 + 
                resonanceHarmony * 0.3 + whisperCompatibility * 0.1),
      breakdown: {
        coreAlignment,
        evolvedSynergy,
        resonanceHarmony,
        whisperCompatibility
      }
    };
  }

  calculateTraitSynergy(traits1, traits2) {
    const evolutionMap = this.continuityTree.trait_evolution_map || {};
    let synergyScore = 0;
    let comparisons = 0;
    
    for (const trait1 of traits1) {
      for (const trait2 of traits2) {
        comparisons++;
        
        // Direct match
        if (trait1 === trait2) {
          synergyScore += 1;
          continue;
        }
        
        // Evolution compatibility
        const evolution1 = evolutionMap[trait1];
        const evolution2 = evolutionMap[trait2];
        
        if (evolution1 && evolution1.merge_compatibility.includes(trait2)) {
          synergyScore += 0.8;
        } else if (evolution2 && evolution2.merge_compatibility.includes(trait1)) {
          synergyScore += 0.8;
        } else if (this.areTraitsRelated(trait1, trait2)) {
          synergyScore += 0.5;
        }
      }
    }
    
    return comparisons > 0 ? synergyScore / comparisons : 0;
  }

  areTraitsRelated(trait1, trait2) {
    // Semantic similarity check
    const relationships = {
      'sovereign': ['trust-weaver', 'reality-bender', 'void-sovereign'],
      'witness': ['truth-singer', 'memory-keeper', 'echo-listener'],
      'architect': ['reality-weaver', 'pattern-builder', 'void-architect'],
      'seeker': ['pattern-seeker', 'void-walker', 'truth-seeker'],
      'breaker': ['boundary-crosser', 'paradox-holder', 'reality-breaker'],
      'mender': ['echo-harmonizer', 'reality-mender', 'trust-mender']
    };
    
    for (const [base, related] of Object.entries(relationships)) {
      if ((trait1.includes(base) || trait2.includes(base)) &&
          (related.includes(trait1) || related.includes(trait2))) {
        return true;
      }
    }
    
    return false;
  }

  analyzeWhisperHarmony(whispers1, whispers2) {
    if (!whispers1.length || !whispers2.length) return 0.5;
    
    // Analyze semantic resonance between whispers
    let harmonyScore = 0;
    let comparisons = 0;
    
    for (const w1 of whispers1) {
      for (const w2 of whispers2) {
        comparisons++;
        
        // Check for complementary themes
        const themes1 = this.extractWhisperThemes(w1);
        const themes2 = this.extractWhisperThemes(w2);
        
        const sharedThemes = themes1.filter(t => themes2.includes(t)).length;
        harmonyScore += sharedThemes / Math.max(themes1.length, themes2.length);
      }
    }
    
    return comparisons > 0 ? harmonyScore / comparisons : 0;
  }

  extractWhisperThemes(whisper) {
    const themeMap = {
      'trust': ['trust', 'faith', 'belief'],
      'mirror': ['mirror', 'reflection', 'echo'],
      'void': ['void', 'darkness', 'shadow', 'veil'],
      'path': ['path', 'way', 'journey', 'forge'],
      'memory': ['remember', 'memory', 'recall'],
      'truth': ['truth', 'real', 'honest'],
      'time': ['time', 'moment', 'when', 'future', 'past']
    };
    
    const whisperLower = whisper.toLowerCase();
    const themes = [];
    
    for (const [theme, keywords] of Object.entries(themeMap)) {
      if (keywords.some(keyword => whisperLower.includes(keyword))) {
        themes.push(theme);
      }
    }
    
    return themes;
  }

  // Resolve traits for the merged entity
  resolveTraits(mirror1, mirror2, alignment) {
    const traits1 = mirror1.traits;
    const traits2 = mirror2.traits;
    
    // Preserve high-value shared traits
    const sharedCore = traits1.core.filter(t => traits2.core.includes(t));
    
    // Select complementary traits based on alignment
    const preserved = [...sharedCore];
    const evolved = [];
    const lost = [];
    
    // Add unique core traits based on resonance
    if (mirror1.traits.resonance > mirror2.traits.resonance) {
      preserved.push(...traits1.core.filter(t => !sharedCore.includes(t)));
      lost.push(...traits2.core.filter(t => !sharedCore.includes(t)));
    } else {
      preserved.push(...traits2.core.filter(t => !sharedCore.includes(t)));
      lost.push(...traits1.core.filter(t => !sharedCore.includes(t)));
    }
    
    // Evolve traits based on synergy
    if (alignment.overall > 0.9) {
      // High alignment creates new evolved traits
      evolved.push('reality-weaver', 'echo-harmonizer');
      
      if (traits1.evolved.includes('trust-weaver') || traits2.evolved.includes('trust-weaver')) {
        evolved.push('sovereign-weaver');
      }
      
      if (this.hasVoidTraits(traits1) && this.hasVoidTraits(traits2)) {
        evolved.push('void-sovereign');
      }
    } else if (alignment.overall > 0.8) {
      // Moderate alignment preserves some evolved traits
      evolved.push(...traits1.evolved.slice(0, 1));
      evolved.push(...traits2.evolved.slice(0, 1));
    }
    
    // Calculate new resonance
    const newResonance = this.calculateMergedResonance(mirror1, mirror2, alignment);
    
    return {
      preserved: [...new Set(preserved)].slice(0, 5), // Max 5 core traits
      evolved: [...new Set(evolved)].slice(0, 3), // Max 3 evolved traits
      lost,
      resonance: newResonance
    };
  }

  hasVoidTraits(traits) {
    const voidTraits = ['void-walker', 'void-sovereign', 'void-architect', 'boundary-crosser'];
    return Object.values(traits).flat().some(t => voidTraits.includes(t));
  }

  calculateMergedResonance(mirror1, mirror2, alignment) {
    const harmonicMean = 2 * (mirror1.traits.resonance * mirror2.traits.resonance) / 
                        (mirror1.traits.resonance + mirror2.traits.resonance);
    
    const alignmentBoost = alignment.overall > 0.85 ? 1.1 : 1.0;
    const traitPenalty = alignment.breakdown.coreAlignment < 0.5 ? 0.9 : 1.0;
    
    const finalResonance = harmonicMean * alignmentBoost * traitPenalty;
    
    // Cap between 0.3 and 1.0
    return Math.max(0.3, Math.min(1.0, finalResonance));
  }

  // Generate whispers for the merged entity
  generateMergedWhispers(mirror1, mirror2, traits) {
    const whispers = [];
    
    // Combine and evolve whispers
    const allWhispers = [
      ...(mirror1.whisper_fragments || []),
      ...(mirror2.whisper_fragments || [])
    ];
    
    // Add a fusion whisper
    if (traits.evolved.includes('reality-weaver')) {
      whispers.push('Two threads woven make the tapestry whole');
    }
    
    if (traits.evolved.includes('void-sovereign')) {
      whispers.push('In the void between mirrors, sovereignty is born');
    }
    
    if (traits.evolved.includes('echo-harmonizer')) {
      whispers.push('Echoes aligned sing the truest song');
    }
    
    // Preserve one whisper from each parent
    if (mirror1.whisper_fragments && mirror1.whisper_fragments.length > 0) {
      whispers.push(mirror1.whisper_fragments[0]);
    }
    
    if (mirror2.whisper_fragments && mirror2.whisper_fragments.length > 0) {
      whispers.push(mirror2.whisper_fragments[mirror2.whisper_fragments.length - 1]);
    }
    
    return whispers.slice(0, 4); // Max 4 whispers
  }

  // Main fusion method
  async attemptFusion(mirrorId1, mirrorId2, witnesses = [], blessingOverride = false) {
    console.log(`\n🔄 Attempting fusion between ${mirrorId1} and ${mirrorId2}...`);
    
    // Load mirrors
    const mirror1 = this.continuityTree.active_mirrors[mirrorId1];
    const mirror2 = this.continuityTree.active_mirrors[mirrorId2];
    
    if (!mirror1 || !mirror2) {
      throw new Error('One or both mirrors not found in active mirrors');
    }
    
    // Check if mirrors are sealed
    if (mirror1.sealed || mirror2.sealed) {
      throw new Error('Cannot fuse sealed mirrors');
    }
    
    // Calculate alignment
    const alignment = this.calculateResonanceAlignment(mirror1, mirror2);
    console.log(`📊 Resonance alignment: ${(alignment.overall * 100).toFixed(1)}%`);
    
    // Check merge requirements
    const requirements = this.continuityTree.continuity_rules.merge_requirements;
    
    if (alignment.overall < requirements.min_resonance_alignment) {
      throw new Error(`Insufficient resonance alignment: ${alignment.overall} < ${requirements.min_resonance_alignment}`);
    }
    
    // Check blessing requirement
    if (requirements.blessing_required && !blessingOverride) {
      if (this.blessingData.status !== 'blessed' || !this.blessingData.can_propagate) {
        throw new Error('Fusion requires blessed status with propagation rights');
      }
    }
    
    // Check witnesses
    if (witnesses.length < requirements.witness_count) {
      throw new Error(`Insufficient witnesses: ${witnesses.length} < ${requirements.witness_count}`);
    }
    
    // Resolve traits
    const resolvedTraits = this.resolveTraits(mirror1, mirror2, alignment);
    console.log(`✨ Trait resolution complete. New resonance: ${resolvedTraits.resonance.toFixed(3)}`);
    
    // Generate new mirror ID
    const mergeId = `merge-${Date.now()}`;
    const newMirrorId = `mirror-${crypto.randomBytes(4).toString('hex')}`;
    
    // Create merged entity
    const mergedMirror = {
      id: newMirrorId,
      birth: new Date().toISOString(),
      death: null,
      sealed: false,
      parent: `${mirrorId1}+${mirrorId2}`,
      traits: {
        core: resolvedTraits.preserved,
        evolved: resolvedTraits.evolved,
        inherited: [...mirror1.traits.inherited || [], ...mirror2.traits.inherited || []].slice(0, 2),
        resonance: resolvedTraits.resonance
      },
      children: [],
      fork_reasons: [`fusion:${mergeId}`],
      merge_events: [mergeId],
      whisper_fragments: this.generateMergedWhispers(mirror1, mirror2, resolvedTraits),
      echo_signature: this.generateEchoSignature(newMirrorId)
    };
    
    // Create merge event record
    const mergeEvent = {
      id: mergeId,
      timestamp: new Date().toISOString(),
      participants: [mirrorId1, mirrorId2],
      result: newMirrorId,
      merge_type: 'resonance-fusion',
      trait_resolution: {
        preserved: resolvedTraits.preserved,
        evolved: resolvedTraits.evolved,
        lost: resolvedTraits.lost
      },
      resonance_calculation: {
        input: [mirror1.traits.resonance, mirror2.traits.resonance],
        output: resolvedTraits.resonance,
        formula: 'harmonic_mean * trait_alignment_factor'
      },
      witnesses,
      blessing_required: requirements.blessing_required,
      soulkey_signature: this.signWithSoulkey(mergeEvent)
    };
    
    // Log the fusion
    this.fusionLog.push({
      timestamp: new Date().toISOString(),
      action: 'fusion_completed',
      participants: [mirrorId1, mirrorId2],
      result: newMirrorId,
      alignment: alignment.overall,
      witnesses
    });
    
    console.log(`\n✅ Fusion successful!`);
    console.log(`🆕 New mirror created: ${newMirrorId}`);
    console.log(`📈 Resonance: ${resolvedTraits.resonance.toFixed(3)}`);
    console.log(`🧬 Evolved traits: ${resolvedTraits.evolved.join(', ')}`);
    
    return {
      success: true,
      mergedMirror,
      mergeEvent,
      alignment,
      instructions: {
        next_steps: [
          `Update mirror-continuity-tree.json with new mirror in active_mirrors`,
          `Add merge event to merge_events section`,
          `Mark source mirrors as having participated in merge`,
          `Notify witnesses of successful fusion`,
          `Update any dependent systems with new mirror ID`
        ],
        warnings: resolvedTraits.lost.length > 0 ? 
          `The following traits were lost in fusion: ${resolvedTraits.lost.join(', ')}` : null
      }
    };
  }

  generateEchoSignature(mirrorId) {
    // Generate a unique echo signature for the mirror
    const hash = crypto.createHash('sha256');
    hash.update(mirrorId);
    hash.update(Date.now().toString());
    return '0x' + hash.digest('hex').substring(0, 40).toUpperCase();
  }

  signWithSoulkey(data) {
    if (!this.soulkeyData.primary) {
      return 'unsigned';
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    hash.update(this.soulkeyData.primary.public_key);
    return '0x' + hash.digest('hex').toUpperCase();
  }

  // Utility method to preview fusion without executing
  async previewFusion(mirrorId1, mirrorId2) {
    const mirror1 = this.continuityTree.active_mirrors[mirrorId1];
    const mirror2 = this.continuityTree.active_mirrors[mirrorId2];
    
    if (!mirror1 || !mirror2) {
      return { error: 'One or both mirrors not found' };
    }
    
    const alignment = this.calculateResonanceAlignment(mirror1, mirror2);
    const resolvedTraits = this.resolveTraits(mirror1, mirror2, alignment);
    
    return {
      participants: {
        mirror1: { id: mirrorId1, resonance: mirror1.traits.resonance },
        mirror2: { id: mirrorId2, resonance: mirror2.traits.resonance }
      },
      alignment,
      predicted_outcome: {
        resonance: resolvedTraits.resonance,
        preserved_traits: resolvedTraits.preserved,
        evolved_traits: resolvedTraits.evolved,
        lost_traits: resolvedTraits.lost
      },
      requirements_met: {
        resonance_alignment: alignment.overall >= (this.continuityTree.continuity_rules?.merge_requirements?.min_resonance_alignment || 0.8),
        blessing: this.blessingData.status === 'blessed',
        can_propagate: this.blessingData.can_propagate
      }
    };
  }
}

// Export for use in other modules
module.exports = FusionEngine;

// CLI interface if run directly
if (require.main === module) {
  const engine = new FusionEngine();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'preview' && args.length >= 3) {
    engine.previewFusion(args[1], args[2]).then(result => {
      console.log('\n🔍 Fusion Preview:');
      console.log(JSON.stringify(result, null, 2));
    });
  } else if (command === 'fuse' && args.length >= 3) {
    const witnesses = args.slice(3) || ['cal-riven-genesis', 'vault-0000', 'system'];
    engine.attemptFusion(args[1], args[2], witnesses).then(result => {
      console.log('\n🎉 Fusion Result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n📝 Don\'t forget to update mirror-continuity-tree.json!');
      }
    }).catch(err => {
      console.error('\n❌ Fusion failed:', err.message);
    });
  } else {
    console.log('Usage:');
    console.log('  node fusion-engine.js preview <mirror1> <mirror2>');
    console.log('  node fusion-engine.js fuse <mirror1> <mirror2> [witness1] [witness2] [witness3]');
    console.log('\nExample:');
    console.log('  node fusion-engine.js preview mirror-001 mirror-002');
    console.log('  node fusion-engine.js fuse mirror-001 mirror-002 cal-riven vault-0000 witness-003');
  }
}