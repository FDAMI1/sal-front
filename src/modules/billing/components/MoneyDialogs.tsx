import { useState, type FormEvent } from "react";
import { apiErrorMessage } from "@api/apiClient";
import {
  PAYMENT_METHODS,
  usePay,
  useRefund,
  type PaymentMethod,
} from "@modules/billing/billingApi";
import { formatPaise, rupeesToPaise } from "@shared/format";
import { Alert, Button, Dialog } from "@shared/ui";

const input = "h-10 w-full rounded-lg border border-line bg-surface px-3";

/** The visit a payment or refund is for. */
export interface MoneyTarget {
  id: string;
  token: string;
  customerName: string;
  totalPaise: number;
  paidPaise: number;
  refundedPaise: number;
}

interface Props {
  target: MoneyTarget | null;
  onClose: () => void;
}

/** Records the payment for a completed visit: method and an optional discount. */
export function PayDialog({ target, onClose }: Props) {
  return (
    <Dialog
      open={target !== null}
      title={target ? `Collect payment · ${target.token}` : ""}
      description={target?.customerName}
      onClose={onClose}
    >
      {target && <PayForm key={target.id} target={target} onClose={onClose} />}
    </Dialog>
  );
}

function PayForm({
  target,
  onClose,
}: {
  target: MoneyTarget;
  onClose: () => void;
}) {
  const pay = usePay();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("");
  const discountPaise = discount.trim() === "" ? 0 : rupeesToPaise(discount);
  const problem =
    discountPaise === null
      ? "Enter the discount in rupees, e.g. 50 or 49.50"
      : discountPaise > target.totalPaise
        ? "The discount cannot be more than the bill"
        : null;
  const due = target.totalPaise - (discountPaise ?? 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (problem || discountPaise === null) return;
    pay.mutate(
      { id: target.id, method, discountPaise },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Paid by</legend>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.value}
              className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-700"
            >
              <input
                type="radio"
                name="method"
                value={m.value}
                checked={method === m.value}
                onChange={() => setMethod(m.value)}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Discount (₹, optional)</span>
        <input
          inputMode="decimal"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="0"
          aria-invalid={Boolean(problem)}
          className={input}
        />
        {problem && (
          <span role="alert" className="block text-danger-700">
            {problem}
          </span>
        )}
      </label>
      <dl className="space-y-1 rounded-lg bg-canvas p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Services</dt>
          <dd>{formatPaise(target.totalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Discount</dt>
          <dd>− {formatPaise(discountPaise ?? 0)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold text-ink">
          <dt>To collect</dt>
          <dd>{formatPaise(Math.max(due, 0))}</dd>
        </div>
      </dl>
      {pay.isError && <Alert tone="danger">{apiErrorMessage(pay.error)}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pay.isPending}>
          Not now
        </Button>
        <Button
          type="submit"
          loading={pay.isPending}
          disabled={Boolean(problem)}
        >
          Record {formatPaise(Math.max(due, 0))}
        </Button>
      </div>
    </form>
  );
}

/** Gives money back for a paid visit, in full or in part, with a reason. */
export function RefundDialog({ target, onClose }: Props) {
  return (
    <Dialog
      open={target !== null}
      title={target ? `Refund · ${target.token}` : ""}
      description={target?.customerName}
      onClose={onClose}
    >
      {target && (
        <RefundForm key={target.id} target={target} onClose={onClose} />
      )}
    </Dialog>
  );
}

function RefundForm({
  target,
  onClose,
}: {
  target: MoneyTarget;
  onClose: () => void;
}) {
  const refund = useRefund();
  const left = target.paidPaise - target.refundedPaise;
  const [amount, setAmount] = useState(String(left / 100));
  const [reason, setReason] = useState("");
  const amountPaise = rupeesToPaise(amount);
  const problem =
    amountPaise === null || amountPaise <= 0
      ? "Enter the amount in rupees, e.g. 100 or 99.50"
      : amountPaise > left
        ? `Only ${formatPaise(left)} is left to refund`
        : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (problem || amountPaise === null || reason.trim().length < 3) return;
    refund.mutate(
      { id: target.id, amountPaise, reason: reason.trim() },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink-muted">
        {`Paid ${formatPaise(target.paidPaise)}${
          target.refundedPaise > 0
            ? `, already refunded ${formatPaise(target.refundedPaise)}`
            : ""
        }. A refund cannot be undone.`}
      </p>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Amount to refund (₹)</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={Boolean(problem)}
          className={input}
        />
        {problem && (
          <span role="alert" className="block text-danger-700">
            {problem}
          </span>
        )}
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Reason</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          required
          minLength={3}
          placeholder="e.g. Customer unhappy with the colour"
          className={input}
        />
      </label>
      {refund.isError && (
        <Alert tone="danger">{apiErrorMessage(refund.error)}</Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={refund.isPending}
        >
          Keep payment
        </Button>
        <Button
          type="submit"
          variant="danger"
          loading={refund.isPending}
          disabled={Boolean(problem)}
        >
          Refund
        </Button>
      </div>
    </form>
  );
}
