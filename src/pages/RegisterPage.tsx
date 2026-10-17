import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useRegister, useSendOtp } from "@/api/hooks/account";
import type { ApiError } from "@/api/errors";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/components/feedback/ToastProvider";
import { AuthHero } from "@/features/auth/AuthHero";
import { BottomBar } from "@/components/common/BottomBar";
import { emptyLocation, LocationField, type LocationValue } from "@/features/auth/LocationField";
import { OtpStep } from "@/features/auth/OtpStep";
import { useLanguage } from "@/i18n/useLanguage";
import { normalizeMobile } from "@/lib/validation";

type Errors = { name?: string; mobile?: string; location?: string };

/** Sign-up: name + mobile + location, then OTP. The OTP is checked by the backend's external service. */
export function RegisterPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn } = useAuth();
  const { language } = useLanguage();
  const sendOtp = useSendOtp();
  const register = useRegister();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [place, setPlace] = useState<LocationValue>(emptyLocation);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (isAuthenticated) return <Navigate to={from} replace />;

  const digits = normalizeMobile(mobile);
  const hasLocation = place.villageId !== null || place.latitude !== undefined;

  const validate = (): boolean => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = t("auth.errName");
    if (!digits) next.mobile = t("auth.errMobile");
    if (!hasLocation) next.location = t("auth.errLocation");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const requestOtp = (e?: FormEvent) => {
    e?.preventDefault();
    setServerError(null);
    if (!validate() || !digits) return;
    sendOtp.mutate(
      { mobile: digits, purpose: "register" },
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
    register.mutate(
      {
        mobile: digits,
        otp,
        full_name: name.trim(),
        preferred_language: language,
        village_id: place.villageId,
        ...(place.latitude !== undefined && place.longitude !== undefined
          ? { latitude: place.latitude, longitude: place.longitude, location_accuracy_m: place.accuracy }
          : {}),
        location_source: place.latitude !== undefined ? "gps" : "village",
      },
      {
        onSuccess: (session) => {
          signIn(session);
          toast.success(t("auth.welcome", { name: name.trim().split(" ")[0] }));
          navigate(from, { replace: true });
        },
        onError: (error) => {
          setServerError(error);
          const first = Object.values(error.fieldErrors)[0]?.[0];
          if (first && !error.fieldErrors.otp) toast.error(first);
        },
      },
    );
  };

  return (
    <>
      <AuthHero />
      {step === "details" ? (
        <>
        <Stack component="form" id="reg-form" onSubmit={requestOtp} spacing={2} noValidate>
          <TextField
            id="name"
            label={t("auth.name")}
            placeholder={t("auth.namePh")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            autoComplete="name"
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
          <TextField
            id="mobile"
            label={t("auth.mobile")}
            placeholder={t("auth.mobilePh")}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, ""))}
            error={!!errors.mobile}
            helperText={errors.mobile}
            autoComplete="tel-national"
            slotProps={{
              htmlInput: { inputMode: "tel", maxLength: 16 },
              input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
            }}
          />
          <Stack spacing={1}>
            <Typography variant="subtitle1">{t("auth.location")}</Typography>
            <LocationField value={place} onChange={setPlace} error={errors.location} />
          </Stack>

          {serverError && (
            <Alert
              severity="warning"
              action={
                serverError.isConflict && (
                  <Button color="inherit" size="small" component={RouterLink} to="/login">
                    {t("auth.loginInstead")}
                  </Button>
                )
              }
            >
              {serverError.message}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            {t("auth.privacy")}
          </Typography>
          <Typography sx={{ textAlign: "center" }}>
            {t("auth.haveAccount")}{" "}
            <Button component={RouterLink} to="/login" state={location.state} size="small">
              {t("auth.logIn")}
            </Button>
          </Typography>
        </Stack>
        <BottomBar>
          <Button type="submit" form="reg-form" variant="contained" color="secondary" size="large" disabled={sendOtp.isPending}>
            {sendOtp.isPending ? t("auth.sendingOtp") : t("auth.sendOtp")}
          </Button>
        </BottomBar>
        </>
      ) : (
        <OtpStep
          mobileDisplay={`+91 ${digits}`}
          submitting={register.isPending}
          resending={sendOtp.isPending}
          error={serverError}
          onSubmit={verify}
          onResend={() => digits && sendOtp.mutate({ mobile: digits, purpose: "register" }, { onSuccess: () => toast.info(t("auth.otpToast", { mobile: `+91 ${digits}` })), onError: (e) => toast.fromError(e) })}
          onChangeNumber={() => {
            setStep("details");
            setServerError(null);
          }}
        />
      )}
    </>
  );
}
