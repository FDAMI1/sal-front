import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { StaffProfileCard } from "@modules/staff/components/StaffProfileCard";
import { StaffSignInCard } from "@modules/staff/components/StaffSignInCard";
import { StaffSkillsCard } from "@modules/staff/components/StaffSkillsCard";
import { TimeOffCard } from "@modules/staff/components/TimeOffCard";
import { WeeklyScheduleCard } from "@modules/staff/components/WeeklyScheduleCard";
import { useStaffMember } from "@modules/staff/hooks/useStaff";
import { ErrorState, PageHeader, Skeleton } from "@shared/ui";

export default function StaffDetailScreen() {
  const { staffId = "" } = useParams();
  const worker = useStaffMember(staffId);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        to="/app/staff"
        className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All staff
      </Link>
      {worker.isPending ? (
        <div aria-busy="true" aria-label="Loading staff member">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : worker.isError ? (
        <ErrorState
          title="Could not load this staff member"
          message={apiErrorMessage(worker.error)}
          onRetry={() => void worker.refetch()}
          retrying={worker.isFetching}
        />
      ) : (
        <>
          <PageHeader
            title={worker.data.name}
            description={`Shown to customers as ${worker.data.displayName}.`}
          />
          <StaffProfileCard worker={worker.data} />
          <StaffSignInCard worker={worker.data} />
          <StaffSkillsCard worker={worker.data} />
          <WeeklyScheduleCard worker={worker.data} />
          <TimeOffCard workerId={worker.data.id} />
        </>
      )}
    </div>
  );
}
