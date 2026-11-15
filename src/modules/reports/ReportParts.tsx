import type { ReactNode } from "react";
import { Download } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { apiErrorMessage } from "@api/apiClient";
import type { RangeQuery } from "@modules/dashboard/api/dashboardApi";
import { RangeFilter } from "@modules/dashboard/components/RangeFilter";
import { cn } from "@shared/cn";
import { Button, ErrorState, PageHeader, Skeleton } from "@shared/ui";

/** A report page: title, the date-range filter, then the loaded content. */
export function ReportShell<T>({
  title,
  description,
  actions,
  range,
  onRange,
  query,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  range: RangeQuery;
  onRange: (next: RangeQuery) => void;
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      <RangeFilter value={range} onChange={onRange} />
      {query.isError ? (
        <ErrorState
          title={`Could not load ${title.toLowerCase()}`}
          message={apiErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : !query.data ? (
        <Skeleton className="h-64 w-full" aria-label="Loading" />
      ) : (
        <div
          className={cn("space-y-6", query.isFetching && "opacity-70")}
          aria-busy={query.isFetching}
        >
          {children(query.data)}
        </div>
      )}
    </div>
  );
}

export interface Column<R> {
  header: string;
  /** Numbers sit right-aligned so their digits line up. */
  numeric?: boolean;
  cell: (row: R) => ReactNode;
  /** Plain text for the CSV download; defaults to the cell when it is text. */
  text?: (row: R) => string | number;
  footer?: ReactNode;
}

/**
 * A plain table. Cells stay on one line and the table scrolls sideways on a
 * phone, instead of folding dates and names into narrow columns.
 */
export function DataTable<R>({
  caption,
  columns,
  rows,
  rowKey,
}: {
  caption: string;
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R) => string;
}) {
  const hasFooter = columns.some((c) => c.footer !== undefined);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-xl text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs text-ink-subtle uppercase">
            {columns.map((c) => (
              <th
                key={c.header}
                scope="col"
                className={cn(
                  "px-3 py-2 font-semibold whitespace-nowrap",
                  c.numeric && "text-right",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={cn(
                    "px-3 py-2.5 whitespace-nowrap text-ink",
                    c.numeric && "text-right tabular-nums",
                  )}
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {hasFooter && (
          <tfoot>
            <tr className="border-t-2 border-line font-semibold text-ink">
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={cn(
                    "px-3 py-2.5 whitespace-nowrap",
                    c.numeric && "text-right tabular-nums",
                  )}
                >
                  {c.footer}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

const csvCell = (v: string | number) => {
  const text = String(v);
  // A leading = + - @ would run as a formula when the file is opened.
  const safe =
    /^[=+\-@]/.test(text) && typeof v !== "number" ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The table as a CSV file, for a spreadsheet or the accountant. */
export function CsvButton<R>({
  fileName,
  columns,
  rows,
}: {
  fileName: string;
  columns: Column<R>[];
  rows: R[];
}) {
  const download = () => {
    const withText = columns.flatMap((c) =>
      c.text ? [{ header: c.header, text: c.text }] : [],
    );
    const lines = [
      withText.map((c) => csvCell(c.header)).join(","),
      ...rows.map((r) => withText.map((c) => csvCell(c.text(r))).join(",")),
    ];
    const url = URL.createObjectURL(
      // The byte-order mark makes Excel read ₹ and names as UTF-8.
      new Blob([String.fromCharCode(0xfeff), lines.join("\r\n")], {
        type: "text/csv",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={download}
      disabled={rows.length === 0}
      icon={<Download className="size-4" aria-hidden="true" />}
    >
      Download CSV
    </Button>
  );
}
