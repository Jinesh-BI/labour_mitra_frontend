import { api } from "../client";
import type {
  Attendance,
  AttendanceBody,
  Booking,
  ConfirmBookingBody,
  CreateBookingBody,
  Invitation,
  ReconfirmBody,
  RecordResponseBody,
} from "../types";

// Invitations record what a crew said (a response is NOT a booking). Several crews can fill one job,
// each with its own booking and headcount.
export const bookingsApi = {
  invite: (jobId: string, crewTeamIds: string[]) =>
    api
      .post<Invitation[]>(`labour-requests/${jobId}/invitations/`, { crew_team_ids: crewTeamIds })
      .then((r) => r.data),
  recordResponse: (invitationId: string, body: RecordResponseBody) =>
    api.post<Invitation>(`invitations/${invitationId}/response/`, body).then((r) => r.data),

  /** headcount defaults to the crew's offer, capped at the remaining need (409 if overbooked). */
  create: (jobId: string, body: CreateBookingBody) =>
    api.post<Booking>(`labour-requests/${jobId}/bookings/`, body).then((r) => r.data),
  get: (id: string) => api.get<Booking>(`bookings/${id}/`).then((r) => r.data),
  confirm: (id: string, body: ConfirmBookingBody) =>
    api.post<Booking>(`bookings/${id}/confirm/`, body).then((r) => r.data),
  requestReconfirmation: (id: string) =>
    api.post<Booking>(`bookings/${id}/request-reconfirmation/`).then((r) => r.data),
  reconfirm: (id: string, body: ReconfirmBody) =>
    api.post<Booking>(`bookings/${id}/reconfirm/`, body).then((r) => r.data),
  recordAttendance: (id: string, body: AttendanceBody) =>
    api.post<Attendance>(`bookings/${id}/attendance/`, body).then((r) => r.data),
  cancel: (id: string, reason: string) =>
    api.post<Booking>(`bookings/${id}/cancel/`, { reason }).then((r) => r.data),
};
