/** "2h 5m", "3m 20s", "45s": compact elapsed time for status displays. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const rupeeFormat = (digits: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const wholeRupees = rupeeFormat(0);
const rupeesAndPaise = rupeeFormat(2);

/**
 * 49900 → "₹499", 49950 → "₹499.50" (never "₹499.5"). Money is integer
 * paise everywhere (CODING_STANDARDS); this is the only place it becomes text.
 */
export function formatPaise(paise: number): string {
  return (paise % 100 === 0 ? wholeRupees : rupeesAndPaise).format(paise / 100);
}

/** "499.50" → 49950; null when the text is not a valid rupee amount. */
export function rupeesToPaise(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole = "0", frac = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** "2026-12-25" → "25 Dec 2026" without a time-zone shift. */
export function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

/** Local date and time in the viewer's locale, e.g. "9 Nov 2026, 8:51 pm". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
