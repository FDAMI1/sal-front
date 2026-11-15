import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type {
  CatalogItem,
  MenuService,
  MenuServiceInput,
  ServiceGender,
} from "@modules/salon/types";

export interface ImportResult {
  added: number;
  skipped: number;
}

export const serviceMenuApi = {
  catalog: async (gender?: ServiceGender) =>
    (
      await staffApi.get<Envelope<CatalogItem[]>>("/catalog", {
        params: gender ? { gender } : {},
      })
    ).data.data,

  list: async () =>
    (await staffApi.get<Envelope<MenuService[]>>("/services")).data.data,

  create: async (input: MenuServiceInput) =>
    (await staffApi.post<Envelope<MenuService>>("/services", input)).data.data,

  update: async (
    id: string,
    patch: Partial<MenuServiceInput> & { isActive?: boolean },
  ) =>
    (await staffApi.patch<Envelope<MenuService>>(`/services/${id}`, patch)).data
      .data,

  remove: (id: string) => staffApi.delete(`/services/${id}`),

  importFromCatalog: async (catalogIds: string[]) =>
    (
      await staffApi.post<Envelope<ImportResult>>("/services/import", {
        catalogIds,
      })
    ).data.data,
};
