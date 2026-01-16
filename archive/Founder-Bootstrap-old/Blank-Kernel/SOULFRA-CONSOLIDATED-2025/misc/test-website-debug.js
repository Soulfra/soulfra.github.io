// 🧪 WEBSITE DEBUG TEST
// Tests that the websites are actually being served and identifies any errors

import http from 'http';
import https from 'https';
import chalk from 'chalk';

class WebsiteDebugTest {
    constructor() {
        this.tests = [];
        this.results = [];
        this.ports = {
            'api-gateway': 3000,
            'health-discovery': 9090,
            'debug-extraction': 9999,
            'soulfra-runtime': 8080
        };
    }

    async runTests() {
        console.log(chalk.blue.bold('\n🧪 WEBSITE DEBUG TEST'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        await this.testServiceAvailability();
        await this.testWebsiteEndpoints();
        await this.testAPIEndpoints();
        await this.testWebSocketConnections();
        await this.testDebugLayer();
        
        this.showResults();
    }

    async testServiceAvailability() {
        console.log(chalk.yellow('📡 Testing Service Availability...\n'));
        
        for (const [service, port] of Object.entries(this.ports)) {
            const result = await this.checkPort(port);
            this.results.push({
                test: `Service ${service} on port ${port}`,
                success: result.success,
                message: result.message,
                error: result.error
            });
        }
    }

    async testWebsiteEndpoints() {
        console.log(chalk.yellow('\n🌐 Testing Website Endpoints...\n'));
        
        const endpoints = [
            { path: '/', name: 'Landing Page' },
            { path: '/amphitheater', name: 'Amphitheater' },
            { path: '/arena', name: 'Arena' },
            { path: '/health', name: 'Health Check' },
            { path: '/api/services', name: 'Service Discovery' }
        ];

        for (const endpoint of endpoints) {
            const result = await this.testEndpoint(3000, endpoint.path);
            this.results.push({
                test: `Website: ${endpoint.name}`,
                success: result.success,
                message: result.message,
                error: result.error,
                statusCode: result.statusCode,
                contentType: result.contentType
            });
        }
    }

    async testAPIEndpoints() {
        console.log(chalk.yellow('\n🔗 Testing API Endpoints...\n'));
        
        const apis = [
            { port: 3000, path: '/api/live/debate', name: 'Live Debate API' },
            { port: 3000, path: '/api/live/market', name: 'Live Market API' },
            { port: 9090, path: '/health', name: 'Health System API' },
            { port: 9090, path: '/services', name: 'Service List API' },
            { port: 9999, path: '/debug/all', name: 'Debug API' }
        ];

        for (const api of apis) {
            const result = await this.testEndpoint(api.port, api.path);
            this.results.push({
                test: `API: ${api.name}`,
                success: result.success,
                message: result.message,
                error: result.error,
                statusCode: result.statusCode,
                responseSize: result.responseSize
            });
        }
    }

    async testWebSocketConnections() {
        console.log(chalk.yellow('\n🔌 Testing WebSocket Connections...\n'));
        
        // We'll just check if the ports are open for now
        const wsPorts = [
            { port: 3000, name: 'API Gateway WebSocket' },
            { port: 7777, name: 'Service Mesh WebSocket' },
            { port: 9999, name: 'Debug WebSocket' }
        ];

        for (const ws of wsPorts) {
            const result = await this.checkPort(ws.port);
            this.results.push({
                test: `WebSocket: ${ws.name}`,
                success: result.success,
                message: result.message,
                error: result.error
            });
        }
    }

    async testDebugLayer() {
        console.log(chalk.yellow('\n🐛 Testing Debug Extraction Layer...\n'));
        
        try {
            const response = await this.makeRequest(this.ports['debug-extraction'], '/debug/all');
            if (response.success) {
                const data = JSON.parse(response.body);
                this.results.push({
                    test: 'Debug Layer Data',
                    success: true,
                    message: `Total errors: ${data.stats?.totalErrors || 0}, Total logs: ${data.stats?.totalLogs || 0}`,
                    debugData: data
                });
            } else {
                this.results.push({
                    test: 'Debug Layer Data',
                    success: false,
                    message: response.message,
                    error: response.error
                });
            }
        } catch (error) {
            this.results.push({
                test: 'Debug Layer Data',
                success: false,
                message: 'Failed to access debug layer',
                error: error.message
            });
        }
    }

    async checkPort(port) {
        return new Promise((resolve) => {
            const socket = new (require('net')).Socket();
            
            socket.setTimeout(2000);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve({
                    success: true,
                    message: `Port ${port} is open`
                });
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve({
                    success: false,
                    message: `Port ${port} connection timeout`,
                    error: 'TIMEOUT'
                });
            });
            
            socket.on('error', (error) => {
                resolve({
                    success: false,
                    message: `Port ${port} is closed`,
                    error: error.code
                });
            });
            
            socket.connect(port, 'localhost');
        });
    }

    async testEndpoint(port, path) {
        try {
            const response = await this.makeRequest(port, path);
            return {
                success: response.success,
                message: response.success ? `${response.statusCode} OK` : 'Failed',
                statusCode: response.statusCode,
                contentType: response.contentType,
                responseSize: response.body ? response.body.length : 0,
                error: response.error
            };
        } catch (error) {
            return {
                success: false,
                message: 'Request failed',
                error: error.message
            };
        }
    }

    makeRequest(port, path) {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: path,
                method: 'GET',
                timeout: 5000,
                headers: {
                    'User-Agent': 'Soulfra-Debug-Test/1.0'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        statusCode: res.statusCode,
                        contentType: res.headers['content-type'],
                        body: body,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    code: error.code
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            });

            req.end();
        });
    }

    showResults() {
        console.log(chalk.blue('\n📊 TEST RESULTS'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        let passed = 0;
        let failed = 0;

        for (const result of this.results) {
            if (result.success) {
                console.log(chalk.green(`✅ ${result.test}: ${result.message}`));
                passed++;
            } else {
                console.log(chalk.red(`❌ ${result.test}: ${result.message}`));
                if (result.error) {
                    console.log(chalk.gray(`   Error: ${result.error}`));
                }
                failed++;
            }
            
            // Show additional details for some tests
            if (result.statusCode) {
                console.log(chalk.gray(`   Status: ${result.statusCode}`));
            }
            if (result.contentType) {
                console.log(chalk.gray(`   Content-Type: ${result.contentType}`));
            }
            if (result.responseSize) {
                console.log(chalk.gray(`   Response Size: ${result.responseSize} bytes`));
            }
        }

        console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`Passed: ${passed}`));
        console.log(chalk.red(`Failed: ${failed}`));
        console.log(chalk.yellow(`Total: ${this.results.length}`));

        // Check debug data for errors
        const debugResult = this.results.find(r => r.test === 'Debug Layer Data');
        if (debugResult && debugResult.debugData) {
            const debugData = debugResult.debugData;
            if (debugData.errors && debugData.errors.length > 0) {
                console.log(chalk.red('\n🐛 CAPTURED ERRORS:'));
                debugData.errors.slice(-5).forEach(error => {
                    console.log(chalk.red(`   [${new Date(error.timestamp).toLocaleTimeString()}] ${error.type}: ${error.error || error.message}`));
                });
            }
        }

        // Provide troubleshooting tips
        if (failed > 0) {
            console.log(chalk.yellow('\n💡 TROUBLESHOOTING TIPS:'));
            
            const servicesFailed = this.results.filter(r => r.test.includes('Service') && !r.success);
            if (servicesFailed.length > 0) {
                console.log(chalk.yellow('\n   Services not running:'));
                console.log(chalk.gray('   - Run "npm start" from the tier-minus20 directory'));
                console.log(chalk.gray('   - Or run "node infrastructure/multi-ring-orchestrator.js --auto-start"'));
            }

            const websitesFailed = this.results.filter(r => r.test.includes('Website') && !r.success);
            if (websitesFailed.length > 0) {
                console.log(chalk.yellow('\n   Websites not accessible:'));
                console.log(chalk.gray('   - Check if the API Gateway is running on port 3000'));
                console.log(chalk.gray('   - Ensure the "public" directory exists with HTML files'));
                console.log(chalk.gray('   - Try running "npm run gateway" separately'));
            }

            const debugFailed = this.results.filter(r => r.test.includes('Debug') && !r.success);
            if (debugFailed.length > 0) {
                console.log(chalk.yellow('\n   Debug layer issues:'));
                console.log(chalk.gray('   - Set DEBUG=true environment variable'));
                console.log(chalk.gray('   - Check http://localhost:9999 in browser'));
            }
        }

        console.log();
    }
}

// Run the test
const test = new WebsiteDebugTest();
test.runTests().catch(console.error);