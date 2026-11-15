import { useState } from "react";
import {
  BarChart3,
  CreditCard,
  IndianRupee,
  LineChart,
  Receipt,
  RefreshCw,
  Scissors,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import { apiErrorMessage } from "@api/apiClient";
import {
  useDashboard,
  useRecalculate,
  type DashboardSummary,
  type Kpis,
  type RangeQuery,
} from "@modules/dashboard/api/dashboardApi";
import { BarList, TrendChart } from "@modules/dashboard/components/charts";
import {
  defaultGranularity,
  GRANULARITIES,
  type Granularity,
} from "@modules/dashboard/trend";
import { RangeFilter } from "@modules/dashboard/components/RangeFilter";
import { QrCodeCard } from "@modules/qr/components/QrCodeCard";
import { cn } from "@shared/cn";
import { formatDate, formatPaise } from "@shared/format";
import { useStaffSession } from "@shared/store/sessions";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@shared/ui";

interface KpiDef {
  label: string;
  icon: LucideIcon;
  /** Soft tint per card, as in the reference layout. */
  tint: string;
  value: (k: Kpis) => string;
  /** The parts behind the number, kept separate as the business needs them. */
  detail: (k: Kpis) => string;
}

const count = (n: number) => n.toLocaleString("en-IN");

const KPIS: KpiDef[] = [
  {
    label: "Total revenue",
    icon: IndianRupee,
    tint: "bg-rose-50 text-rose-700 max-lg:bg-rose-500/15 max-lg:text-rose-300",
    value: (k) => formatPaise(k.totalRevenuePaise),
    detail: (k) =>
      `${formatPaise(k.grossPaise)} services − ${formatPaise(k.discountPaise)} discounts`,
  },
  {
    label: "Collected payments",
    icon: Wallet,
    tint: "bg-sky-50 text-sky-700 max-lg:bg-sky-500/15 max-lg:text-sky-300",
    value: (k) => formatPaise(k.collectedPaise),
    detail: (k) =>
      k.refundPaise
        ? `After ${formatPaise(k.refundPaise)} refunded`
        : "Money received; unpaid visits are not counted",
  },
  {
    label: "Total customers",
    icon: Users,
    tint: "bg-violet-50 text-violet-700 max-lg:bg-violet-500/15 max-lg:text-violet-300",
    value: (k) => count(k.totalCustomers),
    detail: (k) => `${count(k.customersServed)} served in this period`,
  },
  {
    label: "Completed services",
    icon: Scissors,
    tint: "bg-emerald-50 text-emerald-700 max-lg:bg-emerald-500/15 max-lg:text-emerald-300",
    value: (k) => count(k.completedServices),
    detail: (k) => `Across ${count(k.completedVisits)} completed visits`,
  },
  {
    label: "Avg revenue / customer",
    icon: TrendingUp,
    tint: "bg-amber-50 text-amber-700 max-lg:bg-amber-500/15 max-lg:text-amber-300",
    value: (k) => formatPaise(k.avgRevenuePerCustomerPaise),
    detail: () => "Revenue ÷ customers served",
  },
  {
    label: "Total expenses",
    icon: Receipt,
    tint: "bg-orange-50 text-orange-700 max-lg:bg-orange-500/15 max-lg:text-orange-300",
    value: (k) => formatPaise(k.expensesPaise),
    detail: () => "From the Expenses page",
  },
  {
    label: "Est. operating profit",
    icon: BarChart3,
    tint: "bg-teal-50 text-teal-700 max-lg:bg-teal-500/15 max-lg:text-teal-300",
    value: (k) => formatPaise(k.operatingProfitPaise),
    detail: () => "Revenue − refunds − expenses",
  },
  {
    label: "Active staff",
    icon: UserCheck,
    tint: "bg-indigo-50 text-indigo-700 max-lg:bg-indigo-500/15 max-lg:text-indigo-300",
    value: (k) => count(k.activeStaff),
    detail: () => "Staff accounts that can sign in",
  },
];

function KpiCard({ def, kpis }: { def: KpiDef; kpis: Kpis }) {
  const Icon = def.icon;
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-xs sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">{def.label}</p>
        <span
          className={cn("grid size-9 place-items-center rounded-lg", def.tint)}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-ink tabular-nums sm:text-2xl">
        {def.value(kpis)}
      </p>
      <p className="mt-1 text-xs text-ink-subtle">{def.detail(kpis)}</p>
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  online: "Online",
  other: "Other",
};

const none = (icon: LucideIcon, message: string) => (
  <EmptyState icon={icon} title="Nothing in this period" message={message} />
);

function Charts({ data }: { data: DashboardSummary }) {
  const { kpis, trend, services, staff, payments, customers } = data;
  const sold = kpis.completedVisits > 0;
  const paid = payments.filter((p) => p.payments > 0);
  // A chosen grouping holds until the range changes length; then the one
  // that reads best for the new range is used again.
  const [chosen, setChosen] = useState<{
    days: number;
    value: Granularity;
  } | null>(null);
  const granularity =
    chosen?.days === trend.points.length
      ? chosen.value
      : defaultGranularity(trend.points.length);
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Revenue trend"
          description="Beside the same number of days before this period"
          className="min-w-0 lg:col-span-2"
          actions={
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-subtle">Show</span>
              <select
                value={granularity}
                onChange={(e) =>
                  setChosen({
                    days: trend.points.length,
                    value: e.target.value as Granularity,
                  })
                }
                className="h-9 rounded-lg border border-line bg-surface px-2"
              >
                {GRANULARITIES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          }
        >
          {sold || trend.previousRevenuePaise > 0 ? (
            <TrendChart
              key={granularity}
              trend={trend}
              granularity={granularity}
            />
          ) : (
            none(
              LineChart,
              "Revenue appears here as soon as a service is completed.",
            )
          )}
        </Card>
        <div className="hidden lg:row-span-2 lg:block">
          <QrCodeCard />
        </div>
        <Card
          title="Top services by revenue"
          className="lg:col-span-2"
          actions={<ReportLink to="/app/reports/services" />}
        >
          {services.length ? (
            <BarList
              items={services.slice(0, 6).map((s) => ({
                key: s.serviceId,
                label: s.name,
                value: s.revenuePaise,
                display: formatPaise(s.revenuePaise),
                detail: `${count(s.bookings)} booked · ${count(s.completed)} completed`,
              }))}
            />
          ) : (
            none(BarChart3, "No service was booked in this period.")
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Staff performance"
          actions={<ReportLink to="/app/reports/staff" />}
        >
          {staff.length ? (
            <BarList
              items={staff.slice(0, 6).map((s) => ({
                key: s.workerId ?? "none",
                label: s.name,
                value: s.revenuePaise,
                display: formatPaise(s.revenuePaise),
                detail: `${count(s.customers)} customer${s.customers === 1 ? "" : "s"} · ${count(s.completedServices)} service${s.completedServices === 1 ? "" : "s"} · avg ${formatPaise(s.avgServiceValuePaise)}`,
              }))}
            />
          ) : (
            none(Users, "No visit was completed in this period.")
          )}
        </Card>
        <Card title="Payment breakdown">
          {paid.length ? (
            <BarList
              items={[...paid]
                .sort((a, b) => b.amountPaise - a.amountPaise)
                .map((p) => ({
                  key: p.method,
                  label: METHOD_LABEL[p.method] ?? p.method,
                  value: p.amountPaise,
                  display: formatPaise(p.amountPaise),
                  detail: `${count(p.payments)} payment${p.payments === 1 ? "" : "s"}`,
                }))}
            />
          ) : (
            none(CreditCard, "No payment was taken in this period.")
          )}
        </Card>
        <Card title="Customer overview">
          <dl className="divide-y divide-line">
            {(
              [
                ["New customers", customers.newCustomers],
                ["Returning customers", customers.returningCustomers],
                ["Total customers", customers.totalCustomers],
                ["Cancelled bookings", customers.cancelledBookings],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5">
                <dt className="text-ink-subtle">{label}</dt>
                <dd className="font-semibold text-ink tabular-nums">
                  {count(value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card
        title="Revenue and expenses"
        description="Estimated operating profit is revenue less refunds and expenses."
        actions={<ReportLink to="/app/reports/sales" />}
      >
        <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-center">
          <BarList
            items={[
              {
                key: "revenue",
                label: "Total revenue",
                value: kpis.totalRevenuePaise,
                display: formatPaise(kpis.totalRevenuePaise),
              },
              {
                key: "expenses",
                label: "Total expenses",
                value: kpis.expensesPaise,
                display: formatPaise(kpis.expensesPaise),
                tone: "chart-2",
              },
            ]}
          />
          <div className="rounded-lg bg-canvas p-4 text-center">
            <p className="text-sm text-ink-muted">Est. operating profit</p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                kpis.operatingProfitPaise < 0 ? "text-danger-700" : "text-ink",
              )}
            >
              {formatPaise(kpis.operatingProfitPaise)}
            </p>
            {kpis.operatingProfitPaise < 0 && (
              <p className="text-xs text-danger-700">A loss in this period</p>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}

const ReportLink = ({ to }: { to: string }) => (
  <Link to={to} className="text-sm font-medium text-brand-700 hover:underline">
    Full report
  </Link>
);

export default function DashboardScreen() {
  const profile = useStaffSession((s) => s.profile);
  const [range, setRange] = useState<RangeQuery>({ range: "this_month" });
  const summary = useDashboard(range);
  const recalc = useRecalculate();
  const data = summary.data;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-subtle">
            Welcome back{profile ? `, ${profile.name}` : ""}
          </p>
          <h1 className="text-2xl font-semibold text-ink">
            {data?.salonName ?? "Business dashboard"}
          </h1>
          {data && (
            <p className="text-sm text-ink-subtle">
              {formatDate(data.range.from)}
              {data.range.to !== data.range.from &&
                ` – ${formatDate(data.range.to)}`}{" "}
              · {data.timezone.replace(/_/g, " ")}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={recalc.isPending}
          onClick={() => recalc.mutate()}
          icon={<RefreshCw className="size-4" aria-hidden="true" />}
        >
          Recalculate
        </Button>
      </header>

      <RangeFilter value={range} onChange={setRange} />
      {recalc.isError && (
        <Alert tone="danger">{apiErrorMessage(recalc.error)}</Alert>
      )}

      {summary.isError ? (
        <ErrorState
          title="Could not load the dashboard"
          message={apiErrorMessage(summary.error)}
          onRetry={() => void summary.refetch()}
          retrying={summary.isFetching}
        />
      ) : !data ? (
        <div
          aria-busy="true"
          aria-label="Loading dashboard"
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
        >
          {KPIS.map((k) => (
            <Skeleton key={k.label} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div
          className={cn("space-y-6", summary.isFetching && "opacity-70")}
          aria-busy={summary.isFetching}
        >
          <section
            aria-label="Key figures"
            className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
          >
            {KPIS.map((k) => (
              <KpiCard key={k.label} def={k} kpis={data.kpis} />
            ))}
          </section>
          <Charts data={data} />
        </div>
      )}
    </div>
  );
}
