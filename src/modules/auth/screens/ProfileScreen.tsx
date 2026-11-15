import { apiErrorMessage } from "@api/apiClient";
import { ChangePasswordCard } from "@modules/auth/components/ChangePasswordCard";
import { ProfileDetailsCard } from "@modules/auth/components/ProfileDetailsCard";
import { SessionsCard } from "@modules/auth/components/SessionsCard";
import { useMe } from "@modules/auth/hooks/useAuth";
import { ErrorState, Skeleton } from "@shared/ui";

/** The signed-in staff member's own account. Same screen for both roles. */
export default function ProfileScreen() {
  const me = useMe();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">My account</h1>
        <p className="mt-1 text-ink-subtle">
          Your details, password and devices.
        </p>
      </div>
      {me.isPending ? (
        <div aria-busy="true" aria-label="Loading your account">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : me.isError ? (
        <ErrorState
          title="Could not load your account"
          message={apiErrorMessage(me.error)}
          onRetry={() => void me.refetch()}
          retrying={me.isFetching}
        />
      ) : (
        <ProfileDetailsCard key={me.data.id} user={me.data} />
      )}
      <ChangePasswordCard />
      <SessionsCard />
    </div>
  );
}
