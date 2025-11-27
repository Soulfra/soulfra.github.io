const { runAgent } = require("./runAgent")
const { createClient } = require("@supabase/supabase-js")
const { generateTokensFromTraits } = require("../generateTokensFromTraits")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function restoreRitualLoop({ user_id, transcript }) {
  if (!user_id || !transcript) throw new Error("Missing user_id or transcript")

  // 1. Fetch soulprint
  const { data, error } = await supabase
    .from("soulprints")
    .select("traits, decay_flag")
    .eq("user_id", user_id)
    .single()

  if (error || !data?.decay_flag) {
    throw new Error("No decay to restore or user not found.")
  }

  const originalTraits = data.traits

  // 2. Score new reflection
  const scored = await runAgent("voiceToTraitsAgent", { user_id, transcript })
  const newTraits = scored.traits

  // 3. Compare for recovery
  const delta = await runAgent("traitDeltaAgent", {
    original: originalTraits,
    remix: newTraits
  })

  if (!delta || delta.tokens_awarded === 0) {
    return {
      restored: false,
      message: "No meaningful trait recovery detected."
    }
  }

  // ✅ Check for recent decay event (streak bonus if return within 48h)
  const lastDecay = await supabase
    .from("decay_logs")
    .select("timestamp")
    .eq("user_id", user_id)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single()

  let streakBonus = 0
  if (lastDecay.data?.timestamp) {
    const decayTime = new Date(lastDecay.data.timestamp)
    const now = new Date()
    const diffHours = Math.abs(now - decayTime) / 36e5
    if (diffHours <= 48) {
      streakBonus = 10
    }
  }

  // 4. Update soulprint
  const updatedTraits = { ...originalTraits }
  for (const trait in newTraits) {
    updatedTraits[trait] = Math.max(
      originalTraits[trait] || 0,
      newTraits[trait]
    )
  }

  await supabase
    .from("soulprints")
    .update({
      traits: updatedTraits,
      updated_at: new Date().toISOString(),
      decay_flag: false
    })
    .eq("user_id", user_id)

  // 5. Reward tokens
  const reward = generateTokensFromTraits(originalTraits, updatedTraits)
  const totalReward = reward.tokens_awarded + streakBonus

  await supabase.rpc("increment_tokens", {
    user_id_param: user_id,
    amount: totalReward
  })

  return {
    restored: true,
    updatedTraits,
    tokens_awarded: totalReward,
    bonus_awarded: streakBonus,
    breakdown: reward.breakdown
  }
}

module.exports = { restoreRitualLoop }