// server.js - Complete Soulfra Backend
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'soulfra-secret-' + Date.now();

// Initialize SQLite
const db = new Database('./soulfra.db');
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      trust_score INTEGER DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS trust_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_trust_events_user ON trust_events(user_id);
  `);
}

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Trust management
function updateTrust(userId, delta, reason) {
  db.prepare(`
    UPDATE users SET trust_score = trust_score + ? WHERE id = ?
  `).run(delta, userId);
  
  db.prepare(`
    INSERT INTO trust_events (user_id, delta, reason) VALUES (?, ?, ?)
  `).run(userId, delta, reason);
  
  const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(userId);
  return user.trust_score;
}

function getTier(trustScore) {
  if (trustScore >= 70) return 'premium';
  if (trustScore >= 50) return 'standard';
  return 'basic';
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (email, password_hash) VALUES (?, ?)
    `).run(email, passwordHash);
    
    const token = jwt.sign(
      { id: result.lastInsertRowid, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: result.lastInsertRowid, 
        email, 
        trust_score: 50,
        tier: 'standard'
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        trust_score: user.trust_score,
        tier: getTier(user.trust_score)
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Document routes
app.get('/api/documents', auth, (req, res) => {
  try {
    const documents = db.prepare(`
      SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC
    `).all(req.user.id);
    
    res.json(documents);
  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

app.post('/api/documents', auth, (req, res) => {
  try {
    const { title, type, category, content } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO documents (id, user_id, title, type, category, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, title, type, category, content);
    
    const newTrust = updateTrust(req.user.id, 5, 'document_created');
    
    res.json({ 
      document: { id, title, type, category, status: 'draft' },
      trust_reward: 5,
      new_trust_score: newTrust
    });
  } catch (error) {
    console.error('Document creation error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.put('/api/documents/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    
    const doc = db.prepare('SELECT user_id FROM documents WHERE id = ?').get(id);
    if (!doc || doc.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      
      if (status === 'approved') {
        updateTrust(req.user.id, 10, 'document_approved');
      }
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    db.prepare(`
      UPDATE documents 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

app.post('/api/documents/import', auth, async (req, res) => {
  try {
    const docsPath = path.join(process.cwd(), 'Soulfra-Documentation');
    
    try {
      await fs.access(docsPath);
    } catch {
      return res.status(404).json({ error: 'Soulfra-Documentation folder not found' });
    }
    
    const files = await fs.readdir(docsPath);
    let imported = 0;
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(docsPath, file), 'utf-8');
        const title = file.replace('.md', '').replace(/-/g, ' ');
        const type = file.toLowerCase().includes('prd') ? 'PRD' : 'Documentation';
        const category = type === 'PRD' ? 'PRDs' : 'Documentation';
        
        db.prepare(`
          INSERT INTO documents (id, user_id, title, type, category, content)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), req.user.id, title, type, category, content);
        
        imported++;
      }
    }
    
    const newTrust = updateTrust(req.user.id, imported * 3, `imported_${imported}_documents`);
    
    res.json({ 
      imported, 
      trust_reward: imported * 3,
      new_trust_score: newTrust 
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import documents' });
  }
});

// Trust endpoint
app.get('/api/trust', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(req.user.id);
    
    const events = db.prepare(`
      SELECT * FROM trust_events 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(req.user.id);
    
    res.json({ 
      trust_score: user.trust_score, 
      tier: getTier(user.trust_score),
      recent_events: events 
    });
  } catch (error) {
    console.error('Trust fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trust data' });
  }
});

// Initialize database and start server
initDatabase();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           🚀 SOULFRA SERVER RUNNING 🚀            ║
╚═══════════════════════════════════════════════════╝

📡 API:     http://localhost:${PORT}/api
🌐 App:     http://localhost:${PORT}
❤️  Health:  http://localhost:${PORT}/api/health

The frontend automatically connects to this backend!
  `);
});