import { useState, type FormEvent } from "react";
import { Phone, Search, Users } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "@api/apiClient";
import { staffApi } from "@api/clients";
import type { Envelope, PageMeta } from "@api/envelope";
import { PAYMENT_STATUS, type Bill } from "@modules/billing/billingApi";
import { BOOKING_STATUS } from "@modules/bookings/bookingsApi";
import type { QueueStatus } from "@modules/queue/queueApi";
import { DataTable, type Column } from "@modules/reports/ReportParts";
import { formatDate, formatDateTime, formatPaise } from "@shared/format";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  StatusChip,
} from "@shared/ui";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  since: string;
  bookings: number;
  visits: number;
  lastVisit: string | null;
  spentPaise: number;
}
interface HistoryRow extends Bill {
  id: string;
  token: string;
  businessDate: string;
  status: QueueStatus;
  services: string[];
  assignedWorkerName: string | null;
  totalPaise: number;
}

function History({ customer }: { customer: CustomerRow }) {
  const history = useQuery({
    queryKey: ["customers", customer.id, "bookings"],
    queryFn: async () =>
      (
        await staffApi.get<Envelope<{ items: HistoryRow[] }>>(
          `/customers/${customer.id}/bookings`,
        )
      ).data.data.items,
  });
  if (history.isPending) return <Skeleton className="h-32 w-full" />;
  if (history.isError)
    return (
      <ErrorState
        title="Could not load the history"
        message={apiErrorMessage(history.error)}
        onRetry={() => void history.refetch()}
        retrying={history.isFetching}
      />
    );
  return (
    <ul className="max-h-96 divide-y divide-line overflow-y-auto">
      {history.data.map((b) => (
        <li key={b.id} className="space-y-1 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-ink">
              {formatDate(b.businessDate)} ·{" "}
              <span className="font-mono">{b.token}</span>
            </span>
            <span className="flex flex-wrap gap-1.5">
              <StatusChip tone={BOOKING_STATUS[b.status].tone}>
                {BOOKING_STATUS[b.status].text}
              </StatusChip>
              {b.status === "completed" && (
                <StatusChip tone={PAYMENT_STATUS[b.paymentStatus].tone}>
                  {PAYMENT_STATUS[b.paymentStatus].text}
                </StatusChip>
              )}
            </span>
          </div>
          <p className="text-sm text-ink-subtle">
            {b.services.join(", ")} · {formatPaise(b.totalPaise)}
            {b.assignedWorkerName ? ` · with ${b.assignedWorkerName}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** /app/customers — everyone who has booked, with visits and spend. */
export default function CustomersScreen() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<CustomerRow | null>(null);
  const list = useQuery({
    queryKey: ["customers", { search, page }],
    queryFn: async () => {
      const res = await staffApi.get<Envelope<CustomerRow[]>>("/customers", {
        params: { page, limit: 20, ...(search ? { search } : {}) },
      });
      return { items: res.data.data, meta: res.data.meta as PageMeta };
    },
    placeholderData: keepPreviousData,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(draft.trim());
  };

  const columns: Column<CustomerRow>[] = [
    {
      header: "Customer",
      cell: (c) => (
        <button
          type="button"
          onClick={() => setViewing(c)}
          className="text-left font-medium text-brand-700 hover:underline"
        >
          {c.name || "(no name)"}
        </button>
      ),
    },
    {
      header: "Mobile",
      cell: (c) => (
        <a
          href={`tel:${c.phone}`}
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          <Phone className="size-3.5" aria-hidden="true" />
          {c.phone}
        </a>
      ),
    },
    { header: "Bookings", numeric: true, cell: (c) => c.bookings },
    { header: "Completed visits", numeric: true, cell: (c) => c.visits },
    {
      header: "Last visit",
      cell: (c) => (c.lastVisit ? formatDate(c.lastVisit) : "—"),
    },
    {
      header: "Spent",
      numeric: true,
      cell: (c) => formatPaise(c.spentPaise),
    },
    { header: "Customer since", cell: (c) => formatDateTime(c.since) },
  ];

  let body;
  if (list.isPending) body = <Skeleton className="h-64 w-full" />;
  else if (list.isError)
    body = (
      <ErrorState
        title="Could not load customers"
        message={apiErrorMessage(list.error)}
        onRetry={() => void list.refetch()}
        retrying={list.isFetching}
      />
    );
  else if (list.data.items.length === 0)
    body = (
      <EmptyState
        icon={Users}
        title={search ? "No customer matches that search" : "No customers yet"}
        message={
          search
            ? "Try part of the name or the mobile number."
            : "A customer is added the first time they book from your QR code."
        }
      />
    );
  else
    body = (
      <>
        <DataTable
          caption="Customers"
          columns={columns}
          rows={list.data.items}
          rowKey={(c) => c.id}
        />
        <Pagination {...list.data.meta} onPage={setPage} />
      </>
    );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Customer management"
        description="Everyone who has booked at your salon. Select a name to see their bookings."
      />
      <Card
        title={
          list.data
            ? `${list.data.meta.total} customer${list.data.meta.total === 1 ? "" : "s"}`
            : "Customers"
        }
        actions={
          <form onSubmit={submit} role="search" className="flex gap-2">
            <label className="sr-only" htmlFor="customer-search">
              Search by name or mobile number
            </label>
            <input
              id="customer-search"
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Name or mobile number"
              className="h-9 w-56 rounded-lg border border-line bg-surface px-3"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              icon={<Search className="size-4" aria-hidden="true" />}
            >
              Search
            </Button>
          </form>
        }
      >
        {body}
      </Card>
      <Dialog
        open={viewing !== null}
        title={viewing?.name || "Customer"}
        description={viewing?.phone}
        onClose={() => setViewing(null)}
      >
        {viewing && <History key={viewing.id} customer={viewing} />}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setViewing(null)}>
            Close
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
