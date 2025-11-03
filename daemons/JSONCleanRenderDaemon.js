#!/usr/bin/env node
/**
 * JSONCleanRenderDaemon
 * Sanitizes and optimizes all JSON payloads before frontend delivery or disk storage
 * Prevents circular references, memory leaks, and oversized responses
 */

const { EventEmitter } = require('events');

class JSONCleanRenderDaemon extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            max_depth: 10,
            max_array_length: 100,
            max_string_length: 5000,
            max_object_keys: 50,
            include_metadata: true,
            compression_threshold: 10000, // bytes
            cache_cleaned: true,
            cache_ttl: 300000 // 5 minutes
        };
        
        // Cache for cleaned objects
        this.cleanCache = new Map();
        
        // Metrics
        this.metrics = {
            total_cleaned: 0,
            circular_refs_removed: 0,
            arrays_truncated: 0,
            strings_truncated: 0,
            objects_pruned: 0,
            cache_hits: 0,
            errors: 0
        };
        
        // Circular reference tracker
        this.seenObjects = new WeakSet();
    }
    
    /**
     * Clean any JavaScript object for safe JSON serialization
     */
    clean(obj, options = {}) {
        const config = { ...this.config, ...options };
        
        try {
            // Check cache first
            if (config.cache_cleaned && this.cleanCache.has(obj)) {
                const cached = this.cleanCache.get(obj);
                if (Date.now() - cached.timestamp < config.cache_ttl) {
                    this.metrics.cache_hits++;
                    return cached.data;
                }
            }
            
            // Reset seen objects for this cleaning operation
            this.seenObjects = new WeakSet();
            
            // Perform deep clean
            const cleaned = this._deepClean(obj, config, 0);
            
            // Add metadata if requested
            const result = config.include_metadata ? {
                data: cleaned,
                _meta: {
                    cleaned_at: new Date().toISOString(),
                    origin: 'JSONCleanRenderDaemon',
                    metrics: {
                        circular_refs: this.metrics.circular_refs_removed,
                        truncations: this.metrics.arrays_truncated + this.metrics.strings_truncated
                    }
                }
            } : cleaned;
            
            // Cache result
            if (config.cache_cleaned) {
                this.cleanCache.set(obj, {
                    data: result,
                    timestamp: Date.now()
                });
                
                // Clean old cache entries
                this._cleanCache();
            }
            
            this.metrics.total_cleaned++;
            this.emit('cleaned', { size: JSON.stringify(result).length });
            
            return result;
            
        } catch (error) {
            this.metrics.errors++;
            this.emit('error', error);
            
            // Return safe fallback
            return {
                error: 'Failed to clean object',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    _deepClean(obj, config, depth) {
        // Check depth limit
        if (depth > config.max_depth) {
            this.metrics.objects_pruned++;
            return '[Max depth exceeded]';
        }
        
        // Handle primitives
        if (obj === null || obj === undefined) {
            return obj;
        }
        
        const type = typeof obj;
        
        if (type === 'string') {
            if (obj.length > config.max_string_length) {
                this.metrics.strings_truncated++;
                return obj.substring(0, config.max_string_length) + '...[truncated]';
            }
            return obj;
        }
        
        if (type === 'number' || type === 'boolean') {
            return obj;
        }
        
        if (type === 'function') {
            return '[Function]';
        }
        
        if (type === 'symbol') {
            return obj.toString();
        }
        
        // Handle dates
        if (obj instanceof Date) {
            return obj.toISOString();
        }
        
        // Handle arrays
        if (Array.isArray(obj)) {
            // Check circular reference
            if (this.seenObjects.has(obj)) {
                this.metrics.circular_refs_removed++;
                return '[Circular reference]';
            }
            this.seenObjects.add(obj);
            
            let result = [];
            const limit = Math.min(obj.length, config.max_array_length);
            
            for (let i = 0; i < limit; i++) {
                result.push(this._deepClean(obj[i], config, depth + 1));
            }
            
            if (obj.length > config.max_array_length) {
                this.metrics.arrays_truncated++;
                result.push(`...[${obj.length - config.max_array_length} more items]`);
            }
            
            return result;
        }
        
        // Handle objects
        if (type === 'object') {
            // Check circular reference
            if (this.seenObjects.has(obj)) {
                this.metrics.circular_refs_removed++;
                return '[Circular reference]';
            }
            this.seenObjects.add(obj);
            
            const result = {};
            const keys = Object.keys(obj);
            const limit = Math.min(keys.length, config.max_object_keys);
            
            for (let i = 0; i < limit; i++) {
                const key = keys[i];
                // Skip internal properties
                if (key.startsWith('_') || key.startsWith('$')) {
                    continue;
                }
                
                try {
                    result[key] = this._deepClean(obj[key], config, depth + 1);
                } catch (e) {
                    result[key] = '[Error reading property]';
                }
            }
            
            if (keys.length > config.max_object_keys) {
                this.metrics.objects_pruned++;
                result._truncated = `${keys.length - config.max_object_keys} more properties`;
            }
            
            return result;
        }
        
        // Fallback
        return '[Unknown type]';
    }
    
    /**
     * Clean cache of old entries
     */
    _cleanCache() {
        const now = Date.now();
        const toDelete = [];
        
        for (const [key, value] of this.cleanCache.entries()) {
            if (now - value.timestamp > this.config.cache_ttl) {
                toDelete.push(key);
            }
        }
        
        toDelete.forEach(key => this.cleanCache.delete(key));
    }
    
    /**
     * Express/Connect middleware
     */
    middleware() {
        const daemon = this;
        
        return function jsonCleanMiddleware(req, res, next) {
            // Override res.json
            const originalJson = res.json.bind(res);
            
            res.json = function(obj) {
                try {
                    const cleaned = daemon.clean(obj, {
                        include_metadata: false // Don't add metadata in API responses
                    });
                    return originalJson(cleaned);
                } catch (error) {
                    daemon.emit('middleware_error', error);
                    return originalJson({
                        error: 'Failed to process response',
                        timestamp: new Date().toISOString()
                    });
                }
            };
            
            next();
        };
    }
    
    /**
     * Clean and stringify for safe logging
     */
    stringify(obj, space = 2) {
        const cleaned = this.clean(obj, { include_metadata: false });
        return JSON.stringify(cleaned, null, space);
    }
    
    /**
     * Get daemon statistics
     */
    getStats() {
        return {
            ...this.metrics,
            cache_size: this.cleanCache.size,
            memory_usage: process.memoryUsage().heapUsed
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            total_cleaned: 0,
            circular_refs_removed: 0,
            arrays_truncated: 0,
            strings_truncated: 0,
            objects_pruned: 0,
            cache_hits: 0,
            errors: 0
        };
        this.emit('metrics_reset');
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cleanCache.clear();
        this.emit('cache_cleared');
    }
}

module.exports = JSONCleanRenderDaemon;

// Example usage and testing
if (require.main === module) {
    const daemon = new JSONCleanRenderDaemon();
    
    // Test circular reference
    const circular = { name: 'test' };
    circular.self = circular;
    
    console.log('Testing circular reference:');
    console.log(daemon.stringify(circular));
    
    // Test deep nesting
    let deep = { level: 0 };
    let current = deep;
    for (let i = 1; i <= 20; i++) {
        current.next = { level: i };
        current = current.next;
    }
    
    console.log('\nTesting deep nesting:');
    console.log(daemon.stringify(deep));
    
    // Test large array
    const large = {
        items: Array(200).fill(0).map((_, i) => ({ id: i, data: 'x'.repeat(100) }))
    };
    
    console.log('\nTesting large array:');
    console.log(daemon.stringify(large));
    
    // Show stats
    console.log('\nDaemon stats:', daemon.getStats());
}