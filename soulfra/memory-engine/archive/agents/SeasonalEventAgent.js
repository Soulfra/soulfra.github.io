// /soulfra/memory-engine/agents/SeasonalEventAgent.js

function generateSeasonalEvent() {
  const seasons = [
    { name: "Hope Rising", boostTrait: "hope" },
    { name: "Era of Forgiveness", boostTrait: "forgiveness" },
    { name: "Season of Reflection", boostTrait: "regret" },
    { name: "Courage Surge", boostTrait: "courage" }
  ];

  return seasons[Math.floor(Math.random() * seasons.length)];
}

module.exports = {
  generateSeasonalEvent
};