/**
 * Mirror of backend/src/config/roles.ts. Only decides what navigation to
 * show; the server checks every request itself. A backend test fails if the
 * two lists drift apart.
 */
export type StaffRole = "salon_admin" | "worker";

export const PERMISSIONS = [
  "salon.manage",
  "services.manage",
  "staff.manage",
  "queue.view",
  "queue.manage",
  "queue.serve",
  "appointments.view",
  "appointments.manage",
  "customers.view",
  "billing.collect",
  "payments.refund",
  "analytics.view",
  "expenses.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<StaffRole, string> = {
  salon_admin: "/app/dashboard",
  worker: "/worker",
};

export function can(
  user: { permissions: readonly string[] } | null,
  permission: Permission,
): boolean {
  return Boolean(user?.permissions.includes(permission));
}
