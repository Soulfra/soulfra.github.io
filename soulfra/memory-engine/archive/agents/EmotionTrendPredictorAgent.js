// /soulfra/memory-engine/agents/EmotionTrendPredictorAgent.js

async function predictNextEmotionalSeason(recentEmotionalTrends) {
  if (!recentEmotionalTrends) return null;

  const scores = Object.entries(recentEmotionalTrends).sort(([, a], [, b]) => b - a);

  if (scores.length > 0) {
    const [topEmotion] = scores[0];
    return `Season of ${topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1)}`;
  }

  return "Season of Reflection"; // fallback
}

module.exports = {
  predictNextEmotionalSeason
};