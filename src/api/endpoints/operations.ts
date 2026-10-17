import { api } from "../client";
import type { CallLog, CallLogBody, FollowUpQueue, PilotMetrics } from "../types";

// Operator/admin only (403 for demand users).
export const operationsApi = {
  followUpQueue: (hours?: number) =>
    api.get<FollowUpQueue>("operations/follow-up-queue/", { params: { hours } }).then((r) => r.data),
  metrics: () => api.get<PilotMetrics>("operations/metrics/").then((r) => r.data),
  createCallLog: (body: CallLogBody) => api.post<CallLog>("operations/call-logs/", body).then((r) => r.data),
};
