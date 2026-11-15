import { ServicesCard } from "@modules/salon/components/ServicesCard";
import { PageHeader } from "@shared/ui";

/** /app/services: the salon's menu, prices and which services customers see. */
export default function ServicesScreen() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Services"
        description="Only services switched on here appear on your booking page."
      />
      <ServicesCard />
    </div>
  );
}
