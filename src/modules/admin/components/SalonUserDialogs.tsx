import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiErrorMessage } from "@api/apiClient";
import { useSalonUserAction } from "@modules/admin/hooks/useAdminSalons";
import type { SalonUser } from "@modules/admin/types";
import { isMobile, passwordRule } from "@modules/auth/auth.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button, Dialog } from "@shared/ui";

const newPassword = z
  .object({ password: passwordRule, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

const adminSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name").max(80),
    email: z.string().trim().pipe(z.email("Enter a valid email")),
    phone: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || isMobile(v),
        "Enter a valid 10-digit mobile number",
      ),
  })
  .and(newPassword);
type AdminForm = z.infer<typeof adminSchema>;
type PasswordForm = z.infer<typeof newPassword>;

function Actions({
  busy,
  label,
  onCancel,
}: {
  busy: boolean;
  label: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" loading={busy}>
        {label}
      </Button>
    </div>
  );
}

/** Another salon admin login for this salon (counts against its user limit). */
export function AddSalonAdminDialog({
  salonId,
  open,
  onClose,
}: {
  salonId: string;
  open: boolean;
  onClose: () => void;
}) {
  const action = useSalonUserAction(salonId);
  const { control, handleSubmit } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
    },
  });
  const submit = (v: AdminForm) =>
    action.mutate(
      {
        kind: "create",
        input: {
          name: v.name,
          email: v.email,
          phone: v.phone || null,
          password: v.password,
        },
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add a salon admin"
      description="They sign in at /login and can manage the whole salon."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledInput control={control} name="name" label="Name" autoFocus />
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
            label="Mobile (optional)"
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
        {action.isError && (
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        )}
        <Actions busy={action.isPending} label="Add admin" onCancel={onClose} />
      </form>
    </Dialog>
  );
}

/** Sets a new password; the account is signed out everywhere and unlocked. */
export function SetPasswordDialog({
  salonId,
  user,
  onClose,
}: {
  salonId: string;
  user: SalonUser;
  onClose: () => void;
}) {
  const action = useSalonUserAction(salonId);
  const { control, handleSubmit } = useForm<PasswordForm>({
    resolver: zodResolver(newPassword),
    defaultValues: { password: "", confirm: "" },
  });
  const submit = (v: PasswordForm) =>
    action.mutate(
      { kind: "update", userId: user.id, password: v.password },
      { onSuccess: onClose },
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title={`New password for ${user.name}`}
      description="They are signed out on every device and use this password next time. Share it with them privately."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          autoFocus
        />
        <ControlledInput
          control={control}
          name="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        {action.isError && (
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        )}
        <Actions
          busy={action.isPending}
          label="Set password"
          onCancel={onClose}
        />
      </form>
    </Dialog>
  );
}
