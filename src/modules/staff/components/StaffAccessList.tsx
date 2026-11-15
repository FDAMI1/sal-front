import { useState } from "react";
import { Link } from "react-router";
import {
  KeyRound,
  LogOut,
  Monitor,
  Power,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { SetPasswordDialog } from "@modules/staff/components/StaffDialogs";
import {
  useRevokeDevice,
  useSignOutEverywhere,
  useUpdateStaff,
} from "@modules/staff/hooks/useStaff";
import type {
  DeviceType,
  StaffAccessRow,
  StaffDevice,
} from "@modules/staff/types";
import { formatDateTime } from "@shared/format";
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  StatusChip,
} from "@shared/ui";

const DEVICE_ICON: Record<DeviceType, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const when = (iso: string | null) => (iso ? formatDateTime(iso) : "Never");

type Pending =
  | { kind: "password"; row: StaffAccessRow }
  | { kind: "toggle"; row: StaffAccessRow }
  | { kind: "signOut"; row: StaffAccessRow }
  | { kind: "device"; row: StaffAccessRow; device: StaffDevice };

function confirmCopy(p: Exclude<Pending, { kind: "password" }>) {
  const { name, isActive } = p.row;
  switch (p.kind) {
    case "device":
      return {
        title: `Sign ${name} out of ${p.device.name}?`,
        label: "Sign out",
        body: "That device is signed out at once. They can sign in again with their password.",
      };
    case "signOut":
      return {
        title: `Sign ${name} out everywhere?`,
        label: "Sign out everywhere",
        body: "Every device they are signed in on is signed out. They can sign in again with their password.",
      };
    case "toggle":
      return isActive
        ? {
            title: `Deactivate ${name}?`,
            label: "Deactivate",
            body: "They are signed out at once and cannot sign in until you activate them again.",
          }
        : {
            title: `Activate ${name}?`,
            label: "Activate",
            body: "They can sign in again with their current password. This uses a staff slot.",
          };
  }
}

/** Every staff login with its devices; stacks as cards on a phone. */
export function StaffAccessList({ staff }: { staff: StaffAccessRow[] }) {
  const revoke = useRevokeDevice();
  const signOut = useSignOutEverywhere();
  const update = useUpdateStaff();
  const [pending, setPending] = useState<Pending | null>(null);
  const close = () => setPending(null);
  const error = revoke.error ?? signOut.error ?? update.error;
  const busy = revoke.isPending || signOut.isPending || update.isPending;

  if (staff.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No staff accounts yet"
        message="Staff you add appear here with the devices they are signed in on."
        action={
          <Link
            to="/app/staff"
            className="font-medium text-brand-700 hover:underline"
          >
            Go to staff management
          </Link>
        }
      />
    );
  }

  const confirming = pending && pending.kind !== "password" ? pending : null;
  const copy = confirming ? confirmCopy(confirming) : null;
  const confirm = () => {
    if (!confirming) return;
    const done = { onSettled: close };
    const id = confirming.row.id;
    if (confirming.kind === "device")
      revoke.mutate({ id, sessionId: confirming.device.id }, done);
    else if (confirming.kind === "signOut") signOut.mutate(id, done);
    else
      update.mutate(
        { id, patch: { isActive: !confirming.row.isActive } },
        done,
      );
  };

  return (
    <>
      {error && (
        <div className="mb-3">
          <Alert tone="danger">{apiErrorMessage(error)}</Alert>
        </div>
      )}
      <ul className="space-y-3">
        {staff.map((s) => (
          <li key={s.id} className="rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                  {s.name}
                  <StatusChip tone={s.isActive ? "success" : "danger"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </StatusChip>
                </p>
                <p className="text-xs break-all text-ink-subtle">
                  Username: {s.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={s.activeDevices === 0}
                  icon={<LogOut className="size-4" aria-hidden="true" />}
                  onClick={() => setPending({ kind: "signOut", row: s })}
                >
                  Sign out everywhere
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<KeyRound className="size-4" aria-hidden="true" />}
                  onClick={() => setPending({ kind: "password", row: s })}
                >
                  Reset password
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Power className="size-4" aria-hidden="true" />}
                  onClick={() => setPending({ kind: "toggle", row: s })}
                >
                  {s.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-ink-subtle">Active devices</dt>
                <dd className="font-medium text-ink">{s.activeDevices}</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Last login</dt>
                <dd className="font-medium text-ink">{when(s.lastLoginAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Last active</dt>
                <dd className="font-medium text-ink">{when(s.lastActiveAt)}</dd>
              </div>
            </dl>
            {s.devices.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer font-medium text-brand-700">
                  {s.devices.length} signed-in device
                  {s.devices.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 divide-y divide-line">
                  {s.devices.map((d) => {
                    const Icon = DEVICE_ICON[d.type];
                    return (
                      <li key={d.id} className="flex items-center gap-3 py-2">
                        <Icon
                          className="size-5 shrink-0 text-ink-subtle"
                          role="img"
                          aria-label={d.type}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink">{d.name}</p>
                          <p className="text-xs text-ink-subtle">
                            Signed in {when(d.signedInAt)} · last active{" "}
                            {when(d.lastActiveAt)}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Sign ${s.name} out of ${d.name}`}
                          onClick={() =>
                            setPending({ kind: "device", row: s, device: d })
                          }
                        >
                          Sign out
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>

      {pending?.kind === "password" && (
        <SetPasswordDialog
          workerId={pending.row.id}
          name={pending.row.name}
          onClose={close}
        />
      )}
      <ConfirmDialog
        open={confirming !== null}
        tone={
          confirming?.kind === "toggle" && !confirming.row.isActive
            ? "primary"
            : "danger"
        }
        title={copy?.title ?? ""}
        confirmLabel={copy?.label ?? ""}
        busy={busy}
        onCancel={close}
        onConfirm={confirm}
      >
        {copy?.body}
      </ConfirmDialog>
    </>
  );
}
