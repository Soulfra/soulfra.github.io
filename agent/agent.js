// AI Screen Watcher Agent

class AIAgent {
    constructor() {
        this.isCapturing = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.workflows = [];
        this.nodes = [
            { id: 'local', name: 'Local Machine', status: 'connected' }
        ];
        
        this.init();
    }
    
    init() {
        console.log('🤖 AI Agent initializing...');
        
        this.setupEventListeners();
        this.connectToNodes();
    }
    
    setupEventListeners() {
        document.getElementById('start-capture').addEventListener('click', () => {
            this.toggleCapture();
        });
        
        document.getElementById('save-workflow').addEventListener('click', () => {
            this.saveWorkflow();
        });
        
        document.getElementById('distribute-workflow').addEventListener('click', () => {
            this.distributeWorkflow();
        });
        
        document.getElementById('replay-workflow').addEventListener('click', () => {
            this.replayWorkflow();
        });
    }
    
    connectToNodes() {
        console.log('🔌 Connecting to nodes...');
        
        // Simulate node discovery
        setTimeout(() => {
            this.addNode({
                id: 'node-1',
                name: 'Development Server',
                status: 'connected'
            });
        }, 2000);
    }
    
    async toggleCapture() {
        if (!this.isCapturing) {
            await this.startCapture();
        } else {
            this.stopCapture();
        }
    }
    
    async startCapture() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { max: 1920 },
                    height: { max: 1080 }
                },
                audio: false
            });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    this.analyzeFrame(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start(1000); // Capture every second
            this.isCapturing = true;
            
            // Update UI
            const btn = document.getElementById('start-capture');
            btn.classList.add('active');
            btn.querySelector('.btn-text').textContent = 'Stop Capture';
            
            const status = document.getElementById('agent-status');
            status.textContent = 'Watching Screen';
            document.querySelector('.status-dot').classList.add('active');
            
            console.log('📹 Screen capture started');
            
            // Monitor for stream end
            stream.getVideoTracks()[0].onended = () => {
                this.stopCapture();
            };
            
        } catch (error) {
            console.error('Failed to start capture:', error);
            alert('Screen capture failed. Please try again.');
        }
    }
    
    stopCapture() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        this.isCapturing = false;
        
        // Update UI
        const btn = document.getElementById('start-capture');
        btn.classList.remove('active');
        btn.querySelector('.btn-text').textContent = 'Start Screen Capture';
        
        const status = document.getElementById('agent-status');
        status.textContent = 'Processing...';
        
        console.log('📹 Screen capture stopped');
    }
    
    analyzeFrame(frameData) {
        // Simulate AI analysis of screen content
        // In production, this would use computer vision and ML
        
        console.log('🔍 Analyzing frame...');
        
        // Simulate workflow detection
        if (Math.random() > 0.8) {
            this.detectWorkflow();
        }
    }
    
    detectWorkflow() {
        const workflows = [
            {
                id: Date.now(),
                name: 'Code Compilation Workflow',
                description: 'Detected npm build command followed by deployment',
                steps: ['npm run build', 'npm run deploy'],
                icon: '⚡'
            },
            {
                id: Date.now() + 1,
                name: 'Git Commit Workflow',
                description: 'Detected git add, commit, and push sequence',
                steps: ['git add .', 'git commit -m "..."', 'git push'],
                icon: '🔀'
            },
            {
                id: Date.now() + 2,
                name: 'File Navigation Pattern',
                description: 'Detected repeated file navigation pattern',
                steps: ['Open file', 'Edit', 'Save', 'Test'],
                icon: '📁'
            }
        ];
        
        const workflow = workflows[Math.floor(Math.random() * workflows.length)];
        
        if (!this.workflows.find(w => w.name === workflow.name)) {
            this.workflows.push(workflow);
            this.updateWorkflowList();
            console.log('✅ Workflow detected:', workflow.name);
        }
    }
    
    processRecording() {
        const status = document.getElementById('agent-status');
        status.textContent = 'Idle';
        document.querySelector('.status-dot').classList.remove('active');
        
        // Create summary
        console.log(`📊 Recording summary:
- Duration: ${this.recordedChunks.length} seconds
- Workflows detected: ${this.workflows.length}
- Ready for distribution`);
        
        // Clear chunks for next session
        this.recordedChunks = [];
    }
    
    updateWorkflowList() {
        const listEl = document.getElementById('workflow-list');
        
        if (this.workflows.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No workflows detected yet. Start screen capture to begin.</p>';
            return;
        }
        
        listEl.innerHTML = this.workflows.map(workflow => `
            <div class="workflow-item" data-id="${workflow.id}">
                <span class="workflow-icon">${workflow.icon}</span>
                <div class="workflow-info">
                    <div class="workflow-name">${workflow.name}</div>
                    <div class="workflow-description">${workflow.description}</div>
                </div>
                <div class="workflow-actions">
                    <button class="workflow-btn" onclick="aiAgent.editWorkflow(${workflow.id})">Edit</button>
                    <button class="workflow-btn" onclick="aiAgent.runWorkflow(${workflow.id})">Run</button>
                </div>
            </div>
        `).join('');
    }
    
    addNode(node) {
        this.nodes.push(node);
        this.updateNodeList();
        console.log('✅ Node connected:', node.name);
    }
    
    updateNodeList() {
        const listEl = document.getElementById('node-list');
        
        listEl.innerHTML = this.nodes.map(node => `
            <div class="node-item">
                <span class="node-icon">💻</span>
                <span class="node-name">${node.name}</span>
                <span class="node-status">${node.status}</span>
            </div>
        `).join('');
    }
    
    saveWorkflow() {
        if (this.workflows.length === 0) {
            alert('No workflows to save. Capture some screen activity first.');
            return;
        }
        
        const data = JSON.stringify(this.workflows, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `workflows_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('💾 Workflows saved');
    }
    
    distributeWorkflow() {
        if (this.workflows.length === 0) {
            alert('No workflows to distribute.');
            return;
        }
        
        console.log('🔄 Distributing workflows to nodes...');
        
        this.nodes.forEach(node => {
            if (node.status === 'connected') {
                console.log(`📤 Sending to ${node.name}...`);
                
                // Simulate distribution
                setTimeout(() => {
                    console.log(`✅ Distributed to ${node.name}`);
                }, 1000);
            }
        });
        
        alert(`Workflows distributed to ${this.nodes.filter(n => n.status === 'connected').length} nodes`);
    }
    
    replayWorkflow() {
        if (this.workflows.length === 0) {
            alert('No workflows to replay.');
            return;
        }
        
        const workflow = this.workflows[0]; // Use first workflow for demo
        
        console.log('▶️ Replaying workflow:', workflow.name);
        
        workflow.steps.forEach((step, index) => {
            setTimeout(() => {
                console.log(`Step ${index + 1}: ${step}`);
            }, index * 1000);
        });
        
        alert(`Replaying: ${workflow.name}\n\nSteps:\n${workflow.steps.join('\n')}`);
    }
    
    editWorkflow(id) {
        const workflow = this.workflows.find(w => w.id === id);
        if (workflow) {
            console.log('✏️ Editing workflow:', workflow.name);
            alert(`Editing: ${workflow.name}\n\nThis would open a workflow editor.`);
        }
    }
    
    runWorkflow(id) {
        const workflow = this.workflows.find(w => w.id === id);
        if (workflow) {
            console.log('▶️ Running workflow:', workflow.name);
            this.replayWorkflow();
        }
    }
}

// Initialize AI Agent
const aiAgent = new AIAgent();

// Add futuristic console message
console.log(`
🤖 AI Screen Watcher Agent Active
================================
Capabilities:
• Screen capture and analysis
• Workflow detection and learning
• Distributed automation
• Node synchronization

Ready to learn from your actions!
`);