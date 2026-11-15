import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { staffApi } from "@api/clients";
import {
  PayDialog,
  RefundDialog,
  type MoneyTarget,
} from "@modules/billing/components/MoneyDialogs";
import { TrendChart } from "@modules/dashboard/components/charts";
import { bucketTrend, defaultGranularity } from "@modules/dashboard/trend";
import { SALON_NAV, SECTION_ORDER, WORKER_NAV } from "@navigation/navItems";

vi.mock("@api/clients", () => ({ staffApi: { post: vi.fn() } }));
const post = vi.mocked(staffApi.post);

// jsdom has no <dialog> modal support.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};

const wrap = (ui: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );

const visit: MoneyTarget = {
  id: "b1",
  token: "W-004",
  customerName: "Arjun",
  totalPaise: 30_000,
  paidPaise: 25_000,
  refundedPaise: 5_000,
};

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: {} });
});

describe("collecting payment", () => {
  it("shows what to collect after the discount and sends it in paise", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    wrap(<PayDialog target={visit} onClose={onClose} />);

    await user.click(screen.getByLabelText("UPI"));
    await user.type(screen.getByLabelText(/discount/i), "49.50");
    await user.click(screen.getByRole("button", { name: "Record ₹250.50" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith("/queue/b1/pay", {
      method: "upi",
      discountPaise: 4_950,
    });
  });

  it("refuses a discount larger than the bill", async () => {
    const user = userEvent.setup();
    wrap(<PayDialog target={visit} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/discount/i), "301");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "cannot be more than the bill",
    );
    expect(screen.getByRole("button", { name: /^Record/ })).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("refunding", () => {
  it("offers what is left, and never more", async () => {
    const user = userEvent.setup();
    wrap(<RefundDialog target={visit} onClose={vi.fn()} />);
    const amount = screen.getByLabelText(/amount to refund/i);
    // ₹250 paid less ₹50 already refunded.
    expect(amount).toHaveValue("200");

    await user.clear(amount);
    await user.type(amount, "201");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only ₹200 is left to refund",
    );

    await user.clear(amount);
    await user.type(amount, "120");
    await user.type(screen.getByLabelText("Reason"), "Colour redone");
    await user.click(screen.getByRole("button", { name: "Refund" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/queue/b1/refund", {
        amountPaise: 12_000,
        reason: "Colour redone",
      }),
    );
  });
});

describe("the revenue trend chart", () => {
  it("gives every point a readable label with both periods", () => {
    render(
      <TrendChart
        granularity="day"
        trend={{
          previous: { from: "2026-11-09", to: "2026-11-10" },
          previousRevenuePaise: 10_000,
          points: [
            {
              date: "2026-11-11",
              revenuePaise: 25_000,
              collectedPaise: 25_000,
              expensesPaise: 0,
              previousRevenuePaise: 10_000,
            },
            {
              date: "2026-11-12",
              revenuePaise: 40_000,
              collectedPaise: 30_000,
              expensesPaise: 5_000,
              previousRevenuePaise: 0,
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByLabelText(/: revenue ₹250, previous period ₹100$/),
    ).toBeInTheDocument();
    expect(screen.getByText("This period")).toBeInTheDocument();
    expect(screen.getByText(/Previous period/)).toBeInTheDocument();
  });

  it("adds days up into weeks and months", () => {
    const day = (date: string, revenuePaise: number) => ({
      date,
      revenuePaise,
      collectedPaise: revenuePaise,
      expensesPaise: 0,
      previousRevenuePaise: 100,
    });
    // 2026-11-08 is a Sunday; the 9th starts a new week.
    const days = [
      day("2026-10-31", 1_000),
      day("2026-11-08", 2_000),
      day("2026-11-09", 4_000),
      day("2026-11-10", 8_000),
    ];
    expect(
      bucketTrend(days, "week").map((p) => [p.date, p.revenuePaise]),
    ).toEqual([
      ["2026-10-26", 1_000],
      ["2026-11-02", 2_000],
      ["2026-11-09", 12_000],
    ]);
    const months = bucketTrend(days, "month");
    expect(months.map((p) => [p.date, p.revenuePaise])).toEqual([
      ["2026-10-01", 1_000],
      ["2026-11-01", 14_000],
    ]);
    expect(months[1]?.previousRevenuePaise).toBe(300);
    expect(defaultGranularity(30)).toBe("day");
    expect(defaultGranularity(90)).toBe("week");
    expect(defaultGranularity(320)).toBe("month");
  });
});

describe("the salon admin sidebar", () => {
  it("has the agreed groups and pages, and nothing for the super admin", () => {
    const grouped = SECTION_ORDER.map(
      (section) =>
        [
          section,
          SALON_NAV.filter((i) => i.section === section).map((i) => i.label),
        ] as const,
    ).filter(([, labels]) => labels.length > 0);
    expect(grouped).toEqual([
      ["Overview", ["Dashboard", "Queue"]],
      [
        "Business management",
        [
          "Staff Management",
          "Customer Management",
          "Services",
          "Bookings",
          "Appointments",
        ],
      ],
      [
        "Business reports",
        ["Sales Reports", "Staff Performance", "Service Reports", "Expenses"],
      ],
      [
        "Customer experience",
        ["QR Code Management", "Notifications", "Customer Reminders"],
      ],
      [
        "Settings",
        [
          "Salon Profile",
          "User & Device Management",
          "Notification Sound Settings",
          "My Account",
        ],
      ],
    ]);
    const all = [...SALON_NAV, ...WORKER_NAV].map((i) => i.label.toLowerCase());
    expect(all.some((l) => l.includes("system") || l.includes("branch"))).toBe(
      false,
    );
    // A worker never gets a page with money on it.
    expect(WORKER_NAV.map((i) => i.to)).toEqual(["/worker", "/worker/account"]);
  });
});
