import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@modules/auth/api/authApi";
import type { LoginInput } from "@modules/auth/types";
import { useStaffSession } from "@shared/store/sessions";

export const meKey = ["me"] as const;
export const sessionsKey = ["sessions"] as const;

export function useLogin() {
  const setSession = useStaffSession((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (signedIn) => {
      // Nothing cached for a previous account may show for this one.
      queryClient.clear();
      setSession(signedIn);
    },
  });
}

/**
 * Ends the session on the server, then locally even if that call fails: the
 * user asked to be signed out of this device, and a dead network must not
 * leave them signed in.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = useStaffSession.getState().refreshToken;
      if (token) await authApi.logout(token).catch(() => undefined);
    },
    onSettled: () => {
      useStaffSession.getState().clear();
      queryClient.clear();
    },
  });
}

/** The signed-in account, re-read from the server so a stale copy is replaced. */
export function useMe() {
  const setProfile = useStaffSession((s) => s.setProfile);
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      const me = await authApi.me();
      setProfile(me);
      return me;
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const setProfile = useStaffSession((s) => s.setProfile);
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (me) => {
      setProfile(me);
      queryClient.setQueryData(meKey, me);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}

export const useSessions = () =>
  useQuery({ queryKey: sessionsKey, queryFn: authApi.sessions });

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.endSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}

export function useSignOutOtherDevices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.signOutOtherDevices,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}

export const useForgotPassword = () =>
  useMutation({ mutationFn: authApi.forgotPassword });
export const useResetPassword = () =>
  useMutation({ mutationFn: authApi.resetPassword });
