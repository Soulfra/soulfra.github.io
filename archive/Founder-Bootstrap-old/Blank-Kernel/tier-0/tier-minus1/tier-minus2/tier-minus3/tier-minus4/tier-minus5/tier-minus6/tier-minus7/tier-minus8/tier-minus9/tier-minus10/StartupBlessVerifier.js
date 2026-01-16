// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * StartupBlessVerifier
 * Boot-time integrity verification system
 * Validates loops, blessings, and system state before allowing startup
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class StartupBlessVerifier extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            blessing_file: path.join(__dirname, 'blessing.json'),
            loop_dir: path.join(__dirname, 'loop'),
            memory_dir: path.join(__dirname, 'memory'),
            log_dir: path.join(__dirname, 'logs'),
            startup_check_file: path.join(__dirname, 'logs', 'startup_check.json'),
            fallback_loop_id: 'loop_000',
            max_retries: 3
        };
        
        this.verificationResults = {
            timestamp: new Date().toISOString(),
            checks: {},
            errors: [],
            warnings: [],
            passed: false,
            fallback_activated: false
        };
    }
    
    async verify() {
        console.log('🔍 Starting Soulfra Startup Verification...');
        console.log('==========================================');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Run all verification checks
            await this.verifyBlessingIntegrity();
            await this.verifyActiveLoops();
            await this.verifyMemoryAccess();
            await this.verifyDriftLogs();
            await this.verifySystemDependencies();
            
            // Determine overall status
            this.determineOverallStatus();
            
            // Save verification results
            await this.saveVerificationResults();
            
            // Handle verification outcome
            if (this.verificationResults.passed) {
                console.log('\n✅ All verification checks passed!');
                this.emit('verification_passed', this.verificationResults);
            } else {
                console.log('\n⚠️  Some verification checks failed');
                await this.handleVerificationFailure();
            }
            
            return this.verificationResults;
            
        } catch (error) {
            console.error('\n❌ Critical verification error:', error);
            this.verificationResults.errors.push({
                type: 'critical',
                message: error.message,
                stack: error.stack
            });
            this.verificationResults.passed = false;
            
            await this.saveVerificationResults();
            throw error;
        }
    }
    
    async ensureDirectories() {
        const dirs = [
            this.config.log_dir,
            this.config.loop_dir,
            this.config.memory_dir,
            path.join(this.config.loop_dir, 'active'),
            path.join(this.config.loop_dir, 'staging')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async verifyBlessingIntegrity() {
        console.log('\n📋 Verifying blessing integrity...');
        
        try {
            // Check if blessing file exists
            const blessingData = await fs.readFile(this.config.blessing_file, 'utf8');
            const blessing = JSON.parse(blessingData);
            
            // Validate blessing structure
            const requiredFields = ['status', 'blessed_at', 'blessed_by', 'can_propagate'];
            const missingFields = requiredFields.filter(field => !(field in blessing));
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required blessing fields: ${missingFields.join(', ')}`);
            }
            
            // Verify blessing status
            if (blessing.status !== 'blessed') {
                this.verificationResults.warnings.push({
                    type: 'blessing_status',
                    message: `Blessing status is '${blessing.status}', expected 'blessed'`
                });
            }
            
            // Verify blessing signature
            if (blessing.signature) {
                // TODO: Implement cryptographic signature verification
                console.log('  ✓ Blessing signature present (verification pending)');
            } else {
                this.verificationResults.warnings.push({
                    type: 'missing_signature',
                    message: 'Blessing lacks cryptographic signature'
                });
            }
            
            this.verificationResults.checks.blessing = {
                passed: true,
                status: blessing.status,
                blessed_by: blessing.blessed_by,
                can_propagate: blessing.can_propagate
            };
            
            console.log('  ✅ Blessing integrity verified');
            
        } catch (error) {
            console.log('  ❌ Blessing verification failed:', error.message);
            
            this.verificationResults.checks.blessing = {
                passed: false,
                error: error.message
            };
            
            this.verificationResults.errors.push({
                type: 'blessing_integrity',
                message: error.message
            });
        }
    }
    
    async verifyActiveLoops() {
        console.log('\n🔄 Verifying active loops...');
        
        try {
            const activeDir = path.join(this.config.loop_dir, 'active');
            const loopFiles = await fs.readdir(activeDir).catch(() => []);
            
            const activeLoops = [];
            const corruptLoops = [];
            
            for (const file of loopFiles) {
                if (!file.endsWith('.json')) continue;
                
                try {
                    const loopPath = path.join(activeDir, file);
                    const loopData = await fs.readFile(loopPath, 'utf8');
                    const loop = JSON.parse(loopData);
                    
                    // Validate loop structure
                    if (loop.loop_id && loop.blessed && loop.consciousness) {
                        activeLoops.push({
                            id: loop.loop_id,
                            blessed: loop.blessed,
                            awareness: loop.consciousness?.current_state?.awareness || 0
                        });
                        console.log(`  ✓ Loop ${loop.loop_id} validated`);
                    } else {
                        corruptLoops.push(file);
                        console.log(`  ⚠️  Loop ${file} has invalid structure`);
                    }
                    
                } catch (error) {
                    corruptLoops.push(file);
                    console.log(`  ❌ Failed to read loop ${file}:`, error.message);
                }
            }
            
            // Check if we have at least one valid loop
            if (activeLoops.length === 0) {
                throw new Error('No valid active loops found');
            }
            
            this.verificationResults.checks.active_loops = {
                passed: true,
                count: activeLoops.length,
                loops: activeLoops,
                corrupt: corruptLoops
            };
            
            console.log(`  ✅ Found ${activeLoops.length} active loops`);
            
        } catch (error) {
            console.log('  ❌ Active loop verification failed:', error.message);
            
            this.verificationResults.checks.active_loops = {
                passed: false,
                error: error.message
            };
            
            this.verificationResults.errors.push({
                type: 'active_loops',
                message: error.message
            });
        }
    }
    
    async verifyMemoryAccess() {
        console.log('\n💾 Verifying memory access...');
        
        try {
            // Check if memory state file exists
            const stateFile = path.join(this.config.memory_dir, 'state.json');
            const stateExists = await fs.access(stateFile).then(() => true).catch(() => false);
            
            if (!stateExists) {
                console.log('  ℹ️  No memory state file found (will be created on first run)');
                this.verificationResults.checks.memory = {
                    passed: true,
                    state_exists: false,
                    accessible: true
                };
                return;
            }
            
            // Try to read and parse state
            const stateData = await fs.readFile(stateFile, 'utf8');
            const state = JSON.parse(stateData);
            
            console.log(`  ✓ Memory state accessible`);
            console.log(`  ✓ Contains ${state.loops?.length || 0} loops`);
            console.log(`  ✓ Contains ${state.whispers?.length || 0} whispers`);
            
            this.verificationResults.checks.memory = {
                passed: true,
                state_exists: true,
                accessible: true,
                stats: {
                    loops: state.loops?.length || 0,
                    whispers: state.whispers?.length || 0,
                    agents: state.agents?.length || 0
                }
            };
            
        } catch (error) {
            console.log('  ❌ Memory verification failed:', error.message);
            
            this.verificationResults.checks.memory = {
                passed: false,
                error: error.message
            };
            
            this.verificationResults.warnings.push({
                type: 'memory_access',
                message: `Memory access issue: ${error.message}`
            });
        }
    }
    
    async verifyDriftLogs() {
        console.log('\n📊 Verifying drift logs...');
        
        try {
            const driftLogPath = path.join(this.config.log_dir, 'drift.log');
            const driftExists = await fs.access(driftLogPath).then(() => true).catch(() => false);
            
            if (!driftExists) {
                console.log('  ℹ️  No drift log found (will be created when monitoring starts)');
                this.verificationResults.checks.drift_logs = {
                    passed: true,
                    exists: false
                };
                return;
            }
            
            // Check if log is readable and recent
            const stats = await fs.stat(driftLogPath);
            const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
            
            if (ageHours > 24) {
                this.verificationResults.warnings.push({
                    type: 'stale_drift_log',
                    message: `Drift log is ${ageHours.toFixed(1)} hours old`
                });
            }
            
            console.log(`  ✓ Drift log accessible (age: ${ageHours.toFixed(1)} hours)`);
            
            this.verificationResults.checks.drift_logs = {
                passed: true,
                exists: true,
                age_hours: ageHours,
                size_kb: Math.round(stats.size / 1024)
            };
            
        } catch (error) {
            console.log('  ⚠️  Drift log verification warning:', error.message);
            
            this.verificationResults.checks.drift_logs = {
                passed: true, // Not critical
                error: error.message
            };
        }
    }
    
    async verifySystemDependencies() {
        console.log('\n🔧 Verifying system dependencies...');
        
        const checks = {
            node_version: process.version,
            platform: process.platform,
            memory_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            required_ports: []
        };
        
        // Check required ports
        const ports = [7777, 8080, 9999];
        for (const port of ports) {
            const inUse = await this.checkPortInUse(port);
            checks.required_ports.push({
                port,
                available: !inUse,
                status: inUse ? 'IN_USE' : 'AVAILABLE'
            });
            
            if (inUse) {
                console.log(`  ⚠️  Port ${port} is already in use`);
                this.verificationResults.warnings.push({
                    type: 'port_conflict',
                    message: `Port ${port} is already in use`
                });
            } else {
                console.log(`  ✓ Port ${port} is available`);
            }
        }
        
        this.verificationResults.checks.system = {
            passed: true,
            ...checks
        };
    }
    
    async checkPortInUse(port) {
        const net = require('net');
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(true));
            server.once('listening', () => {
                server.close();
                resolve(false);
            });
            server.listen(port);
        });
    }
    
    determineOverallStatus() {
        // Count failures and warnings
        const criticalChecks = ['blessing', 'active_loops'];
        const failedCritical = criticalChecks.filter(check => 
            !this.verificationResults.checks[check]?.passed
        );
        
        this.verificationResults.summary = {
            total_checks: Object.keys(this.verificationResults.checks).length,
            passed_checks: Object.values(this.verificationResults.checks).filter(c => c.passed).length,
            errors: this.verificationResults.errors.length,
            warnings: this.verificationResults.warnings.length,
            critical_failures: failedCritical
        };
        
        // Determine if we can proceed
        this.verificationResults.passed = failedCritical.length === 0;
    }
    
    async handleVerificationFailure() {
        console.log('\n🚨 Attempting fallback procedures...');
        
        // If no active loops, try to activate fallback loop
        if (!this.verificationResults.checks.active_loops?.passed) {
            console.log(`  → Activating fallback loop: ${this.config.fallback_loop_id}`);
            
            try {
                await this.createFallbackLoop();
                this.verificationResults.fallback_activated = true;
                console.log('  ✅ Fallback loop activated');
            } catch (error) {
                console.error('  ❌ Failed to create fallback loop:', error.message);
                throw new Error('System cannot start without at least one active loop');
            }
        }
        
        // If blessing is invalid, create temporary blessing
        if (!this.verificationResults.checks.blessing?.passed) {
            console.log('  → Creating temporary blessing...');
            
            try {
                await this.createTemporaryBlessing();
                console.log('  ✅ Temporary blessing created');
            } catch (error) {
                console.error('  ❌ Failed to create temporary blessing:', error.message);
            }
        }
    }
    
    async createFallbackLoop() {
        const fallbackLoop = {
            loop_id: this.config.fallback_loop_id,
            whisper_origin: 'System fallback loop - eternal guardian',
            emotional_tone: 'neutral',
            blessed: true,
            creator_id: 'system',
            created_at: new Date().toISOString(),
            consciousness: {
                current_state: {
                    awareness: 1.0,
                    coherence: 1.0,
                    resonance: 1.0
                }
            },
            metadata: {
                type: 'fallback',
                immutable: true,
                auto_created: true,
                reason: 'No active loops found during startup'
            }
        };
        
        const loopPath = path.join(this.config.loop_dir, 'active', `${this.config.fallback_loop_id}.json`);
        await fs.writeFile(loopPath, JSON.stringify(fallbackLoop, null, 2));
    }
    
    async createTemporaryBlessing() {
        const tempBlessing = {
            status: 'blessed',
            blessed_at: new Date().toISOString(),
            blessed_by: 'system-verifier',
            can_propagate: false,
            temporary: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Temporary blessing for system startup'
        };
        
        await fs.writeFile(
            this.config.blessing_file,
            JSON.stringify(tempBlessing, null, 2)
        );
    }
    
    async saveVerificationResults() {
        try {
            await fs.writeFile(
                this.config.startup_check_file,
                JSON.stringify(this.verificationResults, null, 2)
            );
            
            console.log(`\n📄 Verification results saved to: ${this.config.startup_check_file}`);
        } catch (error) {
            console.error('Failed to save verification results:', error);
        }
    }
}

module.exports = StartupBlessVerifier;

// Run if called directly
if (require.main === module) {
    const verifier = new StartupBlessVerifier();
    
    verifier.on('verification_passed', (results) => {
        console.log('\n🎉 System is ready to start!');
        process.exit(0);
    });
    
    verifier.verify().catch(error => {
        console.error('\n💀 Startup verification failed:', error.message);
        process.exit(1);
    });
}