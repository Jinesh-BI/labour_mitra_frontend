import CallIcon from "@mui/icons-material/CallRounded";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineRounded";
import UpdateIcon from "@mui/icons-material/UpdateRounded";
import VerifiedIcon from "@mui/icons-material/VerifiedRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { CrewCandidate } from "@/api/types";
import { Avatar } from "@/components/common/Avatar";
import { activityName } from "@/i18n/catalog";
import { toNumber, useFormat } from "@/lib/format";

type Props = {
  candidate: CrewCandidate;
  required: number;
  selectMode: boolean;
  selected: boolean;
  invited: boolean;
  booked: boolean;
  onToggle: () => void;
  onCall: () => void;
  onOpen: () => void;
};

/** Availability is always labelled: unknown and stale are never shown as confirmed. */
export function AvailabilityLine({ candidate }: { candidate: CrewCandidate }) {
  const { t } = useTranslation();
  const f = useFormat();
  const freshness = candidate.availability_freshness;
  const common = { variant: "body2", sx: { display: "flex", gap: 0.5, alignItems: "center", fontSize: "0.82rem" } } as const;

  if (freshness === "fresh") {
    return (
      <Typography {...common} sx={{ ...common.sx, color: "success.main", fontWeight: 600 }}>
        <VerifiedIcon sx={{ fontSize: 16 }} /> {t("crews.fresh", { when: f.ago(candidate.availability_confirmed_at) })}
      </Typography>
    );
  }
  if (freshness === "stale") {
    return (
      <Typography {...common} sx={{ ...common.sx, color: "warning.main", fontWeight: 600 }}>
        <UpdateIcon sx={{ fontSize: 16 }} /> {t("crews.stale", { when: f.ago(candidate.availability_confirmed_at) })}
      </Typography>
    );
  }
  return (
    <Typography {...common} color="text.secondary">
      <HelpOutlineIcon sx={{ fontSize: 16 }} /> {t("crews.unknown")}
    </Typography>
  );
}

/** Crew row, modelled on the prototype's `.lab` card but kept to three lines of facts. */
export function CandidateCard({ candidate: c, required, selectMode, selected, invited, booked, onToggle, onCall, onOpen }: Props) {
  const { t } = useTranslation();
  const f = useFormat();
  const crew = c.crew_team;
  const rating = toNumber(crew.rating);
  const rate = toNumber(crew.daily_rate);

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: selected ? 2 : 1,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 4,
        p: selected ? "13px" : 1.75,
        mb: 1.25,
        transition: "border-color .15s",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
        {selectMode && (
          <Checkbox
            checked={selected}
            onChange={onToggle}
            disabled={booked}
            slotProps={{ input: { "aria-label": t("crews.select", { name: crew.team_name }) } }}
            sx={{ p: 0.5, ml: -0.75, alignSelf: "center", "& svg": { fontSize: 28 } }}
          />
        )}
        <Avatar name={crew.team_name} />
        <Box
          component="button"
          type="button"
          onClick={onOpen}
          aria-label={`${t("crews.details")}: ${crew.team_name}`}
          sx={{ all: "unset", flex: 1, minWidth: 0, cursor: "pointer", borderRadius: 1, "&:focus-visible": { outline: "3px solid #F2B01E", outlineOffset: 2 } }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2, overflowWrap: "anywhere" }}>{crew.team_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {crew.is_group ? t("crews.mukadam", { count: crew.team_size, leader: crew.leader_name }) : t("crews.individual")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("common.kmAway", { count: c.distance_km })} · {t(`crews.gender_${crew.gender}`)}
            {rating !== null && <Box component="span" sx={{ whiteSpace: "nowrap" }}> · ★ {rating.toFixed(1)}</Box>}
            {c.jobs_completed > 0 && ` · ${t("crews.jobsDone", { count: c.jobs_completed })}`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", flex: "none" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>{rate !== null ? f.money(rate) : "—"}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {t("common.perDay")}
          </Typography>
          {c.within_budget !== null && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                mt: 0.25,
                px: 0.9,
                borderRadius: 1.5,
                fontSize: "0.72rem",
                fontWeight: 700,
                bgcolor: c.within_budget ? "success.main" : "warning.main",
                color: c.within_budget ? "success.contrastText" : "warning.contrastText",
              }}
            >
              {c.within_budget ? t("crews.inBudget") : t("crews.aboveBudget")}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.25 }}>
        {c.matched_activities.map((n) => (
          <Box key={n} component="span" sx={{ fontSize: "0.78rem", fontWeight: 600, borderRadius: 1.75, px: 1, py: "1px", bgcolor: (th) => `color-mix(in srgb, ${(th.vars ?? th).palette.primary.main} 14%, transparent)`, color: "primary.main" }}>
            {activityName(n, f.language)}
          </Box>
        ))}
      </Box>

      <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600, color: c.covers_required_headcount ? "success.main" : "warning.main" }}>
        {c.covers_required_headcount ? t("crews.availableFull", { count: c.available_headcount }) : t("crews.available", { count: c.available_headcount, need: required })}
      </Typography>
      <AvailabilityLine candidate={c} />
      {(invited || booked) && (
        <Typography variant="caption" sx={{ display: "block", mt: 0.25, fontWeight: 700, color: "info.main" }}>
          {booked ? t("crews.alreadyBooked") : t("invite.alreadyInvited")}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, mt: 1.25, alignItems: "center" }}>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" color="inherit" size="small" onClick={onOpen}>
          {t("crews.details")}
        </Button>
        <Button variant="contained" size="small" startIcon={<CallIcon />} onClick={onCall} disabled={selectMode}>
          {t("crews.call")}
        </Button>
      </Box>
    </Box>
  );
}
