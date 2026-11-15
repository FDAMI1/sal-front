import { NavLink } from "react-router";
import { cn } from "@shared/cn";
import { SECTION_ORDER, type NavItem } from "./navItems";
import { Logo } from "@shared/ui/Logo";

/** Desktop navigation. Phones use the bottom bar (BottomNav) instead. */
export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside
      id="app-sidebar"
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center border-b border-line px-5">
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Logo className="size-7" />
          SmartQueue Salon
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {SECTION_ORDER.map((section) => {
          const inSection = items.filter((it) => it.section === section);
          if (inSection.length === 0) return null;
          return (
            <div key={section}>
              <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                {section}
              </p>
              <ul className="space-y-1">
                {inSection.map(({ to, label, icon: Icon, exact }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={exact ?? false}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                          isActive
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink-muted hover:bg-canvas hover:text-ink",
                        )
                      }
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
