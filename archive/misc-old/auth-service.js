const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const config = require('../config/environment');
const EmailService = require('./email-service');
const SMSService = require('./sms-service');

class AuthService {
  constructor() {
    this.pool = new Pool(config.database);
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.jwtSecret = config.auth.jwtSecret;
    this.jwtExpiresIn = config.auth.jwtExpiresIn;
    this.refreshTokenExpiresIn = config.auth.refreshTokenExpiresIn;
    this.bcryptRounds = config.auth.bcryptRounds;
  }

  async register(userData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [userData.email, userData.username]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, this.bcryptRounds);

      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: userData.email,
        name: userData.username,
        metadata: {
          platform: 'billion_dollar_game'
        }
      });

      // Create user
      const userResult = await client.query(`
        INSERT INTO users (
          username, email, password_hash, stripe_customer_id,
          discord_id, telegram_id, phone_number, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, email, balance, created_at
      `, [
        userData.username,
        userData.email,
        passwordHash,
        stripeCustomer.id,
        userData.discordId || null,
        userData.telegramId || null,
        userData.phoneNumber || null,
        userData.metadata || {}
      ]);

      const user = userResult.rows[0];

      // Create initial game state
      await client.query(`
        INSERT INTO game_state (user_id, current_level, experience_points)
        VALUES ($1, 1, 0)
      `, [user.id]);

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Create audit log
      await this.logAuthAction(client, user.id, 'register', {
        method: userData.registrationMethod || 'email'
      });

      await client.query('COMMIT');

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance
        },
        ...tokens
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Registration error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async login(credentials) {
    const { username, password } = credentials;

    try {
      // Find user by username or email
      const userResult = await this.pool.query(`
        SELECT id, username, email, password_hash, is_active, 
               balance, reputation_score, stripe_customer_id
        FROM users
        WHERE username = $1 OR email = $1
      `, [username]);

      if (userResult.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is disabled');
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        await this.handleFailedLogin(user.id);
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Update last active
      await this.pool.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Log successful login
      await this.logAuthAction(null, user.id, 'login', {
        method: 'password'
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          reputation_score: user.reputation_score
        },
        ...tokens
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async loginWithStripe(stripeUserId) {
    try {
      // Find user by Stripe customer ID
      const userResult = await this.pool.query(`
        SELECT id, username, email, is_active, balance, reputation_score
        FROM users
        WHERE stripe_customer_id = $1
      `, [stripeUserId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        throw new Error('Account is disabled');
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Update last active
      await this.pool.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Log Stripe login
      await this.logAuthAction(null, user.id, 'login', {
        method: 'stripe'
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          reputation_score: user.reputation_score
        },
        ...tokens
      };
    } catch (error) {
      console.error('Stripe login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if user still exists and is active
      const userResult = await this.pool.query(
        'SELECT id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId);

      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  async requestPasswordReset(email) {
    try {
      const userResult = await this.pool.query(
        'SELECT id, username FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if email exists
        return { message: 'If the email exists, a reset link has been sent' };
      }

      const user = userResult.rows[0];
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token
      await this.pool.query(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, resetTokenHash, expiresAt]);

      // Send reset email
      await this.emailService.sendPasswordResetEmail(user, resetToken);

      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const tokenResult = await client.query(`
        SELECT user_id FROM password_reset_tokens
        WHERE token_hash = $1 AND expires_at > NOW() AND used = false
      `, [tokenHash]);

      if (tokenResult.rows.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const userId = tokenResult.rows[0].user_id;

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used = true WHERE token_hash = $1',
        [tokenHash]
      );

      // Log password reset
      await this.logAuthAction(client, userId, 'password_reset', {});

      await client.query('COMMIT');

      return { message: 'Password reset successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Password reset error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async enable2FA(userId, method = 'sms') {
    try {
      // Generate secret for 2FA
      const secret = crypto.randomBytes(16).toString('hex');
      
      await this.pool.query(`
        UPDATE users 
        SET two_factor_secret = $1, two_factor_enabled = true, two_factor_method = $2
        WHERE id = $3
      `, [secret, method, userId]);

      if (method === 'authenticator') {
        // Return QR code data for authenticator apps
        const otpauth = `otpauth://totp/BillionDollarGame:${userId}?secret=${secret}&issuer=BillionDollarGame`;
        return { secret, otpauth };
      }

      return { message: '2FA enabled successfully' };
    } catch (error) {
      console.error('2FA enable error:', error);
      throw error;
    }
  }

  async verify2FA(userId, code) {
    try {
      const userResult = await this.pool.query(
        'SELECT two_factor_secret, two_factor_method FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const { two_factor_secret, two_factor_method } = userResult.rows[0];

      // Verify the code based on method
      // This is a simplified example - in production, use a proper OTP library
      const expectedCode = crypto.createHash('sha256')
        .update(two_factor_secret + Math.floor(Date.now() / 30000))
        .digest('hex')
        .substring(0, 6);

      if (code !== expectedCode) {
        throw new Error('Invalid 2FA code');
      }

      return { verified: true };
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  }

  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async handleFailedLogin(userId) {
    // Implement login attempt tracking and account lockout
    // This is a placeholder - implement proper rate limiting
    console.log(`Failed login attempt for user ${userId}`);
  }

  async logAuthAction(client, userId, action, metadata) {
    const queryClient = client || this.pool;
    
    await queryClient.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, changes)
      VALUES ($1, $2, $3, $4)
    `, [userId, `auth_${action}`, 'auth', metadata]);
  }
}

module.exports = AuthService;