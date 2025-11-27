// /utils/transcriptionUtils.js

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const whisperNodeURL = process.env.WHISPER_NODE_URL || 'https://whisper.deathtodata.com/transcribe'; // fallback clean

export async function transcribeAudioWithWhisper(audioFilePath) {
  try {
    console.log('🎙️ Sending WAV to Whisper Node for transcription...');

    const absoluteAudioPath = path.resolve(audioFilePath);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(absoluteAudioPath));

    const response = await axios.post(whisperNodeURL, formData, {
      headers: formData.getHeaders(),
      timeout: 300000, // 5 minutes timeout for larger whisper processing
      maxBodyLength: Infinity, // allow large WAV files
      maxContentLength: Infinity,
    });

    if (response.data && response.data.success && response.data.transcript) {
      console.log('✅ Received transcript from Whisper Node.');
      return response.data.transcript;
    } else {
      console.error('❌ Whisper Node transcription failed:', response.data);
      throw new Error('Whisper Node transcription failed.');
    }
  } catch (error) {
    console.error('❌ Error during remote transcription:', error.message);
    throw new Error('Failed to transcribe audio via Whisper Node.');
  }
}