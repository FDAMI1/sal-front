import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import {
  rangeParams,
  rangeReady,
  type RangeQuery,
} from "@modules/dashboard/api/dashboardApi";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
export const methodLabel = (m: string | null) =>
  PAYMENT_METHODS.find((p) => p.value === m)?.label ?? "—";

export type PaymentStatus = "unpaid" | "paid" | "part_refunded" | "refunded";

/** What was billed and collected for a visit (backend billOf). */
export interface Bill {
  paymentStatus: PaymentStatus;
  discountPaise: number;
  paidPaise: number;
  refundedPaise: number;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
}

export const PAYMENT_STATUS: Record<
  PaymentStatus,
  { text: string; tone: "success" | "warning" | "neutral" }
> = {
  unpaid: { text: "Unpaid", tone: "warning" },
  paid: { text: "Paid", tone: "success" },
  part_refunded: { text: "Part refunded", tone: "neutral" },
  refunded: { text: "Refunded", tone: "neutral" },
};

/** Every list a payment or refund changes. */
const MONEY_KEYS = [
  "queue",
  "bookings",
  "dashboard",
  "payments",
  "customers",
] as const;

function useMoneyMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // Also after a refusal: someone else may have taken the payment.
    onSettled: () =>
      Promise.all(
        MONEY_KEYS.map((k) => qc.invalidateQueries({ queryKey: [k] })),
      ),
  });
}

export const usePay = () =>
  useMoneyMutation(
    (v: { id: string; method: PaymentMethod; discountPaise: number }) =>
      staffApi.post(`/queue/${v.id}/pay`, {
        method: v.method,
        discountPaise: v.discountPaise,
      }),
  );

export const useRefund = () =>
  useMoneyMutation((v: { id: string; amountPaise: number; reason: string }) =>
    staffApi.post(`/queue/${v.id}/refund`, {
      amountPaise: v.amountPaise,
      reason: v.reason,
    }),
  );

export interface LedgerRow {
  id: string;
  bookingId: string;
  kind: "payment" | "refund";
  method: PaymentMethod;
  token: string;
  customerName: string;
  grossPaise: number;
  discountPaise: number;
  amountPaise: number;
  reason: string;
  at: string;
  recordedByName: string;
}

export const usePayments = (q: RangeQuery) =>
  useQuery({
    queryKey: ["payments", q],
    queryFn: async () =>
      (
        await staffApi.get<Envelope<{ items: LedgerRow[] }>>("/payments", {
          params: rangeParams(q),
        })
      ).data.data.items,
    enabled: rangeReady(q),
    placeholderData: keepPreviousData,
  });

export const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "supplies", label: "Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];
export const categoryLabel = (c: string) =>
  EXPENSE_CATEGORIES.find((e) => e.value === c)?.label ?? c;

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amountPaise: number;
  note: string;
  createdByName: string;
}
export type ExpenseInput = Omit<Expense, "id" | "createdByName">;

export const useExpenses = (q: RangeQuery) =>
  useQuery({
    queryKey: ["expenses", q],
    queryFn: async () =>
      (
        await staffApi.get<Envelope<{ totalPaise: number; items: Expense[] }>>(
          "/expenses",
          { params: rangeParams(q) },
        )
      ).data.data,
    enabled: rangeReady(q),
    placeholderData: keepPreviousData,
  });

export function useExpenseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      v:
        | { op: "save"; id?: string; input: ExpenseInput }
        | { op: "delete"; id: string },
    ) =>
      v.op === "delete"
        ? staffApi.delete(`/expenses/${v.id}`)
        : v.id
          ? staffApi.put(`/expenses/${v.id}`, v.input)
          : staffApi.post("/expenses", v.input),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["expenses"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });
}
