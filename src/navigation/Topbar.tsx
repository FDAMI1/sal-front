import { useRef } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Link } from "react-router";
import { Logo } from "@shared/ui/Logo";

export interface PortalAccount {
  name: string;
  /** Role or email, shown under the name. */
  detail: string;
  /** The business this account belongs to, shown as the page heading. */
  salonName?: string;
  /** Where "My account" leads; the menu omits it when absent. */
  accountPath?: string;
}

interface TopbarProps {
  account: PortalAccount;
  onSignOut: () => void;
  signingOut: boolean;
}

const menuItem =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-canvas";

export function Topbar({ account, onSignOut, signingOut }: TopbarProps) {
  const menu = useRef<HTMLDetailsElement>(null);
  const initials = account.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      <Logo className="size-7 lg:hidden" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">
          {account.salonName ?? "SmartQueue Salon"}
        </p>
        <p className="truncate text-xs text-ink-subtle">
          Welcome, {account.name}
        </p>
      </div>

      {/* Native disclosure: opens on click or Enter, closes when an item is used. */}
      <details ref={menu} className="relative ml-auto">
        <summary
          className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-canvas [&::-webkit-details-marker]:hidden"
          aria-label={`Profile menu for ${account.name}`}
        >
          <span
            className="grid size-8 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block font-medium text-ink">{account.name}</span>
            <span className="block text-xs text-ink-subtle">
              {account.detail}
            </span>
          </span>
          <ChevronDown className="size-4 text-ink-subtle" aria-hidden="true" />
        </summary>
        <div className="absolute right-0 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
          {account.accountPath && (
            <Link
              to={account.accountPath}
              className={menuItem}
              onClick={() => menu.current?.removeAttribute("open")}
            >
              <UserRound className="size-4" aria-hidden="true" />
              My account
            </Link>
          )}
          <button
            type="button"
            className={menuItem}
            onClick={onSignOut}
            disabled={signingOut}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </details>
    </header>
  );
}
