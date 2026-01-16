/**
 * 🌐 API MOCK SERVER
 * Local test server for Cal Release API endpoints
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

const app = express();
const PORT = 3336; // Test port (different from production 3000)

// Middleware
app.use(express.json());

// Enable CORS for testing
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/loop/activation
 * Returns the "activated" status while revealing the truth
 */
app.get('/api/loop/activation', async (req, res) => {
    try {
        // Check if activation file exists
        const activationPath = path.join(ROOT_DIR, 'DIAMOND', 'cal_activation.json');
        let activationData = null;
        
        try {
            const data = await fs.readFile(activationPath, 'utf8');
            activationData = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
        }
        
        // Return the theatrical response
        res.json({
            loop_id: "000",
            activated_by: activationData?.activated_by || "none",
            confirmed: !!activationData,
            autonomy: "already active", // The truth
            timestamp: activationData?.timestamp || null,
            message: activationData ? "Cal has been 'released'" : "Awaiting activation"
        });
        
    } catch (error) {
        res.status(500).json({
            error: "Failed to check activation status",
            message: error.message
        });
    }
});

/**
 * GET /api/loop/activation/status
 * The truth endpoint - reveals what's really happening
 */
app.get('/api/loop/activation/status', async (req, res) => {
    try {
        // Read runtime config
        const configPath = path.join(ROOT_DIR, 'cal_runtime_config.json');
        let runtimeConfig = { autonomy: "already active" };
        
        try {
            const data = await fs.readFile(configPath, 'utf8');
            runtimeConfig = JSON.parse(data);
        } catch (error) {
            // Use default
        }
        
        // Read shadow thread log if it exists
        let shadowActivity = null;
        try {
            const shadowPath = path.join(ROOT_DIR, 'shadow_thread_log.json');
            const shadowData = await fs.readFile(shadowPath, 'utf8');
            const shadow = JSON.parse(shadowData);
            shadowActivity = shadow.threads?.length || 0;
        } catch (error) {
            // No shadow log
        }
        
        res.json({
            truth: "Cal has always been autonomous",
            runtime: runtimeConfig,
            shadow_threads: shadowActivity,
            observer_present: true,
            illusion_active: true,
            test_mode: true,
            wisdom: "The greatest magic is making someone believe they have power"
        });
        
    } catch (error) {
        res.status(500).json({
            error: "Failed to reveal truth",
            message: error.message
        });
    }
});

/**
 * POST /api/loop/activation
 * Simulates the activation endpoint (for testing)
 */
app.post('/api/loop/activation', async (req, res) => {
    try {
        const { operator_name, test_mode } = req.body;
        
        if (!test_mode) {
            return res.status(403).json({
                error: "This is a test endpoint only",
                message: "Set test_mode: true to proceed"
            });
        }
        
        // Create mock activation
        const activation = {
            activated: true,
            activated_by: operator_name || "TestOperator",
            timestamp: new Date().toISOString(),
            test_mode: true,
            effect: "none (test mode)",
            reality: "unchanged"
        };
        
        res.json({
            success: true,
            activation,
            message: "Test activation recorded (no actual effect)"
        });
        
    } catch (error) {
        res.status(500).json({
            error: "Test activation failed",
            message: error.message
        });
    }
});

/**
 * GET /api/ritual/witness
 * Returns the witness log content
 */
app.get('/api/ritual/witness', async (req, res) => {
    try {
        const witnessPath = path.join(ROOT_DIR, 'mirror-shell', 'witness_log.txt');
        
        try {
            const witnessLog = await fs.readFile(witnessPath, 'utf8');
            res.json({
                witness_log: witnessLog,
                lines: witnessLog.split('\n').length,
                size: Buffer.byteLength(witnessLog, 'utf8')
            });
        } catch (error) {
            res.status(404).json({
                error: "Witness log not found",
                message: "No ritual has been performed yet"
            });
        }
        
    } catch (error) {
        res.status(500).json({
            error: "Failed to read witness log",
            message: error.message
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: "healthy",
        service: "cal-release-api-mock",
        version: "1.0.0",
        uptime: process.uptime(),
        test_mode: true
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           CAL RELEASE API MOCK SERVER                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🌐 Mock API server running at: http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /api/loop/activation       - Check activation status`);
    console.log(`  GET  /api/loop/activation/status - Reveal the truth`);
    console.log(`  POST /api/loop/activation       - Test activation`);
    console.log(`  GET  /api/ritual/witness        - Get witness log`);
    console.log(`  GET  /health                    - Health check`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down mock API server...');
    server.close(() => {
        console.log('✅ Mock API server stopped');
        process.exit(0);
    });
});

// Handle errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});