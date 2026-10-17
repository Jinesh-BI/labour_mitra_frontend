import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../endpoints/catalog";
import { queryKeys } from "../queryKeys";
import type { HarvestStage } from "../types";

const HOUR = 60 * 60 * 1000;

// Reference data changes rarely; cache it for an hour.
export const useCrops = () => useQuery({ queryKey: queryKeys.crops, queryFn: catalogApi.crops, staleTime: HOUR });

export const useActivities = (crop?: string, stage?: HarvestStage) =>
  useQuery({
    queryKey: queryKeys.activities(crop, stage),
    queryFn: () => catalogApi.activities({ crop, stage }),
    enabled: !!crop && !!stage,
    staleTime: HOUR,
  });

export const useVillages = () =>
  useQuery({ queryKey: queryKeys.villages, queryFn: catalogApi.villages, staleTime: HOUR });
