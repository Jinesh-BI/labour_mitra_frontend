import { AxiosError } from "axios";

/** Field name -> messages, as returned by DRF validation errors. */
export type FieldErrors = Record<string, string[]>;

/**
 * Single error type for every failed API call.
 *
 * The backend answers with one of:
 *  - `{ success: false, error: "message" }`  business-rule violation (400/403/404/409/502)
 *  - `{ field: ["message", ...] }`           field validation (400)
 *  - `{ detail: "message" }`                 auth, throttling, permission (401/403/429)
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isNetworkError() {
    return this.status === 0;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isNotFound() {
    return this.status === 404;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!(error instanceof AxiosError)) {
    return new ApiError(error instanceof Error ? error.message : "Something went wrong.", 0);
  }
  if (!error.response) {
    return new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  const { status, data } = error.response;
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    if (typeof body.error === "string") return new ApiError(body.error, status);
    if (typeof body.detail === "string") return new ApiError(body.detail, status);

    const fieldErrors: FieldErrors = {};
    for (const [field, value] of Object.entries(body)) {
      if (Array.isArray(value)) fieldErrors[field] = value.map(String);
      else if (typeof value === "string") fieldErrors[field] = [value];
    }
    const first = Object.entries(fieldErrors)[0];
    if (first) return new ApiError(`${first[0]}: ${first[1][0]}`, status, fieldErrors);
  }
  return new ApiError(`Request failed (${status}).`, status);
}
