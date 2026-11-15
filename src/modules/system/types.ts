/** `data` of GET /admin/system/status (super admin only). */
export interface SystemStatusData {
  status: "ok" | "degraded";
  service: string;
  environment: string;
  db: string;
  /** Server-side database round trip; null when the database is down. */
  dbPingMs: number | null;
  /** Time the server spent building this answer. */
  responseMs: number;
  uptimeSeconds: number;
  time: string;
  nodeVersion: string;
  platform: string;
  memoryMb: { rss: number; heapUsed: number };
}

export interface SystemStatus extends SystemStatusData {
  /** Round trip measured by the browser, in milliseconds. */
  latencyMs: number;
}
