import { useState, type FormEvent } from "react";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import {
  categoryLabel,
  EXPENSE_CATEGORIES,
  useExpenseMutation,
  useExpenses,
  type Expense,
  type ExpenseCategory,
} from "@modules/billing/billingApi";
import type { RangeQuery } from "@modules/dashboard/api/dashboardApi";
import {
  CsvButton,
  DataTable,
  ReportShell,
  type Column,
} from "@modules/reports/ReportParts";
import { formatDate, formatPaise, rupeesToPaise } from "@shared/format";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
} from "@shared/ui";

const field = "h-10 w-full rounded-lg border border-line bg-surface px-3";
const localToday = () => new Intl.DateTimeFormat("en-CA").format(new Date());

function ExpenseForm({
  expense,
  onDone,
}: {
  /** The expense being changed; absent when adding a new one. */
  expense?: Expense;
  onDone: () => void;
}) {
  const save = useExpenseMutation();
  const [date, setDate] = useState(expense?.date ?? localToday());
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? "supplies",
  );
  const [amount, setAmount] = useState(
    expense ? String(expense.amountPaise / 100) : "",
  );
  const [note, setNote] = useState(expense?.note ?? "");
  const [touched, setTouched] = useState(false);
  const amountPaise = rupeesToPaise(amount);
  const problem =
    amountPaise === null || amountPaise <= 0
      ? "Enter the amount in rupees, e.g. 1500 or 249.50"
      : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (problem || amountPaise === null) return;
    save.mutate(
      {
        op: "save",
        id: expense?.id,
        input: { date, category, amountPaise, note: note.trim() },
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Date</span>
          <input
            type="date"
            required
            value={date}
            max={localToday()}
            onChange={(e) => setDate(e.target.value)}
            className={field}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className={field}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Amount (₹)</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={touched && Boolean(problem)}
          className={field}
        />
        {touched && problem && (
          <span role="alert" className="block text-danger-700">
            {problem}
          </span>
        )}
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Note (optional)</span>
        <input
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Electricity bill for October"
          className={field}
        />
      </label>
      {save.isError && (
        <Alert tone="danger">{apiErrorMessage(save.error)}</Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {expense ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}

/** /app/expenses — the salon's costs; they feed profit on the dashboard. */
export default function ExpensesScreen() {
  const [range, setRange] = useState<RangeQuery>({ range: "this_month" });
  const query = useExpenses(range);
  const remove = useExpenseMutation();
  // "new" opens an empty form; an expense opens it filled in.
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const rows = query.data?.items ?? [];
  const columns: Column<Expense>[] = [
    {
      header: "Date",
      cell: (e) => formatDate(e.date),
      text: (e) => e.date,
      footer: "Total",
    },
    {
      header: "Category",
      cell: (e) => categoryLabel(e.category),
      text: (e) => categoryLabel(e.category),
    },
    { header: "Note", cell: (e) => e.note, text: (e) => e.note },
    {
      header: "Amount",
      numeric: true,
      cell: (e) => formatPaise(e.amountPaise),
      text: (e) => e.amountPaise / 100,
      footer: formatPaise(query.data?.totalPaise ?? 0),
    },
    { header: "Added by", cell: (e) => e.createdByName },
    {
      header: "",
      cell: (e) => (
        <span className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Edit ${categoryLabel(e.category)} expense of ${formatPaise(e.amountPaise)}`}
            onClick={() => setEditing(e)}
            icon={<Pencil className="size-4" aria-hidden="true" />}
          />
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Delete ${categoryLabel(e.category)} expense of ${formatPaise(e.amountPaise)}`}
            onClick={() => setDeleting(e)}
            icon={<Trash2 className="size-4" aria-hidden="true" />}
          />
        </span>
      ),
    },
  ];

  return (
    <ReportShell
      title="Expenses"
      description="Rent, salaries, supplies and other costs. They are subtracted from revenue to estimate profit."
      range={range}
      onRange={setRange}
      query={query}
      actions={
        <>
          <CsvButton fileName="expenses.csv" columns={columns} rows={rows} />
          <Button
            size="sm"
            onClick={() => setEditing("new")}
            icon={<Plus className="size-4" aria-hidden="true" />}
          >
            Add expense
          </Button>
        </>
      }
    >
      {(data) => (
        <>
          <Card>
            {data.items.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses in this period"
                message="Add what the salon spends so the dashboard can estimate profit."
                action={
                  <Button onClick={() => setEditing("new")}>Add expense</Button>
                }
              />
            ) : (
              <DataTable
                caption="Expenses"
                columns={columns}
                rows={data.items}
                rowKey={(e) => e.id}
              />
            )}
          </Card>
          <Dialog
            open={editing !== null}
            title={editing === "new" ? "Add expense" : "Edit expense"}
            onClose={() => setEditing(null)}
          >
            {editing && (
              <ExpenseForm
                key={editing === "new" ? "new" : editing.id}
                expense={editing === "new" ? undefined : editing}
                onDone={() => setEditing(null)}
              />
            )}
          </Dialog>
          <ConfirmDialog
            open={deleting !== null}
            title="Delete this expense?"
            confirmLabel="Delete expense"
            busy={remove.isPending}
            onCancel={() => setDeleting(null)}
            onConfirm={() => {
              if (!deleting) return;
              remove.mutate(
                { op: "delete", id: deleting.id },
                { onSettled: () => setDeleting(null) },
              );
            }}
          >
            {deleting &&
              `${categoryLabel(deleting.category)} · ${formatPaise(deleting.amountPaise)} on ${formatDate(deleting.date)}. The dashboard figures change straight away.`}
          </ConfirmDialog>
        </>
      )}
    </ReportShell>
  );
}
