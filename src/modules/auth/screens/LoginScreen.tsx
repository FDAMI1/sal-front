import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { LogIn } from "lucide-react";
import { apiErrorCode, apiErrorMessage } from "@api/apiClient";
import { useAdminLogin } from "@modules/admin/hooks/useAdminAuth";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { useLogin } from "@modules/auth/hooks/useAuth";
import { loginFormSchema, type LoginForm } from "@modules/auth/auth.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ROLE_HOME } from "@shared/permissions";
import { useStaffSession } from "@shared/store/sessions";
import { Alert, Button } from "@shared/ui";

/** Only same-app paths: an absolute URL here would be an open redirect. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default function LoginScreen() {
  const profile = useStaffSession((s) => s.profile);
  const endedReason = useStaffSession((s) => s.endedReason);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const adminLogin = useAdminLogin();
  const [lastInput, setLastInput] = useState<LoginForm | null>(null);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // Already signed in when the page opened. Not after a sign-in from this
  // form: its own onSuccess navigates, honouring ?next=.
  if (profile && login.isIdle) {
    return <Navigate to={ROLE_HOME[profile.role]} replace />;
  }

  const submit = (values: LoginForm, signOutOthers = false) => {
    setLastInput(values);
    adminLogin.reset();
    login.mutate(
      { ...values, signOutOthers },
      {
        onSuccess: ({ profile: user }) => {
          const next = safeNext(params.get("next"));
          const home = ROLE_HOME[user.role];
          // A worker sent to an admin page would only bounce back; go home.
          navigate(next?.startsWith(home) ? next : home, { replace: true });
        },
        // Not a salon account: it may be the super admin, who signs in by email.
        onError: (err) => {
          if (
            apiErrorCode(err) !== "INVALID_CREDENTIALS" ||
            !values.identifier.includes("@")
          ) {
            return;
          }
          adminLogin.mutate(
            {
              email: values.identifier.trim(),
              password: values.password,
              signOutOthers,
            },
            { onSuccess: () => navigate("/admin", { replace: true }) },
          );
        },
      },
    );
  };

  // The super admin's own error wins unless it is just "wrong credentials",
  // which the salon error already says.
  const adminFailed =
    adminLogin.isError &&
    apiErrorCode(adminLogin.error) !== "INVALID_CREDENTIALS";
  const error = adminFailed ? adminLogin.error : login.error;
  const showError =
    login.isError && !adminLogin.isPending && !adminLogin.isSuccess;
  const pending = login.isPending || adminLogin.isPending;
  const deviceLimit = apiErrorCode(error) === "DEVICE_LIMIT_REACHED";

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Salon owners, managers and stylists."
      footer={
        <>
          Super admin?{" "}
          <Link
            to="/admin/login"
            className="font-medium text-brand-700 hover:underline"
          >
            Sign in here
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit((v) => submit(v))(e)}
        className="space-y-4"
      >
        <ControlledInput
          control={control}
          name="identifier"
          label="Email or mobile number"
          autoComplete="username"
          inputMode="email"
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
        {showError && (
          <Alert tone="danger">
            <p>{apiErrorMessage(error)}</p>
            {deviceLimit && lastInput && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                loading={pending}
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
          loading={pending}
          icon={<LogIn className="size-4" aria-hidden="true" />}
        >
          Sign in
        </Button>
        <p className="text-center">
          <Link
            to="/forgot-password"
            className="font-medium text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
        <p className="border-t border-line pt-4 text-center text-ink-subtle">
          New salon?{" "}
          <Link
            to="/register"
            className="font-medium text-brand-700 hover:underline"
          >
            Register your salon
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
