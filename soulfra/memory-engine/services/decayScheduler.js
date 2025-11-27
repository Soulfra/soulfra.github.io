// Temporary in-memory soulprint store (to simulate decay)
const soulprintStore = {}; // Normally imported or shared memory

async function decayScheduler() {
    console.log('Running decay sweep across soulprints...');

    for (const userId in soulprintStore) {
        for (const trait in soulprintStore[userId]) {
            soulprintStore[userId][trait] = Math.max((soulprintStore[userId][trait] || 0) - 1, 0);
        }
    }

    console.log('Decay completed.');
    return { status: 'decay complete' };
}

export default decayScheduler;
