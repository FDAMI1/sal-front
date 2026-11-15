import { useState } from "react";
import { Scissors, Users } from "lucide-react";
import {
  useDashboardSection,
  type RangeQuery,
  type ServiceRow,
  type StaffRow,
} from "@modules/dashboard/api/dashboardApi";
import { BarList } from "@modules/dashboard/components/charts";
import {
  CsvButton,
  DataTable,
  ReportShell,
  type Column,
} from "@modules/reports/ReportParts";
import { formatPaise } from "@shared/format";
import { Card, EmptyState } from "@shared/ui";

const sum = <R,>(rows: R[], of: (r: R) => number) =>
  rows.reduce((t, r) => t + of(r), 0);

const num = <R,>(
  header: string,
  of: (r: R) => number,
  rows: R[],
  money = false,
): Column<R> => ({
  header,
  numeric: true,
  cell: (r) => (money ? formatPaise(of(r)) : of(r)),
  text: (r) => (money ? of(r) / 100 : of(r)),
  footer: money ? formatPaise(sum(rows, of)) : sum(rows, of),
});

/** /app/reports/staff — what each staff member completed and earned. */
export function StaffPerformanceScreen() {
  const [range, setRange] = useState<RangeQuery>({ range: "this_month" });
  const query = useDashboardSection("staff", range);
  const rows = query.data?.staff ?? [];
  const columns: Column<StaffRow>[] = [
    {
      header: "Staff member",
      cell: (r) => r.name,
      text: (r) => r.name,
      footer: "Total",
    },
    num("Customers handled", (r) => r.customers, rows),
    num("Completed visits", (r) => r.visits, rows),
    num("Completed services", (r) => r.completedServices, rows),
    num("Revenue", (r) => r.revenuePaise, rows, true),
    {
      header: "Avg service value",
      numeric: true,
      cell: (r) => formatPaise(r.avgServiceValuePaise),
      text: (r) => r.avgServiceValuePaise / 100,
    },
  ];
  return (
    <ReportShell
      title="Staff performance"
      description="Counted from visits each staff member actually completed."
      range={range}
      onRange={setRange}
      query={query}
      actions={
        <CsvButton
          fileName="staff-performance.csv"
          columns={columns}
          rows={rows}
        />
      }
    >
      {(data) =>
        data.staff.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="No completed visits in this period"
              message="Staff figures appear once a service is marked complete in the Queue."
            />
          </Card>
        ) : (
          <>
            <Card title="Revenue by staff member">
              <BarList
                items={data.staff.map((s) => ({
                  key: s.workerId ?? "none",
                  label: s.name,
                  value: s.revenuePaise,
                  display: formatPaise(s.revenuePaise),
                }))}
              />
            </Card>
            <Card title="Details">
              <DataTable
                caption="Staff performance"
                columns={columns}
                rows={data.staff}
                rowKey={(r) => r.workerId ?? "none"}
              />
            </Card>
          </>
        )
      }
    </ReportShell>
  );
}

/** /app/reports/services — how each service was booked, done and earned. */
export function ServiceReportScreen() {
  const [range, setRange] = useState<RangeQuery>({ range: "this_month" });
  const query = useDashboardSection("services", range);
  const rows = query.data?.services ?? [];
  const columns: Column<ServiceRow>[] = [
    {
      header: "Service",
      cell: (r) => r.name,
      text: (r) => r.name,
      footer: "Total",
    },
    num("Bookings", (r) => r.bookings, rows),
    num("Completed", (r) => r.completed, rows),
    num("Revenue (menu price)", (r) => r.revenuePaise, rows, true),
  ];
  return (
    <ReportShell
      title="Service reports"
      description="Revenue here is the menu price of completed services, before visit discounts."
      range={range}
      onRange={setRange}
      query={query}
      actions={
        <CsvButton
          fileName="service-report.csv"
          columns={columns}
          rows={rows}
        />
      }
    >
      {(data) =>
        data.services.length === 0 ? (
          <Card>
            <EmptyState
              icon={Scissors}
              title="No bookings in this period"
              message="Each service appears here once a customer books it."
            />
          </Card>
        ) : (
          <>
            <Card title="Revenue by service">
              <BarList
                items={data.services.map((s) => ({
                  key: s.serviceId,
                  label: s.name,
                  value: s.revenuePaise,
                  display: formatPaise(s.revenuePaise),
                }))}
              />
            </Card>
            <Card title="Details">
              <DataTable
                caption="Service report"
                columns={columns}
                rows={data.services}
                rowKey={(r) => r.serviceId}
              />
            </Card>
          </>
        )
      }
    </ReportShell>
  );
}
