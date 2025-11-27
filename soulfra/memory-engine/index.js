// /memory-engine/index.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Modular routers
import submitRitualWithAudioRouter from './routes/api/submitRitualWithAudio.js';
import adminWalletBalanceRouter from './routes/admin/wallet-balance.js';
import adminSoulprintViewerRouter from './routes/admin/soulprint-viewer.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount API routes
app.use('/api/ritual', submitRitualWithAudioRouter); // << Cleaned and namespaced to /api/ritual
app.use('/api/admin/wallet-balance', adminWalletBalanceRouter);
app.use('/api/admin/soulprint-viewer', adminSoulprintViewerRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Memory Engine server running at http://localhost:${PORT}`);
});