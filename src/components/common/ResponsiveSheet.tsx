import CloseIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { forwardRef, type ReactElement, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";
import type { TransitionProps } from "@mui/material/transitions";

const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Sticky footer, usually the primary action. */
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md";
  /** Block closing by backdrop/escape while something is being saved. */
  busy?: boolean;
};

/** A bottom sheet on phones (thumb reach, slides up) and a centred dialog on larger screens. */
export function ResponsiveSheet({ open, onClose, title, children, actions, maxWidth = "sm", busy }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      scroll="paper"
      slots={isPhone ? { transition: SlideUp } : undefined}
      aria-labelledby="sheet-title"
      slotProps={{
        paper: {
          sx: isPhone
            ? { position: "fixed", bottom: 0, m: 0, width: "100%", maxHeight: "92dvh", borderRadius: "22px 22px 0 0" }
            : undefined,
        },
      }}
    >
      {isPhone && <Box aria-hidden="true" sx={{ width: 42, height: 5, borderRadius: 3, bgcolor: "divider", mx: "auto", mt: 1.25 }} />}
      <Stack direction="row" sx={{ alignItems: "center", pl: 3, pr: 1, pt: 1.5, pb: 0.5, gap: 1 }}>
        <Typography id="sheet-title" variant="h3" component="h2" sx={{ flex: 1, overflowWrap: "anywhere" }}>
          {title}
        </Typography>
        <IconButton aria-label={t("common.close")} onClick={onClose} disabled={busy}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      {actions && (
        <DialogActions sx={{ px: 3, pb: "calc(16px + env(safe-area-inset-bottom))", pt: 1, gap: 1, flexWrap: "wrap" }}>{actions}</DialogActions>
      )}
    </Dialog>
  );
}
