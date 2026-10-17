import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import "@/i18n";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "@/auth/AuthContext";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { theme } from "@/theme/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
        {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
