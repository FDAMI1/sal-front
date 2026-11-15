import axios from "axios";
import { environment } from "@config/env";

/**
 * Plain client for calls made without a session: health, sign-in, reset,
 * OTP. Signed-in calls use the per-portal clients in clients.ts, which add
 * the token and refresh it.
 */
export const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: { "Content-Type": "application/json" },
  // Without a timeout axios waits forever; a request sent while the API is
  // cold-starting would leave the screen spinning with no error.
  timeout: 30_000,
});

/** Shape of the server's error envelope (see docs/API.md). */
export interface ApiErrorBody {
  success: false;
  error: {
    code?: string;
    message?: string;
    details?: {
      issues?: { path: (string | number)[]; message: string }[];
    } & Record<string, unknown>;
  };
}

function errorBody(err: unknown): ApiErrorBody["error"] | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const data = err.response?.data as Partial<ApiErrorBody> | undefined;
  return data?.error;
}

/** HTTP status of a failed call, or undefined when no response arrived. */
export function apiErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

/**
 * The server's machine-readable error code. Screens branch on this, never on
 * message text, which changes whenever someone rewrites a sentence.
 */
export function apiErrorCode(err: unknown): string | undefined {
  return errorBody(err)?.code;
}

/** Structured details the server attached to an error, if any. */
export function apiErrorDetails(
  err: unknown,
): Record<string, unknown> | undefined {
  return errorBody(err)?.details;
}

/** Field label out of a zod path: ["body", "phone"] -> "phone". */
function fieldLabel(path: (string | number)[]): string {
  const parts = path.filter(
    (p) => p !== "body" && p !== "query" && p !== "params",
  );
  return parts.join(".");
}

/** A human-readable message for any failure, naming invalid fields. */
export function apiErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED")
      return "The server took too long to respond. Check your connection and try again.";
    if (!err.response)
      return "Cannot reach the server. Check your connection and try again.";
  }

  const error = errorBody(err);
  const message =
    error?.message ||
    (!axios.isAxiosError(err) && err instanceof Error ? err.message : "") ||
    fallback;

  const issues = error?.details?.issues;
  if (!issues?.length) return message;

  const seen = new Set<string>();
  const detail = issues
    .map((i) => {
      const label = fieldLabel(i.path);
      return label ? `${label}: ${i.message}` : i.message;
    })
    .filter((d) => !seen.has(d) && Boolean(seen.add(d)))
    .slice(0, 4)
    .join(" · ");
  const more = issues.length > 4 ? ` (+${issues.length - 4} more)` : "";
  return `${message} — ${detail}${more}`;
}

interface Issue {
  path: unknown[];
  message: string;
}
const isIssue = (v: unknown): v is Issue =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as { path?: unknown }).path) &&
  typeof (v as { message?: unknown }).message === "string";

/**
 * Server validation issues that name one of these form fields
 * (path ["body", field]), so a form can show them beside the input.
 */
export function fieldIssues<F extends string>(
  err: unknown,
  fields: readonly F[],
): { field: F; message: string }[] {
  const issues = apiErrorDetails(err)?.issues;
  if (!Array.isArray(issues)) return [];
  return issues.filter(isIssue).flatMap((i) => {
    const field = i.path.find((p) => p !== "body");
    const match = fields.find((f) => f === field);
    return match ? [{ field: match, message: i.message }] : [];
  });
}
