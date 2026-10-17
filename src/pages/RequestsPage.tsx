import SearchIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useInfiniteJobs } from "@/api/hooks/jobs";
import type { Job, JobStatus } from "@/api/types";
import { Rise } from "@/components/common/Rise";
import { ListSkeleton } from "@/components/common/Skeletons";
import { EmptyState, ErrorState } from "@/components/common/States";
import { JobCard } from "@/features/jobs/JobCard";
import { activityName, cropName } from "@/i18n/catalog";
import { useLanguage } from "@/i18n/useLanguage";

type Filter = "all" | "active" | "confirmed" | "closed" | "cancelled";
const groups: Record<Filter, JobStatus[] | null> = {
  all: null,
  active: ["created", "matching", "responses_received", "pending_confirmation"],
  confirmed: ["confirmed"],
  closed: ["closed"],
  cancelled: ["cancelled"],
};
const filterKeys = { all: "requests.fAll", active: "requests.fActive", confirmed: "requests.fConfirmed", closed: "requests.fClosed", cancelled: "requests.fCancelled" } as const;

/** Every job the user has posted: status chips, search once the list is long, "load more" paging. */
export function RequestsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const jobs = useInfiniteJobs();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const all: Job[] = useMemo(() => jobs.data?.pages.flatMap((p) => p.results) ?? [], [jobs.data]);
  const total = jobs.data?.pages[0]?.count ?? 0;

  const shown = useMemo(() => {
    const statuses = groups[filter];
    return all.filter((j) => {
      if (statuses && !statuses.includes(j.status)) return false;
      if (!deferred) return true;
      const haystack = [j.crop, cropName(j.crop, language), j.village_name, ...j.activities.flatMap((a) => [a.name, activityName(a.name, language)])].join(" ").toLowerCase();
      return haystack.includes(deferred);
    });
  }, [all, filter, deferred, language]);

  const counts = useMemo(() => {
    const result = {} as Record<Filter, number>;
    (Object.keys(groups) as Filter[]).forEach((k) => {
      const statuses = groups[k];
      result[k] = statuses ? all.filter((j) => statuses.includes(j.status)).length : all.length;
    });
    return result;
  }, [all]);

  const filtering = filter !== "all" || deferred !== "";

  return (
    <>
      {total > 5 && (
        <TextField
          type="search"
          size="small"
          placeholder={t("requests.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{ htmlInput: { "aria-label": t("requests.search") }, input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
          sx={{ mb: 1.25 }}
        />
      )}

      <Box sx={{ display: "flex", gap: 0.75, overflowX: "auto", pb: 1.25, mx: -2, px: 2, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }} role="group" aria-label={t("crews.filters")}>
        {(Object.keys(groups) as Filter[]).map((k) => (
          <Chip
            key={k}
            clickable
            aria-pressed={filter === k}
            color={filter === k ? "primary" : "default"}
            variant={filter === k ? "filled" : "outlined"}
            label={`${t(filterKeys[k])}${jobs.data ? ` ${counts[k]}` : ""}`}
            onClick={() => setFilter(k)}
            sx={{ flex: "none" }}
          />
        ))}
      </Box>

      {jobs.isPending && <ListSkeleton count={3} lines={1} />}
      {jobs.isError && <ErrorState error={jobs.error} onRetry={() => jobs.refetch()} />}

      {jobs.data && total === 0 && (
        <EmptyState
          emoji="🌱"
          title={t("requests.empty")}
          body={t("requests.emptyBody")}
          action={
            <Button variant="contained" color="secondary" size="large" component={RouterLink} to="/new">
              {t("requests.create")}
            </Button>
          }
        />
      )}

      {jobs.data && total > 0 && shown.length === 0 && (
        <EmptyState
          compact
          emoji="🔎"
          title={deferred ? t("requests.emptySearch") : t("requests.emptyFilter")}
          action={
            filtering && (
              <Button
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                {t("requests.clear")}
              </Button>
            )
          }
        />
      )}

      <Box sx={{ display: "grid", gap: 1.25 }} aria-live="polite">
        {shown.map((job, i) => (
          <Rise key={job.id} index={i}>
            <JobCard job={job} />
          </Rise>
        ))}
      </Box>

      {jobs.hasNextPage && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button variant="outlined" onClick={() => jobs.fetchNextPage()} disabled={jobs.isFetchingNextPage}>
            {jobs.isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
          </Button>
        </Box>
      )}
      {jobs.data && !jobs.hasNextPage && total > 8 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
          {t("requests.loadedAll")}
        </Typography>
      )}
    </>
  );
}
