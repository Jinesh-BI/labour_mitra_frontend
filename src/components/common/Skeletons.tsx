import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";

/** Wraps skeleton content so screen readers hear one "Loading" instead of many empty boxes. */
function Busy({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Box role="status" aria-busy="true" aria-label={t("common.loading")}>
      {children}
    </Box>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
          <Skeleton variant="rounded" width={52} height={52} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={26} />
            <Skeleton width="40%" />
          </Box>
        </Stack>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? "55%" : "100%"} />
        ))}
        <Skeleton variant="rounded" height={44} sx={{ mt: 1.5 }} />
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ count = 3, lines }: { count?: number; lines?: number }) {
  return (
    <Busy>
      <Stack spacing={1.5}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} lines={lines} />
        ))}
      </Stack>
    </Busy>
  );
}

export function TilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Busy>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" } }}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 5 }} />
        ))}
      </Box>
    </Busy>
  );
}

export function DetailSkeleton() {
  return (
    <Busy>
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 5 }} />
        <Skeleton variant="rounded" height={70} />
        <CardSkeleton />
        <CardSkeleton />
      </Stack>
    </Busy>
  );
}
