import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorCode, apiErrorMessage } from "@api/apiClient";
import { useChangePassword } from "@modules/auth/hooks/useAuth";
import {
  changePasswordFormSchema,
  type ChangePasswordForm,
} from "@modules/auth/auth.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button, Card } from "@shared/ui";

const EMPTY = { currentPassword: "", newPassword: "", confirm: "" };

export function ChangePasswordCard() {
  const change = useChangePassword();
  const { control, handleSubmit, reset, setError } =
    useForm<ChangePasswordForm>({
      resolver: zodResolver(changePasswordFormSchema),
      defaultValues: EMPTY,
    });

  const submit = ({ currentPassword, newPassword }: ChangePasswordForm) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => reset(EMPTY),
        onError: (err) => {
          if (apiErrorCode(err) === "WRONG_PASSWORD") {
            setError("currentPassword", {
              message: "This is not your current password",
            });
          }
        },
      },
    );

  const wrongPassword = apiErrorCode(change.error) === "WRONG_PASSWORD";

  return (
    <Card
      title="Change password"
      description="Your other devices will be signed out."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
        />
        <ControlledInput
          control={control}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with letters and numbers."
        />
        <ControlledInput
          control={control}
          name="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        {change.isError && !wrongPassword && (
          <Alert tone="danger">{apiErrorMessage(change.error)}</Alert>
        )}
        {change.isSuccess && <Alert tone="success">{change.data}</Alert>}
        <Button type="submit" loading={change.isPending}>
          Change password
        </Button>
      </form>
    </Card>
  );
}
