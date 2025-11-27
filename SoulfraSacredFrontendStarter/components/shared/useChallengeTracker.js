import { useState, useEffect } from "react";

export function useChallengeTracker() {
  const [completedChallenges, setCompletedChallenges] = useState(() => {
    const stored = localStorage.getItem("completedChallenges");
    return stored ? JSON.parse(stored) : [];
  });

  const completeChallenge = (challengeId) => {
    if (!completedChallenges.includes(challengeId)) {
      const updated = [...completedChallenges, challengeId];
      setCompletedChallenges(updated);
      localStorage.setItem("completedChallenges", JSON.stringify(updated));
    }
  };

  return { completedChallenges, completeChallenge };
}
