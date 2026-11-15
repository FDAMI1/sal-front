import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@api/apiClient";
import { useSalon, useUpdateSalon } from "@modules/salon/hooks/useSalon";
import {
  salonProfileFormSchema,
  type SalonProfileForm,
} from "@modules/salon/salon.validation";
import type { Salon } from "@modules/salon/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ControlledSelect } from "@shared/form/ControlledSelect";
import { BusinessHoursCard } from "@modules/salon/components/BusinessHoursCard";
import { HolidaysCard } from "@modules/salon/components/HolidaysCard";
import { QueueSettingsCard } from "@modules/salon/components/QueueSettingsCard";
import { formatPaise } from "@shared/format";
import {
  Alert,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@shared/ui";

const localNumber = (phone: string) => phone.replace(/^\+91/, "");

/** Every IANA zone the browser knows, Asia/Kolkata first since most salons use it. */
const TIMEZONES = (() => {
  const all =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  const rest = all.filter((z) => z !== "Asia/Kolkata");
  return ["Asia/Kolkata", ...rest].map((z) => ({
    value: z,
    label: z.replace(/_/g, " "),
  }));
})();

function toForm(s: Salon): SalonProfileForm {
  return {
    ...s.contact,
    name: s.name,
    phone: localNumber(s.contact.phone),
    timezone: s.timezone,
  };
}

function ProfileCard({ salon }: { salon: Salon }) {
  const update = useUpdateSalon();
  const { control, handleSubmit, reset, formState } = useForm<SalonProfileForm>(
    {
      resolver: zodResolver(salonProfileFormSchema),
      defaultValues: toForm(salon),
    },
  );

  const submit = ({ name, timezone, ...contact }: SalonProfileForm) =>
    update.mutate(
      { name, timezone, contact },
      { onSuccess: (s) => reset(toForm(s)) },
    );

  // The salon's own zone may be one this browser does not list.
  const zones = TIMEZONES.some((z) => z.value === salon.timezone)
    ? TIMEZONES
    : [{ value: salon.timezone, label: salon.timezone }, ...TIMEZONES];

  return (
    <Card
      title="Salon details"
      description="Shown to customers on your booking page."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledInput control={control} name="name" label="Salon name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledInput
            control={control}
            name="phone"
            label="Contact mobile"
            type="tel"
          />
          <ControlledInput
            control={control}
            name="email"
            label="Contact email"
            type="email"
          />
        </div>
        <ControlledInput control={control} name="addressLine" label="Address" />
        <div className="grid gap-4 sm:grid-cols-3">
          <ControlledInput control={control} name="city" label="City" />
          <ControlledInput control={control} name="state" label="State" />
          <ControlledInput
            control={control}
            name="pincode"
            label="PIN code"
            inputMode="numeric"
          />
        </div>
        <ControlledSelect
          control={control}
          name="timezone"
          label="Time zone"
          options={zones}
        />
        {update.isError && (
          <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
        )}
        {update.isSuccess && !formState.isDirty && (
          <Alert tone="success">Salon saved.</Alert>
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

function PlanCard({ salon }: { salon: Salon }) {
  const plan = salon.plan;
  return (
    <Card
      title="Plan"
      description="Plans are set by SmartQueue. Contact us to change yours."
    >
      {plan ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-ink-subtle">Plan</dt>
            <dd className="font-medium text-ink">{plan.name}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Price</dt>
            <dd className="font-medium text-ink">
              {formatPaise(plan.pricePaise)} / {plan.interval}
            </dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Staff accounts</dt>
            <dd className="font-medium text-ink">
              Up to {plan.limits.workers}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-ink-subtle">
          No plan assigned yet. You can set up your salon in the meantime.
        </p>
      )}
    </Card>
  );
}

export default function SalonSettingsScreen() {
  const salon = useSalon();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Salon profile"
        description="Your business details, opening hours and plan."
      />
      {salon.isPending ? (
        <div aria-busy="true" aria-label="Loading salon">
          <Skeleton className="h-80 w-full" />
        </div>
      ) : salon.isError ? (
        <ErrorState
          title="Could not load your salon"
          message={apiErrorMessage(salon.error)}
          onRetry={() => void salon.refetch()}
          retrying={salon.isFetching}
        />
      ) : (
        <>
          <ProfileCard key={salon.data.id} salon={salon.data} />
          <BusinessHoursCard key={`h-${salon.data.id}`} salon={salon.data} />
          <HolidaysCard timezone={salon.data.timezone} />
          <QueueSettingsCard key={`q-${salon.data.id}`} salon={salon.data} />
          <PlanCard salon={salon.data} />
        </>
      )}
    </div>
  );
}
