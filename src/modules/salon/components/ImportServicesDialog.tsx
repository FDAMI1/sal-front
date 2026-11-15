import { useMemo, useState } from "react";
import { apiErrorMessage } from "@api/apiClient";
import { useCatalog, useMenuAction } from "@modules/salon/hooks/useServiceMenu";
import {
  GENDER_LABEL,
  GENDER_OPTIONS,
  minutesLabel,
} from "@modules/salon/service.validation";
import type { MenuService, ServiceGender } from "@modules/salon/types";
import { cn } from "@shared/cn";
import { formatPaise } from "@shared/format";
import { groupBy } from "@shared/groupBy";
import { Alert, Button, Dialog, Skeleton } from "@shared/ui";

/**
 * Fills the menu from the SmartQueue catalogue at default prices. Services
 * already on the menu are marked and skipped.
 */
export function ImportServicesDialog({
  menu,
  open,
  onClose,
}: {
  menu: MenuService[];
  open: boolean;
  onClose: () => void;
}) {
  const [gender, setGender] = useState<ServiceGender | "all">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const catalog = useCatalog(open);
  const action = useMenuAction();

  const have = useMemo(
    () => new Set(menu.map((m) => `${m.name.toLowerCase()}|${m.gender}`)),
    [menu],
  );
  const shown = (catalog.data ?? []).filter(
    (c) => gender === "all" || c.gender === gender,
  );
  const groups = groupBy(shown, (c) => c.category);

  const toggle = (id: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () =>
    action.mutate(
      { kind: "import", catalogIds: [...picked] },
      {
        onSuccess: () => {
          setPicked(new Set());
          onClose();
        },
      },
    );

  return (
    <Dialog open={open} onClose={onClose} title="Add services">
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="font-medium text-ink">Show</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as ServiceGender | "all")}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3"
          >
            <option value="all">All services</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        {catalog.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : catalog.isError ? (
          <Alert tone="danger">{apiErrorMessage(catalog.error)}</Alert>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {[...groups].map(([category, items]) => (
              <fieldset key={category}>
                <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  {category}
                </legend>
                {items.map((c) => {
                  const added = have.has(`${c.name.toLowerCase()}|${c.gender}`);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2 py-1.5",
                        added ? "opacity-60" : "hover:bg-canvas",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-brand-600"
                        disabled={added}
                        checked={added || picked.has(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{c.name}</span>{" "}
                        <span className="text-xs text-ink-subtle">
                          {GENDER_LABEL[c.gender]} ·{" "}
                          {minutesLabel(c.defaultDurationMinutes)}
                          {added ? " · already added" : ""}
                        </span>
                      </span>
                      <span className="text-ink-muted">
                        {formatPaise(c.defaultPricePaise)}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>
        )}
        <p className="text-xs text-ink-subtle">
          Added at these default prices. Edit any price afterwards.
        </p>

        {action.isError && (
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={action.isPending}
            disabled={picked.size === 0}
            onClick={submit}
          >
            {`Add ${picked.size || ""} service${picked.size === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
