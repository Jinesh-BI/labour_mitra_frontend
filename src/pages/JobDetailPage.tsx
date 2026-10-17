import MoreVertIcon from "@mui/icons-material/MoreVertRounded";
import RefreshIcon from "@mui/icons-material/RefreshRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCancelJob, useJob, useJobCalls } from "@/api/hooks/jobs";
import type { Booking, Invitation } from "@/api/types";
import { BottomBar } from "@/components/common/BottomBar";
import { Panel } from "@/components/common/Panel";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/States";
import { StatusChip } from "@/components/common/StatusChip";
import { useToast } from "@/components/feedback/ToastProvider";
import { BookDialog } from "@/features/crews/BookDialog";
import { JobSummary } from "@/features/jobs/JobSummary";
import { RepeatDialog } from "@/features/jobs/RepeatDialog";
import { BookingCard, type BookingAction } from "@/features/tracking/BookingCard";
import { AttendanceDialog, CancelBookingDialog, CancelReasonDialog, ConfirmTermsDialog, ReconfirmDialog, RecordReplyDialog } from "@/features/tracking/BookingDialogs";
import { ReplyCard } from "@/features/tracking/ReplyCard";
import { Timeline } from "@/features/tracking/Timeline";
import { formatDuration, useFormat } from "@/lib/format";
import { isBookingLive, isJobOpen } from "@/lib/status";

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <Box component="section" aria-label={title} sx={{ mt: 2.5 }}>
      <Typography variant="h3" component="h2" sx={{ mb: 0.75 }}>
        {title}
        {count ? (
          <Typography component="span" color="text.secondary" sx={{ ml: 0.75, fontWeight: 700 }}>
            {count}
          </Typography>
        ) : null}
      </Typography>
      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, px: 1.75 }}>{children}</Box>
    </Box>
  );
}

/** Tracking page: what is confirmed, who still has to answer, and the next action, in one scroll. */
export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const f = useFormat();
  const navigate = useNavigate();
  const location = useLocation();
  const job = useJob(id);
  const calls = useJobCalls(id);
  const cancelJob = useCancelJob(id ?? "");

  const [action, setAction] = useState<{ type: BookingAction; booking: Booking } | null>(null);
  const [replying, setReplying] = useState<Invitation | null>(null);
  const [bookingFor, setBookingFor] = useState<Invitation | null>(null);
  const [repeating, setRepeating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [menu, setMenu] = useState<HTMLElement | null>(null);

  // After "Book" on the crew list we arrive with the new booking and go straight to confirming its terms.
  const confirmId = (location.state as { confirmBookingId?: string } | null)?.confirmBookingId;
  useEffect(() => {
    if (!confirmId || !job.data) return;
    const booking = job.data.bookings.find((b) => b.id === confirmId);
    if (booking && booking.status === "pending_confirmation") setAction({ type: "confirm", booking });
    navigate(location.pathname, { replace: true, state: null });
  }, [confirmId, job.data, location.pathname, navigate]);

  if (job.isPending) return <DetailSkeleton />;
  if (job.isError) {
    return <ErrorState error={job.error} title={job.error.isNotFound ? t("errors.jobNotFound") : undefined} onRetry={job.error.isNotFound ? undefined : () => job.refetch()} />;
  }

  const j = job.data;
  const open = isJobOpen(j.status);
  const liveBookings = j.bookings.filter((b) => isBookingLive(b.status));
  const liveIds = new Set(liveBookings.map((b) => b.crew_team.id));
  const canBook = open && j.remaining_headcount > 0;
  const bookings = [...j.bookings].sort((a, b) => Number(isBookingLive(b.status)) - Number(isBookingLive(a.status)));
  const callList = calls.data ?? [];

  const refresh = async () => {
    const r = await job.refetch();
    if (r.isSuccess) toast.success(t("job.reloaded"));
  };

  return (
    <>
      <JobSummary job={j} />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: "flex", gap: 1, alignItems: "flex-start" }} aria-live="polite">
        <Box sx={{ flex: 1 }}>
          <Box component="b" sx={{ color: "text.primary" }}>
            {t("job.nextTitle")}:
          </Box>{" "}
          {t(`job.next_${j.status}`, { remaining: j.remaining_headcount })}
          {j.closed_reason && ` ${t("job.closedReason", { reason: j.closed_reason })}`}
        </Box>
        <IconButton aria-label={t("common.refresh")} size="small" onClick={refresh} disabled={job.isFetching} sx={{ mt: -0.5 }}>
          <RefreshIcon fontSize="small" sx={{ animation: job.isFetching ? "lm-ring 1s linear infinite" : "none" }} />
        </IconButton>
      </Typography>

      <Panel sx={{ mt: 1.5, py: 1.5 }}>
        <Timeline job={j} hasCalls={callList.length > 0} />
      </Panel>

      <Section title={t("job.crewsTitle")} count={liveBookings.length}>
        {bookings.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1.5 }}>
            {t("job.noBookings")} {t("job.noBookingsBody")}
          </Typography>
        ) : (
          bookings.map((b, i) => (
            <Fragment key={b.id}>
              {i > 0 && <Divider />}
              <BookingCard booking={b} jobId={j.id} onAction={(type, booking) => setAction({ type, booking })} />
            </Fragment>
          ))
        )}
      </Section>

      {j.invitations.length > 0 && (
        <Section title={t("job.repliesTitle")} count={j.invitations.length}>
          {j.invitations.map((inv, i) => (
            <Fragment key={inv.id}>
              {i > 0 && <Divider />}
              <ReplyCard invitation={inv} booked={liveIds.has(inv.crew_team.id)} canBook={canBook} onRecord={() => setReplying(inv)} onBook={() => setBookingFor(inv)} />
            </Fragment>
          ))}
        </Section>
      )}

      {callList.length > 0 && (
        <Section title={t("job.callsTitle")} count={callList.length}>
          {callList.map((c, i) => (
            <Fragment key={c.id}>
              {i > 0 && <Divider />}
              <Box sx={{ py: 1.25, display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{c.crew_team.team_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.ago(c.created_at)}
                    {c.talk_time_seconds > 0 ? ` · ${t("call.talkTime", { time: formatDuration(c.talk_time_seconds) })}` : ""}
                  </Typography>
                </Box>
                <StatusChip kind="call" status={c.status} />
              </Box>
            </Fragment>
          ))}
        </Section>
      )}

      <BottomBar>
        {open ? (
          <>
            <Button component={RouterLink} to={`/jobs/${j.id}/crews`} variant="contained" color="secondary" size="large">
              {liveBookings.length > 0 ? t("job.findMore") : t("job.findCrews")}
            </Button>
            <IconButton aria-label={t("job.more")} aria-haspopup="menu" onClick={(e) => setMenu(e.currentTarget)} sx={{ border: 2, borderColor: "divider", borderRadius: 3, width: 54, height: 54 }}>
              <MoreVertIcon />
            </IconButton>
          </>
        ) : (
          <Button variant="contained" color="secondary" size="large" onClick={() => setRepeating(true)}>
            {t("job.repeat")}
          </Button>
        )}
      </BottomBar>

      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <MenuItem component={RouterLink} to={`/jobs/${j.id}/crews?mode=request`} sx={{ minHeight: 46 }}>
          {t("job.sendRequest")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenu(null);
            setRepeating(true);
          }}
          sx={{ minHeight: 46 }}
        >
          {t("job.repeat")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenu(null);
            setCancelling(true);
          }}
          sx={{ minHeight: 46, color: "error.main" }}
        >
          {t("job.cancelJob")}
        </MenuItem>
      </Menu>

      {action?.type === "confirm" && <ConfirmTermsDialog booking={action.booking} jobId={j.id} defaultWage={j.wage_amount} onClose={() => setAction(null)} />}
      {action?.type === "reconfirm" && <ReconfirmDialog booking={action.booking} jobId={j.id} onClose={() => setAction(null)} />}
      {action?.type === "attendance" && <AttendanceDialog booking={action.booking} jobId={j.id} onClose={() => setAction(null)} />}
      {action?.type === "cancel" && <CancelBookingDialog booking={action.booking} jobId={j.id} onClose={() => setAction(null)} />}
      {replying && <RecordReplyDialog invitation={replying} jobId={j.id} onClose={() => setReplying(null)} />}
      {bookingFor && (
        <BookDialog
          open
          jobId={j.id}
          crew={bookingFor.crew_team}
          max={Math.min(bookingFor.proposed_headcount ?? bookingFor.crew_team.team_size, j.remaining_headcount)}
          onClose={() => setBookingFor(null)}
          onBooked={(b) => {
            setBookingFor(null);
            setAction({ type: "confirm", booking: b });
          }}
        />
      )}
      {repeating && <RepeatDialog jobId={j.id} onClose={() => setRepeating(false)} />}
      {cancelling && (
        <CancelReasonDialog
          title={t("cancelJob.title")}
          intro={t("cancelJob.body")}
          actionLabel={t("cancelJob.action")}
          keepLabel={t("cancelJob.keep")}
          reasonLabel={t("cancelJob.reason")}
          reasonPlaceholder={t("cancelJob.reasonPh")}
          errorText={t("cancelJob.errReason")}
          successText={t("cancelJob.done")}
          pending={cancelJob.isPending}
          error={cancelJob.error}
          onSubmit={(reason, done) => cancelJob.mutate(reason, { onSuccess: done })}
          onClose={() => setCancelling(false)}
        />
      )}
    </>
  );
}
