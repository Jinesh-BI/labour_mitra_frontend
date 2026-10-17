import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import type { HarvestStage } from "@/api/types";
import { BottomBar } from "@/components/common/BottomBar";
import { Rise } from "@/components/common/Rise";
import { cropName } from "@/i18n/catalog";
import { useLanguage } from "@/i18n/useLanguage";
import { cropLook } from "@/lib/crops";
import { StepHead } from "./StepHead";
import { useWizard } from "./WizardContext";

/** Step 2: before or after harvest, as two compact rows. */
export function StageStep() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { draft, setStage } = useWizard();

  if (!draft.cropId || !draft.cropName) return <Navigate to="/new" replace />;
  const look = cropLook(draft.cropName);

  const options: { stage: HarvestStage; emoji: string; title: string; body: string }[] = [
    { stage: "pre_harvest", emoji: "🌱", title: t("wizard.pre"), body: t("wizard.preDesc") },
    { stage: "post_harvest", emoji: "📦", title: t("wizard.post"), body: t("wizard.postDesc") },
  ];

  return (
    <>
      <StepHead title={t("wizard.stageTitle")} lede={t("wizard.stageSub")} />
      <Typography sx={{ mb: 1.5, fontWeight: 700 }}>
        <span aria-hidden="true">{look.emoji}</span> {cropName(draft.cropName, language)}
      </Typography>
      {options.map((o, i) => (
        <Rise key={o.stage} index={i}>
          <Box
            component="button"
            type="button"
            aria-pressed={draft.stage === o.stage}
            onClick={() => {
              setStage(o.stage);
              navigate("/new/activities");
            }}
            sx={{
              all: "unset",
              boxSizing: "border-box",
              width: "100%",
              cursor: "pointer",
              display: "flex",
              gap: 1.75,
              alignItems: "center",
              p: 1.75,
              mb: 1.25,
              borderRadius: 4.5,
              bgcolor: "background.paper",
              border: 2,
              borderColor: draft.stage === o.stage ? look.color : "divider",
              transition: "transform .15s, border-color .15s",
              "&:active": { transform: "scale(.985)" },
              "&:focus-visible": { outline: "3px solid #F2B01E", outlineOffset: 2 },
            }}
          >
            <Box aria-hidden="true" sx={{ width: 52, height: 52, flex: "none", display: "grid", placeItems: "center", fontSize: 30, borderRadius: 3.5, bgcolor: (th) => `color-mix(in srgb, ${(th.vars ?? th).palette.primary.main} 14%, transparent)` }}>
              {o.emoji}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>{o.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {o.body}
              </Typography>
            </Box>
          </Box>
        </Rise>
      ))}
      <BottomBar>
        <Button variant="outlined" color="inherit" size="large" onClick={() => navigate("/new")}>
          {t("wizard.changeCrop")}
        </Button>
      </BottomBar>
    </>
  );
}
