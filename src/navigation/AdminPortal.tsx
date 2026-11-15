import { Navigate } from "react-router";
import { useAdminLogout, useAdminMe } from "@modules/admin/hooks/useAdminAuth";
import { usePlatformSession } from "@shared/store/sessions";
import AppLayout from "./AppLayout";
import { ADMIN_NAV, ADMIN_TABS } from "./navItems";

/** Guard and shell for the super admin console (/admin). */
export default function AdminPortal() {
  const profile = usePlatformSession((s) => s.profile);
  const logout = useAdminLogout();
  useAdminMe();

  if (!profile) return <Navigate to="/admin/login" replace />;

  return (
    <AppLayout
      items={ADMIN_NAV}
      tabs={ADMIN_TABS}
      account={{ name: profile.name, detail: "Super admin" }}
      onSignOut={() => logout.mutate()}
      signingOut={logout.isPending}
    />
  );
}
