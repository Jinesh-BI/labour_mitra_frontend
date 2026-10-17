import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import WifiOffIcon from "@mui/icons-material/WifiOffRounded";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Outlet, ScrollRestoration, useLocation, useMatches, useNavigate, useParams } from "react-router-dom";
import type { RouteHandle } from "@/app/routeHandle";
import { useAuth } from "@/auth/AuthContext";
import { ListSkeleton } from "@/components/common/Skeletons";
import { wizardIndex, wizardSteps } from "@/features/wizard/steps";
import { useOnline } from "@/hooks/useOnline";
import { BottomNav } from "./BottomNav";
import { LanguageMenu } from "./LanguageMenu";

function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();
  return (
    <Collapse in={!online}>
      <Box role="status" sx={{ bgcolor: "warning.main", color: "warning.contrastText", px: 2, py: 0.5, display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
        <WifiOffIcon fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {t("errors.offline")}
        </Typography>
      </Box>
    </Collapse>
  );
}

/** App shell in the prototype's layout: one 520 px column, sticky header, optional wizard progress, bottom tabs. */
export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const matches = useMatches();
  const handle: RouteHandle = ([...matches].reverse().find((m) => m.handle) as { handle?: RouteHandle } | undefined)?.handle ?? {};

  const step = handle.wizard ? wizardIndex(pathname) : -1;
  const canBack = handle.back !== undefined;
  const showNav = isAuthenticated && !handle.hideNav;

  const goBack = () => {
    if (handle.wizard) navigate(step <= 0 ? "/" : wizardSteps[step - 1]);
    else if (typeof handle.back === "string") navigate(handle.back.replace(":id", params.id ?? ""));
    else navigate(-1);
  };

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Box
        sx={{
          maxWidth: 520,
          mx: "auto",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          borderInline: { sm: 1 },
          borderColor: "divider",
        }}
      >
        <Box component="a" href="#main" sx={{ position: "absolute", left: 8, top: -60, zIndex: 2000, bgcolor: "secondary.main", color: "secondary.contrastText", px: 2, py: 1, borderRadius: 2, fontWeight: 700, "&:focus": { top: 8 } }}>
          {t("common.skipToContent")}
        </Box>

        <Box component="header" sx={{ position: "sticky", top: 0, zIndex: (th) => th.zIndex.appBar, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", pt: "env(safe-area-inset-top)" }}>
          <OfflineBanner />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.75, minHeight: 56 }}>
            {canBack && (
              <IconButton edge="start" aria-label={t("common.back")} onClick={goBack} sx={{ bgcolor: "action.hover", width: 40, height: 40, minWidth: 40, minHeight: 40 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            {handle.title ? (
              <Typography component="h1" sx={{ flex: 1, fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.2, overflowWrap: "anywhere" }}>
                {t(handle.title)}
              </Typography>
            ) : (
              <Typography component={RouterLink} to="/" sx={{ flex: 1, fontWeight: 800, fontSize: "1.3rem", color: "primary.main", textDecoration: "none", display: "flex", gap: 0.75, alignItems: "center" }}>
                <span aria-hidden="true">🌾</span> {t("common.appName")}
              </Typography>
            )}
            <LanguageMenu />
          </Box>
          {handle.wizard && step >= 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.75, mt: -0.5, pb: 0.5 }} aria-live="polite">
                {t("wizard.stepOf", { current: step + 1, total: wizardSteps.length })}
              </Typography>
              <Box aria-hidden="true" sx={{ display: "flex", gap: "5px", px: 1.75, pb: 1.25 }}>
                {wizardSteps.map((s, i) => (
                  <Box key={s} sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: i <= step ? "primary.main" : "divider", transition: "background-color .35s" }} />
                ))}
              </Box>
            </>
          )}
        </Box>

        <Box
          component="main"
          id="main"
          tabIndex={-1}
          sx={{ flex: 1, px: 2, pt: 2.25, pb: "calc(120px + env(safe-area-inset-bottom))", outline: "none" }}
        >
          {/* Keyed by path so each screen fades in; Suspense shows a skeleton while a lazy screen loads. */}
          <Box key={pathname} sx={{ animation: "lm-fade .25s backwards" }}>
            <Suspense fallback={<ListSkeleton count={2} />}>
              <Outlet />
            </Suspense>
          </Box>
        </Box>

        {showNav && <BottomNav />}
      </Box>
      <ScrollRestoration />
    </Box>
  );
}
