export function getReadableCurrentDay(savedDay: number | null | undefined) {
  if (!Number.isInteger(savedDay) || !savedDay || savedDay < 1) return 1;
  return Math.min(savedDay, 100);
}

export function markDayCompleted(
  progress: { currentDay: number; completedDays: number[] },
  day: number,
) {
  const completedDays = Array.from(new Set([...progress.completedDays, day])).sort((a, b) => a - b);
  return {
    currentDay: Math.max(progress.currentDay, day + 1),
    completedDays,
  };
}

export function startProgressFromDay(day: number) {
  return {
    currentDay: getReadableCurrentDay(day),
    completedDays: [] as number[],
  };
}
