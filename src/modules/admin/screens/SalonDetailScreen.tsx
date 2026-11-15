import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Ban, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { ReasonDialog } from "@modules/admin/components/ReasonDialog";
import { SalonLimitsCard } from "@modules/admin/components/SalonLimitsCard";
import { SalonPlanCard } from "@modules/admin/components/SalonPlanCard";
import { SalonUsersCard } from "@modules/admin/components/SalonUsersCard";
import { SalonStatusChip } from "@modules/admin/components/SalonStatusChip";
import {
  useAdminSalon,
  useSalonAction,
} from "@modules/admin/hooks/useAdminSalons";
import type { SalonDetail } from "@modules/admin/types";
import { formatDateTime } from "@shared/format";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@shared/ui";

const ACTION_LABEL: Record<string, string> = {
  "salon.approve": "Approved",
  "salon.reject": "Rejected",
  "salon.suspend": "Suspended",
  "salon.reactivate": "Reactivated",
  "salon.plan": "Changed plan",
  "salon.create": "Created the salon",
  "salon.limits": "Changed limits",
  "salon.admin.create": "Added a salon admin",
  "salon.user.update": "Changed a login",
  "salon.user.signout": "Signed a login out everywhere",
};

/** A login change says what changed: enabled, disabled, new password. */
function historyLabel(h: SalonDetail["history"][number]) {
  if (h.action !== "salon.user.update") {
    return ACTION_LABEL[h.action] ?? h.action;
  }
  const parts = [
    h.metadata.isActive === false ? "Disabled a login" : "",
    h.metadata.isActive === true ? "Enabled a login" : "",
    h.metadata.passwordReset === true ? "Set a new password" : "",
  ].filter(Boolean);
  return parts.join(", ") || "Changed a login";
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-3">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="font-medium break-all text-ink sm:col-span-2">
        {children || "—"}
      </dd>
    </div>
  );
}

function Actions({ salon }: { salon: SalonDetail }) {
  const action = useSalonAction(salon.id);
  const [open, setOpen] = useState<
    "approve" | "reactivate" | "reject" | "suspend" | null
  >(null);
  const close = () => setOpen(null);
  const done = { onSettled: close };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(salon.status === "pending" || salon.status === "rejected") && (
          <Button
            icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
            onClick={() => setOpen("approve")}
          >
            Approve
          </Button>
        )}
        {salon.status === "pending" && (
          <Button
            variant="secondary"
            icon={<XCircle className="size-4" aria-hidden="true" />}
            onClick={() => setOpen("reject")}
          >
            Reject
          </Button>
        )}
        {salon.status === "approved" && (
          <Button
            variant="danger"
            icon={<Ban className="size-4" aria-hidden="true" />}
            onClick={() => setOpen("suspend")}
          >
            Suspend
          </Button>
        )}
        {salon.status === "suspended" && (
          <Button
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
            onClick={() => setOpen("reactivate")}
          >
            Reactivate
          </Button>
        )}
      </div>
      {action.isError && (
        <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
      )}

      <ConfirmDialog
        open={open === "approve" || open === "reactivate"}
        tone="primary"
        title={
          open === "approve"
            ? `Approve ${salon.name}?`
            : `Reactivate ${salon.name}?`
        }
        confirmLabel={open === "approve" ? "Approve" : "Reactivate"}
        busy={action.isPending}
        onCancel={close}
        onConfirm={() =>
          action.mutate(
            { kind: open === "approve" ? "approve" : "reactivate" },
            done,
          )
        }
      >
        Its staff can sign in and its customer pages go live.
      </ConfirmDialog>
      <ReasonDialog
        open={open === "reject"}
        title={`Reject ${salon.name}?`}
        description="The owner sees this reason when they try to sign in."
        confirmLabel="Reject"
        busy={action.isPending}
        onClose={close}
        onConfirm={(reason) => action.mutate({ kind: "reject", reason }, done)}
      />
      <ReasonDialog
        open={open === "suspend"}
        title={`Suspend ${salon.name}?`}
        description="Everyone at this salon is signed out at once and its customer pages stop working."
        confirmLabel="Suspend"
        busy={action.isPending}
        onClose={close}
        onConfirm={(reason) => action.mutate({ kind: "suspend", reason }, done)}
      />
    </div>
  );
}

export default function SalonDetailScreen() {
  const { salonId = "" } = useParams();
  const salon = useAdminSalon(salonId);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        to="/admin/salons"
        className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All salons
      </Link>
      {salon.isPending ? (
        <div aria-busy="true" aria-label="Loading salon">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : salon.isError ? (
        <ErrorState
          title="Could not load this salon"
          message={apiErrorMessage(salon.error)}
          onRetry={() => void salon.refetch()}
          retrying={salon.isFetching}
        />
      ) : (
        <>
          <PageHeader
            title={
              <span className="flex flex-wrap items-center gap-2">
                {salon.data.name} <SalonStatusChip status={salon.data.status} />
              </span>
            }
            description={
              salon.data.createdAt
                ? `Registered ${formatDateTime(salon.data.createdAt)}`
                : undefined
            }
          />
          <Card title="Actions">
            {salon.data.status === "rejected" && salon.data.approvalNote && (
              <p className="mb-3 text-ink-subtle">
                Rejected: {salon.data.approvalNote}
              </p>
            )}
            {salon.data.status === "suspended" &&
              salon.data.suspendedReason && (
                <p className="mb-3 text-ink-subtle">
                  Suspended: {salon.data.suspendedReason}
                </p>
              )}
            <Actions salon={salon.data} />
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Owner">
              <dl className="divide-y divide-line">
                <Row label="Name">{salon.data.owner?.name}</Row>
                <Row label="Email">{salon.data.owner?.email}</Row>
                <Row label="Mobile">{salon.data.owner?.phone}</Row>
              </dl>
            </Card>
            <Card title="Salon">
              <dl className="divide-y divide-line">
                <Row label="Contact">
                  {[salon.data.contact.phone, salon.data.contact.email]
                    .filter(Boolean)
                    .join(" · ")}
                </Row>
                <Row label="Address">
                  {[
                    salon.data.contact.addressLine,
                    salon.data.contact.city,
                    salon.data.contact.state,
                    salon.data.contact.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Row>
                <Row label="Active staff">{String(salon.data.staffCount)}</Row>
              </dl>
            </Card>
          </div>
          <SalonPlanCard
            key={salon.data.plan?.id ?? "none"}
            salon={salon.data}
          />
          <SalonLimitsCard
            key={JSON.stringify(salon.data.limits.overrides)}
            salon={salon.data}
          />
          <SalonUsersCard salon={salon.data} />
          <Card
            title="History"
            description="Every super admin action on this salon."
          >
            {salon.data.history.length === 0 ? (
              <p className="text-ink-subtle">No actions yet.</p>
            ) : (
              <ol className="divide-y divide-line">
                {salon.data.history.map((h, i) => (
                  <li key={`${h.at}-${i}`} className="py-2.5">
                    <p className="font-medium text-ink">
                      {historyLabel(h)}{" "}
                      <span className="font-normal text-ink-subtle">
                        by {h.adminName}
                      </span>
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {formatDateTime(h.at)}
                      {[h.metadata.reason, h.metadata.email]
                        .filter((v) => typeof v === "string")
                        .map((v) => ` · ${String(v)}`)
                        .join("")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
