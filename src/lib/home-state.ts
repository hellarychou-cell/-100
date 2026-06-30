export type HomeUserState = "needs-assessment" | "waiting-membership" | "active-member";

import { isDayUnlocked } from "./progress.ts";

export type ProgressCardState = "completed" | "today" | "available" | "future";

export function getHomeUserState({
  hasAssessment,
  isMember,
}: {
  hasAssessment: boolean;
  isMember: boolean;
}): HomeUserState {
  if (!hasAssessment) return "needs-assessment";
  if (!isMember) return "waiting-membership";
  return "active-member";
}

export function getProgressCardState({
  day,
  currentDay,
  completedDays,
}: {
  day: number;
  currentDay: number;
  completedDays: number[];
}): ProgressCardState {
  if (completedDays.includes(day)) return "completed";
  if (day === currentDay) return "today";
  if (isDayUnlocked({ day, currentDay, completedDays })) return "available";
  return "future";
}

export function shouldShowAssessmentPrompt({
  dismissed,
  hasAssessment,
}: {
  dismissed: boolean;
  hasAssessment: boolean;
}) {
  return !hasAssessment && !dismissed;
}
