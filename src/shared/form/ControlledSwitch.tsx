import { useId } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { cn } from "@shared/cn";

interface ControlledSwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}

/** On/off setting: a real checkbox (keyboard, forms, screen readers) styled as a switch. */
export function ControlledSwitch<T extends FieldValues>({
  control,
  name,
  label,
  hint,
}: ControlledSwitchProps<T>) {
  const {
    field: { value, onChange, ...field },
  } = useController({ control, name });
  const id = useId();
  const checked = value === true;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium text-ink">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-subtle">
            {hint}
          </p>
        )}
      </div>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          {...field}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            "h-6 w-11 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600",
            checked ? "bg-brand-600" : "bg-line",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </div>
  );
}
