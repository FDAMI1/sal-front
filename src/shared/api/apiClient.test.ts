import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import {
  apiErrorCode,
  apiErrorDetails,
  apiErrorMessage,
  apiErrorStatus,
} from "./apiClient";

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = {
    status,
    statusText: "",
    data,
    headers: {},
    config,
  } as AxiosResponse;
  return new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    config,
    null,
    response,
  );
}

describe("api error helpers", () => {
  it("reads code, status, details and message from the envelope", () => {
    const err = httpError(503, {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database unavailable",
        details: { db: "disconnected" },
      },
    });
    expect(apiErrorStatus(err)).toBe(503);
    expect(apiErrorCode(err)).toBe("SERVICE_UNAVAILABLE");
    expect(apiErrorDetails(err)).toEqual({ db: "disconnected" });
    expect(apiErrorMessage(err)).toBe("Database unavailable");
  });

  it("names the invalid fields of a validation error", () => {
    const err = httpError(400, {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation error",
        details: {
          issues: [
            { path: ["body", "phone"], message: "Invalid phone number" },
            { path: ["body", "phone"], message: "Invalid phone number" },
          ],
        },
      },
    });
    expect(apiErrorMessage(err)).toBe(
      "Validation error — phone: Invalid phone number",
    );
  });

  it("explains a network failure instead of a generic message", () => {
    const err = new AxiosError("Network Error", "ERR_NETWORK");
    expect(apiErrorStatus(err)).toBeUndefined();
    expect(apiErrorMessage(err)).toMatch(/Cannot reach the server/);
  });

  it("explains a timeout", () => {
    const err = new AxiosError("timeout of 30000ms exceeded", "ECONNABORTED");
    expect(apiErrorMessage(err)).toMatch(/took too long/);
  });

  it("falls back for unknown values", () => {
    expect(apiErrorMessage(undefined, "Fallback")).toBe("Fallback");
    expect(apiErrorMessage(new Error("Plain failure"))).toBe("Plain failure");
  });
});
