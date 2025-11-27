const { runAgent } = require("./runAgent");
const { generateTokensFromTraits } = require("../generateTokensFromTraits");
const { createClient } = require("@supabase/supabase-js");
const { rollToneTier } = require("../utils/nuclearToneRoller");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function LORBGReflectionLoop({ user_id, transcript, prompt_used }) {
  if (!user_id || !transcript) throw new Error("Missing user_id or transcript");

  const scored = await runAgent("voiceToTraitsAgent", { user_id, transcript });
  const traits = scored?.traits || { reflective: 0.9 };

  const tone_tier = rollToneTier();
  const god = await runAgent("voiceOfGodAgent", { user_id, transcript, traits, tone_tier });
  const divineText = typeof god === "string"
    ? god
    : god?.context?.output || god?.response || "The voice was silent.";

  const { data: soulData } = await supabase
    .from("soulprints")
    .select("traits")
    .eq("user_id", user_id)
    .single();

  const oldTraits = soulData?.traits || {};
  const updatedTraits = { ...oldTraits };
  for (const trait in traits) {
    updatedTraits[trait] = Math.max(oldTraits[trait] || 0, traits[trait]);
  }

  await supabase
    .from("soulprints")
    .upsert({
      user_id,
      traits: updatedTraits,
      updated_at: new Date().toISOString(),
      decay_flag: false
    });

  const reward = generateTokensFromTraits(oldTraits, updatedTraits);
  await supabase.rpc("increment_tokens", {
    user_id_param: user_id,
    amount: reward.tokens_awarded
  });

  await runAgent("promptScorerAgent", {
    prompt_used: prompt_used || "unknown",
    traits,
    divine_tier: tone_tier,
    tokens_awarded: reward.tokens_awarded
  });

  const result = {
    agentName: "LORBGReflectionLoop",
    userId: user_id,
    traits,
    context: {
      input: transcript,
      prompt_used: prompt_used || "unknown",
      output: divineText
    },
    tone_tier,
    tokens_awarded: reward.tokens_awarded,
    breakdown: reward.breakdown,
    timestamp: new Date().toISOString()
  };

  console.log("📤 LORBG result being sent to frontend:", result);
  return result;
}

module.exports = { LORBGReflectionLoop };