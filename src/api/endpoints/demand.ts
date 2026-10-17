import { api } from "../client";
import type { DemandProfile, DemandProfileUpdate } from "../types";

export const demandApi = {
  me: () => api.get<DemandProfile>("demand/me/").then((r) => r.data),
  /** Update name, language or default location (village_id, or latitude + longitude). */
  updateMe: (body: DemandProfileUpdate) => api.patch<DemandProfile>("demand/me/", body).then((r) => r.data),
};
