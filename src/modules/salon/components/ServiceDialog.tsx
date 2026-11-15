import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiErrorMessage } from "@api/apiClient";
import { ServiceFieldInputs } from "@modules/salon/components/ServiceFieldInputs";
import { useMenuAction } from "@modules/salon/hooks/useServiceMenu";
import { serviceFieldsSchema } from "@modules/salon/service.validation";
import type { MenuService } from "@modules/salon/types";
import { ControlledSwitch } from "@shared/form/ControlledSwitch";
import { rupeesToPaise } from "@shared/format";
import { Alert, Button, Dialog } from "@shared/ui";

const schema = serviceFieldsSchema
  .extend({
    allowWalkIn: z.boolean(),
    allowAppointment: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((v) => v.allowWalkIn || v.allowAppointment, {
    message: "Allow walk-ins, appointments or both",
    path: ["allowAppointment"],
  });
type Form = z.infer<typeof schema>;

const toForm = (s: MenuService | null): Form => ({
  name: s?.name ?? "",
  category: s?.category ?? "Hair",
  gender: s?.gender ?? "unisex",
  description: s?.description ?? "",
  duration: String(s?.durationMinutes ?? 30),
  price: s ? String(s.pricePaise / 100) : "",
  allowWalkIn: s?.allowWalkIn ?? true,
  allowAppointment: s?.allowAppointment ?? true,
  isActive: s?.isActive ?? true,
});

/** Add a custom service (service = null) or edit one on the menu. */
export function ServiceDialog({
  service,
  open,
  onClose,
}: {
  service: MenuService | null;
  open: boolean;
  onClose: () => void;
}) {
  const action = useMenuAction();
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: toForm(service),
  });

  const submit = (v: Form) => {
    const input = {
      name: v.name,
      category: v.category,
      gender: v.gender,
      description: v.description,
      durationMinutes: Number(v.duration),
      pricePaise: rupeesToPaise(v.price) ?? 0,
      allowWalkIn: v.allowWalkIn,
      allowAppointment: v.allowAppointment,
    };
    action.mutate(
      service
        ? {
            kind: "update",
            id: service.id,
            patch: { ...input, isActive: v.isActive },
          }
        : { kind: "create", input },
      { onSuccess: onClose },
    );
  };

  const bothOff = formState.errors.allowAppointment?.message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={service ? `Edit ${service.name}` : "Add a service"}
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ServiceFieldInputs control={control} />
        <div className="space-y-3 rounded-lg border border-line p-3">
          <ControlledSwitch
            control={control}
            name="allowWalkIn"
            label="Walk-in queue"
            hint="Customers can pick it when they join the queue."
          />
          <ControlledSwitch
            control={control}
            name="allowAppointment"
            label="Appointments"
            hint="Customers can book it ahead."
          />
          {bothOff && (
            <p role="alert" className="text-xs text-danger-700">
              {bothOff}
            </p>
          )}
          {service && (
            <ControlledSwitch
              control={control}
              name="isActive"
              label="Shown to customers"
              hint="Off: kept on the menu but hidden for now."
            />
          )}
        </div>
        {action.isError && (
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={action.isPending}>
            {service ? "Save service" : "Add service"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
