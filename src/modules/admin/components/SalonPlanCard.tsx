import { useState } from "react";
import { apiErrorMessage } from "@api/apiClient";
import { usePlans, useSalonAction } from "@modules/admin/hooks/useAdminSalons";
import type { SalonDetail } from "@modules/admin/types";
import { formatPaise } from "@shared/format";
import { Alert, Button, Card } from "@shared/ui";

/** Assigns a plan by hand (no automated billing, ROADMAP decision 5). */
export function SalonPlanCard({ salon }: { salon: SalonDetail }) {
  const plans = usePlans();
  const action = useSalonAction(salon.id);
  const [planId, setPlanId] = useState(salon.plan?.id ?? "");
  const offered =
    plans.data?.filter((p) => p.isActive || p.id === salon.plan?.id) ?? [];
  const dirty = planId !== (salon.plan?.id ?? "");

  return (
    <Card
      title="Plan"
      description={
        salon.plan
          ? `${salon.plan.name}: ${formatPaise(salon.plan.pricePaise)} / ${salon.plan.interval}, up to ${salon.plan.limits.workers} staff accounts. ${salon.staffCount} active.`
          : `No plan. ${salon.staffCount} active staff account${salon.staffCount === 1 ? "" : "s"}.`
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 space-y-1.5">
          <span className="block font-medium text-ink">Assign plan</span>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={plans.isPending}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3"
          >
            <option value="">No plan</option>
            {offered.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatPaise(p.pricePaise)} / {p.interval})
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={!dirty}
          loading={action.isPending}
          onClick={() =>
            action.mutate({ kind: "plan", planId: planId || null })
          }
        >
          Save plan
        </Button>
      </div>
      {plans.isError && (
        <Alert tone="danger">{apiErrorMessage(plans.error)}</Alert>
      )}
      {action.isError && (
        <div className="mt-3">
          <Alert tone="danger">{apiErrorMessage(action.error)}</Alert>
        </div>
      )}
    </Card>
  );
}
