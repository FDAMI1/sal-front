import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, Search, Store } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { CreateSalonDialog } from "@modules/admin/components/CreateSalonDialog";
import { SalonStatusChip } from "@modules/admin/components/SalonStatusChip";
import { useAdminSalons } from "@modules/admin/hooks/useAdminSalons";
import type { SalonStatus } from "@modules/admin/types";
import { cn } from "@shared/cn";
import { formatDateTime } from "@shared/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
} from "@shared/ui";

const TABS: { status?: SalonStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "suspended", label: "Suspended" },
  { status: "rejected", label: "Rejected" },
  { label: "All" },
];

const STATUSES = new Set<string>([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

/** All salons on the platform. Opens on "Pending": the queue needing action. */
export default function SalonsScreen() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("status");
  const status =
    raw === "all"
      ? undefined
      : raw && STATUSES.has(raw)
        ? (raw as SalonStatus)
        : "pending";
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const salons = useAdminSalons({ status, search: query, page });

  const pick = (s?: SalonStatus) => {
    setParams({ status: s ?? "all" });
    setPage(1);
  };
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
    setPage(1);
  };

  const counts = salons.data?.meta.counts;

  let body;
  if (salons.isPending) {
    body = (
      <div aria-busy="true" aria-label="Loading salons" className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  } else if (salons.isError) {
    body = (
      <ErrorState
        title="Could not load salons"
        message={apiErrorMessage(salons.error)}
        onRetry={() => void salons.refetch()}
        retrying={salons.isFetching}
      />
    );
  } else if (salons.data.items.length === 0) {
    body = (
      <EmptyState
        icon={Store}
        title={
          query
            ? "No salons match"
            : status === "pending"
              ? "Nothing waiting for approval"
              : "No salons here"
        }
        message={query ? "Try another name, email or phone." : undefined}
      />
    );
  } else {
    body = (
      <>
        <ul className="divide-y divide-line">
          {salons.data.items.map((s) => (
            <li key={s.id}>
              <Link
                to={`/admin/salons/${s.id}`}
                className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-3 hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-xs break-all text-ink-subtle">
                    {[
                      s.city,
                      s.contactEmail,
                      s.createdAt
                        ? `registered ${formatDateTime(s.createdAt)}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <SalonStatusChip status={s.status} />
              </Link>
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          pages={salons.data.meta.pages}
          total={salons.data.meta.total}
          onPage={setPage}
        />
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Salons"
        description="Approve new salons and manage existing ones."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setCreating(true)}
          >
            Create salon
          </Button>
        }
      />
      {creating && (
        <CreateSalonDialog open onClose={() => setCreating(false)} />
      )}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Salon status"
            className="flex flex-wrap gap-1"
          >
            {TABS.map((t) => {
              const active = t.status === status;
              const count = t.status && counts ? counts[t.status] : undefined;
              return (
                <button
                  key={t.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => pick(t.status)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-medium",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-muted hover:bg-canvas",
                  )}
                >
                  {t.label}
                  {count !== undefined && (
                    <span className="ml-1.5 text-xs">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <form onSubmit={submitSearch} role="search" className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or phone"
              aria-label="Search salons"
              className="h-9 w-56 rounded-lg border border-line bg-surface px-3"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              icon={<Search className="size-4" aria-hidden="true" />}
            >
              Search
            </Button>
          </form>
        </div>
        {body}
      </Card>
    </div>
  );
}
