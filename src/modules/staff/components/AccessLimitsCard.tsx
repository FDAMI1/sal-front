import { fieldIssues } from "@api/apiClient";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@api/apiClient";
import { useUpdatePolicy } from "@modules/staff/hooks/useStaff";
import {
  policyFormSchema,
  type PolicyForm,
} from "@modules/staff/staff.validation";
import type { StaffLimits } from "@modules/staff/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ControlledSwitch } from "@shared/form/ControlledSwitch";
import { Alert, Button, Card } from "@shared/ui";

const FIELDS = ["maxStaff", "devicesPerStaff"] as const;

const toForm = (l: StaffLimits): PolicyForm => ({
  maxStaffAuto: l.policy.maxStaff === null,
  maxStaff: String(l.policy.maxStaff ?? l.maxStaff ?? ""),
  devicesAuto: l.policy.devicesPerStaff === null,
  devicesPerStaff: String(l.policy.devicesPerStaff ?? l.devicesPerStaff),
});

/** The salon's own caps, at most what the subscription allows. */
export function AccessLimitsCard({ limits }: { limits: StaffLimits }) {
  const update = useUpdatePolicy();
  const { control, handleSubmit, setError, reset, formState } =
    useForm<PolicyForm>({
      resolver: zodResolver(policyFormSchema),
      defaultValues: toForm(limits),
    });
  const [maxStaffAuto, devicesAuto] = useWatch({
    control,
    name: ["maxStaffAuto", "devicesAuto"],
  });
  const sub = limits.subscription;

  const submit = (v: PolicyForm) =>
    update.mutate(
      {
        maxStaff: v.maxStaffAuto ? null : Number(v.maxStaff),
        devicesPerStaff: v.devicesAuto ? null : Number(v.devicesPerStaff),
      },
      {
        onSuccess: (l) => reset(toForm(l)),
        onError: (err) =>
          fieldIssues(err, FIELDS).forEach((i) =>
            setError(i.field, { message: i.message }),
          ),
      },
    );
  const shownOnFields = fieldIssues(update.error, FIELDS).length > 0;

  return (
    <Card
      title="Limits"
      description={`Your ${sub.planName ? `${sub.planName} plan` : "subscription"} allows ${sub.maxStaff === null ? "unlimited" : sub.maxStaff} staff account${sub.maxStaff === 1 ? "" : "s"} and ${sub.devicesPerStaff} device${sub.devicesPerStaff === 1 ? "" : "s"} per account.`}
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <ControlledInput
              control={control}
              name="maxStaff"
              label="Maximum staff accounts"
              inputMode="numeric"
              disabled={maxStaffAuto}
              hint={`Subscription maximum: ${sub.maxStaff ?? "Unlimited"}`}
            />
            <ControlledSwitch
              control={control}
              name="maxStaffAuto"
              label="Use subscription maximum"
            />
          </div>
          <div className="space-y-3">
            <ControlledInput
              control={control}
              name="devicesPerStaff"
              label="Maximum devices per staff account"
              inputMode="numeric"
              disabled={devicesAuto}
              hint={`Subscription maximum: ${sub.devicesPerStaff}`}
            />
            <ControlledSwitch
              control={control}
              name="devicesAuto"
              label="Use subscription maximum"
            />
          </div>
        </div>
        {update.isError && !shownOnFields && (
          <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
        )}
        {update.isSuccess && !formState.isDirty && (
          <Alert tone="success">Limits saved.</Alert>
        )}
        <Button
          type="submit"
          loading={update.isPending}
          disabled={!formState.isDirty}
        >
          Save limits
        </Button>
      </form>
    </Card>
  );
}
