import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateBooking } from "@/api/hooks/bookings";
import type { Booking, CrewPublic } from "@/api/types";
import { QtyStepper } from "@/components/common/QtyStepper";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { useToast } from "@/components/feedback/ToastProvider";

type Props = {
  open: boolean;
  jobId: string;
  crew: CrewPublic;
  /** What the crew can offer, already capped at the headcount the job still needs. */
  max: number;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
};

/** Booking holds the crew for the job (pending confirmation); the exact terms are confirmed next. */
export function BookDialog({ open, jobId, crew, max, onClose, onBooked }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const book = useCreateBooking(jobId);
  const ceiling = Math.max(1, max);
  const [headcount, setHeadcount] = useState<number | "">(ceiling);

  const submit = () => {
    const count = headcount === "" ? ceiling : headcount;
    book.mutate(
      { crew_team_id: crew.id, headcount: count },
      {
        onSuccess: (booking) => {
          toast.success(t("booking.booked", { name: crew.team_name }));
          onBooked(booking);
        },
      },
    );
  };

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={t("booking.bookTitle", { name: crew.team_name })}
      maxWidth="xs"
      busy={book.isPending}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={book.isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" color="secondary" size="large" onClick={submit} disabled={book.isPending}>
            {book.isPending ? t("booking.booking") : t("booking.bookAction")}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t("booking.bookIntro")}
      </Typography>
      <QtyStepper id="book-headcount" label={t("booking.headcount")} value={headcount} onChange={setHeadcount} min={1} max={ceiling} hint={t("booking.headcountHint", { max: ceiling })} />
      {book.isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {book.error.message}
        </Alert>
      )}
    </ResponsiveSheet>
  );
}
