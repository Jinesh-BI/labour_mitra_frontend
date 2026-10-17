import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Do not retry errors the user has to fix (4xx); retry flaky network and server errors twice.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});
