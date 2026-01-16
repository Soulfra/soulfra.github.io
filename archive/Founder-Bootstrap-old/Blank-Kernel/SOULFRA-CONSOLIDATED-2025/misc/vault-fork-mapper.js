const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Vault Fork Mapper - Tracks agent tree genealogy
class VaultForkMapper {
    constructor() {
        this.forkTree = new Map();
        this.qrSeeds = new Map();
        this.traceFile = path.join(__dirname, '..', 'vault', 'vault-fork-trace.json');
        
        this.loadExistingTrace();
    }

    loadExistingTrace() {
        try {
            if (fs.existsSync(this.traceFile)) {
                const data = JSON.parse(fs.readFileSync(this.traceFile, 'utf8'));
                
                // Rebuild maps from saved data
                data.forks?.forEach(fork => {
                    this.forkTree.set(fork.id, fork);
                });
                
                data.seeds?.forEach(seed => {
                    this.qrSeeds.set(seed.qr, seed);
                });
            }
        } catch (e) {
            console.log('Starting fresh fork trace');
        }
    }

    // Register a new fork
    registerFork(parentId, childConfig) {
        const forkId = this.generateForkId(parentId, childConfig);
        
        const fork = {
            id: forkId,
            parentId: parentId,
            childConfig: this.sanitizeConfig(childConfig),
            timestamp: Date.now(),
            generation: this.calculateGeneration(parentId),
            entropyHash: this.calculateEntropyHash(parentId, childConfig),
            qrSeed: this.findQRSeed(parentId),
            lineage: this.buildLineage(parentId),
            metadata: {
                platform: childConfig.platform || 'unknown',
                customerId: childConfig.customerId,
                agentType: childConfig.agentType,
                obfuscationLevel: childConfig.obfuscationLevel || 0
            }
        };
        
        this.forkTree.set(forkId, fork);
        
        // Update parent's children
        if (parentId && this.forkTree.has(parentId)) {
            const parent = this.forkTree.get(parentId);
            parent.children = parent.children || [];
            parent.children.push(forkId);
        }
        
        // Persist changes
        this.saveTrace();
        
        return fork;
    }

    // Track QR seed origin
    registerQRSeed(qrCode, metadata) {
        const seed = {
            qr: qrCode,
            created: Date.now(),
            entropy: crypto.createHash('sha256').update(qrCode).digest('hex'),
            metadata: metadata,
            forkCount: 0,
            activeForks: []
        };
        
        this.qrSeeds.set(qrCode, seed);
        this.saveTrace();
        
        return seed;
    }

    generateForkId(parentId, config) {
        const components = [
            parentId || 'root',
            config.customerId || 'anonymous',
            Date.now().toString(36),
            Math.random().toString(36).substr(2, 5)
        ];
        
        return components.join('-');
    }

    sanitizeConfig(config) {
        // Remove sensitive data before storing
        const sanitized = { ...config };
        delete sanitized.apiKey;
        delete sanitized.secretKey;
        delete sanitized.password;
        
        return sanitized;
    }

    calculateGeneration(parentId) {
        if (!parentId) return 0;
        
        const parent = this.forkTree.get(parentId);
        return parent ? parent.generation + 1 : 1;
    }

    calculateEntropyHash(parentId, config) {
        const data = JSON.stringify({
            parent: parentId,
            config: this.sanitizeConfig(config),
            timestamp: Date.now()
        });
        
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    findQRSeed(forkId) {
        if (!forkId) return null;
        
        const fork = this.forkTree.get(forkId);
        if (!fork) return null;
        
        // If this fork has a QR seed, return it
        if (fork.qrSeed) return fork.qrSeed;
        
        // Otherwise, trace back to parent
        return this.findQRSeed(fork.parentId);
    }

    buildLineage(forkId) {
        const lineage = [];
        let current = forkId;
        
        while (current && lineage.length < 100) { // Prevent infinite loops
            const fork = this.forkTree.get(current);
            if (!fork) break;
            
            lineage.unshift({
                id: fork.id,
                generation: fork.generation,
                timestamp: fork.timestamp
            });
            
            current = fork.parentId;
        }
        
        return lineage;
    }

    // Get complete fork tree for a QR seed
    getQRForkTree(qrCode) {
        const seed = this.qrSeeds.get(qrCode);
        if (!seed) return null;
        
        const tree = {
            seed: seed,
            totalForks: 0,
            maxDepth: 0,
            activeBranches: [],
            tree: {}
        };
        
        // Find all forks from this QR
        for (const [forkId, fork] of this.forkTree.entries()) {
            if (fork.qrSeed === qrCode) {
                tree.totalForks++;
                tree.maxDepth = Math.max(tree.maxDepth, fork.generation);
                
                // Build tree structure
                this.addToTree(tree.tree, fork);
            }
        }
        
        return tree;
    }

    addToTree(tree, fork) {
        if (!fork.parentId || fork.parentId === 'root') {
            // Root level fork
            tree[fork.id] = {
                ...fork,
                children: {}
            };
        } else {
            // Find parent in tree and add
            const parent = this.findInTree(tree, fork.parentId);
            if (parent) {
                parent.children[fork.id] = {
                    ...fork,
                    children: {}
                };
            }
        }
    }

    findInTree(tree, forkId) {
        for (const key in tree) {
            if (key === forkId) return tree[key];
            
            const found = this.findInTree(tree[key].children, forkId);
            if (found) return found;
        }
        return null;
    }

    // Analyze fork patterns
    analyzeForkPatterns() {
        const analysis = {
            totalForks: this.forkTree.size,
            totalSeeds: this.qrSeeds.size,
            generationDistribution: {},
            platformDistribution: {},
            customerDistribution: {},
            forkVelocity: this.calculateForkVelocity(),
            hotspots: this.findHotspots()
        };
        
        // Analyze each fork
        for (const fork of this.forkTree.values()) {
            // Generation distribution
            analysis.generationDistribution[fork.generation] = 
                (analysis.generationDistribution[fork.generation] || 0) + 1;
            
            // Platform distribution
            const platform = fork.metadata.platform;
            analysis.platformDistribution[platform] = 
                (analysis.platformDistribution[platform] || 0) + 1;
            
            // Customer distribution
            const customer = fork.metadata.customerId;
            if (customer) {
                analysis.customerDistribution[customer] = 
                    (analysis.customerDistribution[customer] || 0) + 1;
            }
        }
        
        return analysis;
    }

    calculateForkVelocity() {
        const now = Date.now();
        const hourAgo = now - 3600000;
        const dayAgo = now - 86400000;
        
        let hourlyForks = 0;
        let dailyForks = 0;
        
        for (const fork of this.forkTree.values()) {
            if (fork.timestamp > hourAgo) hourlyForks++;
            if (fork.timestamp > dayAgo) dailyForks++;
        }
        
        return {
            hourly: hourlyForks,
            daily: dailyForks,
            average: dailyForks / 24
        };
    }

    findHotspots() {
        const hotspots = [];
        
        // Find forks with many children
        for (const [forkId, fork] of this.forkTree.entries()) {
            const childCount = (fork.children || []).length;
            
            if (childCount > 5) {
                hotspots.push({
                    forkId: forkId,
                    children: childCount,
                    generation: fork.generation,
                    metadata: fork.metadata
                });
            }
        }
        
        return hotspots.sort((a, b) => b.children - a.children);
    }

    // Find common ancestors
    findCommonAncestor(forkId1, forkId2) {
        const lineage1 = this.buildLineage(forkId1);
        const lineage2 = this.buildLineage(forkId2);
        
        // Find first common fork in lineages
        for (const fork1 of lineage1) {
            for (const fork2 of lineage2) {
                if (fork1.id === fork2.id) {
                    return fork1;
                }
            }
        }
        
        return null;
    }

    // Calculate fork distance
    calculateForkDistance(forkId1, forkId2) {
        const ancestor = this.findCommonAncestor(forkId1, forkId2);
        if (!ancestor) return Infinity;
        
        const lineage1 = this.buildLineage(forkId1);
        const lineage2 = this.buildLineage(forkId2);
        
        const dist1 = lineage1.findIndex(f => f.id === ancestor.id);
        const dist2 = lineage2.findIndex(f => f.id === ancestor.id);
        
        return dist1 + dist2;
    }

    // Get fork metrics
    getForkMetrics(forkId) {
        const fork = this.forkTree.get(forkId);
        if (!fork) return null;
        
        const metrics = {
            id: forkId,
            generation: fork.generation,
            descendants: this.countDescendants(forkId),
            siblings: this.countSiblings(forkId),
            lineageDepth: fork.lineage.length,
            entropyStrength: this.calculateEntropyStrength(fork.entropyHash),
            age: Date.now() - fork.timestamp,
            qrSeed: fork.qrSeed
        };
        
        return metrics;
    }

    countDescendants(forkId) {
        const fork = this.forkTree.get(forkId);
        if (!fork || !fork.children) return 0;
        
        let count = fork.children.length;
        
        for (const childId of fork.children) {
            count += this.countDescendants(childId);
        }
        
        return count;
    }

    countSiblings(forkId) {
        const fork = this.forkTree.get(forkId);
        if (!fork || !fork.parentId) return 0;
        
        const parent = this.forkTree.get(fork.parentId);
        if (!parent || !parent.children) return 0;
        
        return parent.children.length - 1; // Exclude self
    }

    calculateEntropyStrength(entropyHash) {
        // Simple entropy strength based on hash distribution
        const bytes = Buffer.from(entropyHash, 'hex');
        let sum = 0;
        
        for (const byte of bytes) {
            sum += byte;
        }
        
        return (sum / (bytes.length * 255)) * 100; // Percentage
    }

    // Prune old/inactive forks
    pruneForks(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const now = Date.now();
        const pruned = [];
        
        for (const [forkId, fork] of this.forkTree.entries()) {
            if (now - fork.timestamp > maxAge && this.countDescendants(forkId) === 0) {
                pruned.push(forkId);
                this.forkTree.delete(forkId);
            }
        }
        
        if (pruned.length > 0) {
            this.saveTrace();
        }
        
        return pruned;
    }

    saveTrace() {
        const data = {
            version: '1.0',
            updated: new Date().toISOString(),
            forks: Array.from(this.forkTree.values()),
            seeds: Array.from(this.qrSeeds.values()),
            stats: {
                totalForks: this.forkTree.size,
                totalSeeds: this.qrSeeds.size
            }
        };
        
        fs.mkdirSync(path.dirname(this.traceFile), { recursive: true });
        fs.writeFileSync(this.traceFile, JSON.stringify(data, null, 2));
    }

    // Export visualization data
    exportVisualizationData() {
        const nodes = [];
        const edges = [];
        
        for (const [forkId, fork] of this.forkTree.entries()) {
            nodes.push({
                id: forkId,
                label: `Gen ${fork.generation}`,
                generation: fork.generation,
                platform: fork.metadata.platform,
                size: this.countDescendants(forkId) + 1
            });
            
            if (fork.parentId) {
                edges.push({
                    source: fork.parentId,
                    target: forkId,
                    weight: 1
                });
            }
        }
        
        return { nodes, edges };
    }
}

module.exports = VaultForkMapper;