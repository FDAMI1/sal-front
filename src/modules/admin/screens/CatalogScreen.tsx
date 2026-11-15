import { useState } from "react";
import { Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { CatalogDialog } from "@modules/admin/components/CatalogDialog";
import {
  useAdminCatalog,
  useCatalogAction,
} from "@modules/admin/hooks/useAdminCatalog";
import {
  GENDER_LABEL,
  GENDER_OPTIONS,
  minutesLabel,
} from "@modules/salon/service.validation";
import type { CatalogItem, ServiceGender } from "@modules/salon/types";
import { formatPaise } from "@shared/format";
import { groupBy } from "@shared/groupBy";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusChip,
} from "@shared/ui";

/** The master service catalogue salons import from (Phase 4). */
export default function CatalogScreen() {
  const catalog = useAdminCatalog();
  const action = useCatalogAction();
  const [gender, setGender] = useState<ServiceGender | "all">("all");
  const [editing, setEditing] = useState<CatalogItem | "new" | null>(null);
  const [removing, setRemoving] = useState<CatalogItem | null>(null);

  const shown = (catalog.data ?? []).filter(
    (c) => gender === "all" || c.gender === gender,
  );

  let body;
  if (catalog.isPending) {
    body = <Skeleton className="h-96 w-full" />;
  } else if (catalog.isError) {
    body = (
      <ErrorState
        title="Could not load the catalogue"
        message={apiErrorMessage(catalog.error)}
        onRetry={() => void catalog.refetch()}
        retrying={catalog.isFetching}
      />
    );
  } else if (shown.length === 0) {
    body = <EmptyState icon={Scissors} title="No services here" />;
  } else {
    body = (
      <div className="space-y-6">
        {[...groupBy(shown, (c) => c.category)].map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
              {category}
            </h2>
            <ul className="divide-y divide-line">
              {items.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                      {c.name}
                      {!c.isActive && (
                        <StatusChip tone="warning">Not offered</StatusChip>
                      )}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {GENDER_LABEL[c.gender]} ·{" "}
                      {minutesLabel(c.defaultDurationMinutes)}
                    </p>
                  </div>
                  <p className="font-medium text-ink">
                    {formatPaise(c.defaultPricePaise)}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${c.name}`}
                      icon={<Pencil className="size-4" aria-hidden="true" />}
                      onClick={() => setEditing(c)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${c.name}`}
                      icon={<Trash2 className="size-4" aria-hidden="true" />}
                      onClick={() => setRemoving(c)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Service catalogue"
        description="The master list salons pick services from. Prices here are suggestions; each branch sets its own."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setEditing("new")}
          >
            Add service
          </Button>
        }
      />
      <Card>
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter"
        >
          {[{ value: "all" as const, label: "All" }, ...GENDER_OPTIONS].map(
            (g) => (
              <Button
                key={g.value}
                size="sm"
                variant={gender === g.value ? "primary" : "secondary"}
                aria-pressed={gender === g.value}
                onClick={() => setGender(g.value)}
              >
                {g.label}
              </Button>
            ),
          )}
        </div>
        {action.isError && (
          <div className="mb-3">
            <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
          </div>
        )}
        {body}
      </Card>

      {editing && (
        <CatalogDialog
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        title={`Delete ${removing?.name ?? "service"}?`}
        confirmLabel="Delete"
        busy={action.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          action.mutate(
            { kind: "remove", id: removing.id },
            { onSettled: () => setRemoving(null) },
          )
        }
      >
        Salons can no longer import it. Branches that already have it keep their
        copy.
      </ConfirmDialog>
    </div>
  );
}
