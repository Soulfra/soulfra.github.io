const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const authRouter = require('./routes/authRouter');
const openaiRouter = require('./routes/openaiRouter');
const voiceRouter = require('./routes/voiceRouter');

app.use('/api/auth', authRouter);
app.use('/api/openai', openaiRouter);
app.use('/api/voice', voiceRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
