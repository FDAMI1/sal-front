import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@api/apiClient";
import { useUpdateMe } from "@modules/auth/hooks/useAuth";
import {
  profileFormSchema,
  type ProfileForm,
} from "@modules/auth/auth.validation";
import type { StaffUser } from "@modules/auth/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button, Card } from "@shared/ui";

const ROLE_LABEL = { salon_admin: "Salon admin", worker: "Stylist" } as const;

/** "+919876543210" → "9876543210" for editing; the server adds +91 back. */
const localNumber = (phone: string | null) => phone?.replace(/^\+91/, "") ?? "";

export function ProfileDetailsCard({ user }: { user: StaffUser }) {
  const update = useUpdateMe();
  const { control, handleSubmit, reset, formState } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user.name, phone: localNumber(user.phone) },
  });

  const submit = (values: ProfileForm) =>
    update.mutate(
      { name: values.name, phone: values.phone === "" ? null : values.phone },
      {
        onSuccess: (me) =>
          reset({ name: me.name, phone: localNumber(me.phone) }),
      },
    );

  return (
    <Card
      title="Your details"
      description={`${ROLE_LABEL[user.role]} · ${user.email}`}
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="name"
          label="Name"
          autoComplete="name"
        />
        <ControlledInput
          control={control}
          name="phone"
          label="Mobile number"
          inputMode="tel"
          autoComplete="tel-national"
          hint="Optional. You can sign in with it instead of your email."
        />
        {update.isError && (
          <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
        )}
        {update.isSuccess && !formState.isDirty && (
          <Alert tone="success">Profile saved.</Alert>
        )}
        <Button
          type="submit"
          loading={update.isPending}
          disabled={!formState.isDirty}
        >
          Save changes
        </Button>
      </form>
    </Card>
  );
}
