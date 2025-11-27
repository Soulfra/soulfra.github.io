import { useSoulBalance } from "@sacred-components/useSoulBalance";

export function usePromptReward() {
  const { addTokens } = useSoulBalance();

  const rewardForPrompt = () => {
    addTokens(10); // Grant 10 bonus SoulTokens for responding to a prompt
  };

  return { rewardForPrompt };
}
