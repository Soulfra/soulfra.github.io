// Prompt Obfuscation Layer
// Obfuscates user prompts before they reach Layer 1

export class PromptObfuscator {
    constructor() {
        this.obfuscationRules = {
            // Remove personal information
            stripPersonalData: true,
            // Hash identifiable information
            hashIdentifiers: true,
            // Remove system-specific references
            stripSystemReferences: true,
            // Add noise to prevent pattern detection
            addObfuscationNoise: false // Keep false for demo
        };
    }

    async obfuscate(prompt, userId) {
        console.log('🎭 Applying prompt obfuscation...');
        
        // Step 1: Remove personal data
        let obfuscatedPrompt = this.stripPersonalData(prompt);
        
        // Step 2: Remove system references
        obfuscatedPrompt = this.stripSystemReferences(obfuscatedPrompt);
        
        // Step 3: Create obfuscation metadata
        const metadata = {
            original_length: prompt.length,
            obfuscated_length: obfuscatedPrompt.length,
            user_hash: this.hashUserId(userId),
            obfuscation_applied: true,
            timestamp: Date.now()
        };
        
        return {
            obfuscated_prompt: obfuscatedPrompt,
            metadata: metadata
        };
    }

    stripPersonalData(prompt) {
        // Remove common personal identifiers
        let cleaned = prompt;
        
        // Remove email patterns
        cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
        
        // Remove phone patterns
        cleaned = cleaned.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
        
        // Remove names (basic pattern)
        cleaned = cleaned.replace(/\bMy name is \w+/gi, 'My name is [NAME]');
        
        return cleaned;
    }

    stripSystemReferences(prompt) {
        // Remove references to our internal systems
        let cleaned = prompt;
        
        // Remove Soulfra references (but keep business context)
        cleaned = cleaned.replace(/Soulfra/gi, 'the platform');
        cleaned = cleaned.replace(/CAL RIVEN/gi, 'the AI system');
        cleaned = cleaned.replace(/Layer 1/gi, 'the core system');
        
        return cleaned;
    }

    hashUserId(userId) {
        // Simple hash for demo (use crypto in production)
        return 'user_' + Math.abs(userId.toString().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0)).toString(16).substring(0, 8);
    }
}

export default PromptObfuscator;
