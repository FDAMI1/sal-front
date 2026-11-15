import { useState } from "react";
import { Scissors } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { useMenuServices, useSetSkills } from "@modules/staff/hooks/useStaff";
import type { MenuItem, WorkerDetail } from "@modules/staff/types";
import { groupBy } from "@shared/groupBy";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusChip,
} from "@shared/ui";

const GENDER: Record<MenuItem["gender"], string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

const key = (ids: Iterable<string>) => [...ids].sort().join(",");

/** Which menu services this person performs. Only live services are listed. */
export function StaffSkillsCard({ worker }: { worker: WorkerDetail }) {
  const menu = useMenuServices();
  const save = useSetSkills();
  const [selected, setSelected] = useState(() => new Set(worker.skills));
  const [saved, setSaved] = useState(() => key(worker.skills));

  const live = menu.data?.filter((s) => s.isActive) ?? [];
  // A skill on a service since hidden from the menu would be refused.
  const chosen = live.filter((s) => selected.has(s.id)).map((s) => s.id);
  const dirty = key(chosen) !== saved;

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  let body;
  if (menu.isPending) body = <Skeleton className="h-32 w-full" />;
  else if (menu.isError)
    body = (
      <ErrorState
        title="Could not load the service menu"
        message={apiErrorMessage(menu.error)}
        onRetry={() => void menu.refetch()}
        retrying={menu.isFetching}
      />
    );
  else if (live.length === 0)
    body = (
      <EmptyState
        icon={Scissors}
        title="No services on the menu"
        message="Add services to your menu first, then choose which ones this person does."
      />
    );
  else
    body = (
      <div className="space-y-5">
        {[...groupBy(live, (s) => s.category)].map(([category, items]) => (
          <fieldset key={category}>
            <legend className="mb-2 font-semibold text-ink">{category}</legend>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={(e) => toggle(s.id, e.target.checked)}
                      className="size-4 accent-brand-600"
                    />
                    <span className="min-w-0 flex-1 text-ink">{s.name}</span>
                    <StatusChip tone="neutral">{GENDER[s.gender]}</StatusChip>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
    );

  return (
    <Card
      title="Skills"
      description={`${chosen.length} service${chosen.length === 1 ? "" : "s"} selected. Customers are only matched to staff who do the service.`}
    >
      {body}
      {live.length > 0 && (
        <div className="mt-4 space-y-3">
          {save.isError && (
            <Alert tone="danger">{apiErrorMessage(save.error)}</Alert>
          )}
          {save.isSuccess && !dirty && (
            <Alert tone="success">Skills saved.</Alert>
          )}
          <Button
            loading={save.isPending}
            disabled={!dirty}
            onClick={() =>
              save.mutate(
                { id: worker.id, serviceIds: chosen },
                { onSuccess: (w) => setSaved(key(w.skills)) },
              )
            }
          >
            Save skills
          </Button>
        </div>
      )}
    </Card>
  );
}
