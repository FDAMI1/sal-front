import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@api/apiClient";
import { useUpdateSalon } from "@modules/salon/hooks/useSalon";
import {
  queueSettingsFormSchema,
  type QueueSettingsForm,
} from "@modules/salon/salon.validation";
import type { Salon } from "@modules/salon/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ControlledSelect } from "@shared/form/ControlledSelect";
import { ControlledSwitch } from "@shared/form/ControlledSwitch";
import { Alert, Button, Card } from "@shared/ui";

function toForm(b: Salon): QueueSettingsForm {
  const q = b.queueSettings;
  return {
    graceMinutes: String(q.graceMinutes),
    autoCall: q.autoCall,
    noShowAction: q.noShowAction,
    getReadyMinutes: String(q.getReadyMinutes),
    comeNowMinutes: String(q.comeNowMinutes),
    stopJoiningMinutesBeforeClose: String(q.stopJoiningMinutesBeforeClose),
  };
}

const NO_SHOW_OPTIONS = [
  { value: "no_show", label: "Mark as no-show" },
  { value: "requeue", label: "Put back in the queue" },
];

/** How the live queue behaves (used from Phase 7). */
export function QueueSettingsCard({ salon }: { salon: Salon }) {
  const update = useUpdateSalon();
  const { control, handleSubmit, reset, formState } =
    useForm<QueueSettingsForm>({
      resolver: zodResolver(queueSettingsFormSchema),
      defaultValues: toForm(salon),
    });

  const submit = (v: QueueSettingsForm) =>
    update.mutate(
      {
        queueSettings: {
          graceMinutes: Number(v.graceMinutes),
          autoCall: v.autoCall,
          noShowAction: v.noShowAction,
          getReadyMinutes: Number(v.getReadyMinutes),
          comeNowMinutes: Number(v.comeNowMinutes),
          stopJoiningMinutesBeforeClose: Number(
            v.stopJoiningMinutesBeforeClose,
          ),
        },
      },
      { onSuccess: (b) => reset(toForm(b)) },
    );

  return (
    <Card
      title="Queue rules"
      description="How customers are called and alerted."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ControlledSwitch
          control={control}
          name="autoCall"
          label="Call the next customer automatically"
          hint="When a stylist finishes, the next person in their lane is called without a tap."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledInput
            control={control}
            name="graceMinutes"
            label="Grace period (minutes)"
            inputMode="numeric"
            hint="Time a called customer has to reach the chair."
          />
          <ControlledSelect
            control={control}
            name="noShowAction"
            label="After the grace period"
            options={NO_SHOW_OPTIONS}
          />
          <ControlledInput
            control={control}
            name="getReadyMinutes"
            label='"Get ready" alert (minutes before turn)'
            inputMode="numeric"
          />
          <ControlledInput
            control={control}
            name="comeNowMinutes"
            label='"Come now" alert (minutes before turn)'
            inputMode="numeric"
          />
          <ControlledInput
            control={control}
            name="stopJoiningMinutesBeforeClose"
            label="Stop walk-ins (minutes before closing)"
            inputMode="numeric"
          />
        </div>
        {update.isError && (
          <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
        )}
        {update.isSuccess && !formState.isDirty && (
          <Alert tone="success">Queue rules saved.</Alert>
        )}
        <Button
          type="submit"
          loading={update.isPending}
          disabled={!formState.isDirty}
        >
          Save queue rules
        </Button>
      </form>
    </Card>
  );
}
