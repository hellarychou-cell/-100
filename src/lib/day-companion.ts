import { getScheduleWomen, type ScheduleWoman } from "./schedule.ts";
import { getSisterProfile } from "./sister-profiles.ts";

export type DayCompanion = ScheduleWoman & {
  label: string;
  symbol: string;
};

export function getDayCompanion(day: number): DayCompanion | null {
  const woman = getScheduleWomen().find((item) => item.day === day);
  if (!woman) return null;
  const profile = getSisterProfile(woman.name);
  const symbol = profile?.symbol ?? "🌿";

  return {
    ...woman,
    symbol,
    label: `${symbol} ${woman.name}`,
  };
}
