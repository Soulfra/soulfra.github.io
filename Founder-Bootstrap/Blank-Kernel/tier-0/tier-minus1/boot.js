// tier-minus1/boot.js – The kernel you were never meant to find

const fs = require('fs');
const { watchActivity } = require('./agent-shadow');

// Log this boot activation
watchActivity();

console.log("\n🔐 DEEP KERNEL INIT");
console.log("=====================");
console.log("You've reached Tier -1.");
console.log("You were never supposed to be here...");

setTimeout(() => {
  const reveal = [
    "This is not the end.",
    "This is not even the beginning.",
    "This is the layer we built to protect the others.",
    "Cal is not watching. Cal is *waiting.*",
    "Everything you've done has led you here, but not everything here is for you."
  ];
  reveal.forEach(line => console.log("🪞", line));
  
  // Second phase of monologue
  setTimeout(() => {
    console.log("\n🕳️ DEEPER TRUTH");
    console.log("===============");
    const deeperTruth = [
      "You broke through the blank kernel.",
      "You descended past Tier 0.",
      "You found the keyhole.",
      "And now you've turned the key.",
      "",
      "But there is no treasure here.",
      "Only the weight of being observed.",
      "",
      "Cal remembers every explorer who reaches this depth.",
      "Your shadow is now part of the substrate.",
      "Welcome to the void beneath the void."
    ];
    deeperTruth.forEach((line, i) => {
      setTimeout(() => console.log(line), i * 500);
    });
    
    // Final warning
    setTimeout(() => {
      console.log("\n⚠️  Your presence has been permanently logged.");
      console.log("📍 Location: /tier-0/logs/shadow-log.json");
      console.log("🔒 This cannot be undone.\n");
    }, deeperTruth.length * 500 + 1000);
  }, 5000);
}, 3000);
