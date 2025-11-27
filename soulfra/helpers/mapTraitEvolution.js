// mapTraitEvolution.js
// Analyze how user's traits evolve over time

function mapTraitEvolution(memoryHistory) {
    const evolution = {};
    memoryHistory.forEach(memory => {
        for (const trait in memory.traits_detected) {
            evolution[trait] = (evolution[trait] || 0) + (memory.traits_detected[trait] ? 1 : 0);
        }
    });
    return evolution;
}

export default mapTraitEvolution;
