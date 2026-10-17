import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsApi, type JobListParams } from "../endpoints/jobs";
import { queryKeys } from "../queryKeys";
import type { ApiError } from "../errors";
import { isCallFinished, isJobOpen } from "@/lib/status";
import type { Job, JobCreateBody } from "../types";

const JOB_POLL_MS = 20_000;

/** First page, used by the home screen. */
export const useJobs = (params?: JobListParams) =>
  useQuery({ queryKey: queryKeys.jobs(params), queryFn: () => jobsApi.list(params), placeholderData: keepPreviousData });

/** All pages of "My requests", loaded on demand. */
export const useInfiniteJobs = () =>
  useInfiniteQuery({
    queryKey: [...queryKeys.jobsList, "infinite"],
    queryFn: ({ pageParam }) => jobsApi.list({ page: pageParam, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.next ? pages.length + 1 : undefined),
  });

/** The job with its replies and bookings. Open jobs refresh by themselves because nothing is pushed to the app. */
export const useJob = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.job(id ?? ""),
    queryFn: () => jobsApi.get(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isJobOpen(status) && document.visibilityState === "visible" ? JOB_POLL_MS : false;
    },
  });

/** Matching moves a fresh job to "matching", so this is "start finding workers", not a pure read. */
export const useCandidates = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.candidates(id ?? ""),
    queryFn: () => jobsApi.candidates(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
  });

/** Call history for a job. While a call is not finished, poll every 5 s so the screen follows the call. */
export const useJobCalls = (id: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.jobCalls(id ?? ""),
    queryFn: () => jobsApi.calls(id!),
    enabled: !!id && enabled,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.some((c) => !isCallFinished(c.status)) ? 5_000 : false),
  });

export const useInvitationMessage = (id: string | undefined, lang: "en" | "mr", enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.invitationMessage(id ?? "", lang),
    queryFn: () => jobsApi.invitationMessage(id!, lang),
    enabled: !!id && enabled,
    staleTime: 5 * 60_000,
  });

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation<Job, ApiError, JobCreateBody>({
    mutationFn: jobsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll }),
  });
};

export const useCancelJob = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<Job, ApiError, string>({
    mutationFn: (reason) => jobsApi.cancel(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll }),
  });
};

export const useCloneJob = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<Job, ApiError, string>({
    mutationFn: (startDate) => jobsApi.clone(id, startDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll }),
  });
};
