import { useEffect, useRef } from "react";
import { useNotifications } from "@modules/bookings/bookingsApi";

export const TONES = [
  { value: "chime", label: "Chime" },
  { value: "bell", label: "Bell" },
  { value: "beep", label: "Beep" },
] as const;
export type Tone = (typeof TONES)[number]["value"];

/**
 * Sound is a matter for each screen (the front desk wants it, the owner's
 * phone may not), so these are kept on this device, not on the salon.
 */
export interface AlertSettings {
  enabled: boolean;
  tone: Tone;
  /** 0 to 1. */
  volume: number;
}
const DEFAULTS: AlertSettings = { enabled: true, tone: "chime", volume: 0.6 };
const KEY = "sq.alerts";
const SEEN_KEY = "sq.alerts.seenAt";

export function loadAlertSettings(): AlertSettings {
  try {
    const saved = JSON.parse(
      localStorage.getItem(KEY) ?? "{}",
    ) as Partial<AlertSettings>;
    return {
      enabled: saved.enabled ?? DEFAULTS.enabled,
      tone: TONES.some((t) => t.value === saved.tone)
        ? (saved.tone as Tone)
        : DEFAULTS.tone,
      volume:
        typeof saved.volume === "number"
          ? Math.min(1, Math.max(0, saved.volume))
          : DEFAULTS.volume,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveAlertSettings(settings: AlertSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private windows may refuse storage; the sound still works this visit.
  }
}

/** When this device last opened the Notifications page (ISO), or "". */
export function loadSeenAt(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}
export function saveSeenAt(iso: string) {
  try {
    localStorage.setItem(SEEN_KEY, iso);
  } catch {
    // As above.
  }
}

// Notes as [frequency Hz, start s, length s].
const NOTES: Record<Tone, [number, number, number][]> = {
  chime: [
    [880, 0, 0.18],
    [1175, 0.16, 0.3],
  ],
  bell: [
    [1318, 0, 0.5],
    [1976, 0, 0.35],
  ],
  beep: [
    [1000, 0, 0.12],
    [1000, 0.2, 0.12],
  ],
};

let audio: AudioContext | null = null;

/**
 * Plays the alert through Web Audio, so no sound file is shipped. Browsers
 * stay silent until the page has been clicked once; that is their rule.
 */
export async function playAlert({ tone, volume }: AlertSettings) {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") await audio.resume();
    const now = audio.currentTime;
    for (const [freq, start, length] of NOTES[tone]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume * 0.5, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + length);
      osc.connect(gain).connect(audio.destination);
      osc.start(now + start);
      osc.stop(now + start + length);
    }
  } catch {
    // No audio device, or the browser has not allowed sound yet.
  }
}

/**
 * Runs in the salon admin's shell: plays the alert when a booking or a
 * customer cancellation arrives that this screen has not seen yet.
 */
export function useBookingAlerts(enabled: boolean) {
  const events = useNotifications(enabled);
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!events.data) return;
    const ids = new Set(events.data.map((e) => e.id));
    // The first load is history, not news.
    const fresh =
      known.current !== null &&
      events.data.some((e) => !known.current?.has(e.id));
    known.current = ids;
    const settings = loadAlertSettings();
    if (fresh && settings.enabled) void playAlert(settings);
  }, [events.data]);
}
