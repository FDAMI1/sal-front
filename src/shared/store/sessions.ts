import type { StaffUser } from "@modules/auth/types";
import type { PlatformAdmin } from "@modules/admin/types";
import type { CustomerProfile } from "@modules/public/types";
import { createSessionStore } from "./createSessionStore";

/** One store per portal: each signs in independently with its own tokens. */
export const useStaffSession = createSessionStore<StaffUser>("sq.staff");
export const usePlatformSession =
  createSessionStore<PlatformAdmin>("sq.platform");
export const useCustomerSession =
  createSessionStore<CustomerProfile>("sq.customer");
