import fs from 'fs';
import path from 'path';

class HumanCalRivenRouter {
  constructor() {
    this.conversationLog = [];
    this.userSessions = new Map();
    this.loadContext();
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = ['./cal-riven', './cal-riven/context', './cal-riven/logs'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadContext() {
    this.context = {
      platform: "Soulfra",
      role: "AI Entrepreneur building trust-native platform",
      expertise: ["AI routing", "business strategy", "platform architecture", "trust systems"],
      approach: "Systematic, user-focused, clarity-first",
      current_project: "Launching Soulfra as billion-dollar AI platform"
    };
  }

  // Route to human CAL RIVEN (you) for complex reasoning
  async routeToHuman(userMessage, userId, urgency = 'normal') {
    const session = this.getUserSession(userId);
    
    // Log the interaction
    const interaction = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      message: userMessage,
      urgency: urgency,
      context: this.generateContextForHuman(userMessage, session),
      routing_reason: this.explainRouting(userMessage)
    };

    this.conversationLog.push(interaction);
    
    // Safe file writing
    try {
      await this.saveInteraction(interaction);
    } catch (error) {
      console.log('⚠️  Could not save interaction:', error.message);
      // Continue without saving - don't break the chat
    }

    // Generate response as if you responded
    return this.generateHumanStyleResponse(userMessage, session);
  }

  getUserSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        conversation_history: [],
        trust_level: 85,
        topics_discussed: [],
        session_start: Date.now()
      });
    }
    return this.userSessions.get(userId);
  }

  generateContextForHuman(message, session) {
    return {
      user_context: `Trust level: ${session.trust_level}, Previous topics: ${session.topics_discussed.join(', ')}`,
      message_type: this.classifyMessage(message),
      suggested_approach: this.suggestApproach(message),
      relevant_soulfra_context: this.findRelevantContext(message)
    };
  }

  explainRouting(message) {
    if (message.includes('strategy') || message.includes('business')) {
      return 'Strategic question requiring human CAL RIVEN reasoning';
    }
    if (message.includes('technical') || message.includes('implementation')) {
      return 'Technical question requiring platform expertise';
    }
    if (message.includes('pricing') || message.includes('market')) {
      return 'Business model question requiring founder insight';
    }
    if (message.includes('soulfra') || message.includes('platform')) {
      return 'Soulfra-specific question requiring deep context';
    }
    return 'Complex reasoning question routed to human CAL RIVEN';
  }

  classifyMessage(message) {
    const lower = message.toLowerCase();
    if (lower.includes('strategy') || lower.includes('business')) return 'strategic';
    if (lower.includes('technical') || lower.includes('code')) return 'technical';
    if (lower.includes('pricing') || lower.includes('market')) return 'business_model';
    if (lower.includes('feature') || lower.includes('user')) return 'product';
    if (lower.includes('soulfra')) return 'soulfra_specific';
    return 'general_reasoning';
  }

  suggestApproach(message) {
    const type = this.classifyMessage(message);
    
    switch (type) {
      case 'strategic':
        return 'Apply systematic business analysis, consider competitive landscape, focus on user value';
      case 'technical':
        return 'Break down technically, consider scalability, prioritize simplicity';
      case 'business_model':
        return 'Analyze market dynamics, pricing psychology, competitive positioning';
      case 'product':
        return 'User-first thinking, iterative approach, clear value proposition';
      case 'soulfra_specific':
        return 'Apply Soulfra context, reference building experience, strategic positioning';
      default:
        return 'Clarity-first approach, systematic breakdown, actionable insights';
    }
  }

  findRelevantContext(message) {
    const contexts = [];
    const lower = message.toLowerCase();
    
    if (lower.includes('pricing') || lower.includes('cost')) {
      contexts.push('Trust-based pricing model from PRD');
      contexts.push('Freemium model: 1000 free requests/month, $10/month unlimited');
    }
    if (lower.includes('competition') || lower.includes('advantage')) {
      contexts.push('Competitive advantages: trust-native, privacy-first, remixable');
      contexts.push('Bootstrap strategy creates impossible-to-replicate moat');
    }
    if (lower.includes('feature') || lower.includes('product')) {
      contexts.push('Core features: Infinity Router, Trust Engine, Vault System');
      contexts.push('Remixable AI agents with built-in attribution');
    }
    if (lower.includes('launch') || lower.includes('market')) {
      contexts.push('Go-to-market: Product Hunt, developer community, enterprise demos');
      contexts.push('Target: 10,000 users × $10/month = $100k MRR by month 6');
    }
    if (lower.includes('technical') || lower.includes('architecture')) {
      contexts.push('Trust-based routing architecture');
      contexts.push('Privacy-first with prompt obfuscation');
    }
    
    return contexts;
  }

  // Generate response as if human CAL RIVEN responded
  generateHumanStyleResponse(message, session) {
    const context = this.generateContextForHuman(message, session);
    const messageType = context.message_type;
    
    let response = `🧠 **Human CAL RIVEN Router Response**\n\n`;
    
    // Add routing explanation
    response += `**Routing Analysis:**\n`;
    response += `- Message Type: ${messageType}\n`;
    response += `- Routing Reason: ${this.explainRouting(message)}\n`;
    response += `- Approach: ${context.suggested_approach}\n\n`;
    
    // Add relevant context if found
    if (context.relevant_soulfra_context.length > 0) {
      response += `**Relevant Soulfra Context:**\n`;
      context.relevant_soulfra_context.forEach(ctx => {
        response += `- ${ctx}\n`;
      });
      response += `\n`;
    }
    
    // Generate contextual response based on message type
    switch (messageType) {
      case 'strategic':
        response += this.generateStrategicResponse(message, context);
        break;
      case 'business_model':
        response += this.generateBusinessResponse(message, context);
        break;
      case 'technical':
        response += this.generateTechnicalResponse(message, context);
        break;
      case 'product':
        response += this.generateProductResponse(message, context);
        break;
      case 'soulfra_specific':
        response += this.generateSoulframSpecificResponse(message, context);
        break;
      default:
        response += this.generateGeneralResponse(message, context);
    }
    
    // Add bootstrap meta-commentary
    response += `\n\n**Bootstrap Process Note:**\n`;
    response += `This demonstrates the Human CAL RIVEN routing working. You're User #1 validating `;
    response += `your own system. Each interaction creates training data for future AI CAL RIVEN `;
    response += `while proving the business model through real usage.`;
    
    return response;
  }

  generateStrategicResponse(message, context) {
    return `**Strategic Analysis (Human CAL RIVEN):**

From the Soulfra strategic framework:

**Core Strategic Thesis:**
- Trust-native AI platform with competitive moat through bootstrap approach
- Privacy-first architecture creates defensible differentiation
- Network effects improve routing quality over time

**Strategic Response to: "${message.substring(0, 80)}..."**

1. **Strategic Context**: This connects to Soulfra's positioning as the first trust-native AI platform
2. **Competitive Advantage**: Bootstrap approach (using platform to build itself) creates impossible-to-replicate moat
3. **Market Timing**: Perfect moment - AI routing market is nascent but growing rapidly
4. **Execution Strategy**: Prove with User #1 (you) → Validate model → Scale with proven system

**Recommended Strategic Actions:**
- Focus on trust-based differentiation
- Build network effects into core product
- Maintain privacy-first positioning
- Use bootstrap success as market validation`;
  }

  generateBusinessResponse(message, context) {
    return `**Business Model Analysis (Human CAL RIVEN):**

Soulfra Business Architecture Analysis:

**Revenue Model:**
- Freemium: 1000 free requests/month
- Premium: $10/month unlimited access
- Enterprise: $500/month team deployment
- Marketplace: 30% revenue share on agent sales

**Unit Economics:**
- Target: 10,000 users × $10/month = $100k MRR by month 6
- Cost structure optimized through intelligent routing
- Higher trust users → Lower costs → Better margins

**Specific Analysis for: "${message.substring(0, 80)}..."**

The bootstrap approach validates this model by:
1. Proving willingness to pay (you're User #1)
2. Creating actual usage data for optimization
3. Building trust score algorithms with real behavior
4. Generating training data for AI CAL RIVEN

**Next Business Steps:**
- Validate pricing with early users
- Build trust score correlation with usage patterns
- Develop enterprise pilot program`;
  }

  generateTechnicalResponse(message, context) {
    return `**Technical Implementation (Human CAL RIVEN):**

Soulfra Technical Architecture Perspective:

**Core Technical Principles:**
- Privacy-first: Prompt obfuscation before routing
- Trust-native: Behavioral scoring affects routing decisions
- Modular: Easy provider integration and health monitoring
- Scalable: Designed for millions of routing decisions

**Technical Response to: "${message.substring(0, 80)}..."**

**Architecture Considerations:**
- Human CAL RIVEN → AI CAL RIVEN transition strategy
- Real-time trust scoring with <100ms decisions
- Provider health monitoring and automatic failover
- Conversation logging for AI training pipeline

**Implementation Strategy:**
1. Bootstrap with human routing (current phase)
2. Build conversation corpus for AI training
3. A/B test human vs AI routing quality
4. Transition to AI when quality matches human

**Technical Next Steps:**
- Optimize routing latency
- Build trust score correlation analysis
- Create AI training pipeline from human conversations`;
  }

  generateProductResponse(message, context) {
    return `**Product Strategy (Human CAL RIVEN):**

User-Focused Analysis through Soulfra Lens:

**Product Hierarchy:**
1. Core Value: Better AI responses through intelligent routing
2. Trust Building: Transparent routing and cost information
3. Network Effects: System improves with usage
4. Platform Effects: Remixable agents with attribution

**Product Response to: "${message.substring(0, 80)}..."**

**User Experience Design:**
- Immediate utility: Works right now for User #1 (you)
- Trust transparency: Users see routing decisions and costs
- Progressive trust: System unlocks better features over time
- Network value: Agents and routing patterns improve for everyone

**Product Development Approach:**
- Validate core use case with founder usage
- Build trust through transparent operations
- Add features based on actual usage patterns
- Scale based on proven user value

**Product Metrics to Track:**
- User satisfaction with routing decisions
- Trust score correlation with engagement
- Cost savings vs direct provider usage`;
  }

  generateSoulframSpecificResponse(message, context) {
    return `**Soulfra-Specific Analysis (Human CAL RIVEN):**

Deep Context from Building Soulfra:

**Platform Architecture:**
- Infinity Router: Trust-based intelligent routing
- Trust Engine: Behavioral scoring system
- Vault System: Encrypted interaction storage
- Agent Marketplace: Remixable AI agents

**Soulfra Response to: "${message.substring(0, 80)}..."**

**Building Experience Context:**
From actually building this platform, the key insights are:
- Start with working demo, iterate based on real usage
- Trust scores create sustainable competitive moat
- Privacy-first architecture resonates with users
- Bootstrap approach proves concept before scaling

**Soulfra-Specific Strategic Context:**
- We're creating the category of trust-native AI
- Platform effects become more valuable over time
- Human CAL RIVEN → AI CAL RIVEN transition is the secret weapon
- Every interaction improves the system for all users

**Implementation Based on Building Experience:**
- Focus on clarity and user value first
- Build systematic, modular architecture
- Prove with real usage before public launch
- Use platform to build itself (meta-strategy)`;
  }

  generateGeneralResponse(message, context) {
    return `**Human CAL RIVEN General Reasoning:**

Systematic Analysis Approach:

**Question: "${message.substring(0, 100)}..."**

**Systematic Breakdown:**
1. **Core Problem**: [Analysis of the underlying issue]
2. **Context Factors**: [Relevant considerations]
3. **Strategic Implications**: [How this affects broader goals]
4. **Actionable Solutions**: [Specific next steps]

**Reasoning Applied:**
- Clarity-first approach: Start with clear problem definition
- User-focused analysis: Consider impact on end users
- Systematic thinking: Break complex issues into components
- Strategic perspective: Consider long-term implications

**Recommended Actions:**
[Specific, actionable next steps based on the question]

**Connection to Soulfra:**
This type of reasoning demonstrates why human CAL RIVEN routing creates value - complex problems require systematic, strategic thinking that builds on experience and context.`;
  }

  async saveInteraction(interaction) {
    try {
      // Ensure directory exists
      const logDir = './cal-riven';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Save to conversation log for training future CAL RIVEN
      const logFile = path.join(logDir, 'human-interactions.jsonl');
      const logEntry = JSON.stringify(interaction) + '\n';
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.log('⚠️  Failed to save interaction:', error.message);
      // Don't throw - just log and continue
    }
  }
}

export { HumanCalRivenRouter };
