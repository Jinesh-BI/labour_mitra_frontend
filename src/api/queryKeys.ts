import type { HarvestStage } from "./types";
import type { JobListParams } from "./endpoints/jobs";

// One place for TanStack Query keys, so invalidation after a mutation is predictable.
export const queryKeys = {
  crops: ["catalog", "crops"] as const,
  activities: (crop?: string, stage?: HarvestStage) => ["catalog", "activities", crop, stage] as const,
  villages: ["catalog", "villages"] as const,
  nearestVillages: (lat: number, lng: number) => ["catalog", "villages", "nearest", lat, lng] as const,
  demandMe: ["demand", "me"] as const,
  jobs: (params?: JobListParams) => ["jobs", "list", params ?? {}] as const,
  jobsAll: ["jobs"] as const,
  jobsList: ["jobs", "list"] as const,
  job: (id: string) => ["jobs", "detail", id] as const,
  candidates: (id: string) => ["jobs", "detail", id, "candidates"] as const,
  invitationMessage: (id: string, lang?: string) => ["jobs", "detail", id, "message", lang] as const,
  jobCalls: (id: string) => ["jobs", "detail", id, "calls"] as const,
  metrics: ["operations", "metrics"] as const,
  followUpQueue: ["operations", "follow-up-queue"] as const,
};
