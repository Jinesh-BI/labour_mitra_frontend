import CallIcon from "@mui/icons-material/CallRounded";
import EventAvailableIcon from "@mui/icons-material/EventAvailableRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CrewCandidate } from "@/api/types";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { activityName } from "@/i18n/catalog";
import { toNumber, useFormat } from "@/lib/format";
import { AvailabilityLine } from "./CandidateCard";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 1.5, py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }} component="div">
        {children}
      </Typography>
    </Box>
  );
}

type Props = {
  candidate: CrewCandidate | null;
  onClose: () => void;
  onCall: (c: CrewCandidate) => void;
  onBook: (c: CrewCandidate) => void;
  canBook: boolean;
  booked: boolean;
};

/** Full crew profile in a sheet. Never shows a phone number: calling goes through the platform. */
export function CrewSheet({ candidate: c, onClose, onCall, onBook, canBook, booked }: Props) {
  const { t } = useTranslation();
  const f = useFormat();
  const crew = c?.crew_team;
  const rating = toNumber(crew?.rating);
  const rate = toNumber(crew?.daily_rate);

  return (
    <ResponsiveSheet
      open={!!c}
      onClose={onClose}
      title={crew?.team_name ?? ""}
      actions={
        c && (
          <>
            <Button variant="outlined" startIcon={<EventAvailableIcon />} onClick={() => onBook(c)} disabled={!canBook || booked}>
              {booked ? t("crews.alreadyBooked") : t("crews.book")}
            </Button>
            <Button variant="contained" startIcon={<CallIcon />} onClick={() => onCall(c)}>
              {t("crews.call")}
            </Button>
          </>
        )
      }
    >
      {c && crew && (
        <Stack spacing={1}>
          <Typography color="text.secondary">
            {crew.is_group ? t("crews.mukadam", { count: crew.team_size, leader: crew.leader_name }) : t("crews.individual")} · {t("crews.from", { village: crew.village_name })}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip color={c.within_budget === null ? "default" : c.within_budget ? "success" : "warning"} variant="outlined" label={c.within_budget === null ? t("crews.budgetUnknown") : c.within_budget ? t("crews.inBudget") : t("crews.aboveBudget")} />
            <Chip label={t("common.kmAway", { count: c.distance_km })} />
            <Chip label={t(`crews.gender_${crew.gender}`)} />
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Fact label={t("crews.sizeLabel")}>{t("common.workers", { count: crew.team_size })}</Fact>
          <Fact label={t("job.pay")}>{rate !== null ? t("crews.rate", { amount: f.money(rate) }) : t("crews.budgetUnknown")}</Fact>
          <Fact label={t("crews.ratingLabel")}>{rating !== null ? `★ ${rating.toFixed(1)}` : t("crews.noRating")}</Fact>
          <Fact label={t("crews.jobsLabel")}>{c.jobs_completed}</Fact>
          {c.fulfilment_ratio !== null && <Fact label={t("crews.reliabilityLabel")}>{t("crews.fulfil", { percent: Math.round(c.fulfilment_ratio * 100) })}</Fact>}
          <Fact label={t("crews.whyMatch")}>{c.matched_activities.map((n) => activityName(n, f.language)).join(", ")}</Fact>
          <Fact label={t("job.who")}>
            {c.covers_required_headcount ? t("crews.availableFull", { count: c.available_headcount }) : t("crews.partial", { count: c.available_headcount })}
          </Fact>
          <Box sx={{ pt: 1 }}>
            <AvailabilityLine candidate={c} />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t("crews.callNote")} {t("crews.notBooking")}
          </Typography>
        </Stack>
      )}
    </ResponsiveSheet>
  );
}
