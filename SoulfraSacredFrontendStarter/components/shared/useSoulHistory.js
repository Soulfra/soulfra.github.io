import { useState } from "react";

export function useSoulHistory() {
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem("soulHistory");
    return stored ? JSON.parse(stored) : [];
  });

  const saveRitual = (traits) => {
    const newEntry = { date: new Date().toISOString(), traits };
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("soulHistory", JSON.stringify(updatedHistory));
  };

  return { history, saveRitual };
}
