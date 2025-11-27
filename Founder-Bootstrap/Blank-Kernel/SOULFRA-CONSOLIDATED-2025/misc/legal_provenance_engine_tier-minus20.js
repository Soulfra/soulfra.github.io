/**
 * Legal Provenance & Ownership Engine
 * Ensures proper IP tracking, revenue sharing, and compliance for AI agent marketplace
 * Provides immutable ownership history and legal attestation for all agent transactions
 */

import crypto from 'crypto';
import { ethers } from 'ethers';

class LegalProvenanceEngine {
  constructor(options = {}) {
    this.blockchainProvider = options.blockchainProvider || null;
    this.contractAddress = options.contractAddress || null;
    this.privateKey = options.privateKey || null;
    this.jurisdiction = options.jurisdiction || 'US';
    this.complianceMode = options.complianceMode || 'standard';
    
    // Legal framework definitions
    this.jurisdictionRules = {
      'US': {
        ip_law: 'copyright',
        data_retention: '7_years',
        privacy_framework: 'ccpa',
        export_restrictions: ['cuba', 'iran', 'north_korea', 'syria'],
        age_verification_required: true,
        commercial_use_license_required: true
      },
      'EU': {
        ip_law: 'copyright',
        data_retention: '7_years',
        privacy_framework: 'gdpr',
        export_restrictions: ['sanctioned_entities'],
        age_verification_required: true,
        commercial_use_license_required: true,
        right_to_deletion: true,
        data_portability: true
      },
      'UK': {
        ip_law: 'copyright',
        data_retention: '7_years',
        privacy_framework: 'uk_gdpr',
        export_restrictions: ['sanctioned_entities'],
        age_verification_required: true,
        commercial_use_license_required: true
      }
    };

    // Revenue sharing templates
    this.revenueShareTemplates = {
      'standard': {
        original_creator: 0.60,
        platform_fee: 0.25,
        evolution_contributors: 0.15
      },
      'enterprise': {
        original_creator: 0.50,
        platform_fee: 0.30,
        evolution_contributors: 0.20
      },
      'open_source': {
        original_creator: 0.40,
        platform_fee: 0.20,
        community_pool: 0.25,
        evolution_contributors: 0.15
      }
    };

    // Legal document templates
    this.legalTemplates = {
      'agent_creation_agreement': this.getCreationAgreementTemplate(),
      'transfer_agreement': this.getTransferAgreementTemplate(),
      'revenue_sharing_agreement': this.getRevenueAgreementTemplate(),
      'privacy_notice': this.getPrivacyNoticeTemplate()
    };
  }

  async initialize() {
    console.log('⚖️ Initializing Legal Provenance Engine...');
    
    if (this.blockchainProvider) {
      await this.initializeBlockchain();
    }
    
    console.log('✅ Legal Provenance Engine ready');
  }

  async initializeBlockchain() {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(this.blockchainProvider);
      if (this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      }
      console.log('🔗 Blockchain integration initialized');
    } catch (error) {
      console.warn('Blockchain initialization failed, using local attestation only');
    }
  }

  /**
   * Creates initial agent ownership record
   */
  async createAgentProvenance(agentData, creatorData) {
    const timestamp = new Date().toISOString();
    const agentId = agentData.id;
    
    // Generate legal identifiers
    const provenanceId = this.generateProvenanceId(agentId, timestamp);
    const legalHash = this.generateLegalHash(agentData, creatorData, timestamp);
    
    // Determine jurisdiction and compliance requirements
    const jurisdiction = this.determineJurisdiction(creatorData);
    const complianceCheck = await this.performComplianceCheck(agentData, creatorData, jurisdiction);
    
    if (!complianceCheck.compliant) {
      throw new Error(`Compliance violation: ${complianceCheck.violations.join(', ')}`);
    }

    // Create provenance record
    const provenance = {
      provenance_id: provenanceId,
      agent_id: agentId,
      legal_hash: legalHash,
      created_at: timestamp,
      jurisdiction: jurisdiction,
      
      // Ownership chain
      ownership_chain: [{
        owner: creatorData.fingerprint,
        owner_type: 'individual',
        acquired_at: timestamp,
        acquisition_type: 'creation',
        transaction_hash: null,
        legal_attestation: this.generateLegalAttestation('creation', agentData, creatorData),
        witness_signatures: [],
        compliance_verification: complianceCheck
      }],
      
      // Intellectual property
      intellectual_property: {
        creator_attribution: [creatorData.fingerprint],
        creation_method: agentData.creation_method || 'platform_generated',
        derivative_work: false,
        parent_agents: [],
        remix_rights: this.determineRemixRights(agentData, creatorData),
        commercial_rights: this.determineCommercialRights(agentData, creatorData),
        revenue_sharing: this.calculateRevenueSharing(agentData, [creatorData.fingerprint])
      },
      
      // Compliance status
      compliance_status: {
        jurisdiction: jurisdiction,
        privacy_compliance: this.getPrivacyCompliance(jurisdiction),
        export_restrictions: this.getExportRestrictions(agentData, jurisdiction),
        age_appropriate: this.checkAgeAppropriateness(agentData),
        commercial_license: complianceCheck.commercial_license_required,
        data_classification: this.classifyDataSensitivity(agentData)
      },
      
      // Legal documents
      legal_documents: await this.generateLegalDocuments(agentData, creatorData, 'creation'),
      
      // Blockchain attestation (if available)
      blockchain_attestation: await this.createBlockchainAttestation(legalHash, 'creation')
    };

    // Store provenance record
    await this.storeProvenanceRecord(provenance);
    
    return provenance;
  }

  /**
   * Records agent ownership transfer
   */
  async transferAgentOwnership(agentId, transferData) {
    const timestamp = new Date().toISOString();
    
    // Load existing provenance
    const existingProvenance = await this.loadProvenanceRecord(agentId);
    if (!existingProvenance) {
      throw new Error('Agent provenance not found');
    }

    // Verify current ownership
    const currentOwner = this.getCurrentOwner(existingProvenance);
    if (currentOwner.owner !== transferData.seller_fingerprint) {
      throw new Error('Transfer unauthorized: seller is not current owner');
    }

    // Compliance checks
    const jurisdiction = this.determineJurisdiction(transferData.buyer_data);
    const transferCompliance = await this.performTransferCompliance(
      existingProvenance, 
      transferData, 
      jurisdiction
    );

    if (!transferCompliance.compliant) {
      throw new Error(`Transfer compliance violation: ${transferCompliance.violations.join(', ')}`);
    }

    // Create transfer record
    const transferRecord = {
      owner: transferData.buyer_fingerprint,
      owner_type: transferData.buyer_type || 'individual',
      acquired_at: timestamp,
      acquisition_type: 'purchase',
      transaction_hash: transferData.transaction_hash,
      sale_price: transferData.price,
      currency: transferData.currency || 'credits',
      seller: transferData.seller_fingerprint,
      legal_attestation: this.generateLegalAttestation('transfer', null, transferData),
      witness_signatures: transferData.witness_signatures || [],
      compliance_verification: transferCompliance,
      escrow_release: transferData.escrow_release || null
    };

    // Update provenance
    existingProvenance.ownership_chain.push(transferRecord);
    existingProvenance.updated_at = timestamp;
    
    // Update revenue sharing if needed
    if (transferData.update_revenue_sharing) {
      existingProvenance.intellectual_property.revenue_sharing = 
        this.recalculateRevenueSharing(existingProvenance, transferData);
    }

    // Generate transfer documents
    const transferDocuments = await this.generateLegalDocuments(
      null, 
      transferData, 
      'transfer',
      existingProvenance
    );
    existingProvenance.legal_documents.push(...transferDocuments);

    // Blockchain attestation
    const transferHash = this.generateTransferHash(transferRecord);
    const blockchainAttestation = await this.createBlockchainAttestation(transferHash, 'transfer');
    if (blockchainAttestation) {
      existingProvenance.blockchain_attestation = blockchainAttestation;
    }

    // Store updated provenance
    await this.storeProvenanceRecord(existingProvenance);

    // Trigger revenue distribution if applicable
    if (transferData.distribute_revenue) {
      await this.distributeRevenue(existingProvenance, transferData);
    }

    return existingProvenance;
  }

  /**
   * Records agent evolution/remix
   */
  async recordAgentEvolution(parentAgentId, childAgentId, evolutionData) {
    const timestamp = new Date().toISOString();
    
    // Load parent provenance
    const parentProvenance = await this.loadProvenanceRecord(parentAgentId);
    if (!parentProvenance) {
      throw new Error('Parent agent provenance not found');
    }

    // Create child provenance based on parent
    const childProvenance = {
      ...await this.createAgentProvenance(evolutionData.child_agent, evolutionData.creator_data),
      
      // Evolution-specific properties
      intellectual_property: {
        ...parentProvenance.intellectual_property,
        creator_attribution: [
          ...parentProvenance.intellectual_property.creator_attribution,
          evolutionData.creator_data.fingerprint
        ],
        derivative_work: true,
        parent_agents: [parentAgentId],
        evolution_type: evolutionData.evolution_type || 'remix',
        evolution_depth: (parentProvenance.intellectual_property.evolution_depth || 0) + 1,
        remix_license: this.determineRemixLicense(parentProvenance, evolutionData),
        revenue_sharing: this.calculateEvolutionRevenueSharing(parentProvenance, evolutionData)
      }
    };

    // Update parent provenance with child reference
    if (!parentProvenance.child_agents) {
      parentProvenance.child_agents = [];
    }
    parentProvenance.child_agents.push({
      child_agent_id: childAgentId,
      evolution_type: evolutionData.evolution_type,
      evolved_at: timestamp,
      creator: evolutionData.creator_data.fingerprint
    });

    // Store both records
    await this.storeProvenanceRecord(parentProvenance);
    await this.storeProvenanceRecord(childProvenance);

    return childProvenance;
  }

  /**
   * Generates legal attestation for agent actions
   */
  generateLegalAttestation(actionType, agentData, userData) {
    const timestamp = new Date().toISOString();
    const attestationId = this.generateAttestationId(actionType, timestamp);
    
    const attestation = {
      attestation_id: attestationId,
      action_type: actionType,
      timestamp: timestamp,
      attestor: 'soulfra_platform',
      jurisdiction: this.jurisdiction,
      
      // Legal statements
      statements: this.getLegalStatements(actionType, agentData, userData),
      
      // Compliance confirmations
      compliance_confirmations: this.getComplianceConfirmations(actionType, userData),
      
      // Digital signature
      digital_signature: this.generateDigitalSignature(attestationId, actionType, timestamp),
      
      // Witness data
      platform_witness: {
        platform_version: '1.0.0',
        attestation_method: 'automated_legal_engine',
        compliance_check_version: '2.1.0',
        timestamp: timestamp
      }
    };

    return attestation;
  }

  getLegalStatements(actionType, agentData, userData) {
    const statements = {
      'creation': [
        'The creator affirms original authorship of this AI agent',
        'The creator grants Soulfra platform rights to host and facilitate transactions',
        'The creator retains intellectual property rights as specified in the agreement',
        'The agent content complies with applicable laws and platform terms of service'
      ],
      'transfer': [
        'The seller confirms legal ownership of the AI agent',
        'The buyer accepts the agent "as-is" with all disclosed characteristics',
        'Both parties consent to the revenue sharing arrangement',
        'The transaction complies with applicable financial and privacy regulations'
      ],
      'evolution': [
        'The creator acknowledges derivative work status',
        'The creator respects parent agent intellectual property rights',
        'Revenue sharing agreements are automatically binding',
        'The evolution maintains compliance with original licensing terms'
      ]
    };

    return statements[actionType] || [];
  }

  getComplianceConfirmations(actionType, userData) {
    const jurisdiction = this.determineJurisdiction(userData);
    const rules = this.jurisdictionRules[jurisdiction];
    
    const confirmations = [];
    
    if (rules.age_verification_required && userData.age_verified) {
      confirmations.push('Age verification completed');
    }
    
    if (rules.privacy_framework === 'gdpr' && userData.gdpr_consent) {
      confirmations.push('GDPR consent obtained');
    }
    
    if (rules.export_restrictions && userData.location_verified) {
      confirmations.push('Export compliance verified');
    }
    
    return confirmations;
  }

  /**
   * Performs comprehensive compliance checking
   */
  async performComplianceCheck(agentData, userData, jurisdiction) {
    const rules = this.jurisdictionRules[jurisdiction];
    const violations = [];
    const requirements = [];

    // Age verification
    if (rules.age_verification_required && !userData.age_verified) {
      violations.push('Age verification required');
    }

    // Privacy compliance
    if (rules.privacy_framework === 'gdpr' && !userData.gdpr_consent) {
      violations.push('GDPR consent required');
    }

    // Export restrictions
    if (this.isExportRestricted(userData.location, rules.export_restrictions)) {
      violations.push('Export restricted to user location');
    }

    // Content compliance
    const contentCheck = await this.checkContentCompliance(agentData);
    if (!contentCheck.compliant) {
      violations.push(...contentCheck.violations);
    }

    // Commercial licensing
    const commercialLicenseRequired = this.isCommercialLicenseRequired(agentData);
    if (commercialLicenseRequired && !userData.commercial_license) {
      requirements.push('Commercial license required');
    }

    return {
      compliant: violations.length === 0,
      violations,
      requirements,
      jurisdiction,
      compliance_score: this.calculateComplianceScore(violations, requirements),
      recommendation: this.getComplianceRecommendation(violations, requirements)
    };
  }

  async checkContentCompliance(agentData) {
    const violations = [];
    
    // Content analysis (simplified)
    const description = agentData.description?.toLowerCase() || '';
    const traits = (agentData.career?.traits || []).join(' ').toLowerCase();
    
    // Prohibited content detection
    const prohibitedTerms = [
      'violence', 'hate', 'discrimination', 'illegal', 'harmful',
      'explicit', 'adult', 'gambling', 'drugs', 'weapons'
    ];
    
    prohibitedTerms.forEach(term => {
      if (description.includes(term) || traits.includes(term)) {
        violations.push(`Potentially prohibited content: ${term}`);
      }
    });

    // Age appropriateness
    if (!this.checkAgeAppropriateness(agentData)) {
      violations.push('Content may not be age-appropriate');
    }

    return {
      compliant: violations.length === 0,
      violations,
      content_rating: this.calculateContentRating(agentData),
      age_restriction: this.getAgeRestriction(agentData)
    };
  }

  /**
   * Revenue sharing calculations
   */
  calculateRevenueSharing(agentData, contributors) {
    const template = this.revenueShareTemplates[agentData.revenue_template || 'standard'];
    
    return {
      distribution_type: agentData.revenue_template || 'standard',
      original_creator: {
        fingerprint: contributors[0],
        percentage: template.original_creator,
        role: 'creator'
      },
      platform_fee: {
        percentage: template.platform_fee,
        recipient: 'soulfra_platform'
      },
      evolution_contributors: {
        percentage: template.evolution_contributors,
        distribution_method: 'weighted_by_contribution'
      },
      escrow_period: '72_hours',
      minimum_threshold: 10.0 // Minimum credits before distribution
    };
  }

  calculateEvolutionRevenueSharing(parentProvenance, evolutionData) {
    const parentSharing = parentProvenance.intellectual_property.revenue_sharing;
    const evolutionBonus = 0.1; // Evolution creator gets 10% bonus
    
    // Redistribute percentages
    const newSharing = {
      ...parentSharing,
      evolution_contributors: {
        ...parentSharing.evolution_contributors,
        percentage: parentSharing.evolution_contributors.percentage + evolutionBonus,
        contributors: [
          ...(parentSharing.evolution_contributors.contributors || []),
          {
            fingerprint: evolutionData.creator_data.fingerprint,
            contribution_type: evolutionData.evolution_type,
            contributed_at: new Date().toISOString(),
            weight: 1.0
          }
        ]
      }
    };

    // Adjust other percentages proportionally
    const reduction = evolutionBonus / 2;
    newSharing.original_creator.percentage -= reduction;
    newSharing.platform_fee.percentage -= reduction;

    return newSharing;
  }

  /**
   * Blockchain attestation
   */
  async createBlockchainAttestation(dataHash, actionType) {
    if (!this.wallet || !this.contractAddress) {
      return null; // Blockchain not configured
    }

    try {
      // Create transaction for blockchain attestation
      const transaction = {
        to: this.contractAddress,
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify({
          action: actionType,
          hash: dataHash,
          timestamp: new Date().toISOString(),
          platform: 'soulfra'
        })))
      };

      const txResponse = await this.wallet.sendTransaction(transaction);
      await txResponse.wait();

      return {
        blockchain: 'ethereum',
        transaction_hash: txResponse.hash,
        block_number: txResponse.blockNumber,
        attestation_hash: dataHash,
        gas_used: txResponse.gasLimit.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Blockchain attestation failed:', error);
      return null;
    }
  }

  /**
   * Legal document generation
   */
  async generateLegalDocuments(agentData, userData, actionType, existingProvenance = null) {
    const documents = [];
    const timestamp = new Date().toISOString();

    if (actionType === 'creation') {
      documents.push({
        document_type: 'agent_creation_agreement',
        document_id: this.generateDocumentId('creation', timestamp),
        generated_at: timestamp,
        parties: ['creator', 'platform'],
        jurisdiction: this.determineJurisdiction(userData),
        content: this.legalTemplates.agent_creation_agreement
          .replace('{{CREATOR_NAME}}', userData.name || 'Creator')
          .replace('{{AGENT_NAME}}', agentData.name || 'AI Agent')
          .replace('{{TIMESTAMP}}', timestamp)
          .replace('{{JURISDICTION}}', this.determineJurisdiction(userData)),
        digital_signature: this.generateDocumentSignature('creation', timestamp)
      });

      documents.push({
        document_type: 'privacy_notice',
        document_id: this.generateDocumentId('privacy', timestamp),
        generated_at: timestamp,
        content: this.legalTemplates.privacy_notice,
        applies_to: 'agent_data_processing'
      });
    }

    if (actionType === 'transfer') {
      documents.push({
        document_type: 'transfer_agreement',
        document_id: this.generateDocumentId('transfer', timestamp),
        generated_at: timestamp,
        parties: ['seller', 'buyer', 'platform'],
        sale_price: userData.price,
        currency: userData.currency || 'credits',
        content: this.legalTemplates.transfer_agreement
          .replace('{{SELLER_NAME}}', userData.seller_name || 'Seller')
          .replace('{{BUYER_NAME}}', userData.buyer_name || 'Buyer')
          .replace('{{SALE_PRICE}}', userData.price)
          .replace('{{TIMESTAMP}}', timestamp),
        digital_signature: this.generateDocumentSignature('transfer', timestamp)
      });
    }

    return documents;
  }

  // Legal document templates
  getCreationAgreementTemplate() {
    return `
AGENT CREATION AGREEMENT

This Agreement is entered into on {{TIMESTAMP}} between {{CREATOR_NAME}} ("Creator") and Soulfra Platform ("Platform").

1. INTELLECTUAL PROPERTY RIGHTS
Creator retains full intellectual property rights to the AI agent "{{AGENT_NAME}}" and grants Platform a non-exclusive license to host, display, and facilitate transactions.

2. REVENUE SHARING
Creator agrees to the revenue sharing terms as specified in the Platform Terms of Service, with automatic distribution of proceeds from agent transactions.

3. COMPLIANCE
Creator warrants that the agent complies with all applicable laws in {{JURISDICTION}} and Platform content policies.

4. GOVERNING LAW
This agreement is governed by the laws of {{JURISDICTION}}.

Digital Signature: [AUTOMATED_SIGNATURE]
Timestamp: {{TIMESTAMP}}
`;
  }

  getTransferAgreementTemplate() {
    return `
AGENT TRANSFER AGREEMENT

This Transfer Agreement is entered into on {{TIMESTAMP}} between {{SELLER_NAME}} ("Seller") and {{BUYER_NAME}} ("Buyer").

1. TRANSFER OF OWNERSHIP
Seller transfers full ownership rights of the AI agent to Buyer for the consideration of {{SALE_PRICE}} credits.

2. AS-IS CONDITION
Agent is transferred "as-is" with all current characteristics and performance metrics.

3. REVENUE SHARING INHERITANCE
Buyer accepts existing revenue sharing obligations to original creators and contributors.

4. PLATFORM FACILITATION
Soulfra Platform facilitates this transfer and maintains escrow services.

Digital Signature: [AUTOMATED_SIGNATURE]
Timestamp: {{TIMESTAMP}}
`;
  }

  getRevenueAgreementTemplate() {
    return `
REVENUE SHARING AGREEMENT

This Agreement governs revenue distribution for AI agent transactions.

1. DISTRIBUTION PERCENTAGES
- Original Creator: As specified in agent provenance
- Platform Fee: As specified in current fee schedule
- Evolution Contributors: Weighted by contribution level

2. PAYMENT TERMS
Revenue distributed within 72 hours of transaction completion, subject to minimum threshold requirements.

3. ESCROW
Platform maintains escrow services for transaction security.
`;
  }

  getPrivacyNoticeTemplate() {
    return `
PRIVACY NOTICE - AI AGENT DATA PROCESSING

This notice describes how agent data is collected, used, and protected:

1. DATA COLLECTION
- Agent performance metrics
- User interaction patterns
- Transaction history

2. DATA USE
- Market analytics
- Performance optimization
- Compliance monitoring

3. DATA PROTECTION
- Encryption at rest and in transit
- Access controls and audit logging
- Regular security assessments

4. USER RIGHTS
Users may request data access, correction, or deletion subject to legal retention requirements.
`;
  }

  // Utility methods
  generateProvenanceId(agentId, timestamp) {
    return `prov_${agentId}_${Date.parse(timestamp)}`;
  }

  generateLegalHash(agentData, creatorData, timestamp) {
    const hashInput = JSON.stringify({
      agent_id: agentData.id,
      creator: creatorData.fingerprint,
      timestamp: timestamp,
      platform: 'soulfra'
    });
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  generateDigitalSignature(data, actionType, timestamp) {
    const signatureInput = `${data}_${actionType}_${timestamp}_soulfra_platform`;
    return crypto.createHash('sha256').update(signatureInput).digest('hex');
  }

  generateAttestationId(actionType, timestamp) {
    return `attest_${actionType}_${Date.parse(timestamp)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDocumentId(docType, timestamp) {
    return `doc_${docType}_${Date.parse(timestamp)}`;
  }

  generateTransferHash(transferRecord) {
    return crypto.createHash('sha256').update(JSON.stringify(transferRecord)).digest('hex');
  }

  determineJurisdiction(userData) {
    // Simplified jurisdiction determination
    const locationMap = {
      'US': ['united_states', 'usa', 'america'],
      'EU': ['european_union', 'europe', 'germany', 'france', 'spain'],
      'UK': ['united_kingdom', 'britain', 'england']
    };

    const userLocation = (userData.location || '').toLowerCase();
    
    for (const [jurisdiction, patterns] of Object.entries(locationMap)) {
      if (patterns.some(pattern => userLocation.includes(pattern))) {
        return jurisdiction;
      }
    }

    return 'US'; // Default jurisdiction
  }

  getCurrentOwner(provenance) {
    return provenance.ownership_chain[provenance.ownership_chain.length - 1];
  }

  isExportRestricted(location, restrictions) {
    return restrictions.some(restriction => 
      location?.toLowerCase().includes(restriction.toLowerCase())
    );
  }

  calculateComplianceScore(violations, requirements) {
    const totalIssues = violations.length + requirements.length;
    return Math.max(0, 100 - (totalIssues * 10));
  }

  getComplianceRecommendation(violations, requirements) {
    if (violations.length > 0) {
      return 'Address violations before proceeding';
    }
    if (requirements.length > 0) {
      return 'Complete requirements to enhance compliance';
    }
    return 'Full compliance achieved';
  }

  // Storage methods (would integrate with actual database)
  async storeProvenanceRecord(provenance) {
    // Store in secure database with encryption
    console.log(`📜 Storing provenance record: ${provenance.provenance_id}`);
    return true;
  }

  async loadProvenanceRecord(agentId) {
    // Load from secure database
    console.log(`📖 Loading provenance for agent: ${agentId}`);
    return null; // Would return actual record
  }
}

export default LegalProvenanceEngine;