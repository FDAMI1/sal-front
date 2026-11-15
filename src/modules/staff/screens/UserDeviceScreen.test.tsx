import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { staffManagementApi } from "@modules/staff/api/staffManagementApi";
import type { StaffAccess } from "@modules/staff/types";
import UserDeviceScreen from "./UserDeviceScreen";

vi.mock("@modules/staff/api/staffManagementApi", () => ({
  staffManagementApi: {
    access: vi.fn(),
    revokeDevice: vi.fn(),
    signOutEverywhere: vi.fn(),
    update: vi.fn(),
    updatePolicy: vi.fn(),
  },
}));

const access = vi.mocked(staffManagementApi.access);
const revokeDevice = vi.mocked(staffManagementApi.revokeDevice);

const overview: StaffAccess = {
  limits: {
    maxStaff: null,
    devicesPerStaff: 2,
    policy: { maxStaff: null, devicesPerStaff: null },
    subscription: { maxStaff: null, devicesPerStaff: 2, planName: "Pro" },
  },
  counts: { total: 4, active: 3, inactive: 1, available: null },
  staff: [
    {
      id: "w1",
      userId: "u1",
      name: "Ravi Kumar",
      displayName: "Ravi",
      email: "ravi@example.test",
      isActive: true,
      lastLoginAt: "2026-11-10T09:00:00.000Z",
      lastActiveAt: "2026-11-11T08:00:00.000Z",
      activeDevices: 1,
      devices: [
        {
          id: "s1",
          type: "mobile",
          name: "Chrome on Android",
          ip: "10.0.0.1",
          signedInAt: "2026-11-10T09:00:00.000Z",
          lastActiveAt: "2026-11-11T08:00:00.000Z",
        },
      ],
    },
  ],
};

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UserDeviceScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// jsdom has no modal dialogs; the shared Dialog relies on them.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("UserDeviceScreen", () => {
  // Braces matter: a function returned from beforeEach runs as a teardown.
  beforeEach(() => {
    access.mockReset();
    revokeDevice.mockReset();
  });

  it("shows the counts and Unlimited for missing caps", async () => {
    access.mockResolvedValue(overview);
    renderScreen();

    const max = await screen.findByText("Maximum staff accounts", {
      selector: "dt",
    });
    expect(max.nextElementSibling).toHaveTextContent("Unlimited");
    expect(
      screen.getByText("Currently active", { selector: "dt" })
        .nextElementSibling,
    ).toHaveTextContent("3");
    expect(
      screen.getByText("Available", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("Unlimited");
    expect(
      screen.getByText("Inactive", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("1");
    expect(screen.getByText(/Pro plan allows unlimited/)).toBeInTheDocument();
  });

  it("signs one device out after confirming", async () => {
    access.mockResolvedValue(overview);
    revokeDevice.mockImplementation(() =>
      Promise.resolve({} as Awaited<ReturnType<typeof revokeDevice>>),
    );
    renderScreen();
    const user = userEvent.setup();

    await user.click(await screen.findByText("1 signed-in device"));
    await user.click(
      screen.getByRole("button", {
        name: "Sign Ravi Kumar out of Chrome on Android",
      }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(revokeDevice).toHaveBeenCalledWith("w1", "s1"));
    // The list refreshes so the device disappears.
    await waitFor(() => expect(access).toHaveBeenCalledTimes(2));
  });
});
