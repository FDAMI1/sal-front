import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SessionState<P> {
  accessToken: string | null;
  refreshToken: string | null;
  profile: P | null;
  /** Why the server ended this session (salon suspended…), for the sign-in page. */
  endedReason: string | null;
  setSession: (session: TokenPair & { profile: P }) => void;
  setTokens: (tokens: TokenPair) => void;
  setProfile: (profile: P) => void;
  /** Signed out by the user. */
  clear: () => void;
  /** Signed out by the server; the reason is shown at the next sign-in. */
  end: (reason: string) => void;
}

const signedOut = { accessToken: null, refreshToken: null, profile: null };

/**
 * One signed-in account, kept in localStorage so a reload stays signed in.
 * The API and the web app live on different domains in production, where
 * browsers block the cookies an httpOnly-cookie design would need; tokens in
 * storage are the workable option. Access tokens live 15 minutes and refresh
 * tokens rotate on every use (see backend session.service.ts).
 */
export function createSessionStore<P>(storageKey: string) {
  return create<SessionState<P>>()(
    persist(
      (set) => ({
        ...signedOut,
        endedReason: null,
        setSession: ({ accessToken, refreshToken, profile }) =>
          set({ accessToken, refreshToken, profile, endedReason: null }),
        setTokens: ({ accessToken, refreshToken }) =>
          set({ accessToken, refreshToken }),
        setProfile: (profile) => set({ profile }),
        clear: () => set({ ...signedOut, endedReason: null }),
        end: (reason) => set({ ...signedOut, endedReason: reason }),
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => localStorage),
        partialize: ({ accessToken, refreshToken, profile, endedReason }) => ({
          accessToken,
          refreshToken,
          profile,
          endedReason,
        }),
      },
    ),
  );
}

export type SessionStore<P> = ReturnType<typeof createSessionStore<P>>;
