import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ApiError } from "@/api/errors";
import { BottomBar } from "@/components/common/BottomBar";
import { useCountdown } from "@/hooks/useCountdown";

type Props = {
  mobileDisplay: string;
  submitting: boolean;
  resending: boolean;
  error: ApiError | null;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
};

/** One field that accepts a 4 to 8 digit code (the OTP service decides the length); works with SMS autofill. */
export function OtpStep({ mobileDisplay, submitting, resending, error, onSubmit, onResend, onChangeNumber }: Props) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [touched, setTouched] = useState(false);
  const { left, restart } = useCountdown(30);

  useEffect(restart, [restart]);

  const invalid = otp.length < 4 || otp.length > 8;
  const message = touched && invalid ? t("auth.errOtp") : (error?.fieldErrors.otp?.[0] ?? (error ? error.message : undefined));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!invalid) onSubmit(otp);
  };

  return (
    <Stack component="form" id="otp-form" onSubmit={submit} spacing={2} noValidate>
      <div aria-live="polite">
        <Typography color="text.secondary">{t("auth.otpSent", { mobile: mobileDisplay })}</Typography>
      </div>
      <TextField
        id="otp"
        label={t("auth.otp")}
        placeholder={t("auth.otpPh")}
        value={otp}
        autoFocus
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
        error={!!message}
        helperText={message}
        slotProps={{
          htmlInput: {
            inputMode: "numeric",
            autoComplete: "one-time-code",
            maxLength: 8,
            "aria-describedby": "otp-helper-text",
            style: { letterSpacing: "0.5em", fontWeight: 800, fontSize: "1.6rem", textAlign: "center" },
          },
        }}
      />
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Button
          size="small"
          color="inherit"
          disabled={left > 0 || resending}
          onClick={() => {
            onResend();
            restart();
          }}
        >
          {left > 0 ? t("auth.resendIn", { seconds: left }) : t("auth.resend")}
        </Button>
        <Button size="small" color="inherit" onClick={onChangeNumber}>
          {t("auth.changeNumber")}
        </Button>
      </Stack>
      <BottomBar>
        <Button type="submit" form="otp-form" variant="contained" color="secondary" size="large" disabled={submitting}>
          {submitting ? t("auth.verifying") : t("auth.verify")}
        </Button>
      </BottomBar>
    </Stack>
  );
}
