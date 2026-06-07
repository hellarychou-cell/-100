export function getReadableCurrentDay(savedDay: number | null | undefined, publishedDayLimit: number) {
  if (!Number.isInteger(savedDay) || !savedDay || savedDay < 1) return 1;
  return Math.min(savedDay, publishedDayLimit);
}
