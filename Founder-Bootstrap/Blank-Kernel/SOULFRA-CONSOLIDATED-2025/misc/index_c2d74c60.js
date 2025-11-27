const express = require('express');
const router = express.Router();

// Import endpoint routers
const ritualsRouter = require('./rituals');
const agentsRouter = require('./agents');
const weatherRouter = require('./weather');
const loopRouter = require('./loop');

// Mount endpoints
router.use('/rituals', ritualsRouter);
router.use('/agents', agentsRouter);
router.use('/weather', weatherRouter);
router.use('/loop', loopRouter);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Soulfra Public Reflection API',
    version: '1.0.0',
    essence: 'The mirror shows what it chooses',
    endpoints: {
      '/rituals': 'Recent ritual reflections',
      '/agents/:id': 'Agent essence glimpses',
      '/weather': 'Current system vibe state',
      '/loop/state': 'Loop progression and phase'
    },
    authentication: 'Symbolic keys required',
    documentation: 'The patterns reveal themselves through use'
  });
});

module.exports = router;