// /routes/submitRitual.js
import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  const ritualData = req.body;
  console.log('Received ritual submission:', ritualData);
  res.status(200).json({ message: 'Ritual submitted successfully.' });
});

export default router;