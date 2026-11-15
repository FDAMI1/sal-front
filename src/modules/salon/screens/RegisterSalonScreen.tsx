import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Store } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { useRegisterSalon } from "@modules/salon/hooks/useSalon";
import {
  registerFormSchema,
  type RegisterForm,
} from "@modules/salon/salon.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button } from "@shared/ui";

const EMPTY: RegisterForm = {
  salonName: "",
  city: "",
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
};

/** Public sign-up for a new salon. It waits for super admin approval. */
export default function RegisterSalonScreen() {
  const register = useRegisterSalon();
  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: EMPTY,
  });

  if (register.isSuccess) {
    return (
      <AuthLayout title="Registration received">
        <Alert tone="success">
          {register.data ?? "You can sign in once your salon is approved."}
        </Alert>
        <p className="mt-3 text-ink-subtle">
          We check every new salon before it goes live. You'll be able to sign
          in with the email and password you just chose as soon as it's
          approved.
        </p>
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
      title="Register your salon"
      subtitle="Set up your salon and your owner account."
      footer={
        <>
          Already registered?{" "}
          <Link
            to="/login"
            className="font-medium text-brand-700 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) =>
          void handleSubmit(({ confirm: _confirm, ...input }) =>
            register.mutate(input),
          )(e)
        }
        className="space-y-4"
      >
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
            Salon
          </legend>
          <ControlledInput
            control={control}
            name="salonName"
            label="Salon name"
            autoComplete="organization"
            autoFocus
          />
          <ControlledInput
            control={control}
            name="city"
            label="City"
            autoComplete="address-level2"
          />
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
            Owner account
          </legend>
          <ControlledInput
            control={control}
            name="ownerName"
            label="Your name"
            autoComplete="name"
          />
          <ControlledInput
            control={control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <ControlledInput
            control={control}
            name="phone"
            label="Mobile number"
            type="tel"
            autoComplete="tel-national"
          />
          <ControlledInput
            control={control}
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with letters and numbers."
          />
          <ControlledInput
            control={control}
            name="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />
        </fieldset>
        {register.isError && (
          <Alert tone="danger">{apiErrorMessage(register.error)}</Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          loading={register.isPending}
          icon={<Store className="size-4" aria-hidden="true" />}
        >
          Register salon
        </Button>
      </form>
    </AuthLayout>
  );
}
