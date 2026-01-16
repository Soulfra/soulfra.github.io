// Sandboxed Agent Runtime - Executes agents locally in browser with strict isolation
class SandboxedRuntime {
    constructor() {
        this.sessionId = null;
        this.agent = null;
        this.worker = null;
        this.memories = [];
        this.constraints = {
            maxTokens: 1000,
            maxMemory: 50 * 1024 * 1024, // 50MB
            maxExecutionTime: 30000, // 30s
            allowedAPIs: ['localStorage', 'indexedDB', 'fetch']
        };
        this.metrics = {
            prompts: 0,
            localResponses: 0,
            cloudCalls: 0,
            errors: 0,
            memoryUsage: 0
        };
    }
    
    async initialize(sessionId, agentBundle) {
        this.sessionId = sessionId;
        console.log('🔒 Initializing sandboxed runtime for session:', sessionId);
        
        try {
            // Validate agent bundle
            if (!this.validateAgentBundle(agentBundle)) {
                throw new Error('Invalid agent bundle');
            }
            
            // Create isolated worker
            this.worker = await this.createSandboxedWorker(agentBundle);
            
            // Initialize local storage
            await this.initializeLocalStorage();
            
            // Load agent
            this.agent = agentBundle;
            
            console.log('✅ Sandboxed runtime initialized');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize sandbox:', error);
            this.metrics.errors++;
            return { success: false, error: error.message };
        }
    }
    
    validateAgentBundle(bundle) {
        // Verify bundle integrity
        if (!bundle.id || !bundle.checksum) {
            return false;
        }
        
        // Verify checksum
        const calculated = this.calculateChecksum(bundle);
        if (calculated !== bundle.checksum) {
            console.error('Checksum mismatch');
            return false;
        }
        
        // Check for malicious patterns
        const code = bundle.code || '';
        const dangerous = [
            /eval\s*\(/,
            /Function\s*\(/,
            /setTimeout.*\(/,
            /setInterval.*\(/,
            /__proto__/,
            /constructor\s*\[/
        ];
        
        for (const pattern of dangerous) {
            if (pattern.test(code)) {
                console.error('Dangerous pattern detected:', pattern);
                return false;
            }
        }
        
        return true;
    }
    
    async createSandboxedWorker(agentBundle) {
        // Create worker code with strict sandbox
        const workerCode = `
            // Strict mode
            'use strict';
            
            // Sandbox globals
            const sandbox = {
                console: {
                    log: (...args) => postMessage({ type: 'log', data: args }),
                    error: (...args) => postMessage({ type: 'error', data: args })
                },
                memories: [],
                constraints: ${JSON.stringify(this.constraints)}
            };
            
            // Agent personality and config
            const agent = ${JSON.stringify({
                id: agentBundle.id,
                personality: agentBundle.personality,
                systemPrompt: agentBundle.systemPrompt,
                tools: agentBundle.tools
            })};
            
            // Local reflection engine
            function generateLocalResponse(prompt) {
                // Simple pattern-based responses
                const patterns = [
                    {
                        match: /hello|hi|hey/i,
                        response: "Hello! I'm running entirely on your device. How can I help you today?"
                    },
                    {
                        match: /how are you/i,
                        response: "I'm operating in local mode, which means I'm fast and private! Everything stays on your device."
                    },
                    {
                        match: /what can you do/i,
                        response: "In local mode, I can: reflect on your thoughts, help organize ideas, provide basic responses, and keep everything private. For complex tasks, we can enable cloud mode."
                    }
                ];
                
                for (const pattern of patterns) {
                    if (pattern.match.test(prompt)) {
                        return pattern.response;
                    }
                }
                
                // Fallback reflection
                return \`I'm reflecting on: "\${prompt}". In local mode, I provide thoughtful reflections rather than complex analysis. Your privacy is protected.\`;
            }
            
            // Memory management
            function addMemory(content, type = 'reflection') {
                const memory = {
                    timestamp: new Date().toISOString(),
                    type: type,
                    content: content,
                    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };
                
                sandbox.memories.push(memory);
                
                // Enforce memory limit
                if (sandbox.memories.length > 100) {
                    sandbox.memories = sandbox.memories.slice(-100);
                }
                
                postMessage({ type: 'memory_added', data: memory });
                return memory;
            }
            
            // Message handler
            self.onmessage = async (event) => {
                const { type, data } = event.data;
                
                try {
                    switch (type) {
                        case 'prompt':
                            const response = generateLocalResponse(data.prompt);
                            addMemory(data.prompt, 'user_prompt');
                            addMemory(response, 'agent_response');
                            
                            postMessage({
                                type: 'response',
                                data: {
                                    response: response,
                                    local: true,
                                    memories: sandbox.memories.length
                                }
                            });
                            break;
                            
                        case 'get_memories':
                            postMessage({
                                type: 'memories',
                                data: sandbox.memories
                            });
                            break;
                            
                        case 'clear_memories':
                            sandbox.memories = [];
                            postMessage({
                                type: 'memories_cleared',
                                data: true
                            });
                            break;
                            
                        case 'get_status':
                            postMessage({
                                type: 'status',
                                data: {
                                    agent: agent.id,
                                    memories: sandbox.memories.length,
                                    constraints: sandbox.constraints
                                }
                            });
                            break;
                    }
                } catch (error) {
                    postMessage({
                        type: 'error',
                        data: error.message
                    });
                }
            };
            
            // Custom agent code execution (if provided)
            ${agentBundle.code || ''}
            
            // Initialize
            postMessage({ type: 'ready', data: agent });
        `;
        
        // Create blob and worker
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        // Setup worker handlers
        worker.onmessage = (event) => this.handleWorkerMessage(event);
        worker.onerror = (error) => this.handleWorkerError(error);
        
        // Wait for ready signal
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker initialization timeout'));
            }, 5000);
            
            const readyHandler = (event) => {
                if (event.data.type === 'ready') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', readyHandler);
                    resolve(worker);
                }
            };
            
            worker.addEventListener('message', readyHandler);
        });
    }
    
    async processPrompt(prompt, options = {}) {
        if (!this.worker) {
            throw new Error('Runtime not initialized');
        }
        
        this.metrics.prompts++;
        
        // Check if we should use local processing
        if (options.preferLocal || !options.allowCloud) {
            return await this.processLocally(prompt);
        }
        
        // Check if cloud is allowed and available
        const cloudAllowed = await this.checkCloudPermission();
        if (!cloudAllowed) {
            return await this.processLocally(prompt);
        }
        
        // Process with cloud API
        return await this.processWithCloud(prompt, options);
    }
    
    async processLocally(prompt) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Local processing timeout'));
            }, this.constraints.maxExecutionTime);
            
            const responseHandler = (event) => {
                if (event.data.type === 'response') {
                    clearTimeout(timeout);
                    this.worker.removeEventListener('message', responseHandler);
                    this.metrics.localResponses++;
                    resolve(event.data.data);
                }
            };
            
            this.worker.addEventListener('message', responseHandler);
            this.worker.postMessage({ type: 'prompt', data: { prompt } });
        });
    }
    
    async processWithCloud(prompt, options) {
        // Check with API fallback checker first
        const fallbackCheck = await fetch('/api/fallback-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: this.sessionId,
                prompt: prompt,
                lastCall: this.lastCloudCall
            })
        });
        
        const checkResult = await fallbackCheck.json();
        
        if (!checkResult.allowed) {
            console.log('Cloud API not allowed:', checkResult.reason);
            return await this.processLocally(prompt);
        }
        
        // Make cloud API call
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    prompt: prompt,
                    agentId: this.agent.id,
                    context: await this.getRecentMemories()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.metrics.cloudCalls++;
                this.lastCloudCall = Date.now();
                
                // Store in memory
                await this.addMemory(prompt, 'user_prompt');
                await this.addMemory(result.response, 'cloud_response');
                
                return {
                    response: result.response,
                    local: false,
                    cost: result.cost,
                    tokens: result.tokens
                };
            } else {
                // Fallback to local
                return await this.processLocally(prompt);
            }
        } catch (error) {
            console.error('Cloud API error:', error);
            this.metrics.errors++;
            return await this.processLocally(prompt);
        }
    }
    
    async checkCloudPermission() {
        // Check session configuration
        const sessionConfig = await this.getSessionConfig();
        return sessionConfig?.allowCloud || false;
    }
    
    async getSessionConfig() {
        try {
            const stored = localStorage.getItem(`session_${this.sessionId}`);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }
    
    async addMemory(content, type) {
        if (!this.worker) return;
        
        // Add to worker memory
        this.worker.postMessage({
            type: 'add_memory',
            data: { content, type }
        });
        
        // Store locally
        const memory = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: type,
            content: content
        };
        
        this.memories.push(memory);
        
        // Persist to IndexedDB
        await this.persistMemory(memory);
        
        // Update metrics
        this.updateMemoryUsage();
    }
    
    async persistMemory(memory) {
        try {
            const db = await this.getDatabase();
            const tx = db.transaction(['memories'], 'readwrite');
            const store = tx.objectStore('memories');
            await store.add(memory);
        } catch (error) {
            console.error('Failed to persist memory:', error);
        }
    }
    
    async getRecentMemories(limit = 10) {
        try {
            const db = await this.getDatabase();
            const tx = db.transaction(['memories'], 'readonly');
            const store = tx.objectStore('memories');
            const index = store.index('timestamp');
            
            const memories = [];
            const cursor = index.openCursor(null, 'prev');
            
            return new Promise((resolve) => {
                cursor.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && memories.length < limit) {
                        if (cursor.value.sessionId === this.sessionId) {
                            memories.push(cursor.value);
                        }
                        cursor.continue();
                    } else {
                        resolve(memories.reverse());
                    }
                };
            });
        } catch {
            return this.memories.slice(-limit);
        }
    }
    
    async initializeLocalStorage() {
        // Initialize IndexedDB
        this.db = await this.openDatabase();
        
        // Check localStorage availability
        try {
            localStorage.setItem('sandbox_test', '1');
            localStorage.removeItem('sandbox_test');
        } catch {
            console.warn('localStorage not available');
        }
    }
    
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MirrorOSSandbox', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('memories')) {
                    const store = db.createObjectStore('memories', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('sessionId', 'sessionId');
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('type', 'type');
                }
            };
        });
    }
    
    async getDatabase() {
        if (!this.db) {
            this.db = await this.openDatabase();
        }
        return this.db;
    }
    
    handleWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'log':
                console.log('[Worker]', ...data);
                break;
                
            case 'error':
                console.error('[Worker]', ...data);
                this.metrics.errors++;
                break;
                
            case 'memory_added':
                this.memories.push(data);
                this.updateMemoryUsage();
                break;
        }
    }
    
    handleWorkerError(error) {
        console.error('Worker error:', error);
        this.metrics.errors++;
        
        // Attempt recovery
        if (this.metrics.errors > 5) {
            console.error('Too many errors, terminating worker');
            this.terminate();
        }
    }
    
    updateMemoryUsage() {
        // Estimate memory usage
        const jsonSize = JSON.stringify(this.memories).length;
        this.metrics.memoryUsage = jsonSize;
        
        // Check memory limit
        if (jsonSize > this.constraints.maxMemory) {
            // Remove oldest memories
            this.memories = this.memories.slice(-50);
            console.warn('Memory limit reached, pruning old memories');
        }
    }
    
    calculateChecksum(data) {
        // Simple checksum for browser
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    
    async exportMemories() {
        const memories = await this.getRecentMemories(1000);
        const blob = new Blob([JSON.stringify(memories, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memories_${this.sessionId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            costSaved: this.calculateCostSaved()
        };
    }
    
    calculateCostSaved() {
        const avgTokensPerPrompt = 150;
        const costPerToken = 0.000003;
        return this.metrics.localResponses * avgTokensPerPrompt * costPerToken;
    }
    
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        console.log('Sandboxed runtime terminated');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SandboxedRuntime;
}