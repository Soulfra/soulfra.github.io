const { supabase } = require("../lib/supabaseClient");
const { v4: uuidv4 } = require("uuid");
const { scoreAgentOutput } = require("./scoreAgentOutput");
const { runWithFallback } = require("./runWithFallback");
const { scoreModelWinner } = require("./scoreModelWinner");

async function runAgentCore({ agent_id, input, user_id, timestamp }) {
  try {
    const uid = user_id || "anon";
    const run_id = uuidv4();
    const time = timestamp || new Date().toISOString();

    // 🔁 Run all models independently via fallback
    const modelOutputs = {};
    const models = ["openai", "claude", "gemini"];

    for (const model of models) {
      const { output, error } = await runWithFallback({
        input,
        agent_id,
        modelChain: [model],
      });

      if (!error && output) {
        modelOutputs[model] = output;
      }
    }

    console.log("🧪 Model Outputs:", modelOutputs);

    // 🧠 Score model outputs
    const { winner, scores, error: scoringError } = await scoreModelWinner({
      input,
      agent_id,
      modelOutputs,
    });

    console.log("🏆 Score Result:", { winner, scores, scoringError });

    const finalOutput = modelOutputs[winner] || modelOutputs["openai"];
    const traits = await scoreAgentOutput(finalOutput);

    // 🗃 Log to Supabase
    const { error: logError } = await supabase.from("agent_logs").insert([
      {
        run_id,
        user_id: uid,
        agent_name: agent_id,
        input,
        output: finalOutput,
        traits,
        timestamp: time,
        model: winner,
        scores,
      },
    ]);

    if (logError) {
      console.error("❌ Supabase insert error:", logError);
      return { error: "Failed to store agent log" };
    }

    return {
      run_id,
      agent_id,
      user_id: uid,
      input,
      output: finalOutput,
      traits,
      model: winner,
      scores,
      timestamp: time,
    };
  } catch (err) {
    console.error("🔥 runAgentCore error:", err);
    return { error: "Agent run failure" };
  }
}

module.exports = { runAgentCore };