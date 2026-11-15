import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  Printer,
  QrCode,
} from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { useSalon } from "@modules/salon/hooks/useSalon";
import type { Salon } from "@modules/salon/types";
import {
  downloadQrPdf,
  downloadQrPng,
  printQr,
  SCAN_PROMPT,
  type QrAsset,
} from "@modules/qr/qrActions";
import { cn } from "@shared/cn";
import { formatDateTime } from "@shared/format";
import { Alert, Button, Card, ErrorState, Skeleton } from "@shared/ui";

const TITLE = "Your salon booking QR code";
const DESCRIPTION = "Customers scan this to book and join your queue.";

type Notice = { tone: "success" | "danger"; text: string } | null;

function QrActions({ qr }: { qr: QrAsset }) {
  const [notice, setNotice] = useState<Notice>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qr.url);
      setNotice({ tone: "success", text: "Booking link copied." });
    } catch {
      setNotice({
        tone: "danger",
        text: "Could not copy the link. Select it above and copy it manually.",
      });
    }
  };

  const pdf = async () => {
    setPdfBusy(true);
    try {
      await downloadQrPdf(qr);
      setNotice(null);
    } catch {
      setNotice({
        tone: "danger",
        text: "Could not create the PDF. Try again.",
      });
    } finally {
      setPdfBusy(false);
    }
  };

  const icon = (Icon: typeof Copy) => (
    <Icon className="size-4" aria-hidden="true" />
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button icon={icon(Download)} onClick={() => downloadQrPng(qr)}>
          Download QR
        </Button>
        <Button
          variant="secondary"
          icon={icon(FileText)}
          loading={pdfBusy}
          onClick={() => void pdf()}
        >
          Download PDF
        </Button>
        <Button
          variant="secondary"
          icon={icon(Printer)}
          onClick={() => printQr(qr)}
        >
          Print
        </Button>
        <Button
          variant="secondary"
          icon={icon(Copy)}
          onClick={() => void copy()}
        >
          Copy link
        </Button>
      </div>
      <a
        href={qr.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
      >
        Preview customer page
        <ExternalLink className="size-4" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
    </div>
  );
}

/** Shows the QR stored on the server: the same image on every visit. */
function ActiveQr({
  salon,
  url,
  image,
}: {
  salon: Salon;
  url: string;
  image: string;
}) {
  const generatedAt = salon.bookingLink.generatedAt;
  return (
    // Laid out by the card's own width, not the screen's: on the dashboard
    // the card sits in a narrow column even on a wide screen.
    <div className="@container">
      <div className="flex flex-col gap-5 @lg:flex-row @lg:items-start">
        <div className="mx-auto w-full max-w-56 shrink-0 @lg:mx-0">
          <img
            src={image}
            alt={`QR code linking to the booking page of ${salon.name}`}
            className="aspect-square w-full rounded-lg border border-line bg-white"
          />
          {generatedAt && (
            <p className="mt-2 text-center text-xs text-ink-subtle">
              Generated {formatDateTime(generatedAt)}
            </p>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-lg font-semibold text-ink">{salon.name}</p>
            <p className="text-ink-subtle">{SCAN_PROMPT}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-subtle">Booking link</p>
            <p className="font-mono text-sm break-all text-ink select-all">
              {url}
            </p>
          </div>
          <QrActions
            qr={{
              dataUrl: image,
              salonName: salon.name,
              salonSlug: salon.slug,
              url,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SwitchedOff({
  manageLink,
  manageLinkClassName,
}: {
  manageLink: string | null;
  manageLinkClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-canvas text-ink-subtle">
        <QrCode className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-ink">Booking link is switched off</p>
        <p className="mt-1 max-w-md text-ink-subtle">
          Customers who scan your QR code see that the link is not valid.
        </p>
      </div>
      {manageLink && (
        <Link
          to={manageLink}
          className={cn(
            "font-medium text-brand-700 hover:underline",
            manageLinkClassName,
          )}
        >
          Manage your QR code
        </Link>
      )}
    </div>
  );
}

interface QrCodeCardProps {
  /** Where "Manage your QR code" leads when the link is off; null hides it. */
  manageLink?: string | null;
  /** E.g. "lg:hidden" where the settings already sit below on desktop. */
  manageLinkClassName?: string;
}

/** The salon's one public booking QR code with download, print and share actions. */
export function QrCodeCard({
  manageLink = "/app/qr",
  manageLinkClassName,
}: QrCodeCardProps) {
  const salon = useSalon();

  let body: ReactNode;
  if (salon.isPending) {
    body = (
      <div aria-busy="true" aria-label="Loading QR code">
        <Skeleton className="h-56 w-full" />
      </div>
    );
  } else if (salon.isError) {
    body = (
      <ErrorState
        title="Could not load your QR code"
        message={apiErrorMessage(salon.error)}
        onRetry={() => void salon.refetch()}
        retrying={salon.isFetching}
      />
    );
  } else {
    const { isActive, url, qrImage } = salon.data.bookingLink;
    body = !isActive ? (
      <SwitchedOff
        manageLink={manageLink}
        manageLinkClassName={manageLinkClassName}
      />
    ) : url && qrImage ? (
      <ActiveQr salon={salon.data} url={url} image={qrImage} />
    ) : (
      <Alert tone="info">
        Your booking link is being set up. Refresh the page in a moment.
      </Alert>
    );
  }

  return (
    <Card title={TITLE} description={DESCRIPTION}>
      {body}
    </Card>
  );
}
