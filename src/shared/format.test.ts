import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatPaise,
  rupeesToPaise,
} from "./format";

describe("formatDuration", () => {
  it.each([
    [0, "0s"],
    [45, "45s"],
    [200, "3m 20s"],
    [7500, "2h 5m"],
    [90_000, "1d 1h"],
    [-5, "0s"],
  ])("%i seconds -> %s", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe("formatDateTime", () => {
  it("renders an em dash for an invalid date", () => {
    expect(formatDateTime("not a date")).toBe("—");
  });

  it("renders a valid ISO date", () => {
    expect(formatDateTime("2026-11-09T15:21:17.181Z")).toMatch(/2026/);
  });
});

describe("money in paise", () => {
  it("formats paise as rupees", () => {
    expect(formatPaise(49900)).toBe("₹499");
    expect(formatPaise(49950)).toBe("₹499.50");
    expect(formatPaise(0)).toBe("₹0");
  });

  it.each([
    ["499", 49900],
    ["499.5", 49950],
    ["499.05", 49905],
    ["0", 0],
    ["", null],
    ["4.999", null],
    ["-1", null],
    ["abc", null],
  ])("rupeesToPaise(%s) = %s", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });
});

describe("formatDate", () => {
  it("shows a calendar day without shifting it", () => {
    expect(formatDate("2026-12-25")).toContain("25");
    expect(formatDate("2026-12-25")).toContain("2026");
  });
});
