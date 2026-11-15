import { platformApi } from "@api/clients";
import type { Envelope, Paged } from "@api/envelope";
import type {
  CatalogInput,
  CreateSalonInput,
  PlanInput,
  SalonDetail,
  SalonLimits,
  SalonListItem,
  SalonListMeta,
  SalonStatus,
  SalonUser,
} from "@modules/admin/types";
import type { CatalogItem, Plan } from "@modules/salon/types";

type Action = { id: string; status: SalonStatus };

export const adminSalonApi = {
  list: async (q: {
    status?: SalonStatus;
    search?: string;
    page: number;
  }): Promise<Paged<SalonListItem, SalonListMeta>> => {
    const res = await platformApi.get<
      Envelope<SalonListItem[]> & { meta: SalonListMeta }
    >("/admin/salons", {
      params: {
        page: q.page,
        limit: 20,
        ...(q.status ? { status: q.status } : {}),
        ...(q.search ? { search: q.search } : {}),
      },
    });
    return { items: res.data.data, meta: res.data.meta };
  },

  detail: async (id: string) =>
    (await platformApi.get<Envelope<SalonDetail>>(`/admin/salons/${id}`)).data
      .data,

  approve: async (id: string) =>
    (await platformApi.post<Envelope<Action>>(`/admin/salons/${id}/approve`))
      .data.data,

  reject: async (id: string, reason: string) =>
    (
      await platformApi.post<Envelope<Action>>(`/admin/salons/${id}/reject`, {
        reason,
      })
    ).data.data,

  suspend: async (id: string, reason: string) =>
    (
      await platformApi.post<Envelope<Action>>(`/admin/salons/${id}/suspend`, {
        reason,
      })
    ).data.data,

  reactivate: async (id: string) =>
    (await platformApi.post<Envelope<Action>>(`/admin/salons/${id}/reactivate`))
      .data.data,

  assignPlan: (id: string, planId: string | null) =>
    platformApi.put(`/admin/salons/${id}/plan`, { planId }),

  create: async (input: CreateSalonInput) =>
    (
      await platformApi.post<Envelope<{ salonId: string; salonName: string }>>(
        "/admin/salons",
        input,
      )
    ).data.data,

  setLimits: (id: string, limits: SalonLimits) =>
    platformApi.put(`/admin/salons/${id}/limits`, limits),

  users: async (id: string) =>
    (await platformApi.get<Envelope<SalonUser[]>>(`/admin/salons/${id}/users`))
      .data.data,

  createAdmin: (
    id: string,
    input: {
      name: string;
      email: string;
      phone: string | null;
      password: string;
    },
  ) => platformApi.post(`/admin/salons/${id}/users`, input),

  updateUser: (
    id: string,
    userId: string,
    patch: { isActive?: boolean; password?: string },
  ) => platformApi.patch(`/admin/salons/${id}/users/${userId}`, patch),

  signOutUser: (id: string, userId: string) =>
    platformApi.post(`/admin/salons/${id}/users/${userId}/sign-out`),
};

export const catalogAdminApi = {
  list: async () =>
    (
      await platformApi.get<Envelope<CatalogItem[]>>("/admin/catalog", {
        params: { includeInactive: "true" },
      })
    ).data.data,

  create: (input: CatalogInput) => platformApi.post("/admin/catalog", input),

  update: (id: string, patch: Partial<CatalogInput> & { isActive?: boolean }) =>
    platformApi.patch(`/admin/catalog/${id}`, patch),

  remove: (id: string) => platformApi.delete(`/admin/catalog/${id}`),
};

export const planApi = {
  list: async () =>
    (await platformApi.get<Envelope<Plan[]>>("/admin/plans")).data.data,

  create: async (input: PlanInput) =>
    (await platformApi.post<Envelope<Plan>>("/admin/plans", input)).data.data,

  update: async (
    id: string,
    patch: Partial<Omit<PlanInput, "code">> & { isActive?: boolean },
  ) =>
    (await platformApi.patch<Envelope<Plan>>(`/admin/plans/${id}`, patch)).data
      .data,
};
