import { Link, useLocation } from "react-router";
import { cn } from "@shared/cn";
import { activeTab, type MobileTab } from "./navItems";

/** The phone's main navigation: a fixed bar of tabs in place of the sidebar. */
export function BottomNav({ tabs }: { tabs: MobileTab[] }) {
  const { pathname } = useLocation();
  const current = activeTab(tabs, pathname);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = current?.to === tab.to;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-brand-700" : "text-ink-subtle",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors",
                    active && "bg-brand-50",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
