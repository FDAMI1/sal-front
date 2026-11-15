import { fieldIssues } from "@api/apiClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@api/apiClient";
import { useUpdateStaff } from "@modules/staff/hooks/useStaff";
import {
  staffProfileFormSchema,
  type StaffProfileForm,
} from "@modules/staff/staff.validation";
import type { WorkerDetail } from "@modules/staff/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { Alert, Button, Card } from "@shared/ui";

const FIELDS = ["name", "displayName", "phone"] as const;

export function StaffProfileCard({ worker }: { worker: WorkerDetail }) {
  const update = useUpdateStaff();
  const { control, handleSubmit, setError, reset, formState } =
    useForm<StaffProfileForm>({
      resolver: zodResolver(staffProfileFormSchema),
      defaultValues: {
        name: worker.name,
        displayName: worker.displayName,
        phone: worker.phone ?? "",
      },
    });

  const submit = (v: StaffProfileForm) =>
    update.mutate(
      {
        id: worker.id,
        patch: {
          name: v.name,
          displayName: v.displayName,
          phone: v.phone || null,
        },
      },
      {
        onSuccess: () => reset(v),
        onError: (err) =>
          fieldIssues(err, FIELDS).forEach((i) =>
            setError(i.field, { message: i.message }),
          ),
      },
    );
  const shownOnFields = fieldIssues(update.error, FIELDS).length > 0;

  return (
    <Card title="Profile" description={`Signs in with ${worker.email}.`}>
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <ControlledInput control={control} name="name" label="Full name" />
          <ControlledInput
            control={control}
            name="displayName"
            label="Display name"
            hint="Shown to customers."
          />
          <ControlledInput
            control={control}
            name="phone"
            label="Mobile (optional)"
            inputMode="tel"
          />
        </div>
        {update.isError && !shownOnFields && (
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
          Save profile
        </Button>
      </form>
    </Card>
  );
}
