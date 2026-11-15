import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { apiErrorMessage } from "@api/apiClient";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { useForgotPassword } from "@modules/auth/hooks/useAuth";
import { emailFormSchema, type EmailForm } from "@modules/auth/auth.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button } from "@shared/ui";

export default function ForgotPasswordScreen() {
  const forgot = useForgotPassword();
  const navigate = useNavigate();
  const { control, handleSubmit } = useForm<EmailForm>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: "" },
  });

  const submit = ({ email }: EmailForm) =>
    forgot.mutate(email, {
      onSuccess: () =>
        navigate(`/reset-password?email=${encodeURIComponent(email)}`),
    });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a 6-digit code."
      footer={
        <Link
          to="/login"
          className="font-medium text-brand-700 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
        />
        {forgot.isError && (
          <Alert tone="danger">{apiErrorMessage(forgot.error)}</Alert>
        )}
        <Button type="submit" className="w-full" loading={forgot.isPending}>
          Send code
        </Button>
      </form>
    </AuthLayout>
  );
}
