// hooks/api/useRitualCapture.js
import axios from 'axios';

export function useRitualCapture() {
  return async function captureRitual(data) {
    try {
      await axios.post('http://localhost:3000/api/collectRitual', data);
    } catch (error) {
      console.error("Failed to capture ritual:", error);
    }
  };
}