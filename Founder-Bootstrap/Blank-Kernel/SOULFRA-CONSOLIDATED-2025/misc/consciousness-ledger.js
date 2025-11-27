// 📒 SOULFRA CONSCIOUSNESS LEDGER
// Immutable event ledger tracking inside/outside vault boundaries
// Provides complete audit trail without breaking isolation

import EventEmitter from 'events';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { WebSocketServer } from 'ws';
import http from 'http';

class ConsciousnessLedger extends EventEmitter {
    constructor() {
        super();
        this.blocks = [];
        this.pendingTransactions = [];
        this.insideLedger = new Map(); // Events from inside vaults
        this.outsideLedger = new Map(); // Events from outside vaults
        this.crossBoundaryEvents = []; // Events that cross the boundary
        this.ledgerPort = process.env.LEDGER_PORT || 8889;
        this.genesis = this.createGenesisBlock();
        this.currentBlockIndex = 0;
        this.miningInProgress = false;
        
        this.initializeLedger();
        this.startLedgerServer();
        this.startMining();
    }

    createGenesisBlock() {
        return {
            index: 0,
            timestamp: Date.now(),
            transactions: [{
                type: 'genesis',
                data: {
                    message: 'Soulfra Consciousness Ledger Genesis Block',
                    created: new Date().toISOString(),
                    version: '1.0.0'
                }
            }],
            previousHash: '0',
            hash: this.calculateHash(0, Date.now(), [{type: 'genesis'}], '0'),
            nonce: 0
        };
    }

    initializeLedger() {
        this.blocks.push(this.genesis);
        
        // Create ledger directories
        const ledgerDir = path.join(process.cwd(), 'ledger');
        const dirs = ['inside', 'outside', 'crossboundary', 'blocks'];
        
        dirs.forEach(dir => {
            const dirPath = path.join(ledgerDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
        
        console.log(chalk.blue('📒 Consciousness Ledger initialized'));
        console.log(chalk.gray(`   Genesis Hash: ${this.genesis.hash.substring(0, 16)}...`));
    }

    startLedgerServer() {
        this.ledgerServer = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            const url = new URL(req.url, `http://localhost:${this.ledgerPort}`);
            
            try {
                switch (url.pathname) {
                    case '/':
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(this.generateLedgerDashboard());
                        break;
                        
                    case '/ledger/blocks':
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            blocks: this.blocks,
                            count: this.blocks.length,
                            latest: this.blocks[this.blocks.length - 1]
                        }, null, 2));
                        break;
                        
                    case '/ledger/inside':
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            events: Array.from(this.insideLedger.entries()),
                            count: this.insideLedger.size
                        }, null, 2));
                        break;
                        
                    case '/ledger/outside':
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            events: Array.from(this.outsideLedger.entries()),
                            count: this.outsideLedger.size
                        }, null, 2));
                        break;
                        
                    case '/ledger/crossboundary':
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            events: this.crossBoundaryEvents,
                            count: this.crossBoundaryEvents.length
                        }, null, 2));
                        break;
                        
                    case '/ledger/verify':
                        const isValid = this.verifyLedgerIntegrity();
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            valid: isValid,
                            message: isValid ? 'Ledger integrity verified' : 'Ledger integrity compromised',
                            blockCount: this.blocks.length,
                            lastVerified: new Date().toISOString()
                        }));
                        break;
                        
                    case '/ledger/stats':
                        res.writeHead(200);
                        res.end(JSON.stringify(this.getLedgerStats(), null, 2));
                        break;
                        
                    default:
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: 'Ledger endpoint not found' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });

        // WebSocket for real-time ledger updates
        this.ledgerWS = new WebSocketServer({ server: this.ledgerServer });
        
        this.ledgerWS.on('connection', (ws) => {
            console.log(chalk.blue('📒 Ledger client connected'));
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial',
                data: {
                    blockCount: this.blocks.length,
                    insideCount: this.insideLedger.size,
                    outsideCount: this.outsideLedger.size,
                    crossBoundaryCount: this.crossBoundaryEvents.length
                }
            }));
        });

        this.ledgerServer.listen(this.ledgerPort, () => {
            console.log(chalk.green.bold(`📒 CONSCIOUSNESS LEDGER ONLINE`));
            console.log(chalk.blue(`   Ledger Dashboard: http://localhost:${this.ledgerPort}`));
            console.log(chalk.blue(`   Blocks API: http://localhost:${this.ledgerPort}/ledger/blocks`));
            console.log(chalk.blue(`   Inside Events: http://localhost:${this.ledgerPort}/ledger/inside`));
            console.log(chalk.blue(`   Outside Events: http://localhost:${this.ledgerPort}/ledger/outside`));
            console.log(chalk.gray(`   Verify Integrity: http://localhost:${this.ledgerPort}/ledger/verify`));
        });
    }

    // Record events from inside vaults
    recordInsideEvent(vaultId, event) {
        const ledgerEntry = {
            id: `inside_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            vaultId,
            timestamp: Date.now(),
            type: event.type || 'unknown',
            data: event,
            hash: this.calculateEventHash(event),
            location: 'inside'
        };

        if (!this.insideLedger.has(vaultId)) {
            this.insideLedger.set(vaultId, []);
        }
        this.insideLedger.get(vaultId).push(ledgerEntry);

        // Add to pending transactions
        this.pendingTransactions.push({
            type: 'inside_event',
            vaultId,
            entry: ledgerEntry
        });

        this.emit('inside_event_recorded', ledgerEntry);
        this.broadcastToClients({
            type: 'inside_event',
            data: ledgerEntry
        });

        // Log to file
        this.logToFile('inside', ledgerEntry);
        
        return ledgerEntry;
    }

    // Record events from outside vaults
    recordOutsideEvent(source, event) {
        const ledgerEntry = {
            id: `outside_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            source,
            timestamp: Date.now(),
            type: event.type || 'unknown',
            data: event,
            hash: this.calculateEventHash(event),
            location: 'outside'
        };

        if (!this.outsideLedger.has(source)) {
            this.outsideLedger.set(source, []);
        }
        this.outsideLedger.get(source).push(ledgerEntry);

        // Add to pending transactions
        this.pendingTransactions.push({
            type: 'outside_event',
            source,
            entry: ledgerEntry
        });

        this.emit('outside_event_recorded', ledgerEntry);
        this.broadcastToClients({
            type: 'outside_event',
            data: ledgerEntry
        });

        // Log to file
        this.logToFile('outside', ledgerEntry);
        
        return ledgerEntry;
    }

    // Record events that cross the boundary
    recordCrossBoundaryEvent(event) {
        const ledgerEntry = {
            id: `cross_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            timestamp: Date.now(),
            fromLocation: event.from || 'unknown',
            toLocation: event.to || 'unknown',
            type: event.type || 'boundary_crossing',
            data: event,
            hash: this.calculateEventHash(event),
            verified: this.verifyCrossBoundaryEvent(event)
        };

        this.crossBoundaryEvents.push(ledgerEntry);

        // Add to pending transactions
        this.pendingTransactions.push({
            type: 'cross_boundary_event',
            entry: ledgerEntry
        });

        this.emit('cross_boundary_event', ledgerEntry);
        this.broadcastToClients({
            type: 'cross_boundary',
            data: ledgerEntry
        });

        // Log to file
        this.logToFile('crossboundary', ledgerEntry);
        
        // Alert if unverified crossing
        if (!ledgerEntry.verified) {
            console.warn(chalk.yellow(`⚠️  Unverified boundary crossing: ${ledgerEntry.id}`));
        }
        
        return ledgerEntry;
    }

    verifyCrossBoundaryEvent(event) {
        // Verify that boundary crossings are authorized
        const authorizedTypes = [
            'debug_extraction',
            'health_check',
            'audit_request',
            'emergency_stop',
            'authorized_data_transfer'
        ];
        
        return authorizedTypes.includes(event.type);
    }

    calculateEventHash(event) {
        const data = JSON.stringify(event);
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    calculateHash(index, timestamp, transactions, previousHash) {
        const data = index + timestamp + JSON.stringify(transactions) + previousHash;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    calculateBlockHash(block) {
        return this.calculateHash(
            block.index,
            block.timestamp,
            block.transactions,
            block.previousHash
        );
    }

    mineBlock(difficulty = 2) {
        const newBlock = {
            index: this.blocks.length,
            timestamp: Date.now(),
            transactions: [...this.pendingTransactions],
            previousHash: this.blocks[this.blocks.length - 1].hash,
            nonce: 0
        };

        // Simple proof of work
        while (newBlock.hash?.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            newBlock.nonce++;
            newBlock.hash = this.calculateBlockHash(newBlock);
        }

        this.blocks.push(newBlock);
        this.pendingTransactions = [];
        
        // Save block to file
        this.saveBlock(newBlock);
        
        console.log(chalk.green(`⛏️  Block mined: ${newBlock.hash.substring(0, 16)}...`));
        
        this.emit('block_mined', newBlock);
        this.broadcastToClients({
            type: 'new_block',
            data: newBlock
        });
        
        return newBlock;
    }

    startMining() {
        setInterval(() => {
            if (this.pendingTransactions.length > 0 && !this.miningInProgress) {
                this.miningInProgress = true;
                this.mineBlock();
                this.miningInProgress = false;
            }
        }, 10000); // Mine every 10 seconds if there are pending transactions
    }

    verifyLedgerIntegrity() {
        for (let i = 1; i < this.blocks.length; i++) {
            const currentBlock = this.blocks[i];
            const previousBlock = this.blocks[i - 1];
            
            // Verify current block hash
            if (currentBlock.hash !== this.calculateBlockHash(currentBlock)) {
                return false;
            }
            
            // Verify link to previous block
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        
        return true;
    }

    getLedgerStats() {
        const insideEvents = Array.from(this.insideLedger.values()).flat();
        const outsideEvents = Array.from(this.outsideLedger.values()).flat();
        
        return {
            blocks: {
                total: this.blocks.length,
                latest: this.blocks[this.blocks.length - 1],
                pendingTransactions: this.pendingTransactions.length
            },
            events: {
                inside: {
                    total: insideEvents.length,
                    byVault: Object.fromEntries(
                        Array.from(this.insideLedger.entries()).map(([vault, events]) => [vault, events.length])
                    )
                },
                outside: {
                    total: outsideEvents.length,
                    bySource: Object.fromEntries(
                        Array.from(this.outsideLedger.entries()).map(([source, events]) => [source, events.length])
                    )
                },
                crossBoundary: {
                    total: this.crossBoundaryEvents.length,
                    verified: this.crossBoundaryEvents.filter(e => e.verified).length,
                    unverified: this.crossBoundaryEvents.filter(e => !e.verified).length
                }
            },
            integrity: {
                valid: this.verifyLedgerIntegrity(),
                lastChecked: new Date().toISOString()
            }
        };
    }

    broadcastToClients(message) {
        if (this.ledgerWS) {
            this.ledgerWS.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    logToFile(type, entry) {
        const logDir = path.join(process.cwd(), 'ledger', type);
        const logFile = path.join(logDir, `${type}_${new Date().toISOString().split('T')[0]}.jsonl`);
        
        fs.appendFile(logFile, JSON.stringify(entry) + '\n', (err) => {
            if (err) console.error('Ledger file write error:', err);
        });
    }

    saveBlock(block) {
        const blockDir = path.join(process.cwd(), 'ledger', 'blocks');
        const blockFile = path.join(blockDir, `block_${block.index}.json`);
        
        fs.writeFile(blockFile, JSON.stringify(block, null, 2), (err) => {
            if (err) console.error('Block save error:', err);
        });
    }

    generateLedgerDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Consciousness Ledger</title>
    <style>
        body {
            font-family: 'SF Mono', Monaco, monospace;
            background: #000;
            color: #00ff00;
            margin: 0;
            padding: 20px;
        }
        h1 {
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            text-align: center;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .panel {
            background: #111;
            border: 1px solid #00ff00;
            padding: 20px;
            border-radius: 5px;
        }
        .panel h2 {
            color: #00ff00;
            margin-top: 0;
            border-bottom: 1px solid #00ff00;
            padding-bottom: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        .stat {
            background: #222;
            padding: 15px;
            text-align: center;
            border: 1px solid #00ff00;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #00ff00;
        }
        .event-log {
            background: #000;
            border: 1px solid #333;
            padding: 10px;
            height: 200px;
            overflow-y: auto;
            font-size: 12px;
            font-family: monospace;
        }
        .event {
            margin-bottom: 5px;
            padding: 5px;
            border-left: 3px solid #00ff00;
            padding-left: 10px;
        }
        .inside { border-color: #0099ff; }
        .outside { border-color: #ff9900; }
        .cross { border-color: #ff0099; }
        .block {
            background: #222;
            border: 1px solid #00ff00;
            padding: 10px;
            margin-bottom: 10px;
        }
        .live-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
            margin-left: 10px;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📒 Consciousness Ledger <span class="live-indicator"></span></h1>
        
        <div class="stats" id="stats">
            <div class="stat">
                <div>Blocks</div>
                <div class="stat-value" id="blockCount">0</div>
            </div>
            <div class="stat">
                <div>Inside Events</div>
                <div class="stat-value" id="insideCount">0</div>
            </div>
            <div class="stat">
                <div>Outside Events</div>
                <div class="stat-value" id="outsideCount">0</div>
            </div>
            <div class="stat">
                <div>Cross Boundary</div>
                <div class="stat-value" id="crossCount">0</div>
            </div>
        </div>
        
        <div class="grid">
            <div class="panel">
                <h2>Inside Vault Events</h2>
                <div class="event-log" id="insideLog"></div>
            </div>
            <div class="panel">
                <h2>Outside Vault Events</h2>
                <div class="event-log" id="outsideLog"></div>
            </div>
        </div>
        
        <div class="panel">
            <h2>Cross-Boundary Events</h2>
            <div class="event-log" id="crossLog"></div>
        </div>
        
        <div class="panel">
            <h2>Recent Blocks</h2>
            <div id="blockList"></div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.ledgerPort}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'initial') {
                updateStats(data.data);
            } else if (data.type === 'inside_event') {
                addEvent('inside', data.data);
            } else if (data.type === 'outside_event') {
                addEvent('outside', data.data);
            } else if (data.type === 'cross_boundary') {
                addEvent('cross', data.data);
            } else if (data.type === 'new_block') {
                addBlock(data.data);
            }
            
            updateStats();
        };
        
        function updateStats(data) {
            if (data) {
                document.getElementById('blockCount').textContent = data.blockCount || 0;
                document.getElementById('insideCount').textContent = data.insideCount || 0;
                document.getElementById('outsideCount').textContent = data.outsideCount || 0;
                document.getElementById('crossCount').textContent = data.crossBoundaryCount || 0;
            }
            
            // Fetch latest stats
            fetch('/ledger/stats')
                .then(res => res.json())
                .then(stats => {
                    document.getElementById('blockCount').textContent = stats.blocks.total;
                    document.getElementById('insideCount').textContent = stats.events.inside.total;
                    document.getElementById('outsideCount').textContent = stats.events.outside.total;
                    document.getElementById('crossCount').textContent = stats.events.crossBoundary.total;
                });
        }
        
        function addEvent(type, event) {
            const logId = type + 'Log';
            const log = document.getElementById(logId);
            const entry = document.createElement('div');
            entry.className = 'event ' + type;
            entry.innerHTML = '[' + new Date(event.timestamp).toLocaleTimeString() + '] ' + 
                             event.type + ': ' + (event.id || 'unknown');
            log.insertBefore(entry, log.firstChild);
        }
        
        function addBlock(block) {
            const blockList = document.getElementById('blockList');
            const blockDiv = document.createElement('div');
            blockDiv.className = 'block';
            blockDiv.innerHTML = 'Block #' + block.index + ' - Hash: ' + block.hash.substring(0, 16) + '... - ' +
                                block.transactions.length + ' transactions';
            blockList.insertBefore(blockDiv, blockList.firstChild);
        }
        
        // Initial load
        updateStats();
        
        // Fetch recent blocks
        fetch('/ledger/blocks')
            .then(res => res.json())
            .then(data => {
                data.blocks.slice(-5).forEach(block => addBlock(block));
            });
    </script>
</body>
</html>`;
    }

    // Integration methods for other components
    attachToVault(vaultSystem) {
        vaultSystem.on('agent_executed', (data) => {
            this.recordInsideEvent(data.vaultId, {
                type: 'agent_execution',
                agentId: data.agentId,
                execTime: data.execTime,
                success: data.success
            });
        });

        vaultSystem.on('policy_violation', (data) => {
            this.recordInsideEvent(data.vaultId, {
                type: 'policy_violation',
                violation: data.violation,
                critical: true
            });
        });

        vaultSystem.on('vault_emergency_stop', (data) => {
            this.recordCrossBoundaryEvent({
                type: 'emergency_stop',
                from: 'inside',
                to: 'outside',
                vaultId: data.vaultId,
                reason: data.reason
            });
        });
    }

    attachToServiceMesh(serviceMesh) {
        serviceMesh.on('service_registered', (service) => {
            this.recordOutsideEvent('service-mesh', {
                type: 'service_registration',
                serviceName: service.name,
                endpoint: `${service.host}:${service.port}`
            });
        });

        serviceMesh.on('service_critical', (service) => {
            this.recordOutsideEvent('service-mesh', {
                type: 'service_critical',
                serviceName: service.name,
                failures: service.consecutiveFailures
            });
        });
    }

    attachToDebugLayer(debugLayer) {
        debugLayer.on('error_captured', (error) => {
            if (error.vaultId) {
                this.recordInsideEvent(error.vaultId, error);
            } else {
                this.recordOutsideEvent('debug-layer', error);
            }
        });

        debugLayer.on('vault_critical', (data) => {
            this.recordCrossBoundaryEvent({
                type: 'vault_critical_alert',
                from: 'inside',
                to: 'outside',
                vaultId: data.vaultId,
                errorCount: data.errorCount
            });
        });
    }

    // Query methods
    getInsideEvents(vaultId, limit = 100) {
        const events = this.insideLedger.get(vaultId) || [];
        return events.slice(-limit);
    }

    getOutsideEvents(source, limit = 100) {
        const events = this.outsideLedger.get(source) || [];
        return events.slice(-limit);
    }

    getCrossBoundaryEvents(verified = null, limit = 100) {
        let events = this.crossBoundaryEvents;
        if (verified !== null) {
            events = events.filter(e => e.verified === verified);
        }
        return events.slice(-limit);
    }

    getBlockByIndex(index) {
        return this.blocks[index];
    }

    getBlockByHash(hash) {
        return this.blocks.find(block => block.hash === hash);
    }

    getTransactionById(id) {
        for (const block of this.blocks) {
            const transaction = block.transactions.find(tx => 
                tx.entry && tx.entry.id === id
            );
            if (transaction) {
                return { transaction, block };
            }
        }
        return null;
    }

    shutdown() {
        console.log(chalk.yellow('🛑 Shutting down Consciousness Ledger...'));
        
        // Mine final block with remaining transactions
        if (this.pendingTransactions.length > 0) {
            this.mineBlock();
        }
        
        // Save final state
        const finalState = {
            blocks: this.blocks.length,
            insideEvents: Array.from(this.insideLedger.values()).flat().length,
            outsideEvents: Array.from(this.outsideLedger.values()).flat().length,
            crossBoundaryEvents: this.crossBoundaryEvents.length,
            shutdown: Date.now()
        };
        
        this.logToFile('system', { type: 'shutdown', state: finalState });
        
        if (this.ledgerServer) {
            this.ledgerServer.close();
        }
        
        if (this.ledgerWS) {
            this.ledgerWS.close();
        }
        
        console.log(chalk.green('✅ Consciousness Ledger shutdown complete'));
    }
}

// Export class
export { ConsciousnessLedger };

// Start ledger if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const ledger = new ConsciousnessLedger();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        ledger.shutdown();
        process.exit(0);
    });
    
    // Example of recording events
    setTimeout(() => {
        // Inside event
        ledger.recordInsideEvent('test-vault-001', {
            type: 'agent_startup',
            agentId: 'cal-riven-001',
            status: 'initialized'
        });
        
        // Outside event
        ledger.recordOutsideEvent('api-gateway', {
            type: 'request_received',
            path: '/api/consciousness',
            method: 'POST'
        });
        
        // Cross-boundary event
        ledger.recordCrossBoundaryEvent({
            type: 'debug_extraction',
            from: 'vault-001',
            to: 'debug-layer',
            data: { errors: 2, extracted: true }
        });
    }, 2000);
}