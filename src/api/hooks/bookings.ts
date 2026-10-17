import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "../endpoints/bookings";
import { callsApi } from "../endpoints/calls";
import { queryKeys } from "../queryKeys";
import type { ApiError } from "../errors";
import type {
  Attendance,
  AttendanceBody,
  Booking,
  CallSession,
  ConfirmBookingBody,
  CreateBookingBody,
  Invitation,
  ReconfirmBody,
  RecordResponseBody,
} from "../types";

/** Any booking or reply change moves the job's status and headcount, so refetch the job and the lists. */
function useRefreshJob(jobId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsList }),
    ]);
}

export const useInviteCrews = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Invitation[], ApiError, string[]>({
    mutationFn: (crewIds) => bookingsApi.invite(jobId, crewIds),
    onSuccess: refresh,
  });
};

export const useRecordResponse = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Invitation, ApiError, { invitationId: string; body: RecordResponseBody }>({
    mutationFn: ({ invitationId, body }) => bookingsApi.recordResponse(invitationId, body),
    onSuccess: refresh,
  });
};

export const useCreateBooking = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Booking, ApiError, CreateBookingBody>({
    mutationFn: (body) => bookingsApi.create(jobId, body),
    onSuccess: refresh,
  });
};

export const useConfirmBooking = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Booking, ApiError, { bookingId: string; body: ConfirmBookingBody }>({
    mutationFn: ({ bookingId, body }) => bookingsApi.confirm(bookingId, body),
    onSuccess: refresh,
  });
};

export const useRequestReconfirmation = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Booking, ApiError, string>({
    mutationFn: (bookingId) => bookingsApi.requestReconfirmation(bookingId),
    onSuccess: refresh,
  });
};

export const useReconfirm = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Booking, ApiError, { bookingId: string; body: ReconfirmBody }>({
    mutationFn: ({ bookingId, body }) => bookingsApi.reconfirm(bookingId, body),
    onSuccess: refresh,
  });
};

export const useRecordAttendance = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Attendance, ApiError, { bookingId: string; body: AttendanceBody }>({
    mutationFn: ({ bookingId, body }) => bookingsApi.recordAttendance(bookingId, body),
    onSuccess: refresh,
  });
};

export const useCancelBooking = (jobId: string) => {
  const refresh = useRefreshJob(jobId);
  return useMutation<Booking, ApiError, { bookingId: string; reason: string }>({
    mutationFn: ({ bookingId, reason }) => bookingsApi.cancel(bookingId, reason),
    onSuccess: refresh,
  });
};

/** Starts a bridged call; the caller then follows it with useJobCalls (polling). */
export const useStartCall = (jobId: string) => {
  const queryClient = useQueryClient();
  return useMutation<CallSession, ApiError, string>({
    mutationFn: (crewTeamId) => callsApi.start({ labour_request_id: jobId, crew_team_id: crewTeamId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobCalls(jobId) }),
  });
};
