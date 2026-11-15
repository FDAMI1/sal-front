import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiErrorMessage } from "@api/apiClient";
import { useSavePlan } from "@modules/admin/hooks/useAdminSalons";
import type { Plan } from "@modules/salon/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ControlledSelect } from "@shared/form/ControlledSelect";
import { ControlledSwitch } from "@shared/form/ControlledSwitch";
import { formatPaise, rupeesToPaise } from "@shared/format";
import { Alert, Button, Dialog } from "@shared/ui";

const whole = (max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Whole number")
    .refine((v) => Number(v) >= 1 && Number(v) <= max, `1 to ${max}`);

const schema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,30}$/, "2–30 lowercase letters, digits or dashes"),
  name: z.string().trim().min(1, "Name is required").max(60),
  description: z.string().trim().max(300),
  price: z
    .string()
    .refine(
      (v) => rupeesToPaise(v) !== null,
      "Enter an amount like 499 or 499.50",
    ),
  interval: z.enum(["month", "year"]),
  workers: whole(10_000),
  devices: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 50),
      "Empty, or 1 to 50",
    ),
  isActive: z.boolean(),
});
type Form = z.infer<typeof schema>;

const toForm = (p: Plan | null): Form => ({
  code: p?.code ?? "",
  name: p?.name ?? "",
  description: p?.description ?? "",
  price: p ? String(p.pricePaise / 100) : "",
  interval: p?.interval ?? "month",
  workers: p ? String(p.limits.workers) : "5",
  devices: p?.limits.devicesPerUser ? String(p.limits.devicesPerUser) : "",
  isActive: p?.isActive ?? true,
});

const INTERVALS = [
  { value: "month", label: "Per month" },
  { value: "year", label: "Per year" },
];

/** Create (plan = null) or edit a plan. The code is fixed once created. */
export function PlanDialog({
  plan,
  open,
  onClose,
}: {
  plan: Plan | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSavePlan();
  const { control, handleSubmit } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: toForm(plan),
  });
  const pricePreview = rupeesToPaise(useWatch({ control, name: "price" }));

  const submit = (v: Form) =>
    save.mutate(
      {
        id: plan?.id,
        isActive: plan ? v.isActive : undefined,
        input: {
          code: v.code,
          name: v.name,
          description: v.description,
          pricePaise: rupeesToPaise(v.price) ?? 0,
          interval: v.interval,
          limits: {
            workers: Number(v.workers),
            devicesPerUser: v.devices === "" ? null : Number(v.devices),
          },
        },
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={plan ? `Edit ${plan.name}` : "New plan"}
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledInput
            control={control}
            name="name"
            label="Name"
            autoFocus
          />
          <ControlledInput
            control={control}
            name="code"
            label="Code"
            disabled={Boolean(plan)}
            hint={plan ? "Fixed once created." : "e.g. starter"}
          />
        </div>
        <ControlledInput
          control={control}
          name="description"
          label="Description (optional)"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledInput
            control={control}
            name="price"
            label="Price (₹)"
            inputMode="decimal"
            hint={pricePreview !== null ? formatPaise(pricePreview) : undefined}
          />
          <ControlledSelect
            control={control}
            name="interval"
            label="Billed"
            options={INTERVALS}
          />
          <ControlledInput
            control={control}
            name="devices"
            label="Devices per staff login"
            hint="Empty: the server default"
            inputMode="numeric"
          />
          <ControlledInput
            control={control}
            name="workers"
            label="Staff allowed"
            inputMode="numeric"
          />
        </div>
        {plan && (
          <ControlledSwitch
            control={control}
            name="isActive"
            label="Offered"
            hint="Off: kept for salons already on it, not assignable to others."
          />
        )}
        {save.isError && (
          <Alert tone="danger">{apiErrorMessage(save.error)}</Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {plan ? "Save plan" : "Create plan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
