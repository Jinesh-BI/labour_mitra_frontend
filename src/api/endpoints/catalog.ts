import { api } from "../client";
import type { Activity, Crop, HarvestStage, NearestVillage, Village } from "../types";

// Catalog endpoints are public (needed on the sign-up screen) and unpaginated.
export const catalogApi = {
  crops: () => api.get<Crop[]>("catalog/crops/").then((r) => r.data),
  activities: (params: { crop?: string; stage?: HarvestStage }) =>
    api.get<Activity[]>("catalog/activities/", { params }).then((r) => r.data),
  villages: () => api.get<Village[]>("catalog/villages/").then((r) => r.data),
  /** Nearest villages to GPS coordinates, to prefill the village on sign-up. */
  nearestVillages: (lat: number, lng: number) =>
    api.get<NearestVillage[]>("catalog/villages/nearest/", { params: { lat, lng } }).then((r) => r.data),
};
