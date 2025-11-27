import { supabase } from "@sacred-components/supabaseClient";

export async function saveRitualToSupabase(arweaveId, promptId) {
  const { data, error } = await supabase.from('rituals').insert([{
    arweave_tx_id: arweaveId,
    prompt_id: promptId,
    timestamp: new Date().toISOString(),
    completed: true
  }]);

  if (error) {
    console.error("Error saving ritual:", error);
  } else {
    console.log("Ritual saved:", data);
  }
}
