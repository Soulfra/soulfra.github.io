/**
 * Soulfra-aligned badge titles for referral counts.
 * Reflects emotional resonance and cultural rituals.
 * @param {number} count
 * @returns {string} - Label and emoji
 */
function getReferralBadge(count) {
  if (count >= 50) return "🌫️ Witnessed Widely";
  if (count >= 20) return "🔊 Echoed Loudest";
  if (count >= 10) return "🌙 Gathered Souls";
  if (count >= 5) return "🕯️ Bridged the Quiet";
  if (count >= 1) return "💌 Let It Be Seen";
  return "👁️ Still Watching";
}

module.exports = { getReferralBadge };