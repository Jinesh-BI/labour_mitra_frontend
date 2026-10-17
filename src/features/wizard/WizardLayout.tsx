import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router-dom";
import { WizardProvider } from "./WizardContext";

/** Holds the job draft for the five steps; the header (progress, back) is drawn by AppLayout from the route handle. */
export function WizardLayout() {
  const { pathname } = useLocation();
  return (
    <WizardProvider>
      <Box key={pathname} sx={{ animation: "lm-rise .35s cubic-bezier(.2,.8,.2,1) backwards" }}>
        <Outlet />
      </Box>
    </WizardProvider>
  );
}
