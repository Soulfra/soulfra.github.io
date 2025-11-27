// Cleaned wallet-balance.js (no Bundlr dependency)
import express from 'express';
const router = express.Router();

router.get('/admin/wallet-balance', (req, res) => {
  res.json({ message: 'Wallet balance check disabled (Bundlr removed).' });
});

export default router;
