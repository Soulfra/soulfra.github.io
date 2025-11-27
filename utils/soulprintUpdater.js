const { createClient } = require("@supabase/supabase-js")
const { generateTokensFromTraits } = require("./generateTokensFromTraits")
const db = require("../config/postgresClient")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Update soulprint traits for a user, and reward tokens if growth occurs
 */
async function updateSoulprint(userId, newTraits) {
  try {
    // 1. Load current soulprint
    const { data: existing, error } = await supabase
      .from("soulprints")
      .select("traits")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("❌ Error loading soulprint:", error)
      return null
    }

    const currentTraits = existing?.traits || {}

    // 2. Merge traits
    const updatedTraits = { ...currentTraits }
    for (const trait in newTraits) {
      const current = currentTraits[trait] || 0
      const incoming = newTraits[trait]
      updatedTraits[trait] = parseFloat(((current + incoming) / 2).toFixed(4))
    }

    // 3. Update soulprint in Supabase
    const { error: writeError } = await supabase
      .from("soulprints")
      .upsert({
        user_id: userId,
        traits: updatedTraits,
        updated_at: new Date().toISOString()
      })

    if (writeError) {
      console.error("❌ Soulprint update failed:", writeError)
      return null
    }

    // 4. Calculate token reward
    const reward = generateTokensFromTraits(currentTraits, updatedTraits)
    const tokenAmount = reward.tokens_awarded

    // 5. Update tokens_earned in Postgres
    await db.query(
      "UPDATE users SET tokens_earned = COALESCE(tokens_earned, 0) + $1 WHERE user_id = $2",
      [tokenAmount, userId]
    )

    return {
      updatedTraits,
      tokensAwarded: tokenAmount,
      rewardBreakdown: reward.breakdown
    }
  } catch (err) {
    console.error("🔥 updateSoulprint error:", err.message)
    return null
  }
}

module.exports = { updateSoulprint }