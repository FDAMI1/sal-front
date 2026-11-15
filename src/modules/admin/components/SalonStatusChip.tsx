import type { SalonStatus } from "@modules/admin/types";
import { StatusChip, type StatusTone } from "@shared/ui";

const LOOK: Record<SalonStatus, { tone: StatusTone; label: string }> = {
  pending: { tone: "warning", label: "Pending approval" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "neutral", label: "Rejected" },
  suspended: { tone: "danger", label: "Suspended" },
};

export function SalonStatusChip({ status }: { status: SalonStatus }) {
  const { tone, label } = LOOK[status];
  return <StatusChip tone={tone}>{label}</StatusChip>;
}
