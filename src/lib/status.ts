import type { BookingStatus, CallSession, JobStatus } from "@/api/types";

type ChipColor = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
type StatusMeta = { color: ChipColor };

// Typed against the backend enums: if the API adds or renames a status, `npm run typecheck` fails here.
// Labels live in the locale files under status.job.* / status.booking.* / status.call.*.
// Statuses describe what actually happened; "confirmed" is never implied by contact or a response.
export const jobStatusMeta: Record<JobStatus, StatusMeta> = {
  created: { color: "default" },
  matching: { color: "info" },
  responses_received: { color: "info" },
  pending_confirmation: { color: "warning" },
  confirmed: { color: "success" },
  closed: { color: "default" },
  cancelled: { color: "error" },
};

export const bookingStatusMeta: Record<BookingStatus, StatusMeta> = {
  pending_confirmation: { color: "warning" },
  confirmed: { color: "success" },
  reconfirmation_pending: { color: "info" },
  reconfirmed: { color: "success" },
  completed: { color: "success" },
  partially_fulfilled: { color: "warning" },
  no_show: { color: "error" },
  cancelled: { color: "error" },
};

export const callStatusMeta: Record<CallSession["status"], StatusMeta> = {
  initiated: { color: "info" },
  queued: { color: "info" },
  ringing: { color: "info" },
  in_progress: { color: "success" },
  completed: { color: "success" },
  failed: { color: "error" },
  busy: { color: "warning" },
  no_answer: { color: "warning" },
  canceled: { color: "default" },
  unknown: { color: "default" },
};

/** Call statuses after which the status will not change any more. */
export const isCallFinished = (status: CallSession["status"]) =>
  !["initiated", "queued", "ringing", "in_progress"].includes(status);

export const isJobOpen = (status: JobStatus) => status !== "closed" && status !== "cancelled";

/** Bookings that still count toward the headcount. */
export const isBookingLive = (status: BookingStatus) => status !== "cancelled" && status !== "no_show";
