// /memory-engine/services/ritualGenerator.js

export async function generateSacredRitualPrompt(currentSeason) {
  if (!currentSeason) {
    throw new Error('Missing current season for ritual generation.');
  }

  const ritualSeeds = {
    'Dawn of Renewal': [
      'Reflect on a moment you wish to reawaken.',
      'Design a sacred token representing your rebirth.',
      'Record a whisper of your future self guiding you forward.'
    ],
    'Season of Reflection': [
      'Write a confession you’ve never spoken aloud.',
      'Burn an old belief you no longer need.',
      'Send forgiveness across time to your past mistakes.'
    ],
    'Era of Expansion': [
      'Manifest a dream project you wish to create.',
      'Challenge your comfort zone by drafting a bold vision.',
      'Seed your future ambition with a sacred promise.'
    ],
    'Quiet Waters': [
      'Document a sacred ritual of stillness you crave.',
      'Celebrate the overlooked joys of your day.',
      'Anchor your soul to the present with a memory you treasure.'
    ],
    'Golden Embrace': [
      'Compose a hymn of gratitude to someone unthanked.',
      'Create a symbol of your deepest connection.',
      'Gift a blessing to an unseen soul.'
    ],
    'Winds of Reckoning': [
      'Name the sacred fear you must face to grow.',
      'Design a shield to protect your future courage.',
      'Record a vow to transmute loss into power.'
    ]
  };

  const prompts = ritualSeeds[currentSeason] || ['Compose a ritual of emotional transformation.'];

  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  return randomPrompt;
}