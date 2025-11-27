import { badgeBank } from "@sacred-components/badgeBank";

export function getUnlockedBadges(streak) {
  return badgeBank.filter(badge => badge.condition(streak));
}
