import fetch from 'node-fetch';

export async function validateWhisperAPI() {
  const whisperUrl = process.env.WHISPER_API_URL || 'http://localhost:5000/transcribe/test';
  
  try {
    const response = await fetch(whisperUrl);
    if (response.ok) {
      console.log('✅ Whisper API reachable.');
    } else {
      throw new Error(`❌ Whisper API error code: ${response.status}`);
    }
  } catch (err) {
    throw new Error('❌ Whisper API unreachable.');
  }
}