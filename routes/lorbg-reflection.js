const express = require("express")
const router = express.Router()
const { LORBGReflectionLoop } = require("../utils/runtime/LORBGReflectionLoop")
const { trackReferral } = require("../utils/referralTracker") // <-- new

router.post("/", async (req, res) => {
  try {
    const { user_id, transcript } = req.body
    const referrer_id = req.query.ref

    if (!user_id || !transcript) {
      return res.status(400).json({ error: "Missing user_id or transcript" })
    }

    // ✅ Track referral if present
    if (referrer_id) {
      await trackReferral(referrer_id, user_id)
    }

    const result = await LORBGReflectionLoop({ user_id, transcript })

    console.log("📤 LORBG result being sent to frontend:", result)

    // ✅ Validate that required fields exist
    if (!result?.traits || !result?.context) {
      return res.status(500).json({
        error: "Invalid loop output. Missing traits or context.",
        details: {
          hasTraits: !!result?.traits,
          hasContext: !!result?.context
        },
        result
      })
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error("❌ /lorbg-reflection route error:", err)
    return res.status(500).json({ error: "Internal Server Error", detail: err.message })
  }
})

module.exports = router