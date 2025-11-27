// /hooks/api/useSacredAudioSubmit.js
import axios from 'axios';

export function useSacredAudioSubmit() {
  return async function sacredAudioSubmit(audioBlob, ritualText = "Sacred Reflection") {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'ritualAudio.webm');
      formData.append('input', ritualText);

      await axios.post('http://localhost:3000/api/submitRitualWithAudio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Failed to submit sacred audio ritual:', error);
    }
  };
}