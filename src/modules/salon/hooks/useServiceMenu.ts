import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceMenuApi } from "@modules/salon/api/serviceMenuApi";
import type { MenuServiceInput } from "@modules/salon/types";

export const menuKey = ["services"] as const;

export const useServiceMenu = () =>
  useQuery({ queryKey: menuKey, queryFn: serviceMenuApi.list });

/** Only fetched once the import dialog opens. */
export const useCatalog = (enabled: boolean) =>
  useQuery({
    queryKey: ["catalog"],
    queryFn: () => serviceMenuApi.catalog(),
    enabled,
    staleTime: 5 * 60_000,
  });

export type MenuAction =
  | { kind: "create"; input: MenuServiceInput }
  | {
      kind: "update";
      id: string;
      patch: Partial<MenuServiceInput> & { isActive?: boolean };
    }
  | { kind: "remove"; id: string }
  | { kind: "import"; catalogIds: string[] };

/** Every change to the salon's menu; the list refreshes after each. */
export function useMenuAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: MenuAction) => {
      switch (a.kind) {
        case "create":
          await serviceMenuApi.create(a.input);
          return null;
        case "update":
          await serviceMenuApi.update(a.id, a.patch);
          return null;
        case "remove":
          await serviceMenuApi.remove(a.id);
          return null;
        case "import":
          return serviceMenuApi.importFromCatalog(a.catalogIds);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: menuKey }),
  });
}
