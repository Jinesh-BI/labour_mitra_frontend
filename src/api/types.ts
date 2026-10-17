import type { components } from "./schema";

// Types come from the backend's OpenAPI schema (src/api/schema.d.ts, generated with `npm run api:types`).
// Re-export friendly names here; never hand-edit schema.d.ts.
type S = components["schemas"];

/** Generated request types mark fields that have server defaults as required; this makes them optional. */
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ---- auth ----
export type AuthSession = S["AuthSession"];
export type AuthUser = S["User"];
export type SendOtpBody = S["SendOtpRequestRequest"];
export type RegisterBody = WithOptional<S["RegisterRequestRequest"], "preferred_language">;
export type LoginBody = S["LoginRequestRequest"];
// Not in the generated schema until the next `npm run api:types`.
export type BotSessionBody = { mobile: string; name?: string; role?: "demand"; lang?: string };

// ---- catalog ----
// The backend now also serves translated names, crop look and typical wages; the shared OpenAPI file does not list
// them yet, so they are optional here. Remove these intersections after the next `npm run api:types` shows them.
type Translated = { name_mr?: string; name_hi?: string };
export type Crop = S["Crop"] & Translated & { emoji?: string; color?: string };
export type Activity = S["Activity"] & Translated & { typical_wage_min?: string | null; typical_wage_max?: string | null };
export type Village = S["Village"];
export type NearestVillage = S["NearestVillage"];
export type HarvestStage = S["HarvestStageEnum"];

// ---- demand profile ----
export type DemandProfile = S["DemandProfile"];
export type DemandProfileUpdate = S["PatchedDemandProfileUpdateRequest"];

// ---- jobs (labour requests) ----
export type Job = S["LabourRequest"];
export type JobStatus = Job["status"];
export type JobCreateBody = WithOptional<
  S["LabourRequestCreateRequest"],
  "gender_preference" | "experienced_only" | "wage_type"
>;
export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type JobDetail = Job & { invitations: Invitation[]; bookings: Booking[] };
export type CrewCandidate = S["CrewCandidate"];
export type CrewPublic = S["CrewPublic"];
export type InvitationMessage = S["InvitationMessage"];

// ---- invitations and bookings ----
export type Invitation = S["Invitation"];
export type RecordResponseBody = WithOptional<S["RecordResponseRequest"], "notes">;
export type Booking = S["Booking"];
export type BookingStatus = Booking["status"];
export type CreateBookingBody = S["CreateBookingRequest"];
export type ConfirmBookingBody = WithOptional<S["ConfirmBookingRequest"], "channel">;
export type ReconfirmBody = WithOptional<S["RecordReconfirmationRequest"], "channel">;
export type AttendanceBody = WithOptional<S["RecordAttendanceRequest"], "notes">;
export type Attendance = S["Attendance"];

// ---- calls ----
export type CallSession = S["CallSession"];
export type StartCallBody = S["StartCallRequest"];

// ---- operations ----
export type PilotMetrics = S["PilotMetrics"];
export type FollowUpQueue = S["FollowUpQueue"];
export type CallLogBody = S["CallLogCreateRequest"];
export type CallLog = S["CallLog"];
