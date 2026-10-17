import MyLocationIcon from "@mui/icons-material/MyLocationRounded";
import PlaceIcon from "@mui/icons-material/PlaceRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useMe } from "@/api/hooks/account";
import { BottomBar } from "@/components/common/BottomBar";
import { FieldLabel, Panel } from "@/components/common/Panel";
import { QtyStepper } from "@/components/common/QtyStepper";
import { Seg } from "@/components/common/Seg";
import { useToast } from "@/components/feedback/ToastProvider";
import { addDays, todayInput } from "@/lib/format";
import { getPosition } from "@/lib/geo";
import { StepHead } from "./StepHead";
import { useWizard, type Distance, type Facility, type GenderPref, type WageType } from "./WizardContext";
import { validateDetails, type DetailErrors } from "./validation";

const HOURS = [6, 7, 8, 9];
const FACILITIES: { key: Facility; emoji: string }[] = [
  { key: "tea", emoji: "☕" },
  { key: "lunch", emoji: "🍱" },
  { key: "transport", emoji: "🚜" },
  { key: "stay", emoji: "🏠" },
];

/** Step 4: when, who, how much, grouped into three plain panels like the prototype. Validation mirrors the backend. */
export function DetailsStep() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const me = useMe();
  const { draft, setDetails } = useWizard();
  const [errors, setErrors] = useState<DetailErrors>({});
  const [locating, setLocating] = useState(false);
  const [otherTime, setOtherTime] = useState(false);
  const d = draft.details;

  if (!draft.cropId) return <Navigate to="/new" replace />;
  if (!draft.stage) return <Navigate to="/new/stage" replace />;
  if (draft.activityIds.length === 0) return <Navigate to="/new/activities" replace />;

  const today = todayInput();
  const hour = (() => {
    const [h, m] = d.reportingTime.split(":").map(Number);
    return m === 0 && HOURS.includes(h) ? h : -1;
  })();
  const customTime = otherTime || hour === -1;

  const set = <K extends keyof typeof d>(key: K, value: (typeof d)[K]) => {
    setDetails({ [key]: value } as Partial<typeof d>);
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const useHere = async () => {
    setLocating(true);
    try {
      const pos = await getPosition();
      setDetails({ override: { latitude: pos.latitude, longitude: pos.longitude } });
    } catch {
      toast.info(t("wizard.locationDenied"));
    } finally {
      setLocating(false);
    }
  };

  const next = () => {
    const found = validateDetails(d, t);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(t("errors.fixFields"));
      const firstId = (["startDate", "workers", "days", "wage", "acres"] as const).find((k) => found[k]);
      if (firstId) window.setTimeout(() => document.getElementById(`f-${firstId}`)?.focus(), 0);
      return;
    }
    navigate("/new/review");
  };

  const wageHint = d.wageType === "per_day" ? t("wizard.perDayHint") : d.wageType === "per_acre" ? t("wizard.perAcreHint") : t("wizard.fixedHint");

  return (
    <>
      <StepHead title={t("wizard.detailsTitle")} lede={t("wizard.detailsSub")} />

      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Panel>
          <Box>
            <FieldLabel htmlFor="f-startDate">{t("wizard.startDate")}</FieldLabel>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <TextField
                id="f-startDate"
                type="date"
                value={d.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                error={!!errors.startDate}
                helperText={errors.startDate}
                slotProps={{ htmlInput: { min: today, "aria-label": t("wizard.startDate") } }}
                sx={{ flex: 1 }}
              />
              <Chip label={t("common.today")} clickable color={d.startDate === today ? "primary" : "default"} variant={d.startDate === today ? "filled" : "outlined"} onClick={() => set("startDate", today)} sx={{ mt: 1.25 }} />
              <Chip label={t("common.tomorrow")} clickable color={d.startDate === addDays(today, 1) ? "primary" : "default"} variant={d.startDate === addDays(today, 1) ? "filled" : "outlined"} onClick={() => set("startDate", addDays(today, 1))} sx={{ mt: 1.25 }} />
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <QtyStepper id="f-days" label={t("wizard.daysOfWork")} value={d.days} onChange={(v) => set("days", v)} min={1} max={60} error={errors.days} />
            <QtyStepper id="f-workers" label={t("wizard.workersNeeded")} value={d.workers} onChange={(v) => set("workers", v)} min={1} max={500} step={d.workers !== "" && d.workers >= 20 ? 5 : 1} error={errors.workers} />
          </Box>
          <Box>
            <FieldLabel id="reporting-label">{t("wizard.reporting")}</FieldLabel>
            <Seg
              label={t("wizard.reporting")}
              value={customTime ? -1 : hour}
              onChange={(v) => {
                if (v === -1) setOtherTime(true);
                else {
                  setOtherTime(false);
                  set("reportingTime", `${String(v).padStart(2, "0")}:00`);
                }
              }}
              options={[...HOURS.map((h) => ({ value: h, label: t("wizard.reportingMorning", { time: `${h}:00` }) })), { value: -1, label: t("wizard.reportingCustom") }]}
            />
            {customTime && (
              <TextField type="time" value={d.reportingTime} onChange={(e) => e.target.value && set("reportingTime", e.target.value)} sx={{ mt: 1, maxWidth: 200 }} slotProps={{ htmlInput: { "aria-label": t("wizard.reportingCustom") } }} />
            )}
          </Box>
        </Panel>

        <Panel>
          <Box>
            <FieldLabel>{t("wizard.genderTitle")}</FieldLabel>
            <Seg<GenderPref>
              label={t("wizard.genderTitle")}
              value={d.gender}
              onChange={(v) => set("gender", v)}
              options={[
                { value: "any", label: t("wizard.anyone") },
                { value: "men", label: t("wizard.men") },
                { value: "women", label: t("wizard.women") },
              ]}
            />
          </Box>
          <Box>
            <FieldLabel>{t("wizard.distanceTitle")}</FieldLabel>
            <Seg<number>
              label={t("wizard.distanceTitle")}
              value={d.distance === null ? 0 : d.distance}
              onChange={(v) => set("distance", (v === 0 ? null : v) as Distance)}
              options={[
                { value: 10, label: t("common.km", { count: 10 }) },
                { value: 25, label: t("common.km", { count: 25 }) },
                { value: 50, label: t("common.km", { count: 50 }) },
                { value: 0, label: t("common.any") },
              ]}
            />
          </Box>
          <Box>
            <FieldLabel>{t("wizard.experienceTitle")}</FieldLabel>
            <Seg<boolean>
              label={t("wizard.experienceTitle")}
              value={d.experienced}
              onChange={(v) => set("experienced", v)}
              options={[
                { value: false, label: t("wizard.anyone") },
                { value: true, label: t("wizard.experiencedOnly") },
              ]}
            />
          </Box>
        </Panel>

        <Panel>
          <Box>
            <FieldLabel>{t("wizard.payTitle")}</FieldLabel>
            <Seg<WageType>
              label={t("wizard.payTitle")}
              value={d.wageType}
              onChange={(v) => set("wageType", v)}
              options={[
                { value: "per_day", label: t("wizard.perDay") },
                { value: "per_acre", label: t("wizard.perAcre") },
                { value: "fixed", label: t("wizard.fixed") },
              ]}
            />
          </Box>
          <TextField
            id="f-wage"
            label={t("wizard.amount")}
            placeholder={t("wizard.amountPh")}
            value={d.wage}
            onChange={(e) => set("wage", e.target.value.replace(/[^\d.]/g, "").slice(0, 9))}
            error={!!errors.wage}
            helperText={errors.wage ?? wageHint}
            slotProps={{ htmlInput: { inputMode: "decimal" }, input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
          />
          {d.wageType === "per_acre" && (
            <TextField
              id="f-acres"
              label={t("wizard.acres")}
              placeholder={t("wizard.acresPh")}
              value={d.acres}
              onChange={(e) => set("acres", e.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
              error={!!errors.acres}
              helperText={errors.acres}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
          )}
          <Box>
            <FieldLabel>{t("wizard.facilitiesTitle")}</FieldLabel>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} role="group" aria-label={t("wizard.facilitiesTitle")}>
              {FACILITIES.map((fa) => {
                const on = d.facilities.includes(fa.key);
                return (
                  <Chip
                    key={fa.key}
                    clickable
                    role="checkbox"
                    aria-checked={on}
                    color={on ? "primary" : "default"}
                    variant={on ? "filled" : "outlined"}
                    label={`${fa.emoji} ${t(`wizard.${fa.key}`)}`}
                    onClick={() => set("facilities", on ? d.facilities.filter((x) => x !== fa.key) : [...d.facilities, fa.key])}
                    sx={{ minHeight: 40 }}
                  />
                );
              })}
            </Box>
          </Box>
        </Panel>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PlaceIcon sx={{ fontSize: 18 }} />
            {d.override ? t("wizard.locationGps") : t("wizard.detailsPlace", { village: me.data?.village_name || "…" })}
          </Typography>
          {d.override ? (
            <Button size="small" onClick={() => setDetails({ override: null })}>
              {t("wizard.locationReset")}
            </Button>
          ) : (
            <Button size="small" startIcon={<MyLocationIcon />} onClick={useHere} disabled={locating}>
              {t("auth.useGps")}
            </Button>
          )}
        </Box>
      </Box>

      <BottomBar>
        <Button variant="contained" color="secondary" size="large" onClick={next}>
          {t("wizard.review")}
        </Button>
      </BottomBar>
    </>
  );
}
