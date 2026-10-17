import CheckIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { JobDetail } from "@/api/types";
import { isBookingLive } from "@/lib/status";

type Step = { key: "contacted" | "replied" | "booked" | "confirmed" | "done"; done: boolean };

/** Steps are derived from what actually happened, so contact or a reply never counts as a booking. */
export function buildSteps(job: JobDetail, hasCalls: boolean): Step[] {
  const live = job.bookings.filter((b) => isBookingLive(b.status));
  const cancelled = job.status === "cancelled";
  return [
    { key: "contacted", done: job.invitations.length > 0 || hasCalls || live.length > 0 },
    { key: "replied", done: job.invitations.some((i) => i.response_status !== "awaiting") || live.length > 0 },
    { key: "booked", done: live.length > 0 },
    { key: "confirmed", done: !cancelled && live.length > 0 && job.filled_headcount >= job.required_workers && live.every((b) => b.status !== "pending_confirmation") },
    { key: "done", done: job.status === "closed" && live.some((b) => ["completed", "partially_fulfilled"].includes(b.status)) },
  ];
}

/** Five dots in one row (Uber-style trip progress): done = filled, current = pulsing. */
export function Timeline({ job, hasCalls }: { job: JobDetail; hasCalls: boolean }) {
  const { t } = useTranslation();
  const steps = buildSteps(job, hasCalls);
  const current = steps.findIndex((s) => !s.done);
  const finished = job.status === "cancelled" || job.status === "closed";

  return (
    <Box component="ol" aria-label={t("job.timeline")} sx={{ listStyle: "none", m: 0, p: 0, display: "flex" }}>
      {steps.map((s, i) => {
        const isCurrent = i === current && !finished;
        return (
          <Box component="li" key={s.key} aria-current={isCurrent ? "step" : undefined} sx={{ flex: 1, position: "relative", textAlign: "center", minWidth: 0 }}>
            {i > 0 && (
              <Box aria-hidden="true" sx={{ position: "absolute", top: 11, right: "50%", width: "100%", height: 3, bgcolor: steps[i - 1].done && s.done ? "primary.main" : "divider", transition: "background-color .5s" }} />
            )}
            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                mx: "auto",
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: 2,
                borderColor: s.done || isCurrent ? "primary.main" : "divider",
                bgcolor: s.done ? "primary.main" : "background.paper",
                color: s.done ? "primary.contrastText" : "primary.main",
                animation: isCurrent ? "lm-pulse 2s infinite" : s.done ? "lm-pop .35s both" : "none",
              }}
            >
              {s.done ? <CheckIcon sx={{ fontSize: 16 }} /> : isCurrent ? <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} /> : null}
            </Box>
            <Typography sx={{ mt: 0.5, fontSize: "0.72rem", lineHeight: 1.15, fontWeight: s.done || isCurrent ? 700 : 500, px: 0.25, overflowWrap: "anywhere" }} color={s.done || isCurrent ? "text.primary" : "text.secondary"}>
              {t(`job.tl_${s.key}`)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
