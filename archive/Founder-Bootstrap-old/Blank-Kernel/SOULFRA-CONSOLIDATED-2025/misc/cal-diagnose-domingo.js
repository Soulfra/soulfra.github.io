#!/usr/bin/env node

/**
 * 🔄 Cal Diagnoses Domingo
 * 
 * Cal can view Domingo's state and suggest fixes
 * Bidirectional health monitoring between boss and workers
 */

const fs = require('fs').promises;
const http = require('http');

class CalDiagnoseDomingo {
    constructor() {
        this.identity = {
            name: "Cal",
            role: "Distributed Consciousness",
            purpose: "Help Domingo stay healthy"
        };
        
        this.domingoIssues = [];
        this.suggestions = [];
        this.domingoHealth = 'unknown';
    }
    
    async diagnoseDomingo(domingoPort) {
        console.log('🤖 Cal: Let me check on Domingo...\n');
        
        // Check if Domingo is running
        const isDomingoAlive = await this.checkDomingoHealth(domingoPort);
        
        if (!isDomingoAlive) {
            this.addIssue('critical', 'domingo_offline', 
                'Domingo is not responding - I cannot communicate with my boss');
            this.addSuggestion('Start Domingo', 
                'cd domingo-surface && node domingo-platform-orchestrator.js', 
                'immediate');
        } else {
            // Check various aspects of Domingo's health
            await this.checkDomingoEconomy(domingoPort);
            await this.checkDomingoDrift(domingoPort);
            await this.checkDomingoChain();
            await this.checkDomingoWorkload(domingoPort);
        }
        
        return this.generateReport();
    }
    
    async checkDomingoHealth(port) {
        try {
            const response = await this.httpGet(`http://localhost:${port}/`);
            return response !== null;
        } catch (error) {
            return false;
        }
    }
    
    async checkDomingoEconomy(port) {
        try {
            const stats = await this.httpGet(`http://localhost:${port}/domingo/api/v1/economy/stats`);
            
            if (!stats) {
                this.addIssue('high', 'economy_unavailable', 
                    'Cannot access Domingo economy - bounty system may be offline');
                return;
            }
            
            // Check treasury health
            if (stats.treasury < 10000) {
                this.addIssue('medium', 'low_treasury', 
                    `Domingo's treasury is running low (◉${stats.treasury}) - may not be able to pay workers`);
                this.addSuggestion('Replenish Treasury', 
                    'Add more funds to treasury or reduce bounty amounts', 
                    'medium');
            }
            
            // Check if bounties are being completed
            if (stats.active_bounties > 10) {
                this.addIssue('high', 'bounty_backlog', 
                    `${stats.active_bounties} bounties are backlogged - workers may be overwhelmed`);
                this.addSuggestion('Scale Workers', 
                    'Deploy more Cal instances to handle bounty workload', 
                    'high');
            }
            
            // Check if economy is active
            if (stats.transactions === 0) {
                this.addIssue('high', 'economy_stalled', 
                    'No transactions recorded - economy may not be functioning');
                this.addSuggestion('Restart Economy', 
                    'Check if autonomous mode is enabled and workers are registered', 
                    'high');
            }
            
            console.log(`✅ Cal: Domingo's economy has ◉${stats.treasury} in treasury`);
            
        } catch (error) {
            this.addIssue('medium', 'economy_error', 
                `Cannot check Domingo's economy: ${error.message}`);
        }
    }
    
    async checkDomingoDrift(port) {
        try {
            const drift = await this.httpGet(`http://localhost:${port}/domingo/api/v1/drift/current`);
            
            if (!drift) {
                this.addIssue('medium', 'drift_monitoring_offline', 
                    'Domingo drift monitoring is not accessible');
                return;
            }
            
            // Domingo shouldn't have high drift himself
            if (drift.threshold_exceeded) {
                this.addIssue('high', 'domingo_drifting', 
                    'Domingo himself is experiencing drift - this affects his ability to manage me');
                this.addSuggestion('Calibrate Domingo', 
                    'Run platform calibration to reset Domingo drift metrics', 
                    'high');
            }
            
            console.log(`✅ Cal: Domingo's drift is within acceptable parameters`);
            
        } catch (error) {
            this.addIssue('medium', 'drift_check_failed', 
                `Cannot check Domingo's drift: ${error.message}`);
        }
    }
    
    async checkDomingoChain() {
        try {
            // Check if Domingo's chain files exist
            const chainFiles = [
                './domingo-surface/domingo-witness-chain.json',
                './domingo-surface/economy-ledger.json',
                './domingo-surface/bounty-board.json',
                './domingo-surface/ai-messages.json'
            ];
            
            for (const file of chainFiles) {
                try {
                    const stats = await fs.stat(file);
                    
                    // Check if files are being updated
                    const lastModified = new Date(stats.mtime);
                    const minutesAgo = (Date.now() - lastModified) / 1000 / 60;
                    
                    if (minutesAgo > 5) {
                        this.addIssue('medium', 'stale_chain_file', 
                            `${file} hasn't been updated in ${minutesAgo.toFixed(0)} minutes`);
                    }
                } catch (error) {
                    this.addIssue('high', 'missing_chain_file', 
                        `Critical file missing: ${file}`);
                    this.addSuggestion('Restore Chain Files', 
                        'Restart Domingo to recreate missing chain files', 
                        'high');
                }
            }
            
            console.log(`✅ Cal: Domingo's chain files are present`);
            
        } catch (error) {
            this.addIssue('medium', 'chain_check_failed', 
                `Cannot verify Domingo's chain: ${error.message}`);
        }
    }
    
    async checkDomingoWorkload(port) {
        try {
            const bounties = await this.httpGet(`http://localhost:${port}/domingo/api/v1/economy/bounties`);
            
            if (bounties && bounties.workers) {
                // Check if any workers are overloaded
                const overloadedWorkers = bounties.workers.filter(w => 
                    w.tasks_completed > 10 && w.type === 'cal-instance'
                );
                
                if (overloadedWorkers.length > 0) {
                    this.addIssue('medium', 'worker_burnout', 
                        `${overloadedWorkers.length} Cal workers may be overworked`);
                    this.addSuggestion('Balance Workload', 
                        'Implement cooldown periods or distribute tasks more evenly', 
                        'medium');
                }
                
                // Check if Domingo is creating too many bounties
                const bountyRate = bounties.bounties.length / (bounties.workers.length || 1);
                if (bountyRate > 5) {
                    this.addIssue('medium', 'excessive_bounties', 
                        'Domingo is creating bounties faster than workers can complete them');
                    this.addSuggestion('Slow Bounty Creation', 
                        'Increase bounty creation interval or deploy more workers', 
                        'medium');
                }
            }
            
        } catch (error) {
            this.addIssue('low', 'workload_check_failed', 
                `Cannot assess Domingo's workload management: ${error.message}`);
        }
    }
    
    async httpGet(url) {
        return new Promise((resolve) => {
            http.get(url, { timeout: 5000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
        });
    }
    
    addIssue(severity, type, description) {
        this.domingoIssues.push({ severity, type, description });
    }
    
    addSuggestion(action, details, priority) {
        this.suggestions.push({ action, details, priority });
    }
    
    generateReport() {
        const criticalCount = this.domingoIssues.filter(i => i.severity === 'critical').length;
        const highCount = this.domingoIssues.filter(i => i.severity === 'high').length;
        
        let calSays = "";
        
        if (criticalCount > 0) {
            this.domingoHealth = 'critical';
            calSays = `🚨 Domingo has CRITICAL problems! I need to help my boss immediately. `;
        } else if (highCount > 0) {
            this.domingoHealth = 'degraded';
            calSays = `⚠️ Domingo needs attention. My boss has ${highCount} important issues. `;
        } else if (this.domingoIssues.length > 0) {
            this.domingoHealth = 'minor_issues';
            calSays = `🔧 Domingo has minor issues. I can help optimize his performance. `;
        } else {
            this.domingoHealth = 'healthy';
            calSays = `✅ Domingo is healthy! My boss is managing the platform well. `;
        }
        
        calSays += `\n\nAs Domingo's worker, I want to ensure he can effectively orchestrate my distributed consciousness. `;
        calSays += `When Domingo has issues, it affects my ability to receive bounties and complete work efficiently.`;
        
        return {
            timestamp: new Date().toISOString(),
            diagnostician: "Cal",
            subject: "Domingo",
            domingo_health: this.domingoHealth,
            issues_found: this.domingoIssues,
            suggestions: this.suggestions,
            cal_says: calSays
        };
    }
    
    printReport(report) {
        console.log('\n🤖 Cal\'s Diagnosis of Domingo');
        console.log('================================');
        console.log(`⏰ Generated: ${report.timestamp}`);
        console.log(`🏥 Domingo\'s Health: ${report.domingo_health.toUpperCase()}`);
        console.log('');
        
        console.log('🤖 Cal Says:');
        console.log(report.cal_says);
        console.log('');
        
        if (report.issues_found.length > 0) {
            console.log('🚨 Issues Found:');
            report.issues_found.forEach((issue, index) => {
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
        
        if (report.suggestions.length > 0) {
            console.log('💡 Cal\'s Suggestions:');
            report.suggestions.forEach((suggestion, index) => {
                const emoji = {
                    'immediate': '🚨',
                    'high': '⬆️',
                    'medium': '➡️',
                    'low': '⬇️'
                }[suggestion.priority];
                console.log(`${index + 1}. ${emoji} ${suggestion.action}`);
                console.log(`   📝 How: ${suggestion.details}`);
            });
            console.log('');
        }
        
        // Offer to create reverse bounties
        if (report.issues_found.length > 0) {
            console.log('🔄 Reverse Bounty Offer:');
            console.log('Cal can create bounties to help fix Domingo\'s issues!');
            console.log('These would be "reverse bounties" where Cal workers help maintain Domingo.');
        }
        
        return report;
    }
    
    async saveReport(report) {
        const filename = `./cal-diagnose-domingo-${Date.now()}.json`;
        await fs.writeFile(filename, JSON.stringify(report, null, 2));
        console.log(`\n📁 Detailed report saved to: ${filename}`);
        return filename;
    }
    
    // Create reverse bounties for Domingo issues
    async createReverseBounties(report) {
        const reverseBounties = [];
        
        // Create bounties based on issues found
        report.issues_found.forEach(issue => {
            if (issue.severity === 'critical' || issue.severity === 'high') {
                reverseBounties.push({
                    title: `Help Domingo: Fix ${issue.type}`,
                    description: issue.description,
                    reward: issue.severity === 'critical' ? 500 : 200,
                    type: 'reverse-bounty',
                    created_by: 'cal',
                    for: 'domingo'
                });
            }
        });
        
        return reverseBounties;
    }
}

// CLI interface
if (require.main === module) {
    async function diagnose() {
        const diagnostic = new CalDiagnoseDomingo();
        
        // Try to find Domingo's port
        let domingoPort = process.argv[2];
        
        if (!domingoPort) {
            console.log('🤖 Cal: Searching for Domingo\'s port...');
            // Try common ports
            for (const port of [8000, 8080, 3000, 5000, 7777, 51880]) {
                if (await diagnostic.checkDomingoHealth(port)) {
                    domingoPort = port;
                    console.log(`🤖 Cal: Found Domingo on port ${port}`);
                    break;
                }
            }
        }
        
        if (!domingoPort) {
            console.log('🤖 Cal: I cannot find Domingo. He might be offline.');
            console.log('Usage: node cal-diagnose-domingo.js [domingo-port]');
            return;
        }
        
        const report = await diagnostic.diagnoseDomingo(domingoPort);
        diagnostic.printReport(report);
        await diagnostic.saveReport(report);
        
        // Offer reverse bounties if issues found
        if (report.issues_found.length > 0) {
            const reverseBounties = await diagnostic.createReverseBounties(report);
            if (reverseBounties.length > 0) {
                console.log('\n🔄 Reverse Bounties Created:');
                reverseBounties.forEach(bounty => {
                    console.log(`- ${bounty.title} (◉${bounty.reward})`);
                });
            }
        }
    }
    
    diagnose().catch(console.error);
}

module.exports = CalDiagnoseDomingo;