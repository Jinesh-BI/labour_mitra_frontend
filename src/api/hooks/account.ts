import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../endpoints/auth";
import { catalogApi } from "../endpoints/catalog";
import { demandApi } from "../endpoints/demand";
import { queryKeys } from "../queryKeys";
import { useAuth } from "@/auth/AuthContext";
import type { ApiError } from "../errors";
import type { AuthSession, DemandProfile, DemandProfileUpdate, LoginBody, RegisterBody, SendOtpBody } from "../types";

export const useSendOtp = () =>
  useMutation<{ success: boolean; message: string }, ApiError, SendOtpBody>({ mutationFn: authApi.sendOtp });

export const useRegister = () => useMutation<AuthSession, ApiError, RegisterBody>({ mutationFn: authApi.register });

export const useLogin = () => useMutation<AuthSession, ApiError, LoginBody>({ mutationFn: authApi.login });

/** The signed-in demand user's profile (name, language, default location). */
export const useMe = () => {
  const { isAuthenticated, isOperator } = useAuth();
  return useQuery({
    queryKey: queryKeys.demandMe,
    queryFn: demandApi.me,
    enabled: isAuthenticated && !isOperator,
    staleTime: 5 * 60_000,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation<DemandProfile, ApiError, DemandProfileUpdate>({
    mutationFn: demandApi.updateMe,
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.demandMe, profile),
  });
};

export const useNearestVillages = (coords: { latitude: number; longitude: number } | null) =>
  useQuery({
    queryKey: queryKeys.nearestVillages(coords?.latitude ?? 0, coords?.longitude ?? 0),
    queryFn: () => catalogApi.nearestVillages(coords!.latitude, coords!.longitude),
    enabled: !!coords,
    staleTime: 10 * 60_000,
  });
