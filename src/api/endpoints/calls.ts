import { api } from "../client";
import type { CallSession, StartCallBody } from "../types";

export const callsApi = {
  /**
   * Bridged call: the caller's own phone rings first, then the crew is connected. No numbers are
   * returned. 409 = a call to that crew is already in progress; 502 = the telephony provider failed.
   */
  // The backend waits for the telephony provider before answering, so allow longer than the default 20 s.
  start: (body: StartCallBody) => api.post<CallSession>("calls/", body, { timeout: 45_000 }).then((r) => r.data),
};
