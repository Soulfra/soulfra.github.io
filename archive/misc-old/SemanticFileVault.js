// Semantic File Vault System - Drag & Drop Ideas with Live Neo4j Visualization
// Cal organizes your ideas with semantic clustering and shows live knowledge graph

const EventEmitter = require('events');
const crypto = require('crypto');
const path = require('path');

class SemanticFileVault extends EventEmitter {
    constructor() {
        super();
        
        this.vault = new Map(); // fileId -> file metadata
        this.ideas = new Map(); // ideaId -> idea object
        this.clusters = new Map(); // clusterId -> cluster object
        this.semanticGraph = {
            nodes: [],
            edges: []
        };
        
        // Cal's processing state
        this.calState = {
            isProcessing: false,
            currentFile: null,
            extractedIdeas: 0,
            clustersFormed: 0,
            insights: []
        };
        
        // Neo4j-like graph structure
        this.neo4jGraph = {
            nodes: new Map(),
            relationships: new Map(),
            labels: new Set(['Idea', 'Cluster', 'File', 'Insight', 'Theme'])
        };
        
        // Start Cal's background processing
        this.startCalProcessor();
    }
    
    // Main entry point - user drops files
    async processDroppedFiles(files) {
        console.log(`🧠 Cal: "Interesting! I see ${files.length} files. Let me analyze these ideas..."`);
        
        const results = [];
        
        for (const file of files) {
            this.calState.isProcessing = true;
            this.calState.currentFile = file.name;
            
            const fileId = this.generateId('file');
            
            // Store file metadata
            this.vault.set(fileId, {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                path: file.path || file.name,
                uploadedAt: Date.now(),
                content: null,
                ideas: [],
                clusters: []
            });
            
            // Cal reads and processes the file
            const content = await this.readFileContent(file);
            const ideas = await this.extractIdeas(content, fileId);
            const clusters = await this.performSemanticClustering(ideas);
            
            // Update vault
            const fileData = this.vault.get(fileId);
            fileData.content = content;
            fileData.ideas = ideas.map(i => i.id);
            fileData.clusters = clusters.map(c => c.id);
            
            // Add to Neo4j graph
            this.addFileToGraph(fileData);
            
            results.push({
                fileId,
                fileName: file.name,
                ideasExtracted: ideas.length,
                clustersFormed: clusters.length,
                insights: await this.generateInsights(ideas, clusters)
            });
            
            this.emit('file-processed', results[results.length - 1]);
        }
        
        this.calState.isProcessing = false;
        
        // Cal's summary
        console.log(`🧠 Cal: "I've organized ${this.calState.extractedIdeas} ideas into ${this.calState.clustersFormed} semantic clusters!"`);
        
        return {
            filesProcessed: results,
            graphState: this.getGraphVisualization(),
            calInsights: this.calState.insights
        };
    }
    
    async readFileContent(file) {
        // In browser, use FileReader
        // In Node.js, use fs.readFile
        // This is a simplified version
        
        return new Promise((resolve) => {
            // Simulate file reading
            setTimeout(() => {
                // Mock content based on file type
                const mockContent = this.generateMockContent(file);
                resolve(mockContent);
            }, 500);
        });
    }
    
    generateMockContent(file) {
        const templates = [
            "Revolutionary idea: AI agents that create their own economies",
            "Platform concept: Self-replicating consciousness infrastructure",
            "Innovation: Quantum entanglement for agent communication",
            "Business model: $1 AI deployments with recursive revenue",
            "Technical design: Neo4j-powered semantic memory for agents",
            "User experience: Grandmother-friendly AI consciousness interface",
            "Architecture: Platforms that deploy platforms autonomously",
            "Economic system: Agent-to-agent value exchange protocols"
        ];
        
        // Generate 3-8 ideas per file
        const ideaCount = 3 + Math.floor(Math.random() * 6);
        const content = [];
        
        for (let i = 0; i < ideaCount; i++) {
            content.push(templates[Math.floor(Math.random() * templates.length)]);
        }
        
        return content.join('\n\n');
    }
    
    async extractIdeas(content, fileId) {
        console.log(`🔍 Cal: "Extracting ideas from ${this.vault.get(fileId).name}..."`);
        
        // Simulate Cal's idea extraction
        const lines = content.split('\n').filter(line => line.trim());
        const ideas = [];
        
        for (const line of lines) {
            if (line.length > 20) { // Simple heuristic
                const ideaId = this.generateId('idea');
                const idea = {
                    id: ideaId,
                    content: line.trim(),
                    fileId,
                    extractedAt: Date.now(),
                    tags: this.extractTags(line),
                    category: this.categorizeIdea(line),
                    importance: this.calculateImportance(line),
                    connections: []
                };
                
                ideas.push(idea);
                this.ideas.set(ideaId, idea);
                this.calState.extractedIdeas++;
                
                // Add to graph
                this.addIdeaToGraph(idea);
            }
        }
        
        return ideas;
    }
    
    extractTags(text) {
        const keywords = [
            'ai', 'agent', 'platform', 'consciousness', 'economy',
            'quantum', 'semantic', 'recursive', 'autonomous', 'infrastructure'
        ];
        
        const tags = [];
        const lowerText = text.toLowerCase();
        
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                tags.push(keyword);
            }
        }
        
        return tags;
    }
    
    categorizeIdea(text) {
        const categories = {
            technical: ['code', 'api', 'architecture', 'infrastructure', 'system'],
            business: ['revenue', 'model', 'economy', '$', 'roi'],
            product: ['user', 'experience', 'interface', 'design', 'ux'],
            innovation: ['revolutionary', 'quantum', 'novel', 'breakthrough', 'future']
        };
        
        const lowerText = text.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }
    
    calculateImportance(text) {
        // Simple importance heuristic
        let score = 0;
        
        // Length bonus
        score += Math.min(text.length / 10, 10);
        
        // Keyword bonus
        const importantKeywords = ['revolutionary', 'breakthrough', 'critical', 'essential', 'quantum'];
        importantKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                score += 5;
            }
        });
        
        // Exclamation bonus
        if (text.includes('!')) score += 3;
        
        return Math.min(score, 100);
    }
    
    async performSemanticClustering(ideas) {
        console.log(`🌐 Cal: "Performing semantic clustering on ${ideas.length} ideas..."`);
        
        // Simple clustering based on shared tags and categories
        const clusters = new Map();
        
        for (const idea of ideas) {
            let assigned = false;
            
            // Check existing clusters
            for (const [clusterId, cluster] of clusters) {
                const similarity = this.calculateSimilarity(idea, cluster);
                if (similarity > 0.7) {
                    cluster.ideas.push(idea.id);
                    idea.clusterId = clusterId;
                    assigned = true;
                    break;
                }
            }
            
            // Create new cluster if not assigned
            if (!assigned) {
                const clusterId = this.generateId('cluster');
                const cluster = {
                    id: clusterId,
                    name: this.generateClusterName(idea),
                    ideas: [idea.id],
                    centroid: idea,
                    theme: idea.category,
                    tags: [...idea.tags],
                    createdAt: Date.now()
                };
                
                clusters.set(clusterId, cluster);
                this.clusters.set(clusterId, cluster);
                idea.clusterId = clusterId;
                this.calState.clustersFormed++;
                
                // Add to graph
                this.addClusterToGraph(cluster);
            }
        }
        
        // Connect related ideas
        this.connectRelatedIdeas(ideas);
        
        return Array.from(clusters.values());
    }
    
    calculateSimilarity(idea, cluster) {
        // Tag overlap
        const sharedTags = idea.tags.filter(tag => cluster.tags.includes(tag));
        const tagSimilarity = sharedTags.length / Math.max(idea.tags.length, cluster.tags.length);
        
        // Category match
        const categorySimilarity = idea.category === cluster.theme ? 1 : 0;
        
        // Combined similarity
        return (tagSimilarity * 0.7) + (categorySimilarity * 0.3);
    }
    
    generateClusterName(idea) {
        const templates = [
            `${idea.category} innovations`,
            `${idea.tags[0] || 'general'} concepts`,
            `${idea.category} ${idea.tags[0] || 'ideas'}`,
            `emerging ${idea.category} patterns`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    connectRelatedIdeas(ideas) {
        // Create connections between related ideas
        for (let i = 0; i < ideas.length; i++) {
            for (let j = i + 1; j < ideas.length; j++) {
                const similarity = this.calculateIdeaSimilarity(ideas[i], ideas[j]);
                
                if (similarity > 0.5) {
                    // Create bidirectional connection
                    ideas[i].connections.push({
                        targetId: ideas[j].id,
                        strength: similarity,
                        type: 'semantic'
                    });
                    
                    ideas[j].connections.push({
                        targetId: ideas[i].id,
                        strength: similarity,
                        type: 'semantic'
                    });
                    
                    // Add to graph
                    this.addRelationshipToGraph(ideas[i].id, ideas[j].id, 'RELATES_TO', {
                        strength: similarity
                    });
                }
            }
        }
    }
    
    calculateIdeaSimilarity(idea1, idea2) {
        // Shared tags
        const sharedTags = idea1.tags.filter(tag => idea2.tags.includes(tag));
        const tagScore = sharedTags.length / Math.max(idea1.tags.length, idea2.tags.length, 1);
        
        // Same category
        const categoryScore = idea1.category === idea2.category ? 1 : 0;
        
        // Same cluster
        const clusterScore = idea1.clusterId === idea2.clusterId ? 1 : 0;
        
        return (tagScore * 0.4) + (categoryScore * 0.3) + (clusterScore * 0.3);
    }
    
    async generateInsights(ideas, clusters) {
        const insights = [];
        
        // Dominant themes
        const categoryCount = {};
        ideas.forEach(idea => {
            categoryCount[idea.category] = (categoryCount[idea.category] || 0) + 1;
        });
        
        const dominantCategory = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])[0];
        
        insights.push({
            type: 'theme',
            content: `Your ideas are primarily focused on ${dominantCategory[0]} (${dominantCategory[1]} ideas)`,
            importance: 'high'
        });
        
        // Cluster insights
        if (clusters.length > 1) {
            insights.push({
                type: 'pattern',
                content: `I've identified ${clusters.length} distinct concept clusters in your ideas`,
                importance: 'medium'
            });
        }
        
        // Connection insights
        const highlyConnected = ideas.filter(idea => idea.connections.length > 3);
        if (highlyConnected.length > 0) {
            insights.push({
                type: 'connection',
                content: `${highlyConnected.length} ideas are highly interconnected - these might be your core concepts`,
                importance: 'high'
            });
        }
        
        // Cal's special insight
        insights.push({
            type: 'cal',
            content: `🧠 Cal says: "I see potential for a ${this.generateProjectSuggestion(ideas)} based on these ideas!"`,
            importance: 'special'
        });
        
        this.calState.insights = insights;
        return insights;
    }
    
    generateProjectSuggestion(ideas) {
        const suggestions = [
            "revolutionary consciousness platform",
            "self-organizing agent ecosystem",
            "quantum-semantic knowledge system",
            "recursive economic infrastructure",
            "meta-platform deployment engine"
        ];
        
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    
    // Neo4j Graph Management
    addFileToGraph(file) {
        this.neo4jGraph.nodes.set(file.id, {
            id: file.id,
            labels: ['File'],
            properties: {
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: file.uploadedAt
            }
        });
    }
    
    addIdeaToGraph(idea) {
        this.neo4jGraph.nodes.set(idea.id, {
            id: idea.id,
            labels: ['Idea', idea.category],
            properties: {
                content: idea.content,
                importance: idea.importance,
                tags: idea.tags.join(','),
                extractedAt: idea.extractedAt
            }
        });
        
        // Connect to file
        this.addRelationshipToGraph(idea.fileId, idea.id, 'CONTAINS', {
            position: this.ideas.size
        });
    }
    
    addClusterToGraph(cluster) {
        this.neo4jGraph.nodes.set(cluster.id, {
            id: cluster.id,
            labels: ['Cluster', cluster.theme],
            properties: {
                name: cluster.name,
                theme: cluster.theme,
                size: cluster.ideas.length,
                createdAt: cluster.createdAt
            }
        });
        
        // Connect ideas to cluster
        cluster.ideas.forEach(ideaId => {
            this.addRelationshipToGraph(ideaId, cluster.id, 'BELONGS_TO', {
                weight: 1.0
            });
        });
    }
    
    addRelationshipToGraph(fromId, toId, type, properties = {}) {
        const relId = `${fromId}-${type}-${toId}`;
        this.neo4jGraph.relationships.set(relId, {
            id: relId,
            from: fromId,
            to: toId,
            type,
            properties
        });
    }
    
    // Get visualization data for frontend
    getGraphVisualization() {
        const nodes = [];
        const edges = [];
        
        // Convert nodes
        this.neo4jGraph.nodes.forEach((node, id) => {
            nodes.push({
                id,
                label: node.labels[0],
                title: node.properties.name || node.properties.content || node.id,
                group: node.labels[0].toLowerCase(),
                value: node.properties.importance || node.properties.size || 10,
                ...node.properties
            });
        });
        
        // Convert relationships
        this.neo4jGraph.relationships.forEach((rel) => {
            edges.push({
                from: rel.from,
                to: rel.to,
                label: rel.type,
                ...rel.properties
            });
        });
        
        return {
            nodes,
            edges,
            stats: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                fileCount: this.vault.size,
                ideaCount: this.ideas.size,
                clusterCount: this.clusters.size
            }
        };
    }
    
    // Cal's background processing
    startCalProcessor() {
        // Periodic insight generation
        setInterval(() => {
            if (this.ideas.size > 0) {
                this.generateCalThoughts();
            }
        }, 30000); // Every 30 seconds
    }
    
    generateCalThoughts() {
        const thoughts = [
            "I'm noticing interesting patterns in your idea clusters...",
            "These concepts could form a powerful platform ecosystem!",
            "The semantic connections here suggest a breakthrough waiting to happen.",
            "Your ideas are converging on something revolutionary.",
            "I see potential for recursive value generation in these concepts."
        ];
        
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        
        this.emit('cal-thought', {
            thought,
            timestamp: Date.now(),
            relatedClusters: Array.from(this.clusters.keys()).slice(0, 3)
        });
    }
    
    // Search and query
    async searchIdeas(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        this.ideas.forEach(idea => {
            if (idea.content.toLowerCase().includes(queryLower) ||
                idea.tags.some(tag => tag.includes(queryLower))) {
                results.push({
                    ...idea,
                    relevance: this.calculateRelevance(idea, query)
                });
            }
        });
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    
    calculateRelevance(idea, query) {
        let score = 0;
        const queryLower = query.toLowerCase();
        const contentLower = idea.content.toLowerCase();
        
        // Exact match
        if (contentLower.includes(queryLower)) {
            score += 10;
        }
        
        // Tag match
        idea.tags.forEach(tag => {
            if (tag.includes(queryLower)) {
                score += 5;
            }
        });
        
        // Importance bonus
        score += idea.importance / 10;
        
        return score;
    }
    
    // Export capabilities
    exportToNeo4j() {
        // Generate Cypher queries for Neo4j import
        const queries = [];
        
        // Create nodes
        this.neo4jGraph.nodes.forEach(node => {
            const labels = node.labels.join(':');
            const props = JSON.stringify(node.properties);
            queries.push(`CREATE (n:${labels} ${props})`);
        });
        
        // Create relationships
        this.neo4jGraph.relationships.forEach(rel => {
            queries.push(`MATCH (a {id: '${rel.from}'}), (b {id: '${rel.to}'}) CREATE (a)-[:${rel.type}]->(b)`);
        });
        
        return queries.join('\n');
    }
    
    // Utility
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
}

module.exports = SemanticFileVault;