import { useWatch, type Control, type Path } from "react-hook-form";
import {
  GENDER_OPTIONS,
  minutesLabel,
  type ServiceFields,
} from "@modules/salon/service.validation";
import { ControlledInput } from "@shared/form/ControlledInput";
import { ControlledSelect } from "@shared/form/ControlledSelect";
import { formatPaise, rupeesToPaise } from "@shared/format";

/**
 * The fields every service form has: the master catalogue and a branch's
 * menu both use them, so they read and validate the same way.
 */
export function ServiceFieldInputs<T extends ServiceFields>({
  control,
  priceLabel = "Price (₹)",
}: {
  control: Control<T>;
  priceLabel?: string;
}) {
  const f = (name: keyof ServiceFields) => name as Path<T>;
  const price = rupeesToPaise(String(useWatch({ control, name: f("price") })));
  const minutes = Number(useWatch({ control, name: f("duration") }));

  return (
    <>
      <ControlledInput
        control={control}
        name={f("name")}
        label="Service name"
        autoFocus
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ControlledInput
          control={control}
          name={f("category")}
          label="Category"
          hint="e.g. Hair, Skin, Beard & shave"
        />
        <ControlledSelect
          control={control}
          name={f("gender")}
          label="For"
          options={GENDER_OPTIONS}
        />
        <ControlledInput
          control={control}
          name={f("duration")}
          label="Duration (minutes)"
          inputMode="numeric"
          hint={minutes >= 5 ? minutesLabel(minutes) : undefined}
        />
        <ControlledInput
          control={control}
          name={f("price")}
          label={priceLabel}
          inputMode="decimal"
          hint={price !== null ? formatPaise(price) : undefined}
        />
      </div>
      <ControlledInput
        control={control}
        name={f("description")}
        label="Description (optional)"
      />
    </>
  );
}
