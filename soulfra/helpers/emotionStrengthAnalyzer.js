// /memory-engine/helpers/emotionStrengthAnalyzer.js
export default function analyzeEmotionStrength(text) {
  const lower = text.toLowerCase();
  if (lower.includes('truly') || lower.includes('deeply') || lower.includes('desperately') || lower.includes('completely')) {
    return 'heavy';
  }
  if (lower.includes('really') || lower.includes('strongly') || lower.includes('clearly')) {
    return 'medium';
  }
  return 'light';
}
