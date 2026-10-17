import { createTheme } from "@mui/material/styles";

// Visual language taken from the LabourNow prototype: deep leaf green for trust, warm sun yellow for the
// single primary action, soft green-tinted neutrals, generous radii and touch targets for phone use.
// Fonts: Mukta covers Latin and Devanagari (Marathi/Hindi) so both languages feel like one family.
const fontFamily = '"Mukta", "Noto Sans Devanagari", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-mui-color-scheme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1E6B3B", light: "#4C9A67", dark: "#14502B", contrastText: "#FFFFFF" },
        secondary: { main: "#F2B01E", dark: "#C98F0A", contrastText: "#1F1700" },
        success: { main: "#2E7D32" },
        warning: { main: "#B26A00" },
        error: { main: "#B3261E" },
        info: { main: "#1D4E89" },
        background: { default: "#F1F6F0", paper: "#FFFFFF" },
        text: { primary: "#15241A", secondary: "#55665A" },
        divider: "#D3DFD5",
      },
    },
    dark: {
      palette: {
        primary: { main: "#62C383", light: "#8AD7A3", dark: "#3E9A5E", contrastText: "#0B160F" },
        secondary: { main: "#F2B01E", contrastText: "#1F1700" },
        success: { main: "#7BD88F" },
        warning: { main: "#F2B01E" },
        error: { main: "#F2867E" },
        info: { main: "#8DB8F0" },
        background: { default: "#0E1611", paper: "#16221A" },
        text: { primary: "#E5EEE7", secondary: "#9AAE9F" },
        divider: "#2B3D31",
      },
    },
  },
  // Base unit 4: sx `borderRadius: 3` = 12px. Components below set their own explicit radii.
  shape: { borderRadius: 4 },
  typography: {
    fontFamily,
    fontSize: 16,
    body1: { fontSize: "1.0625rem", lineHeight: 1.45 },
    body2: { fontSize: "0.9rem", lineHeight: 1.4 },
    h1: { fontWeight: 800, fontSize: "1.75rem", lineHeight: 1.15, letterSpacing: "-0.01em" },
    h2: { fontWeight: 800, fontSize: "1.55rem", lineHeight: 1.15, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.25 },
    h4: { fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.25 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 700, fontSize: "1rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitTapHighlightColor: "transparent", overflowX: "hidden" },
        // Shared motion: screens rise in, toasts and sheets use MUI transitions.
        "@keyframes lm-rise": { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "none" } },
        "@keyframes lm-fade": { from: { opacity: 0 }, to: { opacity: 1 } },
        "@keyframes lm-pop": { "0%": { transform: "scale(.6)", opacity: 0 }, "70%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: 1 } },
        "@keyframes lm-pulse": { "0%": { boxShadow: "0 0 0 0 currentColor" }, "70%": { boxShadow: "0 0 0 18px transparent" }, "100%": { boxShadow: "0 0 0 0 transparent" } },
        "@keyframes lm-ring": { "0%,100%": { transform: "rotate(0)" }, "15%": { transform: "rotate(-16deg)" }, "30%": { transform: "rotate(14deg)" }, "45%": { transform: "rotate(-10deg)" }, "60%": { transform: "rotate(8deg)" } },
        "@keyframes lm-shimmer": { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        ":focus-visible": { outline: "3px solid #F2B01E", outlineOffset: 2 },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": { animationDuration: "0.01ms !important", animationIterationCount: "1 !important", transitionDuration: "0.01ms !important", scrollBehavior: "auto !important" },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 48, paddingInline: 18, borderRadius: 14 },
        sizeLarge: { minHeight: 54, fontSize: "1.1rem" },
        sizeSmall: { minHeight: 38, fontSize: "0.9rem", paddingInline: 14, borderRadius: 10 },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { rounded: { borderRadius: 14 } } },
    MuiCard: {
      styleOverrides: {
        root: ({ theme: t }) => ({ border: `1px solid ${(t.vars ?? t).palette.divider}`, borderRadius: 14 }),
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: (t.vars ?? t).palette.background.paper,
          borderBottom: `1px solid ${(t.vars ?? t).palette.divider}`,
        }),
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined", fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, fontSize: "1.1rem" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 }, sizeMedium: { minHeight: 36 } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 22 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
  },
});
