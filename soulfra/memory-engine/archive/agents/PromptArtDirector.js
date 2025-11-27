// /soulfra/memory-engine/agents/PromptArtDirectorAgent.js

function generateArtPromptForRitual(traitFocus) {
  const basePrompts = {
    hope: "glowing sunrise over misty valley, soft light, serene colors",
    regret: "fractured mirrors in moonlight, cold tones, surreal atmosphere",
    forgiveness: "cracked open heart mended with golden light, warm glow",
    courage: "stormy cliffs with roaring ocean, bold colors, rising light"
  };

  return basePrompts[traitFocus] || "abstract swirling lights, evolving forms, deep emotional color schemes";
}

module.exports = {
  generateArtPromptForRitual
};