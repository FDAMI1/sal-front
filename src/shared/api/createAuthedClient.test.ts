import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionStore } from "@shared/store/createSessionStore";
import { createAuthedClient } from "./createAuthedClient";

type Profile = { name: string };

function respond(
  status: number,
  data: unknown,
  config: Parameters<AxiosAdapter>[0],
) {
  const response = {
    status,
    statusText: "",
    data,
    headers: {},
    config,
  } as AxiosResponse;
  if (status >= 400) {
    return Promise.reject(
      new AxiosError("fail", "ERR_BAD_RESPONSE", config, null, response),
    );
  }
  return Promise.resolve(response);
}

function refused(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("fail", "ERR_BAD_RESPONSE", config, null, {
    status,
    statusText: "",
    data: {},
    headers: {},
    config,
  } as AxiosResponse);
}

let store: ReturnType<typeof createSessionStore<Profile>>;

beforeEach(() => {
  localStorage.clear();
  store = createSessionStore<Profile>(`test.${Math.random()}`);
  store.getState().setSession({
    accessToken: "old-access",
    refreshToken: "r1",
    profile: { name: "A" },
  });
});
afterEach(() => vi.restoreAllMocks());

/** A client whose API answers 401 to "old-access" and 200 to anything else. */
function clientWithApi() {
  const client = createAuthedClient(store, "/auth/refresh");
  const seen: string[] = [];
  client.defaults.adapter = (config) => {
    const auth = String(config.headers.get("Authorization") ?? "");
    seen.push(auth);
    return auth === "Bearer old-access"
      ? respond(
          401,
          { success: false, error: { code: "UNAUTHORIZED" } },
          config,
        )
      : respond(200, { ok: true }, config);
  };
  return { client, seen };
}

describe("createAuthedClient", () => {
  it("refreshes once for concurrent 401s and replays each request", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "new-access", refreshToken: "r2" } },
    });
    const { client } = clientWithApi();

    const results = await Promise.all([
      client.get("/a"),
      client.get("/b"),
      client.get("/c"),
    ]);

    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({
      accessToken: "new-access",
      refreshToken: "r2",
    });
  });

  it("signs out when the refresh is refused", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(refused(401));
    const { client } = clientWithApi();
    await expect(client.get("/a")).rejects.toBeInstanceOf(AxiosError);
    expect(store.getState().refreshToken).toBeNull();
    expect(store.getState().profile).toBeNull();
  });

  it("keeps the session when the refresh fails for network reasons", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(
      new AxiosError("Network Error", "ERR_NETWORK"),
    );
    const { client } = clientWithApi();
    await expect(client.get("/a")).rejects.toBeInstanceOf(AxiosError);
    expect(store.getState().refreshToken).toBe("r1");
  });

  it("adopts the pair another tab stored when its own refresh loses the race", async () => {
    vi.spyOn(axios, "post").mockImplementation(async () => {
      // The other tab rotated r1 first and saved its result to storage.
      const key = store.persist.getOptions().name ?? "";
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            accessToken: "tab2-access",
            refreshToken: "r2",
            profile: { name: "A" },
          },
          version: 0,
        }),
      );
      throw refused(401);
    });
    const { client, seen } = clientWithApi();
    const res = await client.get("/a");
    expect(res.status).toBe(200);
    expect(seen.at(-1)).toBe("Bearer tab2-access");
    expect(store.getState().refreshToken).toBe("r2");
  });

  it("does not try to refresh without a stored session", async () => {
    store.getState().clear();
    const post = vi.spyOn(axios, "post");
    const client = createAuthedClient(store, "/auth/refresh");
    client.defaults.adapter = (config) => respond(401, {}, config);
    await expect(client.get("/a")).rejects.toBeInstanceOf(AxiosError);
    expect(post).not.toHaveBeenCalled();
  });

  it("ends the session with the reason when the salon is suspended mid-session", async () => {
    const post = vi.spyOn(axios, "post");
    const client = createAuthedClient(store, "/auth/refresh");
    client.defaults.adapter = (config) =>
      respond(
        403,
        {
          success: false,
          error: {
            code: "SALON_SUSPENDED",
            message: "This salon's account is suspended.",
          },
        },
        config,
      );
    await expect(client.get("/salon")).rejects.toBeInstanceOf(AxiosError);
    expect(post).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({
      refreshToken: null,
      profile: null,
      endedReason: "This salon's account is suspended.",
    });
  });

  it("keeps the session on an ordinary permission refusal", async () => {
    const client = createAuthedClient(store, "/auth/refresh");
    client.defaults.adapter = (config) =>
      respond(
        403,
        { success: false, error: { code: "FORBIDDEN", message: "No" } },
        config,
      );
    await expect(client.get("/analytics")).rejects.toBeInstanceOf(AxiosError);
    expect(store.getState().refreshToken).toBe("r1");
  });

  it("clears the reason when the next sign-in succeeds", () => {
    store.getState().end("Suspended");
    store.getState().setSession({
      accessToken: "a",
      refreshToken: "r",
      profile: { name: "A" },
    });
    expect(store.getState().endedReason).toBeNull();
  });
});
