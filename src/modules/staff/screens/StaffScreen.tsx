import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, UserPlus, Users } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { AddStaffDialog } from "@modules/staff/components/StaffDialogs";
import { useStaffList } from "@modules/staff/hooks/useStaff";
import { formatDateTime } from "@shared/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusChip,
} from "@shared/ui";

export default function StaffScreen() {
  const staff = useStaffList();
  const [adding, setAdding] = useState(false);
  const addButton = (
    <Button
      icon={<UserPlus className="size-4" aria-hidden="true" />}
      onClick={() => setAdding(true)}
    >
      Add staff
    </Button>
  );

  let body;
  if (staff.isPending) {
    body = (
      <div aria-busy="true" aria-label="Loading staff">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  } else if (staff.isError) {
    body = (
      <ErrorState
        title="Could not load staff"
        message={apiErrorMessage(staff.error)}
        onRetry={() => void staff.refetch()}
        retrying={staff.isFetching}
      />
    );
  } else if (staff.data.length === 0) {
    body = (
      <EmptyState
        icon={Users}
        title="No staff yet"
        message="Add the people who work at your salon. Each gets their own sign-in."
        action={addButton}
      />
    );
  } else {
    body = (
      <ul className="divide-y divide-line">
        {staff.data.map((w) => (
          <li key={w.id}>
            <Link
              to={`/app/staff/${w.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-canvas"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                  {w.name}
                  {w.displayName !== w.name && (
                    <span className="font-normal text-ink-subtle">
                      ({w.displayName})
                    </span>
                  )}
                  <StatusChip tone={w.canSignIn ? "success" : "danger"}>
                    {w.canSignIn ? "Active" : "Inactive"}
                  </StatusChip>
                </p>
                <p className="text-xs break-all text-ink-subtle">
                  {[
                    w.email,
                    w.phone,
                    `${w.skillCount} skill${w.skillCount === 1 ? "" : "s"}`,
                    w.lastLoginAt
                      ? `last sign-in ${formatDateTime(w.lastLoginAt)}`
                      : "never signed in",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-ink-subtle"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Staff management"
        description="Logins, skills and working hours of everyone at your salon."
        actions={staff.isSuccess && staff.data.length === 0 ? null : addButton}
      />
      <Card>{body}</Card>
      {adding && <AddStaffDialog onClose={() => setAdding(false)} />}
    </div>
  );
}
