/**
 * Pitch Deck Routes
 *
 * Serves auto-generated pitch decks from lib/pitch-deck-generator.js
 * Provides access to government pitch deck and brand capability showcase
 */

const express = require('express');
const router = express.Router();
const path = require('path');

/**
 * GET /pitch-deck
 * Redirect to government pitch deck
 */
router.get('/', (req, res) => {
  res.redirect('/government-pitch-deck.html');
});

/**
 * GET /pitch-deck/government
 * Serve government contract pitch deck
 */
router.get('/government', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/government-pitch-deck.html'));
});

/**
 * GET /pitch-deck/generate
 * Trigger pitch deck generation (future: dynamic generation)
 */
router.get('/generate', async (req, res) => {
  try {
    // Future: Wire to PitchDeckGenerator class
    // const generator = new PitchDeckGenerator();
    // const deck = await generator.generateDeck(req.query.userId);

    // For now, redirect to existing deck
    res.json({
      success: true,
      message: 'Pitch deck available',
      url: '/government-pitch-deck.html',
      note: 'Dynamic generation coming soon (wire to lib/pitch-deck-generator.js)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /pitch-deck/brands
 * Show 12 brand capabilities
 */
router.get('/brands', (req, res) => {
  const brands = [
    { name: 'Soulfra', icon: '🔐', capability: 'Security Engineering', proof: 'Ed25519 crypto • SSO • Zero-knowledge proofs' },
    { name: 'Calriven', icon: '🤖', capability: 'AI/ML Engineering', proof: 'Multi-LLM routing • ELO systems • Agent marketplace' },
    { name: 'DeathtoData', icon: '⚫', capability: 'Privacy Engineering', proof: 'Zero-tracking analytics • GDPR compliance • Data deletion' },
    { name: 'ClarityEngine', icon: '💙', capability: 'Data Visualization', proof: 'Real-time dashboards • Interactive charts • Insight extraction' },
    { name: 'FinishThisIdea', icon: '🟢', capability: 'Rapid Prototyping', proof: 'MVPs in days • Whisper-to-code • Demo generation' },
    { name: 'FinishThisRepo', icon: '🟡', capability: 'Code Quality', proof: 'Automated refactoring • Test generation • Documentation' },
    { name: 'IpoMyAgent', icon: '🟣', capability: 'Business Development', proof: 'Auto-generated decks • Contract matching • Reverse applications' },
    { name: 'HollowTown', icon: '💜', capability: 'Community Building', proof: 'Forum systems • Reputation economy • Engagement metrics' },
    { name: 'ColdStartKit', icon: '🔵', capability: 'Zero-Cost Operations', proof: 'Free tiers • Self-hosted • No infrastructure costs' },
    { name: 'BrandAidKit', icon: '🟠', capability: 'Brand Engineering', proof: 'Multi-domain routing • Personality systems • Voice consistency' },
    { name: 'DealOrDelete', icon: '🔴', capability: 'Decision Frameworks', proof: 'State machines • Workflow automation • Choice architecture' },
    { name: 'SaveOrSink', icon: '🩵', capability: 'Crisis Management', proof: 'Auto-recovery • Health checks • Rollback systems' }
  ];

  res.json({
    success: true,
    brands: brands,
    totalCapabilities: brands.length,
    message: '12 proven capabilities across security, AI, privacy, data, prototyping, quality, business, community, operations, branding, decisions, and recovery'
  });
});

/**
 * GET /pitch-deck/help
 * Show pitch deck API documentation
 */
router.get('/help', (req, res) => {
  res.json({
    success: true,
    endpoints: {
      '/pitch-deck': 'Main pitch deck (government contracts)',
      '/pitch-deck/government': 'Government contract pitch deck',
      '/pitch-deck/brands': 'List of 12 brand capabilities',
      '/pitch-deck/generate': 'Generate new pitch deck (coming soon)',
      '/pitch-deck/help': 'This help page'
    },
    files: {
      'lib/pitch-deck-generator.js': 'Pitch deck generation engine',
      'public/government-pitch-deck.html': 'Pre-generated pitch deck'
    },
    usage: {
      'View deck': 'Open http://localhost:5001/pitch-deck',
      'API access': 'curl http://localhost:5001/pitch-deck/brands',
      'Generate new': 'curl http://localhost:5001/pitch-deck/generate'
    }
  });
});

module.exports = router;
