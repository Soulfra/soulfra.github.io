import { useState, useEffect } from "react";

export function useStreakTracker() {
  const [streak, setStreak] = useState(() => {
    const stored = localStorage.getItem("soulStreak");
    return stored ? parseInt(stored) : 0;
  });

  const [lastRitualDate, setLastRitualDate] = useState(() => {
    const stored = localStorage.getItem("lastRitualDate");
    return stored ? stored : null;
  });

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    if (lastRitualDate === today) {
      // Already completed today
      return;
    }
    if (isYesterday(lastRitualDate)) {
      setStreak(prev => {
        const updated = prev + 1;
        localStorage.setItem("soulStreak", updated);
        return updated;
      });
    } else {
      // Reset streak
      localStorage.setItem("soulStreak", 1);
      setStreak(1);
    }
    localStorage.setItem("lastRitualDate", today);
    setLastRitualDate(today);
  };

  return { streak, updateStreak };
}

function isYesterday(dateString) {
  if (!dateString) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split('T')[0];
}
