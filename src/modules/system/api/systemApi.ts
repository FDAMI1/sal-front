import { platformApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type { SystemStatus, SystemStatusData } from "@modules/system/types";

export const systemApi = {
  /** Platform health; the server only answers a signed-in super admin. */
  status: async (): Promise<SystemStatus> => {
    const started = performance.now();
    const res = await platformApi.get<Envelope<SystemStatusData>>(
      "/admin/system/status",
    );
    return {
      ...res.data.data,
      latencyMs: Math.round(performance.now() - started),
    };
  },
};
