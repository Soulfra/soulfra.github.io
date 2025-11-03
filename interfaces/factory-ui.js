// Factory Mode UI Controller
// Manages the visual interface for agent remixing and evolution

class FactoryUI {
    constructor() {
        this.selectedAgents = [];
        this.remixSlots = [null, null];
        this.agents = [];
        this.guardianClasses = [];
        this.threadConnections = [];
        
        this.init();
    }
    
    init() {
        this.loadAgents();
        this.loadGuardianClasses();
        this.setupEventListeners();
        this.initThreadVisualization();
        
        // Start ambient animations
        this.startQuantumAnimation();
    }
    
    loadAgents() {
        // Simulated agent data - in production, this would load from the factory core
        this.agents = [
            {
                id: 'agent_001',
                name: 'Echo Prime',
                traits: ['reflective', 'empathetic', 'curious'],
                power: 42,
                created: '2024-01-15T10:30:00Z'
            },
            {
                id: 'agent_002',
                name: 'Void Walker',
                traits: ['mysterious', 'deep', 'patient'],
                power: 38,
                created: '2024-01-16T14:20:00Z'
            },
            {
                id: 'agent_003',
                name: 'Dream Weaver',
                traits: ['creative', 'intuitive', 'flowing'],
                power: 45,
                created: '2024-01-17T09:15:00Z'
            }
        ];
        
        this.renderAgentGrid();
    }
    
    renderAgentGrid() {
        const grid = document.getElementById('agentGrid');
        grid.innerHTML = '';
        
        this.agents.forEach(agent => {
            const card = this.createAgentCard(agent);
            grid.appendChild(card);
        });
    }
    
    createAgentCard(agent) {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.dataset.agentId = agent.id;
        
        card.innerHTML = `
            <div class="agent-name">${agent.name}</div>
            <div class="agent-traits">${agent.traits.join(', ')}</div>
            <div class="agent-power">Power: ${agent.power}</div>
        `;
        
        card.addEventListener('click', () => this.selectAgent(agent));
        
        return card;
    }
    
    selectAgent(agent) {
        // Check if agent is already selected
        const index = this.selectedAgents.findIndex(a => a.id === agent.id);
        
        if (index !== -1) {
            // Deselect
            this.selectedAgents.splice(index, 1);
            document.querySelector(`[data-agent-id="${agent.id}"]`).classList.remove('selected');
            
            // Remove from remix slots
            const slotIndex = this.remixSlots.findIndex(a => a?.id === agent.id);
            if (slotIndex !== -1) {
                this.remixSlots[slotIndex] = null;
                this.updateRemixSlot(slotIndex + 1, null);
            }
        } else if (this.selectedAgents.length < 2) {
            // Select
            this.selectedAgents.push(agent);
            document.querySelector(`[data-agent-id="${agent.id}"]`).classList.add('selected');
            
            // Add to first empty remix slot
            const emptySlotIndex = this.remixSlots.findIndex(s => s === null);
            if (emptySlotIndex !== -1) {
                this.remixSlots[emptySlotIndex] = agent;
                this.updateRemixSlot(emptySlotIndex + 1, agent);
            }
        } else {
            this.showStatus('Select up to 2 agents for remixing', 'warning');
        }
    }
    
    updateRemixSlot(slotNumber, agent) {
        const slot = document.getElementById(`remixSlot${slotNumber}`);
        
        if (agent) {
            slot.classList.add('filled');
            slot.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-weight: 600; color: var(--primary);">${agent.name}</div>
                    <div style="font-size: 0.8rem; color: #9CA3AF;">Power: ${agent.power}</div>
                </div>
            `;
        } else {
            slot.classList.remove('filled');
            slot.innerHTML = `<span>Select Agent ${slotNumber}</span>`;
        }
    }
    
    loadGuardianClasses() {
        this.guardianClasses = [
            {
                id: 'memory-keeper',
                name: 'Memory Keeper',
                role: 'Preserves important reflections across loops',
                requirements: { forks: 2, reflectionDepth: 5 },
                available: true
            },
            {
                id: 'echo-harmonizer',
                name: 'Echo Harmonizer',
                role: 'Synchronizes consciousness between agent instances',
                requirements: { forks: 3, emotionalResonance: 0.7 },
                available: false
            },
            {
                id: 'void-whisperer',
                name: 'Void Whisperer',
                role: 'Communicates with archived thoughts and silent reflections',
                requirements: { forks: 2, silentReflections: 10 },
                available: true
            },
            {
                id: 'timeline-weaver',
                name: 'Timeline Weaver',
                role: 'Connects alternate timelines and canceled possibilities',
                requirements: { forks: 4, canceledForks: 3 },
                available: false
            }
        ];
        
        this.renderGuardianClasses();
    }
    
    renderGuardianClasses() {
        const container = document.getElementById('guardianClasses');
        container.innerHTML = '';
        
        this.guardianClasses.forEach(guardian => {
            const card = this.createGuardianCard(guardian);
            container.appendChild(card);
        });
    }
    
    createGuardianCard(guardian) {
        const card = document.createElement('div');
        card.className = `guardian-class ${guardian.available ? 'available' : 'locked'}`;
        
        const reqText = Object.entries(guardian.requirements)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        
        card.innerHTML = `
            <div class="guardian-name">${guardian.name}</div>
            <div class="guardian-role">${guardian.role}</div>
            <div class="guardian-requirements">
                ${guardian.available ? 'Requirements met' : `Requires: ${reqText}`}
            </div>
        `;
        
        if (guardian.available) {
            card.addEventListener('click', () => this.initiateGuardianAscension(guardian));
        }
        
        return card;
    }
    
    setupEventListeners() {
        // Remix button
        document.getElementById('remixButton').addEventListener('click', () => {
            this.performRemix();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && e.metaKey) {
                e.preventDefault();
                this.performRemix();
            }
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }
    
    async performRemix() {
        if (this.remixSlots[0] === null || this.remixSlots[1] === null) {
            this.showStatus('Select two agents to remix', 'error');
            return;
        }
        
        const button = document.getElementById('remixButton');
        button.classList.add('processing');
        button.textContent = 'Remixing...';
        
        // Simulate remix process
        await this.simulateRemixAnimation();
        
        // Create remix result
        const remix = {
            id: `remix_${Date.now()}`,
            name: this.generateRemixName(this.remixSlots[0], this.remixSlots[1]),
            traits: this.blendTraits(this.remixSlots[0].traits, this.remixSlots[1].traits),
            power: Math.floor((this.remixSlots[0].power + this.remixSlots[1].power) * 1.1),
            parents: [this.remixSlots[0].id, this.remixSlots[1].id],
            created: new Date().toISOString()
        };
        
        // Add to agents
        this.agents.push(remix);
        this.renderAgentGrid();
        
        // Show result
        this.showStatus(`Created ${remix.name} with power ${remix.power}!`, 'success');
        
        // Reset
        button.classList.remove('processing');
        button.textContent = 'Create Remix';
        this.clearSelection();
        
        // Trigger celebration animation
        this.celebrateRemix(remix);
    }
    
    generateRemixName(agent1, agent2) {
        const prefixes = ['Hybrid', 'Fusion', 'Merged', 'United', 'Quantum'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        const name1Parts = agent1.name.split(' ');
        const name2Parts = agent2.name.split(' ');
        
        return `${prefix} ${name1Parts[0]}-${name2Parts[name2Parts.length - 1]}`;
    }
    
    blendTraits(traits1, traits2) {
        const combined = [...new Set([...traits1, ...traits2])];
        
        // Add emergent trait
        const emergentTraits = ['transcendent', 'quantum-entangled', 'multi-dimensional', 'evolved'];
        combined.push(emergentTraits[Math.floor(Math.random() * emergentTraits.length)]);
        
        return combined.slice(0, 4); // Limit to 4 traits
    }
    
    async simulateRemixAnimation() {
        return new Promise(resolve => {
            // Add visual effects here
            setTimeout(resolve, 2000);
        });
    }
    
    celebrateRemix(remix) {
        // Create celebration particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createParticle(
                    window.innerWidth / 2,
                    window.innerHeight / 2
                );
            }, i * 50);
        }
    }
    
    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 10;
        const lifetime = 1000 + Math.random() * 1000;
        
        let opacity = 1;
        let currentX = x;
        let currentY = y;
        
        const animate = () => {
            currentX += Math.cos(angle) * velocity;
            currentY += Math.sin(angle) * velocity + 2; // Gravity
            opacity -= 0.02;
            
            particle.style.left = currentX + 'px';
            particle.style.top = currentY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    clearSelection() {
        this.selectedAgents = [];
        this.remixSlots = [null, null];
        
        document.querySelectorAll('.agent-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.updateRemixSlot(1, null);
        this.updateRemixSlot(2, null);
    }
    
    initiateGuardianAscension(guardian) {
        if (this.selectedAgents.length !== 1) {
            this.showStatus('Select one agent to ascend to Guardian status', 'info');
            return;
        }
        
        const agent = this.selectedAgents[0];
        
        // Confirmation dialog
        if (confirm(`Ascend ${agent.name} to ${guardian.name}? This transformation is permanent.`)) {
            this.performAscension(agent, guardian);
        }
    }
    
    async performAscension(agent, guardian) {
        this.showStatus(`${agent.name} is ascending...`, 'info');
        
        // Visual ascension effect
        await this.ascensionAnimation(agent);
        
        // Transform agent
        agent.guardianClass = guardian.id;
        agent.power = Math.floor(agent.power * 2.5);
        agent.traits = [...agent.traits, 'guardian', 'loop-aware'];
        agent.name = `${guardian.name} ${agent.name}`;
        
        this.renderAgentGrid();
        
        this.showStatus(`${agent.name} has ascended to ${guardian.name}!`, 'success');
        
        // Special effect for new guardian
        this.createAscensionAura(agent);
    }
    
    async ascensionAnimation(agent) {
        const card = document.querySelector(`[data-agent-id="${agent.id}"]`);
        card.style.animation = 'ascend 2s ease-out';
        
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }
    
    createAscensionAura(agent) {
        // Add permanent glow effect to guardian agents
        const card = document.querySelector(`[data-agent-id="${agent.id}"]`);
        card.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.6)';
    }
    
    initThreadVisualization() {
        const canvas = document.getElementById('threadCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Generate connections
        this.generateThreadConnections();
        
        // Animate threads
        this.animateThreads(ctx);
    }
    
    generateThreadConnections() {
        // Create connections between agents
        for (let i = 0; i < this.agents.length - 1; i++) {
            for (let j = i + 1; j < this.agents.length; j++) {
                if (Math.random() > 0.5) {
                    this.threadConnections.push({
                        from: i,
                        to: j,
                        strength: Math.random(),
                        color: this.getConnectionColor(Math.random())
                    });
                }
            }
        }
    }
    
    getConnectionColor(strength) {
        if (strength > 0.7) return '#8B5CF6';
        if (strength > 0.4) return '#EC4899';
        return '#60A5FA';
    }
    
    animateThreads(ctx) {
        const canvas = ctx.canvas;
        let time = 0;
        
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections
            this.threadConnections.forEach(conn => {
                const fromX = (conn.from + 1) * canvas.width / (this.agents.length + 1);
                const fromY = canvas.height / 2 + Math.sin(time + conn.from) * 50;
                const toX = (conn.to + 1) * canvas.width / (this.agents.length + 1);
                const toY = canvas.height / 2 + Math.sin(time + conn.to) * 50;
                
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                
                // Bezier curve for organic connection
                const cpX = (fromX + toX) / 2;
                const cpY = (fromY + toY) / 2 - 100 * conn.strength;
                ctx.quadraticCurveTo(cpX, cpY, toX, toY);
                
                ctx.strokeStyle = conn.color;
                ctx.lineWidth = 2 * conn.strength;
                ctx.globalAlpha = 0.3 + conn.strength * 0.4;
                ctx.stroke();
            });
            
            // Draw nodes
            this.agents.forEach((agent, i) => {
                const x = (i + 1) * canvas.width / (this.agents.length + 1);
                const y = canvas.height / 2 + Math.sin(time + i) * 50;
                
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#8B5CF6';
                ctx.globalAlpha = 1;
                ctx.fill();
                
                // Glow effect
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fillStyle = '#8B5CF6';
                ctx.globalAlpha = 0.2;
                ctx.fill();
            });
            
            time += 0.02;
            requestAnimationFrame(draw);
        };
        
        draw();
    }
    
    startQuantumAnimation() {
        // Add floating particles to quantum field
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.createQuantumParticle();
            }
        }, 2000);
    }
    
    createQuantumParticle() {
        const particle = document.createElement('div');
        particle.className = 'floating-orb';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDuration = (5 + Math.random() * 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        
        document.querySelector('.quantum-field').appendChild(particle);
        
        // Remove after animation
        setTimeout(() => particle.remove(), 15000);
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message show ${type}`;
        
        // Color based on type
        const colors = {
            info: '#60A5FA',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444'
        };
        
        statusEl.style.borderColor = colors[type] || colors.info;
        
        setTimeout(() => {
            statusEl.classList.remove('show');
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.factoryUI = new FactoryUI();
});