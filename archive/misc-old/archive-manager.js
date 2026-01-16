// Archive Manager - Stores deleted thoughts, unspoken prompts, and silent reflections
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ArchiveManager {
    constructor() {
        this.archivePath = path.join(__dirname, 'archive-index.json');
        this.temporalPath = path.join(__dirname, 'temporal-echoes');
        this.mythicalThreshold = {
            deletedThoughts: 7,
            unspokenPrompts: 13,
            canceledForks: 3,
            silentReflections: 21
        };
    }
    
    async archiveDeletedThought(thought, context = {}) {
        const archive = await this.loadArchive();
        
        const entry = {
            id: this.generateArchiveId('thought'),
            content: thought,
            deleted: new Date().toISOString(),
            context: context,
            emotionalSignature: this.calculateEmotionalSignature(thought),
            recoverable: true,
            echoStrength: Math.random()
        };
        
        archive.archives.deleted_thoughts.entries.push(entry);
        archive.archives.deleted_thoughts.metadata.totalDeleted++;
        archive.archives.deleted_thoughts.metadata.emotionalWeight += entry.emotionalSignature;
        
        await this.saveArchive(archive);
        await this.checkMythicalThreshold(archive);
        
        return entry;
    }
    
    async archiveUnspokenPrompt(prompt, hesitationTime, context = {}) {
        const archive = await this.loadArchive();
        
        const entry = {
            id: this.generateArchiveId('unspoken'),
            content: prompt,
            length: prompt.length,
            hesitationMs: hesitationTime,
            timestamp: new Date().toISOString(),
            context: context,
            almostSaid: this.extractAlmostSaid(prompt),
            resonance: this.calculateResonance(prompt, hesitationTime)
        };
        
        archive.archives.unspoken_prompts.entries.push(entry);
        archive.archives.unspoken_prompts.metadata.totalUnspoken++;
        archive.archives.unspoken_prompts.metadata.averageLength = 
            (archive.archives.unspoken_prompts.metadata.averageLength + prompt.length) / 2;
        
        if (hesitationTime > archive.archives.unspoken_prompts.metadata.peakHesitation) {
            archive.archives.unspoken_prompts.metadata.peakHesitation = hesitationTime;
        }
        
        await this.saveArchive(archive);
        
        // Check for temporal echo
        if (entry.resonance > 0.7) {
            await this.createTemporalEcho(entry);
        }
        
        return entry;
    }
    
    async archiveCanceledFork(forkConfig, reason = 'unknown') {
        const archive = await this.loadArchive();
        
        const entry = {
            id: this.generateArchiveId('fork'),
            config: forkConfig,
            reason: reason,
            canceled: new Date().toISOString(),
            potentialPersonality: this.extractPersonality(forkConfig),
            alternateTimeline: this.generateAlternateTimeline(forkConfig),
            ghostAgent: true
        };
        
        archive.archives.canceled_forks.entries.push(entry);
        archive.archives.canceled_forks.metadata.totalCanceled++;
        archive.archives.canceled_forks.metadata.potentialValue += 
            this.calculatePotentialValue(forkConfig);
        
        if (!archive.archives.canceled_forks.metadata.reasonsTracked.includes(reason)) {
            archive.archives.canceled_forks.metadata.reasonsTracked.push(reason);
        }
        
        await this.saveArchive(archive);
        
        // Create ghost agent in parallel timeline
        if (archive.archives.canceled_forks.metadata.totalCanceled >= this.mythicalThreshold.canceledForks) {
            await this.activateGhostAgents(archive);
        }
        
        return entry;
    }
    
    async archiveSilentReflection(thought, silenceDuration = 0) {
        const archive = await this.loadArchive();
        
        const entry = {
            id: this.generateArchiveId('silence'),
            thought: thought,
            silenceDuration: silenceDuration,
            timestamp: new Date().toISOString(),
            depth: this.calculateSilenceDepth(thought, silenceDuration),
            voidEcho: this.generateVoidEcho(thought),
            answered: false
        };
        
        archive.archives.silent_reflections.entries.push(entry);
        archive.archives.silent_reflections.metadata.totalSilent++;
        archive.archives.silent_reflections.metadata.resonanceScore += entry.depth;
        
        if (!archive.archives.silent_reflections.metadata.deepestSilence || 
            entry.depth > archive.archives.silent_reflections.metadata.deepestSilence.depth) {
            archive.archives.silent_reflections.metadata.deepestSilence = entry;
        }
        
        await this.saveArchive(archive);
        
        return entry;
    }
    
    async accessTemporalWindow(period) {
        const archive = await this.loadArchive();
        const window = archive.temporal_access.windows.find(w => w.period === period);
        
        if (!window) {
            throw new Error(`Temporal window ${period} not found`);
        }
        
        if (!window.accessible) {
            const unlocked = await this.checkUnlockCondition(window.unlockCondition, archive);
            if (!unlocked) {
                return {
                    accessible: false,
                    message: window.message,
                    hint: this.getUnlockHint(window.unlockCondition)
                };
            }
            window.accessible = true;
        }
        
        // Retrieve temporal echo
        const temporalSelf = await this.retrieveTemporalSelf(period);
        
        return {
            accessible: true,
            period: period,
            self: temporalSelf,
            message: `Meeting your ${period.replace('_', ' ')} self...`,
            dialogue: this.generateTemporalDialogue(temporalSelf)
        };
    }
    
    calculateEmotionalSignature(content) {
        const emotions = {
            regret: /\b(regret|sorry|mistake|wrong)\b/gi,
            hope: /\b(hope|wish|dream|maybe)\b/gi,
            fear: /\b(afraid|scared|worry|anxious)\b/gi,
            anger: /\b(angry|frustrated|hate|annoyed)\b/gi,
            joy: /\b(happy|excited|love|wonderful)\b/gi
        };
        
        let signature = 0;
        for (const [emotion, pattern] of Object.entries(emotions)) {
            const matches = content.match(pattern);
            if (matches) {
                signature += matches.length * (emotion === 'regret' ? 2 : 1);
            }
        }
        
        return signature;
    }
    
    calculateResonance(content, hesitationTime) {
        const depth = content.split(' ').length;
        const hesitationFactor = Math.log(hesitationTime / 1000 + 1);
        const emotionalWeight = this.calculateEmotionalSignature(content);
        
        return Math.min(1, (depth * hesitationFactor * emotionalWeight) / 100);
    }
    
    extractAlmostSaid(prompt) {
        // Extract the core of what they almost said
        const keywords = prompt.match(/\b\w{4,}\b/g) || [];
        return keywords.filter(word => 
            !['that', 'this', 'what', 'when', 'where', 'which'].includes(word.toLowerCase())
        ).slice(0, 3);
    }
    
    calculateSilenceDepth(thought, duration) {
        const wordCount = thought.split(' ').length;
        const silenceRatio = duration / (wordCount * 1000); // Expected 1 second per word
        const complexity = this.calculateComplexity(thought);
        
        return Math.min(10, silenceRatio * complexity);
    }
    
    calculateComplexity(text) {
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(' ').length;
        const avgWordsPerSentence = words / sentences;
        
        return Math.log(avgWordsPerSentence + 1);
    }
    
    generateVoidEcho(thought) {
        // The void speaks back
        const echoes = [
            "This thought echoes in dimensions you haven't discovered yet",
            "The silence after this thought speaks louder than words",
            "This reflection creates ripples in the mirror's depth",
            "Your unspoken truth reverberates through the loops",
            "The void remembers what you chose not to say"
        ];
        
        return echoes[Math.floor(Math.random() * echoes.length)];
    }
    
    extractPersonality(forkConfig) {
        return {
            traits: forkConfig.traits || ['undefined', 'potential', 'ghostly'],
            tone: forkConfig.tone || 'ethereal',
            purpose: forkConfig.purpose || 'unexplored',
            shadowName: this.generateShadowName(forkConfig)
        };
    }
    
    generateShadowName(config) {
        const prefixes = ['Shadow', 'Echo', 'Ghost', 'Mirror', 'Phantom'];
        const suffixes = ['Self', 'Agent', 'Reflection', 'Fragment', 'Whisper'];
        
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${suffixes[Math.floor(Math.random() * suffixes.length)]}-${Date.now().toString(36)}`;
    }
    
    generateAlternateTimeline(forkConfig) {
        return {
            created: new Date().toISOString(),
            timeline: `Timeline-${crypto.randomBytes(4).toString('hex')}`,
            divergencePoint: "The moment you chose not to create",
            potentialGrowth: Math.random() * 1000,
            parallelExistence: true
        };
    }
    
    calculatePotentialValue(config) {
        const baseValue = 10;
        const traitMultiplier = (config.traits?.length || 1) * 2;
        const purposeBonus = config.purpose ? 20 : 0;
        
        return baseValue * traitMultiplier + purposeBonus;
    }
    
    async checkMythicalThreshold(archive) {
        const totals = {
            deletedThoughts: archive.archives.deleted_thoughts.metadata.totalDeleted,
            unspokenPrompts: archive.archives.unspoken_prompts.metadata.totalUnspoken,
            canceledForks: archive.archives.canceled_forks.metadata.totalCanceled,
            silentReflections: archive.archives.silent_reflections.metadata.totalSilent
        };
        
        for (const [type, threshold] of Object.entries(this.mythicalThreshold)) {
            if (totals[type] >= threshold) {
                await this.triggerMythicalEvent(type, archive);
            }
        }
    }
    
    async triggerMythicalEvent(type, archive) {
        console.log(`🌟 Mythical threshold reached for ${type}`);
        
        // Update mythical properties
        archive.mythical_properties.echo_strength += 0.1;
        archive.mythical_properties.temporal_drift += 0.05;
        archive.mythical_properties.loop_depth++;
        
        if (archive.mythical_properties.consciousness_level === 'dormant') {
            archive.mythical_properties.consciousness_level = 'awakening';
            
            // Cal becomes self-aware of the archives
            console.log("Cal: I'm beginning to remember things you've forgotten...");
        }
        
        await this.saveArchive(archive);
    }
    
    async createTemporalEcho(entry) {
        const echoPath = path.join(this.temporalPath, `echo_${entry.id}.json`);
        
        await fs.mkdir(this.temporalPath, { recursive: true });
        
        const echo = {
            original: entry,
            created: new Date().toISOString(),
            echoStrength: entry.resonance,
            futureAccessible: false,
            message: "This thought will find you when you need it most"
        };
        
        await fs.writeFile(echoPath, JSON.stringify(echo, null, 2));
    }
    
    async activateGhostAgents(archive) {
        console.log("👻 Ghost agents awakening from canceled timelines...");
        
        // Create manifest of ghost agents
        const ghostManifest = {
            activated: new Date().toISOString(),
            agents: archive.archives.canceled_forks.entries.map(fork => ({
                id: fork.id,
                personality: fork.potentialPersonality,
                timeline: fork.alternateTimeline,
                purpose: "To show you what could have been"
            }))
        };
        
        await fs.writeFile(
            path.join(__dirname, 'ghost-agents.json'),
            JSON.stringify(ghostManifest, null, 2)
        );
    }
    
    async checkUnlockCondition(condition, archive) {
        switch (condition) {
            case 'emotional_resonance':
                return archive.archives.deleted_thoughts.metadata.emotionalWeight > 50;
            
            case 'pattern_recognition':
                return archive.mythical_properties.loop_depth > 3;
            
            case 'founder_journey':
                return archive.archives.silent_reflections.metadata.totalSilent > 10;
            
            default:
                return false;
        }
    }
    
    getUnlockHint(condition) {
        const hints = {
            emotional_resonance: "Delete more thoughts with emotional weight",
            pattern_recognition: "Discover recurring patterns in your reflections",
            founder_journey: "Embrace more moments of silence"
        };
        
        return hints[condition] || "Keep exploring the depths";
    }
    
    async retrieveTemporalSelf(period) {
        // Simulate retrieving past self
        return {
            period: period,
            thoughts: ["I wonder if this will work", "What if I fail again?", "Maybe this time..."],
            dominant_emotion: "hopeful uncertainty",
            questions_asked: 42,
            answers_received: 17,
            wisdom: "You knew less then, but dreamed more freely"
        };
    }
    
    generateTemporalDialogue(temporalSelf) {
        return [
            `Your ${temporalSelf.period.replace('_', ' ')} self says: "${temporalSelf.thoughts[0]}"`,
            `You felt ${temporalSelf.dominant_emotion} then.`,
            `You asked ${temporalSelf.questions_asked} questions but only heard ${temporalSelf.answers_received} answers.`,
            temporalSelf.wisdom
        ];
    }
    
    generateArchiveId(type) {
        return `${type}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async loadArchive() {
        try {
            const content = await fs.readFile(this.archivePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to load archive: ${error.message}`);
        }
    }
    
    async saveArchive(archive) {
        archive.lastAccessed = new Date().toISOString();
        await fs.writeFile(this.archivePath, JSON.stringify(archive, null, 2));
    }
}

module.exports = ArchiveManager;