import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Job } from "@/api/types";
import { ProgressMeter } from "@/components/common/ProgressMeter";
import { StatusChip } from "@/components/common/StatusChip";
import { cropName } from "@/i18n/catalog";
import { cropLook } from "@/lib/crops";
import { useFormat } from "@/lib/format";
import { useJobText } from "@/lib/jobText";

type Props = {
  job: Job;
  /** Show the filled/needed meter (tracking and crew list); the list cards use a thinner one. */
  meter?: boolean;
  children?: ReactNode;
};

/** Prototype `.job`: crop colour on the left edge, one title line, one meta line, optional meter. */
export function JobSummary({ job, meter = true, children }: Props) {
  const { t } = useTranslation();
  const f = useFormat();
  const text = useJobText();
  const look = cropLook(job.crop);

  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderLeft: `6px solid ${look.color}`, borderRadius: 3.5, px: 1.75, py: 1.25 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.25, overflowWrap: "anywhere" }}>
          <span aria-hidden="true">{look.emoji}</span> {cropName(job.crop, f.language)}: {text.activities(job.activities.map((a) => a.name))}
        </Typography>
        <StatusChip kind="job" status={job.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {f.dayLabel(job.start_date)}, {t("common.days", { count: job.duration_days })}, {text.payShort({ wageType: job.wage_type, amount: job.wage_amount, acres: job.acres })} · {job.village_name}
      </Typography>
      {meter && (
        <Box sx={{ mt: 1.25 }}>
          <ProgressMeter filled={job.filled_headcount} needed={job.required_workers} dense />
        </Box>
      )}
      {children}
    </Box>
  );
}
