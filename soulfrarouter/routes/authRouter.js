const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');

router.post('/submit-contact', async (req, res) => {
  const { email, phone } = req.body;
  const { data, error } = await supabase.from('contacts').insert([{ email, phone }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true, data });
});

module.exports = router;
