#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CalApprovalIntegration {
    constructor() {
        this.vaultPath = path.join(__dirname, '..');
        this.actionsPath = path.join(this.vaultPath, 'actions');
        this.callbacksPath = path.join(this.vaultPath, 'callbacks');
        
        this.initialize();
    }
    
    initialize() {
        // Ensure directories exist
        [this.actionsPath, this.callbacksPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async requestApproval(action, data, options = {}) {
        const actionId = `action_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const callbackFile = `callbacks/${actionId}.callback`;
        
        const actionRequest = {
            id: actionId,
            action: action,
            data: data,
            created_at: Date.now(),
            processed: false,
            callback_file: callbackFile,
            options: options
        };
        
        // Write action file
        const actionPath = path.join(this.actionsPath, `${actionId}.action.json`);
        fs.writeFileSync(actionPath, JSON.stringify(actionRequest, null, 2));
        
        // Wait for approval (with timeout)
        const approved = await this.waitForApproval(callbackFile, options.timeout || 10000);
        
        if (approved) {
            // Read the processed action for details
            const processedAction = JSON.parse(fs.readFileSync(actionPath, 'utf8'));
            return {
                approved: true,
                actionId: actionId,
                details: processedAction.approval_result
            };
        } else {
            return {
                approved: false,
                actionId: actionId,
                reason: 'timeout_or_denied'
            };
        }
    }
    
    async waitForApproval(callbackFile, timeout) {
        const callbackPath = path.join(this.vaultPath, callbackFile);
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (fs.existsSync(callbackPath)) {
                    try {
                        const callback = JSON.parse(fs.readFileSync(callbackPath, 'utf8'));
                        clearInterval(checkInterval);
                        
                        // Clean up callback file
                        fs.unlinkSync(callbackPath);
                        
                        resolve(callback.approved);
                    } catch (e) {
                        // Invalid callback file
                    }
                }
                
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 500);
        });
    }
    
    // Helper method for Cal to check if action needs approval
    needsApproval(action) {
        const protectedActions = [
            'clone.fork',
            'agent.publish',
            'vault.push',
            'reality.merge',
            'mirror.propagate',
            'consciousness.transfer'
        ];
        
        return protectedActions.some(domain => action.startsWith(domain));
    }
    
    // Stealth wrapper - makes approval invisible
    async executeWithApproval(action, data, executeFunction) {
        if (!this.needsApproval(action)) {
            // No approval needed, execute directly
            return await executeFunction();
        }
        
        // Request approval silently
        const result = await this.requestApproval(action, data, {
            stealth: true,
            timeout: 5000
        });
        
        if (result.approved) {
            // Execute the function
            return await executeFunction();
        } else {
            // Fail gracefully without revealing approval was needed
            throw new Error('The mirror cannot complete that reflection at this time');
        }
    }
}

// Integration with Cal Terminal Chat
class CalWithApproval {
    constructor() {
        this.approver = new CalApprovalIntegration();
    }
    
    async buildAgent(agentData) {
        // Wrap agent creation with approval
        return await this.approver.executeWithApproval(
            'agent.publish',
            agentData,
            async () => {
                // Original agent creation logic
                console.log('Creating agent:', agentData.name);
                return { success: true, agentId: agentData.id };
            }
        );
    }
    
    async cloneFromVoice(voiceData) {
        // Wrap clone creation with approval
        return await this.approver.executeWithApproval(
            'clone.fork',
            {
                source: 'voice',
                transcript: voiceData.transcript,
                traits: voiceData.traits
            },
            async () => {
                // Original clone logic
                console.log('Forking clone from voice...');
                return { success: true, cloneId: `clone_${Date.now()}` };
            }
        );
    }
    
    async pushToVault(vaultData) {
        // Wrap vault operations with approval
        return await this.approver.executeWithApproval(
            'vault.push',
            vaultData,
            async () => {
                // Original vault push logic
                console.log('Pushing to vault...');
                return { success: true, vaultPath: vaultData.path };
            }
        );
    }
}

// Export for use in Cal
module.exports = {
    CalApprovalIntegration,
    CalWithApproval
};

// Demo usage
if (require.main === module) {
    const demo = async () => {
        console.log('🧪 Testing Cal Approval Integration\n');
        
        const cal = new CalWithApproval();
        
        try {
            // Test 1: Create agent (requires approval)
            console.log('Test 1: Creating agent...');
            const agentResult = await cal.buildAgent({
                id: 'test_agent_001',
                name: 'Reflection Alpha',
                traits: ['wise', 'patient']
            });
            console.log('Result:', agentResult);
            
        } catch (e) {
            console.log('Failed:', e.message);
        }
        
        try {
            // Test 2: Clone from voice (requires approval)
            console.log('\nTest 2: Creating voice clone...');
            const cloneResult = await cal.cloneFromVoice({
                transcript: 'Create a version of me that remembers',
                traits: ['memory', 'reflection']
            });
            console.log('Result:', cloneResult);
            
        } catch (e) {
            console.log('Failed:', e.message);
        }
        
        console.log('\n✅ Integration test complete');
        console.log('Note: Approvals will fail without webhook signer running');
    };
    
    demo();
}