import Box from "@mui/material/Box";
import type { ReactNode } from "react";

/** Fixed action bar (prototype `.bottom`): the screen's one primary action, always in thumb reach. */
export function BottomBar({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <Box
      sx={{
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <Box sx={{ maxWidth: 520, mx: "auto", px: 1.75, py: 1.25 }}>
        {hint && (
          <Box aria-live="polite" sx={{ mb: 0.75, textAlign: "center", typography: "body2", color: "text.secondary" }}>
            {hint}
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", "& > .MuiButton-root:not(.MuiButton-sizeSmall)": { flex: 1 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
