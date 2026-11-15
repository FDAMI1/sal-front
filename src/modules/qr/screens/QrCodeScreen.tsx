import { useSalon } from "@modules/salon/hooks/useSalon";
import { BookingLinkSettingsCard } from "@modules/qr/components/BookingLinkSettingsCard";
import { QrCodeCard } from "@modules/qr/components/QrCodeCard";
import { PageHeader, Skeleton } from "@shared/ui";

/**
 * /app/qr: the salon's booking QR code. On desktop its link settings sit
 * below it; on a phone this page is the QR alone and the settings live
 * under Settings (/app/qr/settings).
 */
export default function QrCodeScreen() {
  const salon = useSalon();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="QR code management"
        description="Download, print and control the QR code customers scan to book."
      />
      <QrCodeCard
        manageLink="/app/qr/settings"
        manageLinkClassName="lg:hidden"
      />
      <div className="hidden lg:block">
        {salon.data && <BookingLinkSettingsCard salon={salon.data} />}
      </div>
    </div>
  );
}

/** /app/qr/settings: switch the booking link off, or make a new QR code. */
export function QrSettingsScreen() {
  const salon = useSalon();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="QR code settings"
        description="Switch your booking link off, or replace the QR code with a new one."
      />
      {salon.data ? (
        <BookingLinkSettingsCard salon={salon.data} />
      ) : (
        <Skeleton className="h-48 w-full" />
      )}
    </div>
  );
}
