const xpTable = Array.from({ length: 99 }, (_, i) => Math.floor((i ** 2.1) * 125 + i * 420)); 

const tokenMultipliers = {
  "1-30": 1.0,
  "31-70": 1.25,
  "71-90": 1.5,
  "91-99": 1.75
};

const luckyDropChances = {
  soulSurge: 0.01
};

module.exports = {
  xpTable,
  tokenMultipliers,
  luckyDropChances
};