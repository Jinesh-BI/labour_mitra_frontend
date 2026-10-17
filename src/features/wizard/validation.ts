import type { TFunction } from "i18next";
import type { Details } from "./WizardContext";
import { todayInput, toNumber } from "@/lib/format";

export type DetailErrors = Partial<Record<"startDate" | "days" | "workers" | "wage" | "acres", string>>;

/** Mirrors the backend rules (spec section 5): start date today or later, workers 1-500, days 1-60, wage > 0, acres for per-acre. */
export function validateDetails(d: Details, t: TFunction): DetailErrors {
  const errors: DetailErrors = {};
  if (!d.startDate || d.startDate < todayInput()) errors.startDate = t("wizard.errDate");
  if (d.workers === "" || d.workers < 1 || d.workers > 500) errors.workers = t("wizard.errWorkers");
  if (d.days === "" || d.days < 1 || d.days > 60) errors.days = t("wizard.errDays");
  const wage = toNumber(d.wage);
  if (wage === null || wage <= 0) errors.wage = t("wizard.errWage");
  if (d.wageType === "per_acre") {
    const acres = toNumber(d.acres);
    if (acres === null || acres <= 0) errors.acres = t("wizard.errAcres");
  }
  return errors;
}

/** Back-end field names -> the form field they belong to, so server errors land next to the input. */
export const serverFieldToForm: Record<string, keyof DetailErrors> = {
  start_date: "startDate",
  duration_days: "days",
  required_workers: "workers",
  wage_amount: "wage",
  acres: "acres",
};
