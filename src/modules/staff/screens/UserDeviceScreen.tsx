import { apiErrorMessage } from "@api/apiClient";
import { AccessLimitsCard } from "@modules/staff/components/AccessLimitsCard";
import { StaffAccessList } from "@modules/staff/components/StaffAccessList";
import { useStaffAccess } from "@modules/staff/hooks/useStaff";
import { Card, ErrorState, PageHeader, Skeleton } from "@shared/ui";

const show = (n: number | null) => (n === null ? "Unlimited" : String(n));

export default function UserDeviceScreen() {
  const access = useStaffAccess();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="User & device management"
        description="How many staff can sign in, on how many devices, and who is signed in where."
      />
      {access.isPending ? (
        <div aria-busy="true" aria-label="Loading staff access">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : access.isError ? (
        <ErrorState
          title="Could not load staff access"
          message={apiErrorMessage(access.error)}
          onRetry={() => void access.refetch()}
          retrying={access.isFetching}
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Maximum staff accounts", show(access.data.limits.maxStaff)],
              ["Currently active", show(access.data.counts.active)],
              ["Available", show(access.data.counts.available)],
              ["Inactive", show(access.data.counts.inactive)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-line bg-surface p-4 shadow-xs"
              >
                <dt className="text-xs text-ink-subtle">{label}</dt>
                <dd className="mt-1 text-xl font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <AccessLimitsCard limits={access.data.limits} />
          <Card
            title="Staff accounts"
            description="Passwords are never shown. Reset one to set a new password."
          >
            <StaffAccessList staff={access.data.staff} />
          </Card>
        </>
      )}
    </div>
  );
}
