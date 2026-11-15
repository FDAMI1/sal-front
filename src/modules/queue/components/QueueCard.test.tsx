import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueueCard } from "@modules/queue/components/QueueCard";
import type { QueueBoard, QueueItem } from "@modules/queue/queueApi";

const item: QueueItem = {
  id: "b1",
  token: "W-004",
  status: "booked",
  mode: "now",
  scheduledTime: null,
  customerName: "Arjun",
  customerPhone: "+919800000000",
  gender: "male",
  services: ["Haircut", "Beard trim"],
  serviceIds: ["s1", "s2"],
  totalPaise: 30_000,
  totalMinutes: 45,
  preferredWorkerId: null,
  preferredWorkerName: null,
  assignedWorkerId: null,
  assignedWorkerName: null,
  paymentStatus: "unpaid",
  discountPaise: 0,
  paidPaise: 0,
  refundedPaise: 0,
  paymentMethod: null,
  paidAt: null,
};

const board: QueueBoard = {
  date: "2026-11-12",
  me: null,
  waiting: [item],
  called: [],
  inService: [],
  done: [],
  workers: [
    { id: "w1", displayName: "Ravi", serviceIds: ["s1", "s2"], busy: true },
    { id: "w2", displayName: "Meena", serviceIds: ["s1", "s2"], busy: false },
    { id: "w3", displayName: "Kiran", serviceIds: ["s1"], busy: false },
  ],
};

describe("QueueCard", () => {
  it("offers only staff who do every service, busy ones disabled, and calls with the pick", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ul>
        <QueueCard
          item={item}
          board={board}
          isAdmin
          busy={false}
          onAction={onAction}
          onConfirm={vi.fn()}
          onPay={vi.fn()}
        />
      </ul>,
    );
    const select = screen.getByLabelText(/staff member for W-004/i);
    const options = [...select.querySelectorAll("option")];
    expect(options.map((o) => o.textContent)).toEqual([
      "No one yet",
      "Ravi (busy)",
      "Meena",
    ]);
    expect(options[1]).toBeDisabled();
    // The first free capable staff member is preselected.
    expect(select).toHaveValue("w2");

    await user.click(screen.getByRole("button", { name: "Call" }));
    expect(onAction).toHaveBeenCalledWith("call", "w2");
  });

  it("shows a worker only their own next step, without staff choice or cancel", () => {
    render(
      <ul>
        <QueueCard
          item={{ ...item, status: "called", assignedWorkerName: "Meena" }}
          board={{ ...board, me: "w2" }}
          isAdmin={false}
          busy={false}
          onAction={vi.fn()}
          onConfirm={vi.fn()}
          onPay={vi.fn()}
        />
      </ul>,
    );
    expect(screen.getByText("With Meena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start service" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back to waiting" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("offers payment for a completed unpaid visit and shows what was paid", async () => {
    const user = userEvent.setup();
    const onPay = vi.fn();
    const props = {
      board,
      isAdmin: true,
      busy: false,
      onAction: vi.fn(),
      onConfirm: vi.fn(),
      onPay,
    };
    const { rerender } = render(
      <ul>
        <QueueCard item={{ ...item, status: "completed" }} {...props} />
      </ul>,
    );
    await user.click(screen.getByRole("button", { name: "Collect payment" }));
    expect(onPay).toHaveBeenCalledOnce();

    rerender(
      <ul>
        <QueueCard
          item={{
            ...item,
            status: "completed",
            paymentStatus: "paid",
            paidPaise: 25_000,
            paymentMethod: "upi",
          }}
          {...props}
        />
      </ul>,
    );
    expect(screen.getByText(/Paid ₹250 · UPI/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Collect payment" }),
    ).not.toBeInTheDocument();
  });
});
