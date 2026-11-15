import type {
  Plan,
  RegisterSalonInput,
  SalonContact,
  ServiceGender,
} from "@modules/salon/types";
import type { PageMeta } from "@api/envelope";

/** A signed-in super admin (backend adminAuth.service.ts). */
export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  lastLoginAt: string | null;
}

export type SalonStatus = "pending" | "approved" | "rejected" | "suspended";

export interface SalonListItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  status: SalonStatus;
  planId: string | null;
  createdAt: string | null;
}

export interface SalonListMeta extends PageMeta {
  counts: Record<Exclude<SalonStatus, never>, number>;
}

export interface SalonDetail extends SalonListItem {
  contact: SalonContact;
  approvalNote: string;
  approvalDecidedAt: string | null;
  suspendedReason: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  /** Active worker accounts: what the staff limit counts. */
  staffCount: number;
  limits: {
    /** Super admin overrides; null = use the plan / server default. */
    overrides: SalonLimits;
    /** What actually applies now; null = no cap. */
    effective: SalonLimits & { devicesPerUser: number };
  };
  plan: Plan | null;
  history: {
    action: string;
    adminName: string;
    metadata: Record<string, unknown>;
    at: string;
  }[];
}

export interface SalonLimits {
  users: number | null;
  devicesPerUser: number | null;
}

/** A sign-in account of a salon, as the super admin sees it. */
export interface SalonUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "salon_admin" | "worker";
  isOwner: boolean;
  isActive: boolean;
  isLocked: boolean;
  activeSessions: number;
  lastLoginAt: string | null;
}

export interface CreateSalonInput extends RegisterSalonInput {
  planId: string | null;
}

export interface CatalogInput {
  name: string;
  category: string;
  gender: ServiceGender;
  description: string;
  defaultDurationMinutes: number;
  defaultPricePaise: number;
}

export interface PlanInput {
  code: string;
  name: string;
  description: string;
  pricePaise: number;
  interval: "month" | "year";
  limits: { workers: number; devicesPerUser: number | null };
}
