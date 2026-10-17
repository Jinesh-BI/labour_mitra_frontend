import AddCircleIcon from "@mui/icons-material/AddCircleRounded";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineRounded";
import AssignmentIcon from "@mui/icons-material/AssignmentRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PersonIcon from "@mui/icons-material/PersonRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineRounded";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useJobs } from "@/api/hooks/jobs";
import { isJobOpen } from "@/lib/status";

type Item = { to: string; label: "nav.newJob" | "nav.requests" | "nav.profile"; icon: ReactNode; active: ReactNode; match: (p: string) => boolean };

const items: Item[] = [
  { to: "/", label: "nav.newJob", icon: <AddCircleOutlineIcon />, active: <AddCircleIcon />, match: (p) => p === "/" || p.startsWith("/new") },
  { to: "/requests", label: "nav.requests", icon: <AssignmentOutlinedIcon />, active: <AssignmentIcon />, match: (p) => p.startsWith("/requests") || p.startsWith("/jobs") },
  { to: "/profile", label: "nav.profile", icon: <PersonOutlineIcon />, active: <PersonIcon />, match: (p) => p.startsWith("/profile") },
];

/** Three tabs, like the prototype: New job, My requests (with open count), Profile. */
export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const jobs = useJobs({ page_size: 10 });
  const openCount = (jobs.data?.results ?? []).filter((j) => isJobOpen(j.status)).length;

  return (
    <Box
      component="nav"
      aria-label={t("nav.main")}
      sx={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: (th) => th.zIndex.appBar, bgcolor: "background.paper", borderTop: 1, borderColor: "divider", pb: "env(safe-area-inset-bottom)" }}
    >
      <Box sx={{ maxWidth: 520, mx: "auto", display: "flex" }}>
        {items.map((item) => {
          const on = item.match(pathname);
          return (
            <Box
              key={item.to}
              component={RouterLink}
              to={item.to}
              aria-current={on ? "page" : undefined}
              sx={{
                flex: 1,
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                textDecoration: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: on ? "primary.main" : "text.secondary",
                "& svg": { transition: "transform .25s cubic-bezier(.2,.8,.2,1)", transform: on ? "translateY(-1px) scale(1.1)" : "none" },
              }}
            >
              <Badge color="error" badgeContent={item.to === "/requests" ? openCount : 0} overlap="circular">
                {on ? item.active : item.icon}
              </Badge>
              {t(item.label)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
