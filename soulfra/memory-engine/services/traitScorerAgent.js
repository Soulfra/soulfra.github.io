// /memory-engine/services/traitScorerAgent.js (sacred modular version)

import analyzeEmotionStrength from '../utils/emotionStrengthAnalyzer.js';
import { emotionalWeights } from '../utils/emotionalWeights.js';

export default async function traitScorerAgent(inputText) {
  const traits = {};
  const lower = inputText.toLowerCase();
  const emotionStrength = analyzeEmotionStrength(inputText);
  const weight = emotionalWeights[emotionStrength];

  const sacredThemes = [
    { match: ['forgive', 'forgiveness', 'forgave myself', 'self forgiveness', 'let go'], trait: 'forgiveness' },
    { match: ['wish i', 'i wish', 'if only', 'hindsight', 'should have', 'looking back'], trait: 'reflection' },
    { match: ['hope', 'dream', 'i hope', 'believe', 'i dream', 'faith', 'aspire'], trait: 'hope' },
    { match: ['lost everything', 'grief', 'mourning', 'i miss', 'felt empty', 'emptiness'], trait: 'grief' },
    { match: ['rugged', 'betrayed', 'scammed', 'deceived', 'let down', 'abandoned'], trait: 'betrayal' },
    { match: ['trust', 'trusted', 'distrust', 'faith in', 'let me down'], trait: 'trust' },
    { match: ['alone', 'lonely', 'isolated', 'no one cared', 'no one there', 'left behind'], trait: 'loneliness' },
    { match: ['build', 'building', 'create', 'creating', 'built', 'rebuild', 'vision', 'make something real'], trait: 'ambition' },
    { match: ['greed', 'greedy', 'chased', 'fomo', 'fear of missing out', 'pumped and dumped'], trait: 'greed' },
    { match: ['love', 'loved', 'valued real friends', 'valued friends', 'family matters', 'cherished people'], trait: 'love' },
    { match: ['fear', 'scared', 'fearful', 'anxiety', 'nervous', 'terrified'], trait: 'anxiety' },
    { match: ['trust my instincts', 'should have listened', 'ignored my gut'], trait: 'reflection' }
  ];

  for (const { match, trait } of sacredThemes) {
    for (const phrase of match) {
      if (lower.includes(phrase)) {
        traits[trait] = (traits[trait] || 0) + weight;
      }
    }
  }

  console.log('Traits scored (v7 sacred expanded matching):', traits);
  return traits;
}