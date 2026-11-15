import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogAdminApi } from "@modules/admin/api/adminSalonApi";
import type { CatalogInput } from "@modules/admin/types";

const catalogKey = ["admin", "catalog"] as const;

export const useAdminCatalog = () =>
  useQuery({ queryKey: catalogKey, queryFn: catalogAdminApi.list });

export type CatalogAction =
  | { kind: "create"; input: CatalogInput }
  | {
      kind: "update";
      id: string;
      patch: Partial<CatalogInput> & { isActive?: boolean };
    }
  | { kind: "remove"; id: string };

export function useCatalogAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: CatalogAction) => {
      switch (a.kind) {
        case "create":
          return catalogAdminApi.create(a.input);
        case "update":
          return catalogAdminApi.update(a.id, a.patch);
        case "remove":
          return catalogAdminApi.remove(a.id);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: catalogKey }),
  });
}
