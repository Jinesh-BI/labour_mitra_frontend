import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";

type Props = {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  min: number;
  max: number;
  step?: number;
  error?: string;
  hint?: string;
  id: string;
};

const btn = {
  all: "unset",
  boxSizing: "border-box",
  width: 50,
  height: 48,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  bgcolor: "action.hover",
  "&:disabled": { opacity: 0.4, cursor: "default" },
  "&:active:not(:disabled)": { bgcolor: "action.selected" },
  "&:focus-visible": { outline: "3px solid #F2B01E", outlineOffset: -3 },
} as const;

/** Prototype stepper: [−] number [+] in one bordered pill; the number can also be typed. */
export function QtyStepper({ label, value, onChange, min, max, step = 1, error, hint, id }: Props) {
  const num = value === "" ? min : value;
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="label" htmlFor={id} sx={{ display: "block", fontWeight: 600, mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden", border: 2, borderColor: error ? "error.main" : "divider", borderRadius: 3, bgcolor: "background.paper" }}>
        <Box component="button" type="button" aria-label={`− ${label}`} onClick={() => onChange(clamp(num - step))} disabled={num <= min} sx={btn}>
          <RemoveIcon />
        </Box>
        <InputBase
          id={id}
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            onChange(raw === "" ? "" : Math.min(max, Number(raw)));
          }}
          onBlur={() => onChange(value === "" ? min : clamp(value))}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", "aria-invalid": !!error, "aria-describedby": `${id}-msg`, style: { textAlign: "center", fontWeight: 800, fontSize: "1.25rem", padding: "10px 0" } }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Box component="button" type="button" aria-label={`+ ${label}`} onClick={() => onChange(clamp(num + step))} disabled={num >= max} sx={btn}>
          <AddIcon />
        </Box>
      </Box>
      <Typography id={`${id}-msg`} variant="caption" color={error ? "error" : "text.secondary"} role={error ? "alert" : undefined} sx={{ display: "block", mt: 0.5, minHeight: error || hint ? 18 : 0, fontWeight: error ? 600 : 400 }}>
        {error ?? hint}
      </Typography>
    </Box>
  );
}
