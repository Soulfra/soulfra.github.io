const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Tracks a referral if ?ref=XYZ is present in the URL.
 * You can call this at the start of a ghost loop or page load.
 * @param {string} referrer_id - ID of the user who shared the link
 * @param {string} new_user_id - ID of the current user (starting reflection)
 */
async function trackReferral(referrer_id, new_user_id) {
  if (!referrer_id || !new_user_id || referrer_id === new_user_id) return;

  try {
    // Insert referral
    await supabase.from("referral_logs").insert({
      referrer_id,
      referred_id: new_user_id,
      timestamp: new Date().toISOString()
    });

    // Optionally reward referrer
    await supabase.rpc("increment_tokens", {
      user_id_param: referrer_id,
      amount: 25  // reward amount (can be adjusted)
    });

    console.log("✅ Referral tracked and rewarded:", referrer_id);
  } catch (error) {
    console.error("❌ Referral tracking error:", error.message);
  }
}

module.exports = { trackReferral };