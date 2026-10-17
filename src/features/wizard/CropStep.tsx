import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCrops } from "@/api/hooks/catalog";
import { BottomBar } from "@/components/common/BottomBar";
import { Panel } from "@/components/common/Panel";
import { Rise } from "@/components/common/Rise";
import { TilesSkeleton } from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/States";
import { cropName, pickName } from "@/i18n/catalog";
import { useLanguage } from "@/i18n/useLanguage";
import { cropLook } from "@/lib/crops";
import { StepHead } from "./StepHead";
import { useWizard } from "./WizardContext";

/** Step 1: crop tiles, two per row (prototype `.crop`), kept short so the page does not become one big card. */
export function CropStep() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const crops = useCrops();
  const { draft, hasProgress, setCrop, reset } = useWizard();
  const [picked, setPicked] = useState<string | null>(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  const choose = (id: string, name: string) => {
    setPicked(id);
    setCrop(id, name);
    window.setTimeout(() => navigate("/new/stage"), 160);
  };

  const showResume = hasProgress && draft.activityIds.length > 0 && !resumeDismissed;

  return (
    <>
      <StepHead title={t("wizard.cropTitle")} lede={t("wizard.cropSub")} />

      {showResume && draft.cropName && (
        <Panel sx={{ mb: 1.5, borderColor: "secondary.main", borderWidth: 2, gap: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>
            {t("wizard.resumeTitle")}{" "}
            <Typography component="span" color="text.secondary">
              {t("wizard.resumeBody", { crop: cropName(draft.cropName, language) })}
            </Typography>
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="contained" color="secondary" onClick={() => navigate(draft.stage ? "/new/activities" : "/new/stage")}>
              {t("wizard.resumeYes")}
            </Button>
            <Button
              size="small"
              color="inherit"
              onClick={() => {
                reset();
                setResumeDismissed(true);
              }}
            >
              {t("wizard.resumeNo")}
            </Button>
          </Box>
        </Panel>
      )}

      {crops.isPending && <TilesSkeleton count={3} />}
      {crops.isError && <ErrorState error={crops.error} onRetry={() => crops.refetch()} />}
      {crops.data && (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
          {crops.data.map((crop, i) => {
            const base = cropLook(crop.name);
            const look = { emoji: crop.emoji || base.emoji, color: crop.color || base.color };
            const selected = picked === crop.id;
            const main = pickName(crop, language, "crop");
            const alt = pickName(crop, language === "en" ? "mr" : "en", "crop");
            return (
              <Rise key={crop.id} index={i}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => choose(crop.id, crop.name)}
                  aria-pressed={selected}
                  sx={{
                    all: "unset",
                    boxSizing: "border-box",
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    minHeight: 112,
                    cursor: "pointer",
                    borderRadius: 5.5,
                    p: 1.75,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    color: "#fff",
                    bgcolor: look.color,
                    boxShadow: selected ? "0 0 0 4px #F2B01E" : "none",
                    transition: "transform .18s, box-shadow .18s",
                    "&::after": { content: '""', position: "absolute", right: -28, top: -28, width: 112, height: 112, borderRadius: "50%", bgcolor: "rgba(255,255,255,.12)" },
                    "&:active": { transform: "scale(.96)" },
                    "&:focus-visible": { outline: "4px solid #F2B01E", outlineOffset: 2 },
                  }}
                >
                  <Typography aria-hidden="true" sx={{ position: "absolute", top: 8, right: 12, fontSize: 52, lineHeight: 1, zIndex: 1, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.25))" }}>
                    {look.emoji}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.1, position: "relative", zIndex: 1 }}>{main}</Typography>
                  {alt !== main && (
                    <Typography lang={language === "en" ? "mr" : "en"} sx={{ opacity: 0.9, position: "relative", zIndex: 1, fontSize: "0.95rem" }}>
                      {alt}
                    </Typography>
                  )}
                </Box>
              </Rise>
            );
          })}
        </Box>
      )}
      <BottomBar>
        <Button variant="outlined" color="inherit" size="large" onClick={() => navigate("/")}>
          {t("common.back")}
        </Button>
      </BottomBar>
    </>
  );
}
