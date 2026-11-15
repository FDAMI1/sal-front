import { useState } from "react";
import { Download, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { ImportServicesDialog } from "@modules/salon/components/ImportServicesDialog";
import { ServiceDialog } from "@modules/salon/components/ServiceDialog";
import {
  useMenuAction,
  useServiceMenu,
} from "@modules/salon/hooks/useServiceMenu";
import { GENDER_LABEL, minutesLabel } from "@modules/salon/service.validation";
import type { MenuService } from "@modules/salon/types";
import { formatPaise } from "@shared/format";
import { groupBy } from "@shared/groupBy";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusChip,
} from "@shared/ui";

/** The salon's services, prices and durations. */
export function ServicesCard() {
  const menu = useServiceMenu();
  const action = useMenuAction();
  const [editing, setEditing] = useState<MenuService | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [removing, setRemoving] = useState<MenuService | null>(null);

  const groups = groupBy(menu.data ?? [], (s) => s.category);

  let body;
  if (menu.isPending) {
    body = <Skeleton className="h-40 w-full" />;
  } else if (menu.isError) {
    body = (
      <ErrorState
        title="Could not load services"
        message={apiErrorMessage(menu.error)}
        onRetry={() => void menu.refetch()}
        retrying={menu.isFetching}
      />
    );
  } else if (menu.data.length === 0) {
    body = (
      <EmptyState
        icon={Scissors}
        title="No services yet"
        message="Add them from the SmartQueue catalogue in a few clicks, then set your prices."
      />
    );
  } else {
    body = (
      <div className="space-y-5">
        {[...groups].map(([category, items]) => (
          <section key={category}>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
              {category}
            </h3>
            <ul className="divide-y divide-line">
              {items.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {s.name}{" "}
                      {!s.isActive && (
                        <StatusChip tone="warning">Hidden</StatusChip>
                      )}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {[
                        GENDER_LABEL[s.gender],
                        minutesLabel(s.durationMinutes),
                        s.allowWalkIn && s.allowAppointment
                          ? "Walk-in & booking"
                          : s.allowWalkIn
                            ? "Walk-in only"
                            : "Booking only",
                      ].join(" · ")}
                    </p>
                  </div>
                  <p className="font-medium text-ink">
                    {formatPaise(s.pricePaise)}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${s.name}`}
                      icon={<Pencil className="size-4" aria-hidden="true" />}
                      onClick={() => setEditing(s)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${s.name}`}
                      icon={<Trash2 className="size-4" aria-hidden="true" />}
                      onClick={() => setRemoving(s)}
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
    <Card
      title="Services"
      description="What customers can book, with your prices and durations. Switch a service off to hide it from the booking page."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          icon={<Download className="size-4" aria-hidden="true" />}
          onClick={() => setImporting(true)}
        >
          Add from catalogue
        </Button>
        <Button
          variant="secondary"
          icon={<Plus className="size-4" aria-hidden="true" />}
          onClick={() => setEditing("new")}
        >
          Custom service
        </Button>
      </div>
      {action.isError && (
        <div className="mb-3">
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        </div>
      )}
      {body}

      {editing && (
        <ServiceDialog
          open
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ImportServicesDialog
        open={importing}
        menu={menu.data ?? []}
        onClose={() => setImporting(false)}
      />
      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.name ?? "service"}?`}
        confirmLabel="Remove"
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
        Customers can no longer pick it. You can add it again later.
      </ConfirmDialog>
    </Card>
  );
}
