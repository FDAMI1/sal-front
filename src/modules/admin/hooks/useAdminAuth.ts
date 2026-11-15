import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAuthApi } from "@modules/admin/api/adminAuthApi";
import { usePlatformSession } from "@shared/store/sessions";

export const adminMeKey = ["admin", "me"] as const;

export function useAdminLogin() {
  const setSession = usePlatformSession((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAuthApi.login,
    onSuccess: (signedIn) => {
      queryClient.clear();
      setSession(signedIn);
    },
  });
}

/** Signs out locally even if the server call fails (see useLogout). */
export function useAdminLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = usePlatformSession.getState().refreshToken;
      if (token) await adminAuthApi.logout(token).catch(() => undefined);
    },
    onSettled: () => {
      usePlatformSession.getState().clear();
      queryClient.clear();
    },
  });
}

export function useAdminMe() {
  const setProfile = usePlatformSession((s) => s.setProfile);
  return useQuery({
    queryKey: adminMeKey,
    queryFn: async () => {
      const me = await adminAuthApi.me();
      setProfile(me);
      return me;
    },
  });
}
