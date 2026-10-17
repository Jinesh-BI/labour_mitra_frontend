import CheckIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useActivities } from "@/api/hooks/catalog";
import { BottomBar } from "@/components/common/BottomBar";
import { ListSkeleton } from "@/components/common/Skeletons";
import { EmptyState, ErrorState } from "@/components/common/States";
import { cropName, pickName } from "@/i18n/catalog";
import { useLanguage } from "@/i18n/useLanguage";
import { cropLook } from "@/lib/crops";
import { useFormat } from "@/lib/format";
import { StepHead } from "./StepHead";
import { useWizard } from "./WizardContext";

/** Step 3: one or more activities as slim rows (prototype `.act`); all share the chosen crop and stage. */
export function ActivitiesStep() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const f = useFormat();
  const navigate = useNavigate();
  const { draft, setActivities } = useWizard();
  const activities = useActivities(draft.cropId ?? undefined, draft.stage ?? undefined);

  if (!draft.cropId || !draft.cropName) return <Navigate to="/new" replace />;
  if (!draft.stage) return <Navigate to="/new/stage" replace />;

  const look = cropLook(draft.cropName);
  const list = activities.data ?? [];
  const selected = new Set(draft.activityIds);
  const count = activities.data ? list.filter((a) => selected.has(a.id)).length : 0;

  const apply = (ids: Set<string>) =>
    setActivities(
      [...ids],
      list.filter((a) => ids.has(a.id)).map((a) => a.name),
    );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  return (
    <>
      <StepHead title={t("wizard.actTitle")} lede={t("wizard.actSub")} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <Typography sx={{ fontWeight: 700, flex: 1 }}>
          <span aria-hidden="true">{look.emoji}</span> {cropName(draft.cropName, language)} · {t(draft.stage === "pre_harvest" ? "wizard.pre" : "wizard.post")}
        </Typography>
        {list.length > 1 && (
          <Button size="small" onClick={() => apply(count === list.length ? new Set() : new Set(list.map((a) => a.id)))}>
            {count === list.length ? t("wizard.clearAll") : t("wizard.selectAll")}
          </Button>
        )}
      </Box>

      {activities.isPending && <ListSkeleton count={4} lines={1} />}
      {activities.isError && <ErrorState error={activities.error} onRetry={() => activities.refetch()} />}
      {activities.data && list.length === 0 && <EmptyState emoji="🛠️" title={t("wizard.noActivities")} />}

      <Box role="group" aria-label={t("wizard.actTitle")}>
        {list.map((a) => {
          const on = selected.has(a.id);
          return (
            <Box
              key={a.id}
              component="button"
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(a.id)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                width: "100%",
                minHeight: 56,
                mb: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.75,
                py: 1.25,
                borderRadius: 3.5,
                border: 2,
                borderColor: on ? look.color : "divider",
                bgcolor: on ? "action.hover" : "background.paper",
                transition: "border-color .15s, background-color .15s",
                "&:active": { transform: "scale(.985)" },
                "&:focus-visible": { outline: "3px solid #F2B01E", outlineOffset: 2 },
              }}
            >
              <Box
                aria-hidden="true"
                sx={{ flex: "none", width: 26, height: 26, borderRadius: 1.75, border: 2, borderColor: on ? look.color : "text.secondary", bgcolor: on ? look.color : "transparent", color: "#fff", display: "grid", placeItems: "center", transition: "all .15s" }}
              >
                {on && <CheckIcon sx={{ fontSize: 18, animation: "lm-pop .25s both" }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.25 }}>{pickName(a, language, "activity")}</Typography>
                {a.typical_wage_min && a.typical_wage_max && (
                  <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600 }}>
                    {t("wizard.typicalWage", { min: f.money(a.typical_wage_min), max: f.money(a.typical_wage_max) })}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <BottomBar>
        <Button variant="contained" color="secondary" size="large" disabled={count === 0} onClick={() => navigate("/new/details")}>
          {count === 0 ? t("wizard.actPickOne") : t("wizard.actContinue", { count })}
        </Button>
      </BottomBar>
    </>
  );
}
