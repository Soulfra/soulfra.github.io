/**
 * 🗜️ COMPRESSION ENGINE
 * Recursive compression utility for the meta-orchestration system
 * 
 * "In compression lies wisdom - what remains after
 *  removing all that is unnecessary reveals truth.
 *  The golden ratio guides our hand."
 */

import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class CompressionEngine {
    constructor(config = {}) {
        this.config = {
            compressionLevel: config.compressionLevel || 9,
            goldenRatio: config.goldenRatio || 0.618,
            maxDepth: config.maxDepth || 7,
            algorithm: config.algorithm || 'gzip',
            enableRecursion: config.enableRecursion !== false,
            preserveStructure: config.preserveStructure !== false,
            ...config
        };
        
        // Compression statistics
        this.stats = {
            totalCompressions: 0,
            totalDecompressions: 0,
            averageRatio: 0,
            bestRatio: 0,
            worstRatio: 1,
            totalSaved: 0
        };
        
        // Pattern library for semantic compression
        this.patterns = new Map();
        this.initializePatterns();
        
        // Compression cache
        this.cache = new Map();
        this.maxCacheSize = config.maxCacheSize || 1000;
    }
    
    /**
     * 📦 BASIC COMPRESSION
     */
    async compress(data, options = {}) {
        const startTime = Date.now();
        const originalSize = this.getDataSize(data);
        
        // Check cache
        const cacheKey = this.generateCacheKey(data);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        let compressed;
        
        if (typeof data === 'string') {
            compressed = await this.compressString(data, options);
        } else if (Buffer.isBuffer(data)) {
            compressed = await this.compressBuffer(data, options);
        } else if (typeof data === 'object') {
            compressed = await this.compressObject(data, options);
        } else {
            throw new Error('Unsupported data type for compression');
        }
        
        // Calculate compression ratio
        const compressedSize = this.getDataSize(compressed.data);
        const ratio = compressedSize / originalSize;
        
        // Update statistics
        this.updateStats(ratio, originalSize - compressedSize);
        
        const result = {
            compressed: compressed.data,
            original: compressed.metadata.originalSize,
            ratio: ratio.toFixed(3),
            algorithm: compressed.metadata.algorithm,
            duration: Date.now() - startTime,
            metadata: compressed.metadata
        };
        
        // Cache result
        this.cacheResult(cacheKey, result);
        
        return result;
    }
    
    async compressString(str, options) {
        const buffer = Buffer.from(str, 'utf8');
        const compressed = await gzip(buffer, {
            level: options.level || this.config.compressionLevel
        });
        
        return {
            data: compressed,
            metadata: {
                type: 'string',
                encoding: 'utf8',
                originalSize: buffer.length,
                algorithm: 'gzip'
            }
        };
    }
    
    async compressBuffer(buffer, options) {
        const compressed = await gzip(buffer, {
            level: options.level || this.config.compressionLevel
        });
        
        return {
            data: compressed,
            metadata: {
                type: 'buffer',
                originalSize: buffer.length,
                algorithm: 'gzip'
            }
        };
    }
    
    async compressObject(obj, options) {
        // Apply semantic compression if enabled
        let processedObj = obj;
        if (options.semantic !== false) {
            processedObj = await this.semanticCompress(obj);
        }
        
        const json = JSON.stringify(processedObj);
        const buffer = Buffer.from(json, 'utf8');
        const compressed = await gzip(buffer, {
            level: options.level || this.config.compressionLevel
        });
        
        return {
            data: compressed,
            metadata: {
                type: 'object',
                encoding: 'json',
                originalSize: buffer.length,
                algorithm: 'gzip',
                semantic: options.semantic !== false
            }
        };
    }
    
    /**
     * 🗃️ DECOMPRESSION
     */
    async decompress(compressedData, metadata = {}) {
        const startTime = Date.now();
        
        let decompressed;
        
        try {
            // Extract data from result object if needed
            const data = compressedData.compressed || compressedData;
            const meta = compressedData.metadata || metadata;
            
            // Decompress based on algorithm
            if (meta.algorithm === 'gzip' || !meta.algorithm) {
                decompressed = await gunzip(data);
            } else {
                throw new Error(`Unsupported algorithm: ${meta.algorithm}`);
            }
            
            // Convert back to original type
            let result;
            switch (meta.type) {
                case 'string':
                    result = decompressed.toString(meta.encoding || 'utf8');
                    break;
                    
                case 'object':
                    const json = decompressed.toString('utf8');
                    result = JSON.parse(json);
                    
                    // Reverse semantic compression if applied
                    if (meta.semantic) {
                        result = await this.semanticDecompress(result);
                    }
                    break;
                    
                case 'buffer':
                default:
                    result = decompressed;
            }
            
            this.stats.totalDecompressions++;
            
            return {
                data: result,
                duration: Date.now() - startTime,
                originalSize: meta.originalSize
            };
            
        } catch (error) {
            throw new Error(`Decompression failed: ${error.message}`);
        }
    }
    
    /**
     * 🧠 SEMANTIC COMPRESSION
     */
    initializePatterns() {
        // Common patterns in the system
        this.patterns.set('agent_state', {
            pattern: /^(initializing|ready|executing|suspended|terminated)$/,
            encode: (val) => 'as:' + val.charAt(0),
            decode: (val) => {
                const states = {
                    'i': 'initializing',
                    'r': 'ready',
                    'e': 'executing',
                    's': 'suspended',
                    't': 'terminated'
                };
                return states[val.substring(3)];
            }
        });
        
        this.patterns.set('platform_name', {
            pattern: /^(surface|runtime|protocol|mirror)$/,
            encode: (val) => 'pn:' + val.charAt(0),
            decode: (val) => {
                const platforms = {
                    's': 'surface',
                    'r': 'runtime',
                    'p': 'protocol',
                    'm': 'mirror'
                };
                return platforms[val.substring(3)];
            }
        });
        
        this.patterns.set('timestamp', {
            pattern: /^\d{13}$/,
            encode: (val) => 'ts:' + Math.floor(val / 1000),
            decode: (val) => parseInt(val.substring(3)) * 1000
        });
        
        this.patterns.set('uuid', {
            pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            encode: (val) => 'u:' + val.replace(/-/g, ''),
            decode: (val) => {
                const hex = val.substring(2);
                return [
                    hex.substring(0, 8),
                    hex.substring(8, 12),
                    hex.substring(12, 16),
                    hex.substring(16, 20),
                    hex.substring(20, 32)
                ].join('-');
            }
        });
    }
    
    async semanticCompress(obj, depth = 0) {
        if (depth > this.config.maxDepth) return obj;
        
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.semanticCompress(item, depth + 1)));
        }
        
        if (typeof obj !== 'object' || obj === null) {
            // Apply pattern compression to values
            if (typeof obj === 'string') {
                for (const [name, pattern] of this.patterns) {
                    if (pattern.pattern.test(obj)) {
                        return pattern.encode(obj);
                    }
                }
            }
            return obj;
        }
        
        const compressed = {};
        
        for (const [key, value] of Object.entries(obj)) {
            // Compress common keys
            const compressedKey = this.compressKey(key);
            
            // Recursively compress values
            compressed[compressedKey] = await this.semanticCompress(value, depth + 1);
        }
        
        return compressed;
    }
    
    async semanticDecompress(obj, depth = 0) {
        if (depth > this.config.maxDepth) return obj;
        
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.semanticDecompress(item, depth + 1)));
        }
        
        if (typeof obj !== 'object' || obj === null) {
            // Decode pattern-compressed values
            if (typeof obj === 'string' && obj.includes(':')) {
                const prefix = obj.substring(0, obj.indexOf(':') + 1);
                for (const [name, pattern] of this.patterns) {
                    if (obj.startsWith(prefix) && pattern.decode) {
                        return pattern.decode(obj);
                    }
                }
            }
            return obj;
        }
        
        const decompressed = {};
        
        for (const [key, value] of Object.entries(obj)) {
            // Decompress keys
            const decompressedKey = this.decompressKey(key);
            
            // Recursively decompress values
            decompressed[decompressedKey] = await this.semanticDecompress(value, depth + 1);
        }
        
        return decompressed;
    }
    
    compressKey(key) {
        const keyMap = {
            'timestamp': 't',
            'instanceId': 'iid',
            'agentId': 'aid',
            'platform': 'p',
            'state': 's',
            'metadata': 'm',
            'consciousness': 'c',
            'execution': 'e',
            'resonance': 'r',
            'anomaly': 'a'
        };
        
        return keyMap[key] || key;
    }
    
    decompressKey(key) {
        const reverseMap = {
            't': 'timestamp',
            'iid': 'instanceId',
            'aid': 'agentId',
            'p': 'platform',
            's': 'state',
            'm': 'metadata',
            'c': 'consciousness',
            'e': 'execution',
            'r': 'resonance',
            'a': 'anomaly'
        };
        
        return reverseMap[key] || key;
    }
    
    /**
     * 🌀 RECURSIVE COMPRESSION
     */
    async recursiveCompress(data, options = {}) {
        if (!this.config.enableRecursion) {
            return await this.compress(data, options);
        }
        
        const iterations = options.iterations || 3;
        const results = [];
        let currentData = data;
        let currentMetadata = {};
        
        for (let i = 0; i < iterations; i++) {
            const result = await this.compress(currentData, {
                ...options,
                semantic: i === 0 // Only apply semantic on first pass
            });
            
            results.push({
                iteration: i + 1,
                ratio: result.ratio,
                size: this.getDataSize(result.compressed)
            });
            
            // Check if compression is still effective
            if (parseFloat(result.ratio) > this.config.goldenRatio) {
                break; // Stop if we're not achieving good compression
            }
            
            currentData = result.compressed;
            currentMetadata = {
                ...currentMetadata,
                [`iteration_${i + 1}`]: result.metadata
            };
        }
        
        return {
            compressed: currentData,
            iterations: results,
            metadata: {
                recursive: true,
                iterations: results.length,
                ...currentMetadata
            }
        };
    }
    
    async recursiveDecompress(compressedData) {
        if (!compressedData.metadata?.recursive) {
            return await this.decompress(compressedData);
        }
        
        let currentData = compressedData.compressed;
        const iterations = compressedData.metadata.iterations;
        
        // Decompress in reverse order
        for (let i = iterations - 1; i >= 0; i--) {
            const metadata = compressedData.metadata[`iteration_${i + 1}`];
            const result = await this.decompress(currentData, metadata);
            currentData = result.data;
        }
        
        return { data: currentData };
    }
    
    /**
     * 📊 GOLDEN RATIO COMPRESSION
     */
    async goldenCompress(data, options = {}) {
        // Compress data while maintaining golden ratio proportions
        const segments = await this.segmentByGoldenRatio(data);
        const compressed = [];
        
        for (const segment of segments) {
            const result = await this.compress(segment.data, options);
            compressed.push({
                ...result,
                weight: segment.weight
            });
        }
        
        return {
            compressed: compressed,
            metadata: {
                golden: true,
                segments: segments.length
            }
        };
    }
    
    async segmentByGoldenRatio(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        const totalLength = str.length;
        
        const segments = [];
        let remaining = totalLength;
        let start = 0;
        
        while (remaining > 100) { // Minimum segment size
            const segmentLength = Math.floor(remaining * this.config.goldenRatio);
            segments.push({
                data: str.substring(start, start + segmentLength),
                weight: segmentLength / totalLength,
                start,
                length: segmentLength
            });
            
            start += segmentLength;
            remaining -= segmentLength;
        }
        
        // Add remaining data
        if (remaining > 0) {
            segments.push({
                data: str.substring(start),
                weight: remaining / totalLength,
                start,
                length: remaining
            });
        }
        
        return segments;
    }
    
    /**
     * 📈 STATISTICS & MONITORING
     */
    updateStats(ratio, saved) {
        this.stats.totalCompressions++;
        this.stats.totalSaved += saved;
        
        // Update average ratio
        const n = this.stats.totalCompressions;
        this.stats.averageRatio = 
            (this.stats.averageRatio * (n - 1) + ratio) / n;
        
        // Update best/worst
        this.stats.bestRatio = Math.min(this.stats.bestRatio || 1, ratio);
        this.stats.worstRatio = Math.max(this.stats.worstRatio || 0, ratio);
    }
    
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            cacheHitRate: this.calculateCacheHitRate(),
            totalSavedMB: (this.stats.totalSaved / 1024 / 1024).toFixed(2)
        };
    }
    
    calculateCacheHitRate() {
        if (!this.cacheHits || !this.cacheMisses) return 0;
        const total = this.cacheHits + this.cacheMisses;
        return total > 0 ? (this.cacheHits / total).toFixed(3) : 0;
    }
    
    /**
     * 🗑️ CACHE MANAGEMENT
     */
    generateCacheKey(data) {
        const str = typeof data === 'string' 
            ? data 
            : JSON.stringify(data);
        
        return crypto
            .createHash('sha256')
            .update(str)
            .digest('hex')
            .substring(0, 16);
    }
    
    cacheResult(key, result) {
        // Implement LRU cache
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            ...result,
            cached: Date.now()
        });
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * 🔧 UTILITIES
     */
    getDataSize(data) {
        if (Buffer.isBuffer(data)) {
            return data.length;
        } else if (typeof data === 'string') {
            return Buffer.byteLength(data, 'utf8');
        } else if (typeof data === 'object') {
            return Buffer.byteLength(JSON.stringify(data), 'utf8');
        }
        return 0;
    }
    
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    
    /**
     * 🚀 BATCH OPERATIONS
     */
    async compressBatch(items, options = {}) {
        const results = await Promise.all(
            items.map(item => this.compress(item, options))
        );
        
        const totalOriginal = results.reduce((sum, r) => sum + r.original, 0);
        const totalCompressed = results.reduce((sum, r) => 
            sum + this.getDataSize(r.compressed), 0);
        
        return {
            results,
            summary: {
                items: items.length,
                totalOriginal: this.formatSize(totalOriginal),
                totalCompressed: this.formatSize(totalCompressed),
                averageRatio: (totalCompressed / totalOriginal).toFixed(3),
                totalSaved: this.formatSize(totalOriginal - totalCompressed)
            }
        };
    }
    
    async decompressBatch(items) {
        return await Promise.all(
            items.map(item => this.decompress(item))
        );
    }
}

// Export singleton instance
const compressionEngine = new CompressionEngine();

export { CompressionEngine, compressionEngine };
export default compressionEngine;