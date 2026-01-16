// SOULFRA Memory Web App
const API_URL = 'http://localhost:8000';

let memories = [];
let currentCollection = '';
let currentMemoryId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCollections();
    loadMemories();
    
    // Set up form handler
    document.getElementById('add-memory-form').addEventListener('submit', handleAddMemory);
});

// Load collections
async function loadCollections() {
    try {
        const response = await fetch(`${API_URL}/collections`);
        const collections = await response.json();
        
        const container = document.getElementById('collections-list');
        const totalCount = document.getElementById('total-count');
        
        // Calculate total
        const total = collections.reduce((sum, col) => sum + col.count, 0);
        totalCount.textContent = total;
        
        // Add collection items
        collections.forEach(col => {
            if (col.name !== 'default' || col.count > 0) {
                const item = document.createElement('div');
                item.className = 'collection-item';
                item.dataset.collection = col.name;
                item.innerHTML = `
                    <span>${col.name}</span>
                    <span class="count">${col.count}</span>
                `;
                item.onclick = () => selectCollection(col.name);
                container.appendChild(item);
            }
        });
    } catch (error) {
        console.error('Failed to load collections:', error);
    }
}

// Load memories
async function loadMemories(search = '') {
    const container = document.getElementById('memories-container');
    container.innerHTML = '<div class="loading">Loading memories...</div>';
    
    try {
        let url = `${API_URL}/memories?limit=100`;
        if (currentCollection) {
            url += `&collection=${encodeURIComponent(currentCollection)}`;
        }
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        
        const response = await fetch(url);
        memories = await response.json();
        
        if (memories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No memories yet</h3>
                    <p>Click "Add Memory" to create your first memory</p>
                </div>
            `;
        } else {
            container.innerHTML = memories.map(memory => createMemoryCard(memory)).join('');
        }
    } catch (error) {
        console.error('Failed to load memories:', error);
        container.innerHTML = '<div class="error">Failed to load memories</div>';
    }
}

// Create memory card HTML
function createMemoryCard(memory) {
    const date = new Date(memory.created_at).toLocaleDateString();
    const tags = memory.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    let personalityBadge = '';
    if (memory.personality_insights) {
        const mood = memory.personality_insights.mood;
        const energy = memory.personality_insights.energy_level;
        personalityBadge = `<span class="personality-badge">${getMoodEmoji(mood)} ${mood} - ${energy} energy</span>`;
    }
    
    return `
        <div class="memory-card" onclick="showMemoryDetail(${memory.id})">
            <div class="memory-header">
                <div class="memory-title">${memory.title}</div>
                <div class="memory-meta">
                    <span class="memory-type">${memory.type}</span>
                    <span>${date}</span>
                </div>
            </div>
            <div class="memory-content">${memory.content}</div>
            <div class="memory-footer">
                ${tags ? `<div class="memory-tags">${tags}</div>` : ''}
                ${personalityBadge}
            </div>
        </div>
    `;
}

// Get mood emoji
function getMoodEmoji(mood) {
    const emojis = {
        positive: '😊',
        negative: '😔',
        neutral: '😐'
    };
    return emojis[mood] || '🤔';
}

// Select collection
function selectCollection(collection) {
    currentCollection = collection;
    
    // Update UI
    document.querySelectorAll('.collection-item').forEach(item => {
        item.classList.toggle('active', item.dataset.collection === collection);
    });
    
    // Reload memories
    loadMemories();
}

// Handle search
function handleSearch(event) {
    if (event.key === 'Enter' || event.type === 'click') {
        const search = document.getElementById('search-input').value;
        loadMemories(search);
    }
}

// Show add memory dialog
function showAddMemoryDialog() {
    document.getElementById('add-memory-modal').classList.add('show');
    document.getElementById('memory-collection').value = currentCollection || 'default';
}

// Handle add memory form
async function handleAddMemory(event) {
    event.preventDefault();
    
    const form = event.target;
    const data = {
        title: form['memory-title'].value || null,
        content: form['memory-content'].value,
        type: form['memory-type'].value,
        collection: form['memory-collection'].value || 'default',
        tags: form['memory-tags'].value.split(',').map(t => t.trim()).filter(t => t),
        metadata: {}
    };
    
    try {
        const response = await fetch(`${API_URL}/memories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal();
            form.reset();
            loadMemories();
            loadCollections();
        } else {
            const error = await response.json();
            alert('Failed to save memory: ' + error.detail);
        }
    } catch (error) {
        console.error('Failed to save memory:', error);
        alert('Failed to save memory');
    }
}

// Show memory detail
async function showMemoryDetail(memoryId) {
    currentMemoryId = memoryId;
    
    try {
        const response = await fetch(`${API_URL}/memories/${memoryId}`);
        const memory = await response.json();
        
        const content = document.getElementById('memory-detail-content');
        const date = new Date(memory.created_at).toLocaleString();
        const tags = memory.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ');
        
        let insightsHtml = '';
        if (memory.personality_insights) {
            const insights = memory.personality_insights;
            insightsHtml = `
                <div class="insights-section">
                    <h3>Personality Insights</h3>
                    <p>Mood: ${getMoodEmoji(insights.mood)} ${insights.mood}</p>
                    <p>Energy Level: ${insights.energy_level}</p>
                    <p>Sentiment Score: ${(insights.sentiment_score * 100).toFixed(0)}%</p>
                </div>
            `;
        }
        
        content.innerHTML = `
            <h2>${memory.title}</h2>
            <div class="memory-meta">
                <span class="memory-type">${memory.type}</span>
                <span>${date}</span>
            </div>
            <div class="memory-detail-content">
                ${memory.content}
            </div>
            ${tags ? `<div class="memory-tags">${tags}</div>` : ''}
            ${insightsHtml}
            <div class="memory-meta">
                <small>Collection: ${memory.collection}</small>
                <small>ID: ${memory.id}</small>
            </div>
        `;
        
        document.getElementById('memory-detail-modal').classList.add('show');
    } catch (error) {
        console.error('Failed to load memory detail:', error);
    }
}

// Delete current memory
async function deleteCurrentMemory() {
    if (!currentMemoryId || !confirm('Are you sure you want to delete this memory?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/memories/${currentMemoryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            closeModal();
            loadMemories();
            loadCollections();
        }
    } catch (error) {
        console.error('Failed to delete memory:', error);
        alert('Failed to delete memory');
    }
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    currentMemoryId = null;
}

// Close modal on background click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});

// Additional styles for memory detail
const style = document.createElement('style');
style.textContent = `
    .memory-detail-content {
        white-space: pre-wrap;
        margin: 1.5rem 0;
        line-height: 1.8;
    }
    
    .insights-section {
        background: var(--bg);
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1.5rem 0;
    }
    
    .insights-section h3 {
        margin-bottom: 0.75rem;
        color: var(--secondary);
    }
    
    .insights-section p {
        margin-bottom: 0.5rem;
    }
`;
document.head.appendChild(style);