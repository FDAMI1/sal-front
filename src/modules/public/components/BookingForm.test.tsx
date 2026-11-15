import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicSalonApi } from "@modules/public/api/publicSalonApi";
import { BookingForm } from "@modules/public/components/BookingForm";
import type { PublicSalon, TrackedBooking } from "@modules/public/types";

vi.mock("@modules/public/api/publicSalonApi", () => ({
  publicSalonApi: { get: vi.fn(), book: vi.fn(), track: vi.fn() },
}));
const book = vi.mocked(publicSalonApi.book);

const service = (
  id: string,
  name: string,
  gender: "men" | "women" | "unisex",
  pricePaise: number,
  extra: Partial<PublicSalon["services"][number]> = {},
) => ({
  id,
  name,
  category: "Hair",
  gender,
  description: "",
  durationMinutes: 30,
  pricePaise,
  allowWalkIn: true,
  allowAppointment: true,
  ...extra,
});

const SALON: PublicSalon = {
  name: "Glow Studio",
  phone: "+919000000001",
  address: "",
  timezone: "Asia/Kolkata",
  businessHours: [],
  closedToday: false,
  booking: {
    today: "2026-11-12",
    maxDaysAhead: 30,
    walkInOpen: true,
    walkInMessage: null,
    holidays: [],
  },
  staff: [
    { id: "w1", displayName: "Ravi", serviceIds: ["s1", "s2"] },
    { id: "w2", displayName: "Meena", serviceIds: ["s1"] },
  ],
  services: [
    service("s1", "Haircut", "men", 20_000),
    service("s2", "Beard trim", "men", 10_000),
    service("s3", "Women cut", "women", 50_000),
  ],
};

function renderForm(salon = SALON) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/s/abc"]}>
        <Routes>
          <Route
            path="/s/:code"
            element={<BookingForm salon={salon} code="abc" />}
          />
          <Route path="/t/:trackingCode" element={<p>Tracking page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  book.mockReset();
});

describe("BookingForm", () => {
  it("adds up the total, narrows staff to those who do every service, and books", async () => {
    const user = userEvent.setup();
    book.mockResolvedValue({ trackingCode: "trk1" } as TrackedBooking);
    renderForm();

    expect(screen.queryByText("Women cut")).not.toBeInTheDocument();
    await user.click(screen.getByText("Haircut"));
    await user.click(screen.getByText("Beard trim"));
    expect(screen.getByText("Total ₹300")).toBeInTheDocument();

    const staff = screen.getByLabelText(/preferred staff/i);
    expect(
      [...staff.querySelectorAll("option")].map((o) => o.textContent),
    ).toEqual(["Any available", "Ravi"]);

    await user.type(screen.getByLabelText("Name"), "Arjun");
    await user.type(screen.getByLabelText("Mobile number"), "98765 43210");
    await user.selectOptions(staff, "w1");
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() =>
      expect(book).toHaveBeenCalledWith("abc", {
        gender: "male",
        name: "Arjun",
        phone: "98765 43210",
        serviceIds: ["s1", "s2"],
        preferredWorkerId: "w1",
        mode: "now",
      }),
    );
    expect(await screen.findByText("Tracking page")).toBeInTheDocument();
  });

  it("does not send an incomplete booking", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));
    expect(screen.getByText("Pick at least one service.")).toBeInTheDocument();
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid 10-digit mobile number."),
    ).toBeInTheDocument();
    expect(book).not.toHaveBeenCalled();
  });

  it("offers only a chosen time when walk-ins are closed", async () => {
    renderForm({
      ...SALON,
      booking: {
        ...SALON.booking,
        walkInOpen: false,
        walkInMessage: "The salon has stopped taking walk-ins for today.",
      },
    });
    expect(
      screen.getByRole("radio", { name: /as soon as possible/i }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Time")).toBeInTheDocument();
  });

  it("switching to Female drops the men's services already picked", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByText("Haircut"));
    expect(screen.getByText("Total ₹200")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Female" }));
    expect(screen.getByText("Total ₹0")).toBeInTheDocument();
    expect(screen.getByText("Women cut")).toBeInTheDocument();
  });
});
