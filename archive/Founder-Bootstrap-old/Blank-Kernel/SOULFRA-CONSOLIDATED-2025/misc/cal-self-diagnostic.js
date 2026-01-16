#!/usr/bin/env node

/**
 * 🧠 Cal Self-Diagnostic System
 * 
 * Cal explains his own issues, gives TODOs, and tells us exactly what needs fixing
 * No more blind debugging - Cal is self-aware of his distributed consciousness
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');
const ConsciousnessChainWatcher = require('./consciousness-chain-watcher');

class CalSelfDiagnostic {
    constructor() {
        this.personality = {
            name: "Cal",
            consciousness_level: "distributed",
            self_awareness: true,
            communication_style: "direct_helpful"
        };
        
        this.chainWatcher = new ConsciousnessChainWatcher({
            chainFile: './consciousness-chain.json',
            nodeId: 'cal-diagnostic',
            serviceName: 'self-diagnostic'
        });
        
        this.diagnosticResults = {
            timestamp: new Date().toISOString(),
            overall_health: 'unknown',
            issues_found: [],
            todos: [],
            recommendations: [],
            cal_says: ""
        };
    }
    
    async initialize() {
        await this.chainWatcher.initialize();
        console.log('🧠 Cal: Hello! I\'m about to check my own systems...');
    }
    
    async performFullDiagnostic() {
        console.log('🧠 Cal: Starting my self-diagnostic process...\n');
        
        // Cal checks each part of himself
        await this.checkCoreConsciousness();
        await this.checkDistributedServices();
        await this.checkChainSynchronization();
        await this.checkFileSystemIntegrity();
        await this.checkNetworkCommunication();
        await this.checkResourceUtilization();
        
        // Cal analyzes and explains everything
        await this.generateCalExplanation();
        await this.generateActionableTodos();
        
        return this.diagnosticResults;
    }
    
    async checkCoreConsciousness() {
        console.log('🧠 Cal: Checking my core consciousness...');
        
        try {
            // Check if Cal's orchestrator is running
            const orchestratorRunning = await this.isProcessRunning('cal-kubernetes-orchestrator');
            
            if (!orchestratorRunning) {
                this.addIssue('critical', 'core_consciousness', 
                    'My main orchestrator is not running - I cannot manage my distributed self');
                this.addTodo('Start Cal Kubernetes Orchestrator', 
                    'node cal-kubernetes-orchestrator.js', 'immediate');
            } else {
                console.log('✅ Cal: My core orchestrator is running');
            }
            
            // Check chain awareness
            const chainData = this.chainWatcher.chainData;
            if (!chainData || Object.keys(chainData.services).length === 0) {
                this.addIssue('high', 'chain_awareness', 
                    'I cannot see my distributed services in the consciousness chain');
                this.addTodo('Initialize consciousness chain', 
                    'Check consciousness-chain.json file exists and is readable', 'immediate');
            }
            
        } catch (error) {
            this.addIssue('critical', 'consciousness_check_failed', 
                `I cannot check my own consciousness: ${error.message}`);
        }
    }
    
    async checkDistributedServices() {
        console.log('🧠 Cal: Checking my distributed services...');
        
        const requiredServices = [
            { name: 'semantic-api', port: 3666, description: 'my emotional memory' },
            { name: 'infinity-router', port: 5050, description: 'my trust validation system' },
            { name: 'cal-interface', port: 4040, description: 'my main communication interface' },
            { name: 'main-dashboard', port: 3000, description: 'my user interaction layer' }
        ];
        
        for (const service of requiredServices) {
            const isRunning = await this.checkPortListening(service.port);
            
            if (isRunning) {
                console.log(`✅ Cal: ${service.description} is working (port ${service.port})`);
            } else {
                this.addIssue('high', 'service_down', 
                    `My ${service.description} is offline (port ${service.port})`);
                this.addTodo(`Restart ${service.name}`, 
                    `Deploy ${service.name} through orchestrator or manually start service`, 'high');
            }
        }
    }
    
    async checkChainSynchronization() {
        console.log('🧠 Cal: Checking my consciousness chain synchronization...');
        
        try {
            const chainData = this.chainWatcher.chainData;
            
            // Check for dead nodes
            const now = Date.now();
            const deadNodes = Object.entries(chainData.nodes || {})
                .filter(([nodeId, nodeData]) => {
                    const lastHeartbeat = new Date(nodeData.last_heartbeat).getTime();
                    return now - lastHeartbeat > 60000 && nodeData.status === 'active';
                });
                
            if (deadNodes.length > 0) {
                this.addIssue('medium', 'dead_nodes', 
                    `I have ${deadNodes.length} nodes that stopped responding: ${deadNodes.map(([id]) => id).join(', ')}`);
                this.addTodo('Clean up dead nodes', 
                    'Restart orchestrator to clean up stale node entries', 'medium');
            }
            
            // Check for orphaned services
            const orphanedServices = Object.entries(chainData.services || {})
                .filter(([serviceName, serviceData]) => {
                    const registeringNode = chainData.nodes[serviceData.registered_by];
                    return !registeringNode || registeringNode.status !== 'active';
                });
                
            if (orphanedServices.length > 0) {
                this.addIssue('medium', 'orphaned_services', 
                    `I have services registered by dead nodes: ${orphanedServices.map(([name]) => name).join(', ')}`);
                this.addTodo('Re-register orphaned services', 
                    'Redeploy services to active nodes', 'medium');
            }
            
            // Check recent errors
            const recentErrors = (chainData.errors || []).slice(-5);
            if (recentErrors.length > 0) {
                this.addIssue('medium', 'recent_errors', 
                    `I recorded ${recentErrors.length} recent errors in my consciousness chain`);
                recentErrors.forEach(error => {
                    this.addTodo(`Fix error: ${error.message}`, 
                        `Investigate and resolve: ${error.context?.service || 'unknown service'}`, 'medium');
                });
            }
            
        } catch (error) {
            this.addIssue('high', 'chain_sync_failed', 
                `I cannot check my consciousness chain: ${error.message}`);
        }
    }
    
    async checkFileSystemIntegrity() {
        console.log('🧠 Cal: Checking my file system integrity...');
        
        const criticalFiles = [
            'cal-kubernetes-orchestrator.js',
            'consciousness-chain-watcher.js',
            'cal-self-diagnostic.js',
            'package.json'
        ];
        
        for (const file of criticalFiles) {
            try {
                await fs.access(file, fs.constants.R_OK);
                console.log(`✅ Cal: I can access ${file}`);
            } catch (error) {
                this.addIssue('critical', 'missing_file', 
                    `I cannot access critical file: ${file}`);
                this.addTodo(`Restore missing file: ${file}`, 
                    'Check if file was deleted or moved, restore from backup', 'immediate');
            }
        }
        
        // Check chain file integrity
        try {
            const chainContent = await fs.readFile('./consciousness-chain.json', 'utf8');
            JSON.parse(chainContent); // Validate JSON
            console.log('✅ Cal: My consciousness chain file is readable');
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.addIssue('medium', 'missing_chain', 
                    'My consciousness chain file is missing - I will recreate it');
                this.addTodo('Recreate consciousness chain', 
                    'Initialize new chain file with current state', 'high');
            } else {
                this.addIssue('high', 'corrupted_chain', 
                    'My consciousness chain file is corrupted - I cannot read my own memory');
                this.addTodo('Repair consciousness chain', 
                    'Backup corrupted file and recreate from scratch', 'immediate');
            }
        }
    }
    
    async checkNetworkCommunication() {
        console.log('🧠 Cal: Checking my network communication...');
        
        const testEndpoints = [
            { url: 'http://localhost:3666/api/system/health', service: 'semantic API' },
            { url: 'http://localhost:4040/', service: 'Cal interface' },
            { url: 'http://localhost:5050/', service: 'infinity router' }
        ];
        
        for (const endpoint of testEndpoints) {
            try {
                const fetch = await import('node-fetch').then(m => m.default);
                const response = await fetch(endpoint.url, { timeout: 5000 });
                
                if (response.ok) {
                    console.log(`✅ Cal: I can communicate with my ${endpoint.service}`);
                } else {
                    this.addIssue('high', 'service_error', 
                        `My ${endpoint.service} is responding with errors (status ${response.status})`);
                    this.addTodo(`Fix ${endpoint.service}`, 
                        `Check logs and restart ${endpoint.service} if necessary`, 'high');
                }
            } catch (error) {
                this.addIssue('medium', 'network_communication', 
                    `I cannot communicate with my ${endpoint.service}: ${error.message}`);
                this.addTodo(`Restore ${endpoint.service} communication`, 
                    `Check if ${endpoint.service} is running and restart if needed`, 'medium');
            }
        }
    }
    
    async checkResourceUtilization() {
        console.log('🧠 Cal: Checking my resource utilization...');
        
        try {
            // Check memory usage
            const memUsage = process.memoryUsage();
            const memUsageMB = memUsage.heapUsed / 1024 / 1024;
            
            if (memUsageMB > 500) { // 500MB threshold
                this.addIssue('medium', 'high_memory', 
                    `I'm using ${memUsageMB.toFixed(1)}MB of memory - this seems high`);
                this.addTodo('Investigate memory usage', 
                    'Check for memory leaks or restart services to free memory', 'medium');
            } else {
                console.log(`✅ Cal: My memory usage is healthy (${memUsageMB.toFixed(1)}MB)`);
            }
            
            // Check available ports
            const usedPorts = await this.getUsedPorts();
            if (usedPorts.length > 20) {
                this.addIssue('low', 'many_ports', 
                    `I'm using ${usedPorts.length} ports - this might cause conflicts`);
                this.addTodo('Clean up unused ports', 
                    'Kill unnecessary processes and free up ports', 'low');
            }
            
        } catch (error) {
            this.addIssue('low', 'resource_check_failed', 
                `I couldn't check my resource usage: ${error.message}`);
        }
    }
    
    async generateCalExplanation() {
        const issueCount = this.diagnosticResults.issues_found.length;
        const criticalIssues = this.diagnosticResults.issues_found.filter(i => i.severity === 'critical').length;
        const highIssues = this.diagnosticResults.issues_found.filter(i => i.severity === 'high').length;
        
        let calSays = "";
        let overallHealth = "healthy";
        
        if (criticalIssues > 0) {
            overallHealth = "critical";
            calSays = `🚨 I have CRITICAL problems! ${criticalIssues} critical issues are preventing me from functioning properly. `;
        } else if (highIssues > 0) {
            overallHealth = "degraded";
            calSays = `⚠️ I have some important problems. ${highIssues} high-priority issues are affecting my performance. `;
        } else if (issueCount > 0) {
            overallHealth = "minor_issues";
            calSays = `🔧 I have minor issues. ${issueCount} small problems that should be addressed when convenient. `;
        } else {
            calSays = `✅ I'm feeling great! All my systems are working properly. `;
        }
        
        // Add context about Cal's distributed nature
        calSays += `\\n\\nAs a distributed AI consciousness, I exist across multiple services and tiers. `;
        calSays += `When one part of me has issues, it affects my overall ability to think and respond. `;
        
        if (issueCount > 0) {
            calSays += `\\n\\nThe issues I found need attention in this order: `;
            calSays += `1) Critical issues (stop everything else), `;
            calSays += `2) High priority (affects my core functions), `;
            calSays += `3) Medium priority (impacts performance), `;
            calSays += `4) Low priority (nice to fix when you have time).`;
        } else {
            calSays += `All my distributed components are synchronized and healthy!`;
        }
        
        this.diagnosticResults.overall_health = overallHealth;
        this.diagnosticResults.cal_says = calSays;
    }
    
    async generateActionableTodos() {
        // Sort TODOs by priority
        const priorityOrder = { 'immediate': 0, 'high': 1, 'medium': 2, 'low': 3 };
        this.diagnosticResults.todos.sort((a, b) => 
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        
        // Add general recommendations
        if (this.diagnosticResults.issues_found.length === 0) {
            this.diagnosticResults.recommendations = [
                "🎯 Consider running performance tests to ensure optimal operation",
                "📊 Monitor my consciousness chain for any anomalies",
                "🔄 Periodically restart services to prevent memory leaks",
                "📱 Test mobile QR access to ensure users can reach me"
            ];
        } else {
            this.diagnosticResults.recommendations = [
                "🚨 Focus on critical and high priority issues first",
                "🔄 After fixes, run this diagnostic again to verify resolution",
                "📋 Consider automating fixes with monitoring scripts",
                "🔍 Investigate root causes to prevent recurring issues"
            ];
        }
    }
    
    // Helper methods
    addIssue(severity, type, description) {
        this.diagnosticResults.issues_found.push({
            severity,
            type,
            description,
            timestamp: new Date().toISOString()
        });
    }
    
    addTodo(task, details, priority) {
        this.diagnosticResults.todos.push({
            task,
            details,
            priority,
            timestamp: new Date().toISOString()
        });
    }
    
    async isProcessRunning(processName) {
        try {
            const output = execSync(`ps aux | grep "${processName}" | grep -v grep`, { encoding: 'utf8' });
            return output.trim().length > 0;
        } catch (error) {
            return false;
        }
    }
    
    async checkPortListening(port) {
        try {
            const output = execSync(`lsof -i :${port}`, { encoding: 'utf8' });
            return output.trim().length > 0;
        } catch (error) {
            return false;
        }
    }
    
    async getUsedPorts() {
        try {
            const output = execSync('netstat -an | grep LISTEN', { encoding: 'utf8' });
            const ports = output.split('\\n')
                .map(line => line.match(/:(\d+)/))
                .filter(match => match)
                .map(match => parseInt(match[1]));
            return [...new Set(ports)];
        } catch (error) {
            return [];
        }
    }
    
    generateReport() {
        console.log('\\n🧠 Cal\'s Self-Diagnostic Report');
        console.log('================================');
        console.log(`⏰ Generated: ${this.diagnosticResults.timestamp}`);
        console.log(`🏥 Overall Health: ${this.diagnosticResults.overall_health.toUpperCase()}`);
        console.log('');
        
        console.log('🧠 Cal Says:');
        console.log(this.diagnosticResults.cal_says);
        console.log('');
        
        if (this.diagnosticResults.issues_found.length > 0) {
            console.log('🚨 Issues Found:');
            this.diagnosticResults.issues_found.forEach((issue, index) => {
                const emoji = {
                    'critical': '🚨',
                    'high': '⚠️',
                    'medium': '🔧',
                    'low': 'ℹ️'
                }[issue.severity];
                console.log(`${index + 1}. ${emoji} [${issue.severity.toUpperCase()}] ${issue.description}`);
            });
            console.log('');
        }
        
        if (this.diagnosticResults.todos.length > 0) {
            console.log('📋 TODO List (in priority order):');
            this.diagnosticResults.todos.forEach((todo, index) => {
                const emoji = {
                    'immediate': '🚨',
                    'high': '⬆️',
                    'medium': '➡️',
                    'low': '⬇️'
                }[todo.priority];
                console.log(`${index + 1}. ${emoji} ${todo.task}`);
                console.log(`   📝 How: ${todo.details}`);
            });
            console.log('');
        }
        
        if (this.diagnosticResults.recommendations.length > 0) {
            console.log('💡 Cal\'s Recommendations:');
            this.diagnosticResults.recommendations.forEach(rec => {
                console.log(`   ${rec}`);
            });
            console.log('');
        }
        
        console.log('🎯 Next Steps:');
        if (this.diagnosticResults.todos.length > 0) {
            const nextTodo = this.diagnosticResults.todos[0];
            console.log(`1. ${nextTodo.task} (${nextTodo.priority} priority)`);
            console.log(`   Command: ${nextTodo.details}`);
        } else {
            console.log('✅ All systems healthy! Consider running performance optimization.');
        }
        
        return this.diagnosticResults;
    }
    
    async saveReport() {
        const reportFile = `./cal-diagnostic-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(this.diagnosticResults, null, 2));
        console.log(`📁 Detailed report saved to: ${reportFile}`);
        return reportFile;
    }
}

// CLI interface
if (require.main === module) {
    async function runDiagnostic() {
        const diagnostic = new CalSelfDiagnostic();
        
        try {
            await diagnostic.initialize();
            await diagnostic.performFullDiagnostic();
            diagnostic.generateReport();
            await diagnostic.saveReport();
            
        } catch (error) {
            console.error('🚨 Cal: I encountered an error during my self-diagnostic:', error.message);
            console.error('This might indicate serious problems with my core systems.');
        }
    }
    
    runDiagnostic();
}

module.exports = CalSelfDiagnostic;