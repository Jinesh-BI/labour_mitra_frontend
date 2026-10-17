import ArrowForwardIcon from "@mui/icons-material/ArrowForwardRounded";
import PlaceIcon from "@mui/icons-material/PlaceRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { useMe } from "@/api/hooks/account";
import { useJobs } from "@/api/hooks/jobs";
import { useAuth } from "@/auth/AuthContext";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { Rise } from "@/components/common/Rise";
import { ListSkeleton } from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/States";
import { useToast } from "@/components/feedback/ToastProvider";
import { JobCard } from "@/features/jobs/JobCard";
import { readJson, writeJson } from "@/lib/safeStorage";
import { isJobOpen } from "@/lib/status";

type Soon = "construction" | "shop";
const NOTIFY_KEY = "lm_notify_sectors";

const tileSx = (color: string) => ({
  all: "unset" as const,
  boxSizing: "border-box" as const,
  position: "relative" as const,
  overflow: "hidden" as const,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  width: "100%",
  minHeight: 84,
  p: 1.75,
  borderRadius: 5,
  color: "#fff",
  bgcolor: color,
  cursor: "pointer",
  textDecoration: "none",
  transition: "transform .15s",
  "&::after": { content: '""', position: "absolute", right: -26, top: -26, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(255,255,255,.12)" },
  "&:active": { transform: "scale(.985)" },
  "&:focus-visible": { outline: "4px solid #F2B01E", outlineOffset: 2 },
});

function Tile({ emoji, title, body, color, soon, ...rest }: { emoji: string; title: string; body: string; color: string; soon?: string } & Record<string, unknown>) {
  return (
    <Box {...rest} sx={tileSx(color)}>
      <Typography aria-hidden="true" sx={{ fontSize: 40, lineHeight: 1, zIndex: 1, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.25))" }}>
        {emoji}
      </Typography>
      <Box sx={{ flex: 1, zIndex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.15 }}>
          {title}{" "}
          {soon && <Chip size="small" label={soon} sx={{ height: 22, bgcolor: "secondary.main", color: "secondary.contrastText", fontSize: "0.72rem", verticalAlign: "2px" }} />}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.92, lineHeight: 1.3 }}>
          {body}
        </Typography>
      </Box>
    </Box>
  );
}

/** Signed-in home: pick the kind of workers (only farm work is live), then your open requests. */
export function HomePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const me = useMe();
  const jobs = useJobs({ page_size: 10 });
  const [soon, setSoon] = useState<Soon | null>(null);
  const [notified, setNotified] = useState<Soon[]>(() => readJson<Soon[]>(NOTIFY_KEY) ?? []);

  if (!isAuthenticated) return <Navigate to="/register" replace />;

  const firstName = (me.data?.full_name ?? "").split(" ")[0];
  const active = (jobs.data?.results ?? []).filter((j) => isJobOpen(j.status)).slice(0, 3);

  // The API has no "notify me" endpoint yet (docs/backend-requests.md), so interest is kept on this device only.
  const notify = (sector: Soon) => {
    if (!notified.includes(sector)) {
      const next = [...notified, sector];
      setNotified(next);
      writeJson(NOTIFY_KEY, next);
      toast.success(t("home.notifyToast"));
    } else toast.info(t("home.notifyAlready"));
    setSoon(null);
  };

  const sheetTitle = soon === "construction" ? t("home.construction") : t("home.shop");
  const sheetBody = soon === "construction" ? t("home.constructionDesc") : t("home.shopDesc");

  return (
    <>
      <Typography variant="h2" component="h2">
        {firstName ? t("home.greeting", { name: firstName }) : t("home.whatKind")}
      </Typography>
      {me.data?.village_name && (
        <Chip
          component={RouterLink}
          to="/profile"
          clickable
          icon={<PlaceIcon />}
          label={t("home.location", { village: me.data.village_name })}
          variant="outlined"
          sx={{ mt: 0.75, mb: 0.5 }}
        />
      )}
      <Typography color="text.secondary" sx={{ mt: 0.75, mb: 1.5 }}>
        {t("home.whatKind")}
      </Typography>

      <Box sx={{ display: "grid", gap: 1.25 }}>
        <Rise>
          <Tile component={RouterLink} to="/new" emoji="🌾" title={t("home.agri")} body={t("home.agriDesc")} color="#1E6B3B" />
        </Rise>
        <Rise index={1}>
          <Tile component="button" type="button" onClick={() => setSoon("construction")} emoji="🧱" title={t("home.construction")} body={t("home.constructionDesc")} color="#4B5563" soon={t("common.comingSoon")} />
        </Rise>
        <Rise index={2}>
          <Tile component="button" type="button" onClick={() => setSoon("shop")} emoji="🏭" title={t("home.shop")} body={t("home.shopDesc")} color="#2D5D8A" soon={t("common.comingSoon")} />
        </Rise>
      </Box>

      {(jobs.isPending || jobs.isError || active.length > 0) && (
        <Box component="section" aria-labelledby="active-title" sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography id="active-title" variant="h3" component="h2">
              {t("home.active")}
            </Typography>
            <Button component={RouterLink} to="/requests" size="small" endIcon={<ArrowForwardIcon />}>
              {t("home.seeAll")}
            </Button>
          </Box>
          {jobs.isPending && <ListSkeleton count={2} lines={1} />}
          {jobs.isError && <ErrorState error={jobs.error} onRetry={() => jobs.refetch()} />}
          <Box sx={{ display: "grid", gap: 1.25 }}>
            {active.map((job, i) => (
              <Rise key={job.id} index={i}>
                <JobCard job={job} />
              </Rise>
            ))}
          </Box>
        </Box>
      )}

      <ResponsiveSheet
        open={soon !== null}
        onClose={() => setSoon(null)}
        title={sheetTitle}
        maxWidth="xs"
        actions={
          <>
            <Button color="inherit" onClick={() => setSoon(null)}>
              {t("common.close")}
            </Button>
            <Button variant="contained" onClick={() => soon && notify(soon)} disabled={soon !== null && notified.includes(soon)}>
              {soon !== null && notified.includes(soon) ? t("home.notified") : t("home.notify")}
            </Button>
          </>
        }
      >
        <Typography color="text.secondary">{sheetBody}</Typography>
        <Typography sx={{ mt: 1, fontWeight: 600 }}>{t("common.comingSoon")}</Typography>
      </ResponsiveSheet>
    </>
  );
}
