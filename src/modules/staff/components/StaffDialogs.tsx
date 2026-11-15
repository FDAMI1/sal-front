import { fieldIssues } from "@api/apiClient";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@api/apiClient";
import { useCreateStaff, useUpdateStaff } from "@modules/staff/hooks/useStaff";
import {
  createStaffFormSchema,
  newPasswordSchema,
  type CreateStaffForm,
  type NewPasswordForm,
} from "@modules/staff/staff.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button, Dialog } from "@shared/ui";

const CREATE_FIELDS = ["name", "displayName", "email", "phone"] as const;

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

/** A new staff login; opens their profile so skills and hours can be set. */
export function AddStaffDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateStaff();
  const navigate = useNavigate();
  const { control, handleSubmit, setError } = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
    },
  });
  const submit = (v: CreateStaffForm) =>
    create.mutate(
      {
        name: v.name,
        displayName: v.displayName || undefined,
        email: v.email,
        phone: v.phone || null,
        password: v.password,
      },
      {
        onSuccess: (w) => void navigate(`/app/staff/${w.id}`),
        onError: (err) =>
          fieldIssues(err, CREATE_FIELDS).forEach((i) =>
            setError(i.field, { message: i.message }),
          ),
      },
    );
  const shownOnFields = fieldIssues(create.error, CREATE_FIELDS).length > 0;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add staff"
      description="They sign in at /login with this email or mobile number."
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
            label="Full name"
            autoFocus
          />
          <ControlledInput
            control={control}
            name="displayName"
            label="Display name (optional)"
            hint="Shown to customers. Defaults to the first name."
          />
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
        {create.isError && !shownOnFields && (
          <Alert tone="danger">{apiErrorMessage(create.error)}</Alert>
        )}
        <Actions busy={create.isPending} label="Add staff" onCancel={onClose} />
      </form>
    </Dialog>
  );
}

/** Sets a new password; the worker is signed out on every device. */
export function SetPasswordDialog({
  workerId,
  name,
  onClose,
}: {
  workerId: string;
  name: string;
  onClose: () => void;
}) {
  const update = useUpdateStaff();
  const { control, handleSubmit } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const submit = (v: NewPasswordForm) =>
    update.mutate(
      { id: workerId, patch: { password: v.password } },
      { onSuccess: onClose },
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title={`New password for ${name}`}
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
        {update.isError && (
          <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
        )}
        <Actions
          busy={update.isPending}
          label="Set password"
          onCancel={onClose}
        />
      </form>
    </Dialog>
  );
}
