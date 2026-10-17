import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/** Prototype heading: big title, one muted line. */
export function StepHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h2" component="h2">
        {title}
      </Typography>
      {lede && (
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: "1rem" }}>
          {lede}
        </Typography>
      )}
    </Box>
  );
}
