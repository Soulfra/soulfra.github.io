const express = require("express");
const router = express.Router();
const { saveOrSinkLoop } = require("../utils/runtime/saveOrSinkLoop");

router.post("/", async (req, res) => {
  try {
    const { user_id, transcript } = req.body;

    if (!user_id || !transcript) {
      return res.status(400).json({ error: "Missing user_id or transcript" });
    }

    const result = await saveOrSinkLoop({ user_id, transcript });

    if (!result?.traits || !result?.context) {
      return res.status(500).json({
        error: "Invalid loop output. Missing traits or context.",
        details: {
          hasTraits: !!result?.traits,
          hasContext: !!result?.context
        },
        result
      });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ /saveorsink-reflection route error:", err);
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

module.exports = router;