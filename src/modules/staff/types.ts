export interface WorkerListItem {
  id: string;
  userId: string;
  displayName: string;
  name: string;
  email: string;
  phone: string | null;
  canSignIn: boolean;
  lastLoginAt: string | null;
  skillCount: number;
}

export interface TimeSpan {
  /** "HH:mm" */
  start: string;
  end: string;
}

export interface ScheduleDay extends TimeSpan {
  /** 0 = Sunday */
  day: number;
  isWorking: boolean;
  breaks: TimeSpan[];
}

export interface WorkerDetail extends WorkerListItem {
  /** Menu service ids. */
  skills: string[];
  weeklySchedule: ScheduleDay[];
}

export interface CreateStaffInput {
  name: string;
  displayName?: string;
  email: string;
  phone: string | null;
  password: string;
}

export interface UpdateStaffInput {
  name?: string;
  displayName?: string;
  phone?: string | null;
  isActive?: boolean;
  password?: string;
}

export interface TimeOffInput {
  /** "YYYY-MM-DD" */
  from: string;
  to: string;
  reason: string;
}

export interface TimeOff extends TimeOffInput {
  id: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  gender: "men" | "women" | "unisex";
  durationMinutes: number;
  pricePaise: number;
  isActive: boolean;
}

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface StaffDevice {
  /** Session id. */
  id: string;
  type: DeviceType;
  name: string;
  ip: string | null;
  signedInAt: string | null;
  lastActiveAt: string | null;
}

export interface StaffAccessRow {
  /** Worker id. */
  id: string;
  userId: string;
  name: string;
  displayName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  activeDevices: number;
  devices: StaffDevice[];
}

/** null = no cap. */
export interface StaffLimits {
  maxStaff: number | null;
  devicesPerStaff: number;
  policy: { maxStaff: number | null; devicesPerStaff: number | null };
  subscription: {
    maxStaff: number | null;
    devicesPerStaff: number;
    planName: string | null;
  };
}

export interface StaffAccess {
  limits: StaffLimits;
  counts: {
    total: number;
    active: number;
    inactive: number;
    available: number | null;
  };
  staff: StaffAccessRow[];
}

/** null = as many as the subscription allows. */
export interface StaffPolicyInput {
  maxStaff: number | null;
  devicesPerStaff: number | null;
}
