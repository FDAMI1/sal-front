import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type { Bill } from "@modules/billing/billingApi";

export type QueueStatus =
  "booked" | "called" | "in_service" | "completed" | "no_show" | "cancelled";

/** One card on the board (backend queue.service.ts toQueueItem). */
export interface QueueItem extends Bill {
  id: string;
  token: string;
  status: QueueStatus;
  mode: "now" | "scheduled";
  scheduledTime: string | null;
  customerName: string;
  customerPhone: string;
  gender: "male" | "female";
  services: string[];
  serviceIds: string[];
  totalPaise: number;
  totalMinutes: number;
  preferredWorkerId: string | null;
  preferredWorkerName: string | null;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
}

export interface QueueBoard {
  date: string;
  /** The signed-in worker's own id; null for an admin. */
  me: string | null;
  waiting: QueueItem[];
  called: QueueItem[];
  inService: QueueItem[];
  done: QueueItem[];
  workers: {
    id: string;
    displayName: string;
    serviceIds: string[];
    busy: boolean;
  }[];
}

export type QueueAction =
  "call" | "start" | "complete" | "no-show" | "release" | "cancel";

const boardKey = ["queue"] as const;

/** Refreshes every 5 s: the board is the salon's live screen. */
export const useQueueBoard = () =>
  useQuery({
    queryKey: boardKey,
    queryFn: async () =>
      (await staffApi.get<Envelope<QueueBoard>>("/queue")).data.data,
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
  });

export function useQueueAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: {
      id: string;
      action: QueueAction;
      workerId?: string | null;
    }) =>
      (
        await staffApi.post<Envelope<QueueItem>>(
          `/queue/${a.id}/${a.action}`,
          a.action === "call" ? { workerId: a.workerId ?? null } : {},
        )
      ).data.data,
    // Also after a refusal: someone else may have moved the card.
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: boardKey }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["bookings"] }),
      ]),
  });
}
