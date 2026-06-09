export type HomeUserState = "needs-assessment" | "waiting-membership" | "active-member";

export type ProgressCardState = "completed" | "today" | "tomorrow" | "future";

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
  if (day === currentDay + 1) return "tomorrow";
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
