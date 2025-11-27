// Infinity Router Main - Orchestrates all components
const PromptObfuscationKernel = require('./obfuscation-kernel/prompt-transformer');
const TrustPolicyEngine = require('./policy-engine/trust-gating');
const VaultInteractionLogger = require('./vault-system/interaction-logger');
const MultiProviderRouter = require('./providers/multi-provider-router');
const { v4: uuidv4 } = require('uuid');

class InfinityRouterFirewall {
  constructor(db, trustEngine) {
    this.db = db;
    this.trustEngine = trustEngine;
    
    // Initialize components
    this.obfuscationKernel = new PromptObfuscationKernel();
    this.policyEngine = new TrustPolicyEngine(trustEngine);
    this.vaultLogger = new VaultInteractionLogger(db);
    this.providerRouter = new MultiProviderRouter();
    
    console.log('🛡️ Infinity Router Firewall initialized');
  }
  
  async routeRequest(messages, user, options = {}) {
    const interactionId = uuidv4();
    const startTime = Date.now();
    
    console.log(`🚀 Processing request through Infinity Router (ID: ${interactionId})`);
    
    try {
      // Step 1: Extract prompt from messages
      const originalPrompt = this.extractPrompt(messages);
      
      // Step 2: Evaluate trust-based routing policy
      const userContext = {
        user_id: user.id,
        fingerprint: `fp_${user.id}_${Date.now()}`,
        tier: user.tier,
        trust_score: user.trust_score
      };
      
      const routingPolicy = await this.policyEngine.evaluateRoutingPolicy(
        userContext, 
        { interaction_id: interactionId }
      );
      
      console.log(`🎯 Routing policy: ${routingPolicy.routing_tier} tier, ${routingPolicy.allowed_providers.join(', ')}`);
      
      // Step 3: Apply prompt obfuscation
      const obfuscationResult = await this.obfuscationKernel.obfuscatePrompt(
        originalPrompt,
        userContext,
        routingPolicy.obfuscation_level
      );
      
      console.log(`🔒 Prompt obfuscated (level: ${routingPolicy.obfuscation_level})`);
      
      // Step 4: Route through providers
      const routingResult = await this.providerRouter.routeRequest(
        obfuscationResult.obfuscated_prompt,
        routingPolicy,
        userContext
      );
      
      // Step 5: Calculate billing
      const billingData = {
        cost: routingResult.cost * routingPolicy.cost_multiplier,
        credits_used: Math.ceil(routingResult.cost * routingPolicy.cost_multiplier * 1000),
        discount_percentage: (1 - routingPolicy.cost_multiplier) * 100,
        transaction_id: `tx_${interactionId}`
      };
      
      // Step 6: Log to vault
      const vaultResult = await this.vaultLogger.logInteraction({
        interaction_id: interactionId,
        user_context: userContext,
        original_prompt: originalPrompt,
        obfuscation_metadata: obfuscationResult.obfuscation_metadata,
        policy_decision: routingPolicy,
        provider_used: routingResult.provider_used,
        llm_response: routingResult.response,
        billing_data: billingData,
        vault_logging_level: routingPolicy.vault_logging_level,
        trust_impact: this.calculateTrustImpact(routingResult),
        routing_latency: Date.now() - startTime
      });
      
      console.log(`💾 Interaction logged to vault: ${vaultResult.vault_id}`);
      
      // Step 7: Prepare response
      const response = {
        response: routingResult.response,
        provider: routingResult.provider_used,
        model: routingResult.model,
        cost: billingData.cost,
        tokens_input: Math.ceil(originalPrompt.length / 4),
        tokens_output: Math.ceil(routingResult.response.length / 4),
        routing_info: {
          interaction_id: interactionId,
          routing_tier: routingPolicy.routing_tier,
          obfuscation_level: routingPolicy.obfuscation_level,
          provider_selected: routingResult.provider_used,
          trust_score: user.trust_score,
          vault_logged: true,
          total_latency: Date.now() - startTime,
          fallback_used: routingResult.fallback_used || false
        }
      };
      
      console.log(`✅ Request completed (${Date.now() - startTime}ms)`);
      return response;
      
    } catch (error) {
      console.error(`🚨 Infinity Router error:`, error);
      
      // Fail-safe response
      return {
        response: `I apologize, but I'm experiencing technical difficulties. The request has been logged for review. Error ID: ${interactionId}`,
        provider: 'failsafe',
        model: 'Error Handler',
        cost: 0,
        tokens_input: 0,
        tokens_output: 0,
        routing_info: {
          interaction_id: interactionId,
          error: error.message,
          failsafe_activated: true
        }
      };
    }
  }
  
  extractPrompt(messages) {
    // Convert messages array to single prompt
    return messages.map(msg => {
      if (msg.role === 'system') return `System: ${msg.content}`;
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
      return msg.content;
    }).join('\n\n');
  }
  
  calculateTrustImpact(routingResult) {
    // Positive trust for successful interactions
    if (routingResult.response && routingResult.response.length > 50) {
      return 1; // Small positive trust boost
    }
    return 0;
  }
}

module.exports = InfinityRouterFirewall;
