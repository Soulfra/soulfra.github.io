// /memory-engine/routes/api/submitRitualWithAudio.js

import { Router } from 'express';
import multer from 'multer';
import { encryptAndUploadToArweave } from '../../utils/encryptionUtils.js';
import { extractTraitsFromTranscript } from '../../utils/sacredTraitExtractor.js';
import { saveRitualMetadata } from '../../utils/saveRitualMetadata.js';
import { convertWebMtoWav } from '../../utils/convertWebmToWav.js';
import { transcribeAudioWithWhisper } from '../../utils/transcriptionUtils.js';
import fs from 'fs';
import path from 'path';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/submit', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const webmPath = path.resolve(file.path);
    const wavPath = webmPath.replace('.webm', '.wav');

    console.log('🎙️ WebM received:', webmPath);

    // Step 1: Convert WebM to WAV
    console.log('🎼 Converting WebM to WAV...');
    await convertWebMtoWav(webmPath);

    // Step 2: Transcribe WAV
    console.log('🧠 Transcribing WAV with Whisper...');
    const transcript = await transcribeAudioWithWhisper(wavPath);

    // Step 3: Extract emotional traits
    console.log('🔍 Extracting emotional traits...');
    const traits = await extractTraitsFromTranscript(transcript);

    console.log('✅ Sacred Traits Extracted:', traits);

    // Step 4: Encrypt and Upload WAV to Arweave
    console.log('🔒 Encrypting and uploading ritual...');
    const arweaveTxId = await encryptAndUploadToArweave(wavPath);

    // Step 5: Save ritual metadata and traits
    console.log('🛡️ Saving ritual metadata to Supabase...');
    await saveRitualMetadata({
      arweaveTxId,
      traits,
      transcript,
    });

    // Step 6: Cleanup temp files
    console.log('🧹 Cleaning up temporary files...');
    [webmPath, wavPath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Ritual submitted successfully.',
      arweaveTxId,
      traits,
    });

  } catch (error) {
    console.error('❌ Ritual submission failed:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;