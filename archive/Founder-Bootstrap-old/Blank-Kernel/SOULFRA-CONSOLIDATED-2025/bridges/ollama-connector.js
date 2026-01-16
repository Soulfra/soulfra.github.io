// Ollama local LLM connector stub
class OllamaConnector {
    constructor() {
        this.baseUrl = null;
        this.initialized = false;
    }

    async initialize(baseUrl = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
        this.initialized = true;
        console.log('✅ Ollama connector initialized');
        return true;
    }

    async reflect(prompt, baseUrl = null) {
        const url = baseUrl || this.baseUrl;
        
        // Check if Ollama is running
        try {
            const http = require('http');
            const checkUrl = new URL(url);
            
            // Check Ollama health endpoint
            const healthCheck = await new Promise((resolve, reject) => {
                const req = http.get(`${url}/api/tags`, (res) => {
                    if (res.statusCode === 200) {
                        resolve(true);
                    } else {
                        reject(new Error('Ollama not responding'));
                    }
                });
                
                req.on('error', reject);
                req.setTimeout(2000, () => {
                    req.destroy();
                    reject(new Error('Ollama timeout'));
                });
            });
            
            // If health check passes, use Ollama
            const response = await this.callOllama(url, prompt);
            return response;
            
        } catch (error) {
            console.log('⚠️  Ollama not available, falling back to local connector');
            // Fallback to local reflection
            const localConnector = require('./local-connector');
            return await localConnector.reflect(prompt);
        }
    }
    
    async callOllama(url, prompt) {
        const http = require('http');
        const postData = JSON.stringify({
            model: 'mistral',
            prompt: prompt,
            stream: false
        });
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(url).hostname,
                port: new URL(url).port || 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed.response || 'No response from Ollama');
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
}

module.exports = new OllamaConnector();