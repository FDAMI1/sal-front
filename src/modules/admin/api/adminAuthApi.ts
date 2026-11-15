import type { Envelope } from "@api/envelope";
import { apiClient } from "@api/apiClient";
import { platformApi } from "@api/clients";
import { describeDevice, getDeviceId } from "@api/deviceId";
import type { SignedIn } from "@modules/auth/types";
import type { PlatformAdmin } from "@modules/admin/types";

export const adminAuthApi = {
  login: async (input: {
    email: string;
    password: string;
    signOutOthers?: boolean;
  }): Promise<SignedIn<PlatformAdmin>> => {
    const res = await apiClient.post<
      Envelope<{
        accessToken: string;
        refreshToken: string;
        admin: PlatformAdmin;
      }>
    >("/admin/auth/login", {
      ...input,
      deviceId: getDeviceId(),
      deviceName: describeDevice(),
    });
    const { accessToken, refreshToken, admin } = res.data.data;
    return { accessToken, refreshToken, profile: admin };
  },

  logout: (refreshToken: string) =>
    apiClient.post("/admin/auth/logout", { refreshToken }),

  me: async () =>
    (await platformApi.get<Envelope<PlatformAdmin>>("/admin/me")).data.data,
};
