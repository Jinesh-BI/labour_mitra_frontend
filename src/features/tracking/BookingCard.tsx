import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useRequestReconfirmation } from "@/api/hooks/bookings";
import type { Booking } from "@/api/types";
import { Avatar } from "@/components/common/Avatar";
import { StatusChip } from "@/components/common/StatusChip";
import { useToast } from "@/components/feedback/ToastProvider";
import { todayInput, useFormat } from "@/lib/format";

export type BookingAction = "confirm" | "reconfirm" | "attendance" | "cancel";

type Props = { booking: Booking; jobId: string; onAction: (action: BookingAction, booking: Booking) => void };

/** One booked crew as a row: who, how many, when, status, and only the actions valid for that status. */
export function BookingCard({ booking: b, jobId, onAction }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const f = useFormat();
  const askReconfirm = useRequestReconfirmation(jobId);
  const started = b.agreed_date <= todayInput();
  const live = !["cancelled", "completed", "partially_fulfilled", "no_show"].includes(b.status);

  const ask = () =>
    askReconfirm.mutate(b.id, {
      onSuccess: () => toast.success(t("booking.reconfirmAsked")),
      onError: (e) => toast.fromError(e),
    });

  return (
    <Box sx={{ py: 1.25, opacity: b.status === "cancelled" ? 0.7 : 1 }}>
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
        <Avatar name={b.crew_team.team_name} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{b.crew_team.team_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("job.headcount", { count: b.agreed_headcount })} · {f.dayLabel(b.agreed_date)}
            {b.agreed_wage ? ` · ${f.money(b.agreed_wage)}` : ""}
          </Typography>
          {b.meeting_point && (
            <Typography variant="body2" color="text.secondary">
              {t("job.meeting", { point: b.meeting_point })}
            </Typography>
          )}
          {b.reconfirmation_status !== "not_requested" && b.status !== "cancelled" && (
            <Typography variant="body2" color="text.secondary">
              {t("job.reconfirm", { status: t(`booking.reconf_${b.reconfirmation_status}`) })}
            </Typography>
          )}
          {b.attendance && (
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t("job.attendance", { actual: b.attendance.actual_headcount, expected: b.attendance.expected_headcount })}
            </Typography>
          )}
          {b.status === "cancelled" && b.cancel_reason && (
            <Typography variant="body2" color="text.secondary">
              {t("job.cancelReason", { reason: b.cancel_reason })}
            </Typography>
          )}
        </Box>
        <StatusChip kind="booking" status={b.status} />
      </Box>

      {live && (
        <Box sx={{ display: "flex", gap: 1, mt: 1, ml: 6.5, flexWrap: "wrap" }}>
          {b.status === "pending_confirmation" && (
            <Button size="small" variant="contained" color="secondary" onClick={() => onAction("confirm", b)}>
              {t("booking.confirmAction")}
            </Button>
          )}
          {b.status === "confirmed" && !started && (
            <Button size="small" variant="contained" onClick={ask} disabled={askReconfirm.isPending}>
              {t("booking.askReconfirm")}
            </Button>
          )}
          {b.status === "reconfirmation_pending" && (
            <Button size="small" variant="contained" onClick={() => onAction("reconfirm", b)}>
              {t("booking.recordAnswer")}
            </Button>
          )}
          {(b.status === "confirmed" || b.status === "reconfirmed") && started && (
            <Button size="small" variant="contained" color="secondary" onClick={() => onAction("attendance", b)}>
              {t("booking.recordAttendance")}
            </Button>
          )}
          <Button size="small" color="error" onClick={() => onAction("cancel", b)}>
            {t("booking.cancelAction")}
          </Button>
        </Box>
      )}
    </Box>
  );
}
