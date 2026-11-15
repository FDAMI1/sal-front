import {
  useCustomerSession,
  usePlatformSession,
  useStaffSession,
} from "@shared/store/sessions";
import { createAuthedClient } from "./createAuthedClient";

/** Salon admin and worker calls. */
export const staffApi = createAuthedClient(useStaffSession, "/auth/refresh");
/** Super admin console calls. */
export const platformApi = createAuthedClient(
  usePlatformSession,
  "/admin/auth/refresh",
);
/** Customer calls from the QR pages. */
export const customerApi = createAuthedClient(
  useCustomerSession,
  "/customer/auth/refresh",
);
