import { api } from "../client";
import type {
  CallSession,
  CrewCandidate,
  InvitationMessage,
  Job,
  JobCreateBody,
  JobDetail,
  JobStatus,
  Paginated,
} from "../types";

export type JobListParams = { status?: JobStatus; page?: number; page_size?: number };

// A "job" is the backend's LabourRequest.
export const jobsApi = {
  list: (params?: JobListParams) => api.get<Paginated<Job>>("labour-requests/", { params }).then((r) => r.data),
  get: (id: string) => api.get<JobDetail>(`labour-requests/${id}/`).then((r) => r.data),
  /** Location defaults to the profile location; send latitude + longitude to override. */
  create: (body: JobCreateBody) => api.post<Job>("labour-requests/", body).then((r) => r.data),
  cancel: (id: string, reason: string) =>
    api.post<Job>(`labour-requests/${id}/cancel/`, { reason }).then((r) => r.data),
  clone: (id: string, startDate: string) =>
    api.post<Job>(`labour-requests/${id}/clone/`, { start_date: startDate }).then((r) => r.data),
  /** Eligible crews, ranked. Never contains phone numbers. */
  candidates: (id: string) => api.get<CrewCandidate[]>(`labour-requests/${id}/candidates/`).then((r) => r.data),
  invitationMessage: (id: string, lang?: "en" | "mr") =>
    api.get<InvitationMessage>(`labour-requests/${id}/invitation-message/`, { params: { lang } }).then((r) => r.data),
  calls: (id: string) => api.get<CallSession[]>(`labour-requests/${id}/calls/`).then((r) => r.data),
};
