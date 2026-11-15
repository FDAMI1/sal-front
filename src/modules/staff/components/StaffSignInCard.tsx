import { useState } from "react";
import { useNavigate } from "react-router";
import { KeyRound, Power, Trash2 } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { SetPasswordDialog } from "@modules/staff/components/StaffDialogs";
import { useRemoveStaff, useUpdateStaff } from "@modules/staff/hooks/useStaff";
import type { WorkerDetail } from "@modules/staff/types";
import { formatDateTime } from "@shared/format";
import { Alert, Button, Card, ConfirmDialog, StatusChip } from "@shared/ui";

/** Activate or deactivate the login, set a new password, remove the member. */
export function StaffSignInCard({ worker }: { worker: WorkerDetail }) {
  const update = useUpdateStaff();
  const remove = useRemoveStaff();
  const navigate = useNavigate();
  const [open, setOpen] = useState<"toggle" | "password" | "remove" | null>(
    null,
  );
  const close = () => setOpen(null);
  const active = worker.canSignIn;
  const error = update.error ?? remove.error;

  return (
    <Card
      title="Sign-in"
      description={
        worker.lastLoginAt
          ? `Last signed in ${formatDateTime(worker.lastLoginAt)}.`
          : "Has never signed in."
      }
      actions={
        <StatusChip tone={active ? "success" : "danger"}>
          {active ? "Active" : "Inactive"}
        </StatusChip>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          icon={<Power className="size-4" aria-hidden="true" />}
          onClick={() => setOpen("toggle")}
        >
          {active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          variant="secondary"
          icon={<KeyRound className="size-4" aria-hidden="true" />}
          onClick={() => setOpen("password")}
        >
          Set new password
        </Button>
        <Button
          variant="danger"
          icon={<Trash2 className="size-4" aria-hidden="true" />}
          onClick={() => setOpen("remove")}
        >
          Remove staff member
        </Button>
      </div>
      {error && (
        <div className="mt-3">
          <Alert tone="danger">{apiErrorMessage(error)}</Alert>
        </div>
      )}

      {open === "password" && (
        <SetPasswordDialog
          workerId={worker.id}
          name={worker.name}
          onClose={close}
        />
      )}
      <ConfirmDialog
        open={open === "toggle"}
        tone={active ? "danger" : "primary"}
        title={
          active ? `Deactivate ${worker.name}?` : `Activate ${worker.name}?`
        }
        confirmLabel={active ? "Deactivate" : "Activate"}
        busy={update.isPending}
        onCancel={close}
        onConfirm={() =>
          update.mutate(
            { id: worker.id, patch: { isActive: !active } },
            { onSettled: close },
          )
        }
      >
        {active
          ? "They are signed out at once and cannot sign in until you activate them again. This frees a staff slot."
          : "They can sign in again with their current password. This uses a staff slot."}
      </ConfirmDialog>
      <ConfirmDialog
        open={open === "remove"}
        title={`Remove ${worker.name}?`}
        confirmLabel="Remove"
        busy={remove.isPending}
        onCancel={close}
        onConfirm={() =>
          remove.mutate(worker.id, {
            onSuccess: () => void navigate("/app/staff"),
            onError: close,
          })
        }
      >
        They are signed out everywhere and no longer appear in your staff list
        or for bookings.
      </ConfirmDialog>
    </Card>
  );
}
