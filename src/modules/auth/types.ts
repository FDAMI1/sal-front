import type { Permission, StaffRole } from "@shared/permissions";

/** A signed-in salon admin or worker (backend user.dto.ts). */
export interface StaffUser {
  id: string;
  salonId: string;
  role: StaffRole;
  permissions: Permission[];
  name: string;
  email: string;
  phone: string | null;
  branchIds: string[];
  lastLoginAt: string | null;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  userAgent: string;
  ip: string;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
}

export interface LoginInput {
  identifier: string;
  password: string;
  signOutOthers?: boolean;
}

export interface SignedIn<P> {
  accessToken: string;
  refreshToken: string;
  profile: P;
}
