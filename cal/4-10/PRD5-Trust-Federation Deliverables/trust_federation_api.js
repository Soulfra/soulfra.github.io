// soulfra/src/api/federation.js
// Add these endpoints to existing server.js

const TrustFederation = require('../modules/federation');

function setupFederationRoutes(app, db, auth) {
  // Initialize federation module
  const federation = new TrustFederation(db);
  federation.initializeDatabase();

  // ===== USER ENDPOINTS =====

  // Generate trust certificate
  app.post('/api/federation/certificate', auth, async (req, res) => {
    try {
      const { audience, validityDays, anonymous } = req.body;
      
      // Check rate limits based on user's trust tier
      const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(req.user.id);
      const tier = federation.getTier(user.trust_score);
      const benefits = federation.getTierBenefits(tier);
      
      // Check daily limit
      const today = new Date().toISOString().split('T')[0];
      const todayCount = db.prepare(`
        SELECT COUNT(*) as count FROM trust_certificates 
        WHERE user_id = ? AND DATE(issued_at) = ?
      `).get(req.user.id, today).count;
      
      if (todayCount >= benefits.exportLimit) {
        return res.status(429).json({ 
          error: 'Daily certificate limit reached',
          limit: benefits.exportLimit,
          tier: tier
        });
      }

      const options = {
        audience,
        validitySeconds: (validityDays || benefits.validityDays) * 24 * 60 * 60,
        anonymous: anonymous || false
      };

      const certificate = await federation.generateCertificate(req.user.id, options);
      
      res.json({
        ...certificate,
        usage: {
          dailyUsed: todayCount + 1,
          dailyLimit: benefits.exportLimit,
          tier: tier
        }
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // List user's certificates
  app.get('/api/federation/certificates', auth, async (req, res) => {
    try {
      const certificates = db.prepare(`
        SELECT id, trust_score, tier, issued_at, expires_at, usage_count, revoked
        FROM trust_certificates 
        WHERE user_id = ? 
        ORDER BY issued_at DESC
        LIMIT 50
      `).all(req.user.id);

      res.json({
        certificates: certificates.map(cert => ({
          ...cert,
          isExpired: new Date() > new Date(cert.expires_at),
          shareUrl: `${federation.issuer}/verify/${cert.id}`
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== PUBLIC VERIFICATION ENDPOINTS =====

  // Verify certificate (public endpoint - no auth required)
  app.post('/api/federation/verify', async (req, res) => {
    try {
      const { certificate, partnerId } = req.body;
      
      if (!certificate) {
        return res.status(400).json({ error: 'Certificate required' });
      }

      let verification;
      
      if (partnerId) {
        // Partner verification (with API key)
        const apiKey = req.headers['x-api-key'];
        verification = await federation.verifyPartnerRequest(apiKey, certificate);
      } else {
        // Public verification
        verification = await federation.verifyCertificate(certificate);
      }

      // Track verification stats (no personal data)
      if (verification.valid) {
        db.prepare(`
          INSERT INTO federation_events 
          (id, event_type, trust_score, metadata)
          VALUES (?, ?, ?, ?)
        `).run([
          federation.generateId(),
          'public_verification',
          verification.trustScore,
          JSON.stringify({ 
            tier: verification.tier,
            partner: partnerId || 'public',
            timestamp: Date.now()
          })
        ]);
      }

      res.json(verification);
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get verification by certificate ID (for share URLs)
  app.get('/api/federation/verify/:certificateId', async (req, res) => {
    try {
      const cert = db.prepare(`
        SELECT certificate_data, trust_score, tier, expires_at 
        FROM trust_certificates 
        WHERE id = ? AND revoked = FALSE
      `).get(req.params.certificateId);

      if (!cert) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      if (new Date() > new Date(cert.expires_at)) {
        return res.status(410).json({ error: 'Certificate expired' });
      }

      const verification = await federation.verifyCertificate(cert.certificate_data);
      
      // Increment usage counter
      db.prepare(`
        UPDATE trust_certificates 
        SET usage_count = usage_count + 1 
        WHERE id = ?
      `).run(req.params.certificateId);

      res.json({
        ...verification,
        certificateId: req.params.certificateId,
        publiclyVerifiable: true
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== PARTNER MANAGEMENT ENDPOINTS =====

  // List active partners (public)
  app.get('/api/federation/partners', async (req, res) => {
    try {
      const partners = db.prepare(`
        SELECT id, name, domain, status
        FROM federation_partners 
        WHERE status = 'active'
        ORDER BY name
      `).all();

      res.json({ partners });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register new partner (admin only)
  app.post('/api/federation/partners', auth, async (req, res) => {
    try {
      // Check if user is admin (extend this based on your admin system)
      const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(req.user.id);
      if (user.trust_score < 90) { // Simple admin check
        return res.status(403).json({ error: 'Admin access required' });
      }

      const partner = await federation.registerPartner(req.body);
      res.json(partner);
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== ANALYTICS ENDPOINTS =====

  // Federation stats (public)
  app.get('/api/federation/stats', async (req, res) => {
    try {
      const stats = {
        totalCertificates: db.prepare('SELECT COUNT(*) as count FROM trust_certificates').get().count,
        totalVerifications: db.prepare('SELECT COUNT(*) as count FROM federation_events WHERE event_type = "verification"').get().count,
        activePartners: db.prepare('SELECT COUNT(*) as count FROM federation_partners WHERE status = "active"').get().count,
        
        // Trust distribution
        trustDistribution: {
          premium: db.prepare('SELECT COUNT(*) as count FROM trust_certificates WHERE tier = "premium"').get().count,
          standard: db.prepare('SELECT COUNT(*) as count FROM trust_certificates WHERE tier = "standard"').get().count,
          basic: db.prepare('SELECT COUNT(*) as count FROM trust_certificates WHERE tier = "basic"').get().count
        },

        // Recent activity (last 7 days)
        recentActivity: db.prepare(`
          SELECT DATE(timestamp) as date, COUNT(*) as verifications
          FROM federation_events 
          WHERE event_type = 'verification' 
            AND timestamp >= datetime('now', '-7 days')
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
        `).all()
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // User's federation activity
  app.get('/api/federation/activity', auth, async (req, res) => {
    try {
      const activity = {
        certificatesIssued: db.prepare('SELECT COUNT(*) as count FROM trust_certificates WHERE user_id = ?').get(req.user.id).count,
        totalVerifications: db.prepare('SELECT SUM(usage_count) as total FROM trust_certificates WHERE user_id = ?').get(req.user.id).total || 0,
        
        // Recent certificates
        recentCertificates: db.prepare(`
          SELECT id, trust_score, tier, issued_at, expires_at, usage_count
          FROM trust_certificates 
          WHERE user_id = ? 
          ORDER BY issued_at DESC 
          LIMIT 10
        `).all(req.user.id)
      };

      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return federation; // Return instance for other modules to use
}

module.exports = { setupFederationRoutes };