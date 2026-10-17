import MyLocationIcon from "@mui/icons-material/MyLocationRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useVillages } from "@/api/hooks/catalog";
import { catalogApi } from "@/api/endpoints/catalog";
import type { Village } from "@/api/types";
import { getPosition, type GeoFailure } from "@/lib/geo";

export type LocationValue = {
  villageId: string | null;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  source: "gps" | "village";
};

export const emptyLocation: LocationValue = { villageId: null, source: "village" };

type Props = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  error?: string;
  /** Hide the helper line (used inside the profile screen). */
  compact?: boolean;
  autoFocus?: boolean;
};

/**
 * Location picker: GPS first (prefills the nearest village), village list as the always-available fallback.
 * Coordinates matter for matching and distance, so a GPS fix is kept even when the village is chosen by hand.
 */
export function LocationField({ value, onChange, error, compact }: Props) {
  const { t } = useTranslation();
  const villages = useVillages();
  const [status, setStatus] = useState<"idle" | "locating" | "found" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const selected: Village | null = villages.data?.find((v) => v.id === value.villageId) ?? null;

  // If the GPS fix finished before the village list loaded, nothing else is needed: the list renders the value.
  useEffect(() => {
    if (status === "found" && !value.villageId) setMessage(t("auth.gpsNoVillage"));
  }, [status, value.villageId, t]);

  const useGps = async () => {
    setStatus("locating");
    setMessage(null);
    try {
      const pos = await getPosition();
      let villageId: string | null = value.villageId;
      let note = t("auth.gpsNoVillage");
      try {
        const nearest = await catalogApi.nearestVillages(pos.latitude, pos.longitude);
        if (nearest[0]) {
          villageId = nearest[0].id;
          note = t("auth.gpsFound", { name: nearest[0].name });
        }
      } catch {
        /* nearest-village lookup is a convenience; the coordinates are still valid */
      }
      onChange({ villageId, latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy, source: "gps" });
      setStatus("found");
      setMessage(note);
    } catch (reason) {
      setStatus("failed");
      setMessage((reason as GeoFailure) === "unsupported" ? t("auth.gpsUnavailable") : t("auth.gpsDenied"));
    }
  };

  return (
    <Stack spacing={1.5}>
      {!compact && (
        <Typography variant="body2" color="text.secondary">
          {t("auth.locationHelp")}
        </Typography>
      )}
      <Button
        variant="outlined"
        size="large"
        onClick={useGps}
        disabled={status === "locating"}
        startIcon={status === "locating" ? <CircularProgress size={18} /> : status === "found" ? <CheckCircleIcon color="success" /> : <MyLocationIcon />}
      >
        {status === "locating" ? t("auth.locating") : t("auth.useGps")}
      </Button>
      <div aria-live="polite">
        {message && (
          <Alert severity={status === "failed" ? "warning" : "success"} icon={false} sx={{ py: 0.25 }}>
            {message}
          </Alert>
        )}
      </div>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
        {t("auth.orPick")}
      </Typography>
      <Autocomplete
        options={villages.data ?? []}
        loading={villages.isPending}
        value={selected}
        getOptionLabel={(v) => v.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        groupBy={(v) => v.district}
        onChange={(_, v) =>
          // Choosing by hand keeps an earlier GPS fix; without one the village supplies the coordinates.
          onChange({ ...value, villageId: v?.id ?? null, source: value.latitude !== undefined ? "gps" : "village" })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("auth.village")}
            placeholder={t("auth.villagePh")}
            error={!!error}
            helperText={error}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {villages.isPending ? <CircularProgress size={18} /> : null}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    </Stack>
  );
}
