const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Config
const DECAY_THRESHOLD_DAYS = 7

const decayConfig = {
  brave: 0.07,
  reflective: 0.05,
  playful: 0.03,
  grateful: 0.01,
  chaotic: 0.09,
  default: 0.05
}

function applyDecay(traits) {
  const decayed = {}
  for (const trait in traits) {
    const rate = decayConfig[trait] || decayConfig.default
    const newVal = Math.max(traits[trait] - rate, 0)
    decayed[trait] = parseFloat(newVal.toFixed(4))
  }
  return decayed
}

async function runDecay() {
  const { data, error } = await supabase
    .from("soulprints")
    .select("user_id, traits, updated_at")

  if (error) {
    console.error("❌ Failed to fetch soulprints:", error.message)
    return
  }

  const now = new Date()

  for (const record of data) {
    const lastUpdate = new Date(record.updated_at)
    const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24))

    if (diffDays >= DECAY_THRESHOLD_DAYS) {
      const decayedTraits = applyDecay(record.traits)

      // Calculate average drop
      const valuesBefore = Object.values(record.traits)
      const valuesAfter = Object.values(decayedTraits)
      const avgBefore = valuesBefore.reduce((a, b) => a + b, 0) / valuesBefore.length
      const avgAfter = valuesAfter.reduce((a, b) => a + b, 0) / valuesAfter.length
      const decayFlag = avgAfter < avgBefore * 0.85

      const { error: updateError } = await supabase
        .from("soulprints")
        .update({
          traits: decayedTraits,
          updated_at: now.toISOString(),
          decay_flag: decayFlag
        })
        .eq("user_id", record.user_id)

      if (updateError) {
        console.error(`❌ Failed to decay ${record.user_id}:`, updateError.message)
      } else {
        console.log(`⏳ Decayed ${record.user_id} after ${diffDays} days of inactivity`)

        await supabase.from("decay_logs").insert([
          {
            user_id: record.user_id,
            traits_before: record.traits,
            traits_after: decayedTraits,
            decay_amount: "dynamic",
            decay_reason: `Inactive for ${diffDays} days`,
            timestamp: now.toISOString()
          }
        ])
      }
    }
  }
}

runDecay()