const KEY = "sq.deviceId";

let memoryId: string | null = null;

/**
 * A random id for this browser, kept across visits. The server uses it to
 * hold one session row per device (signing in again here does not use up
 * another device slot) and to mark "this device" in the sessions list. It is
 * not a secret. Falls back to a per-tab id when storage is blocked.
 */
export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}

/** "Chrome on Windows": enough to recognise a device in the sessions list. */
export function describeDevice(ua: string = navigator.userAgent): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "unknown system";
  return `${browser} on ${os}`;
}
