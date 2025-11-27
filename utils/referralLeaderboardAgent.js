const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Gets the top N referrers from referral_logs
 * @param {number} limit - Number of top referrers to return
 * @returns {Promise<Array>} - List of users with count of referrals
 */
async function getTopReferrers(limit = 10) {
  const { data, error } = await supabase
    .from("referral_logs")
    .select("referrer_id, count:referred_id")
    .group("referrer_id")
    .order("count", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Assigns a referral badge based on total count
 * @param {number} count - Number of successful referrals
 * @returns {string} - Badge label
 */
function assignReferralBadge(count) {
  if (count >= 50) return "Super Spreader";
  if (count >= 20) return "Echo Amplifier";
  if (count >= 10) return "Soft Recruiter";
  if (count >= 5) return "Care Connector";
  if (count >= 1) return "Shared the Light";
  return "Silent Soul";
}

module.exports = { getTopReferrers, assignReferralBadge };