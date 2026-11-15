import { useState } from "react";
import { KeyRound, LogOut, UserPlus } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import {
  AddSalonAdminDialog,
  SetPasswordDialog,
} from "@modules/admin/components/SalonUserDialogs";
import {
  useSalonUserAction,
  useSalonUsers,
} from "@modules/admin/hooks/useAdminSalons";
import type { SalonDetail, SalonUser } from "@modules/admin/types";
import { formatDateTime } from "@shared/format";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Skeleton,
  StatusChip,
} from "@shared/ui";

type Pending =
  | { kind: "password"; user: SalonUser }
  | { kind: "toggle"; user: SalonUser }
  | { kind: "signOut"; user: SalonUser };

/** The salon's logins: add admins, disable or re-enable, reset, sign out. */
export function SalonUsersCard({ salon }: { salon: SalonDetail }) {
  const users = useSalonUsers(salon.id);
  const action = useSalonUserAction(salon.id);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const close = () => setPending(null);
  const devices = salon.limits.effective.devicesPerUser;

  let body;
  if (users.isPending) {
    body = <Skeleton className="h-24 w-full" />;
  } else if (users.isError) {
    body = (
      <ErrorState
        title="Could not load accounts"
        message={apiErrorMessage(users.error)}
        onRetry={() => void users.refetch()}
        retrying={users.isFetching}
      />
    );
  } else {
    body = (
      <ul className="divide-y divide-line">
        {users.data.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                {u.name}
                {u.isOwner && <StatusChip tone="success">Owner</StatusChip>}
                {u.role === "worker" && (
                  <StatusChip tone="neutral">Worker</StatusChip>
                )}
                {!u.isActive && (
                  <StatusChip tone="danger">Sign-in disabled</StatusChip>
                )}
                {u.isLocked && (
                  <StatusChip tone="warning">
                    Locked (wrong passwords)
                  </StatusChip>
                )}
              </p>
              <p className="text-xs break-all text-ink-subtle">
                {[
                  u.email,
                  u.phone,
                  `${u.activeSessions} device${u.activeSessions === 1 ? "" : "s"} signed in`,
                  u.lastLoginAt
                    ? `last sign-in ${formatDateTime(u.lastLoginAt)}`
                    : "never signed in",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<KeyRound className="size-4" aria-hidden="true" />}
                onClick={() => setPending({ kind: "password", user: u })}
              >
                Password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={u.activeSessions === 0}
                icon={<LogOut className="size-4" aria-hidden="true" />}
                onClick={() => setPending({ kind: "signOut", user: u })}
              >
                Sign out
              </Button>
              {!u.isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPending({ kind: "toggle", user: u })}
                >
                  {u.isActive ? "Disable" : "Enable"}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const confirming = pending && pending.kind !== "password" ? pending : null;

  return (
    <Card
      title="Logins"
      description={`Salon admins and staff. Admins do not use staff slots. Each login can be signed in on up to ${devices} device${devices === 1 ? "" : "s"}.`}
    >
      <div className="mb-3">
        <Button
          icon={<UserPlus className="size-4" aria-hidden="true" />}
          onClick={() => setAdding(true)}
        >
          Add salon admin
        </Button>
      </div>
      {action.isError && (
        <div className="mb-3">
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        </div>
      )}
      {body}

      {adding && (
        <AddSalonAdminDialog
          open
          salonId={salon.id}
          onClose={() => setAdding(false)}
        />
      )}
      {pending?.kind === "password" && (
        <SetPasswordDialog
          salonId={salon.id}
          user={pending.user}
          onClose={close}
        />
      )}
      <ConfirmDialog
        open={confirming !== null}
        tone={
          confirming?.kind === "toggle" && !confirming.user.isActive
            ? "primary"
            : "danger"
        }
        title={
          confirming?.kind === "signOut"
            ? `Sign ${confirming.user.name} out everywhere?`
            : confirming?.user.isActive
              ? `Disable ${confirming.user.name}'s sign-in?`
              : `Enable ${confirming?.user.name ?? ""}'s sign-in?`
        }
        confirmLabel={
          confirming?.kind === "signOut"
            ? "Sign out"
            : confirming?.user.isActive
              ? "Disable"
              : "Enable"
        }
        busy={action.isPending}
        onCancel={close}
        onConfirm={() => {
          if (!confirming) return;
          action.mutate(
            confirming.kind === "signOut"
              ? { kind: "signOut", userId: confirming.user.id }
              : {
                  kind: "update",
                  userId: confirming.user.id,
                  isActive: !confirming.user.isActive,
                },
            { onSettled: close },
          );
        }}
      >
        {confirming?.kind === "signOut"
          ? "Every device they are signed in on is signed out. They can sign in again with their password."
          : confirming?.user.isActive
            ? "They are signed out at once and cannot sign in until you enable them again."
            : "They can sign in again with their current password."}
      </ConfirmDialog>
    </Card>
  );
}
