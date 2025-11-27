import { useState, useEffect } from "react";

export function useRitualTimer() {
  const [lastRitual, setLastRitual] = useState(() => {
    const stored = localStorage.getItem("lastRitualTime");
    return stored ? parseInt(stored) : null;
  });

  const updateLastRitual = () => {
    const now = Date.now();
    localStorage.setItem("lastRitualTime", now);
    setLastRitual(now);
  };

  const minutesSinceLast = () => {
    if (!lastRitual) return Infinity;
    const diffMs = Date.now() - lastRitual;
    return diffMs / 60000;
  };

  return { lastRitual, updateLastRitual, minutesSinceLast };
}
