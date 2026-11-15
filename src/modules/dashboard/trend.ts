import type { TrendPoint } from "@modules/dashboard/api/dashboardApi";

export const GRANULARITIES = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
] as const;
export type Granularity = (typeof GRANULARITIES)[number]["value"];

/** Days read best up to a month, weeks up to half a year, months beyond. */
export const defaultGranularity = (days: number): Granularity =>
  days <= 31 ? "day" : days <= 182 ? "week" : "month";

/** The first day of the week (Monday) or month a date falls in. */
function bucketStart(date: string, granularity: Granularity): string {
  if (granularity === "day") return date;
  if (granularity === "month") return `${date.slice(0, 7)}-01`;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Adds the days up into weeks or months, keeping their order. */
export function bucketTrend(
  days: TrendPoint[],
  granularity: Granularity,
): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  for (const day of days) {
    const key = bucketStart(day.date, granularity);
    const b = buckets.get(key);
    if (!b) {
      buckets.set(key, { ...day, date: key });
      continue;
    }
    b.revenuePaise += day.revenuePaise;
    b.collectedPaise += day.collectedPaise;
    b.expensesPaise += day.expensesPaise;
    b.previousRevenuePaise += day.previousRevenuePaise;
  }
  return [...buckets.values()];
}
