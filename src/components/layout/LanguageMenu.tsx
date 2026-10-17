import CheckIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLanguage } from "@/i18n/useLanguage";

/** Header language pill (prototype `.langbtn`): shows the current language, opens the other choices. */
export function LanguageMenu() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={t("lang.label")}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={(e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        lang={language}
        sx={{
          all: "unset",
          cursor: "pointer",
          boxSizing: "border-box",
          minHeight: 36,
          px: 1.5,
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 99,
          border: 2,
          borderColor: "primary.main",
          color: "primary.main",
          fontWeight: 700,
          fontSize: "0.9rem",
          "&:focus-visible": { outline: "3px solid #F2B01E", outlineOffset: 2 },
        }}
      >
        {t(`lang.${language}`)}
      </Box>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {SUPPORTED_LANGUAGES.map((code) => (
          <MenuItem
            key={code}
            selected={code === language}
            lang={code}
            onClick={() => {
              setLanguage(code);
              setAnchor(null);
            }}
            sx={{ minHeight: 46, minWidth: 160 }}
          >
            <ListItemText>{t(`lang.${code}`)}</ListItemText>
            {code === language && (
              <ListItemIcon sx={{ minWidth: 0, ml: 2 }}>
                <CheckIcon fontSize="small" color="primary" />
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
