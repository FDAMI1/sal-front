import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiErrorMessage } from "@api/apiClient";
import { useCatalogAction } from "@modules/admin/hooks/useAdminCatalog";
import { ServiceFieldInputs } from "@modules/salon/components/ServiceFieldInputs";
import { serviceFieldsSchema } from "@modules/salon/service.validation";
import type { CatalogItem } from "@modules/salon/types";
import { ControlledSwitch } from "@shared/form/ControlledSwitch";
import { rupeesToPaise } from "@shared/format";
import { Alert, Button, Dialog } from "@shared/ui";

const schema = serviceFieldsSchema.extend({ isActive: z.boolean() });
type Form = z.infer<typeof schema>;

const toForm = (c: CatalogItem | null): Form => ({
  name: c?.name ?? "",
  category: c?.category ?? "Hair",
  gender: c?.gender ?? "unisex",
  description: c?.description ?? "",
  duration: String(c?.defaultDurationMinutes ?? 30),
  price: c ? String(c.defaultPricePaise / 100) : "",
  isActive: c?.isActive ?? true,
});

/** Add (item = null) or edit a master catalogue service. */
export function CatalogDialog({
  item,
  onClose,
}: {
  item: CatalogItem | null;
  onClose: () => void;
}) {
  const action = useCatalogAction();
  const { control, handleSubmit } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: toForm(item),
  });

  const submit = (v: Form) => {
    const input = {
      name: v.name,
      category: v.category,
      gender: v.gender,
      description: v.description,
      defaultDurationMinutes: Number(v.duration),
      defaultPricePaise: rupeesToPaise(v.price) ?? 0,
    };
    action.mutate(
      item
        ? {
            kind: "update",
            id: item.id,
            patch: { ...input, isActive: v.isActive },
          }
        : { kind: "create", input },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? `Edit ${item.name}` : "Add to catalogue"}
      description="Salons import these as a starting point; each branch then sets its own price."
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="space-y-4"
      >
        <ServiceFieldInputs control={control} priceLabel="Default price (₹)" />
        {item && (
          <ControlledSwitch
            control={control}
            name="isActive"
            label="Offered to salons"
            hint="Off: hidden from import. Salons that already have it keep it."
          />
        )}
        {action.isError && (
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={action.isPending}>
            {item ? "Save" : "Add service"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
