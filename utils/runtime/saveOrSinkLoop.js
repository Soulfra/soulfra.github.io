const { runAgent } = require("./runAgent");
const { generateTokensFromTraits } = require("../generateTokensFromTraits");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * SaveOrSink main ritual loop.
 * User submits a voice note, receives divine verdict.
 */
async function saveOrSinkLoop({ user_id, transcript, prompt_used }) {
  if (!user_id || !transcript) throw new Error("Missing user_id or transcript");

  // Run trait extraction
  const traits = (await runAgent("voiceToTraitsAgent", { user_id, transcript }))?.traits || {};

  // Determine verdict: save or sink
  const saveScore = traits.reflective + traits.sentimental;
  const verdict = saveScore >= 1.4 ? "save" : "sink";

  const divineReply = verdict === "save"
    ? "🕊️ This moment shall be saved. Let it echo."
    : "🌊 Let this memory sink beneath the tide. It is released.";

  // Store log
  await supabase.from("sink_logs").insert({
    user_id,
    transcript,
    verdict,
    traits,
    timestamp: new Date().toISOString()
  });

  // Reward based on trait depth
  const reward = generateTokensFromTraits({}, traits);
  await supabase.rpc("increment_tokens", {
    user_id_param: user_id,
    amount: reward.tokens_awarded
  });

  return {
    agentName: "saveOrSinkLoop",
    userId: user_id,
    traits,
    context: {
      input: transcript,
      verdict,
      output: divineReply
    },
    tokens_awarded: reward.tokens_awarded,
    breakdown: reward.breakdown,
    timestamp: new Date().toISOString()
  };
}

module.exports = { saveOrSinkLoop };