import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useMe } from "@/api/hooks/account";
import { useCreateJob } from "@/api/hooks/jobs";
import type { JobCreateBody } from "@/api/types";
import { BottomBar } from "@/components/common/BottomBar";
import { Panel } from "@/components/common/Panel";
import { useToast } from "@/components/feedback/ToastProvider";
import { cropName } from "@/i18n/catalog";
import { useLanguage } from "@/i18n/useLanguage";
import { cropLook } from "@/lib/crops";
import { useFormat } from "@/lib/format";
import { useJobText } from "@/lib/jobText";
import { StepHead } from "./StepHead";
import { useWizard } from "./WizardContext";
import { validateDetails } from "./validation";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 1.5, py: 0.9, "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" } }}>
      <Typography color="text.secondary" variant="body2" sx={{ pt: 0.2 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere", lineHeight: 1.35 }} component="div">
        {children}
      </Typography>
    </Box>
  );
}

/** Step 5: one compact summary, an honest estimate, then create the job and go straight to the crew list. */
export function ReviewStep() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const f = useFormat();
  const text = useJobText();
  const { language } = useLanguage();
  const me = useMe();
  const create = useCreateJob();
  const { draft, reset } = useWizard();
  const d = draft.details;
  // After a successful create the draft is cleared; without this flag the guards below would bounce to /new.
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return null;
  if (!draft.cropId || !draft.cropName) return <Navigate to="/new" replace />;
  if (!draft.stage) return <Navigate to="/new/stage" replace />;
  if (draft.activityIds.length === 0) return <Navigate to="/new/activities" replace />;
  if (Object.keys(validateDetails(d, t)).length > 0) return <Navigate to="/new/details" replace />;

  const look = cropLook(draft.cropName);
  const wageLike = { wageType: d.wageType, amount: d.wage, acres: d.wageType === "per_acre" ? d.acres : null };
  const workers = Number(d.workers);
  const days = Number(d.days);
  const estimate = text.estimate(wageLike, workers, days);

  const submit = () => {
    const body: JobCreateBody = {
      activity_ids: draft.activityIds,
      required_workers: workers,
      start_date: d.startDate,
      duration_days: days,
      reporting_time: `${d.reportingTime}:00`,
      gender_preference: d.gender,
      max_distance_km: d.distance,
      experienced_only: d.experienced,
      wage_type: d.wageType,
      wage_amount: d.wage,
      acres: d.wageType === "per_acre" ? d.acres : null,
      facilities: d.facilities,
      ...(d.override ? { latitude: d.override.latitude, longitude: d.override.longitude } : {}),
    };
    create.mutate(body, {
      onSuccess: (job) => {
        setSubmitted(true);
        reset();
        toast.success(t("wizard.created"));
        navigate(`/jobs/${job.id}/crews`, { replace: true });
      },
      onError: (error) => toast.fromError(error),
    });
  };

  const fieldMessages = Object.entries(create.error?.fieldErrors ?? {}).map(([k, v]) => `${k}: ${v.join(" ")}`);

  return (
    <>
      <StepHead title={t("wizard.reviewTitle")} lede={t("wizard.reviewSub")} />

      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderLeft: `6px solid ${look.color}`, borderRadius: 3.5, px: 1.75, py: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", py: 0.5 }}>
          <span aria-hidden="true">{look.emoji}</span> {cropName(draft.cropName, language)} · {t(draft.stage === "pre_harvest" ? "wizard.pre" : "wizard.post")}
        </Typography>
        <Row label={t("wizard.summaryWork")}>{text.activities(draft.activityNames)}</Row>
        <Row label={t("wizard.summaryWhen")}>
          {t("wizard.startsOn", { date: f.date(d.startDate), days: t("common.days", { count: days }) })}, {t("wizard.reportAt", { time: f.time(`${d.reportingTime}:00`) })}
        </Row>
        <Row label={t("wizard.summaryWho")}>
          {t("common.workers", { count: workers })}, {text.gender(d.gender)}, {text.distance(d.distance)}
          {d.experienced && `, ${t("wizard.experiencedOnly")}`}
        </Row>
        <Row label={t("wizard.summaryPay")}>
          {text.pay(wageLike)}
          {d.facilities.length > 0 && ` · ${d.facilities.map(text.facility).join(", ")}`}
        </Row>
        <Row label={t("wizard.summaryWhere")}>{d.override ? t("wizard.locationGps") : (me.data?.village_name ?? "…")}</Row>
      </Box>

      <Panel sx={{ mt: 1.5, gridTemplateColumns: "1fr auto", alignItems: "center", bgcolor: (th) => `color-mix(in srgb, ${(th.vars ?? th).palette.secondary.main} 14%, ${(th.vars ?? th).palette.background.paper})` }}>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{t("wizard.estimate")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t("wizard.estimateNote")}
          </Typography>
        </Box>
        <Typography variant="h3" component="p">
          {f.money(estimate)}
        </Typography>
      </Panel>

      {create.isError && (
        <Alert severity="error" role="alert" sx={{ mt: 1.5 }} action={<Button color="inherit" size="small" onClick={() => navigate("/new/details")}>{t("wizard.editDetails")}</Button>}>
          {create.error.message}
          {fieldMessages.length > 1 && (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {fieldMessages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </Box>
          )}
        </Alert>
      )}

      <BottomBar hint={t("wizard.next")}>
        <Button variant="outlined" color="inherit" size="large" onClick={() => navigate("/new/details")} disabled={create.isPending} sx={{ flex: "0 0 auto !important" }}>
          {t("common.edit")}
        </Button>
        <Button variant="contained" color="secondary" size="large" onClick={submit} disabled={create.isPending}>
          {create.isPending ? t("wizard.creating") : t("wizard.findWorkers")}
        </Button>
      </BottomBar>
    </>
  );
}
