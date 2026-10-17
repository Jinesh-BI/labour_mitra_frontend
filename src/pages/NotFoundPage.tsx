import Button from "@mui/material/Button";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { EmptyState } from "@/components/common/States";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <EmptyState
      emoji="🧭"
      title={t("errors.notFoundTitle")}
      body={t("errors.notFoundBody")}
      action={
        <Button component={RouterLink} to="/" variant="contained" size="large">
          {t("errors.goHome")}
        </Button>
      }
    />
  );
}
