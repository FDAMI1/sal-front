import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";

export const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom" },
] as const;

export type RangePreset = (typeof RANGE_OPTIONS)[number]["value"];

export interface RangeQuery {
  range: RangePreset;
  from?: string;
  to?: string;
}

/** Query-string form: a custom range sends its dates, a preset only its name. */
export const rangeParams = (q: RangeQuery) =>
  q.range === "custom" ? q : { range: q.range };
/** A custom range waits for both dates. */
export const rangeReady = (q: RangeQuery) =>
  q.range !== "custom" || Boolean(q.from && q.to);

export interface Kpis {
  /** Value of completed visits less discounts, paid or not. */
  totalRevenuePaise: number;
  grossPaise: number;
  discountPaise: number;
  /** Money received less refunds. */
  collectedPaise: number;
  taxPaise: number;
  refundPaise: number;
  completedVisits: number;
  completedServices: number;
  customersServed: number;
  avgRevenuePerCustomerPaise: number;
  expensesPaise: number;
  operatingProfitPaise: number;
  totalCustomers: number;
  activeStaff: number;
}

export interface TrendPoint {
  /** One salon-local day. */
  date: string;
  revenuePaise: number;
  collectedPaise: number;
  expensesPaise: number;
  previousRevenuePaise: number;
}
export interface Trend {
  previous: { from: string; to: string };
  previousRevenuePaise: number;
  points: TrendPoint[];
}

export interface ServiceRow {
  serviceId: string;
  name: string;
  bookings: number;
  completed: number;
  revenuePaise: number;
}
export interface StaffRow {
  workerId: string | null;
  name: string;
  customers: number;
  visits: number;
  completedServices: number;
  revenuePaise: number;
  avgServiceValuePaise: number;
}
export interface PaymentRow {
  method: "cash" | "upi" | "card" | "online" | "other";
  payments: number;
  amountPaise: number;
}
export interface CustomerStats {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  cancelledBookings: number;
  servicesOffered: number;
}
export interface DayRow {
  date: string;
  visits: number;
  services: number;
  grossPaise: number;
  discountPaise: number;
  revenuePaise: number;
  collectedPaise: number;
  refundPaise: number;
  netCollectedPaise: number;
  expensesPaise: number;
}

interface Sections {
  kpis: Kpis;
  trend: Trend;
  services: ServiceRow[];
  staff: StaffRow[];
  payments: PaymentRow[];
  customers: CustomerStats;
  daily: DayRow[];
}
interface Frame {
  salonName: string;
  timezone: string;
  range: { preset: RangePreset; from: string; to: string };
}
/** GET /dashboard: everything on the dashboard page (not the daily table). */
export type DashboardSummary = Frame & Omit<Sections, "daily">;

export const useDashboard = (q: RangeQuery) =>
  useQuery({
    queryKey: ["dashboard", "all", q],
    queryFn: async () =>
      (
        await staffApi.get<Envelope<DashboardSummary>>("/dashboard", {
          params: rangeParams(q),
        })
      ).data.data,
    enabled: rangeReady(q),
    placeholderData: keepPreviousData,
  });

/** GET /dashboard/:section: one part, for the report pages. */
export const useDashboardSection = <K extends keyof Sections>(
  section: K,
  q: RangeQuery,
) =>
  useQuery({
    queryKey: ["dashboard", section, q],
    queryFn: async () =>
      (
        await staffApi.get<Envelope<Frame & Pick<Sections, K>>>(
          `/dashboard/${section}`,
          { params: rangeParams(q) },
        )
      ).data.data,
    enabled: rangeReady(q),
    placeholderData: keepPreviousData,
  });

/** Rebuilds the stored daily summaries from the original records. */
export function useRecalculate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => staffApi.post("/dashboard/recalculate"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}
