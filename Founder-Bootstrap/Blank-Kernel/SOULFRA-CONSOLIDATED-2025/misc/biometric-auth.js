// Mirror Kernel Biometric Authentication System
// Implements Face ID/Touch ID authentication with progressive tier unlocking

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class BiometricMirrorAuth {
    constructor(options = {}) {
        this.vaultPath = options.vaultPath || '../../../vault';
        this.authPath = path.join(this.vaultPath, 'auth');
        this.sessionsPath = path.join(this.authPath, 'sessions');
        this.usersPath = path.join(this.authPath, 'users');
        
        // Authentication configuration
        this.sessionTimeout = options.sessionTimeout || 24 * 60 * 60 * 1000; // 24 hours
        this.challengeTimeout = options.challengeTimeout || 5 * 60 * 1000; // 5 minutes
        this.maxFailedAttempts = options.maxFailedAttempts || 5;
        
        // Active sessions and challenges
        this.activeSessions = new Map();
        this.pendingChallenges = new Map();
        
        this.init();
    }

    async init() {
        // Initialize directory structure
        await fs.mkdir(this.authPath, { recursive: true });
        await fs.mkdir(this.sessionsPath, { recursive: true });
        await fs.mkdir(this.usersPath, { recursive: true });
        
        // Load existing sessions
        await this.loadActiveSessions();
        
        console.log('🔐 Biometric Mirror Auth initialized');
    }

    // Check if biometric authentication is available on current device
    async checkBiometricAvailability() {
        try {
            // Check for WebAuthn support
            if (!window.navigator.credentials) {
                return {
                    available: false,
                    reason: 'WebAuthn not supported',
                    fallback: 'pin'
                };
            }

            // Check for platform authenticator (Face ID/Touch ID)
            const available = await navigator.credentials.isUserVerifyingPlatformAuthenticatorAvailable();
            
            if (available) {
                return {
                    available: true,
                    type: this.detectBiometricType(),
                    capabilities: await this.getBiometricCapabilities()
                };
            } else {
                return {
                    available: false,
                    reason: 'No biometric authenticator available',
                    fallback: 'password'
                };
            }
        } catch (error) {
            console.error('Biometric availability check failed:', error);
            return {
                available: false,
                reason: error.message,
                fallback: 'password'
            };
        }
    }

    detectBiometricType() {
        // Detect specific biometric type based on platform
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            return 'Face ID / Touch ID';
        } else if (userAgent.includes('android')) {
            return 'Fingerprint / Face Unlock';
        } else if (userAgent.includes('mac')) {
            return 'Touch ID';
        } else if (userAgent.includes('windows')) {
            return 'Windows Hello';
        } else {
            return 'Platform Biometric';
        }
    }

    async getBiometricCapabilities() {
        // Query available biometric capabilities
        return {
            userVerification: 'required',
            authenticatorAttachment: 'platform',
            residentKey: 'discouraged',
            attestation: 'none'
        };
    }

    // Register new user with biometric authentication
    async registerUser(userData = {}) {
        try {
            // Generate user ID and authentication challenge
            const userId = this.generateUserId();
            const challenge = this.generateChallenge();
            
            // Create WebAuthn registration options
            const registrationOptions = {
                challenge: new Uint8Array(challenge),
                rp: {
                    name: "Mirror Kernel",
                    id: window.location.hostname
                },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: userData.username || `mirror_user_${Date.now()}`,
                    displayName: userData.displayName || 'Mirror User'
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" }, // ES256
                    { alg: -257, type: "public-key" } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "discouraged"
                },
                timeout: 60000,
                attestation: "none"
            };

            // Store challenge for verification
            this.pendingChallenges.set(userId, {
                challenge: challenge,
                timestamp: Date.now(),
                userData: userData
            });

            return {
                success: true,
                userId: userId,
                registrationOptions: registrationOptions,
                expiresAt: Date.now() + this.challengeTimeout
            };

        } catch (error) {
            console.error('User registration failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Complete user registration with biometric credential
    async completeRegistration(userId, credential) {
        try {
            const pendingChallenge = this.pendingChallenges.get(userId);
            if (!pendingChallenge) {
                throw new Error('Invalid or expired registration challenge');
            }

            // Verify the credential
            const verified = await this.verifyCredential(credential, pendingChallenge.challenge);
            if (!verified) {
                throw new Error('Credential verification failed');
            }

            // Create user record
            const userRecord = {
                userId: userId,
                credentialId: credential.id,
                publicKey: credential.response.publicKey,
                counter: credential.response.counter || 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                tier: 'consumer', // Default tier
                metadata: {
                    deviceInfo: this.getDeviceInfo(),
                    registrationData: pendingChallenge.userData
                },
                failedAttempts: 0,
                isActive: true
            };

            // Save user record
            await this.saveUserRecord(userRecord);
            
            // Clean up pending challenge
            this.pendingChallenges.delete(userId);

            // Create initial session
            const session = await this.createSession(userRecord);

            console.log(`✅ User registered: ${userId}`);
            
            return {
                success: true,
                userId: userId,
                session: session,
                tier: userRecord.tier
            };

        } catch (error) {
            console.error('Registration completion failed:', error);
            this.pendingChallenges.delete(userId);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Authenticate existing user with biometric
    async authenticateUser(userId) {
        try {
            // Load user record
            const userRecord = await this.loadUserRecord(userId);
            if (!userRecord || !userRecord.isActive) {
                throw new Error('User not found or inactive');
            }

            // Check failed attempts
            if (userRecord.failedAttempts >= this.maxFailedAttempts) {
                throw new Error('Account locked due to too many failed attempts');
            }

            // Generate authentication challenge
            const challenge = this.generateChallenge();
            
            const authenticationOptions = {
                challenge: new Uint8Array(challenge),
                timeout: 60000,
                userVerification: "required",
                allowCredentials: [{
                    id: new Uint8Array(Buffer.from(userRecord.credentialId, 'base64')),
                    type: "public-key",
                    transports: ["internal"]
                }]
            };

            // Store challenge for verification
            this.pendingChallenges.set(userId, {
                challenge: challenge,
                timestamp: Date.now(),
                userRecord: userRecord,
                type: 'authentication'
            });

            return {
                success: true,
                authenticationOptions: authenticationOptions,
                expiresAt: Date.now() + this.challengeTimeout
            };

        } catch (error) {
            console.error('Authentication initiation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Complete user authentication
    async completeAuthentication(userId, credential) {
        try {
            const pendingChallenge = this.pendingChallenges.get(userId);
            if (!pendingChallenge || pendingChallenge.type !== 'authentication') {
                throw new Error('Invalid or expired authentication challenge');
            }

            const userRecord = pendingChallenge.userRecord;

            // Verify the credential
            const verified = await this.verifyCredential(credential, pendingChallenge.challenge);
            if (!verified) {
                // Increment failed attempts
                userRecord.failedAttempts = (userRecord.failedAttempts || 0) + 1;
                await this.saveUserRecord(userRecord);
                
                throw new Error('Authentication failed');
            }

            // Reset failed attempts on successful auth
            userRecord.failedAttempts = 0;
            userRecord.lastLogin = new Date().toISOString();
            
            // Update counter if provided
            if (credential.response.counter !== undefined) {
                userRecord.counter = credential.response.counter;
            }

            await this.saveUserRecord(userRecord);

            // Clean up pending challenge
            this.pendingChallenges.delete(userId);

            // Create session
            const session = await this.createSession(userRecord);

            console.log(`✅ User authenticated: ${userId}`);

            return {
                success: true,
                userId: userId,
                session: session,
                tier: userRecord.tier,
                lastLogin: userRecord.lastLogin
            };

        } catch (error) {
            console.error('Authentication completion failed:', error);
            this.pendingChallenges.delete(userId);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create authenticated session
    async createSession(userRecord) {
        const sessionId = this.generateSessionId();
        const sessionToken = this.generateSecureToken();
        
        const session = {
            sessionId: sessionId,
            userId: userRecord.userId,
            tier: userRecord.tier,
            token: sessionToken,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
            deviceInfo: this.getDeviceInfo(),
            lastActivity: new Date().toISOString(),
            isActive: true
        };

        // Store session
        await this.saveSession(session);
        this.activeSessions.set(sessionId, session);

        return {
            sessionId: sessionId,
            token: sessionToken,
            expiresAt: session.expiresAt,
            tier: session.tier
        };
    }

    // Validate session and return user context
    async validateSession(sessionId, token) {
        try {
            const session = this.activeSessions.get(sessionId) || await this.loadSession(sessionId);
            
            if (!session || !session.isActive) {
                return { valid: false, reason: 'Session not found' };
            }

            if (session.token !== token) {
                return { valid: false, reason: 'Invalid token' };
            }

            if (new Date() > new Date(session.expiresAt)) {
                await this.expireSession(sessionId);
                return { valid: false, reason: 'Session expired' };
            }

            // Update last activity
            session.lastActivity = new Date().toISOString();
            await this.saveSession(session);

            return {
                valid: true,
                userId: session.userId,
                tier: session.tier,
                session: session
            };

        } catch (error) {
            console.error('Session validation failed:', error);
            return { valid: false, reason: 'Validation error' };
        }
    }

    // Upgrade user to higher tier (requires additional authentication)
    async upgradeTier(userId, targetTier, additionalAuth = {}) {
        try {
            const userRecord = await this.loadUserRecord(userId);
            if (!userRecord) {
                throw new Error('User not found');
            }

            // Validate tier upgrade path
            const upgradeValid = this.validateTierUpgrade(userRecord.tier, targetTier);
            if (!upgradeValid.allowed) {
                throw new Error(upgradeValid.reason);
            }

            // Require additional authentication for higher tiers
            if (targetTier === 'power_user' || targetTier === 'enterprise') {
                const additionalAuthValid = await this.verifyAdditionalAuth(userId, additionalAuth);
                if (!additionalAuthValid) {
                    throw new Error('Additional authentication required');
                }
            }

            // Update user tier
            userRecord.tier = targetTier;
            userRecord.tierUpgradedAt = new Date().toISOString();
            await this.saveUserRecord(userRecord);

            console.log(`⬆️ User tier upgraded: ${userId} → ${targetTier}`);

            return {
                success: true,
                userId: userId,
                newTier: targetTier,
                upgradedAt: userRecord.tierUpgradedAt
            };

        } catch (error) {
            console.error('Tier upgrade failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    validateTierUpgrade(currentTier, targetTier) {
        const tierHierarchy = ['guest', 'consumer', 'power_user', 'enterprise'];
        const currentIndex = tierHierarchy.indexOf(currentTier);
        const targetIndex = tierHierarchy.indexOf(targetTier);

        if (targetIndex <= currentIndex) {
            return { allowed: false, reason: 'Cannot downgrade or maintain same tier' };
        }

        if (targetIndex - currentIndex > 1) {
            return { allowed: false, reason: 'Cannot skip tier levels' };
        }

        return { allowed: true };
    }

    // Generate secure random values
    generateUserId() {
        return 'usr_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
    }

    generateSessionId() {
        return 'ses_' + Date.now() + '_' + crypto.randomBytes(12).toString('hex');
    }

    generateSecureToken() {
        return crypto.randomBytes(32).toString('base64url');
    }

    generateChallenge() {
        return crypto.randomBytes(32);
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
    }

    // File operations
    async saveUserRecord(userRecord) {
        const userPath = path.join(this.usersPath, `${userRecord.userId}.json`);
        await fs.writeFile(userPath, JSON.stringify(userRecord, null, 2));
    }

    async loadUserRecord(userId) {
        try {
            const userPath = path.join(this.usersPath, `${userId}.json`);
            const data = await fs.readFile(userPath, 'utf8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async saveSession(session) {
        const sessionPath = path.join(this.sessionsPath, `${session.sessionId}.json`);
        await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
    }

    async loadSession(sessionId) {
        try {
            const sessionPath = path.join(this.sessionsPath, `${sessionId}.json`);
            const data = await fs.readFile(sessionPath, 'utf8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async loadActiveSessions() {
        try {
            const files = await fs.readdir(this.sessionsPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sessionId = file.replace('.json', '');
                    const session = await this.loadSession(sessionId);
                    if (session && session.isActive && new Date() < new Date(session.expiresAt)) {
                        this.activeSessions.set(sessionId, session);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load active sessions:', error);
        }
    }

    async expireSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.isActive = false;
            session.expiredAt = new Date().toISOString();
            await this.saveSession(session);
            this.activeSessions.delete(sessionId);
        }
    }

    // Credential verification (simplified - in production use proper WebAuthn library)
    async verifyCredential(credential, challenge) {
        // This is a simplified verification
        // In production, use a proper WebAuthn library like @simplewebauthn/server
        try {
            // Basic checks
            if (!credential.response || !credential.response.clientDataJSON) {
                return false;
            }

            // Verify challenge in clientDataJSON
            const clientData = JSON.parse(Buffer.from(credential.response.clientDataJSON, 'base64').toString());
            const receivedChallenge = Buffer.from(clientData.challenge, 'base64');
            
            return receivedChallenge.equals(Buffer.from(challenge));
        } catch {
            return false;
        }
    }

    async verifyAdditionalAuth(userId, additionalAuth) {
        // Implement additional authentication for tier upgrades
        // Could be PIN, password, or additional biometric verification
        return true; // Simplified for now
    }
}

module.exports = BiometricMirrorAuth;