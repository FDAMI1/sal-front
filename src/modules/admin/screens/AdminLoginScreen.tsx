import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { apiErrorCode, apiErrorMessage } from "@api/apiClient";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { useAdminLogin } from "@modules/admin/hooks/useAdminAuth";
import { ControlledInput } from "@shared/form/ControlledInput";
import { usePlatformSession } from "@shared/store/sessions";
import { Alert, Button } from "@shared/ui";

const schema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password"),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginScreen() {
  const profile = usePlatformSession((s) => s.profile);
  const endedReason = usePlatformSession((s) => s.endedReason);
  const login = useAdminLogin();
  const navigate = useNavigate();
  const [lastInput, setLastInput] = useState<Form | null>(null);
  const { control, handleSubmit } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (profile && login.isIdle) return <Navigate to="/admin" replace />;

  const submit = (values: Form, signOutOthers = false) => {
    setLastInput(values);
    login.mutate(
      { ...values, signOutOthers },
      { onSuccess: () => navigate("/admin", { replace: true }) },
    );
  };

  return (
    <AuthLayout
      title="Super admin sign in"
      subtitle="Platform console for SmartQueue staff."
      footer={
        <Link
          to="/login"
          className="font-medium text-brand-700 hover:underline"
        >
          Salon staff sign in
        </Link>
      }
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit((v) => submit(v))(e)}
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          autoFocus
        />
        <ControlledInput
          control={control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        {endedReason && login.isIdle && (
          <Alert tone="info">You were signed out. {endedReason}</Alert>
        )}
        {login.isError && (
          <Alert tone="danger">
            <p>{apiErrorMessage(login.error)}</p>
            {apiErrorCode(login.error) === "DEVICE_LIMIT_REACHED" &&
              lastInput && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => submit(lastInput, true)}
                >
                  Sign out other devices and continue
                </Button>
              )}
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          loading={login.isPending}
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
