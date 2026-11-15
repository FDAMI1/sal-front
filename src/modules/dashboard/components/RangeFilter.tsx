import { useEffect, useRef, useState } from "react";
import {
  RANGE_OPTIONS,
  type RangeQuery,
} from "@modules/dashboard/api/dashboardApi";
import { cn } from "@shared/cn";
import { Button } from "@shared/ui";

interface RangeFilterProps {
  value: RangeQuery;
  onChange: (next: RangeQuery) => void;
}

/** Preset chips plus a From/To pair; every figure on the page follows it. */
export function RangeFilter({ value, onChange }: RangeFilterProps) {
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");
  const chips = useRef<HTMLDivElement>(null);
  // On a phone the chips scroll sideways; keep the chosen one in view.
  useEffect(() => {
    chips.current
      ?.querySelector<HTMLElement>('[aria-checked="true"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [value.range]);
  const customError =
    from && to && from > to ? "From must be on or before To" : null;

  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Date range"
        ref={chips}
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {RANGE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value.range === o.value}
            onClick={() =>
              onChange(
                o.value === "custom"
                  ? { range: "custom", from: value.from, to: value.to }
                  : { range: o.value },
              )
            }
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
              value.range === o.value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.range === "custom" && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to && !customError)
              onChange({ range: "custom", from, to });
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="block font-medium text-ink">From</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-lg border border-line bg-surface px-3"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block font-medium text-ink">To</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-lg border border-line bg-surface px-3"
            />
          </label>
          <Button type="submit" disabled={!from || !to || Boolean(customError)}>
            Apply
          </Button>
          {customError && (
            <p role="alert" className="w-full text-sm text-danger-700">
              {customError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
