import Box from "@mui/material/Box";

type Option<T extends string | number | boolean> = { value: T; label: string };

type Props<T extends string | number | boolean> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
};

/** Segmented control from the prototype: one row, one choice, big enough for a thumb. */
export function Seg<T extends string | number | boolean>({ value, options, onChange, label }: Props<T>) {
  return (
    <Box
      role="radiogroup"
      aria-label={label}
      sx={{ display: "flex", gap: "3px", p: "3px", borderRadius: 3, bgcolor: "action.hover", border: 2, borderColor: "divider" }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Box
            key={String(o.value)}
            component="button"
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            sx={{
              all: "unset",
              boxSizing: "border-box",
              flex: 1,
              minHeight: 40,
              px: 0.5,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              borderRadius: 2.25,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              lineHeight: 1.15,
              color: on ? "primary.contrastText" : "text.primary",
              bgcolor: on ? "primary.main" : "transparent",
              transition: "background-color .18s, color .18s",
              "&:focus-visible": { outline: "3px solid #F2B01E", outlineOffset: 1 },
            }}
          >
            {o.label}
          </Box>
        );
      })}
    </Box>
  );
}
