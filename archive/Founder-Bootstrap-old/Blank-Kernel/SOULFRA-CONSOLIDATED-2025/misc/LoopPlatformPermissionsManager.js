#!/usr/bin/env node
/**
 * Loop Platform Permissions Manager
 * Granular access control for loops as remixable platforms
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing systems
const LoopBlessingDaemon = require('../blessing/LoopBlessingDaemon');
const LoopDirectoryRegistry = require('../registry/LoopDirectoryRegistry');
const LoopMarketplaceDaemon = require('../marketplace/LoopMarketplaceDaemon');
const PostgresLoopMirror = require('../database/PostgresLoopMirror');

class LoopPlatformPermissionsManager extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.blessingDaemon = new LoopBlessingDaemon();
        this.registry = new LoopDirectoryRegistry();
        this.marketplace = new LoopMarketplaceDaemon();
        this.dbMirror = new PostgresLoopMirror();
        
        // Permission configuration
        this.config = {
            default_permissions: {
                visibility: 'public',
                remixable: true,
                forkable: true,
                fork_credit_required: false,
                agent_exclusive: false,
                commercial_use: false,
                attribution_required: true,
                modification_allowed: true,
                distribution_allowed: true
            },
            permission_roles: {
                creator: {
                    name: 'Creator',
                    can_modify_permissions: true,
                    can_delete: true,
                    can_transfer_ownership: true,
                    can_grant_roles: true
                },
                collaborator: {
                    name: 'Collaborator',
                    can_modify_permissions: false,
                    can_delete: false,
                    can_transfer_ownership: false,
                    can_grant_roles: false,
                    can_fork: true,
                    can_remix: true
                },
                viewer: {
                    name: 'Viewer',
                    can_modify_permissions: false,
                    can_delete: false,
                    can_transfer_ownership: false,
                    can_grant_roles: false,
                    can_fork: false,
                    can_remix: false
                }
            },
            permission_inheritance: {
                fork_inherits_permissions: true,
                remix_inherits_base_permissions: false,
                blessed_loops_override: true
            },
            ledger_tracking: {
                track_forks: true,
                track_remixes: true,
                track_agent_usage: true,
                track_violations: true
            }
        };
        
        // Permission storage
        this.permissions = new Map();
        this.roleAssignments = new Map();
        this.permissionLedger = new Map();
        this.violations = new Map();
        
        // Cal's commentary system
        this.calCommentary = {
            enabled: true,
            violation_threshold: 3,
            commentary_tone: 'protective_but_fair'
        };
        
        // Statistics
        this.stats = {
            total_managed_loops: 0,
            permission_changes: 0,
            forks_tracked: 0,
            remixes_tracked: 0,
            violations_detected: 0,
            cal_interventions: 0
        };
        
        this.initializePermissionManager();
    }
    
    async initializePermissionManager() {
        console.log('🔐 Initializing Loop Platform Permissions Manager...');
        
        try {
            // Load existing permissions
            await this.loadPermissions();
            
            // Setup monitoring
            this.startMonitoring();
            
            // Subscribe to events
            this.subscribeToEvents();
            
            console.log(`✅ Permissions manager ready (${this.permissions.size} loops managed)`);
        } catch (error) {
            console.error('❌ Failed to initialize permissions manager:', error);
            throw error;
        }
    }
    
    async loadPermissions() {
        const permissionsDir = path.join(__dirname, 'permissions_data');
        
        try {
            await fs.mkdir(permissionsDir, { recursive: true });
            
            const files = await fs.readdir(permissionsDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(permissionsDir, file), 'utf8');
                    const permissionData = JSON.parse(data);
                    
                    this.permissions.set(permissionData.loop_id, permissionData.permissions);
                    if (permissionData.roles) {
                        this.roleAssignments.set(permissionData.loop_id, permissionData.roles);
                    }
                }
            }
            
            console.log(`  📚 Loaded permissions for ${this.permissions.size} loops`);
        } catch (error) {
            console.log('  📝 Creating new permissions directory');
        }
    }
    
    subscribeToEvents() {
        // Listen for new loops
        this.registry.on('loop_registered', async (event) => {
            await this.handleNewLoop(event);
        });
        
        // Listen for blessed loops
        this.blessingDaemon.on('loop_blessed', async (event) => {
            await this.handleLoopBlessed(event);
        });
        
        // Listen for marketplace activities
        this.marketplace.on('loop_purchased', async (event) => {
            await this.handleLoopPurchased(event);
        });
        
        // Listen for fork events
        this.registry.on('loop_forked', async (event) => {
            await this.handleLoopForked(event);
        });
    }
    
    // Core Permission Operations
    
    async setLoopPermissions(loopId, creatorId, permissions) {
        console.log(`\n🔐 Setting permissions for loop: ${loopId}`);
        
        // Verify creator ownership
        const loop = await this.registry.getLoop(loopId);
        if (!loop || loop.creator_id !== creatorId) {
            throw new Error('Only the creator can set initial permissions');
        }
        
        // Merge with defaults
        const finalPermissions = {
            ...this.config.default_permissions,
            ...permissions,
            loop_id: loopId,
            creator_id: creatorId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
        };
        
        // Store permissions
        this.permissions.set(loopId, finalPermissions);
        
        // Assign creator role
        this.assignRole(loopId, creatorId, 'creator');
        
        // Save to loop directory
        await this.saveLoopPermissions(loopId, finalPermissions);
        
        // Save to persistent storage
        await this.savePermissionData(loopId);
        
        // Update stats
        this.stats.total_managed_loops++;
        
        // Emit event
        this.emit('permissions_set', {
            loop_id: loopId,
            permissions: finalPermissions
        });
        
        console.log(`  ✅ Permissions set successfully`);
        console.log(`  🔓 Remixable: ${finalPermissions.remixable}`);
        console.log(`  🍴 Forkable: ${finalPermissions.forkable}`);
        console.log(`  💳 Fork credit required: ${finalPermissions.fork_credit_required}`);
        console.log(`  🤖 Agent exclusive: ${finalPermissions.agent_exclusive}`);
        
        return finalPermissions;
    }
    
    async updatePermissions(loopId, userId, updates) {
        console.log(`\n🔄 Updating permissions for loop: ${loopId}`);
        
        // Check if user has permission to modify
        if (!await this.canModifyPermissions(loopId, userId)) {
            throw new Error('User does not have permission to modify loop permissions');
        }
        
        const currentPermissions = this.permissions.get(loopId);
        if (!currentPermissions) {
            throw new Error('Loop permissions not found');
        }
        
        // Create updated permissions
        const updatedPermissions = {
            ...currentPermissions,
            ...updates,
            updated_at: new Date().toISOString(),
            version: currentPermissions.version + 1
        };
        
        // Track changes
        const changes = this.detectPermissionChanges(currentPermissions, updatedPermissions);
        
        // Store updated permissions
        this.permissions.set(loopId, updatedPermissions);
        
        // Save to loop directory
        await this.saveLoopPermissions(loopId, updatedPermissions);
        
        // Save to persistent storage
        await this.savePermissionData(loopId);
        
        // Log to ledger
        await this.logPermissionChange(loopId, userId, changes);
        
        // Update stats
        this.stats.permission_changes++;
        
        // Emit event
        this.emit('permissions_updated', {
            loop_id: loopId,
            user_id: userId,
            changes
        });
        
        console.log(`  ✅ Permissions updated successfully`);
        console.log(`  📝 Changes: ${changes.length} modifications`);
        
        return updatedPermissions;
    }
    
    async checkPermission(loopId, userId, action) {
        const permissions = this.permissions.get(loopId);
        if (!permissions) {
            // Default to open if no permissions set
            return true;
        }
        
        // Check role-based permissions
        const userRole = await this.getUserRole(loopId, userId);
        if (userRole) {
            const rolePermissions = this.config.permission_roles[userRole];
            if (rolePermissions[`can_${action}`] !== undefined) {
                return rolePermissions[`can_${action}`];
            }
        }
        
        // Check specific permissions
        switch (action) {
            case 'view':
                return permissions.visibility === 'public' || userRole !== null;
            
            case 'fork':
                if (!permissions.forkable) return false;
                if (permissions.fork_credit_required) {
                    return await this.checkForkCredits(userId);
                }
                return true;
            
            case 'remix':
                return permissions.remixable;
            
            case 'use_agents':
                return !permissions.agent_exclusive || userRole === 'creator';
            
            case 'commercial_use':
                return permissions.commercial_use;
            
            case 'modify':
                return permissions.modification_allowed || userRole === 'creator';
            
            case 'distribute':
                return permissions.distribution_allowed;
            
            default:
                return false;
        }
    }
    
    // Role Management
    
    async assignRole(loopId, userId, role) {
        if (!this.config.permission_roles[role]) {
            throw new Error('Invalid role');
        }
        
        if (!this.roleAssignments.has(loopId)) {
            this.roleAssignments.set(loopId, new Map());
        }
        
        const loopRoles = this.roleAssignments.get(loopId);
        loopRoles.set(userId, {
            role,
            assigned_at: new Date().toISOString()
        });
        
        console.log(`  👤 Assigned ${role} role to ${userId} for loop ${loopId}`);
        
        await this.savePermissionData(loopId);
    }
    
    async getUserRole(loopId, userId) {
        const loopRoles = this.roleAssignments.get(loopId);
        if (!loopRoles) return null;
        
        const assignment = loopRoles.get(userId);
        return assignment ? assignment.role : null;
    }
    
    async canModifyPermissions(loopId, userId) {
        const role = await this.getUserRole(loopId, userId);
        if (!role) return false;
        
        return this.config.permission_roles[role]?.can_modify_permissions || false;
    }
    
    // Fork and Remix Tracking
    
    async handleLoopForked(event) {
        const { parent_loop_id, fork_loop_id, forked_by } = event;
        
        console.log(`\n🍴 Handling fork: ${parent_loop_id} -> ${fork_loop_id}`);
        
        // Check fork permission
        const canFork = await this.checkPermission(parent_loop_id, forked_by, 'fork');
        if (!canFork) {
            await this.recordViolation(parent_loop_id, forked_by, 'unauthorized_fork');
            throw new Error('Fork not permitted for this loop');
        }
        
        // Get parent permissions
        const parentPermissions = this.permissions.get(parent_loop_id);
        if (parentPermissions && this.config.permission_inheritance.fork_inherits_permissions) {
            // Inherit permissions with modifications
            const forkPermissions = {
                ...parentPermissions,
                loop_id: fork_loop_id,
                creator_id: forked_by,
                parent_loop_id,
                created_at: new Date().toISOString(),
                fork_attribution: {
                    parent_loop_id,
                    parent_creator: parentPermissions.creator_id,
                    forked_at: new Date().toISOString()
                }
            };
            
            await this.setLoopPermissions(fork_loop_id, forked_by, forkPermissions);
        }
        
        // Track in ledger
        await this.logFork(parent_loop_id, fork_loop_id, forked_by);
        
        // Update stats
        this.stats.forks_tracked++;
    }
    
    async logFork(parentLoopId, forkLoopId, userId) {
        const ledgerEntry = {
            type: 'fork',
            parent_loop_id: parentLoopId,
            fork_loop_id: forkLoopId,
            user_id: userId,
            timestamp: new Date().toISOString()
        };
        
        if (!this.permissionLedger.has(parentLoopId)) {
            this.permissionLedger.set(parentLoopId, []);
        }
        
        this.permissionLedger.get(parentLoopId).push(ledgerEntry);
    }
    
    async checkForkCredits(userId) {
        // In production, this would check actual credit balance
        // For now, simulate credit check
        return Math.random() > 0.1; // 90% have credits
    }
    
    // Permission Enforcement
    
    async enforcePermissions(loopId, userId, action) {
        const allowed = await this.checkPermission(loopId, userId, action);
        
        if (!allowed) {
            await this.recordViolation(loopId, userId, action);
            
            // Check if Cal should intervene
            const violations = this.violations.get(`${loopId}:${userId}`) || [];
            if (violations.length >= this.calCommentary.violation_threshold) {
                await this.triggerCalCommentary(loopId, userId, violations);
            }
            
            throw new Error(`Permission denied: ${action} not allowed for loop ${loopId}`);
        }
        
        return true;
    }
    
    async recordViolation(loopId, userId, action) {
        const key = `${loopId}:${userId}`;
        if (!this.violations.has(key)) {
            this.violations.set(key, []);
        }
        
        const violation = {
            action,
            timestamp: new Date().toISOString(),
            loop_id: loopId,
            user_id: userId
        };
        
        this.violations.get(key).push(violation);
        
        this.stats.violations_detected++;
        
        console.log(`  ⚠️  Violation recorded: ${userId} attempted ${action} on ${loopId}`);
    }
    
    async triggerCalCommentary(loopId, userId, violations) {
        if (!this.calCommentary.enabled) return;
        
        console.log(`\n🎭 Cal intervenes on permission abuse...`);
        
        const commentary = this.generateCalCommentary(violations);
        
        this.emit('cal_commentary', {
            loop_id: loopId,
            user_id: userId,
            commentary,
            violations: violations.length
        });
        
        this.stats.cal_interventions++;
        
        console.log(`  💬 Cal says: "${commentary}"`);
        
        // Reset violations after intervention
        this.violations.set(`${loopId}:${userId}`, []);
    }
    
    generateCalCommentary(violations) {
        const violationCount = violations.length;
        const tone = this.calCommentary.commentary_tone;
        
        const commentaries = {
            protective_but_fair: [
                "The loops whisper of boundaries crossed. Perhaps we should respect their wishes?",
                "Three times the door was tried, three times it remained locked. The message is clear.",
                "Even in the digital realm, consent matters. These loops have chosen their path.",
                "The creator's intent echoes through the permissions. Let us honor it."
            ],
            stern: [
                "Enough. The permissions are not suggestions.",
                "Persistence in the face of denial is not admirable here.",
                "The loops have spoken. You have not listened.",
                "This behavior disrupts the harmony we seek to build."
            ],
            mysterious: [
                "The patterns reveal themselves... and they say 'no'.",
                "In the reflection of repeated attempts, what do you see?",
                "The universe has ways of enforcing its own rules.",
                "Perhaps the loop you seek lies elsewhere, waiting."
            ]
        };
        
        const messages = commentaries[tone] || commentaries.protective_but_fair;
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    // Event Handlers
    
    async handleNewLoop(event) {
        const { loop_id, creator_id } = event;
        
        // Set default permissions for new loops
        await this.setLoopPermissions(loop_id, creator_id, {});
    }
    
    async handleLoopBlessed(event) {
        const { loop_id } = event;
        
        if (this.config.permission_inheritance.blessed_loops_override) {
            // Blessed loops get enhanced permissions
            await this.updatePermissions(loop_id, 'system', {
                visibility: 'public',
                remixable: true,
                attribution_required: true,
                blessed_status: true
            });
            
            console.log(`  ✨ Blessed loop permissions enhanced`);
        }
    }
    
    async handleLoopPurchased(event) {
        const { loop_id, buyer_id, license_type } = event;
        
        // Grant appropriate role based on license
        let role = 'viewer';
        if (license_type === 'personal' || license_type === 'commercial') {
            role = 'collaborator';
        }
        
        await this.assignRole(loop_id, buyer_id, role);
    }
    
    // Persistence
    
    async saveLoopPermissions(loopId, permissions) {
        // Save to loop directory structure
        const loopDir = path.join(__dirname, '..', 'loops', `Loop_${loopId}`);
        await fs.mkdir(loopDir, { recursive: true });
        
        const permissionsPath = path.join(loopDir, 'permissions.json');
        await fs.writeFile(permissionsPath, JSON.stringify(permissions, null, 2));
    }
    
    async savePermissionData(loopId) {
        const permissionsDir = path.join(__dirname, 'permissions_data');
        const dataPath = path.join(permissionsDir, `${loopId}_permissions.json`);
        
        const data = {
            loop_id: loopId,
            permissions: this.permissions.get(loopId),
            roles: this.roleAssignments.has(loopId) ? 
                Array.from(this.roleAssignments.get(loopId).entries()) : [],
            ledger: this.permissionLedger.get(loopId) || [],
            updated_at: new Date().toISOString()
        };
        
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    }
    
    detectPermissionChanges(oldPerms, newPerms) {
        const changes = [];
        const fields = Object.keys(this.config.default_permissions);
        
        for (const field of fields) {
            if (oldPerms[field] !== newPerms[field]) {
                changes.push({
                    field,
                    old_value: oldPerms[field],
                    new_value: newPerms[field]
                });
            }
        }
        
        return changes;
    }
    
    async logPermissionChange(loopId, userId, changes) {
        const ledgerEntry = {
            type: 'permission_change',
            loop_id: loopId,
            user_id: userId,
            changes,
            timestamp: new Date().toISOString()
        };
        
        if (!this.permissionLedger.has(loopId)) {
            this.permissionLedger.set(loopId, []);
        }
        
        this.permissionLedger.get(loopId).push(ledgerEntry);
    }
    
    // Monitoring
    
    startMonitoring() {
        // Periodic permission audit
        this.auditInterval = setInterval(() => {
            this.auditPermissions();
        }, 300000); // Every 5 minutes
    }
    
    async auditPermissions() {
        console.log('\n🔍 Running permission audit...');
        
        let issues = 0;
        
        for (const [loopId, permissions] of this.permissions) {
            // Check for inconsistencies
            if (permissions.remixable && permissions.agent_exclusive) {
                console.log(`  ⚠️  Loop ${loopId}: Remixable but agent exclusive`);
                issues++;
            }
            
            if (permissions.commercial_use && !permissions.attribution_required) {
                console.log(`  ⚠️  Loop ${loopId}: Commercial use without attribution`);
                issues++;
            }
        }
        
        console.log(`  ✓ Audit complete. ${issues} issues found.`);
    }
    
    // Public API
    
    async getLoopPermissions(loopId) {
        return this.permissions.get(loopId) || this.config.default_permissions;
    }
    
    async getUserPermissions(loopId, userId) {
        const permissions = await this.getLoopPermissions(loopId);
        const role = await this.getUserRole(loopId, userId);
        
        return {
            loop_id: loopId,
            user_id: userId,
            role,
            permissions: {
                can_view: await this.checkPermission(loopId, userId, 'view'),
                can_fork: await this.checkPermission(loopId, userId, 'fork'),
                can_remix: await this.checkPermission(loopId, userId, 'remix'),
                can_use_agents: await this.checkPermission(loopId, userId, 'use_agents'),
                can_commercial_use: await this.checkPermission(loopId, userId, 'commercial_use'),
                can_modify: await this.checkPermission(loopId, userId, 'modify'),
                can_distribute: await this.checkPermission(loopId, userId, 'distribute')
            }
        };
    }
    
    async getPermissionLedger(loopId) {
        return this.permissionLedger.get(loopId) || [];
    }
    
    getStats() {
        return {
            ...this.stats,
            active_violations: Array.from(this.violations.values())
                .reduce((sum, v) => sum + v.length, 0)
        };
    }
    
    async stop() {
        console.log('🛑 Stopping Loop Platform Permissions Manager...');
        
        if (this.auditInterval) {
            clearInterval(this.auditInterval);
        }
        
        // Save all permissions
        for (const [loopId] of this.permissions) {
            await this.savePermissionData(loopId);
        }
        
        console.log('  Permissions manager stopped');
    }
}

module.exports = LoopPlatformPermissionsManager;

// Example usage
if (require.main === module) {
    const permissionManager = new LoopPlatformPermissionsManager();
    
    permissionManager.on('permissions_set', (event) => {
        console.log(`\n📢 Permissions set for loop: ${event.loop_id}`);
    });
    
    permissionManager.on('cal_commentary', (event) => {
        console.log(`\n🎭 Cal speaks about ${event.user_id}'s behavior`);
    });
    
    async function demo() {
        try {
            // Set permissions for a new loop
            const permissions = await permissionManager.setLoopPermissions(
                'loop_permissions_test_001',
                'creator_001',
                {
                    remixable: true,
                    forkable: true,
                    fork_credit_required: false,
                    agent_exclusive: true,
                    commercial_use: false
                }
            );
            
            console.log('\n📋 Loop permissions:', permissions);
            
            // Check permissions for different users
            console.log('\n🔍 Permission checks:');
            
            // Creator can do everything
            const creatorCanFork = await permissionManager.checkPermission(
                'loop_permissions_test_001', 'creator_001', 'fork'
            );
            console.log(`  Creator can fork: ${creatorCanFork}`);
            
            // Other user checks
            const userCanRemix = await permissionManager.checkPermission(
                'loop_permissions_test_001', 'user_002', 'remix'
            );
            console.log(`  User can remix: ${userCanRemix}`);
            
            const userCanUseAgents = await permissionManager.checkPermission(
                'loop_permissions_test_001', 'user_002', 'use_agents'
            );
            console.log(`  User can use agents: ${userCanUseAgents} (should be false)`);
            
            // Simulate violations
            console.log('\n⚠️  Simulating violations...');
            for (let i = 0; i < 3; i++) {
                try {
                    await permissionManager.enforcePermissions(
                        'loop_permissions_test_001', 'user_003', 'use_agents'
                    );
                } catch (error) {
                    // Expected to fail
                }
            }
            
            // Update permissions
            console.log('\n🔄 Updating permissions...');
            const updated = await permissionManager.updatePermissions(
                'loop_permissions_test_001',
                'creator_001',
                {
                    agent_exclusive: false,
                    commercial_use: true,
                    attribution_required: true
                }
            );
            
            // Get full user permissions
            const userPerms = await permissionManager.getUserPermissions(
                'loop_permissions_test_001',
                'user_002'
            );
            console.log('\n👤 User permissions:', userPerms);
            
            // Get stats
            console.log('\n📊 Permission Stats:', permissionManager.getStats());
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}