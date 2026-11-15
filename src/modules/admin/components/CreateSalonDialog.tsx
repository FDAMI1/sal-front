import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { apiErrorMessage } from "@api/apiClient";
import { useCreateSalon, usePlans } from "@modules/admin/hooks/useAdminSalons";
import { registerFormSchema } from "@modules/salon/salon.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ControlledSelect } from "@shared/form/ControlledSelect";
import { formatPaise } from "@shared/format";
import { Alert, Button, Dialog } from "@shared/ui";

const schema = registerFormSchema.and(z.object({ planId: z.string() }));
type Form = z.infer<typeof schema>;

/**
 * The super admin sets up a salon with its admin login. It is approved at
 * once, so the admin can sign in with these details straight away.
 */
export function CreateSalonDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateSalon();
  const plans = usePlans();
  const navigate = useNavigate();
  const { control, handleSubmit } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      salonName: "",
      city: "",
      ownerName: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
      planId: "",
    },
  });

  const planOptions = [
    { value: "", label: "No plan yet" },
    ...(plans.data ?? [])
      .filter((p) => p.isActive)
      .map((p) => ({
        value: p.id,
        label: `${p.name} (${formatPaise(p.pricePaise)} / ${p.interval})`,
      })),
  ];

  const submit = ({ confirm: _confirm, planId, ...v }: Form) =>
    create.mutate(
      { ...v, planId: planId || null },
      {
        onSuccess: ({ salonId }) => {
          onClose();
          void navigate(`/admin/salons/${salonId}`);
        },
      },
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create a salon"
      description="Approved at once. Its admin signs in at /login with the email or mobile and password below."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledInput
            control={control}
            name="salonName"
            label="Salon name"
            autoFocus
          />
          <ControlledInput control={control} name="city" label="City" />
          <ControlledSelect
            control={control}
            name="planId"
            label="Plan"
            options={planOptions}
          />
        </div>
        <fieldset className="space-y-4 rounded-lg border border-line p-3">
          <legend className="px-1 font-medium text-ink">
            Salon admin login
          </legend>
          <ControlledInput control={control} name="ownerName" label="Name" />
          <div className="grid gap-4 sm:grid-cols-2">
            <ControlledInput
              control={control}
              name="email"
              label="Email"
              type="email"
              autoComplete="off"
            />
            <ControlledInput
              control={control}
              name="phone"
              label="Mobile"
              inputMode="tel"
              autoComplete="off"
            />
            <ControlledInput
              control={control}
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
            />
            <ControlledInput
              control={control}
              name="confirm"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </fieldset>
        {create.isError && (
          <Alert tone="danger">{apiErrorMessage(create.error)}</Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create salon
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
