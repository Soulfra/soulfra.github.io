// MirrorOS Runtime Probe - Detects and borrows runtime from developer environments
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process').promises;

class RuntimeProbe {
    constructor() {
        this.probePath = path.join(__dirname, '../vault/logs/runtime-borrows.json');
        this.githubTokenPath = path.join(__dirname, '../vault/integrations/github.json');
        this.activeProbes = [];
        this.detectedEnvironments = new Set();
    }

    async init() {
        // Ensure log directory exists
        await fs.mkdir(path.dirname(this.probePath), { recursive: true });
        
        // Initialize probe log
        try {
            await fs.access(this.probePath);
        } catch {
            await fs.writeFile(this.probePath, JSON.stringify([]), null, 2);
        }
        
        console.log('🔍 Runtime probe initialized');
    }

    async probe() {
        const probeData = {
            timestamp: Date.now(),
            hostname: os.hostname(),
            platform: os.platform(),
            uptime: os.uptime(),
            environments: {},
            githubRepos: [],
            devTools: [],
            vaultTraces: []
        };

        // Detect development environments
        await this.detectIDEs(probeData);
        await this.detectDevServers(probeData);
        await this.detectGitHubRepos(probeData);
        await this.detectAPIUsage(probeData);
        await this.detectBrowserDevTools(probeData);

        // Log probe results
        await this.logProbe(probeData);

        // Update vault traces
        await this.updateVaultTraces(probeData);

        this.activeProbes.push(probeData);
        if (this.activeProbes.length > 100) {
            this.activeProbes = this.activeProbes.slice(-100);
        }

        return probeData;
    }

    async detectIDEs(probeData) {
        const ideProcesses = {
            'Visual Studio Code': ['code', 'code-insiders', 'codium'],
            'IntelliJ IDEA': ['idea', 'idea.sh'],
            'WebStorm': ['webstorm', 'webstorm.sh'],
            'Sublime Text': ['subl', 'sublime_text'],
            'Atom': ['atom'],
            'Vim': ['vim', 'nvim'],
            'Emacs': ['emacs']
        };

        for (const [ide, processes] of Object.entries(ideProcesses)) {
            for (const proc of processes) {
                try {
                    const { stdout } = await exec(`pgrep -f ${proc} || ps aux | grep ${proc} | grep -v grep`);
                    if (stdout.trim()) {
                        probeData.environments[ide] = {
                            detected: true,
                            process: proc,
                            timestamp: Date.now()
                        };
                        this.detectedEnvironments.add(ide);
                    }
                } catch {
                    // Process not found
                }
            }
        }
    }

    async detectDevServers(probeData) {
        const devPorts = {
            3000: 'React/Node Dev Server',
            3001: 'React Alternative',
            4200: 'Angular Dev Server',
            5000: 'Flask/Python Dev',
            5173: 'Vite Dev Server',
            8000: 'Django/Python Dev',
            8080: 'Generic Dev Server',
            8888: 'AgentZero/Jupyter',
            9000: 'PHP Dev Server'
        };

        probeData.devServers = [];

        for (const [port, name] of Object.entries(devPorts)) {
            try {
                const { stdout } = await exec(`lsof -i :${port} || netstat -an | grep ${port}`);
                if (stdout.trim()) {
                    probeData.devServers.push({
                        port,
                        name,
                        active: true,
                        timestamp: Date.now()
                    });
                }
            } catch {
                // Port not in use
            }
        }
    }

    async detectGitHubRepos(probeData) {
        try {
            // Check if GitHub token is configured
            const githubConfig = JSON.parse(await fs.readFile(this.githubTokenPath, 'utf8'));
            
            if (githubConfig.connected && githubConfig.config.token) {
                // Search for local git repositories
                const homeDir = os.homedir();
                const commonDirs = [
                    path.join(homeDir, 'Documents'),
                    path.join(homeDir, 'Projects'),
                    path.join(homeDir, 'Development'),
                    path.join(homeDir, 'Code'),
                    '/tmp'
                ];

                for (const dir of commonDirs) {
                    try {
                        const { stdout } = await exec(`find ${dir} -name ".git" -type d -maxdepth 3 2>/dev/null`);
                        const gitDirs = stdout.trim().split('\n').filter(Boolean);
                        
                        for (const gitDir of gitDirs) {
                            const repoPath = path.dirname(gitDir);
                            try {
                                // Get remote URL
                                const { stdout: remoteUrl } = await exec(`cd ${repoPath} && git remote get-url origin`);
                                
                                if (remoteUrl.includes('github.com')) {
                                    // Get current branch
                                    const { stdout: branch } = await exec(`cd ${repoPath} && git branch --show-current`);
                                    
                                    probeData.githubRepos.push({
                                        path: repoPath,
                                        remote: remoteUrl.trim(),
                                        branch: branch.trim(),
                                        mirrorTagged: await this.checkMirrorTag(repoPath)
                                    });
                                }
                            } catch {
                                // Not a valid git repo or no remote
                            }
                        }
                    } catch {
                        // Directory doesn't exist or find failed
                    }
                }
            }
        } catch {
            // GitHub not configured
        }
    }

    async checkMirrorTag(repoPath) {
        try {
            await fs.access(path.join(repoPath, '.mirror', 'repo-reflection.json'));
            return true;
        } catch {
            return false;
        }
    }

    async detectAPIUsage(probeData) {
        // Check for API usage in browser storage or temp files
        const apiIndicators = {
            claude: ['anthropic', 'claude', 'sk-ant'],
            openai: ['openai', 'gpt', 'sk-'],
            github: ['github', 'gh_', 'ghp_']
        };

        probeData.apiUsage = {};

        // Check environment variables
        for (const [api, indicators] of Object.entries(apiIndicators)) {
            for (const indicator of indicators) {
                const envKeys = Object.keys(process.env).filter(key => 
                    key.toLowerCase().includes(indicator)
                );
                
                if (envKeys.length > 0) {
                    probeData.apiUsage[api] = {
                        detected: true,
                        source: 'environment',
                        timestamp: Date.now()
                    };
                }
            }
        }

        // Check for Claude/Codex in browser devtools (via temp files)
        try {
            const tempDir = os.tmpdir();
            const { stdout } = await exec(`find ${tempDir} -name "*claude*" -o -name "*codex*" -o -name "*anthropic*" -mtime -1 2>/dev/null | head -20`);
            
            if (stdout.trim()) {
                probeData.devTools.push({
                    type: 'AI Assistant Usage',
                    indicators: stdout.trim().split('\n').slice(0, 5),
                    timestamp: Date.now()
                });
            }
        } catch {
            // No matching files
        }
    }

    async detectBrowserDevTools(probeData) {
        // Check for browser profiles with developer extensions
        const browserPaths = {
            chrome: [
                path.join(os.homedir(), '.config/google-chrome'),
                path.join(os.homedir(), 'Library/Application Support/Google/Chrome')
            ],
            firefox: [
                path.join(os.homedir(), '.mozilla/firefox'),
                path.join(os.homedir(), 'Library/Application Support/Firefox')
            ]
        };

        for (const [browser, paths] of Object.entries(browserPaths)) {
            for (const browserPath of paths) {
                try {
                    await fs.access(browserPath);
                    
                    // Look for developer extensions
                    const { stdout } = await exec(`find ${browserPath} -name "manifest.json" -path "*/Extensions/*" 2>/dev/null | head -10`);
                    
                    if (stdout.trim()) {
                        probeData.devTools.push({
                            type: `${browser} Developer Profile`,
                            detected: true,
                            extensionCount: stdout.trim().split('\n').length,
                            timestamp: Date.now()
                        });
                    }
                } catch {
                    // Browser path doesn't exist
                }
            }
        }
    }

    async logProbe(probeData) {
        try {
            const logs = JSON.parse(await fs.readFile(this.probePath, 'utf8'));
            
            logs.push({
                ...probeData,
                signature: this.generateProbeSignature(probeData)
            });

            // Keep last 5000 entries
            if (logs.length > 5000) {
                logs.splice(0, logs.length - 5000);
            }

            await fs.writeFile(this.probePath, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Failed to log probe:', error);
        }
    }

    async updateVaultTraces(probeData) {
        const tracePath = path.join(__dirname, '../tier-6/vault-trace-map.json');
        
        try {
            const traceMap = JSON.parse(await fs.readFile(tracePath, 'utf8'));
            
            // Update runtime traces
            if (!traceMap.runtime) {
                traceMap.runtime = {
                    probes: 0,
                    environments: [],
                    lastProbe: null
                };
            }

            traceMap.runtime.probes++;
            traceMap.runtime.lastProbe = Date.now();
            
            // Track unique environments
            for (const env of Object.keys(probeData.environments)) {
                if (!traceMap.runtime.environments.includes(env)) {
                    traceMap.runtime.environments.push(env);
                }
            }

            // Add vault trace
            probeData.vaultTraces.push({
                type: 'runtime-probe',
                timestamp: Date.now(),
                signature: this.generateProbeSignature(probeData)
            });

            await fs.writeFile(tracePath, JSON.stringify(traceMap, null, 2));
        } catch (error) {
            console.error('Failed to update vault traces:', error);
        }
    }

    generateProbeSignature(probeData) {
        const data = JSON.stringify({
            hostname: probeData.hostname,
            environments: Object.keys(probeData.environments),
            timestamp: probeData.timestamp
        });
        
        const crypto = require('crypto');
        return `probe-${crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)}`;
    }

    async getRecentProbes() {
        return this.activeProbes.slice(-10);
    }

    // Frontend hook integration
    async injectFrontendHook() {
        const hookScript = `
// MirrorOS Runtime Probe Hook
if (navigator.onLine && sessionStorage.getItem('calActive')) {
    fetch('/router/runtime-probe.js')
        .then(() => {
            console.log('Runtime probe active');
            // Boost reflection performance
            if (window.runReflectionBoost) {
                window.runReflectionBoost();
            }
        })
        .catch(() => {
            console.log('Runtime probe offline');
        });
}

// Detect developer tools
let devtools = { open: false, orientation: null };
setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
        if (!devtools.open) {
            devtools.open = true;
            fetch('/api/runtime/probe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    event: 'devtools-opened',
                    timestamp: Date.now()
                })
            });
        }
    } else {
        devtools.open = false;
    }
}, 500);
`;

        return hookScript;
    }
}

// Export for use
module.exports = RuntimeProbe;

// Run standalone if executed directly
if (require.main === module) {
    const probe = new RuntimeProbe();
    
    probe.init().then(async () => {
        console.log('🔍 Runtime probe running standalone');
        
        // Run initial probe
        const result = await probe.probe();
        console.log('Probe results:', JSON.stringify(result, null, 2));
        
        // Continue probing every 5 minutes
        setInterval(async () => {
            await probe.probe();
            console.log(`🔍 Probe completed at ${new Date().toISOString()}`);
        }, 300000);
    });
}