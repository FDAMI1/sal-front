import { useState } from "react";
import type { Trend } from "@modules/dashboard/api/dashboardApi";
import { bucketTrend, type Granularity } from "@modules/dashboard/trend";
import { cn } from "@shared/cn";
import { formatDate, formatPaise } from "@shared/format";

const W = 640;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 56 };

/** A round number at or above `max`, so the axis ends on a clean tick. */
function niceMax(max: number): number {
  if (max <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((s) => s * pow >= max) ?? 10;
  return step * pow;
}

const bucketLabel = (date: string, granularity: Granularity) =>
  granularity === "month"
    ? new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : granularity === "week"
      ? `Week of ${formatDate(date)}`
      : formatDate(date);

/**
 * Revenue over the range (solid) beside the same number of days before it
 * (dashed grey), on one axis. Hover or focus a point to read its values.
 */
export function TrendChart({
  trend,
  granularity,
}: {
  trend: Trend;
  granularity: Granularity;
}) {
  const [active, setActive] = useState<number | null>(null);
  const points = bucketTrend(trend.points, granularity);
  const top = niceMax(
    Math.max(
      ...points.map((p) => Math.max(p.revenuePaise, p.previousRevenuePaise)),
    ),
  );
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const path = (key: "revenuePaise" | "previousRevenuePaise") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ");
  const shown = active === null ? null : points[active];
  // Label the first, middle and last buckets only: more would collide.
  const ticks = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ];

  return (
    <figure>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-ink-muted">
        <ul className="flex flex-wrap gap-4">
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-chart-1" aria-hidden="true" />
            This period
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="h-0 w-4 border-t-2 border-dashed border-chart-muted"
              aria-hidden="true"
            />
            Previous period ({formatDate(trend.previous.from)} –{" "}
            {formatDate(trend.previous.to)})
          </li>
        </ul>
        <p aria-live="polite" className="min-h-4 font-medium text-ink">
          {shown &&
            `${bucketLabel(shown.date, granularity)}: ${formatPaise(shown.revenuePaise)} · before: ${formatPaise(shown.previousRevenuePaise)}`}
        </p>
      </div>
      {/* On a phone the chart keeps a readable size and scrolls sideways. */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-md"
          role="img"
          aria-label={`Revenue by ${granularity}. The table below lists every value.`}
          onMouseLeave={() => setActive(null)}
        >
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(top * f)}
                y2={y(top * f)}
                className="stroke-line"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(top * f) + 4}
                textAnchor="end"
                className="fill-ink-subtle text-[11px]"
              >
                {formatPaise(top * f)}
              </text>
            </g>
          ))}
          {ticks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={
                points.length === 1
                  ? "middle"
                  : i === 0
                    ? "start"
                    : i === points.length - 1
                      ? "end"
                      : "middle"
              }
              className="fill-ink-subtle text-[11px]"
            >
              {points[i] && bucketLabel(points[i].date, granularity)}
            </text>
          ))}
          <path
            d={path("previousRevenuePaise")}
            fill="none"
            className="stroke-chart-muted"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <path
            d={path("revenuePaise")}
            fill="none"
            className="stroke-chart-1"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <g key={p.date}>
              {(points.length <= 31 || active === i) && (
                <circle
                  cx={x(i)}
                  cy={y(p.revenuePaise)}
                  r={active === i ? 5 : 3}
                  className="fill-chart-1 stroke-surface"
                  strokeWidth={2}
                />
              )}
              {/* A full-height band per point: a target larger than the dot. */}
              <rect
                x={x(i) - innerW / Math.max(points.length, 1) / 2}
                y={PAD.top}
                width={innerW / Math.max(points.length, 1)}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${bucketLabel(p.date, granularity)}: revenue ${formatPaise(p.revenuePaise)}, previous period ${formatPaise(p.previousRevenuePaise)}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none"
              />
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}

export interface BarItem {
  key: string;
  label: string;
  value: number;
  /** Shown at the end of the bar, e.g. "₹4,200". */
  display: string;
  /** Smaller text under the label, e.g. "12 bookings · 9 completed". */
  detail?: string;
  /** Second series colour, for a bar that is a different measure. */
  tone?: "chart-2";
}

/**
 * Horizontal bars on one shared scale: length is the encoding, and every
 * bar carries its own label and value.
 */
export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-ink">
              {i.label}
            </span>
            <span className="font-semibold text-ink tabular-nums">
              {i.display}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-canvas">
            <div
              className={cn(
                "h-2 rounded-full",
                i.tone === "chart-2" ? "bg-chart-2" : "bg-chart-1",
              )}
              style={{ width: `${(Math.abs(i.value) / max) * 100}%` }}
            />
          </div>
          {i.detail && (
            <p className="mt-1 text-xs text-ink-subtle">{i.detail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
