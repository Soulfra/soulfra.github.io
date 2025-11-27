// /services/soulprintScorer.js
export function scoreReflectionDepth(reflectionText) {
    let baseXP = 10; // Everyone gets base XP for submitting
  
    const wordCount = reflectionText.trim().split(/\s+/).length;
  
    if (wordCount > 10) baseXP += 10;
    if (reflectionText.match(/I feel|I realize|I struggle|I wish|I regret|I forgive/i)) baseXP += 15;
    if (reflectionText.match(/hope|trust|despair|loyalty|forgiveness/i)) baseXP += 20;
  
    return {
      xpGained: baseXP,
      traitBonuses: extractTraitBonuses(reflectionText)
    };
  }
  
  // Basic trait detection
  function extractTraitBonuses(reflectionText) {
    const traits = {};
  
    if (reflectionText.match(/hope/i)) traits.hope = 1;
    if (reflectionText.match(/trust/i)) traits.trust = 1;
    if (reflectionText.match(/despair/i)) traits.despair = 1;
    if (reflectionText.match(/loyalty/i)) traits.loyalty = 1;
    if (reflectionText.match(/forgiveness/i)) traits.forgiveness = 1;
  
    return traits;
  }