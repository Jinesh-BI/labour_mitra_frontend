import CloudOffIcon from "@mui/icons-material/CloudOffRounded";
import RefreshIcon from "@mui/icons-material/RefreshRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toApiError } from "@/api/errors";

type EmptyProps = { emoji?: string; title: string; body?: string; action?: ReactNode; compact?: boolean };

/** Friendly empty state: always says what happened and offers the next step. */
export function EmptyState({ emoji = "🌾", title, body, action, compact }: EmptyProps) {
  return (
    <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center", py: compact ? 3 : 6, px: 2, animation: "lm-fade .4s both" }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: 38,
          bgcolor: (t) => `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 12%, transparent)`,
        }}
      >
        {emoji}
      </Box>
      <Typography variant="h4" component="p">
        {title}
      </Typography>
      {body && (
        <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
          {body}
        </Typography>
      )}
      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}

/** Error state with retry. Shows the server's message when there is one. */
export function ErrorState({ error, onRetry, title }: { error?: unknown; onRetry?: () => void; title?: string }) {
  const { t } = useTranslation();
  const apiError = error ? toApiError(error) : null;
  return (
    <Stack spacing={1.25} role="alert" sx={{ alignItems: "center", textAlign: "center", py: 5, px: 2 }}>
      <CloudOffIcon color="disabled" sx={{ fontSize: 52 }} />
      <Typography variant="h4" component="p">
        {title ?? t("errors.loadFailed")}
      </Typography>
      {apiError && (
        <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
          {apiError.isNetworkError ? t("errors.network") : apiError.message}
        </Typography>
      )}
      {onRetry && (
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRetry} sx={{ mt: 1 }}>
          {t("common.retry")}
        </Button>
      )}
    </Stack>
  );
}
