import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/** Short green banner on the sign-in screens (prototype `.hero-login`). */
export function AuthHero() {
  const { t } = useTranslation();
  return (
    <Box sx={{ position: "relative", overflow: "hidden", bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 5.5, p: 2.5, mb: 2 }}>
      <Typography variant="h2" component="h1" sx={{ color: "inherit" }}>
        {t("auth.heroTitle")}
      </Typography>
      <Typography sx={{ opacity: 0.92, mt: 0.5, fontSize: "1rem" }}>{t("auth.heroSub")}</Typography>
      <Typography aria-hidden="true" sx={{ fontSize: 30, letterSpacing: 4, mt: 1 }}>
        🍇🧅🍎
      </Typography>
    </Box>
  );
}
