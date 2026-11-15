import { useState } from "react";
import { Receipt } from "lucide-react";
import {
  methodLabel,
  usePayments,
  type LedgerRow,
} from "@modules/billing/billingApi";
import {
  RefundDialog,
  type MoneyTarget,
} from "@modules/billing/components/MoneyDialogs";
import {
  useDashboardSection,
  type DayRow,
  type RangeQuery,
} from "@modules/dashboard/api/dashboardApi";
import {
  CsvButton,
  DataTable,
  ReportShell,
  type Column,
} from "@modules/reports/ReportParts";
import { formatDate, formatDateTime, formatPaise } from "@shared/format";
import { Button, Card, EmptyState, StatusChip } from "@shared/ui";

const total = (rows: DayRow[], f: keyof Omit<DayRow, "date">) =>
  rows.reduce((sum, r) => sum + r[f], 0);

const money = (
  header: string,
  f: keyof Omit<DayRow, "date">,
  rows: DayRow[],
): Column<DayRow> => ({
  header,
  numeric: true,
  cell: (r) => formatPaise(r[f]),
  text: (r) => r[f] / 100,
  footer: formatPaise(total(rows, f)),
});

/** /app/reports/sales — day-by-day sales, then every payment and refund. */
export default function SalesReportScreen() {
  const [range, setRange] = useState<RangeQuery>({ range: "this_month" });
  const daily = useDashboardSection("daily", range);
  const ledger = usePayments(range);
  const [refunding, setRefunding] = useState<MoneyTarget | null>(null);

  const rows = daily.data?.daily ?? [];
  const columns: Column<DayRow>[] = [
    {
      header: "Date",
      cell: (r) => formatDate(r.date),
      text: (r) => r.date,
      footer: "Total",
    },
    {
      header: "Visits",
      numeric: true,
      cell: (r) => r.visits,
      text: (r) => r.visits,
      footer: total(rows, "visits"),
    },
    {
      header: "Services",
      numeric: true,
      cell: (r) => r.services,
      text: (r) => r.services,
      footer: total(rows, "services"),
    },
    money("Service value", "grossPaise", rows),
    money("Discounts", "discountPaise", rows),
    money("Revenue", "revenuePaise", rows),
    money("Collected", "collectedPaise", rows),
    money("Refunds", "refundPaise", rows),
    money("Expenses", "expensesPaise", rows),
  ];

  // What is still refundable per visit, from the ledger itself.
  const refundedBy = new Map<string, number>();
  for (const p of ledger.data ?? []) {
    if (p.kind === "refund") {
      refundedBy.set(
        p.bookingId,
        (refundedBy.get(p.bookingId) ?? 0) + p.amountPaise,
      );
    }
  }
  const ledgerColumns: Column<LedgerRow>[] = [
    { header: "When", cell: (p) => formatDateTime(p.at) },
    {
      header: "Visit",
      cell: (p) => (
        <>
          <span className="font-mono font-semibold">{p.token}</span>{" "}
          {p.customerName}
        </>
      ),
    },
    {
      header: "Type",
      cell: (p) => (
        <StatusChip tone={p.kind === "payment" ? "success" : "warning"}>
          {p.kind === "payment" ? "Payment" : "Refund"}
        </StatusChip>
      ),
    },
    { header: "Method", cell: (p) => methodLabel(p.method) },
    {
      header: "Amount",
      numeric: true,
      cell: (p) =>
        `${p.kind === "refund" ? "− " : ""}${formatPaise(p.amountPaise)}`,
    },
    {
      header: "Note",
      cell: (p) =>
        p.kind === "refund"
          ? p.reason
          : p.discountPaise
            ? `Discount ${formatPaise(p.discountPaise)}`
            : "",
    },
    { header: "Recorded by", cell: (p) => p.recordedByName },
    {
      header: "",
      cell: (p) => {
        const refunded = refundedBy.get(p.bookingId) ?? 0;
        return p.kind === "payment" && refunded < p.amountPaise ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setRefunding({
                id: p.bookingId,
                token: p.token,
                customerName: p.customerName,
                totalPaise: p.grossPaise,
                paidPaise: p.amountPaise,
                refundedPaise: refunded,
              })
            }
          >
            Refund
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <ReportShell
      title="Sales reports"
      description="Revenue is the value of completed services less discounts. Collected is money actually received."
      range={range}
      onRange={setRange}
      query={daily}
      actions={
        <CsvButton
          fileName={`sales-${daily.data?.range.from ?? ""}-to-${daily.data?.range.to ?? ""}.csv`}
          columns={columns}
          rows={rows}
        />
      }
    >
      {(data) => (
        <>
          <Card
            title="Sales by day"
            description={`${formatDate(data.range.from)} – ${formatDate(data.range.to)}`}
          >
            <DataTable
              caption="Sales by day"
              columns={columns}
              rows={data.daily}
              rowKey={(r) => r.date}
            />
          </Card>
          <Card
            title="Payments and refunds"
            description="Refunds made here are recorded on the day they are given."
          >
            {ledger.data?.length ? (
              <DataTable
                caption="Payments and refunds"
                columns={ledgerColumns}
                rows={ledger.data}
                rowKey={(p) => p.id}
              />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No payments in this period"
                message="Payments are recorded from the Queue when a service is completed."
              />
            )}
          </Card>
          <RefundDialog target={refunding} onClose={() => setRefunding(null)} />
        </>
      )}
    </ReportShell>
  );
}
