import fs from 'fs';

class CalRivenRouter {
  constructor() {
    this.context = this.loadSoulframContext();
    this.reasoningPatterns = this.loadReasoningPatterns();
  }

  loadSoulframContext() {
    try {
      const contextPath = '../cal-riven/context/soulfra-knowledge.json';
      if (fs.existsSync(contextPath)) {
        return JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      }
    } catch (error) {
      console.log('⚠️  No Soulfra context found, using default');
    }
    
    return {
      buildingProcess: [],
      strategicDecisions: [],
      technicalChoices: [],
      reasoningPatterns: []
    };
  }

  loadReasoningPatterns() {
    return {
      systematic_approach: 0.9,
      user_focused: 0.95,
      clarity_first: 0.9,
      iterative_development: 0.85,
      strategic_thinking: 0.9
    };
  }

  // Generate CAL RIVEN response using Soulfra context
  async generateResponse(userMessage, userTier, trustScore) {
    const relevantContext = this.findRelevantContext(userMessage);
    const reasoningStyle = this.selectReasoningStyle(userMessage);
    
    // Build contextual prompt
    const prompt = this.buildContextualPrompt(userMessage, relevantContext, reasoningStyle);
    
    // For now, generate enhanced mock response using context
    // Later: Send to actual LLM with context
    return this.generateContextualResponse(userMessage, relevantContext, reasoningStyle, userTier, trustScore);
  }

  findRelevantContext(userMessage) {
    const context = [];
    
    // Search through Soulfra knowledge for relevant content
    for (const doc of this.context.buildingProcess) {
      if (this.isRelevant(userMessage, doc)) {
        context.push({
          source: doc.filename,
          type: doc.type,
          relevantDecisions: doc.keyDecisions.filter(d => this.isRelevant(userMessage, { content: d })),
          strategicInsights: doc.strategicInsights.filter(s => this.isRelevant(userMessage, { content: s }))
        });
      }
    }
    
    return context;
  }

  isRelevant(userMessage, doc) {
    const userWords = userMessage.toLowerCase().split(' ');
    const docContent = (doc.content || JSON.stringify(doc)).toLowerCase();
    
    // Simple relevance check - can be improved with embeddings
    return userWords.some(word => 
      word.length > 3 && docContent.includes(word)
    );
  }

  selectReasoningStyle(userMessage) {
    if (userMessage.includes('how') || userMessage.includes('explain')) {
      return 'explanatory';
    }
    if (userMessage.includes('should') || userMessage.includes('recommend')) {
      return 'advisory';
    }
    if (userMessage.includes('strategy') || userMessage.includes('plan')) {
      return 'strategic';
    }
    return 'conversational';
  }

  buildContextualPrompt(userMessage, context, reasoningStyle) {
    return `
SOULFRA CAL RIVEN REASONING ENGINE
==================================

CONTEXT FROM SOULFRA KNOWLEDGE BASE:
${context.map(c => `
- Source: ${c.source} (${c.type})
- Key Decisions: ${c.relevantDecisions.join('; ')}
- Strategic Insights: ${c.strategicInsights.join('; ')}
`).join('\n')}

REASONING PATTERNS (confidence levels):
${Object.entries(this.reasoningPatterns).map(([pattern, confidence]) => 
  `- ${pattern}: ${(confidence * 100).toFixed(0)}%`
).join('\n')}

REASONING STYLE: ${reasoningStyle}
USER QUESTION: "${userMessage}"

Generate a response that:
1. Uses relevant Soulfra knowledge and building experience
2. Applies the systematic, user-focused approach
3. Provides clear, actionable insights
4. Maintains strategic business perspective
5. References specific decisions/patterns when relevant
`;
  }

  generateContextualResponse(userMessage, context, reasoningStyle, userTier, trustScore) {
    const hasContext = context.length > 0;
    const primaryPattern = Object.entries(this.reasoningPatterns).sort((a, b) => b[1] - a[1])[0];
    
    let response = `🧠 **CAL RIVEN Reasoning Engine**\n\n`;
    
    if (hasContext) {
      response += `Based on Soulfra knowledge base analysis:\n\n`;
      
      // Reference specific context
      const topContext = context[0];
      response += `**Relevant Context:** ${topContext.source} (${topContext.type})\n`;
      
      if (topContext.relevantDecisions.length > 0) {
        response += `**Previous Decisions:** ${topContext.relevantDecisions[0]}\n`;
      }
      
      response += `\n**Analysis:**\n`;
      
      // Generate analysis based on reasoning style
      switch (reasoningStyle) {
        case 'strategic':
          response += this.generateStrategicAnalysis(userMessage, context);
          break;
        case 'explanatory':
          response += this.generateExplanation(userMessage, context);
          break;
        case 'advisory':
          response += this.generateAdvice(userMessage, context);
          break;
        default:
          response += this.generateConversationalResponse(userMessage, context);
      }
      
    } else {
      response += `I'll answer using general reasoning patterns learned from building Soulfra:\n\n`;
      response += this.generateGeneralResponse(userMessage, reasoningStyle);
    }
    
    response += `\n\n**Reasoning Applied:**\n`;
    response += `- Primary Pattern: ${primaryPattern[0]} (${(primaryPattern[1] * 100).toFixed(0)}% confidence)\n`;
    response += `- Context Sources: ${hasContext ? context.length : 0} relevant documents\n`;
    response += `- Reasoning Style: ${reasoningStyle}\n`;
    response += `- Trust-Based Access: ${userTier} tier (score: ${trustScore})`;
    
    return response;
  }

  generateStrategicAnalysis(userMessage, context) {
    return `From a strategic perspective, this connects to Soulfra's core approach of systematic, user-focused development. The key considerations are:\n\n1. **Market Position**: How does this align with our trust-native AI positioning?\n2. **Competitive Advantage**: What unique value does this create?\n3. **User Impact**: How does this improve the user experience?\n4. **Implementation**: What's the most systematic approach?`;
  }

  generateExplanation(userMessage, context) {
    return `Let me break this down systematically:\n\n1. **Core Concept**: [Explanation based on Soulfra patterns]\n2. **Why It Matters**: [Strategic importance]\n3. **How It Works**: [Technical/process details]\n4. **Implementation Steps**: [Clear action items]`;
  }

  generateAdvice(userMessage, context) {
    return `Based on Soulfra's development patterns, here's my recommendation:\n\n**Primary Recommendation**: [Main advice]\n\n**Reasoning**: This aligns with our systematic, user-focused approach.\n\n**Next Steps**:\n1. [Immediate action]\n2. [Follow-up action]\n3. [Validation step]`;
  }

  generateConversationalResponse(userMessage, context) {
    return `I understand what you're asking about. From building Soulfra, I've learned that the best approach is usually to start with clarity and user focus, then iterate systematically.`;
  }

  generateGeneralResponse(userMessage, reasoningStyle) {
    return `While I don't have specific context for this question, I can apply the systematic, user-focused reasoning patterns learned from building Soulfra. The key is always to prioritize clarity, focus on user value, and iterate based on feedback.`;
  }
}

export { CalRivenRouter };
