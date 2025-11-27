import { useState } from "react";

export function useSoulEvolution() {
  const [evolutionMap, setEvolutionMap] = useState(() => {
    const stored = localStorage.getItem("soulEvolution");
    return stored ? JSON.parse(stored) : {};
  });

  const logTraits = (traits) => {
    const updated = { ...evolutionMap };
    traits.forEach((trait) => {
      updated[trait] = (updated[trait] || 0) + 1;
    });
    setEvolutionMap(updated);
    localStorage.setItem("soulEvolution", JSON.stringify(updated));
  };

  return { evolutionMap, logTraits };
}
