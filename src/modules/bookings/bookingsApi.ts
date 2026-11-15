import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type { Bill } from "@modules/billing/billingApi";
import type { QueueStatus } from "@modules/queue/queueApi";

/** One booking in a list (backend booking.routes.ts). */
export interface BookingRow extends Bill {
  id: string;
  token: string;
  businessDate: string;
  status: QueueStatus;
  mode: "now" | "scheduled";
  scheduledTime: string | null;
  customerName: string;
  customerPhone: string;
  gender: "male" | "female";
  services: string[];
  totalPaise: number;
  totalMinutes: number;
  preferredWorkerName: string | null;
  assignedWorkerName: string | null;
  trackingCode: string;
  reminderSentAt: string | null;
  createdAt: string;
}

export const BOOKING_STATUS: Record<
  QueueStatus,
  { text: string; tone: "success" | "warning" | "neutral" }
> = {
  booked: { text: "Waiting", tone: "warning" },
  called: { text: "Called", tone: "warning" },
  in_service: { text: "In service", tone: "warning" },
  completed: { text: "Completed", tone: "success" },
  no_show: { text: "No-show", tone: "neutral" },
  cancelled: { text: "Cancelled", tone: "neutral" },
};

export interface BookingQuery {
  /** First day; the salon's today when empty. */
  date?: string;
  /** Last day of a span; only `date` when empty. */
  to?: string;
  mode?: "now" | "scheduled";
}

export const useBookings = (q: BookingQuery, refetchInterval = 30_000) =>
  useQuery({
    queryKey: ["bookings", q],
    queryFn: async () =>
      (
        await staffApi.get<
          Envelope<{ date: string; to: string; items: BookingRow[] }>
        >("/bookings", {
          params: Object.fromEntries(Object.entries(q).filter(([, v]) => v)),
        })
      ).data.data,
    placeholderData: keepPreviousData,
    refetchInterval,
  });

/** Records that the salon sent this customer a reminder. */
export function useMarkReminded() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.post(`/bookings/${id}/reminder`),
    onSettled: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export interface SalonEvent {
  id: string;
  type: "booking.created" | "booking.cancelled";
  at: string;
  title: string;
  detail: string;
}

/** New bookings and customer cancellations from the last seven days. */
export const useNotifications = (enabled = true) =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (
        await staffApi.get<Envelope<{ items: SalonEvent[] }>>(
          "/bookings/notifications",
        )
      ).data.data.items,
    enabled,
    refetchInterval: 15_000,
  });

/** YYYY-MM-DD `days` after a date, without a time-zone shift. */
export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
