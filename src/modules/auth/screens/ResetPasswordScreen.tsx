import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router";
import { apiErrorMessage } from "@api/apiClient";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { useResetPassword } from "@modules/auth/hooks/useAuth";
import { resetFormSchema, type ResetForm } from "@modules/auth/auth.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button } from "@shared/ui";

export default function ResetPasswordScreen() {
  const [params] = useSearchParams();
  const reset = useResetPassword();
  const { control, handleSubmit } = useForm<ResetForm>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      email: params.get("email") ?? "",
      code: "",
      password: "",
      confirm: "",
    },
  });

  if (reset.isSuccess) {
    return (
      <AuthLayout title="Password changed">
        <Alert tone="success">{reset.data}</Alert>
        <Link
          to="/login"
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-600 font-medium text-white hover:bg-brand-800"
        >
          Go to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Enter your reset code"
      subtitle="If the email has an account, a code is on its way. It expires in 30 minutes."
      footer={
        <Link
          to="/forgot-password"
          className="font-medium text-brand-700 hover:underline"
        >
          Send a new code
        </Link>
      }
    >
      <form
        noValidate
        onSubmit={(e) =>
          void handleSubmit(({ email, code, password }) =>
            reset.mutate({ email, code, password }),
          )(e)
        }
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <ControlledInput
          control={control}
          name="code"
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
        />
        <ControlledInput
          control={control}
          name="password"
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
        {reset.isError && (
          <Alert tone="danger">{apiErrorMessage(reset.error)}</Alert>
        )}
        <Button type="submit" className="w-full" loading={reset.isPending}>
          Change password
        </Button>
      </form>
    </AuthLayout>
  );
}
