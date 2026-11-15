import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SystemStatusScreen from "./SystemStatusScreen";
import { systemApi } from "@modules/system/api/systemApi";

vi.mock("@modules/system/api/systemApi", () => ({
  systemApi: { status: vi.fn() },
}));

const health = vi.mocked(systemApi.status);

/**
 * Rejects only when called. `mockRejectedValue` builds the rejected promise
 * up front, and vitest reports it as unhandled before the query consumes it.
 */
function failWith(err: Error) {
  health.mockImplementation(() => Promise.reject(err));
}

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SystemStatusScreen />
    </QueryClientProvider>,
  );
}

describe("SystemStatusScreen", () => {
  // Braces matter: a function returned from beforeEach runs as a teardown,
  // and mockReset() returns the mock itself.
  beforeEach(() => {
    health.mockReset();
  });

  it("shows the live health details when the API is up", async () => {
    health.mockResolvedValue({
      status: "ok",
      service: "smartqueue-salon-api",
      environment: "development",
      db: "connected",
      dbPingMs: 4,
      responseMs: 6,
      uptimeSeconds: 125,
      time: "2026-11-09T15:21:17.181Z",
      nodeVersion: "v22.12.0",
      platform: "win32/x64",
      memoryMb: { rss: 120, heapUsed: 60 },
      latencyMs: 12,
    });
    renderScreen();

    expect(await screen.findByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
    expect(screen.getByText("12 ms")).toBeInTheDocument();
    expect(screen.getByText("2m 5s")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /check again/i }),
    ).toBeInTheDocument();
  });

  it("flags a database that does not answer", async () => {
    health.mockResolvedValue({
      status: "degraded",
      service: "smartqueue-salon-api",
      environment: "production",
      db: "disconnected",
      dbPingMs: null,
      responseMs: 8000,
      uptimeSeconds: 10,
      time: "2026-11-09T15:21:17.181Z",
      nodeVersion: "v22.12.0",
      platform: "linux/x64",
      memoryMb: { rss: 90, heapUsed: 40 },
      latencyMs: 8012,
    });
    renderScreen();

    expect(await screen.findByText("disconnected")).toBeInTheDocument();
    expect(screen.getByText("No answer")).toBeInTheDocument();
  });

  it("explains an unreachable API", async () => {
    failWith(new AxiosError("Network Error", "ERR_NETWORK"));
    renderScreen();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot reach the API",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("http://api.test");
  });
});
