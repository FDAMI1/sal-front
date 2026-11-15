import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@modules/system/api/systemApi";

/** Polls the status so the page notices an outage without a reload. */
export const useSystemStatus = () =>
  useQuery({
    queryKey: ["system-status"],
    queryFn: systemApi.status,
    refetchInterval: 30_000,
  });
