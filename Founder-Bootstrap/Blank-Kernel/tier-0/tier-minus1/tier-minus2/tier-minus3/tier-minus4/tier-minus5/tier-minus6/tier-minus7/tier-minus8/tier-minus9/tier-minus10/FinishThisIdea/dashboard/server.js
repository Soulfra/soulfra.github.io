#!/usr/bin/env node

/**
 * Dashboard Server for FinishThisIdea
 * Provides real-time monitoring of agents, worktrees, and progress
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PORT = 3333;
const PROJECT_ROOT = path.dirname(__dirname);

// Simple HTTP server
const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Serve dashboard HTML
    if (req.url === '/' || req.url === '/index.html') {
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
    }
    
    // API endpoints
    if (req.url === '/api/status') {
        try {
            const status = await getSystemStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    if (req.url === '/api/agent/start' && req.method === 'POST') {
        try {
            const result = await startNewAgent();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    if (req.url === '/api/tasks/assign' && req.method === 'POST') {
        try {
            const result = await assignTasks();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    if (req.url === '/api/report') {
        try {
            const report = await generateReport();
            res.writeHead(200, { 
                'Content-Type': 'text/plain',
                'Content-Disposition': 'attachment; filename="finishthisidea-report.txt"'
            });
            res.end(report);
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    // 404 for unknown routes
    res.writeHead(404);
    res.end('Not Found');
});

// Get system status
async function getSystemStatus() {
    const status = {
        documentation: await getDocumentationProgress(),
        agents: await getAgentStatus(),
        worktrees: await getWorktreeStatus(),
        tasks: await getTaskQueue(),
        timestamp: new Date().toISOString()
    };
    
    return status;
}

// Get documentation progress
async function getDocumentationProgress() {
    try {
        // Count documentation files
        const { stdout } = await execAsync(`find "${PROJECT_ROOT}/docs" -name "*.md" | wc -l`);
        const completed = parseInt(stdout.trim());
        const total = 80; // Approximate total needed
        const remaining = total - completed;
        const progress = Math.round((completed / total) * 100);
        
        return {
            completed,
            total,
            remaining,
            progress
        };
    } catch (error) {
        return {
            completed: 0,
            total: 80,
            remaining: 80,
            progress: 0
        };
    }
}

// Get agent status
async function getAgentStatus() {
    const agents = [];
    const agentStateDir = path.join(PROJECT_ROOT, '.agent-state');
    
    if (fs.existsSync(agentStateDir)) {
        const files = fs.readdirSync(agentStateDir);
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(agentStateDir, file), 'utf8');
                    const agent = JSON.parse(content);
                    agents.push({
                        id: agent.id,
                        name: agent.id.replace('agent-', '').replace(/-\d+$/, ''),
                        type: agent.type,
                        status: agent.status,
                        currentTask: agent.current_task
                    });
                } catch (e) {
                    // Skip invalid files
                }
            }
        }
    }
    
    // Add some demo agents if none exist
    if (agents.length === 0) {
        agents.push(
            { id: 'demo-1', name: 'Documentation Agent', type: 'docs', status: 'idle' },
            { id: 'demo-2', name: 'Test Agent', type: 'test', status: 'working' }
        );
    }
    
    return agents;
}

// Get worktree status
async function getWorktreeStatus() {
    try {
        const { stdout } = await execAsync(`cd "${PROJECT_ROOT}" && git worktree list`);
        const lines = stdout.trim().split('\n');
        
        return lines.map(line => {
            const parts = line.split(/\s+/);
            const path = parts[0];
            const branch = parts[2] ? parts[2].replace(/[\[\]]/g, '') : 'detached';
            const name = path.includes('main') || path.includes('FinishThisIdea') ? 'Main' : 
                         path.split('/').pop().replace('docs-', '').replace(/-/g, ' ');
            
            return { path, branch, name };
        });
    } catch (error) {
        return [
            { path: PROJECT_ROOT, branch: 'main', name: 'Main' }
        ];
    }
}

// Get task queue
async function getTaskQueue() {
    const tasks = [];
    const lockDir = path.join(PROJECT_ROOT, '.agent-locks');
    const lockedTasks = new Set();
    
    // Get locked tasks
    if (fs.existsSync(lockDir)) {
        const locks = fs.readdirSync(lockDir);
        locks.forEach(lock => lockedTasks.add(lock.replace('.lock', '')));
    }
    
    // Define all pending tasks
    const pendingDocs = [
        // Integration guides
        'github-integration.md',
        'vscode-integration.md',
        'ci-cd-integration.md',
        'docker-integration.md',
        'kubernetes-integration.md',
        'slack-integration.md',
        'jira-integration.md',
        'monitoring-integration.md',
        'database-integration.md',
        // Operations docs
        'monitoring.md',
        'logging.md',
        'backup-recovery.md',
        'scaling.md',
        'security-operations.md',
        'incident-response.md',
        'performance-tuning.md',
        'cost-optimization.md',
        'maintenance.md',
        'disaster-recovery.md',
        // Troubleshooting docs
        'common-errors.md',
        'performance-issues.md',
        'integration-problems.md',
        'deployment-failures.md',
        'api-errors.md',
        'database-issues.md',
        'authentication-problems.md',
        'llm-failures.md',
        'debugging-guide.md'
    ];
    
    pendingDocs.forEach(doc => {
        tasks.push({
            name: doc,
            status: lockedTasks.has(doc) ? 'locked' : 'available'
        });
    });
    
    return tasks;
}

// Start new agent
async function startNewAgent() {
    try {
        const { stdout } = await execAsync(
            `cd "${PROJECT_ROOT}" && ./scripts/agent-coordinator.sh start docs`
        );
        const agentId = stdout.trim().split('\n').pop();
        return { success: true, agentId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Assign tasks to agents
async function assignTasks() {
    try {
        // Get available tasks
        const tasks = await getTaskQueue();
        const availableTasks = tasks.filter(t => t.status === 'available').slice(0, 3);
        
        // Get idle agents
        const agents = await getAgentStatus();
        const idleAgents = agents.filter(a => a.status === 'idle');
        
        let assigned = 0;
        const assignments = Math.min(availableTasks.length, idleAgents.length);
        
        for (let i = 0; i < assignments; i++) {
            const task = availableTasks[i];
            const agent = idleAgents[i];
            
            await execAsync(
                `cd "${PROJECT_ROOT}" && ./scripts/agent-coordinator.sh assign "${task.name}"`
            );
            assigned++;
        }
        
        return { success: true, assigned };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Generate report
async function generateReport() {
    try {
        const { stdout } = await execAsync(
            `cd "${PROJECT_ROOT}" && ./scripts/agent-coordinator.sh report`
        );
        return stdout;
    } catch (error) {
        return `Error generating report: ${error.message}`;
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`🚀 FinishThisIdea Dashboard running at http://localhost:${PORT}`);
    console.log('📊 Monitoring agents and worktrees...');
    console.log('Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down dashboard...');
    server.close(() => {
        process.exit(0);
    });
});