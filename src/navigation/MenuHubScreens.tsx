import { ChevronRight, LogOut } from "lucide-react";
import { Link } from "react-router";
import { useLogout } from "@modules/auth/hooks/useAuth";
import { useSalon } from "@modules/salon/hooks/useSalon";
import { can } from "@shared/permissions";
import { useStaffSession } from "@shared/store/sessions";
import { PageHeader } from "@shared/ui";
import {
  FEATURE_ITEMS,
  SECTION_ORDER,
  SETTING_ITEMS,
  type NavItem,
} from "./navItems";

/** One line under each page name, so the menu says what is behind it. */
const HINT: Record<string, string> = {
  "/app/queue": "Call, serve and take payment, live",
  "/app/staff": "Add staff, skills and working hours",
  "/app/customers": "Everyone who has booked, with visits",
  "/app/services": "Your menu, prices and durations",
  "/app/bookings": "One day's bookings from your QR code",
  "/app/appointments": "Bookings for a chosen date and time",
  "/app/reports/sales": "Revenue, payments and refunds by day",
  "/app/reports/staff": "What each staff member completed",
  "/app/reports/services": "How each service sold",
  "/app/expenses": "Rent, salaries, supplies and more",
  "/app/notifications": "New bookings and cancellations",
  "/app/reminders": "Remind customers on WhatsApp",
  "/app/qr/settings": "Switch the link off or make a new QR",
  "/app/salon": "Name, contact, hours, holidays, queue",
  "/app/settings/access": "Staff and device limits, sign-outs",
  "/app/settings/sound": "The alert for a new booking",
  "/app/account": "Your details, password and devices",
};

function MenuList({ items }: { items: NavItem[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {items.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <Link
            to={to}
            className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{label}</span>
              {HINT[to] && (
                <span className="block truncate text-xs text-ink-subtle">
                  {HINT[to]}
                </span>
              )}
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-ink-subtle"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Only the pages the signed-in person may open. */
function useAllowed(items: NavItem[]) {
  const profile = useStaffSession((s) => s.profile);
  return items.filter((i) => !i.permission || can(profile, i.permission));
}

/** /app/features: every working page, grouped as on the desktop sidebar. */
export function FeaturesHubScreen() {
  const items = useAllowed(FEATURE_ITEMS);
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Features"
        description="Everything you run the salon with."
      />
      {SECTION_ORDER.map((section) => {
        const inSection = items.filter((i) => i.section === section);
        if (inSection.length === 0) return null;
        return (
          <section key={section} aria-labelledby={`hub-${section}`}>
            <h2
              id={`hub-${section}`}
              className="mb-2 px-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase"
            >
              {section === "Overview" ? "Daily work" : section}
            </h2>
            <MenuList items={inSection} />
          </section>
        );
      })}
    </div>
  );
}

/** /app/settings: the account card, every setting page, and sign out. */
export function SettingsHubScreen() {
  const profile = useStaffSession((s) => s.profile);
  const salon = useSalon();
  const logout = useLogout();
  const items = useAllowed(SETTING_ITEMS);
  const initials = (profile?.name ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title="Settings" />
      {profile && (
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">
              {profile.name}
            </p>
            <p className="truncate text-sm text-ink-subtle">{profile.email}</p>
            {salon.data && (
              <p className="truncate text-sm text-brand-700">
                {salon.data.name}
              </p>
            )}
          </div>
        </div>
      )}
      <MenuList items={items} />
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 font-medium text-danger-700 hover:bg-canvas disabled:opacity-60"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-danger-50">
          <LogOut className="size-5" aria-hidden="true" />
        </span>
        {logout.isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
