// /routes/admin/soulprint-viewer.js
import express from 'express';
import { getSoulprintForUser } from '../../services/soulprintViewer.js';

const router = express.Router();

// API route to view a specific user's soulprint
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;

  const soulprint = getSoulprintForUser(userId);

  if (!soulprint) {
    return res.status(404).json({
      success: false,
      message: `No soulprint found for user '${userId}'.`
    });
  }

  res.json({
    success: true,
    soulprint
  });
});

export default router;