import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminAuthApi } from "@modules/admin/api/adminAuthApi";
import { authApi } from "@modules/auth/api/authApi";
import type { StaffUser } from "@modules/auth/types";
import { useStaffSession } from "@shared/store/sessions";
import LoginScreen from "./LoginScreen";

const worker: StaffUser = {
  id: "u1",
  salonId: "s1",
  role: "worker",
  permissions: ["queue.view"],
  name: "Ravi",
  email: "ravi@example.test",
  phone: null,
  branchIds: [],
  lastLoginAt: null,
};

function apiError(status: number, code: string, message: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("fail", "ERR_BAD_RESPONSE", config, null, {
    status,
    statusText: "",
    data: { success: false, error: { code, message } },
    headers: {},
    config,
  } as AxiosResponse);
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginScreen /> },
      { path: "/worker", element: <p>Worker home</p> },
      { path: "/app", element: <p>Admin home</p> },
      { path: "/admin", element: <p>Console home</p> },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText("Email or mobile number"),
    "ravi@example.test",
  );
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  return user;
}

beforeEach(() => useStaffSession.getState().clear());
afterEach(() => vi.restoreAllMocks());

describe("LoginScreen", () => {
  it("shows field errors without calling the server", async () => {
    const login = vi.spyOn(authApi, "login");
    renderAt("/login");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("Enter your email or mobile number"),
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("sends a worker to the worker portal even when ?next= points at the admin portal", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
      profile: worker,
    });
    renderAt("/login?next=%2Fapp%2Faccount");
    await fillAndSubmit();
    expect(await screen.findByText("Worker home")).toBeInTheDocument();
    expect(useStaffSession.getState().profile?.name).toBe("Ravi");
  });

  it("offers to sign out other devices at the device limit, and retries with that flag", async () => {
    const login = vi
      .spyOn(authApi, "login")
      .mockRejectedValueOnce(
        apiError(
          409,
          "DEVICE_LIMIT_REACHED",
          "You're signed in on 3 devices already.",
        ),
      )
      .mockResolvedValueOnce({
        accessToken: "a",
        refreshToken: "r",
        profile: worker,
      });
    renderAt("/login");
    const user = await fillAndSubmit();

    await user.click(
      await screen.findByRole("button", {
        name: "Sign out other devices and continue",
      }),
    );
    expect(login).toHaveBeenLastCalledWith(
      expect.objectContaining({ signOutOthers: true }),
    );
    expect(await screen.findByText("Worker home")).toBeInTheDocument();
  });

  it("signs the super admin in from this page and opens the console", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      apiError(
        401,
        "INVALID_CREDENTIALS",
        "Wrong email, mobile number or password",
      ),
    );
    const adminLogin = vi.spyOn(adminAuthApi, "login").mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
      profile: { id: "p1", name: "Super Admin", email: "ravi@example.test" },
    } as Awaited<ReturnType<typeof adminAuthApi.login>>);
    renderAt("/login");
    await fillAndSubmit();
    expect(await screen.findByText("Console home")).toBeInTheDocument();
    expect(adminLogin.mock.calls[0]?.[0]).toMatchObject({
      email: "ravi@example.test",
      password: "secret123",
    });
  });

  it("shows the server's reason for a refused sign-in", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      apiError(
        403,
        "SALON_PENDING_APPROVAL",
        "Your salon is waiting for approval.",
      ),
    );
    renderAt("/login");
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your salon is waiting for approval.",
    );
  });
});
