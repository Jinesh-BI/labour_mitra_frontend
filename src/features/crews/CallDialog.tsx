import CallIcon from "@mui/icons-material/CallRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalkRounded";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissedRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStartCall } from "@/api/hooks/bookings";
import { useJobCalls } from "@/api/hooks/jobs";
import type { CallSession, CrewPublic } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { StatusChip } from "@/components/common/StatusChip";
import { useToast } from "@/components/feedback/ToastProvider";
import { formatDuration } from "@/lib/format";
import { maskMobile } from "@/lib/validation";
import { isCallFinished } from "@/lib/status";

const POLL_LIMIT_MS = 2 * 60_000;

type Props = {
  open: boolean;
  jobId: string;
  crew: CrewPublic;
  onClose: () => void;
  /** Called from the "what next" panel. A call alone never books a crew. */
  onBook: () => void;
  canBook: boolean;
};

const FAILED: CallSession["status"][] = ["failed", "busy", "no_answer", "canceled"];

/**
 * Bridged call flow. POST calls/ returns at once (queued); the user's own phone rings, then the crew is connected.
 * We poll the job's call list every 5 s (inside useJobCalls) for up to two minutes and stop on a final status.
 */
export function CallDialog({ open, jobId, crew, onClose, onBook, canBook }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  const start = useStartCall(jobId);
  const [tracking, setTracking] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const calls = useJobCalls(jobId, open && tracking && !timedOut);

  useEffect(() => {
    if (!tracking) return;
    const id = window.setTimeout(() => setTimedOut(true), POLL_LIMIT_MS);
    return () => window.clearTimeout(id);
  }, [tracking, callId]);

  const forCrew = (calls.data ?? []).filter((c) => c.crew_team.id === crew.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const current: CallSession | undefined = callId ? calls.data?.find((c) => c.id === callId) : forCrew.find((c) => !isCallFinished(c.status));
  const status: CallSession["status"] = current?.status ?? "queued";
  const finished = !!current && isCallFinished(current.status);

  const begin = () => {
    setTimedOut(false);
    start.mutate(crew.id, {
      onSuccess: (session) => {
        setCallId(session.id);
        setTracking(true);
        toast.info(t("call.started"));
      },
      onError: (error) => {
        if (error.isConflict) {
          // A call to this crew is already running: follow that one instead of starting another.
          setCallId(null);
          setTracking(true);
        }
      },
    });
  };

  const reset = () => {
    setTracking(false);
    setCallId(null);
    setTimedOut(false);
    start.reset();
  };

  const stateText = start.error?.isConflict ? t("call.inProgress") : t(`call.${status}`);
  const isRinging = tracking && !finished && !timedOut;
  const failed = finished && FAILED.includes(status);

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={t("call.title", { name: crew.team_name })}
      maxWidth="xs"
      actions={
        !tracking ? (
          <>
            <Button color="inherit" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="contained" size="large" startIcon={start.isPending ? <CircularProgress size={18} color="inherit" /> : <CallIcon />} onClick={begin} disabled={start.isPending}>
              {start.isPending ? t("call.starting") : t("call.start")}
            </Button>
          </>
        ) : finished ? (
          <>
            {failed || timedOut ? (
              <Button variant="contained" startIcon={<CallIcon />} onClick={reset}>
                {t("call.tryAgain")}
              </Button>
            ) : (
              canBook && (
                <Button variant="contained" color="secondary" onClick={onBook}>
                  {t("call.bookNow")}
                </Button>
              )
            )}
            <Button color="inherit" onClick={onClose}>
              {t("common.close")}
            </Button>
          </>
        ) : (
          <Button color="inherit" onClick={onClose}>
            {t("common.close")}
          </Button>
        )
      }
    >
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", py: 1 }}>
        {!tracking && (
          <>
            <Box sx={{ width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText" }}>
              <CallIcon sx={{ fontSize: 42 }} />
            </Box>
            <Typography>{t("call.intro")}</Typography>
            {user && (
              <Typography sx={{ fontWeight: 700 }}>{t("call.yourPhone", { mobile: maskMobile(user.mobile) })}</Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {t("call.private")}
            </Typography>
          </>
        )}

        {tracking && (
          <>
            <Box
              aria-hidden="true"
              sx={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: finished ? (failed ? "error.main" : "success.main") : "primary.main",
                bgcolor: "currentColor",
                animation: isRinging ? "lm-pulse 1.6s infinite" : "none",
                "& svg": { color: "#fff", fontSize: 46, animation: isRinging && status !== "in_progress" ? "lm-ring 1.4s infinite" : "none" },
              }}
            >
              {finished ? failed ? <PhoneMissedIcon /> : <CheckCircleIcon /> : status === "in_progress" ? <PhoneInTalkIcon /> : <CallIcon />}
            </Box>
            {/* Announced to screen readers whenever the status changes. */}
            <Typography variant="h4" component="p" role="status" aria-live="polite">
              {timedOut && !finished ? t("call.timeout") : stateText}
            </Typography>
            {current && <StatusChip kind="call" status={current.status} />}
            {finished && current && current.talk_time_seconds > 0 && (
              <Typography color="text.secondary">{t("call.talkTime", { time: formatDuration(current.talk_time_seconds) })}</Typography>
            )}
            {finished && !failed && (
              <Alert severity="info" sx={{ textAlign: "left", width: "100%" }}>
                <strong>{t("call.nextTitle")}</strong> {t("call.nextBody")}
              </Alert>
            )}
          </>
        )}

        {start.isError && !start.error.isConflict && (
          <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
            {start.error.status === 502 ? t("call.telephonyDown") : start.error.message}
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary">
          {t("crews.callNote")}
        </Typography>
      </Stack>
    </ResponsiveSheet>
  );
}
