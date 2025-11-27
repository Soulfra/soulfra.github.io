// /memory-engine/utils/convertWebmToWav.js

import { exec } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export async function convertWebMtoWav(inputWebmPath) {
  const absoluteInputPath = path.resolve(inputWebmPath);
  
  // ✅ Force output .wav extension
  const outputWavPath = absoluteInputPath + '.wav';

  const command = `ffmpeg -y -i "${absoluteInputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputWavPath}"`;

  console.log('🎙️ Converting WebM to WAV with command:', command);

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ FFmpeg conversion failed:', error);
        return reject(new Error('Failed to convert WebM to WAV.'));
      }
      resolve(outputWavPath);
    });
  });
}