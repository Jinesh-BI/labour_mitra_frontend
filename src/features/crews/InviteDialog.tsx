import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import IosShareIcon from "@mui/icons-material/IosShareRounded";
import SendIcon from "@mui/icons-material/SendRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useInviteCrews } from "@/api/hooks/bookings";
import { useInvitationMessage } from "@/api/hooks/jobs";
import type { CrewPublic } from "@/api/types";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { useToast } from "@/components/feedback/ToastProvider";
import { useLanguage } from "@/i18n/useLanguage";

type Props = {
  open: boolean;
  jobId: string;
  crews: CrewPublic[];
  onClose: () => void;
  onViewJob: () => void;
};

// The API writes the message in English or Marathi only; Hindi users start on English and can switch.
type MessageLang = "en" | "mr";

/** "Send job request": record the invitations, then copy or share the text. A reply is not a booking. */
export function InviteDialog({ open, jobId, crews, onClose, onViewJob }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { language } = useLanguage();
  const [lang, setLang] = useState<MessageLang>(language === "mr" ? "mr" : "en");
  const [sent, setSent] = useState(false);
  const message = useInvitationMessage(jobId, lang, open);
  const invite = useInviteCrews(jobId);
  const text = message.data?.message ?? "";

  const send = () => {
    invite.mutate(
      crews.map((c) => c.id),
      {
        onSuccess: (list) => {
          setSent(true);
          toast.success(t("invite.sent", { count: list.length }));
        },
      },
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("invite.copied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const share = () => navigator.share({ text }).catch(() => undefined);

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={sent ? t("invite.sentTitle") : t("invite.title")}
      busy={invite.isPending}
      actions={
        sent ? (
          <Button variant="contained" onClick={onViewJob}>
            {t("invite.viewJob")}
          </Button>
        ) : (
          <>
            <Button color="inherit" onClick={onClose} disabled={invite.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="contained" color="secondary" size="large" startIcon={<SendIcon />} onClick={send} disabled={invite.isPending || crews.length === 0 || !text}>
              {invite.isPending ? t("invite.sending") : t("invite.send")}
            </Button>
          </>
        )
      }
    >
      <Stack spacing={2}>
        {sent ? (
          <Alert icon={<CheckCircleIcon />} severity="success">
            {t("invite.sentBody")}
          </Alert>
        ) : (
          <Typography color="text.secondary">{t("invite.sub")}</Typography>
        )}

        <Box>
          <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
            {t("invite.to")} ({crews.length})
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
            {crews.map((c) => (
              <Chip key={c.id} label={c.team_name} size="small" />
            ))}
          </Stack>
        </Box>

        <Box>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.75, gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle1">{t("invite.message")}</Typography>
            <ToggleButtonGroup exclusive size="small" value={lang} onChange={(_, v: MessageLang | null) => v && setLang(v)} aria-label={t("invite.messageLang")}>
              <ToggleButton value="en" sx={{ minHeight: 36 }}>
                English
              </ToggleButton>
              <ToggleButton value="mr" sx={{ minHeight: 36 }}>
                मराठी
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Box
            sx={{
              p: 1.75,
              borderRadius: 3.5,
              bgcolor: (th) => `color-mix(in srgb, #128C4A 9%, ${(th.vars ?? th).palette.background.paper})`,
              border: 1,
              borderColor: "divider",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              minHeight: 120,
              fontSize: "0.98rem",
            }}
            lang={lang}
            aria-live="polite"
          >
            {message.isPending ? (
              <>
                <Skeleton width="90%" />
                <Skeleton width="75%" />
                <Skeleton width="85%" />
                <Skeleton width="50%" />
              </>
            ) : message.isError ? (
              <Typography color="error">{message.error.message}</Typography>
            ) : (
              text
            )}
          </Box>
        </Box>

        {invite.isError && <Alert severity="error">{invite.error.message}</Alert>}

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy} disabled={!text}>
              {t("invite.copy")}
            </Button>
            {canShare && (
              <Button variant="outlined" startIcon={<IosShareIcon />} onClick={share} disabled={!text}>
                {t("invite.share")}
              </Button>
            )}
            {/* WhatsApp green is reserved for WhatsApp actions. */}
            <Button
              variant="contained"
              startIcon={<WhatsAppIcon />}
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!text}
              sx={{ bgcolor: "#128C4A", color: "#fff", "&:hover": { bgcolor: "#0E7139" } }}
            >
              {t("invite.whatsapp")}
            </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {t("invite.notBooking")}
        </Typography>
      </Stack>
    </ResponsiveSheet>
  );
}
