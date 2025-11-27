// /helpers/oathSubmitHandler.js (new sacred modular version)

import generateMemoryId from './generateMemoryId';
import formatTimestamp from './formatTimestamp';

async function uploadAudioForTranscription(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'oathRecording.wav');

  const response = await fetch(process.env.NEXT_PUBLIC_TRANSCRIPTION_ENDPOINT, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Transcription failed.');
  }

  const data = await response.json();
  return data.transcribed_text;
}

async function getEmotionalSnapshot(input_text) {
  const response = await fetch('/api/analyze-traits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input_text })
  });

  if (!response.ok) {
    throw new Error('Failed to analyze emotional fingerprint.');
  }

  const data = await response.json();
  return data.emotional_snapshot;
}

export default async function oathSubmitHandler(audioBlob, userId, setLoading) {
  try {
    const transcribedText = await uploadAudioForTranscription(audioBlob);
    if (!transcribedText) {
      console.error('No transcription received.');
      return;
    }

    const emotionalSnapshot = await getEmotionalSnapshot(transcribedText);

    const memoryPayload = {
      memory_id: generateMemoryId(userId),
      user_id: userId,
      ritual_id: 'souloneth_oath_001',
      timestamp: formatTimestamp(),
      input_text: transcribedText,
      traits_detected: emotionalSnapshot,
      emotional_snapshot: emotionalSnapshot
    };

    console.log('🚀 Sending sacred ritual payload to backend:', memoryPayload);

    await fetch('/api/ritual-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryPayload })
    });

  } catch (error) {
    console.error('Oath submission error:', error.message);
  } finally {
    setLoading(false);
  }
}