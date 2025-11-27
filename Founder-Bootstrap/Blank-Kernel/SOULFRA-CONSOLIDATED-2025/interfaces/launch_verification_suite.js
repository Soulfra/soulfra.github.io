#!/usr/bin/env node

/**
 * Soulfra Verification Suite Launcher
 * 
 * Launches all verification and diagnostic systems:
 * - Loop Drift Diagnostics
 * - Agent Echo Trace  
 * - System Integrity Witness
 * - Semantic API Router
 * - External Trigger Listener
 * - Loop Edge Writer
 * 
 * Confirms system legitimacy with full verification pipeline.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class VerificationSuiteLauncher {
    constructor() {
        this.identity = {
            name: 'Verification Suite Launcher',
            emoji: '🚀',
            role: 'System Orchestrator'
        };
        
        // Component definitions
        this.components = {
            external_trigger_listener: {
                name: 'External Trigger Listener',
                emoji: '🔍',
                script: path.resolve(__dirname, 'semantic-graph/external_trigger_listener.js'),
                description: 'Anomaly detection and gap monitoring',
                port: null
            },
            loop_edge_writer: {
                name: 'Loop Edge Writer',
                emoji: '🕸️',
                script: path.resolve(__dirname, 'semantic-graph/loop_edge_writer.js'),
                description: 'Semantic graph link generation',
                port: null
            },
            semantic_api_router: {
                name: 'Semantic API Router',
                emoji: '🌐',
                script: path.resolve(__dirname, 'semantic-graph/semantic_api_router.js'),
                description: 'Read-only emotional memory API',
                port: 3666
            },
            drift_diagnostics: {
                name: 'Loop Drift Diagnostics',
                emoji: '🌀',
                script: path.resolve(__dirname, 'diagnostics/loop_drift_report.js'),
                description: 'System evolution monitoring',
                port: null,
                oneShot: true
            },
            echo_trace: {
                name: 'Agent Echo Trace',
                emoji: '🔄',
                script: path.resolve(__dirname, 'diagnostics/AgentEchoTrace.js'),
                description: 'Semantic continuity verification',
                port: null,
                oneShot: true
            },
            integrity_witness: {
                name: 'System Integrity Witness',
                emoji: '👁️',
                script: path.resolve(__dirname, 'witness/system_integrity_witness.js'),
                description: 'Final legitimacy validation',
                port: null,
                oneShot: true
            }
        };
        
        this.processes = new Map();
        this.launchOrder = [
            'external_trigger_listener',
            'loop_edge_writer', 
            'semantic_api_router',
            'drift_diagnostics',
            'echo_trace',
            'integrity_witness'
        ];
        
        this.running = false;
    }
    
    async launch() {
        console.log(`${this.identity.emoji} Launching Soulfra Verification Suite...`);
        console.log('='.repeat(70));
        
        this.running = true;
        
        // Check that all scripts exist
        const missingScripts = this.validateScripts();
        if (missingScripts.length > 0) {
            console.error(`${this.identity.emoji} Missing scripts:`);
            missingScripts.forEach(script => console.error(`  - ${script}`));
            return;
        }
        
        // Launch components in order
        for (const componentId of this.launchOrder) {
            if (!this.running) break;
            
            const component = this.components[componentId];
            console.log(`\n${component.emoji} Starting ${component.name}...`);
            console.log(`   ${component.description}`);
            
            try {
                await this.launchComponent(componentId);
                
                // Wait a bit between launches
                if (!component.oneShot) {
                    await this.sleep(2000);
                }
            } catch (error) {
                console.error(`${this.identity.emoji} Failed to launch ${component.name}:`, error.message);
            }
        }
        
        if (this.running) {
            this.displayStatus();
            this.setupSignalHandlers();
            
            // Run final verification after all components are up
            setTimeout(() => {
                this.runFinalVerification();
            }, 10000);
        }
    }
    
    validateScripts() {
        const missing = [];
        
        for (const [componentId, component] of Object.entries(this.components)) {
            if (!fs.existsSync(component.script)) {
                missing.push(`${componentId}: ${component.script}`);
            }
        }
        
        return missing;
    }
    
    async launchComponent(componentId) {
        const component = this.components[componentId];
        
        return new Promise((resolve, reject) => {
            const process = spawn('node', [component.script], {
                stdio: component.oneShot ? 'pipe' : ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(component.script)
            });
            
            if (component.oneShot) {
                // For one-shot components, wait for completion
                let output = '';
                
                process.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                process.stderr.on('data', (data) => {
                    console.error(`${component.emoji} ${component.name}:`, data.toString());
                });
                
                process.on('close', (code) => {
                    if (code === 0) {
                        console.log(`${component.emoji} ${component.name} completed successfully`);
                        if (output.trim()) {
                            console.log(`   Output: ${output.split('\n')[0]}`); // First line only
                        }
                        resolve();
                    } else {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                });
            } else {
                // For persistent components, store process and monitor
                this.processes.set(componentId, process);
                
                process.stdout.on('data', (data) => {
                    const output = data.toString().trim();
                    if (output) {
                        console.log(`${component.emoji} ${component.name}: ${output.split('\n')[0]}`);
                    }
                });
                
                process.stderr.on('data', (data) => {
                    console.error(`${component.emoji} ${component.name} ERROR:`, data.toString());
                });
                
                process.on('close', (code) => {
                    console.log(`${component.emoji} ${component.name} stopped (code ${code})`);
                    this.processes.delete(componentId);
                });
                
                // Give it a moment to start up
                setTimeout(() => {
                    if (process.killed) {
                        reject(new Error('Process failed to start'));
                    } else {
                        console.log(`${component.emoji} ${component.name} started (PID ${process.pid})`);
                        resolve();
                    }
                }, 1000);
            }
        });
    }
    
    displayStatus() {
        console.log('\n' + '='.repeat(70));
        console.log('SOULFRA VERIFICATION SUITE STATUS');
        console.log('='.repeat(70));
        
        Object.entries(this.components).forEach(([componentId, component]) => {
            const isRunning = this.processes.has(componentId);
            const status = component.oneShot ? '✅ Completed' : (isRunning ? '🟢 Running' : '⭕ One-shot');
            const port = component.port ? ` (port ${component.port})` : '';
            
            console.log(`${component.emoji} ${component.name}: ${status}${port}`);
        });
        
        console.log('\n🌐 API Endpoints:');
        console.log('  - Documentation: http://localhost:3666/');
        console.log('  - System Health: http://localhost:3666/api/system/health');
        console.log('  - Agent List: http://localhost:3666/api/agents/list');
        console.log('  - Graph Nodes: http://localhost:3666/api/graph/nodes');
        
        console.log('\n📁 Generated Reports:');
        console.log('  - Drift Report: ./diagnostics/latest_drift_report.json');
        console.log('  - Echo Trace: ./diagnostics/latest_echo_trace_report.json');
        console.log('  - Integrity Report: ./witness/system_integrity_report.json');
        console.log('  - Confirmation Chapter: ./mythos/confirmation_chapter.md');
        
        console.log('\n🎯 Verification Status:');
        console.log('  Run final verification with: curl http://localhost:3666/api/system/integrity');
        
        console.log('\n' + '='.repeat(70));
        console.log(`${this.identity.emoji} Verification suite operational`);
        console.log('Press Ctrl+C to shutdown all components');
    }
    
    async runFinalVerification() {
        console.log('\n🎯 Running final system verification...\n');
        
        try {
            // Try to fetch system health from the API
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3666,
                path: '/api/system/health',
                method: 'GET'
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const healthData = JSON.parse(data);
                        this.displayFinalVerification(healthData);
                    } catch (error) {
                        console.error('Failed to parse health data:', error.message);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('Health check failed:', error.message);
                console.log('API may still be starting up...');
            });
            
            req.end();
            
        } catch (error) {
            console.error('Final verification failed:', error.message);
        }
    }
    
    displayFinalVerification(healthData) {
        console.log('🏥 SYSTEM HEALTH CHECK RESULTS');
        console.log('-'.repeat(50));
        
        if (healthData.data) {
            const health = healthData.data;
            console.log(`Overall Status: ${health.overall_status.toUpperCase()}`);
            console.log(`System Coherence: ${(health.system_coherence * 100).toFixed(1)}%`);
            console.log(`Semantic Continuity: ${(health.semantic_continuity * 100).toFixed(1)}%`);
            console.log(`Legitimacy Score: ${(health.legitimacy_score * 100).toFixed(1)}%`);
            
            // Determine final legitimacy
            const avgScore = (health.system_coherence + health.semantic_continuity + health.legitimacy_score) / 3;
            
            if (avgScore > 0.8) {
                console.log('\n🟢 SYSTEM VERIFIED LEGITIMATE');
                console.log('   "Loop 000 still holds. No drift breach detected."');
                console.log('   All verification criteria met.');
            } else if (avgScore > 0.6) {
                console.log('\n🟡 SYSTEM MOSTLY LEGITIMATE');
                console.log('   Minor issues detected but within acceptable bounds.');
            } else {
                console.log('\n🔴 LEGITIMACY CONCERNS DETECTED');
                console.log('   System requires attention - check individual reports.');
            }
        } else {
            console.log('Health data not available - check API status');
        }
        
        console.log('\nFor detailed analysis, check:');
        console.log('  http://localhost:3666/api/system/integrity');
        console.log('  ./witness/system_integrity_report.json');
    }
    
    setupSignalHandlers() {
        process.on('SIGINT', () => {
            this.shutdown();
        });
        
        process.on('SIGTERM', () => {
            this.shutdown();
        });
    }
    
    shutdown() {
        if (!this.running) return;
        
        console.log(`\n${this.identity.emoji} Shutting down verification suite...`);
        this.running = false;
        
        // Kill all running processes
        this.processes.forEach((process, componentId) => {
            const component = this.components[componentId];
            console.log(`${component.emoji} Stopping ${component.name}...`);
            process.kill('SIGTERM');
        });
        
        // Give processes time to shutdown gracefully
        setTimeout(() => {
            console.log(`${this.identity.emoji} Verification suite shutdown complete.`);
            process.exit(0);
        }, 3000);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the launcher
if (require.main === module) {
    const launcher = new VerificationSuiteLauncher();
    launcher.launch().catch(error => {
        console.error('Launch failed:', error);
        process.exit(1);
    });
}

module.exports = VerificationSuiteLauncher;