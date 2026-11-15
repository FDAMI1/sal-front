import type { Envelope } from "@api/envelope";
import { apiClient } from "@api/apiClient";
import { staffApi } from "@api/clients";
import { describeDevice, getDeviceId } from "@api/deviceId";
import type {
  DeviceSession,
  LoginInput,
  SignedIn,
  StaffUser,
} from "@modules/auth/types";

const device = () => ({
  deviceId: getDeviceId(),
  deviceName: describeDevice(),
});

/**
 * Sign-in, sign-out and reset go through the plain client: they carry no
 * access token, and a 401 from them means wrong credentials, never "refresh
 * and replay".
 */
export const authApi = {
  login: async (input: LoginInput): Promise<SignedIn<StaffUser>> => {
    const res = await apiClient.post<
      Envelope<{ accessToken: string; refreshToken: string; user: StaffUser }>
    >("/auth/login", { ...input, ...device() });
    const { accessToken, refreshToken, user } = res.data.data;
    return { accessToken, refreshToken, profile: user };
  },

  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout", { refreshToken }),

  forgotPassword: async (email: string) =>
    (
      await apiClient.post<{ message: string }>("/auth/forgot-password", {
        email,
      })
    ).data.message,

  resetPassword: async (input: {
    email: string;
    code: string;
    password: string;
  }) =>
    (await apiClient.post<{ message: string }>("/auth/reset-password", input))
      .data.message,

  me: async () =>
    (await staffApi.get<Envelope<StaffUser>>("/users/me")).data.data,

  updateMe: async (patch: { name?: string; phone?: string | null }) =>
    (await staffApi.patch<Envelope<StaffUser>>("/users/me", patch)).data.data,

  changePassword: async (input: {
    currentPassword: string;
    newPassword: string;
  }) =>
    (
      await staffApi.post<{ message: string }>(
        "/users/me/change-password",
        input,
      )
    ).data.message,

  sessions: async () =>
    (await staffApi.get<Envelope<DeviceSession[]>>("/auth/sessions")).data.data,

  endSession: (id: string) => staffApi.delete(`/auth/sessions/${id}`),

  signOutOtherDevices: async () =>
    (
      await staffApi.post<{ message: string }>("/auth/logout-all", {
        keepCurrent: true,
      })
    ).data.message,
};
