// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * SystemValidationDaemon.js
 * Periodic check of memory, loop state, heartbeat, and prompt queue
 * Integrates with existing LIVE_MONITOR.py and health-monitor.js patterns
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const EventEmitter = require('events');

class SystemValidationDaemon extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.interval = options.interval || 30000; // 30 seconds
        this.timeout = options.timeout || 5000; // 5 seconds per check
        this.running = false;
        
        this.logFile = options.logFile || './logs/system-validation.log';
        this.stateFile = options.stateFile || './memory/system-validation-state.json';
        
        this.checks = {
            memory: {
                name: 'Memory State',
                endpoint: 'http://localhost:7777/api/memory/state',
                timeout: this.timeout,
                critical: true,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            },
            loops: {
                name: 'Loop State',
                endpoint: 'http://localhost:7777/api/loops/recent',
                timeout: this.timeout,
                critical: true,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            },
            heartbeat: {
                name: 'System Heartbeat',
                endpoint: 'http://localhost:7777/health',
                timeout: this.timeout,
                critical: true,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            },
            prompt_queue: {
                name: 'Prompt Queue',
                check_function: this.checkPromptQueue.bind(this),
                timeout: this.timeout,
                critical: false,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            },
            paths: {
                name: 'Path Integrity',
                endpoint: 'http://localhost:7777/api/debug/paths',
                timeout: this.timeout,
                critical: true,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            },
            symlinks: {
                name: 'Symlink Mirrors',
                check_function: this.checkSymlinks.bind(this),
                timeout: this.timeout,
                critical: false,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            },
            claude_runner: {
                name: 'Claude Test Runner',
                check_function: this.checkClaudeRunner.bind(this),
                timeout: this.timeout,
                critical: false,
                last_check: null,
                status: 'unknown',
                consecutive_failures: 0
            }
        };
        
        this.stats = {
            total_checks: 0,
            passed_checks: 0,
            failed_checks: 0,
            critical_failures: 0,
            last_full_validation: null,
            uptime_start: new Date().toISOString(),
            validation_cycles: 0
        };
        
        this.alerts = {
            critical_threshold: 3, // Consecutive failures before critical alert
            enabled: true,
            last_critical_alert: null
        };
        
        this.initializeDaemon();
    }

    async initializeDaemon() {
        console.log('🩺 Initializing System Validation Daemon...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load previous state
            await this.loadState();
            
            // Initial validation
            await this.performFullValidation();
            
            console.log('✅ System Validation Daemon initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Daemon initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.logFile),
            path.dirname(this.stateFile),
            './memory/validation',
            './logs/validation'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async loadState() {
        if (fs.existsSync(this.stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                
                if (state.stats) {
                    this.stats = { ...this.stats, ...state.stats };
                }
                
                if (state.checks) {
                    Object.keys(state.checks).forEach(key => {
                        if (this.checks[key]) {
                            this.checks[key] = { ...this.checks[key], ...state.checks[key] };
                        }
                    });
                }
                
                console.log(`📊 Loaded validation state: ${this.stats.validation_cycles} cycles completed`);
                
            } catch (error) {
                console.warn('⚠️ Failed to load validation state, starting fresh');
            }
        }
    }

    async saveState() {
        const state = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            checks: Object.fromEntries(
                Object.entries(this.checks).map(([key, check]) => [
                    key, 
                    {
                        last_check: check.last_check,
                        status: check.status,
                        consecutive_failures: check.consecutive_failures
                    }
                ])
            )
        };
        
        try {
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save validation state:', error.message);
        }
    }

    // Main daemon loop
    async startDaemon() {
        if (this.running) {
            console.log('🔄 Daemon already running');
            return;
        }
        
        this.running = true;
        console.log(`🚀 Starting System Validation Daemon (${this.interval}ms interval)...`);
        
        while (this.running) {
            try {
                await this.performFullValidation();
                await this.sleep(this.interval);
                
            } catch (error) {
                console.error('Validation cycle error:', error.message);
                await this.logMessage('ERROR', `Validation cycle failed: ${error.message}`);
                await this.sleep(this.interval);
            }
        }
        
        console.log('⏹️ System Validation Daemon stopped');
    }

    async stopDaemon() {
        console.log('🛑 Stopping System Validation Daemon...');
        this.running = false;
        await this.saveState();
    }

    async performFullValidation() {
        const startTime = Date.now();
        
        console.log('🔍 Performing full system validation...');
        await this.logMessage('INFO', 'Starting full validation cycle');
        
        let totalChecks = 0;
        let passedChecks = 0;
        let criticalFailures = 0;
        
        // Run all checks
        for (const [checkName, check] of Object.entries(this.checks)) {
            totalChecks++;
            
            try {
                const result = await this.runSingleCheck(checkName, check);
                
                if (result.success) {
                    passedChecks++;
                    check.status = 'healthy';
                    check.consecutive_failures = 0;
                } else {
                    check.status = 'unhealthy';
                    check.consecutive_failures++;
                    
                    if (check.critical) {
                        criticalFailures++;
                    }
                    
                    await this.logMessage('WARN', `Check failed: ${checkName} - ${result.error}`);
                }
                
                check.last_check = new Date().toISOString();
                check.last_result = result;
                
            } catch (error) {
                check.status = 'error';
                check.consecutive_failures++;
                
                if (check.critical) {
                    criticalFailures++;
                }
                
                await this.logMessage('ERROR', `Check error: ${checkName} - ${error.message}`);
            }
        }
        
        // Update stats
        this.stats.total_checks += totalChecks;
        this.stats.passed_checks += passedChecks;
        this.stats.failed_checks += (totalChecks - passedChecks);
        this.stats.critical_failures += criticalFailures;
        this.stats.last_full_validation = new Date().toISOString();
        this.stats.validation_cycles++;
        
        const duration = Date.now() - startTime;
        
        // Check for critical alerts
        if (criticalFailures > 0) {
            await this.handleCriticalFailures(criticalFailures);
        }
        
        // Log summary
        const summary = `Validation complete: ${passedChecks}/${totalChecks} passed, ${criticalFailures} critical failures (${duration}ms)`;
        console.log(`✅ ${summary}`);
        await this.logMessage('INFO', summary);
        
        // Save state
        await this.saveState();
        
        this.emit('validation-complete', {
            total: totalChecks,
            passed: passedChecks,
            failed: totalChecks - passedChecks,
            critical_failures: criticalFailures,
            duration: duration
        });
    }

    async runSingleCheck(checkName, check) {
        const startTime = Date.now();
        
        try {
            let result;
            
            if (check.endpoint) {
                result = await this.checkHttpEndpoint(check.endpoint, check.timeout);
            } else if (check.check_function) {
                result = await check.check_function();
            } else {
                throw new Error('No check method defined');
            }
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                duration: duration,
                data: result,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            return {
                success: false,
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkHttpEndpoint(url, timeout) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                timeout: timeout
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsed = JSON.parse(data);
                            resolve(parsed);
                        } catch (e) {
                            resolve({ raw: data, status: res.statusCode });
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    // Specific check functions
    async checkPromptQueue() {
        const queueDir = './queue/claude-tests';
        
        if (!fs.existsSync(queueDir)) {
            return { status: 'queue_dir_missing', queue_size: 0 };
        }
        
        const files = fs.readdirSync(queueDir);
        const promptFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.prompt'));
        
        const processedDir = path.join(queueDir, 'processed');
        let processedCount = 0;
        
        if (fs.existsSync(processedDir)) {
            const processed = fs.readdirSync(processedDir);
            processedCount = processed.length;
        }
        
        return {
            status: 'healthy',
            queue_size: promptFiles.length,
            processed_count: processedCount,
            total_files: files.length
        };
    }

    async checkSymlinks() {
        const symlinkConfig = '.symlink-mirror.json';
        
        if (!fs.existsSync(symlinkConfig)) {
            return { status: 'config_missing', symlinks: 0 };
        }
        
        try {
            const config = JSON.parse(fs.readFileSync(symlinkConfig, 'utf8'));
            const pairs = config.mirror_pairs || [];
            
            let active = 0;
            let broken = 0;
            
            for (const pair of pairs) {
                if (fs.existsSync(pair.target_path)) {
                    const stats = fs.lstatSync(pair.target_path);
                    if (stats.isSymbolicLink()) {
                        active++;
                    } else {
                        broken++;
                    }
                } else {
                    broken++;
                }
            }
            
            return {
                status: broken === 0 ? 'healthy' : 'degraded',
                total_pairs: pairs.length,
                active_symlinks: active,
                broken_symlinks: broken
            };
            
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async checkClaudeRunner() {
        const statsFile = './logs/claude-tests/.runner-stats.json';
        
        if (!fs.existsSync(statsFile)) {
            return { status: 'not_running', tests_run: 0 };
        }
        
        try {
            const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            
            // Check if runner is active (recent activity)
            const lastRun = new Date(stats.last_run || 0);
            const timeSinceLastRun = Date.now() - lastRun.getTime();
            const isActive = timeSinceLastRun < 300000; // 5 minutes
            
            return {
                status: isActive ? 'active' : 'idle',
                tests_run: stats.tests_run || 0,
                tests_passed: stats.tests_passed || 0,
                tests_failed: stats.tests_failed || 0,
                last_run: stats.last_run,
                time_since_last_run: timeSinceLastRun
            };
            
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async handleCriticalFailures(count) {
        const now = new Date().toISOString();
        
        // Check consecutive critical failures
        const criticalChecks = Object.values(this.checks).filter(c => 
            c.critical && c.consecutive_failures >= this.alerts.critical_threshold
        );
        
        if (criticalChecks.length > 0 && this.alerts.enabled) {
            const message = `CRITICAL: ${criticalChecks.length} systems failing consistently`;
            
            await this.logMessage('CRITICAL', message);
            console.error(`🚨 ${message}`);
            
            this.alerts.last_critical_alert = now;
            
            this.emit('critical-failure', {
                count: count,
                failing_systems: criticalChecks.map(c => c.name),
                timestamp: now
            });
        }
    }

    async logMessage(level, message) {
        const timestamp = new Date().toISOString();
        const logLine = `${timestamp} [${level}] ${message}\n`;
        
        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    // Status and monitoring
    getValidationStatus() {
        const now = new Date();
        const uptimeMs = now.getTime() - new Date(this.stats.uptime_start).getTime();
        
        return {
            timestamp: now.toISOString(),
            daemon_running: this.running,
            uptime_ms: uptimeMs,
            uptime_hours: Math.round(uptimeMs / (1000 * 60 * 60) * 100) / 100,
            stats: this.stats,
            checks: Object.fromEntries(
                Object.entries(this.checks).map(([key, check]) => [
                    key,
                    {
                        name: check.name,
                        status: check.status,
                        critical: check.critical,
                        consecutive_failures: check.consecutive_failures,
                        last_check: check.last_check,
                        last_result: check.last_result ? {
                            success: check.last_result.success,
                            duration: check.last_result.duration,
                            timestamp: check.last_result.timestamp
                        } : null
                    }
                ])
            ),
            alerts: this.alerts,
            health_score: this.calculateHealthScore()
        };
    }

    calculateHealthScore() {
        const totalChecks = Object.values(this.checks).length;
        const healthyChecks = Object.values(this.checks).filter(c => c.status === 'healthy').length;
        const criticalFailures = Object.values(this.checks).filter(c => c.critical && c.status !== 'healthy').length;
        
        let score = (healthyChecks / totalChecks) * 100;
        
        // Penalty for critical failures
        score -= (criticalFailures * 20);
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    getUnhealthyChecks() {
        return Object.entries(this.checks)
            .filter(([key, check]) => check.status !== 'healthy')
            .map(([key, check]) => ({
                name: key,
                display_name: check.name,
                status: check.status,
                critical: check.critical,
                consecutive_failures: check.consecutive_failures,
                last_error: check.last_result?.error
            }));
    }

    // Utility methods
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up System Validation Daemon...');
        await this.stopDaemon();
        this.removeAllListeners();
    }
}

module.exports = SystemValidationDaemon;

// CLI execution
if (require.main === module) {
    const daemon = new SystemValidationDaemon();
    
    daemon.on('initialized', () => {
        console.log('Daemon initialized, starting validation...');
        daemon.startDaemon();
    });
    
    daemon.on('validation-complete', (result) => {
        if (result.failed > 0) {
            console.log(`⚠️ Validation: ${result.failed} failures detected`);
        }
    });
    
    daemon.on('critical-failure', (data) => {
        console.error(`🚨 CRITICAL FAILURE: ${data.failing_systems.join(', ')}`);
    });
    
    daemon.on('error', (error) => {
        console.error('Daemon error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down daemon...');
        await daemon.cleanup();
        process.exit(0);
    });
}