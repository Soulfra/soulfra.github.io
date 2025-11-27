const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Rewards top N users on the referral leaderboard with token bonuses.
 * Should be scheduled daily/weekly.
 * @param {number} limit - Top N to reward
 */
async function rewardTopReferrers(limit = 5) {
  const { data, error } = await supabase
    .from("top_referrers")
    .select("*")
    .limit(limit);

  if (error) {
    console.error("❌ Failed to fetch top referrers:", error.message);
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const { referrer_id, count } = data[i];
    const bonus = 50 - i * 10; // 1st = 50, 2nd = 40, etc.

    await supabase.rpc("increment_tokens", {
      user_id_param: referrer_id,
      amount: bonus
    });

    console.log(`🎁 Rewarded ${referrer_id} with ${bonus} tokens for referral rank #${i + 1}`);
  }
}

module.exports = { rewardTopReferrers };