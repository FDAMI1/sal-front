import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { salonApi } from "@modules/salon/api/salonApi";
import type { Salon } from "@modules/salon/types";
import { bookingLinkApi } from "@modules/qr/api/qrApi";
import { QrCodeCard } from "@modules/qr/components/QrCodeCard";
import QrCodeScreen from "@modules/qr/screens/QrCodeScreen";

vi.mock("@modules/salon/api/salonApi", () => ({
  salonApi: { get: vi.fn() },
}));
vi.mock("@modules/qr/api/qrApi", () => ({
  bookingLinkApi: { update: vi.fn() },
}));

const getSalon = vi.mocked(salonApi.get);
const updateLink = vi.mocked(bookingLinkApi.update);

const LINK = "http://localhost:5173/s/k3x9";

function makeSalon(bookingLink: Partial<Salon["bookingLink"]> = {}): Salon {
  return {
    id: "salon-1",
    name: "Glow Studio",
    slug: "glow-studio",
    contact: {
      phone: "+919876543210",
      email: "hi@glow.test",
      addressLine: "1 MG Road",
      city: "Pune",
      state: "MH",
      pincode: "411001",
    },
    timezone: "Asia/Kolkata",
    businessHours: [],
    queueSettings: {
      graceMinutes: 5,
      autoCall: false,
      noShowAction: "no_show",
      getReadyMinutes: 15,
      comeNowMinutes: 5,
      stopJoiningMinutesBeforeClose: 30,
    },
    bookingLink: {
      code: "k3x9",
      isActive: true,
      url: LINK,
      qrImage: "data:image/png;base64,stored",
      generatedAt: "2026-11-10T09:00:00Z",
      regeneratedAt: null,
      ...bookingLink,
    },
    approvalStatus: "approved",
    plan: null,
    createdAt: null,
  };
}

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  // jsdom has no modal support; mirror the native open state.
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
  };
});

// Braces matter: a function returned from beforeEach runs as a teardown.
beforeEach(() => {
  getSalon.mockReset();
  updateLink.mockReset();
});

describe("QrCodeCard", () => {
  it("shows the booking LINK and copies it", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    getSalon.mockResolvedValue(makeSalon());
    renderWithProviders(<QrCodeCard />);

    expect(await screen.findByText(LINK)).toBeInTheDocument();
    expect(
      await screen.findByRole("img", { name: /qr code.*glow studio/i }),
    ).toHaveAttribute("src", "data:image/png;base64,stored");
    // The image is the one stored on the server, never redrawn here.
    expect(screen.getByText(/^Generated /)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Booking link copied.",
    );
  });

  it("reports a failed copy", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(() =>
      Promise.reject(new Error("denied")),
    );
    getSalon.mockResolvedValue(makeSalon());
    renderWithProviders(<QrCodeCard />);

    await user.click(await screen.findByRole("button", { name: /copy link/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not copy/i,
    );
  });

  it("hides the actions when the link is switched off", async () => {
    getSalon.mockResolvedValue(makeSalon({ isActive: false }));
    renderWithProviders(<QrCodeCard />);

    expect(
      await screen.findByText("Booking link is switched off"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /manage your qr code/i }),
    ).toHaveAttribute("href", "/app/qr");
    expect(screen.queryByRole("button", { name: /download/i })).toBeNull();
    expect(screen.queryByText(LINK)).toBeNull();
  });
});

describe("QrCodeScreen", () => {
  it("regenerates only after the warning is confirmed", async () => {
    const user = userEvent.setup();
    getSalon.mockResolvedValue(makeSalon());
    updateLink.mockResolvedValue(
      makeSalon({ url: `${LINK}new`, regeneratedAt: "2026-11-11T10:00:00Z" }),
    );
    renderWithProviders(<QrCodeScreen />);

    await user.click(
      await screen.findByRole("button", { name: /generate new qr code/i }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/printed or shared will stop working/i);
    expect(updateLink).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: /generate new code/i }),
    );
    expect(updateLink).toHaveBeenCalledWith({ regenerate: true });
    expect(await screen.findByText(`${LINK}new`)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("does not call the API when the warning is cancelled", async () => {
    const user = userEvent.setup();
    getSalon.mockResolvedValue(makeSalon());
    renderWithProviders(<QrCodeScreen />);

    await user.click(
      await screen.findByRole("button", { name: /generate new qr code/i }),
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(updateLink).not.toHaveBeenCalled();
  });

  it("switches the link off", async () => {
    const user = userEvent.setup();
    getSalon.mockResolvedValue(makeSalon());
    updateLink.mockResolvedValue(makeSalon({ isActive: false }));
    renderWithProviders(<QrCodeScreen />);

    await user.click(
      await screen.findByRole("switch", { name: /booking link is on/i }),
    );
    await user.click(screen.getByRole("button", { name: /save link status/i }));
    expect(updateLink).toHaveBeenCalledWith({ isActive: false });
    expect(
      await screen.findByText("Booking link is switched off"),
    ).toBeInTheDocument();
  });
});
