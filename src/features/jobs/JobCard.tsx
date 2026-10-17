import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { Job } from "@/api/types";
import { ProgressMeter } from "@/components/common/ProgressMeter";
import { StatusChip } from "@/components/common/StatusChip";
import { cropName } from "@/i18n/catalog";
import { cropLook } from "@/lib/crops";
import { useFormat } from "@/lib/format";
import { useJobText } from "@/lib/jobText";

/** One row per job (prototype `.card`): crop colour edge, title, one meta line, thin meter. The whole row is the link. */
export function JobCard({ job }: { job: Job }) {
  const f = useFormat();
  const text = useJobText();
  const look = cropLook(job.crop);

  return (
    <ButtonBase
      component={RouterLink}
      to={`/jobs/${job.id}`}
      sx={{
        display: "block",
        width: "100%",
        textAlign: "left",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderLeft: `6px solid ${look.color}`,
        borderRadius: 3.5,
        px: 1.75,
        py: 1.25,
        transition: "transform .12s, box-shadow .15s",
        "&:active": { transform: "scale(.99)" },
        "&:hover": { boxShadow: 2 },
      }}
    >
      <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.25, overflowWrap: "anywhere" }}>
          <span aria-hidden="true">{look.emoji}</span> {cropName(job.crop, f.language)}: {text.activities(job.activities.map((a) => a.name))}
        </Typography>
        <StatusChip kind="job" status={job.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1 }}>
        {f.dayLabel(job.start_date)} · {text.payShort({ wageType: job.wage_type, amount: job.wage_amount, acres: job.acres })} · {job.village_name}
      </Typography>
      <ProgressMeter filled={job.filled_headcount} needed={job.required_workers} dense />
    </ButtonBase>
  );
}
