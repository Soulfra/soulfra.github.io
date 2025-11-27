const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

router.get("/", (req, res) => {
  let dropName = req.query.name;
  const mood = req.query.mood || "neutral";

  if (!dropName) {
    return res.status(400).send("❌ Missing 'name' query parameter.");
  }

  // Slugify the name: replace spaces and unsafe chars
  dropName = dropName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const cmd = `node scripts/dropAssembler.js ${dropName} ${mood}`;
  console.log(`🛠 Running: ${cmd}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Exec error:", error.message);
      return res.status(500).send("Drop creation failed.");
    }

    if (stderr && !stderr.includes("Layout score")) {
      console.warn("⚠️ STDERR:", stderr); // Likely a layout warning, not a failure
    }

    if (stdout.includes("Drop assembled")) {
      return res.status(200).send(`/drops/${dropName}/index.html`);
    } else {
      console.warn("⚠️ Unexpected drop output:\n", stdout);
      return res.status(200).send(`/drops/${dropName}/index.html`);
    }
  });
});

module.exports = router;