import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminSalonApi, planApi } from "@modules/admin/api/adminSalonApi";
import type { PlanInput, SalonLimits, SalonStatus } from "@modules/admin/types";

const salonsKey = ["admin", "salons"] as const;
const plansKey = ["admin", "plans"] as const;

export const useAdminSalons = (q: {
  status?: SalonStatus;
  search?: string;
  page: number;
}) =>
  useQuery({
    queryKey: [...salonsKey, "list", q],
    queryFn: () => adminSalonApi.list(q),
    placeholderData: keepPreviousData,
  });

export const useAdminSalon = (id: string) =>
  useQuery({
    queryKey: [...salonsKey, id],
    queryFn: () => adminSalonApi.detail(id),
  });

export type SalonAction =
  | { kind: "approve" }
  | { kind: "reactivate" }
  | { kind: "reject"; reason: string }
  | { kind: "suspend"; reason: string }
  | { kind: "plan"; planId: string | null }
  | { kind: "limits"; limits: SalonLimits };

/** Every console action on a salon; lists, counts and the detail refresh after. */
export function useSalonAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: SalonAction) => {
      switch (action.kind) {
        case "approve":
          return adminSalonApi.approve(id);
        case "reactivate":
          return adminSalonApi.reactivate(id);
        case "reject":
          return adminSalonApi.reject(id, action.reason);
        case "suspend":
          return adminSalonApi.suspend(id, action.reason);
        case "plan":
          return adminSalonApi.assignPlan(id, action.planId);
        case "limits":
          return adminSalonApi.setLimits(id, action.limits);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: salonsKey }),
  });
}

export function useCreateSalon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminSalonApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: salonsKey }),
  });
}

const usersKey = (id: string) => [...salonsKey, id, "users"] as const;

export const useSalonUsers = (id: string) =>
  useQuery({ queryKey: usersKey(id), queryFn: () => adminSalonApi.users(id) });

export type SalonUserAction =
  | {
      kind: "create";
      input: {
        name: string;
        email: string;
        phone: string | null;
        password: string;
      };
    }
  | { kind: "update"; userId: string; isActive?: boolean; password?: string }
  | { kind: "signOut"; userId: string };

/** Accounts and sign-in control; the salon detail refreshes too (user count). */
export function useSalonUserAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: SalonUserAction) => {
      switch (a.kind) {
        case "create":
          return adminSalonApi.createAdmin(id, a.input);
        case "update":
          return adminSalonApi.updateUser(id, a.userId, {
            isActive: a.isActive,
            password: a.password,
          });
        case "signOut":
          return adminSalonApi.signOutUser(id, a.userId);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [...salonsKey, id] }),
  });
}

export const usePlans = () =>
  useQuery({ queryKey: plansKey, queryFn: planApi.list });

export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; input: PlanInput; isActive?: boolean }) => {
      if (!v.id) return planApi.create(v.input);
      const { code: _code, ...patch } = v.input;
      return planApi.update(v.id, { ...patch, isActive: v.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: plansKey }),
  });
}
