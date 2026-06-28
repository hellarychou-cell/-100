export function getReadableCurrentDay(savedDay: number | null | undefined) {
  if (!Number.isInteger(savedDay) || !savedDay || savedDay < 1) return 1;
  return Math.min(savedDay, 100);
}

export type ProgressSnapshot = {
  completedDays: number[];
  currentDay: number;
  journeyStartDate?: string | null;
  journeyStartDay?: number | null;
};

export function getChinaDateString(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(now);
}

export function getCalendarCurrentDay({
  journeyStartDate,
  journeyStartDay,
  savedDay,
  todayDate = getChinaDateString(),
}: {
  journeyStartDate?: string | null;
  journeyStartDay?: number | null;
  savedDay: number | null | undefined;
  todayDate?: string;
}) {
  const startDay = getReadableCurrentDay(journeyStartDay);
  if (!journeyStartDate || !isDateOnly(journeyStartDate) || !isDateOnly(todayDate)) {
    return getReadableCurrentDay(savedDay);
  }

  const elapsedDays = Math.max(0, daysBetweenDateOnly(journeyStartDate, todayDate));
  return getReadableCurrentDay(startDay + elapsedDays);
}

export function markDayCompleted(
  progress: ProgressSnapshot,
  day: number,
) {
  const completedDays = Array.from(new Set([...progress.completedDays, day])).sort((a, b) => a - b);
  const next: ProgressSnapshot = {
    completedDays,
    currentDay: getReadableCurrentDay(progress.currentDay),
  };
  if (progress.journeyStartDate) next.journeyStartDate = progress.journeyStartDate;
  if (progress.journeyStartDay) next.journeyStartDay = progress.journeyStartDay;
  return next;
}

export function startProgressFromDay(day: number, startDate = getChinaDateString()) {
  const currentDay = getReadableCurrentDay(day);
  return {
    completedDays: [] as number[],
    currentDay,
    journeyStartDate: startDate,
    journeyStartDay: currentDay,
  };
}

export function getCollapsedProgressDays<T extends { day: number }>(days: T[], currentDay: number) {
  const readableDay = getReadableCurrentDay(currentDay);
  if (readableDay <= 8) return days.filter((item) => item.day >= 1 && item.day <= 8);

  const weekStart = Math.floor((readableDay - 1) / 7) * 7 + 1;
  const weekEnd = Math.min(weekStart + 6, 100);
  return days.filter((item) => item.day >= weekStart && item.day <= weekEnd);
}

export function requiresMembershipForDay(day: number) {
  return getReadableCurrentDay(day) > 1;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysBetweenDateOnly(startDate: string, endDate: string) {
  const start = parseDateOnlyUtc(startDate);
  const end = parseDateOnlyUtc(endDate);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function parseDateOnlyUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
