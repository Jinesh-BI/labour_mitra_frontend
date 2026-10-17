import RefreshIcon from "@mui/icons-material/RefreshRounded";
import SendIcon from "@mui/icons-material/SendRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCandidates, useJob } from "@/api/hooks/jobs";
import type { CrewCandidate } from "@/api/types";
import { BottomBar } from "@/components/common/BottomBar";
import { Seg } from "@/components/common/Seg";
import { DetailSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import { EmptyState, ErrorState } from "@/components/common/States";
import { useToast } from "@/components/feedback/ToastProvider";
import { BookDialog } from "@/features/crews/BookDialog";
import { CallDialog } from "@/features/crews/CallDialog";
import { CandidateCard } from "@/features/crews/CandidateCard";
import { CrewSheet } from "@/features/crews/CrewSheet";
import { InviteDialog } from "@/features/crews/InviteDialog";
import { JobSummary } from "@/features/jobs/JobSummary";
import { isBookingLive, isJobOpen } from "@/lib/status";

type FilterKey = "budget" | "full" | "fresh" | "women";

const filters: Record<FilterKey, (c: CrewCandidate) => boolean> = {
  budget: (c) => c.within_budget === true,
  full: (c) => c.covers_required_headcount,
  fresh: (c) => c.availability_freshness === "fresh",
  women: (c) => c.crew_team.gender === "female",
};

const filterLabel = { budget: "crews.fBudget", full: "crews.fFull", fresh: "crews.fFresh", women: "crews.fWomen" } as const;

/** Ranked crews for one job. Calling and sending a job request are the two ways to hire; neither books a crew. */
export function CandidatesPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const job = useJob(id);
  const candidates = useCandidates(id);

  const [mode, setMode] = useState<"call" | "request">(searchParams.get("mode") === "request" ? "request" : "call");
  const [active, setActive] = useState<FilterKey[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [sheet, setSheet] = useState<CrewCandidate | null>(null);
  const [calling, setCalling] = useState<CrewCandidate | null>(null);
  const [booking, setBooking] = useState<CrewCandidate | null>(null);
  const [inviting, setInviting] = useState(false);

  const all = candidates.data ?? [];
  const visible = useMemo(() => all.filter((c) => active.every((k) => filters[k](c))), [all, active]);

  if (job.isPending) return <DetailSkeleton />;
  if (job.isError) {
    return <ErrorState error={job.error} title={job.error.isNotFound ? t("errors.jobNotFound") : undefined} onRetry={job.error.isNotFound ? undefined : () => job.refetch()} />;
  }
  const j = job.data;
  const remaining = j.remaining_headcount > 0 ? j.remaining_headcount : j.required_workers;
  const liveBookings = new Set(j.bookings.filter((b) => isBookingLive(b.status)).map((b) => b.crew_team.id));
  const invited = new Set(j.invitations.map((i) => i.crew_team.id));
  const open = isJobOpen(j.status);
  const canBook = open && j.remaining_headcount > 0;

  const selectMode = mode === "request";
  const pickedCandidates = all.filter((c) => picked.includes(c.crew_team.id));
  const offer = pickedCandidates.reduce((sum, c) => sum + c.available_headcount, 0);
  const toggleFilter = (k: FilterKey) => setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  const toggleCrew = (crewId: string) => setPicked((p) => (p.includes(crewId) ? p.filter((x) => x !== crewId) : [...p, crewId]));

  const refresh = async () => {
    const result = await candidates.refetch();
    if (result.isSuccess) toast.success(t("crews.refreshed"));
  };

  return (
    <>
      <JobSummary job={j} />

      {!open && (
        <Alert severity="info" sx={{ mt: 1.5 }} action={<Button component={RouterLink} to={`/jobs/${j.id}`} color="inherit" size="small">{t("job.title")}</Button>}>
          {t(`job.next_${j.status}`, { remaining: j.remaining_headcount })}
        </Alert>
      )}

      {open && (
        <>
          <Box sx={{ mt: 1.5 }}>
            <Seg<"call" | "request">
              label={t("crews.how")}
              value={mode}
              onChange={(v) => {
                setMode(v);
                setPicked([]);
              }}
              options={[
                { value: "call", label: `📞 ${t("crews.howCall")}` },
                { value: "request", label: `💬 ${t("crews.howRequest")}` },
              ]}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }} aria-live="polite">
              {selectMode ? t("crews.howRequestBody") : t("crews.howCallBody")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
            <Typography sx={{ flex: 1, fontWeight: 700 }} aria-live="polite">
              {candidates.data ? (active.length ? t("crews.shown", { shown: visible.length, total: all.length }) : t("crews.matching", { count: all.length })) : ""}
            </Typography>
            <IconButton aria-label={t("common.refresh")} onClick={refresh} disabled={candidates.isFetching} size="small">
              <RefreshIcon sx={{ animation: candidates.isFetching ? "lm-ring 1s linear infinite" : "none" }} />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", gap: 0.75, overflowX: "auto", py: 1, mx: -2, px: 2, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }} role="group" aria-label={t("crews.filters")}>
            {(Object.keys(filters) as FilterKey[]).map((k) => (
              <Chip
                key={k}
                clickable
                role="checkbox"
                aria-checked={active.includes(k)}
                label={t(filterLabel[k])}
                color={active.includes(k) ? "primary" : "default"}
                variant={active.includes(k) ? "filled" : "outlined"}
                onClick={() => toggleFilter(k)}
                sx={{ flex: "none" }}
              />
            ))}
          </Box>

          {candidates.isPending && <ListSkeleton count={3} />}
          {candidates.isError && <ErrorState error={candidates.error} onRetry={() => candidates.refetch()} />}
          {candidates.data && all.length === 0 && (
            <EmptyState
              emoji="🔍"
              title={t("crews.none")}
              body={t("crews.noneBody")}
              action={
                <Button variant="contained" onClick={() => navigate("/new")}>
                  {t("crews.editJob")}
                </Button>
              }
            />
          )}
          {candidates.data && all.length > 0 && visible.length === 0 && (
            <EmptyState compact emoji="🧺" title={t("crews.noneFilter")} action={<Button onClick={() => setActive([])}>{t("crews.clearFilters")}</Button>} />
          )}

          {visible.map((c) => (
            <CandidateCard
              key={c.crew_team.id}
              candidate={c}
              required={remaining}
              selectMode={selectMode}
              selected={picked.includes(c.crew_team.id)}
              invited={invited.has(c.crew_team.id)}
              booked={liveBookings.has(c.crew_team.id)}
              onToggle={() => toggleCrew(c.crew_team.id)}
              onCall={() => setCalling(c)}
              onOpen={() => setSheet(c)}
            />
          ))}

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
            {t("crews.notBooking")}
          </Typography>

          {selectMode && (
            <BottomBar hint={picked.length === 0 ? t("crews.selectHint") : offer >= remaining ? t("crews.coverageOk", { need: remaining }) : t("crews.coverage", { offer, need: remaining })}>
              <Button fullWidth variant="contained" color="secondary" size="large" startIcon={<SendIcon />} disabled={picked.length === 0} onClick={() => setInviting(true)}>
                {picked.length === 0 ? t("crews.sendRequest") : t("crews.sendRequestN", { count: picked.length })}
              </Button>
            </BottomBar>
          )}
        </>
      )}

      <CrewSheet
        candidate={sheet}
        onClose={() => setSheet(null)}
        onCall={(c) => {
          setSheet(null);
          setCalling(c);
        }}
        onBook={(c) => {
          setSheet(null);
          setBooking(c);
        }}
        canBook={canBook}
        booked={!!sheet && liveBookings.has(sheet.crew_team.id)}
      />

      {calling && (
        <CallDialog
          key={calling.crew_team.id}
          open
          jobId={j.id}
          crew={calling.crew_team}
          canBook={canBook && !liveBookings.has(calling.crew_team.id)}
          onClose={() => setCalling(null)}
          onBook={() => {
            setBooking(calling);
            setCalling(null);
          }}
        />
      )}

      {booking && (
        <BookDialog
          key={booking.crew_team.id}
          open
          jobId={j.id}
          crew={booking.crew_team}
          max={Math.min(booking.available_headcount, j.remaining_headcount)}
          onClose={() => setBooking(null)}
          onBooked={(b) => {
            setBooking(null);
            navigate(`/jobs/${j.id}`, { state: { confirmBookingId: b.id } });
          }}
        />
      )}

      <InviteDialog open={inviting} jobId={j.id} crews={pickedCandidates.map((c) => c.crew_team)} onClose={() => setInviting(false)} onViewJob={() => navigate(`/jobs/${j.id}`)} />
    </>
  );
}
