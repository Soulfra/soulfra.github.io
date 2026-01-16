#!/usr/bin/env node
/**
 * Vector DB Indexer Daemon
 * Leverages existing semantic-graph API for vector search
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class VectorIndexerDaemon extends EventEmitter {
    constructor() {
        super();
        this.indexPath = path.join(__dirname, 'index.db');
        this.semanticMapPath = path.join(__dirname, '../semantic_map.json');
        this.port = 7891;
        
        // Connect to existing semantic graph API
        this.semanticAPIPort = 3666;
        
        // In-memory vector store (for demonstration)
        // In production, use Chroma, Weaviate, or Qdrant
        this.vectors = new Map();
        this.documents = new Map();
        
        this.loadIndex();
    }
    
    loadIndex() {
        if (fs.existsSync(this.indexPath)) {
            const data = fs.readFileSync(this.indexPath, 'utf8');
            const index = JSON.parse(data);
            
            index.documents.forEach(doc => {
                this.documents.set(doc.id, doc);
                this.vectors.set(doc.id, doc.vector);
            });
            
            console.log(`Loaded ${this.documents.size} documents from index`);
        }
        
        if (fs.existsSync(this.semanticMapPath)) {
            this.semanticMap = JSON.parse(fs.readFileSync(this.semanticMapPath, 'utf8'));
        } else {
            this.semanticMap = { nodes: {}, edges: [] };
        }
    }
    
    saveIndex() {
        const index = {
            timestamp: new Date().toISOString(),
            documents: Array.from(this.documents.values())
        };
        
        fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2));
        fs.writeFileSync(this.semanticMapPath, JSON.stringify(this.semanticMap, null, 2));
    }
    
    // Simple text to vector embedding (for demonstration)
    // In production, use OpenAI embeddings or similar
    generateEmbedding(text) {
        const hash = crypto.createHash('sha256').update(text).digest();
        const vector = [];
        
        // Create 128-dimensional vector from hash
        for (let i = 0; i < 128; i++) {
            vector.push(hash[i % hash.length] / 255);
        }
        
        // Add semantic features
        const words = text.toLowerCase().split(/\s+/);
        const semanticFeatures = {
            length: Math.min(words.length / 100, 1),
            hasLoop: words.includes('loop') ? 1 : 0,
            hasAgent: words.includes('agent') ? 1 : 0,
            hasCal: words.includes('cal') ? 1 : 0,
            hasWhisper: words.includes('whisper') ? 1 : 0,
            hasTone: words.some(w => ['tone', 'mood', 'emotion'].includes(w)) ? 1 : 0
        };
        
        // Append semantic features to vector
        Object.values(semanticFeatures).forEach(f => vector.push(f));
        
        return vector;
    }
    
    // Cosine similarity for vector search
    cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    async indexDocument(doc) {
        const id = doc.id || crypto.randomBytes(16).toString('hex');
        const vector = this.generateEmbedding(doc.content);
        
        const document = {
            id,
            type: doc.type || 'generic',
            path: doc.path,
            content: doc.content,
            metadata: doc.metadata || {},
            vector,
            indexed_at: new Date().toISOString()
        };
        
        this.documents.set(id, document);
        this.vectors.set(id, vector);
        
        // Update semantic map
        this.updateSemanticMap(document);
        
        // Notify semantic graph API
        await this.notifySemanticAPI('document_indexed', document);
        
        this.emit('document_indexed', document);
        return document;
    }
    
    updateSemanticMap(doc) {
        // Add node to semantic map
        this.semanticMap.nodes[doc.id] = {
            id: doc.id,
            type: doc.type,
            label: doc.path || doc.id,
            metadata: doc.metadata
        };
        
        // Find similar documents and create edges
        const similarities = this.findSimilar(doc.content, 5);
        
        similarities.forEach(sim => {
            if (sim.score > 0.7) { // Threshold for semantic connection
                this.semanticMap.edges.push({
                    source: doc.id,
                    target: sim.id,
                    weight: sim.score,
                    type: 'semantic_similarity'
                });
            }
        });
    }
    
    findSimilar(query, topK = 10) {
        const queryVector = typeof query === 'string' ? 
            this.generateEmbedding(query) : query;
        
        const similarities = [];
        
        for (const [id, vector] of this.vectors) {
            const score = this.cosineSimilarity(queryVector, vector);
            similarities.push({ id, score });
        }
        
        return similarities
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(sim => ({
                ...sim,
                document: this.documents.get(sim.id)
            }));
    }
    
    async notifySemanticAPI(event, data) {
        const payload = JSON.stringify({ event, data });
        
        const options = {
            hostname: 'localhost',
            port: this.semanticAPIPort,
            path: '/api/graph/event',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        
        return new Promise((resolve) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(body));
            });
            
            req.on('error', () => resolve(null));
            req.write(payload);
            req.end();
        });
    }
    
    async indexDirectory(dirPath, recursive = true) {
        console.log(`Indexing directory: ${dirPath}`);
        
        const files = fs.readdirSync(dirPath);
        let indexed = 0;
        
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && recursive) {
                indexed += await this.indexDirectory(fullPath, recursive);
            } else if (stat.isFile() && this.shouldIndex(file)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    await this.indexDocument({
                        path: fullPath,
                        content,
                        type: this.getFileType(file),
                        metadata: {
                            size: stat.size,
                            modified: stat.mtime
                        }
                    });
                    indexed++;
                } catch (err) {
                    console.error(`Error indexing ${fullPath}:`, err.message);
                }
            }
        }
        
        return indexed;
    }
    
    shouldIndex(filename) {
        const extensions = ['.js', '.json', '.md', '.txt', '.log'];
        return extensions.some(ext => filename.endsWith(ext));
    }
    
    getFileType(filename) {
        if (filename.endsWith('.js')) return 'code';
        if (filename.endsWith('.json')) return 'config';
        if (filename.endsWith('.md')) return 'documentation';
        if (filename.endsWith('.log')) return 'log';
        return 'text';
    }
    
    startAPI() {
        const server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'GET' && req.url === '/') {
                res.end(JSON.stringify({
                    service: 'VectorIndexerDaemon',
                    documents: this.documents.size,
                    endpoints: [
                        'GET /search?q=query&limit=10',
                        'POST /index',
                        'GET /similar/:id',
                        'GET /semantic-map'
                    ]
                }));
                
            } else if (req.method === 'GET' && req.url.startsWith('/search')) {
                const url = new URL(req.url, `http://localhost:${this.port}`);
                const query = url.searchParams.get('q') || '';
                const limit = parseInt(url.searchParams.get('limit') || '10');
                
                const results = this.findSimilar(query, limit);
                res.end(JSON.stringify({ query, results }));
                
            } else if (req.method === 'POST' && req.url === '/index') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const doc = JSON.parse(body);
                        const indexed = await this.indexDocument(doc);
                        res.end(JSON.stringify({ success: true, document: indexed }));
                    } catch (err) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
                
            } else if (req.method === 'GET' && req.url === '/semantic-map') {
                res.end(JSON.stringify(this.semanticMap));
                
            } else if (req.method === 'GET' && req.url.startsWith('/similar/')) {
                const id = req.url.split('/').pop();
                const doc = this.documents.get(id);
                
                if (!doc) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Document not found' }));
                    return;
                }
                
                const similar = this.findSimilar(doc.vector, 10);
                res.end(JSON.stringify({ document: doc, similar }));
                
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`VectorIndexer API running on port ${this.port}`);
        });
    }
    
    async start() {
        console.log('Starting Vector Indexer Daemon...');
        
        // Start API
        this.startAPI();
        
        // Index core directories
        const directoriesToIndex = [
            '../ledger',
            '../agents',
            '../docs',
            '../runtime'
        ];
        
        let totalIndexed = 0;
        for (const dir of directoriesToIndex) {
            const fullPath = path.join(__dirname, dir);
            if (fs.existsSync(fullPath)) {
                const indexed = await this.indexDirectory(fullPath);
                totalIndexed += indexed;
                console.log(`Indexed ${indexed} files from ${dir}`);
            }
        }
        
        console.log(`Total documents indexed: ${totalIndexed}`);
        
        // Save index
        this.saveIndex();
        
        // Start file watcher for real-time indexing
        this.startFileWatcher();
    }
    
    startFileWatcher() {
        const watchDirs = ['../ledger', '../agents', '../docs'];
        
        watchDirs.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            if (fs.existsSync(fullPath)) {
                fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
                    if (filename && this.shouldIndex(filename)) {
                        const filePath = path.join(fullPath, filename);
                        
                        if (fs.existsSync(filePath)) {
                            try {
                                const content = fs.readFileSync(filePath, 'utf8');
                                this.indexDocument({
                                    path: filePath,
                                    content,
                                    type: this.getFileType(filename)
                                });
                                console.log(`Re-indexed: ${filename}`);
                            } catch (err) {
                                // File might be deleted or unreadable
                            }
                        }
                    }
                });
            }
        });
    }
}

// Run if called directly
if (require.main === module) {
    const daemon = new VectorIndexerDaemon();
    daemon.start();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\nSaving index before shutdown...');
        daemon.saveIndex();
        process.exit(0);
    });
}

module.exports = VectorIndexerDaemon;