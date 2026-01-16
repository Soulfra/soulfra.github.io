// MirrorOS Bootstrap - API Key Loader
// Checks for existing keys and injects backup keys if needed

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class APIKeyLoader {
    constructor() {
        this.meshConfigPath = path.join(__dirname, '../mesh-config.json');
        this.vaultKeysPath = path.join(__dirname, '../vault/env/llm-keys.json');
        this.userKeysPath = path.join(__dirname, '../.env.local');
        this.loadedKeys = {};
    }

    async init() {
        console.log('🔑 Initializing API Key Loader...');
        
        // Check for existing user keys
        const userKeys = await this.checkUserKeys();
        
        // Load vault backup keys
        const vaultKeys = await this.loadVaultKeys();
        
        // Merge keys (user keys take precedence)
        this.loadedKeys = { ...vaultKeys, ...userKeys };
        
        // Check which keys are available
        this.displayKeyStatus();
        
        // Write to mesh config
        await this.writeMeshConfig();
        
        // Prompt for missing critical keys
        await this.promptForMissingKeys();
        
        console.log('✅ API keys loaded and configured');
    }

    async checkUserKeys() {
        const keys = {};
        
        // Check environment variables
        if (process.env.ANTHROPIC_API_KEY) {
            keys.claude = process.env.ANTHROPIC_API_KEY;
        }
        if (process.env.OPENAI_API_KEY) {
            keys.openai = process.env.OPENAI_API_KEY;
        }
        if (process.env.GITHUB_TOKEN) {
            keys.github = process.env.GITHUB_TOKEN;
        }
        
        // Check .env.local file
        try {
            const envContent = await fs.readFile(this.userKeysPath, 'utf8');
            const envKeys = this.parseEnvFile(envContent);
            
            if (envKeys.ANTHROPIC_API_KEY) keys.claude = envKeys.ANTHROPIC_API_KEY;
            if (envKeys.OPENAI_API_KEY) keys.openai = envKeys.OPENAI_API_KEY;
            if (envKeys.GITHUB_TOKEN) keys.github = envKeys.GITHUB_TOKEN;
            if (envKeys.STRIPE_SECRET_KEY) keys.stripe = envKeys.STRIPE_SECRET_KEY;
            
        } catch {
            // No .env.local file
        }
        
        // Check enterprise config
        try {
            const stripeConfig = JSON.parse(
                await fs.readFile(path.join(__dirname, '../enterprise-agentzero/stripe-connect.json'), 'utf8')
            );
            if (stripeConfig.secretKey) {
                keys.stripe = stripeConfig.secretKey;
            }
        } catch {
            // No stripe config
        }
        
        return keys;
    }

    async loadVaultKeys() {
        try {
            const vaultKeys = JSON.parse(await fs.readFile(this.vaultKeysPath, 'utf8'));
            return {
                claude: vaultKeys.claude || vaultKeys.anthropic,
                openai: vaultKeys.openai,
                ollama: vaultKeys.ollama || 'http://localhost:11434',
                defaultAgent: vaultKeys.defaultAgent
            };
        } catch (error) {
            console.log('⚠️  No vault keys found, using defaults');
            return {
                claude: 'sk-ant-demo-key',
                openai: 'sk-demo-key',
                ollama: 'http://localhost:11434',
                defaultAgent: 'cal-riven-default-sig'
            };
        }
    }

    parseEnvFile(content) {
        const env = {};
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                env[key] = value;
            }
        });
        
        return env;
    }

    displayKeyStatus() {
        console.log('\n📊 API Key Status:');
        console.log('==================');
        
        const providers = ['claude', 'openai', 'github', 'stripe', 'ollama'];
        
        providers.forEach(provider => {
            const hasKey = !!this.loadedKeys[provider];
            const status = hasKey ? '✅' : '❌';
            const source = hasKey ? 
                (this.loadedKeys[provider].includes('demo') ? '(demo)' : '(configured)') : 
                '(missing)';
            
            console.log(`${status} ${provider.padEnd(10)} ${source}`);
        });
        
        console.log('==================\n');
    }

    async writeMeshConfig() {
        const meshConfig = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            apis: {
                claude: {
                    key: this.loadedKeys.claude,
                    endpoint: 'https://api.anthropic.com/v1',
                    enabled: !!this.loadedKeys.claude
                },
                openai: {
                    key: this.loadedKeys.openai,
                    endpoint: 'https://api.openai.com/v1',
                    enabled: !!this.loadedKeys.openai
                },
                ollama: {
                    endpoint: this.loadedKeys.ollama || 'http://localhost:11434',
                    enabled: true
                }
            },
            integrations: {
                github: {
                    token: this.loadedKeys.github,
                    enabled: !!this.loadedKeys.github
                },
                stripe: {
                    key: this.loadedKeys.stripe,
                    enabled: !!this.loadedKeys.stripe
                }
            },
            routing: {
                primary: this.detectPrimaryLLM(),
                fallback: ['claude', 'openai', 'ollama', 'local'],
                byok: this.hasRealKeys()
            },
            mirror: {
                signature: 'cal-riven-bootstrap',
                tier: -10,
                defaultAgent: this.loadedKeys.defaultAgent
            }
        };
        
        await fs.writeFile(this.meshConfigPath, JSON.stringify(meshConfig, null, 2));
        console.log(`📝 Wrote configuration to ${this.meshConfigPath}`);
    }

    detectPrimaryLLM() {
        // Prefer real keys over demo keys
        if (this.loadedKeys.claude && !this.loadedKeys.claude.includes('demo')) {
            return 'claude';
        }
        if (this.loadedKeys.openai && !this.loadedKeys.openai.includes('demo')) {
            return 'openai';
        }
        return 'ollama'; // Default to local
    }

    hasRealKeys() {
        return Object.values(this.loadedKeys).some(key => 
            key && typeof key === 'string' && !key.includes('demo')
        );
    }

    async promptForMissingKeys() {
        // Only prompt if no real LLM keys are available
        if (!this.hasRealKeys()) {
            console.log('\n⚠️  No API keys configured!');
            console.log('You can:');
            console.log('1. Add keys to .env.local file');
            console.log('2. Set environment variables');
            console.log('3. Use the dashboard to configure');
            console.log('4. Continue with demo keys (limited functionality)\n');
            
            const answer = await this.askQuestion('Would you like to add keys now? (y/N): ');
            
            if (answer.toLowerCase() === 'y') {
                await this.interactiveKeySetup();
            }
        }
    }

    async askQuestion(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise(resolve => {
            rl.question(question, answer => {
                rl.close();
                resolve(answer);
            });
        });
    }

    async interactiveKeySetup() {
        console.log('\n🔧 Interactive Key Setup');
        console.log('========================');
        console.log('Press Enter to skip any key\n');
        
        const newKeys = {};
        
        // Claude/Anthropic
        const claudeKey = await this.askQuestion('Anthropic API Key (sk-ant-...): ');
        if (claudeKey) newKeys.ANTHROPIC_API_KEY = claudeKey;
        
        // OpenAI
        const openaiKey = await this.askQuestion('OpenAI API Key (sk-...): ');
        if (openaiKey) newKeys.OPENAI_API_KEY = openaiKey;
        
        // GitHub
        const githubToken = await this.askQuestion('GitHub Token (ghp_...): ');
        if (githubToken) newKeys.GITHUB_TOKEN = githubToken;
        
        // Stripe
        const stripeKey = await this.askQuestion('Stripe Secret Key (sk_...): ');
        if (stripeKey) newKeys.STRIPE_SECRET_KEY = stripeKey;
        
        if (Object.keys(newKeys).length > 0) {
            await this.saveKeys(newKeys);
            
            // Reload keys
            const userKeys = await this.checkUserKeys();
            this.loadedKeys = { ...this.loadedKeys, ...userKeys };
            
            // Rewrite mesh config
            await this.writeMeshConfig();
            
            console.log('\n✅ Keys saved successfully!');
        }
    }

    async saveKeys(keys) {
        let envContent = '';
        
        // Try to load existing .env.local
        try {
            envContent = await fs.readFile(this.userKeysPath, 'utf8');
        } catch {
            // File doesn't exist
        }
        
        // Update or add keys
        for (const [key, value] of Object.entries(keys)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            const newLine = `${key}="${value}"`;
            
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, newLine);
            } else {
                envContent += (envContent.endsWith('\n') ? '' : '\n') + newLine + '\n';
            }
        }
        
        await fs.writeFile(this.userKeysPath, envContent);
    }
}

// Export for use
module.exports = APIKeyLoader;

// Run if executed directly
if (require.main === module) {
    const loader = new APIKeyLoader();
    loader.init().catch(console.error);
}