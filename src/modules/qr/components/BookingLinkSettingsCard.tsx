import { useState } from "react";
import { useForm } from "react-hook-form";
import { RefreshCw } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import type { Salon } from "@modules/salon/types";
import { useUpdateBookingLink } from "@modules/qr/hooks/useBookingLink";
import { ControlledSwitch } from "@shared/form/ControlledSwitch";
import { formatDateTime } from "@shared/format";
import { Alert, Button, Card, ConfirmDialog } from "@shared/ui";

interface LinkStatusForm {
  isActive: boolean;
}

function LinkStatusForm({ salon }: { salon: Salon }) {
  const update = useUpdateBookingLink();
  const { control, handleSubmit, reset, formState } = useForm<LinkStatusForm>({
    defaultValues: { isActive: salon.bookingLink.isActive },
  });

  const submit = ({ isActive }: LinkStatusForm) =>
    update.mutate(
      { isActive },
      {
        onSuccess: (s) => reset({ isActive: s.bookingLink.isActive }),
      },
    );

  return (
    <form
      noValidate
      onSubmit={(e) => void handleSubmit(submit)(e)}
      className="space-y-4"
    >
      <ControlledSwitch
        control={control}
        name="isActive"
        label="Booking link is on"
        hint="When off, customers who scan your QR code see that the link is not valid."
      />
      {update.isError && (
        <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
      )}
      {update.isSuccess && !formState.isDirty && (
        <Alert tone="success">Link status saved.</Alert>
      )}
      <Button
        type="submit"
        loading={update.isPending}
        disabled={!formState.isDirty}
      >
        Save link status
      </Button>
    </form>
  );
}

function RegenerateSection({ salon }: { salon: Salon }) {
  const regenerate = useUpdateBookingLink();
  const [confirming, setConfirming] = useState(false);
  const { regeneratedAt, generatedAt } = salon.bookingLink;

  const confirm = () =>
    regenerate.mutate(
      { regenerate: true },
      { onSuccess: () => setConfirming(false) },
    );

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium text-ink">Generate new QR code</p>
        <p className="text-xs text-ink-subtle">
          {generatedAt
            ? `Current QR code generated ${formatDateTime(generatedAt)}. `
            : ""}
          {regeneratedAt
            ? "It replaced an earlier code."
            : "It has never been replaced."}{" "}
          It stays the same everywhere until you generate a new one here.
        </p>
      </div>
      {regenerate.isError && !confirming && (
        <Alert tone="danger">{apiErrorMessage(regenerate.error)}</Alert>
      )}
      {regenerate.isSuccess && (
        <Alert tone="success">
          New QR code ready. Download and print it to replace the old one.
        </Alert>
      )}
      <Button
        variant="secondary"
        icon={<RefreshCw className="size-4" aria-hidden="true" />}
        onClick={() => {
          regenerate.reset();
          setConfirming(true);
        }}
      >
        Generate new QR code
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Generate a new QR code?"
        confirmLabel="Generate new code"
        busy={regenerate.isPending}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      >
        <p>
          Every QR code you have already printed or shared will stop working.
          Customers who scan an old code will see that the link is not valid, so
          you will need to print the new one.
        </p>
        {regenerate.isError && (
          <div className="mt-3">
            <Alert tone="danger">{apiErrorMessage(regenerate.error)}</Alert>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

/** Link status switch and code regeneration for the salon's booking QR. */
export function BookingLinkSettingsCard({ salon }: { salon: Salon }) {
  return (
    <Card
      title="QR code settings"
      description="Your salon has one QR code. It stays valid until you generate a new one or switch the link off, and it never contains staff or admin details."
    >
      <div className="space-y-6">
        <LinkStatusForm salon={salon} />
        <hr className="border-line" />
        <RegenerateSection salon={salon} />
      </div>
    </Card>
  );
}
