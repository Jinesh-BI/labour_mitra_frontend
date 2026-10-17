import Box, { type BoxProps } from "@mui/material/Box";

/** Plain bordered group, the prototype's `.panel`: replaces one card per field. */
export function Panel({ sx, ...rest }: BoxProps) {
  return (
    <Box
      {...rest}
      sx={[
        { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, p: 1.75, display: "grid", gap: 1.5 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

/** Small bold field label above an input or segmented control. */
export function FieldLabel({ children, htmlFor, id }: { children: React.ReactNode; htmlFor?: string; id?: string }) {
  return (
    <Box component="label" htmlFor={htmlFor} id={id} sx={{ display: "block", fontWeight: 600, mb: 0.75 }}>
      {children}
    </Box>
  );
}
