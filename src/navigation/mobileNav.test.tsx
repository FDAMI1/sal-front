import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { BottomNav } from "./BottomNav";
import {
  activeTab,
  FEATURE_ITEMS,
  SALON_NAV,
  SALON_TABS,
  SETTING_ITEMS,
  WORKER_TABS,
} from "./navItems";

const tabOf = (path: string) => activeTab(SALON_TABS, path)?.label;

describe("the phone's bottom bar", () => {
  it("has Home, QR Code, Features and Settings for a salon admin", () => {
    expect(SALON_TABS.map((t) => [t.label, t.to])).toEqual([
      ["Home", "/app/dashboard"],
      ["QR Code", "/app/qr"],
      ["Features", "/app/features"],
      ["Settings", "/app/settings"],
    ]);
  });

  it("lights the tab each page belongs to", () => {
    expect(tabOf("/app/dashboard")).toBe("Home");
    expect(tabOf("/app/qr")).toBe("QR Code");
    // The QR's settings are a setting, not the QR itself.
    expect(tabOf("/app/qr/settings")).toBe("Settings");
    expect(tabOf("/app/settings/access")).toBe("Settings");
    expect(tabOf("/app/salon")).toBe("Settings");
    expect(tabOf("/app/account")).toBe("Settings");
    expect(tabOf("/app/features")).toBe("Features");
    expect(tabOf("/app/queue")).toBe("Features");
    expect(tabOf("/app/staff/abc123")).toBe("Features");
    expect(tabOf("/app/reports/sales")).toBe("Features");
    expect(activeTab(WORKER_TABS, "/worker")?.label).toBe("Queue");
    expect(activeTab(WORKER_TABS, "/worker/account")?.label).toBe("My Account");
  });

  it("puts every sidebar page under exactly one of the four tabs", () => {
    const reachable = new Set([
      "/app/dashboard",
      "/app/qr",
      ...FEATURE_ITEMS.map((i) => i.to),
      ...SETTING_ITEMS.map((i) => i.to),
    ]);
    for (const item of SALON_NAV) expect(reachable, item.to).toContain(item.to);
    const both = FEATURE_ITEMS.filter((f) =>
      SETTING_ITEMS.some((s) => s.to === f.to),
    );
    expect(both).toEqual([]);
    expect(SETTING_ITEMS.map((i) => i.label)).toEqual([
      "QR Code Settings",
      "Salon Profile",
      "User & Device Management",
      "Notification Sound Settings",
      "My Account",
    ]);
  });

  it("marks the current tab for screen readers", () => {
    render(
      <MemoryRouter initialEntries={["/app/reports/staff"]}>
        <BottomNav tabs={SALON_TABS} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
