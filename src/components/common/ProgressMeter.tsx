import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

type Props = { filled: number; needed: number; dense?: boolean };

/** "12 of 15 workers confirmed": a segmented bar plus text, so the number is never only a colour. */
export function ProgressMeter({ filled, needed, dense }: Props) {
  const { t } = useTranslation();
  const pct = needed > 0 ? Math.min(100, Math.round((filled / needed) * 100)) : 0;
  const full = needed > 0 && filled >= needed;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 0.75, gap: 1 }}>
        <Typography variant={dense ? "body2" : "subtitle1"} sx={{ fontWeight: 700 }}>
          {t("job.workersFilled", { filled, needed })}
        </Typography>
        {!full && needed > filled && (
          <Typography variant="body2" color="text.secondary">
            {t("job.remaining", { count: needed - filled })}
          </Typography>
        )}
        {full && (
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
            {t("job.fullyCovered")}
          </Typography>
        )}
      </Stack>
      <Box
        role="meter"
        aria-label={t("job.meterLabel", { filled, needed })}
        aria-valuemin={0}
        aria-valuemax={needed}
        aria-valuenow={Math.min(filled, needed)}
        sx={{
          height: dense ? 8 : 12,
          borderRadius: 99,
          overflow: "hidden",
          bgcolor: (th) => `color-mix(in srgb, ${(th.vars ?? th).palette.primary.main} 14%, transparent)`,
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 99,
            bgcolor: full ? "success.main" : "primary.main",
            transition: "width .7s cubic-bezier(.2,.8,.2,1)",
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.0), rgba(255,255,255,.25), rgba(255,255,255,.0))",
            backgroundSize: "200% 100%",
            animation: pct > 0 && !full ? "lm-shimmer 3.2s linear infinite" : "none",
          }}
        />
      </Box>
    </Box>
  );
}
