import EditIcon from "@mui/icons-material/EditRounded";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import PlaceIcon from "@mui/icons-material/PlaceRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMe, useUpdateMe } from "@/api/hooks/account";
import { useAuth } from "@/auth/AuthContext";
import { Seg } from "@/components/common/Seg";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Rise } from "@/components/common/Rise";
import { ErrorState } from "@/components/common/States";
import { useToast } from "@/components/feedback/ToastProvider";
import { emptyLocation, LocationField, type LocationValue } from "@/features/auth/LocationField";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLanguage } from "@/i18n/useLanguage";

const VERSION = "0.1.0";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Rise>
      <Typography variant="overline" color="text.secondary" component="h2" sx={{ fontWeight: 800, ml: 0.5 }}>
        {title}
      </Typography>
      <Card sx={{ mt: 0.5 }}>
        <CardContent sx={{ display: "grid", gap: 1.5, p: 1.75, "&:last-child": { pb: 1.75 } }}>{children}</CardContent>
      </Card>
    </Rise>
  );
}

/** Account, farm location, language and appearance in one place. Mobile number is read-only (it is the login). */
export function ProfilePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { mode, setMode } = useColorScheme();
  const me = useMe();
  const update = useUpdateMe();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [editingLocation, setEditingLocation] = useState(false);
  const [place, setPlace] = useState<LocationValue>(emptyLocation);
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (me.isPending) {
    return (
      <Stack spacing={2} role="status" aria-busy="true" aria-label={t("common.loading")}>
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    );
  }
  if (me.isError) return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  const p = me.data;

  const saveName = () => {
    if (name.trim().length < 2) {
      setNameError(t("profile.nameErr"));
      return;
    }
    update.mutate(
      { full_name: name.trim() },
      {
        onSuccess: () => {
          toast.success(t("profile.saved"));
          setEditingName(false);
        },
        onError: (e) => setNameError(e.fieldErrors.full_name?.[0] ?? e.message),
      },
    );
  };

  const saveLocation = () => {
    update.mutate(
      {
        village_id: place.villageId,
        ...(place.latitude !== undefined && place.longitude !== undefined ? { latitude: place.latitude, longitude: place.longitude, location_accuracy_m: place.accuracy } : {}),
        location_source: place.latitude !== undefined ? "gps" : "village",
      },
      {
        onSuccess: () => {
          toast.success(t("profile.locationSaved"));
          setEditingLocation(false);
        },
        onError: (e) => toast.fromError(e),
      },
    );
  };

  return (
    <Stack spacing={2}>
      <Rise>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden="true"
            sx={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", fontSize: 28, fontWeight: 800 }}
          >
            {(p.full_name || "?").trim().charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" component="p" sx={{ overflowWrap: "anywhere" }}>
              {p.full_name}
            </Typography>
            <Typography color="text.secondary">{p.mobile}</Typography>
          </Box>
        </Stack>
      </Rise>

      <Group title={t("profile.account")}>
        {editingName ? (
          <Stack spacing={1.5}>
            <TextField
              label={t("profile.name")}
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setNameError(undefined);
              }}
              error={!!nameError}
              helperText={nameError}
              slotProps={{ htmlInput: { maxLength: 80 } }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={saveName} disabled={update.isPending}>
                {update.isPending ? t("common.saving") : t("profile.saveName")}
              </Button>
              <Button color="inherit" onClick={() => setEditingName(false)} disabled={update.isPending}>
                {t("common.cancel")}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t("profile.name")}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{p.full_name}</Typography>
            </Box>
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                setName(p.full_name);
                setNameError(undefined);
                setEditingName(true);
              }}
            >
              {t("profile.editName")}
            </Button>
          </Stack>
        )}
        <Divider />
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t("profile.mobile")}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{p.mobile}</Typography>
        </Box>
      </Group>

      <Group title={t("profile.location")}>
        {editingLocation ? (
          <Stack spacing={1.5}>
            <LocationField value={place} onChange={setPlace} compact />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={saveLocation} disabled={update.isPending || (place.villageId === null && place.latitude === undefined)}>
                {update.isPending ? t("common.saving") : t("common.save")}
              </Button>
              <Button color="inherit" onClick={() => setEditingLocation(false)} disabled={update.isPending}>
                {t("common.cancel")}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontWeight: 700, display: "flex", gap: 0.5, alignItems: "center" }}>
                <PlaceIcon color="primary" /> {p.village_name || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(`profile.locationSource_${p.location_source}`)}
              </Typography>
            </Box>
            <Button
              onClick={() => {
                setPlace({ ...emptyLocation, villageId: p.village });
                setEditingLocation(true);
              }}
            >
              {t("profile.changeVillage")}
            </Button>
          </Stack>
        )}
      </Group>

      <Group title={t("profile.settings")}>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{t("profile.language")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
            {t("profile.languageHint")}
          </Typography>
          <Seg
            label={t("profile.language")}
            value={language}
            onChange={(v) => {
              setLanguage(v);
              toast.success(t("profile.saved"));
            }}
            options={SUPPORTED_LANGUAGES.map((code) => ({ value: code, label: t(`lang.${code}`) }))}
          />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 0.75 }}>{t("profile.theme")}</Typography>
          <Seg
            label={t("profile.theme")}
            value={mode ?? "system"}
            onChange={(v) => setMode(v)}
            options={[
              { value: "light" as const, label: t("theme.light") },
              { value: "dark" as const, label: t("theme.dark") },
              { value: "system" as const, label: t("theme.system") },
            ]}
          />
        </Box>
      </Group>

      <Group title={t("profile.about")}>
        <Typography color="text.secondary">{t("profile.aboutBody")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t("profile.version", { version: VERSION })}
        </Typography>
      </Group>

      <Button variant="outlined" color="error" size="large" startIcon={<LogoutIcon />} onClick={() => setConfirmLogout(true)}>
        {t("profile.logout")}
      </Button>

      <ConfirmDialog
        open={confirmLogout}
        title={t("profile.logoutAsk")}
        body={t("profile.logoutBody")}
        confirmLabel={t("profile.logout")}
        destructive
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          signOut();
          toast.info(t("auth.loggedOut"));
          navigate("/", { replace: true });
        }}
      />
    </Stack>
  );
}
