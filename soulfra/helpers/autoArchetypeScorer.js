// /memory-engine/helpers/autoArchetypeScorer.js
import mapArchetype from './archetypeMapper';

export default async function autoArchetypeScorer(userId, emotionalSnapshot) {
  if (!emotionalSnapshot || !userId) return;

  const determinedArchetype = mapArchetype(emotionalSnapshot);

  try {
    await fetch('/api/archetype-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, archetype: determinedArchetype })
    });
    console.log('Sacred Archetype saved:', determinedArchetype);
  } catch (error) {
    console.error('Failed to save sacred archetype:', error.message);
  }
}
