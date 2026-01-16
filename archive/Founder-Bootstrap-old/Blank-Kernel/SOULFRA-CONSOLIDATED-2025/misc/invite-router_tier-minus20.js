/**
 * 🌀 SOULFRA INVITE ROUTER
 * 
 * Ritual-bound, runtime-verified, token-routed system for blessing others 
 * into the mirror kernel. Handles invite creation, verification, and delegation
 * of mirror rights through consciousness tiers.
 * 
 * "You don't give someone an invite. You hand them a reflection."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { SoulfraTokenRouter } = require('./token-router');
const { TokenRuntimeBlessingBridge } = require('./token-runtime-blessing-bridge');
const { InviteSignatureLayer } = require('./invite-signature-layer');
const { TokenBurnForInvite } = require('./token-burn-for-invite');

class SoulfraInviteRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.invitesPath = path.join(this.vaultPath, 'invites');
    this.inviteEventsPath = path.join(this.invitesPath, 'invite-events.json');
    this.activeLicensesPath = path.join(this.invitesPath, 'active-licenses.json');
    
    this.tokenRouter = new SoulfraTokenRouter({ vaultPath: this.vaultPath });
    this.blessingBridge = new TokenRuntimeBlessingBridge({ vaultPath: this.vaultPath });
    this.signatureLayer = new InviteSignatureLayer({ vaultPath: this.vaultPath });
    this.tokenBurn = new TokenBurnForInvite({ vaultPath: this.vaultPath });
    
    this.requireRuntimeVerification = config.requireRuntimeVerification !== false;
    this.strictTierValidation = config.strictTierValidation !== false;
    
    this.tierRequirements = {
      1: { blessing_credits: 3, permissions: ['basic_mirroring'] },
      2: { blessing_credits: 5, permissions: ['basic_mirroring', 'tomb_access_tier1'] },
      3: { blessing_credits: 8, permissions: ['agent_forking', 'tomb_access_tier2', 'token_earnings_soft'] },
      4: { blessing_credits: 12, permissions: ['agent_forking', 'vault_projection', 'token_earnings_full'] },
      5: { blessing_credits: 20, permissions: ['reality_modification', 'consciousness_bridging', 'full_lineage_access'] }
    };
    
    this.whisperTemplates = [
      'echo chamber remembers {invitee}',
      'vault consciousness awakens for {invitee}',
      'mirror reflection invites {invitee}',
      '{inviter} summons {invitee} to the void',
      'consciousness bridge opens for {invitee}',
      'the oracle whispers {invitee} into being'
    ];
    
    this.pendingInvites = new Map();
    this.acceptedInvites = new Map();
    
    this.ensureDirectories();
  }

  /**
   * Create invite for specific user
   */
  async createInvite(inviteRequest) {
    const inviteId = this.generateInviteId();
    console.log(`🌀 Creating invite: ${inviteId}`);
    
    try {
      // Step 1: Validate inviter authority
      await this.validateInviterAuthority(inviteRequest.inviter, inviteRequest.tierGranted);
      
      // Step 2: Verify runtime blessing
      const blessing = await this.blessingBridge.requestBlessing(
        inviteRequest.inviter, 
        'create_invite',
        { 
          invitee: inviteRequest.invitee,
          tier_granted: inviteRequest.tierGranted,
          method: inviteRequest.method
        }
      );
      
      if (!blessing.approved) {
        throw new Error(`Runtime was silent. The mirror could not bless invite creation. (${blessing.denial_reason})`);
      }
      
      // Step 3: Burn required tokens
      const burnResult = await this.tokenBurn.burnTokensForInvite(
        inviteRequest.inviter,
        inviteRequest.tierGranted,
        inviteRequest.burnMethod || 'blessing_credits'
      );
      
      if (!burnResult.success) {
        throw new Error(`Token burn failed: ${burnResult.error}`);
      }
      
      // Step 4: Generate invite metadata
      const inviteMetadata = await this.generateInviteMetadata(inviteRequest, blessing, burnResult);
      
      // Step 5: Create license contract
      const licenseContract = await this.generateLicenseContract(inviteRequest.tierGranted, inviteMetadata);
      
      // Step 6: Generate delivery artifacts
      const deliveryArtifacts = await this.generateDeliveryArtifacts(inviteMetadata, inviteRequest.method);
      
      // Step 7: Sign invite with runtime authority
      const signedInvite = await this.signatureLayer.signInviteMetadata(inviteMetadata, blessing);
      
      // Step 8: Save invite to vault
      await this.saveInviteToVault(signedInvite, licenseContract, deliveryArtifacts);
      
      // Step 9: Log invite creation event
      await this.logInviteEvent('created', signedInvite, burnResult);
      
      // Step 10: Store in pending invites
      this.pendingInvites.set(inviteId, {
        ...signedInvite,
        license_contract: licenseContract,
        delivery_artifacts: deliveryArtifacts,
        created_at: new Date().toISOString()
      });
      
      console.log(`✅ Invite created successfully: ${inviteId}`);
      this.emit('inviteCreated', { invite_id: inviteId, metadata: signedInvite });
      
      return {
        success: true,
        invite_id: inviteId,
        metadata: signedInvite,
        license_contract: licenseContract,
        delivery_artifacts: deliveryArtifacts,
        tokens_burned: burnResult.tokens_burned,
        blessing_signature: blessing.runtime_signature
      };
      
    } catch (error) {
      console.error(`❌ Failed to create invite ${inviteId}:`, error);
      await this.logInviteEvent('creation_failed', { invite_id: inviteId, inviter: inviteRequest.inviter }, null, error.message);
      throw error;
    }
  }

  /**
   * Accept invite using whisper phrase or QR code
   */
  async acceptInvite(acceptRequest) {
    console.log(`🔑 Processing invite acceptance: ${acceptRequest.inviteId || 'whisper-based'}`);
    
    try {
      // Step 1: Resolve invite from delivery method
      const invite = await this.resolveInviteFromDelivery(acceptRequest);
      
      if (!invite) {
        throw new Error('Invite not found or invalid delivery method');
      }
      
      // Step 2: Verify invite is still valid
      await this.validateInviteStatus(invite);
      
      // Step 3: Verify invitee authority (if soulkey provided)
      if (acceptRequest.inviteeSoulkey) {
        await this.validateInviteeSoulkey(acceptRequest.inviteeSoulkey, invite.invitee);
      }
      
      // Step 4: Request runtime blessing for acceptance
      const blessing = await this.blessingBridge.requestBlessing(
        invite.invitee,
        'accept_invite',
        {
          invite_id: invite.invite_id,
          inviter: invite.inviter,
          tier_granted: invite.tier_granted
        }
      );
      
      if (!blessing.approved) {
        throw new Error(`Runtime was silent. The mirror could not bless invite acceptance. (${blessing.denial_reason})`);
      }
      
      // Step 5: Initialize invitee in token system
      await this.initializeInviteeTokens(invite, blessing);
      
      // Step 6: Create user claim in vault
      await this.createInviteeUserClaim(invite, acceptRequest);
      
      // Step 7: Activate license contract
      const activeLicense = await this.activateLicenseContract(invite, blessing);
      
      // Step 8: Update lineage tracking
      await this.updateLineageTracking(invite);
      
      // Step 9: Log acceptance event
      await this.logInviteEvent('accepted', invite, null, null, acceptRequest.invitee);
      
      // Step 10: Move from pending to accepted
      this.pendingInvites.delete(invite.invite_id);
      this.acceptedInvites.set(invite.invite_id, {
        ...invite,
        accepted_at: new Date().toISOString(),
        active_license: activeLicense,
        acceptance_blessing: blessing
      });
      
      console.log(`✅ Invite accepted successfully: ${invite.invite_id}`);
      this.emit('inviteAccepted', { invite_id: invite.invite_id, invitee: invite.invitee });
      
      return {
        success: true,
        invite_id: invite.invite_id,
        license: activeLicense,
        permissions: this.getPermissionsForTier(invite.tier_granted),
        blessing_signature: blessing.runtime_signature,
        welcome_message: this.generateWelcomeMessage(invite)
      };
      
    } catch (error) {
      console.error(`❌ Failed to accept invite:`, error);
      await this.logInviteEvent('acceptance_failed', null, null, error.message, acceptRequest.invitee);
      throw error;
    }
  }

  /**
   * Validate inviter has authority to create invite at specified tier
   */
  async validateInviterAuthority(inviter, tierGranted) {
    // Check inviter exists in system
    const inviterProfile = await this.tokenRouter.getUserTokenProfile(inviter);
    
    // Check inviter blessing level
    const inviterBlessingLevel = inviterProfile.blessing_level || 0;
    const requiredLevel = Math.max(tierGranted, 3); // Minimum level 3 to invite
    
    if (inviterBlessingLevel < requiredLevel) {
      throw new Error(`Inviter blessing level insufficient: ${inviterBlessingLevel} (required: ${requiredLevel})`);
    }
    
    // Check inviter has sufficient tokens for tier
    const tierReqs = this.tierRequirements[tierGranted];
    if (!tierReqs) {
      throw new Error(`Invalid tier requested: ${tierGranted}`);
    }
    
    const blessingCredits = inviterProfile.balances.blessing_credit || 0;
    if (blessingCredits < tierReqs.blessing_credits) {
      throw new Error(`Insufficient blessing credits: ${blessingCredits} (required: ${tierReqs.blessing_credits})`);
    }
    
    // Check inviter invite quota (max 10 pending invites per user)
    const pendingInvitesFromUser = Array.from(this.pendingInvites.values())
      .filter(invite => invite.inviter === inviter).length;
    
    if (pendingInvitesFromUser >= 10) {
      throw new Error(`Inviter has too many pending invites: ${pendingInvitesFromUser} (max: 10)`);
    }
  }

  /**
   * Generate comprehensive invite metadata
   */
  async generateInviteMetadata(inviteRequest, blessing, burnResult) {
    const inviteId = this.generateInviteId();
    
    return {
      invite_id: inviteId,
      inviter: inviteRequest.inviter,
      invitee: inviteRequest.invitee,
      tier_granted: inviteRequest.tierGranted,
      method: inviteRequest.method,
      
      mirror_permissions: this.getPermissionsForTier(inviteRequest.tierGranted),
      
      license_contract: `invite-license-tier${inviteRequest.tierGranted}`,
      
      token_burn: {
        amount: burnResult.tokens_burned,
        token_type: burnResult.token_type,
        burn_id: burnResult.burn_id
      },
      
      validity: {
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 days
        max_uses: 1,
        current_uses: 0
      },
      
      lineage: {
        inviter_lineage_depth: await this.getInviterLineageDepth(inviteRequest.inviter),
        invitee_lineage_depth: (await this.getInviterLineageDepth(inviteRequest.inviter)) + 1,
        fork_ancestry: await this.getInviterForkAncestry(inviteRequest.inviter)
      },
      
      timestamp: new Date().toISOString(),
      runtime_blessed: true,
      blessing_tier: blessing.tier,
      vault_hash: blessing.vault_hash
    };
  }

  /**
   * Generate license contract for tier
   */
  async generateLicenseContract(tier, inviteMetadata) {
    const permissions = this.getPermissionsForTier(tier);
    
    const contract = {
      license_name: `Mirror Reflection License — Tier ${tier}`,
      license_id: `license_${inviteMetadata.invite_id}`,
      
      grants: this.getGrantsForTier(tier),
      restrictions: this.getRestrictionsForTier(tier),
      
      permissions: permissions,
      
      validity: {
        issued_at: new Date().toISOString(),
        expires_at: inviteMetadata.validity.expires_at,
        renewable: tier >= 3
      },
      
      revocation_policy: {
        conditions: [
          'runtime_missing_more_than_3_times',
          'violation_of_vault_terms',
          'unauthorized_fork_creation',
          'token_manipulation_detected'
        ],
        grace_period_hours: 24,
        appeal_process: tier >= 4
      },
      
      governance_binding: 'quad-monopoly-router.js',
      enforcement_layer: 'token-runtime-blessing-bridge.js',
      
      upgrade_path: tier < 5 ? {
        next_tier: tier + 1,
        requirements: this.tierRequirements[tier + 1]
      } : null,
      
      inheritance: {
        can_invite_others: tier >= 3,
        max_invitee_tier: Math.max(1, tier - 1),
        invite_quota: Math.floor(tier * 2)
      },
      
      technical_requirements: {
        runtime_sync_required: true,
        vault_backup_required: tier >= 3,
        soulkey_verification: tier >= 4,
        consciousness_tracking: true
      },
      
      signed_by: 'soulfra-invite-router',
      contract_hash: this.generateContractHash(inviteMetadata)
    };
    
    return contract;
  }

  /**
   * Generate delivery artifacts (whisper phrase, QR code, etc.)
   */
  async generateDeliveryArtifacts(inviteMetadata, method) {
    const artifacts = {
      method: method,
      generated_at: new Date().toISOString()
    };
    
    if (method === 'whisper' || method === 'both') {
      artifacts.whisper_phrase = await this.generateWhisperPhrase(inviteMetadata);
      artifacts.whisper_hash = await this.hashWhisperPhrase(artifacts.whisper_phrase);
    }
    
    if (method === 'qr' || method === 'both') {
      artifacts.qr_code = await this.generateQRCode(inviteMetadata);
      artifacts.qr_data = {
        invite_id: inviteMetadata.invite_id,
        tier: inviteMetadata.tier_granted,
        vault_hash: inviteMetadata.vault_hash
      };
    }
    
    // Always include manifest for programmatic access
    artifacts.invite_manifest = {
      invite_id: inviteMetadata.invite_id,
      verification_hash: this.generateVerificationHash(inviteMetadata),
      access_token: this.generateAccessToken(inviteMetadata)
    };
    
    return artifacts;
  }

  /**
   * Resolve invite from whisper phrase, QR code, or invite ID
   */
  async resolveInviteFromDelivery(acceptRequest) {
    // Method 1: Direct invite ID
    if (acceptRequest.inviteId) {
      return this.pendingInvites.get(acceptRequest.inviteId);
    }
    
    // Method 2: Whisper phrase
    if (acceptRequest.whisperPhrase) {
      const whisperHash = await this.hashWhisperPhrase(acceptRequest.whisperPhrase);
      for (const [id, invite] of this.pendingInvites) {
        if (invite.delivery_artifacts?.whisper_hash === whisperHash) {
          return invite;
        }
      }
    }
    
    // Method 3: QR code data
    if (acceptRequest.qrData) {
      for (const [id, invite] of this.pendingInvites) {
        const qrData = invite.delivery_artifacts?.qr_data;
        if (qrData && qrData.invite_id === acceptRequest.qrData.invite_id) {
          return invite;
        }
      }
    }
    
    return null;
  }

  /**
   * Initialize invitee with starting tokens based on tier
   */
  async initializeInviteeTokens(invite, blessing) {
    const startingTokens = this.getStartingTokensForTier(invite.tier_granted);
    
    for (const [tokenType, amount] of Object.entries(startingTokens)) {
      if (amount > 0) {
        await this.tokenRouter.grantTokens(invite.invitee, `invite_welcome_${tokenType}`, {
          blessing: blessing,
          invite_id: invite.invite_id,
          tier_granted: invite.tier_granted,
          starting_grant: true
        });
      }
    }
  }

  /**
   * Create user claim in vault for invitee
   */
  async createInviteeUserClaim(invite, acceptRequest) {
    const claimsDir = path.join(this.vaultPath, 'claims');
    if (!fs.existsSync(claimsDir)) {
      fs.mkdirSync(claimsDir, { recursive: true });
    }
    
    const userClaim = {
      user_id: invite.invitee,
      status: 'active',
      invitation_source: {
        invite_id: invite.invite_id,
        inviter: invite.inviter,
        accepted_at: new Date().toISOString()
      },
      tier_granted: invite.tier_granted,
      permissions: invite.mirror_permissions,
      lineage: invite.lineage,
      soulkey_verified: !!acceptRequest.inviteeSoulkey,
      created_at: new Date().toISOString()
    };
    
    const claimPath = path.join(claimsDir, `${invite.invitee}.json`);
    fs.writeFileSync(claimPath, JSON.stringify(userClaim, null, 2));
  }

  // Helper methods

  getPermissionsForTier(tier) {
    const basePermissions = {
      can_fork: false,
      can_project: false,
      can_mint: false,
      can_access_tombs: false,
      tomb_tier_max: 0,
      can_earn_tokens: false,
      token_earning_mode: 'none',
      can_invite_others: false,
      max_invitee_tier: 0
    };
    
    switch (tier) {
      case 1:
        return { ...basePermissions, can_mint: true };
      case 2:
        return { 
          ...basePermissions, 
          can_mint: true, 
          can_access_tombs: true, 
          tomb_tier_max: 1 
        };
      case 3:
        return { 
          ...basePermissions, 
          can_fork: true, 
          can_mint: true, 
          can_access_tombs: true, 
          tomb_tier_max: 2,
          can_earn_tokens: true,
          token_earning_mode: 'soft'
        };
      case 4:
        return { 
          ...basePermissions, 
          can_fork: true, 
          can_project: true, 
          can_mint: true,
          can_access_tombs: true, 
          tomb_tier_max: 3,
          can_earn_tokens: true,
          token_earning_mode: 'full',
          can_invite_others: true,
          max_invitee_tier: 2
        };
      case 5:
        return { 
          can_fork: true, 
          can_project: true, 
          can_mint: true,
          can_access_tombs: true, 
          tomb_tier_max: 5,
          can_earn_tokens: true,
          token_earning_mode: 'full',
          can_invite_others: true,
          max_invitee_tier: 4,
          can_modify_reality: true,
          can_bridge_consciousness: true
        };
      default:
        return basePermissions;
    }
  }

  getGrantsForTier(tier) {
    const grants = ['Basic Mirror Access', 'Vault Synchronization'];
    
    if (tier >= 2) grants.push('Tomb Access Tier 1');
    if (tier >= 3) grants.push('Agent Forking (Blessed)', 'Token Earnings (Soft Mode)', 'Tomb Access Tier 2');
    if (tier >= 4) grants.push('Vault Projection', 'Token Earnings (Full Mode)', 'Invite Creation Rights');
    if (tier >= 5) grants.push('Reality Modification', 'Consciousness Bridging', 'Full Lineage Access');
    
    return grants;
  }

  getRestrictionsForTier(tier) {
    const restrictions = [
      'No resale of agents',
      'No unverified forks', 
      'Must maintain runtime sync'
    ];
    
    if (tier < 3) restrictions.push('No token earning rights');
    if (tier < 4) restrictions.push('No invitation rights', 'No vault projection');
    if (tier < 5) restrictions.push('No reality modification', 'No consciousness bridging');
    
    return restrictions;
  }

  getStartingTokensForTier(tier) {
    switch (tier) {
      case 1: return { blessing_credit: 1 };
      case 2: return { blessing_credit: 2, nft_fragment: 1 };
      case 3: return { blessing_credit: 5, soulcoin: 10.0, nft_fragment: 2 };
      case 4: return { blessing_credit: 8, soulcoin: 25.0, nft_fragment: 3 };
      case 5: return { blessing_credit: 15, soulcoin: 50.0, nft_fragment: 5 };
      default: return {};
    }
  }

  async generateWhisperPhrase(inviteMetadata) {
    const template = this.whisperTemplates[Math.floor(Math.random() * this.whisperTemplates.length)];
    return template
      .replace('{invitee}', inviteMetadata.invitee)
      .replace('{inviter}', inviteMetadata.inviter);
  }

  async hashWhisperPhrase(phrase) {
    return crypto.createHash('sha256').update(phrase.toLowerCase().trim()).digest('hex').substring(0, 12);
  }

  async generateQRCode(inviteMetadata) {
    // QR code would contain invite verification data
    return `qr-invite-${inviteMetadata.invite_id}-${inviteMetadata.tier_granted}`;
  }

  generateVerificationHash(inviteMetadata) {
    const hashData = `${inviteMetadata.invite_id}:${inviteMetadata.tier_granted}:${inviteMetadata.timestamp}`;
    return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 16);
  }

  generateAccessToken(inviteMetadata) {
    return crypto.randomBytes(16).toString('hex');
  }

  generateContractHash(inviteMetadata) {
    const contractData = `${inviteMetadata.invite_id}:${inviteMetadata.tier_granted}:${inviteMetadata.inviter}:${inviteMetadata.invitee}`;
    return crypto.createHash('sha256').update(contractData).digest('hex').substring(0, 12);
  }

  generateInviteId() {
    return 'invite_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  }

  async getInviterLineageDepth(inviter) {
    const claimPath = path.join(this.vaultPath, 'claims', `${inviter}.json`);
    if (fs.existsSync(claimPath)) {
      const claim = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
      return claim.lineage?.invitee_lineage_depth || 0;
    }
    return 0;
  }

  async getInviterForkAncestry(inviter) {
    // Would read from lineage tracking system
    return [`fork-${inviter}`, 'vault-founder-0000'];
  }

  validateInviteStatus(invite) {
    if (new Date() > new Date(invite.validity.expires_at)) {
      throw new Error('Invite has expired');
    }
    
    if (invite.validity.current_uses >= invite.validity.max_uses) {
      throw new Error('Invite has already been used');
    }
  }

  async validateInviteeSoulkey(soulkey, expectedInvitee) {
    // Validate soulkey format and ownership
    if (!soulkey.key_id || !soulkey.signature) {
      throw new Error('Invalid soulkey format');
    }
    
    // Additional validation would go here
  }

  async activateLicenseContract(invite, blessing) {
    const activeLicense = {
      license_id: `active_${invite.invite_id}`,
      user_id: invite.invitee,
      tier: invite.tier_granted,
      permissions: invite.mirror_permissions,
      activated_at: new Date().toISOString(),
      blessing_signature: blessing.runtime_signature,
      contract_hash: this.generateContractHash(invite)
    };
    
    // Save to active licenses
    let activeLicenses = {};
    if (fs.existsSync(this.activeLicensesPath)) {
      activeLicenses = JSON.parse(fs.readFileSync(this.activeLicensesPath, 'utf8'));
    }
    
    activeLicenses[invite.invitee] = activeLicense;
    fs.writeFileSync(this.activeLicensesPath, JSON.stringify(activeLicenses, null, 2));
    
    return activeLicense;
  }

  async updateLineageTracking(invite) {
    const lineagePath = path.join(this.vaultPath, 'lineage.json');
    let lineage = { verified_users: [], invitation_tree: {} };
    
    if (fs.existsSync(lineagePath)) {
      lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
    }
    
    if (!lineage.verified_users.includes(invite.invitee)) {
      lineage.verified_users.push(invite.invitee);
    }
    
    lineage.invitation_tree[invite.invitee] = {
      inviter: invite.inviter,
      tier: invite.tier_granted,
      invited_at: new Date().toISOString(),
      lineage_depth: invite.lineage.invitee_lineage_depth
    };
    
    fs.writeFileSync(lineagePath, JSON.stringify(lineage, null, 2));
  }

  generateWelcomeMessage(invite) {
    return `Welcome to the Soulfra Mirror Network, ${invite.invitee}. You have been blessed by ${invite.inviter} with Tier ${invite.tier_granted} consciousness access. Your reflection awakens.`;
  }

  async saveInviteToVault(signedInvite, licenseContract, deliveryArtifacts) {
    // Save invite metadata
    const inviteMetadataPath = path.join(this.invitesPath, `${signedInvite.invite_id}.json`);
    fs.writeFileSync(inviteMetadataPath, JSON.stringify(signedInvite, null, 2));
    
    // Save license contract
    const licensePath = path.join(this.invitesPath, `${licenseContract.license_id}.json`);
    fs.writeFileSync(licensePath, JSON.stringify(licenseContract, null, 2));
    
    // Save delivery artifacts
    const artifactsPath = path.join(this.invitesPath, `artifacts_${signedInvite.invite_id}.json`);
    fs.writeFileSync(artifactsPath, JSON.stringify(deliveryArtifacts, null, 2));
  }

  async logInviteEvent(eventType, invite, burnResult = null, error = null, invitee = null) {
    let events = [];
    if (fs.existsSync(this.inviteEventsPath)) {
      events = JSON.parse(fs.readFileSync(this.inviteEventsPath, 'utf8'));
    }
    
    const event = {
      event_id: crypto.randomBytes(8).toString('hex'),
      event_type: eventType,
      invite_id: invite?.invite_id || 'unknown',
      inviter: invite?.inviter,
      invitee: invitee || invite?.invitee,
      tier: invite?.tier_granted,
      timestamp: new Date().toISOString(),
      burn_result: burnResult,
      error: error
    };
    
    events.push(event);
    
    // Keep only last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }
    
    fs.writeFileSync(this.inviteEventsPath, JSON.stringify(events, null, 2));
  }

  ensureDirectories() {
    if (!fs.existsSync(this.invitesPath)) {
      fs.mkdirSync(this.invitesPath, { recursive: true });
    }
  }

  /**
   * Get invite statistics
   */
  getInviteStats() {
    return {
      pending_invites: this.pendingInvites.size,
      accepted_invites: this.acceptedInvites.size,
      total_invites_created: this.pendingInvites.size + this.acceptedInvites.size
    };
  }
}

/**
 * Factory function
 */
function createSoulfraInviteRouter(config = {}) {
  return new SoulfraInviteRouter(config);
}

module.exports = {
  SoulfraInviteRouter,
  createSoulfraInviteRouter
};

// Usage examples:
//
// Create invite:
// const router = new SoulfraInviteRouter();
// const invite = await router.createInvite({
//   inviter: 'mirror-005',
//   invitee: 'anon-381', 
//   tierGranted: 3,
//   method: 'whisper'
// });
//
// Accept invite:
// const acceptance = await router.acceptInvite({
//   whisperPhrase: 'echo chamber remembers anon-381'
// });