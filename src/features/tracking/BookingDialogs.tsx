import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCancelBooking, useConfirmBooking, useReconfirm, useRecordAttendance, useRecordResponse } from "@/api/hooks/bookings";
import type { ApiError } from "@/api/errors";
import type { Booking, Invitation, RecordResponseBody } from "@/api/types";
import { QtyStepper } from "@/components/common/QtyStepper";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { useToast } from "@/components/feedback/ToastProvider";
import { todayInput, toNumber } from "@/lib/format";

type Channel = "phone" | "whatsapp" | "in_person" | "other";
const CHANNELS: Channel[] = ["phone", "whatsapp", "in_person", "other"];

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return (
    <Alert severity="error" role="alert">
      {error.message}
    </Alert>
  );
}

function ChannelField({ value, onChange, label }: { value: Channel; onChange: (c: Channel) => void; label: string }) {
  const { t } = useTranslation();
  return (
    <TextField select label={label} value={value} onChange={(e) => onChange(e.target.value as Channel)}>
      {CHANNELS.map((c) => (
        <MenuItem key={c} value={c}>
          {t(`booking.channel_${c}`)}
        </MenuItem>
      ))}
    </TextField>
  );
}

// ---------------------------------------------------------------- confirm terms
export function ConfirmTermsDialog({ booking, jobId, defaultWage, onClose }: { booking: Booking; jobId: string; defaultWage: string; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirmBooking(jobId);
  const [headcount, setHeadcount] = useState<number | "">(booking.agreed_headcount);
  const [date, setDate] = useState(booking.agreed_date);
  const [meeting, setMeeting] = useState(booking.meeting_point);
  const [wage, setWage] = useState(booking.agreed_wage ?? "");
  const [channel, setChannel] = useState<Channel>("phone");
  const [errors, setErrors] = useState<{ headcount?: string; date?: string; meeting?: string }>({});

  const submit = () => {
    const found = {
      headcount: headcount === "" || headcount < 1 ? t("booking.errHeadcount") : undefined,
      date: !date || date < todayInput() ? t("wizard.errDate") : undefined,
      meeting: meeting.trim() ? undefined : t("booking.errMeeting"),
    };
    setErrors(found);
    if (found.headcount || found.date || found.meeting || headcount === "") return;
    const agreed = toNumber(wage);
    confirm.mutate(
      {
        bookingId: booking.id,
        body: { agreed_headcount: headcount, agreed_date: date, meeting_point: meeting.trim(), agreed_wage: agreed !== null && agreed > 0 ? String(agreed) : null, channel },
      },
      {
        onSuccess: () => {
          toast.success(t("booking.confirmed", { name: booking.crew_team.team_name }));
          onClose();
        },
      },
    );
  };

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={t("booking.confirmTitle", { name: booking.crew_team.team_name })}
      busy={confirm.isPending}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={confirm.isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" color="secondary" size="large" onClick={submit} disabled={confirm.isPending}>
            {confirm.isPending ? t("common.saving") : t("booking.confirmAction")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.25}>
        <Typography color="text.secondary">{t("booking.confirmIntro")}</Typography>
        <QtyStepper id="c-headcount" label={t("booking.agreedHeadcount")} value={headcount} onChange={setHeadcount} min={1} max={500} error={errors.headcount} />
        <TextField type="date" label={t("booking.agreedDate")} value={date} onChange={(e) => setDate(e.target.value)} error={!!errors.date} helperText={errors.date} slotProps={{ htmlInput: { min: todayInput() }, inputLabel: { shrink: true } }} />
        <TextField label={t("booking.meetingPoint")} placeholder={t("booking.meetingPointPh")} value={meeting} onChange={(e) => setMeeting(e.target.value)} error={!!errors.meeting} helperText={errors.meeting} slotProps={{ htmlInput: { maxLength: 200 } }} />
        <TextField
          label={t("booking.agreedWage")}
          placeholder={defaultWage}
          value={wage}
          onChange={(e) => setWage(e.target.value.replace(/[^\d.]/g, "").slice(0, 9))}
          helperText={t("booking.agreedWageHint")}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
        />
        <ChannelField value={channel} onChange={setChannel} label={t("booking.channel")} />
        <ErrorBox error={confirm.error} />
      </Stack>
    </ResponsiveSheet>
  );
}

// ---------------------------------------------------------------- reconfirmation answer
export function ReconfirmDialog({ booking, jobId, onClose }: { booking: Booking; jobId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const reconfirm = useReconfirm(jobId);
  const [result, setResult] = useState<"reconfirmed" | "unavailable" | "unanswered">("reconfirmed");
  const [channel, setChannel] = useState<Channel>("phone");

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={t("booking.reconfirmTitle", { name: booking.crew_team.team_name })}
      maxWidth="xs"
      busy={reconfirm.isPending}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={reconfirm.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() =>
              reconfirm.mutate(
                { bookingId: booking.id, body: { result, channel } },
                {
                  onSuccess: () => {
                    toast.success(t("booking.reconfirmSaved"));
                    onClose();
                  },
                },
              )
            }
            disabled={reconfirm.isPending}
          >
            {reconfirm.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <RadioGroup value={result} onChange={(e) => setResult(e.target.value as typeof result)} aria-label={t("booking.reconfirmTitle", { name: booking.crew_team.team_name })}>
          <FormControlLabel value="reconfirmed" control={<Radio />} label={t("booking.reconfirmed")} />
          <FormControlLabel value="unavailable" control={<Radio />} label={t("booking.unavailable")} />
          <FormControlLabel value="unanswered" control={<Radio />} label={t("booking.unanswered")} />
        </RadioGroup>
        <ChannelField value={channel} onChange={setChannel} label={t("reply.channel")} />
        {result === "unavailable" && <Alert severity="warning">{t("booking.cancelIntro")}</Alert>}
        <ErrorBox error={reconfirm.error} />
      </Stack>
    </ResponsiveSheet>
  );
}

// ---------------------------------------------------------------- attendance
export function AttendanceDialog({ booking, jobId, onClose }: { booking: Booking; jobId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const record = useRecordAttendance(jobId);
  const [outcome, setOutcome] = useState<"completed" | "partially_fulfilled" | "no_show">("completed");
  const [actual, setActual] = useState<number | "">(booking.agreed_headcount);
  const [notes, setNotes] = useState("");

  const choose = (next: typeof outcome) => {
    setOutcome(next);
    if (next === "no_show") setActual(0);
    if (next === "completed") setActual(booking.agreed_headcount);
    if (next === "partially_fulfilled") setActual(Math.max(1, Math.floor(booking.agreed_headcount / 2)));
  };

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={t("booking.attendanceTitle")}
      busy={record.isPending}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={record.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={record.isPending}
            onClick={() =>
              record.mutate(
                { bookingId: booking.id, body: { outcome, actual_headcount: actual === "" ? 0 : actual, notes: notes.trim() } },
                {
                  onSuccess: () => {
                    toast.success(t("booking.attendanceSaved"));
                    onClose();
                  },
                },
              )
            }
          >
            {record.isPending ? t("common.saving") : t("booking.attendanceAction")}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">
          {booking.crew_team.team_name}: {t("booking.attendanceIntro")}
        </Typography>
        <RadioGroup value={outcome} onChange={(e) => choose(e.target.value as typeof outcome)} aria-label={t("booking.outcome")}>
          <FormControlLabel value="completed" control={<Radio />} label={t("booking.outcomeCompleted")} />
          <FormControlLabel value="partially_fulfilled" control={<Radio />} label={t("booking.outcomePartial")} />
          <FormControlLabel value="no_show" control={<Radio />} label={t("booking.outcomeNoShow")} />
        </RadioGroup>
        <QtyStepper id="a-actual" label={t("booking.actualHeadcount")} value={actual} onChange={(v) => setActual(outcome === "no_show" ? 0 : v)} min={outcome === "no_show" ? 0 : 0} max={500} hint={`/ ${booking.agreed_headcount}`} />
        <TextField label={t("booking.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 300 } }} />
        <ErrorBox error={record.error} />
      </Stack>
    </ResponsiveSheet>
  );
}

// ---------------------------------------------------------------- cancel with a reason (booking or whole job)
type CancelProps = {
  title: string;
  intro: string;
  actionLabel: string;
  keepLabel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  errorText: string;
  successText: string;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (reason: string, onDone: () => void) => void;
  onClose: () => void;
};

export function CancelReasonDialog(p: CancelProps) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const invalid = reason.trim().length < 2;

  return (
    <ResponsiveSheet
      open
      onClose={p.onClose}
      title={p.title}
      maxWidth="xs"
      busy={p.pending}
      actions={
        <>
          <Button color="inherit" onClick={p.onClose} disabled={p.pending}>
            {p.keepLabel}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={p.pending}
            onClick={() => {
              setTouched(true);
              if (invalid) return;
              p.onSubmit(reason.trim(), () => {
                toast.success(p.successText);
                p.onClose();
              });
            }}
          >
            {p.actionLabel}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">{p.intro}</Typography>
        <TextField
          autoFocus
          label={p.reasonLabel}
          placeholder={p.reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={touched && invalid}
          helperText={touched && invalid ? p.errorText : undefined}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 300 } }}
        />
        <ErrorBox error={p.error} />
      </Stack>
    </ResponsiveSheet>
  );
}

export function CancelBookingDialog({ booking, jobId, onClose }: { booking: Booking; jobId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const cancel = useCancelBooking(jobId);
  return (
    <CancelReasonDialog
      title={t("booking.cancelTitle", { name: booking.crew_team.team_name })}
      intro={t("booking.cancelIntro")}
      actionLabel={t("booking.cancelAction")}
      keepLabel={t("booking.keep")}
      reasonLabel={t("booking.cancelReasonLabel")}
      reasonPlaceholder={t("booking.cancelReasonPh")}
      errorText={t("booking.errReason")}
      successText={t("booking.cancelled")}
      pending={cancel.isPending}
      error={cancel.error}
      onSubmit={(reason, done) => cancel.mutate({ bookingId: booking.id, reason }, { onSuccess: done })}
      onClose={onClose}
    />
  );
}

// ---------------------------------------------------------------- record a crew's reply
export function RecordReplyDialog({ invitation, jobId, onClose }: { invitation: Invitation; jobId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const record = useRecordResponse(jobId);
  const [status, setStatus] = useState<RecordResponseBody["response_status"]>("interested");
  const [channel, setChannel] = useState<Channel>("phone");
  const [headcount, setHeadcount] = useState<number | "">(invitation.crew_team.team_size);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    record.mutate(
      {
        invitationId: invitation.id,
        body: {
          response_status: status,
          response_channel: channel,
          proposed_headcount: status === "interested" || status === "needs_discussion" ? (headcount === "" ? null : headcount) : null,
          available_date: date || null,
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(t("reply.saved"));
          onClose();
        },
      },
    );
  };

  const statuses: RecordResponseBody["response_status"][] = ["interested", "needs_discussion", "unavailable", "no_response"];

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={t("reply.recordTitle", { name: invitation.crew_team.team_name })}
      busy={record.isPending}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={record.isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" color="secondary" onClick={submit} disabled={record.isPending}>
            {record.isPending ? t("common.saving") : t("reply.save")}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">{t("reply.recordIntro")}</Typography>
        <RadioGroup value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label={t("reply.status")}>
          {statuses.map((s) => (
            <FormControlLabel key={s} value={s} control={<Radio />} label={t(`reply.status_${s}`)} />
          ))}
        </RadioGroup>
        {(status === "interested" || status === "needs_discussion") && (
          <>
            <QtyStepper id="r-headcount" label={t("reply.proposed")} value={headcount} onChange={setHeadcount} min={1} max={500} />
            <TextField type="date" label={t("reply.availableDate")} value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ htmlInput: { min: todayInput() }, inputLabel: { shrink: true } }} />
          </>
        )}
        <ChannelField value={channel} onChange={setChannel} label={t("reply.channel")} />
        <TextField label={t("reply.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 300 } }} />
        <ErrorBox error={record.error} />
      </Stack>
    </ResponsiveSheet>
  );
}
