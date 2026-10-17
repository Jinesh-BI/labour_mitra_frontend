import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveSheet } from "./ResponsiveSheet";

type Props = {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, destructive, busy, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      busy={busy}
      actions={
        <>
          <Button onClick={onClose} disabled={busy} color="inherit">
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button variant="contained" color={destructive ? "error" : "primary"} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary">{body}</Typography>
    </ResponsiveSheet>
  );
}
