import { Suspense } from "react";
import { Outlet } from "react-router";
import { Skeleton } from "@shared/ui";
import { BottomNav } from "./BottomNav";
import type { MobileTab, NavItem } from "./navItems";
import { Sidebar } from "./Sidebar";
import { Topbar, type PortalAccount } from "./Topbar";

interface AppLayoutProps {
  items: NavItem[];
  /** The bottom bar shown instead of the sidebar below the lg breakpoint. */
  tabs: MobileTab[];
  account: PortalAccount;
  onSignOut: () => void;
  signingOut: boolean;
}

/** Portal shell: sidebar on desktop, bottom tabs on phones, top bar, page. */
export default function AppLayout({
  items,
  tabs,
  account,
  onSignOut,
  signingOut,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          account={account}
          onSignOut={onSignOut}
          signingOut={signingOut}
        />
        {/* Bottom padding keeps the last row clear of the bottom bar. */}
        <main className="flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-6">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav tabs={tabs} />
    </div>
  );
}
