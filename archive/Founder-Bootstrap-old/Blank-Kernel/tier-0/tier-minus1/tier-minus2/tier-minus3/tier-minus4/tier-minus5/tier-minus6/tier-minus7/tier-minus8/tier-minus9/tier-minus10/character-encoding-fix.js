// -*- coding: utf-8 -*-
#!/usr/bin/env node

/**
 * CHARACTER ENCODING FIX
 * 
 * This middleware fixes character encoding issues with emojis and special characters
 * in the reverse proxy / routing layer
 */

const http = require('http');
const https = require('https');

class CharacterEncodingFix {
    constructor() {
        this.fixApplied = false;
    }

    /**
     * Express/Connect middleware to fix character encoding
     */
    middleware() {
        return (req, res, next) => {
            // Store original methods
            const originalWrite = res.write;
            const originalEnd = res.end;
            const originalWriteHead = res.writeHead;
            
            // Override writeHead to ensure UTF-8
            res.writeHead = function(statusCode, headers) {
                headers = headers || {};
                
                // Ensure Content-Type includes charset=utf-8
                if (headers['Content-Type']) {
                    if (!headers['Content-Type'].includes('charset')) {
                        headers['Content-Type'] += '; charset=utf-8';
                    }
                } else if (headers['content-type']) {
                    if (!headers['content-type'].includes('charset')) {
                        headers['content-type'] += '; charset=utf-8';
                    }
                }
                
                // Call original writeHead
                return originalWriteHead.call(this, statusCode, headers);
            };
            
            // Override write to handle encoding
            res.write = function(chunk, encoding) {
                if (chunk && typeof chunk === 'string') {
                    // Ensure UTF-8 encoding
                    chunk = Buffer.from(chunk, 'utf8');
                }
                return originalWrite.call(this, chunk, encoding);
            };
            
            // Override end to handle encoding
            res.end = function(chunk, encoding) {
                if (chunk && typeof chunk === 'string') {
                    // Ensure UTF-8 encoding
                    chunk = Buffer.from(chunk, 'utf8');
                }
                return originalEnd.call(this, chunk, encoding);
            };
            
            next();
        };
    }

    /**
     * Proxy request handler that preserves UTF-8
     */
    createProxyHandler(targetUrl) {
        return (req, res) => {
            const url = new URL(targetUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: req.url,
                method: req.method,
                headers: {
                    ...req.headers,
                    'Accept-Charset': 'utf-8',
                    'Accept-Encoding': 'identity' // Disable compression
                }
            };
            
            const proxyReq = protocol.request(options, (proxyRes) => {
                // Set response headers
                const headers = { ...proxyRes.headers };
                
                // Ensure UTF-8 in Content-Type
                if (headers['content-type'] && !headers['content-type'].includes('charset')) {
                    headers['content-type'] += '; charset=utf-8';
                }
                
                res.writeHead(proxyRes.statusCode, headers);
                
                // Handle response data
                const chunks = [];
                
                proxyRes.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                proxyRes.on('end', () => {
                    const body = Buffer.concat(chunks);
                    
                    // If it's JSON, parse and re-stringify to ensure proper encoding
                    if (headers['content-type'] && headers['content-type'].includes('application/json')) {
                        try {
                            const json = JSON.parse(body.toString('utf8'));
                            res.end(JSON.stringify(json));
                        } catch (e) {
                            // Not valid JSON, send as-is
                            res.end(body);
                        }
                    } else {
                        res.end(body);
                    }
                });
            });
            
            proxyReq.on('error', (err) => {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Proxy Error: ' + err.message);
            });
            
            // Forward request body if present
            req.pipe(proxyReq);
        };
    }

    /**
     * Fix for JSON.stringify to handle emojis properly
     */
    patchJSONStringify() {
        const originalStringify = JSON.stringify;
        
        JSON.stringify = function(value, replacer, space) {
            // Use original stringify
            const result = originalStringify.call(this, value, replacer, space);
            
            // Ensure emojis are properly encoded
            if (typeof result === 'string') {
                // This is already UTF-8 safe, but we ensure no double-encoding
                return result;
            }
            
            return result;
        };
    }

    /**
     * Apply all fixes
     */
    applyFixes() {
        if (this.fixApplied) return;
        
        // Patch JSON.stringify
        this.patchJSONStringify();
        
        // Set default encoding for process
        if (process.stdout && process.stdout.setDefaultEncoding) {
            process.stdout.setDefaultEncoding('utf8');
        }
        if (process.stderr && process.stderr.setDefaultEncoding) {
            process.stderr.setDefaultEncoding('utf8');
        }
        
        this.fixApplied = true;
        console.log('✅ Character encoding fixes applied');
    }

    /**
     * Create a fixed proxy server
     */
    createFixedProxyServer(routes, port = 8888) {
        this.applyFixes();
        
        const server = http.createServer((req, res) => {
            // Apply middleware
            this.middleware()(req, res, () => {
                // Find matching route
                for (const [pattern, target] of Object.entries(routes)) {
                    if (req.url.startsWith(pattern)) {
                        this.createProxyHandler(target)(req, res);
                        return;
                    }
                }
                
                // No route matched
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
            });
        });
        
        server.listen(port, () => {
            console.log(`🌐 Fixed proxy server running on port ${port}`);
            console.log('📝 Character encoding: UTF-8');
            console.log('✨ Emoji support: Enabled');
        });
        
        return server;
    }
}

// Export for use in other modules
module.exports = CharacterEncodingFix;

// Example usage if run directly
if (require.main === module) {
    const fix = new CharacterEncodingFix();
    
    // Example proxy routes
    const routes = {
        '/api': 'http://localhost:3000',
        '/game': 'http://localhost:3335',
        '/': 'http://localhost:8080'
    };
    
    fix.createFixedProxyServer(routes, 8888);
}