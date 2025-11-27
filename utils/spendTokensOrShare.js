const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function spendTokensOrShare(user_id, requiredTokens = 100) {
  if (!user_id) {
    throw new Error("Missing user_id for divine unlock check.")
  }

  const { data, error } = await supabase
    .from("soulprints")
    .select("tokens")
    .eq("user_id", user_id)
    .single()

  if (error || !data) {
    console.error("⚠️ Supabase user token lookup failed:", error)
    return { unlocked: false, reason: "lookup_failed" }
  }

  const currentTokens = data.tokens || 0

  if (currentTokens >= requiredTokens) {
    // ✅ Spend tokens
    const { error: updateError } = await supabase.rpc("decrement_tokens", {
      user_id_param: user_id,
      amount: requiredTokens
    })

    if (updateError) {
      console.error("⚠️ Token deduction failed:", updateError)
      return { unlocked: false, reason: "deduction_failed" }
    }

    return { unlocked: true, method: "tokens_spent" }
  } else {
    // ❌ Not enough tokens — must share or earn
    return { unlocked: false, reason: "insufficient_tokens" }
  }
}

module.exports = { spendTokensOrShare }