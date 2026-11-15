import { useId, type SelectHTMLAttributes } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { cn } from "@shared/cn";
import { FieldShell } from "./FieldShell";
import { controlClass, describedBy } from "./fieldStyles";

export interface SelectOption {
  value: string;
  label: string;
}

interface ControlledSelectProps<T extends FieldValues> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "name" | "defaultValue"
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  hint?: string;
}

/** Native <select>: keyboard, screen readers and phones handle it best. */
export function ControlledSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  hint,
  className,
  ...rest
}: ControlledSelectProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const id = useId();
  const error = fieldState.error?.message;

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
    >
      <select
        id={id}
        {...rest}
        {...field}
        value={typeof field.value === "string" ? field.value : ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn("h-10", controlClass(Boolean(error)))}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
