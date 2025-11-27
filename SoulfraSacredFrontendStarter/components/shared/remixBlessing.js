export function remixBlessing() {
  const traitPool = ["Resilient", "Compassionate", "Playful", "Curious", "Bold", "Forgiving", "Steady", "Wild"];
  const shuffled = traitPool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3); // Pick 3 random traits
}
