import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCloneJob } from "@/api/hooks/jobs";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { useToast } from "@/components/feedback/ToastProvider";
import { addDays, todayInput } from "@/lib/format";

/** "Repeat job": the API has no edit, so clone with a new start date, then go straight to the crews. */
export function RepeatDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const clone = useCloneJob(jobId);
  const [date, setDate] = useState(addDays(todayInput(), 1));
  const invalid = !date || date < todayInput();

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={t("repeat.title")}
      maxWidth="xs"
      busy={clone.isPending}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={clone.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={clone.isPending || invalid}
            onClick={() =>
              clone.mutate(date, {
                onSuccess: (job) => {
                  toast.success(t("repeat.done"));
                  navigate(`/jobs/${job.id}/crews`);
                },
              })
            }
          >
            {clone.isPending ? t("repeat.creating") : t("repeat.action")}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">{t("repeat.intro")}</Typography>
        <TextField
          type="date"
          label={t("repeat.newDate")}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={invalid}
          helperText={invalid ? t("wizard.errDate") : undefined}
          slotProps={{ htmlInput: { min: todayInput() }, inputLabel: { shrink: true } }}
        />
        {clone.isError && <Alert severity="error">{clone.error.message}</Alert>}
      </Stack>
    </ResponsiveSheet>
  );
}
