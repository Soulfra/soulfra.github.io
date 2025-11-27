import { useSoulBalance } from "@sacred-components/useSoulBalance";
import { useRitualTimer } from "@sacred-components/useRitualTimer";

export function useRitualReward() {
  const { balance, addTokens } = useSoulBalance();
  const { updateLastRitual, minutesSinceLast } = useRitualTimer();

  const rewardIfEligible = () => {
    if (minutesSinceLast() >= 60) {
      addTokens(25);
    }
    updateLastRitual();
  };

  return { rewardIfEligible, balance };
}
