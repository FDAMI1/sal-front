import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { environment } from "@config/env";
import type { SessionState, TokenPair } from "@shared/store/createSessionStore";
import { apiErrorCode, apiErrorMessage, apiErrorStatus } from "./apiClient";
import { getDeviceId } from "./deviceId";

const TIMEOUT_MS = 30_000;

/** The zustand store API the client needs: read, write, re-read storage. */
interface StoreApi<P> {
  getState: () => SessionState<P>;
  persist: { rehydrate: () => Promise<void> | void };
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Server refusals that mean "this account cannot be used now", not "retry". */
const SESSION_ENDING_CODES = new Set([
  "SALON_SUSPENDED",
  "SALON_PENDING_APPROVAL",
  "SALON_REJECTED",
  "ACCOUNT_DISABLED",
]);

/**
 * An axios client for one portal. Sends the access token and device id; on a
 * 401 it refreshes once and replays the request. Concurrent 401s share a
 * single refresh, because the refresh token rotates and a second refresh
 * with the old one would be refused.
 */
export function createAuthedClient<P>(
  store: StoreApi<P>,
  refreshPath: string,
): AxiosInstance {
  const client = axios.create({
    baseURL: environment.apiUrl,
    headers: { "Content-Type": "application/json" },
    timeout: TIMEOUT_MS,
  });

  client.interceptors.request.use((config) => {
    const token = store.getState().accessToken;
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    config.headers.set("x-device-id", getDeviceId());
    return config;
  });

  let refreshing: Promise<string> | null = null;

  async function refresh(): Promise<string> {
    const used = store.getState().refreshToken;
    if (!used) throw new Error("Not signed in");
    try {
      const res = await axios.post<{ data: TokenPair }>(
        `${environment.apiUrl}${refreshPath}`,
        { refreshToken: used },
        { timeout: TIMEOUT_MS },
      );
      store.getState().setTokens(res.data.data);
      return res.data.data.accessToken;
    } catch (err) {
      // Another tab may have refreshed first and stored the next token; its
      // pair is valid, so this tab adopts it instead of signing out.
      await store.persist.rehydrate();
      const now = store.getState();
      if (now.refreshToken && now.refreshToken !== used && now.accessToken) {
        return now.accessToken;
      }
      // Refused (session ended, account disabled, salon suspended): sign out
      // and say why. A network failure keeps the session so a retry can work.
      const status = apiErrorStatus(err);
      if (status === 401 || status === 403) {
        now.end(apiErrorMessage(err, "Your session has ended. Sign in again."));
      }
      throw err;
    }
  }

  client.interceptors.response.use(undefined, async (error: unknown) => {
    // The account or salon itself may no longer be used: refreshing cannot
    // help, and staying inside the portal would only show an error per screen.
    const code = apiErrorCode(error);
    if (code && SESSION_ENDING_CODES.has(code)) {
      store.getState().end(apiErrorMessage(error));
      throw error;
    }
    const original = axios.isAxiosError(error)
      ? (error.config as RetriableConfig | undefined)
      : undefined;
    if (
      apiErrorStatus(error) !== 401 ||
      !original ||
      original._retried ||
      !store.getState().refreshToken
    ) {
      throw error;
    }
    original._retried = true;
    refreshing ??= refresh().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    original.headers.set("Authorization", `Bearer ${token}`);
    return client(original);
  });

  return client;
}
