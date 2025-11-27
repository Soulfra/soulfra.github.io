// hooks/api/useRitualSubmit.js
import axios from 'axios';

export function useRitualSubmit() {
  return async function submitRitual(data) {
    try {
      await axios.post('http://localhost:3000/api/submitRitual', data);
    } catch (error) {
      console.error("Failed to submit ritual:", error);
    }
  };
}