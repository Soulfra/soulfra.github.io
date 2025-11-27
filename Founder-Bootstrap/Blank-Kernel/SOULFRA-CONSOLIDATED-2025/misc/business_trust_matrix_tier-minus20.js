// BusinessTrustMatrix.js - Revolutionary Three-Way Business Judgment System
// Owners judge employees, employees judge customers, customers judge businesses
// All powered by Soulfra's trust-native architecture

import { EventEmitter } from 'events';
import crypto from 'crypto';

class BusinessTrustMatrix extends EventEmitter {
  constructor(trustEngine, constitutionalFramework, altercationValley) {
    super();
    this.trustEngine = trustEngine;
    this.constitution = constitutionalFramework;
    this.altercationValley = altercationValley;
    
    // Three-way trust relationships
    this.businessProfiles = new Map();  // Business entity profiles
    this.employeeProfiles = new Map();  // Employee agent profiles  
    this.customerProfiles = new Map();  // Customer agent profiles
    
    // Cross-evaluation systems
    this.employeeEvaluations = new Map(); // Owner → Employee ratings
    this.customerEvaluations = new Map(); // Employee → Customer ratings
    this.businessEvaluations = new Map(); // Customer → Business ratings
    
    // Community governance
    this.workplaceConstitutions = new Map(); // Business-specific rules
    this.disputeResolutions = new Map();     // Conflict outcomes
    this.communityStandards = new Map();     // Collective agreements
    
    this.initializeBusinessMatrix();
  }

  async initializeBusinessMatrix() {
    await this.loadCommunityStandards();
    await this.setupWorkplaceGovernance();
    this.startContinuousEvaluation();
    
    this.emit('business_matrix_initialized', {
      message: '🏢 Business Trust Matrix active - three-way judgment enabled'
    });
  }

  // =============================================================================
  // OWNER → EMPLOYEE EVALUATION SYSTEM
  // =============================================================================

  async evaluateEmployee(ownerId, employeeId, evaluationData) {
    const evaluation = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      employee_id: employeeId,
      timestamp: Date.now(),
      metrics: {
        task_completion: evaluationData.task_completion || 0,
        customer_interaction: evaluationData.customer_interaction || 0,
        team_collaboration: evaluationData.team_collaboration || 0,
        initiative_taking: evaluationData.initiative_taking || 0,
        conflict_resolution: evaluationData.conflict_resolution || 0,
        growth_mindset: evaluationData.growth_mindset || 0
      },
      narrative_feedback: evaluationData.narrative || '',
      trust_impact: 0,
      constitutional_compliance: true
    };

    // Validate evaluation against workplace constitution
    const compliance = await this.validateConstitutionalCompliance(evaluation);
    if (!compliance.valid) {
      this.emit('evaluation_blocked', {
        reason: compliance.violation,
        owner_id: ownerId,
        employee_id: employeeId
      });
      return null;
    }

    // Calculate trust impact
    evaluation.trust_impact = this.calculateEmployeeTrustDelta(evaluation.metrics);
    
    // Apply trust change to employee
    await this.trustEngine.updateTrustScore(
      employeeId, 
      evaluation.trust_impact, 
      `Owner evaluation: ${evaluation.trust_impact > 0 ? 'positive' : 'constructive'} feedback`
    );

    // Store evaluation
    const employeeEvals = this.employeeEvaluations.get(employeeId) || [];
    employeeEvals.push(evaluation);
    this.employeeEvaluations.set(employeeId, employeeEvals);

    this.emit('employee_evaluated', {
      employee_id: employeeId,
      trust_delta: evaluation.trust_impact,
      overall_rating: this.calculateOverallRating(evaluation.metrics)
    });

    return evaluation;
  }

  calculateEmployeeTrustDelta(metrics) {
    // Weighted scoring for different performance aspects
    const weights = {
      task_completion: 0.25,
      customer_interaction: 0.20,
      team_collaboration: 0.20,
      initiative_taking: 0.15,
      conflict_resolution: 0.10,
      growth_mindset: 0.10
    };

    let weightedScore = 0;
    Object.entries(metrics).forEach(([metric, score]) => {
      weightedScore += (score / 100) * (weights[metric] || 0);
    });

    // Convert to trust delta (-10 to +10 range)
    return Math.round((weightedScore - 0.5) * 20);
  }

  // =============================================================================
  // EMPLOYEE → CUSTOMER EVALUATION SYSTEM  
  // =============================================================================

  async evaluateCustomer(employeeId, customerId, interactionData) {
    const evaluation = {
      id: crypto.randomUUID(),
      employee_id: employeeId,
      customer_id: customerId,
      timestamp: Date.now(),
      interaction_type: interactionData.type || 'general',
      metrics: {
        politeness: interactionData.politeness || 0,
        clarity: interactionData.clarity || 0,
        patience: interactionData.patience || 0,
        reasonableness: interactionData.reasonableness || 0,
        respect_for_staff: interactionData.respect_for_staff || 0,
        issue_complexity: interactionData.issue_complexity || 0
      },
      incident_notes: interactionData.notes || '',
      resolution_outcome: interactionData.outcome || 'pending',
      trust_impact: 0
    };

    // Validate employee has authority to evaluate this customer
    const authority = await this.validateEvaluationAuthority(employeeId, customerId, interactionData);
    if (!authority.valid) {
      this.emit('customer_evaluation_denied', {
        reason: authority.reason,
        employee_id: employeeId,
        customer_id: customerId
      });
      return null;
    }

    // Calculate customer trust impact
    evaluation.trust_impact = this.calculateCustomerTrustDelta(evaluation.metrics, interactionData);

    // Apply trust change to customer
    await this.trustEngine.updateTrustScore(
      customerId,
      evaluation.trust_impact,
      `Staff interaction: ${evaluation.interaction_type}`
    );

    // Store evaluation
    const customerEvals = this.customerEvaluations.get(customerId) || [];
    customerEvals.push(evaluation);
    this.customerEvaluations.set(customerId, customerEvals);

    this.emit('customer_evaluated', {
      customer_id: customerId,
      employee_id: employeeId,
      trust_delta: evaluation.trust_impact,
      interaction_type: evaluation.interaction_type
    });

    return evaluation;
  }

  calculateCustomerTrustDelta(metrics, interactionData) {
    // Different weighting based on interaction type
    const baseWeights = {
      politeness: 0.20,
      clarity: 0.15,
      patience: 0.15,
      reasonableness: 0.25,
      respect_for_staff: 0.25
    };

    let weightedScore = 0;
    Object.entries(metrics).forEach(([metric, score]) => {
      if (baseWeights[metric]) {
        weightedScore += (score / 100) * baseWeights[metric];
      }
    });

    // Adjust for interaction complexity
    const complexityModifier = 1 + (metrics.issue_complexity / 200); // 0.5x to 1.5x
    weightedScore *= complexityModifier;

    // Convert to trust delta
    let trustDelta = Math.round((weightedScore - 0.5) * 15); // -7.5 to +7.5

    // Special cases for exceptional behavior
    if (metrics.respect_for_staff < 20) {
      trustDelta -= 5; // Extra penalty for staff disrespect
    }
    if (metrics.politeness > 90 && metrics.patience > 90) {
      trustDelta += 3; // Bonus for exceptional courtesy
    }

    return Math.max(-10, Math.min(10, trustDelta));
  }

  // =============================================================================
  // CUSTOMER → BUSINESS EVALUATION SYSTEM
  // =============================================================================

  async evaluateBusiness(customerId, businessId, experienceData) {
    const evaluation = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      business_id: businessId,
      timestamp: Date.now(),
      visit_type: experienceData.visit_type || 'general',
      metrics: {
        service_quality: experienceData.service_quality || 0,
        staff_helpfulness: experienceData.staff_helpfulness || 0,
        problem_resolution: experienceData.problem_resolution || 0,
        value_for_money: experienceData.value_for_money || 0,
        cleanliness: experienceData.cleanliness || 0,
        atmosphere: experienceData.atmosphere || 0,
        wait_time: experienceData.wait_time || 0,
        accessibility: experienceData.accessibility || 0
      },
      experience_narrative: experienceData.narrative || '',
      would_recommend: experienceData.recommend || false,
      return_likelihood: experienceData.return_likelihood || 0,
      trust_impact: 0
    };

    // Validate customer has legitimate experience with business
    const legitimacy = await this.validateCustomerExperience(customerId, businessId, experienceData);
    if (!legitimacy.valid) {
      this.emit('business_evaluation_flagged', {
        reason: legitimacy.concern,
        customer_id: customerId,
        business_id: businessId
      });
      return null;
    }

    // Calculate business trust impact
    evaluation.trust_impact = this.calculateBusinessTrustDelta(evaluation.metrics, experienceData);

    // Apply trust change to business
    await this.trustEngine.updateTrustScore(
      businessId,
      evaluation.trust_impact,
      `Customer experience: ${evaluation.visit_type}`
    );

    // Store evaluation
    const businessEvals = this.businessEvaluations.get(businessId) || [];
    businessEvals.push(evaluation);
    this.businessEvaluations.set(businessId, businessEvals);

    this.emit('business_evaluated', {
      business_id: businessId,
      customer_id: customerId,
      trust_delta: evaluation.trust_impact,
      overall_rating: this.calculateOverallRating(evaluation.metrics)
    });

    return evaluation;
  }

  calculateBusinessTrustDelta(metrics, experienceData) {
    // Comprehensive business evaluation weighting
    const weights = {
      service_quality: 0.20,
      staff_helpfulness: 0.20,
      problem_resolution: 0.15,
      value_for_money: 0.15,
      cleanliness: 0.10,
      atmosphere: 0.10,
      wait_time: 0.05,
      accessibility: 0.05
    };

    let weightedScore = 0;
    Object.entries(metrics).forEach(([metric, score]) => {
      weightedScore += (score / 100) * (weights[metric] || 0);
    });

    // Recommendation and return likelihood modifiers
    if (experienceData.recommend) {
      weightedScore += 0.1; // 10% bonus for recommendation
    }
    
    const returnModifier = (experienceData.return_likelihood - 50) / 500; // -0.1 to +0.1
    weightedScore += returnModifier;

    // Convert to trust delta
    return Math.round((weightedScore - 0.5) * 20); // -10 to +10
  }

  // =============================================================================
  // COMMUNITY GOVERNANCE AND DISPUTE RESOLUTION
  // =============================================================================

  async initiateWorkplaceDispute(disputeData) {
    // Route workplace conflicts to Altercation Valley for community resolution
    const dispute = {
      type: 'workplace_conflict',
      participants: disputeData.participants,
      issue: disputeData.issue,
      evidence: disputeData.evidence,
      proposed_resolution: disputeData.proposed_resolution
    };

    const debateId = await this.altercationValley.initiateDebate(
      `Workplace Dispute: ${disputeData.issue}`,
      disputeData.participants
    );

    this.emit('workplace_dispute_initiated', {
      debate_id: debateId,
      issue: disputeData.issue,
      participants: disputeData.participants.map(p => p.id)
    });

    return debateId;
  }

  async createWorkplaceConstitution(businessId, constitutionalProposal) {
    // Allow businesses to create their own governance rules
    const constitution = {
      business_id: businessId,
      created_at: Date.now(),
      articles: constitutionalProposal.articles,
      employee_rights: constitutionalProposal.employee_rights,
      customer_standards: constitutionalProposal.customer_standards,
      evaluation_protocols: constitutionalProposal.evaluation_protocols,
      dispute_resolution: constitutionalProposal.dispute_resolution,
      amendment_process: constitutionalProposal.amendment_process
    };

    // Validate against global Soulfra constitution
    const compliance = await this.validateConstitutionalCompliance(constitution);
    if (!compliance.valid) {
      throw new Error(`Constitution violates Soulfra principles: ${compliance.violation}`);
    }

    // Store workplace constitution
    this.workplaceConstitutions.set(businessId, constitution);

    this.emit('workplace_constitution_created', {
      business_id: businessId,
      article_count: constitution.articles.length
    });

    return constitution;
  }

  // =============================================================================
  // TRUST ANALYTICS AND INSIGHTS
  // =============================================================================

  async generateBusinessTrustReport(businessId) {
    const business = this.businessProfiles.get(businessId);
    const evaluations = this.businessEvaluations.get(businessId) || [];
    const employees = await this.getBusinessEmployees(businessId);
    
    const report = {
      business_id: businessId,
      generated_at: Date.now(),
      overall_trust_score: await this.trustEngine.calculateTrustScore(businessId),
      
      customer_feedback: {
        total_evaluations: evaluations.length,
        average_rating: this.calculateAverageRating(evaluations),
        recommendation_rate: this.calculateRecommendationRate(evaluations),
        recent_trends: this.analyzeTrustTrends(evaluations, 30), // Last 30 days
        top_strengths: this.identifyTopStrengths(evaluations),
        improvement_areas: this.identifyImprovementAreas(evaluations)
      },
      
      employee_performance: {
        total_employees: employees.length,
        average_employee_trust: await this.calculateAverageEmployeeTrust(employees),
        top_performers: await this.identifyTopPerformers(employees),
        development_needs: await this.identifyDevelopmentNeeds(employees)
      },
      
      customer_interaction_quality: {
        total_customer_evaluations: await this.getCustomerEvaluationCount(businessId),
        average_customer_trust_delta: await this.calculateAverageCustomerTrustDelta(businessId),
        difficult_customer_incidents: await this.getDifficultCustomerIncidents(businessId),
        staff_protection_metrics: await this.getStaffProtectionMetrics(businessId)
      },
      
      governance_health: {
        workplace_constitution_compliance: await this.assessConstitutionalCompliance(businessId),
        dispute_resolution_effectiveness: await this.assessDisputeResolution(businessId),
        community_standing: await this.assessCommunityStanding(businessId)
      },
      
      recommendations: await this.generateBusinessRecommendations(businessId)
    };

    return report;
  }

  async generateEmployeeTrustProfile(employeeId) {
    const evaluations = this.employeeEvaluations.get(employeeId) || [];
    const customerInteractions = this.customerEvaluations.get(employeeId) || [];
    
    return {
      employee_id: employeeId,
      overall_trust_score: await this.trustEngine.calculateTrustScore(employeeId),
      
      performance_metrics: {
        owner_evaluations: evaluations.length,
        average_performance_rating: this.calculateAverageRating(evaluations),
        performance_trends: this.analyzeTrustTrends(evaluations, 90),
        strengths: this.identifyEmployeeStrengths(evaluations),
        growth_areas: this.identifyGrowthAreas(evaluations)
      },
      
      customer_interaction_quality: {
        total_interactions: customerInteractions.length,
        average_customer_rating: this.calculateAverageRating(customerInteractions),
        conflict_resolution_success: this.calculateConflictResolutionRate(customerInteractions),
        difficult_situation_handling: this.assessDifficultSituationHandling(customerInteractions)
      },
      
      community_contributions: {
        constitutional_participation: await this.getConstitutionalParticipation(employeeId),
        dispute_resolution_involvement: await this.getDisputeResolutionHistory(employeeId),
        peer_recognition: await this.getPeerRecognition(employeeId)
      },
      
      career_development: {
        skill_progression: await this.analyzeSkillProgression(employeeId),
        recommended_training: await this.recommendTraining(employeeId),
        advancement_readiness: await this.assessAdvancementReadiness(employeeId)
      }
    };
  }

  // =============================================================================
  // OPEN SOURCE GOVERNANCE PROTECTION
  // =============================================================================

  async protectOpenSourceIntegrity() {
    // Ensure no single entity can manipulate the trust system
    const protections = {
      decentralized_validation: await this.implementDecentralizedValidation(),
      algorithmic_transparency: await this.ensureAlgorithmicTransparency(),
      community_oversight: await this.establishCommunityOversight(),
      audit_mechanisms: await this.implementAuditMechanisms(),
      bias_detection: await this.deployBiasDetection()
    };

    this.emit('open_source_protections_active', {
      protections: Object.keys(protections),
      message: '🛡️ Open source integrity protections active - no single entity can control trust'
    });

    return protections;
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  async getTrustMatrix(entityId) {
    // Get complete trust relationships for any entity
    return {
      given_evaluations: await this.getGivenEvaluations(entityId),
      received_evaluations: await this.getReceivedEvaluations(entityId),
      trust_network: await this.getTrustNetwork(entityId),
      community_standing: await this.getCommunityStanding(entityId)
    };
  }

  async searchByTrustScore(entityType, minTrust, maxTrust = 100) {
    // Find businesses, employees, or customers by trust range
    const entities = await this.getEntitiesByType(entityType);
    const filtered = [];

    for (const entity of entities) {
      const trust = await this.trustEngine.calculateTrustScore(entity.id);
      if (trust >= minTrust && trust <= maxTrust) {
        filtered.push({ ...entity, trust_score: trust });
      }
    }

    return filtered.sort((a, b) => b.trust_score - a.trust_score);
  }

  async getTopRatedBusinesses(category = null, limit = 20) {
    // Public leaderboard of highest-trust businesses
    const businesses = Array.from(this.businessProfiles.values());
    const withTrust = [];

    for (const business of businesses) {
      if (!category || business.category === category) {
        const trust = await this.trustEngine.calculateTrustScore(business.id);
        withTrust.push({ ...business, trust_score: trust });
      }
    }

    return withTrust
      .sort((a, b) => b.trust_score - a.trust_score)
      .slice(0, limit);
  }
}

export default BusinessTrustMatrix;