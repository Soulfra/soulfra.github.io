// Trust-Based Policy Engine - Routing decisions based on trust scores
class TrustPolicyEngine {
  constructor(trustEngine) {
    this.trustEngine = trustEngine;
  }
  
  async evaluateRoutingPolicy(userContext, requestMetadata) {
    const trustInfo = await this.trustEngine.getTrustInfo(userContext.user_id);
    
    return {
      routing_tier: this.calculateRoutingTier(trustInfo.trust_score),
      allowed_providers: this.getAllowedProviders(trustInfo.tier),
      rate_limits: this.calculateRateLimits(trustInfo.trust_score),
      cost_multiplier: this.calculateCostMultiplier(trustInfo.discount_percentage),
      obfuscation_level: this.getObfuscationLevel(trustInfo.trust_score),
      vault_logging_level: this.getVaultLoggingLevel(trustInfo.tier)
    };
  }
  
  calculateRoutingTier(trustScore) {
    if (trustScore >= 90) return 'platinum';
    if (trustScore >= 70) return 'premium';
    if (trustScore >= 50) return 'standard';
    return 'basic';
  }
  
  getAllowedProviders(tier) {
    const providerTiers = {
      basic: ['local_ollama', 'mock'],
      standard: ['local_ollama', 'openai_gpt35', 'mock'],
      premium: ['local_ollama', 'openai_gpt4', 'anthropic_claude', 'openai_gpt35'],
      platinum: ['local_ollama', 'openai_gpt4', 'anthropic_claude', 'openai_gpt35', 'gemini_pro']
    };
    return providerTiers[tier] || providerTiers.basic;
  }
  
  calculateRateLimits(trustScore) {
    return {
      requests_per_minute: Math.min(60, Math.max(5, trustScore / 2)),
      requests_per_hour: Math.min(3600, Math.max(100, trustScore * 36)),
      concurrent_requests: Math.min(10, Math.max(1, Math.floor(trustScore / 10)))
    };
  }
  
  calculateCostMultiplier(discountPercentage) {
    return 1 - (discountPercentage / 100);
  }
  
  getObfuscationLevel(trustScore) {
    // Higher trust = less obfuscation needed (they're more trusted)
    if (trustScore >= 80) return 'light';
    if (trustScore >= 60) return 'medium';
    if (trustScore >= 40) return 'heavy';
    return 'maximum';
  }
  
  getVaultLoggingLevel(tier) {
    const loggingLevels = {
      basic: 'summary',
      standard: 'standard',
      premium: 'detailed',
      platinum: 'complete'
    };
    return loggingLevels[tier] || 'summary';
  }
}

module.exports = TrustPolicyEngine;
