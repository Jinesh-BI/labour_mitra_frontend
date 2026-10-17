import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HarvestStage, JobCreateBody } from "@/api/types";
import { addDays, todayInput } from "@/lib/format";
import { readJson, writeJson } from "@/lib/safeStorage";

export type Facility = NonNullable<JobCreateBody["facilities"]>[number];
export type WageType = NonNullable<JobCreateBody["wage_type"]>;
export type GenderPref = NonNullable<JobCreateBody["gender_preference"]>;
export type Distance = 10 | 25 | 50 | null;

export type Details = {
  startDate: string;
  days: number | "";
  workers: number | "";
  reportingTime: string; // "HH:MM"
  gender: GenderPref;
  distance: Distance;
  experienced: boolean;
  wageType: WageType;
  wage: string;
  acres: string;
  facilities: Facility[];
  /** Set only when the user chose "use my current location for this job". */
  override: { latitude: number; longitude: number } | null;
};

export type Draft = {
  cropId: string | null;
  cropName: string | null;
  stage: HarvestStage | null;
  activityIds: string[];
  /** Names of the chosen activities (English, as served) so the review screen needs no extra call. */
  activityNames: string[];
  details: Details;
};

export const defaultDetails = (): Details => ({
  startDate: addDays(todayInput(), 1),
  days: 1,
  workers: 10,
  reportingTime: "07:00",
  gender: "any",
  distance: 25,
  experienced: false,
  wageType: "per_day",
  wage: "",
  acres: "",
  facilities: [],
  override: null,
});

const emptyDraft = (): Draft => ({ cropId: null, cropName: null, stage: null, activityIds: [], activityNames: [], details: defaultDetails() });

const STORAGE_KEY = "lm_job_draft";

type WizardValue = {
  draft: Draft;
  hasProgress: boolean;
  setCrop: (id: string, name: string) => void;
  setStage: (stage: HarvestStage) => void;
  setActivities: (ids: string[], names: string[]) => void;
  setDetails: (patch: Partial<Details>) => void;
  reset: () => void;
};

const WizardContext = createContext<WizardValue | null>(null);

function loadDraft(): Draft {
  const saved = readJson<Draft>(STORAGE_KEY);
  if (!saved) return emptyDraft();
  const details = { ...defaultDetails(), ...saved.details };
  // A saved start date in the past would fail validation; move it forward.
  if (details.startDate < todayInput()) details.startDate = addDays(todayInput(), 1);
  return { ...emptyDraft(), ...saved, details };
}

/** Job draft shared by the wizard screens and saved on the device so a half-filled job survives a reload. */
export function WizardProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(loadDraft);

  useEffect(() => writeJson(STORAGE_KEY, draft), [draft]);

  const setCrop = useCallback(
    (id: string, name: string) =>
      setDraft((d) =>
        d.cropId === id ? d : { ...d, cropId: id, cropName: name, stage: null, activityIds: [], activityNames: [] },
      ),
    [],
  );
  const setStage = useCallback(
    (stage: HarvestStage) =>
      setDraft((d) => (d.stage === stage ? d : { ...d, stage, activityIds: [], activityNames: [] })),
    [],
  );
  const setActivities = useCallback((ids: string[], names: string[]) => setDraft((d) => ({ ...d, activityIds: ids, activityNames: names })), []);
  const setDetails = useCallback((patch: Partial<Details>) => setDraft((d) => ({ ...d, details: { ...d.details, ...patch } })), []);
  const reset = useCallback(() => setDraft(emptyDraft()), []);

  const value = useMemo<WizardValue>(
    () => ({ draft, hasProgress: draft.cropId !== null, setCrop, setStage, setActivities, setDetails, reset }),
    [draft, setCrop, setStage, setActivities, setDetails, reset],
  );
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
