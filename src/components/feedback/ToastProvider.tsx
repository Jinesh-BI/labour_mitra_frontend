import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorIcon from "@mui/icons-material/ErrorRounded";
import InfoIcon from "@mui/icons-material/InfoRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import Snackbar from "@mui/material/Snackbar";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toApiError } from "@/api/errors";

type Severity = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };
type ToastItem = { key: number; message: string; severity: Severity; action?: ToastAction };

type ToastApi = {
  success: (message: string, action?: ToastAction) => void;
  info: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  /** Shows the server's user-readable message for a failed call. */
  fromError: (error: unknown, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** One toast at a time (queued), announced to screen readers, sitting above the bottom navigation on phones. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [open, setOpen] = useState(false);
  const current = queue[0];

  const push = useCallback((severity: Severity, message: string, action?: ToastAction) => {
    setQueue((q) => [...q, { key: Date.now() + Math.random(), message, severity, action }]);
    setOpen(true);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, a) => push("success", m, a),
      info: (m, a) => push("info", m, a),
      error: (m, a) => push("error", m, a),
      fromError: (e, a) => push("error", toApiError(e).message || t("errors.generic"), a),
    }),
    [push, t],
  );

  const handleClose = (_: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const icons = { success: <CheckCircleIcon />, error: <ErrorIcon />, info: <InfoIcon /> };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        key={current?.key}
        open={open && !!current}
        autoHideDuration={current?.severity === "error" ? 7000 : 4000}
        onClose={handleClose}
        slots={{ transition: Slide }}
        slotProps={{ transition: { onExited: () => setQueue((q) => q.slice(1)) } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: "calc(84px + env(safe-area-inset-bottom))", md: 24 }, maxWidth: "calc(100% - 24px)" }}
      >
        <Alert
          variant="filled"
          severity={current?.severity ?? "info"}
          icon={current ? icons[current.severity] : undefined}
          role={current?.severity === "error" ? "alert" : "status"}
          sx={{ width: "100%", alignItems: "center", fontWeight: 600, borderRadius: 3, boxShadow: 6 }}
          action={
            current?.action ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  current.action?.onClick();
                  setOpen(false);
                }}
              >
                {current.action.label}
              </Button>
            ) : undefined
          }
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
