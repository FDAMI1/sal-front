import { Navigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useLogout, useMe } from "@modules/auth/hooks/useAuth";
import { useBookingAlerts } from "@modules/notifications/alerts";
import { salonApi } from "@modules/salon/api/salonApi";
import { salonKey } from "@modules/salon/hooks/useSalon";
import { can, ROLE_HOME, type StaffRole } from "@shared/permissions";
import { useStaffSession } from "@shared/store/sessions";
import AppLayout from "./AppLayout";
import type { MobileTab, NavItem } from "./navItems";

const ROLE_LABEL: Record<StaffRole, string> = {
  salon_admin: "Salon admin",
  worker: "Stylist",
};

/**
 * Guard and shell for the salon admin (/app) and worker (/worker) portals.
 * Signed out → sign-in page, keeping where they were going. Wrong role →
 * their own portal. The server refuses wrong-role calls anyway; this only
 * keeps people out of screens they cannot use.
 */
export default function StaffPortal({
  role,
  items,
  tabs,
}: {
  role: StaffRole;
  items: NavItem[];
  tabs: MobileTab[];
}) {
  const profile = useStaffSession((s) => s.profile);
  const location = useLocation();
  const logout = useLogout();
  // Re-validates the stored session on load; a refused refresh clears it,
  // which re-renders this guard into the redirect below.
  useMe();
  // Salon admins get the salon's name in the header and the booking alert
  // sound; a worker's token may not read the salon profile.
  const isAdmin = profile?.role === "salon_admin" && role === "salon_admin";
  const salon = useQuery({
    queryKey: salonKey,
    queryFn: salonApi.get,
    enabled: isAdmin,
  });
  useBookingAlerts(isAdmin);

  if (!profile) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (profile.role !== role)
    return <Navigate to={ROLE_HOME[profile.role]} replace />;

  return (
    <AppLayout
      items={items.filter(
        (it) => !it.permission || can(profile, it.permission),
      )}
      tabs={tabs}
      account={{
        name: profile.name,
        detail: ROLE_LABEL[profile.role],
        salonName: salon.data?.name,
        accountPath:
          role === "salon_admin" ? "/app/account" : "/worker/account",
      }}
      onSignOut={() => logout.mutate()}
      signingOut={logout.isPending}
    />
  );
}
