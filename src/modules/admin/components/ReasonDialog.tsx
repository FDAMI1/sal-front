import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ControlledTextarea } from "@shared/form/ControlledTextarea";
import { Button, Dialog } from "@shared/ui";

const schema = z.object({
  reason: z.string().trim().min(3, "Give a short reason").max(300),
});
type Form = z.infer<typeof schema>;

interface ReasonDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** Reject and suspend: the reason is shown to the salon owner, so it is required. */
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const { control, handleSubmit, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });
  const close = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} title={title} description={description} onClose={close}>
      <form
        noValidate
        onSubmit={(e) => void handleSubmit((v) => onConfirm(v.reason))(e)}
        className="space-y-4"
      >
        <ControlledTextarea
          control={control}
          name="reason"
          label="Reason"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
