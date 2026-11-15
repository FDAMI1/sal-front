import { useId, type InputHTMLAttributes } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { cn } from "@shared/cn";
import { FieldShell } from "./FieldShell";
import { controlClass, describedBy } from "./fieldStyles";

interface ControlledInputProps<T extends FieldValues> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "defaultValue"
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}

/**
 * Labelled text input bound to react-hook-form. The error is tied to the
 * input with aria-describedby, so screen readers read it with the field.
 */
export function ControlledInput<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  className,
  ...rest
}: ControlledInputProps<T>) {
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
      <input
        id={id}
        {...rest}
        {...field}
        value={
          typeof field.value === "string" || typeof field.value === "number"
            ? field.value
            : ""
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn("h-10", controlClass(Boolean(error)))}
      />
    </FieldShell>
  );
}
