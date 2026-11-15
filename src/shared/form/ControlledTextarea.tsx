import { useId, type TextareaHTMLAttributes } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { cn } from "@shared/cn";
import { FieldShell } from "./FieldShell";
import { controlClass, describedBy } from "./fieldStyles";

interface ControlledTextareaProps<T extends FieldValues> extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name" | "defaultValue"
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}

export function ControlledTextarea<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  className,
  rows = 3,
  ...rest
}: ControlledTextareaProps<T>) {
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
      <textarea
        id={id}
        rows={rows}
        {...rest}
        {...field}
        value={typeof field.value === "string" ? field.value : ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn("py-2", controlClass(Boolean(error)))}
      />
    </FieldShell>
  );
}
