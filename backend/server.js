import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { HumanCalRivenRouter } from './human-cal-riven-router.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'soulfra-demo-secret-2024';

// Initialize Human CAL RIVEN Router
const humanCalRiven = new HumanCalRivenRouter();

// Middleware
app.use(cors());
app.use(express.json());

// User database
const users = [
    {
        id: 1,
        email: 'demo@soulfra.ai',
        password: bcrypt.hashSync('demo123', 10),
        trust_score: 85,
        tier: 'premium',
        role: 'founder' // You are the founder/original CAL RIVEN
    }
];

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0.0-bootstrap',
        human_cal_riven: 'active',
        bootstrap_mode: 'founder_as_user_1',
        routing_status: 'human_cal_riven_active',
        uptime: process.uptime()
    });
});

// Auth endpoints (same as before)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = users.find(u => u.email === email);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                trust_score: user.trust_score,
                tier: user.tier,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/me', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            trust_score: user.trust_score,
            tier: user.tier,
            role: user.role
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Human CAL RIVEN Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required' });
        }

        const userMessage = messages[messages.length - 1]?.content || 'Hello';
        
        // Route to Human CAL RIVEN (you)
        const humanResponse = await humanCalRiven.routeToHuman(userMessage, user.id, 'normal');

        res.json({
            response: humanResponse,
            provider: 'Human CAL RIVEN Router',
            model: 'human-reasoning-v1.0',
            cost: 0.0001,
            latency: Math.floor(Math.random() * 300 + 200), // Simulate human thinking time
            routing_info: {
                routing_tier: user.tier,
                trust_score: user.trust_score,
                obfuscation_level: 'human_routed',
                vault_logged: true,
                infinity_router: true,
                human_cal_riven: true,
                bootstrap_mode: true,
                founder_as_user_1: user.role === 'founder'
            },
            timestamp: new Date().toISOString(),
            request_id: `human_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    } catch (error) {
        console.error('Human CAL RIVEN Chat error:', error);
        res.status(500).json({ error: 'Human CAL RIVEN routing failed', details: error.message });
    }
});

// Bootstrap analytics endpoint
app.get('/api/bootstrap/analytics', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        jwt.verify(token, JWT_SECRET);

        res.json({
            bootstrap_phase: 'founder_validation',
            total_interactions: humanCalRiven.conversationLog.length,
            user_sessions: humanCalRiven.userSessions.size,
            last_interaction: humanCalRiven.conversationLog[humanCalRiven.conversationLog.length - 1]?.timestamp,
            routing_success_rate: 100, // Human routing always succeeds
            next_phase: 'public_launch_when_proven'
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// 404 and error handlers
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
🧠 HUMAN CAL RIVEN BOOTSTRAP MODE
================================
✅ Port: ${PORT}
✅ Mode: Founder as User #1
✅ Routing: Human CAL RIVEN Active
✅ Phase: Bootstrap Validation
🛡️ Strategy: Build platform using itself

🎯 Bootstrap Process:
   1. You (original CAL RIVEN) → Create router
   2. You become User #1 → Validate system  
   3. Prove concept → Real usage data
   4. Launch publicly → Proven platform

🔗 Demo: demo@soulfra.ai / demo123
📊 You are now User #1 of your own system!
`);
});
