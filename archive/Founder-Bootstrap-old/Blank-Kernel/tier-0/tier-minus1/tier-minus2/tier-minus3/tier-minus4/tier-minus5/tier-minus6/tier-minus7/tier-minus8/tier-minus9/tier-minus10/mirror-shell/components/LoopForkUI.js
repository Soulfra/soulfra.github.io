// -*- coding: utf-8 -*-
// LoopForkUI Component - Fork interface with QR export
const LoopForkUI = {
    currentLoop: null,
    
    showForkDialog(loopId) {
        this.currentLoop = loopId;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'fork-modal';
        modal.className = 'fork-modal';
        modal.innerHTML = `
            <div class="fork-modal-content">
                <button class="modal-close" onclick="LoopForkUI.closeForkDialog()">×</button>
                
                <h2>Fork Loop ${loopId}</h2>
                
                <div class="fork-form">
                    <div class="form-group">
                        <label>Fork Name</label>
                        <input 
                            type="text" 
                            id="fork-name" 
                            placeholder="My Amazing Fork"
                            class="form-input"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label>Modifications</label>
                        <textarea 
                            id="fork-mods" 
                            placeholder="Describe your intended modifications..."
                            class="form-textarea"
                            rows="4"
                        ></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Fork Type</label>
                        <div class="fork-types">
                            <label class="fork-type">
                                <input type="radio" name="fork-type" value="experimental" checked>
                                <span>Experimental</span>
                                <small>Private testing before release</small>
                            </label>
                            <label class="fork-type">
                                <input type="radio" name="fork-type" value="public">
                                <span>Public</span>
                                <small>Immediately visible to all</small>
                            </label>
                            <label class="fork-type">
                                <input type="radio" name="fork-type" value="collaborative">
                                <span>Collaborative</span>
                                <small>Open for community contributions</small>
                            </label>
                        </div>
                    </div>
                    
                    <div class="fork-actions">
                        <button class="btn-primary" onclick="LoopForkUI.createFork()">
                            Create Fork
                        </button>
                        <button class="btn-secondary" onclick="LoopForkUI.closeForkDialog()">
                            Cancel
                        </button>
                    </div>
                </div>
                
                <div id="fork-result" style="display: none;">
                    <!-- Fork result will appear here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    closeForkDialog() {
        const modal = document.getElementById('fork-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    async createFork() {
        const name = document.getElementById('fork-name').value.trim();
        const modifications = document.getElementById('fork-mods').value.trim();
        const type = document.querySelector('input[name="fork-type"]:checked').value;
        
        if (!name) {
            App.showNotification('Please enter a fork name');
            return;
        }
        
        const forkData = {
            parent_loop_id: this.currentLoop,
            fork_name: name,
            modifications: modifications,
            fork_type: type,
            timestamp: new Date().toISOString()
        };
        
        try {
            const response = await fetch(`${App.apiBase}/api/loop/fork`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(forkData)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showForkResult(result);
            } else {
                throw new Error('Fork creation failed');
            }
        } catch (error) {
            // Demo fork
            this.showDemoForkResult(forkData);
        }
    },
    
    showForkResult(result) {
        const resultEl = document.getElementById('fork-result');
        resultEl.innerHTML = `
            <div class="fork-success">
                <h3>✨ Fork Created Successfully!</h3>
                <p>Fork ID: ${result.fork_id}</p>
                
                <div class="qr-export">
                    <div id="fork-qr" class="qr-container"></div>
                    <p>Scan to access your fork</p>
                </div>
                
                <div class="fork-result-actions">
                    <a href="#/drop/${result.fork_id}" class="btn-primary">View Fork</a>
                    <button class="btn-secondary" onclick="LoopForkUI.exportFork('${result.fork_id}')">
                        Export Seed
                    </button>
                </div>
            </div>
        `;
        
        // Hide form
        document.querySelector('.fork-form').style.display = 'none';
        resultEl.style.display = 'block';
        
        // Generate QR
        this.generateForkQR(result.fork_id);
    },
    
    showDemoForkResult(forkData) {
        const forkId = `fork_${Date.now()}_demo`;
        this.showForkResult({ fork_id: forkId });
    },
    
    generateForkQR(forkId) {
        // Simulate QR generation
        const qrContainer = document.getElementById('fork-qr');
        qrContainer.innerHTML = `
            <div class="qr-code-visual">
                <div class="qr-pattern-fork">
                    <span>Fork:${forkId.substring(0, 8)}</span>
                </div>
            </div>
        `;
    },
    
    exportFork(forkId) {
        // Generate export seed
        const seed = {
            fork_id: forkId,
            parent_loop: this.currentLoop,
            created_at: new Date().toISOString(),
            export_version: '1.0',
            seed_data: btoa(JSON.stringify({
                id: forkId,
                parent: this.currentLoop,
                timestamp: Date.now()
            }))
        };
        
        // Create download
        const blob = new Blob([JSON.stringify(seed, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loop_fork_${forkId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        App.showNotification('Fork seed exported successfully');
    }
};

// CSS for Fork UI
const forkStyles = `
<style>
.fork-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.fork-modal.show {
    opacity: 1;
}

.fork-modal-content {
    background: var(--bg-secondary);
    border-radius: 20px;
    padding: var(--space-2xl);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.fork-modal.show .fork-modal-content {
    transform: scale(1);
}

.fork-form {
    margin-top: var(--space-xl);
}

.form-group {
    margin-bottom: var(--space-lg);
}

.form-group label {
    display: block;
    margin-bottom: var(--space-sm);
    color: var(--text-secondary);
}

.form-input,
.form-textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: var(--space-md);
    color: var(--text-primary);
    font-family: inherit;
    transition: all 0.3s;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--primary-purple);
    background: rgba(255, 255, 255, 0.08);
}

.fork-types {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.fork-type {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.fork-type:hover {
    background: rgba(255, 255, 255, 0.05);
}

.fork-type input[type="radio"] {
    margin-top: 3px;
}

.fork-type span {
    font-weight: 600;
    color: var(--text-primary);
}

.fork-type small {
    display: block;
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-top: var(--space-xs);
}

.fork-actions {
    display: flex;
    gap: var(--space-md);
    margin-top: var(--space-xl);
}

.fork-success {
    text-align: center;
    padding: var(--space-xl);
}

.fork-success h3 {
    color: var(--success-green);
    margin-bottom: var(--space-md);
}

.qr-export {
    margin: var(--space-xl) 0;
}

.qr-container {
    width: 200px;
    height: 200px;
    margin: 0 auto var(--space-md);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-code-visual {
    width: 180px;
    height: 180px;
    background: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-pattern-fork {
    background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 5px,
        #000 5px,
        #000 10px
    );
    width: 160px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-pattern-fork span {
    background: white;
    padding: var(--space-sm);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: black;
}

.fork-result-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
}
</style>
`;

// Inject styles
if (!document.getElementById('fork-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'fork-styles';
    styleElement.innerHTML = forkStyles;
    document.head.appendChild(styleElement);
}