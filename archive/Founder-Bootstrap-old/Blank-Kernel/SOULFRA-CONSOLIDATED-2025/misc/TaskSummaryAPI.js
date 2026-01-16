#!/usr/bin/env node
/**
 * Task Summary API
 * Provides HTTP endpoints for task status and results
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class TaskSummaryAPI {
    constructor(port = 7778) {
        this.port = port;
        this.tasksDir = './tasks';
        this.queueDir = path.join(this.tasksDir, 'queue');
        this.workingDir = path.join(this.tasksDir, 'working');
        this.resolvedDir = path.join(this.tasksDir, 'resolved');
        this.ledgerPath = './ledger/task_record.json';
    }
    
    start() {
        const server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            if (req.method === 'GET' && pathname.startsWith('/api/tasks/')) {
                this.handleTaskStatus(req, res, pathname);
            } else if (req.method === 'POST' && pathname === '/api/tasks') {
                this.handleTaskSubmit(req, res);
            } else if (req.method === 'GET' && pathname === '/api/tasks') {
                this.handleTaskList(req, res);
            } else if (req.method === 'GET' && pathname === '/api/status') {
                this.handleSystemStatus(req, res);
            } else if (req.method === 'GET' && pathname === '/') {
                this.handleDashboard(req, res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`TaskSummaryAPI running on port ${this.port}`);
            console.log(`Dashboard: http://localhost:${this.port}/`);
        });
    }
    
    handleTaskStatus(req, res, pathname) {
        const taskId = pathname.split('/').pop();
        
        // Check in order: resolved, working, queue
        const locations = [
            { dir: this.resolvedDir, status: 'resolved' },
            { dir: this.workingDir, status: 'working' },
            { dir: this.queueDir, status: 'queued' }
        ];
        
        for (const loc of locations) {
            const files = fs.readdirSync(loc.dir)
                .filter(f => f.endsWith('.json'));
                
            for (const file of files) {
                const taskData = JSON.parse(
                    fs.readFileSync(path.join(loc.dir, file), 'utf8')
                );
                
                if (taskData.task_id === taskId) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        ...taskData,
                        current_status: loc.status,
                        location: loc.dir
                    }));
                    return;
                }
            }
        }
        
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task not found', task_id: taskId }));
    }
    
    handleTaskSubmit(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const task = JSON.parse(body);
                
                // Generate task ID if not provided
                if (!task.task_id) {
                    task.task_id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                
                // Add metadata
                task.submitted_at = new Date().toISOString();
                task.status = 'queued';
                
                // Save to queue
                const filename = `${task.task_id}.json`;
                fs.writeFileSync(
                    path.join(this.queueDir, filename),
                    JSON.stringify(task, null, 2)
                );
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    task_id: task.task_id,
                    message: "Task queued for processing",
                    poll_url: `/api/tasks/${task.task_id}`
                }));
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    handleTaskList(req, res) {
        const tasks = [];
        
        // Collect from all directories
        const locations = [
            { dir: this.resolvedDir, status: 'resolved' },
            { dir: this.workingDir, status: 'working' },
            { dir: this.queueDir, status: 'queued' }
        ];
        
        locations.forEach(loc => {
            const files = fs.readdirSync(loc.dir)
                .filter(f => f.endsWith('.json'));
                
            files.forEach(file => {
                const taskData = JSON.parse(
                    fs.readFileSync(path.join(loc.dir, file), 'utf8')
                );
                tasks.push({
                    task_id: taskData.task_id,
                    type: taskData.type,
                    status: loc.status,
                    submitted_at: taskData.submitted_at,
                    requested_by: taskData.requested_by
                });
            });
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tasks));
    }
    
    handleSystemStatus(req, res) {
        const ledger = fs.existsSync(this.ledgerPath) ? 
            JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8')) : 
            { stats: { total: 0, completed: 0, failed: 0 } };
            
        const status = {
            queued: fs.readdirSync(this.queueDir).filter(f => f.endsWith('.json')).length,
            working: fs.readdirSync(this.workingDir).filter(f => f.endsWith('.json')).length,
            resolved: fs.readdirSync(this.resolvedDir).filter(f => f.endsWith('.json')).length,
            stats: ledger.stats,
            daemon_running: this.checkDaemonStatus()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    handleDashboard(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Task Processing Dashboard</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .status-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .status-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-card h3 { margin: 0 0 10px 0; color: #333; }
        .status-number { font-size: 36px; font-weight: bold; color: #0066cc; }
        .task-list { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .task-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .task-item:last-child { border-bottom: none; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .queued { background: #ffd700; }
        .working { background: #87ceeb; }
        .resolved { background: #90ee90; }
        .submit-form { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
        button { background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0052a3; }
        textarea { width: 100%; min-height: 100px; margin: 10px 0; }
        .auto-refresh { float: right; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Task Processing Dashboard <span class="auto-refresh">Auto-refreshes every 5s</span></h1>
        
        <div class="status-grid" id="statusGrid">
            <div class="status-card">
                <h3>Queued</h3>
                <div class="status-number" id="queued">-</div>
            </div>
            <div class="status-card">
                <h3>Working</h3>
                <div class="status-number" id="working">-</div>
            </div>
            <div class="status-card">
                <h3>Resolved</h3>
                <div class="status-number" id="resolved">-</div>
            </div>
            <div class="status-card">
                <h3>Total Processed</h3>
                <div class="status-number" id="total">-</div>
            </div>
        </div>
        
        <div class="submit-form">
            <h2>Submit New Task</h2>
            <select id="taskType">
                <option value="loop_prototype_simulation">Loop Prototype Simulation</option>
                <option value="agent_build">Agent Build</option>
                <option value="reflection_process">Reflection Process</option>
                <option value="tone_analysis">Tone Analysis</option>
            </select>
            <textarea id="taskInputs" placeholder='{"agent_name": "TestAgent", "capabilities": ["reflect", "analyze"]}'></textarea>
            <button onclick="submitTask()">Submit Task</button>
            <div id="submitResult"></div>
        </div>
        
        <div class="task-list">
            <h2>Recent Tasks</h2>
            <div id="taskList">Loading...</div>
        </div>
    </div>
    
    <script>
        async function updateStatus() {
            const res = await fetch('/api/status');
            const status = await res.json();
            
            document.getElementById('queued').textContent = status.queued;
            document.getElementById('working').textContent = status.working;
            document.getElementById('resolved').textContent = status.resolved;
            document.getElementById('total').textContent = status.stats.total;
        }
        
        async function updateTaskList() {
            const res = await fetch('/api/tasks');
            const tasks = await res.json();
            
            const taskListHtml = tasks.slice(-10).reverse().map(task => \`
                <div class="task-item">
                    <div>
                        <strong>\${task.task_id}</strong><br>
                        <small>\${task.type} - by \${task.requested_by || 'anonymous'}</small>
                    </div>
                    <div>
                        <span class="status-badge \${task.status}">\${task.status}</span>
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('taskList').innerHTML = taskListHtml || 'No tasks yet';
        }
        
        async function submitTask() {
            const type = document.getElementById('taskType').value;
            let inputs;
            
            try {
                inputs = JSON.parse(document.getElementById('taskInputs').value || '{}');
            } catch (e) {
                inputs = { raw: document.getElementById('taskInputs').value };
            }
            
            const task = {
                type: type,
                requested_by: 'Dashboard',
                inputs: inputs,
                estimated_runtime: '30s'
            };
            
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            
            const result = await res.json();
            document.getElementById('submitResult').innerHTML = 
                \`<p style="color: green;">✓ Task submitted: \${result.task_id}</p>\`;
            document.getElementById('taskInputs').value = '';
            
            // Refresh lists
            updateStatus();
            updateTaskList();
        }
        
        // Initial load
        updateStatus();
        updateTaskList();
        
        // Auto refresh
        setInterval(() => {
            updateStatus();
            updateTaskList();
        }, 5000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    checkDaemonStatus() {
        // Simple check - could be enhanced
        try {
            const working = fs.readdirSync(this.workingDir)
                .filter(f => f.endsWith('.json'));
            return working.length > 0 || fs.existsSync('.daemon.pid');
        } catch {
            return false;
        }
    }
}

// Run the API
if (require.main === module) {
    const api = new TaskSummaryAPI();
    api.start();
}

module.exports = TaskSummaryAPI;