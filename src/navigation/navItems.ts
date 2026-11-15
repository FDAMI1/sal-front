import {
  Activity,
  Bell,
  BellRing,
  CalendarCheck,
  CalendarClock,
  ContactRound,
  Home,
  LayoutGrid,
  LayoutDashboard,
  Layers,
  LineChart,
  ListOrdered,
  MonitorSmartphone,
  QrCode,
  Receipt,
  Scissors,
  Settings,
  Store,
  TrendingUp,
  UserRound,
  Users,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@shared/permissions";

export type NavSection =
  | "Overview"
  | "Business management"
  | "Business reports"
  | "Customer experience"
  | "Platform"
  | "Settings";

/** Sidebar section order. */
export const SECTION_ORDER: NavSection[] = [
  "Overview",
  "Business management",
  "Business reports",
  "Customer experience",
  "Platform",
  "Settings",
];

export interface NavItem {
  /** Absolute route path. */
  to: string;
  label: string;
  icon: LucideIcon;
  section: NavSection;
  /** Shown only to staff holding it; the server enforces it regardless. */
  permission?: Permission;
  /** Active only on this exact path (portal homes); others also on sub-pages. */
  exact?: boolean;
}

const item = (
  section: NavSection,
  to: string,
  label: string,
  icon: LucideIcon,
  permission?: Permission,
): NavItem => ({ section, to, label, icon, permission });

/**
 * The salon admin's navigation. Every item is a working page. The Queue is
 * the live working screen, so it sits beside the Dashboard.
 */
export const SALON_NAV: NavItem[] = [
  item(
    "Overview",
    "/app/dashboard",
    "Dashboard",
    LayoutDashboard,
    "analytics.view",
  ),
  item("Overview", "/app/queue", "Queue", ListOrdered, "queue.view"),

  item(
    "Business management",
    "/app/staff",
    "Staff Management",
    Users,
    "staff.manage",
  ),
  item(
    "Business management",
    "/app/customers",
    "Customer Management",
    ContactRound,
    "customers.view",
  ),
  item(
    "Business management",
    "/app/services",
    "Services",
    Scissors,
    "services.manage",
  ),
  item(
    "Business management",
    "/app/bookings",
    "Bookings",
    CalendarCheck,
    "appointments.view",
  ),
  item(
    "Business management",
    "/app/appointments",
    "Appointments",
    CalendarClock,
    "appointments.view",
  ),

  item(
    "Business reports",
    "/app/reports/sales",
    "Sales Reports",
    LineChart,
    "analytics.view",
  ),
  item(
    "Business reports",
    "/app/reports/staff",
    "Staff Performance",
    TrendingUp,
    "analytics.view",
  ),
  item(
    "Business reports",
    "/app/reports/services",
    "Service Reports",
    Scissors,
    "analytics.view",
  ),
  item(
    "Business reports",
    "/app/expenses",
    "Expenses",
    Receipt,
    "expenses.manage",
  ),

  item(
    "Customer experience",
    "/app/qr",
    "QR Code Management",
    QrCode,
    "salon.manage",
  ),
  item(
    "Customer experience",
    "/app/notifications",
    "Notifications",
    Bell,
    "queue.manage",
  ),
  item(
    "Customer experience",
    "/app/reminders",
    "Customer Reminders",
    BellRing,
    "appointments.manage",
  ),

  item("Settings", "/app/salon", "Salon Profile", Store, "salon.manage"),
  item(
    "Settings",
    "/app/settings/access",
    "User & Device Management",
    MonitorSmartphone,
    "staff.manage",
  ),
  item(
    "Settings",
    "/app/settings/sound",
    "Notification Sound Settings",
    Volume2,
    "queue.manage",
  ),
  item("Settings", "/app/account", "My Account", UserRound),
];

export const WORKER_NAV: NavItem[] = [
  {
    to: "/worker",
    label: "Queue",
    icon: ListOrdered,
    section: "Overview",
    exact: true,
  },
  {
    to: "/worker/account",
    label: "My Account",
    icon: UserRound,
    section: "Settings",
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    to: "/admin",
    label: "System status",
    icon: Activity,
    section: "Overview",
    exact: true,
  },
  { to: "/admin/salons", label: "Salons", icon: Store, section: "Platform" },
  { to: "/admin/plans", label: "Plans", icon: Layers, section: "Platform" },
  {
    to: "/admin/catalog",
    label: "Service catalogue",
    icon: Scissors,
    section: "Platform",
  },
];

/** A button in the bottom bar that replaces the sidebar on phones. */
export interface MobileTab {
  to: string;
  label: string;
  icon: LucideIcon;
  /**
   * Path prefixes that light this tab. Of all tabs, the longest matching
   * prefix wins, so "/app/qr/settings" belongs to Settings, not QR.
   */
  matches: string[];
}

/** Where the salon admin's QR link settings live on a phone. */
export const QR_SETTINGS_ITEM: NavItem = item(
  "Settings",
  "/app/qr/settings",
  "QR Code Settings",
  QrCode,
  "salon.manage",
);

export const SALON_TABS: MobileTab[] = [
  {
    to: "/app/dashboard",
    label: "Home",
    icon: Home,
    matches: ["/app/dashboard"],
  },
  { to: "/app/qr", label: "QR Code", icon: QrCode, matches: ["/app/qr"] },
  {
    to: "/app/features",
    label: "Features",
    icon: LayoutGrid,
    // Every page that is not Home, QR or a setting.
    matches: ["/app"],
  },
  {
    to: "/app/settings",
    label: "Settings",
    icon: Settings,
    matches: [
      "/app/settings",
      "/app/salon",
      "/app/account",
      "/app/qr/settings",
    ],
  },
];

/** The working pages a salon admin reaches from the Features tab. */
export const FEATURE_ITEMS = SALON_NAV.filter(
  (i) =>
    i.section !== "Settings" && i.to !== "/app/dashboard" && i.to !== "/app/qr",
);

/** The setting pages a salon admin reaches from the Settings tab. */
export const SETTING_ITEMS = [
  QR_SETTINGS_ITEM,
  ...SALON_NAV.filter((i) => i.section === "Settings"),
];

export const WORKER_TABS: MobileTab[] = [
  { to: "/worker", label: "Queue", icon: ListOrdered, matches: ["/worker"] },
  {
    to: "/worker/account",
    label: "My Account",
    icon: UserRound,
    matches: ["/worker/account"],
  },
];

export const ADMIN_TABS: MobileTab[] = ADMIN_NAV.map((i) => ({
  to: i.to,
  label: i.label === "Service catalogue" ? "Catalogue" : i.label,
  icon: i.icon,
  matches: [i.to],
}));

/** The tab a path belongs to: the longest matching prefix wins. */
export function activeTab(tabs: MobileTab[], path: string) {
  let best: { tab: MobileTab; length: number } | null = null;
  for (const tab of tabs) {
    for (const m of tab.matches) {
      const hit = path === m || path.startsWith(`${m}/`);
      if (hit && (!best || m.length > best.length)) {
        best = { tab, length: m.length };
      }
    }
  }
  return best?.tab ?? null;
}
