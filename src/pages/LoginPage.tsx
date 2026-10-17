import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLogin, useSendOtp } from "@/api/hooks/account";
import type { ApiError } from "@/api/errors";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/components/feedback/ToastProvider";
import { AuthHero } from "@/features/auth/AuthHero";
import { BottomBar } from "@/components/common/BottomBar";
import { OtpStep } from "@/features/auth/OtpStep";
import { normalizeMobile } from "@/lib/validation";

export function LoginPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn } = useAuth();
  const sendOtp = useSendOtp();
  const login = useLogin();

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState<string>();
  const [serverError, setServerError] = useState<ApiError | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (isAuthenticated) return <Navigate to={from} replace />;

  const digits = normalizeMobile(mobile);

  const requestOtp = (e?: FormEvent) => {
    e?.preventDefault();
    setServerError(null);
    if (!digits) {
      setMobileError(t("auth.errMobile"));
      return;
    }
    setMobileError(undefined);
    sendOtp.mutate(
      { mobile: digits, purpose: "login" },
      {
        onSuccess: () => {
          toast.success(t("auth.otpToast", { mobile: `+91 ${digits}` }));
          setStep("otp");
        },
        onError: (error) => setServerError(error),
      },
    );
  };

  const verify = (otp: string) => {
    if (!digits) return;
    setServerError(null);
    login.mutate(
      { mobile: digits, otp },
      {
        onSuccess: (session) => {
          signIn(session);
          toast.success(t("auth.welcomeBack"));
          navigate(from, { replace: true });
        },
        onError: setServerError,
      },
    );
  };

  return (
    <>
      <AuthHero />
      {step === "mobile" ? (
        <>
        <Stack component="form" id="login-form" onSubmit={requestOtp} spacing={2} noValidate>
          <TextField
            id="mobile"
            label={t("auth.mobile")}
            placeholder={t("auth.mobilePh")}
            value={mobile}
            autoFocus
            onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, ""))}
            error={!!mobileError}
            helperText={mobileError}
            autoComplete="tel-national"
            slotProps={{
              htmlInput: { inputMode: "tel", maxLength: 16 },
              input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
            }}
          />
          {serverError && (
            <Alert
              severity="warning"
              action={
                serverError.isNotFound && (
                  <Button color="inherit" size="small" component={RouterLink} to="/register" state={location.state}>
                    {t("auth.registerInstead")}
                  </Button>
                )
              }
            >
              {serverError.message}
            </Alert>
          )}
          <Typography sx={{ textAlign: "center" }}>
            {t("auth.noAccount")}{" "}
            <Button component={RouterLink} to="/register" state={location.state} size="small">
              {t("auth.signUp")}
            </Button>
          </Typography>
        </Stack>
        <BottomBar>
          <Button type="submit" form="login-form" variant="contained" color="secondary" size="large" disabled={sendOtp.isPending}>
            {sendOtp.isPending ? t("auth.sendingOtp") : t("auth.sendOtp")}
          </Button>
        </BottomBar>
        </>
      ) : (
        <OtpStep
          mobileDisplay={`+91 ${digits}`}
          submitting={login.isPending}
          resending={sendOtp.isPending}
          error={serverError}
          onSubmit={verify}
          onResend={() => digits && sendOtp.mutate({ mobile: digits, purpose: "login" }, { onSuccess: () => toast.info(t("auth.otpToast", { mobile: `+91 ${digits}` })), onError: (e) => toast.fromError(e) })}
          onChangeNumber={() => {
            setStep("mobile");
            setServerError(null);
          }}
        />
      )}
    </>
  );
}
