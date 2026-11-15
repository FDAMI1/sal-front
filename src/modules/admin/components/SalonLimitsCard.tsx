import { useState } from "react";
import { apiErrorMessage } from "@api/apiClient";
import { useSalonAction } from "@modules/admin/hooks/useAdminSalons";
import type { SalonDetail, SalonLimits } from "@modules/admin/types";
import { Alert, Button, Card } from "@shared/ui";

const FIELDS: {
  key: keyof SalonLimits;
  label: string;
  max: number;
  used: (s: SalonDetail) => string;
}[] = [
  {
    key: "users",
    label: "Staff accounts",
    max: 10_000,
    used: (s) => `${s.staffCount} active`,
  },
  {
    key: "devicesPerUser",
    label: "Devices per staff login",
    max: 50,
    used: () => "signed in at once",
  },
];

const toText = (v: number | null) => (v === null ? "" : String(v));

/**
 * Per-salon caps that override the plan. Empty = follow the plan (or, for
 * devices, the server default). Lowering a cap never removes anything that
 * already exists; it only blocks adding more.
 */
export function SalonLimitsCard({ salon }: { salon: SalonDetail }) {
  const action = useSalonAction(salon.id);
  const { overrides, effective } = salon.limits;
  const [values, setValues] = useState({
    users: toText(overrides.users),
    devicesPerUser: toText(overrides.devicesPerUser),
  });

  const parsed = FIELDS.map(({ key, max }) => {
    const raw = values[key].trim();
    if (raw === "") return { key, value: null, error: null };
    const n = Number(raw);
    const ok = /^\d+$/.test(raw) && n >= 1 && n <= max;
    return { key, value: ok ? n : null, error: ok ? null : `1 to ${max}` };
  });
  const invalid = parsed.some((p) => p.error);
  const dirty = FIELDS.some(
    ({ key }) => values[key].trim() !== toText(overrides[key]),
  );

  const value = (key: keyof SalonLimits) =>
    parsed.find((p) => p.key === key)?.value ?? null;
  const save = () =>
    action.mutate({
      kind: "limits",
      limits: {
        users: value("users"),
        devicesPerUser: value("devicesPerUser"),
      },
    });

  return (
    <Card
      title="Limits"
      description="Override the plan for this salon. Leave a box empty to follow the plan."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f, i) => {
          const error = parsed[i]?.error;
          const now = effective[f.key];
          return (
            <label key={f.key} className="block space-y-1.5">
              <span className="block font-medium text-ink">{f.label}</span>
              <input
                value={values[f.key]}
                inputMode="numeric"
                placeholder={now === null ? "No limit" : String(now)}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                aria-invalid={error ? true : undefined}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 aria-invalid:border-danger-600"
              />
              <span
                className={
                  error
                    ? "block text-xs text-danger-700"
                    : "block text-xs text-ink-subtle"
                }
              >
                {error ??
                  `Now ${now === null ? "no limit" : now} · ${f.used(salon)}`}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          disabled={!dirty || invalid}
          loading={action.isPending}
          onClick={save}
        >
          Save limits
        </Button>
      </div>
      {action.isError && (
        <div className="mt-3">
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        </div>
      )}
    </Card>
  );
}
