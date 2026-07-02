export function getReadableCurrentDay(savedDay: number | null | undefined) {
  if (!Number.isInteger(savedDay) || !savedDay || savedDay < 1) return 1;
  return Math.min(savedDay, 100);
}

export type ProgressSnapshot = {
  completedDays: number[];
  currentDay: number;
  journeyStartDate?: string | null;
  journeyStartDay?: number | null;
  nextUnlockDate?: string | null;
};

export function getChinaDateString(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(now);
}

export function getClickDrivenCurrentDay({
  completedDays = [],
  journeyStartDate,
  journeyStartDay,
  nextUnlockDate,
  savedDay,
  todayDate = getChinaDateString(),
}: {
  completedDays?: number[];
  journeyStartDate?: string | null;
  journeyStartDay?: number | null;
  nextUnlockDate?: string | null;
  savedDay: number | null | undefined;
  todayDate?: string;
}) {
  void journeyStartDate;
  const saved = getReadableCurrentDay(savedDay);
  const startDay = getReadableCurrentDay(journeyStartDay ?? saved);
  const completed = new Set(completedDays.map(getReadableCurrentDay));
  const firstUnfinishedBeforeSaved = findFirstUnfinishedDay(startDay, saved, completed);
  const current = firstUnfinishedBeforeSaved ?? saved;

  if (!completed.has(current)) return current;

  if (nextUnlockDate && isDateOnly(nextUnlockDate) && isDateOnly(todayDate)) {
    if (todayDate < nextUnlockDate) return current;
    return findFirstUnfinishedDay(current + 1, 100, completed) ?? 100;
  }

  return findFirstUnfinishedDay(current + 1, 100, completed) ?? current;
}

export function getCalendarCurrentDay(args: Parameters<typeof getClickDrivenCurrentDay>[0]) {
  return getClickDrivenCurrentDay(args);
}

export function markDayCompleted(
  progress: ProgressSnapshot,
  day: number,
  todayDate = getChinaDateString(),
) {
  const completedDays = Array.from(new Set([...progress.completedDays, day])).sort((a, b) => a - b);
  const next: ProgressSnapshot = {
    completedDays,
    currentDay: getReadableCurrentDay(progress.currentDay),
    nextUnlockDate: getNextUnlockDate(todayDate),
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
    nextUnlockDate: null,
  };
}

export function getNextUnlockDate(todayDate = getChinaDateString()) {
  if (!isDateOnly(todayDate)) return getChinaDateString();
  const next = parseDateOnlyUtc(todayDate);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export function isDayUnlocked({
  completedDays,
  currentDay,
  day,
}: {
  completedDays: number[];
  currentDay: number;
  day: number;
}) {
  return completedDays.includes(day) || day <= currentDay;
}

export function getCollapsedProgressDays<T extends { day: number }>(days: T[], currentDay: number) {
  void currentDay;
  return days.filter((item) => item.day >= 1 && item.day <= 7);
}

export function requiresMembershipForDay(day: number, freeThroughDay = 1) {
  return getReadableCurrentDay(day) > getReadableCurrentDay(freeThroughDay);
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateOnlyUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function findFirstUnfinishedDay(startDay: number, endDay: number, completed: Set<number>) {
  for (let day = getReadableCurrentDay(startDay); day <= getReadableCurrentDay(endDay); day += 1) {
    if (!completed.has(day)) return day;
  }
  return null;
}
