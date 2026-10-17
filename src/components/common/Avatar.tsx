import Box from "@mui/material/Box";

const COLORS = ["#1E6B3B", "#2D5D8A", "#97405F", "#5A2A80", "#A4161A", "#7A5300", "#0E7C86"];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const colorFor = (seed: string) => COLORS[[...seed].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];

/** Initials in a coloured circle (crews have no photos). The colour is stable per name. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <Box
      aria-hidden="true"
      sx={{ flex: "none", width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: size * 0.38, bgcolor: colorFor(name) }}
    >
      {initials(name)}
    </Box>
  );
}
