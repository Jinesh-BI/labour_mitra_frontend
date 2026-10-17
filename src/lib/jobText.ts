import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { activityName } from "@/i18n/catalog";
import { useFormat, toNumber } from "./format";

type WageLike = { wageType: "per_day" | "per_acre" | "fixed"; amount: string | number; acres: string | number | null };

/** Plain-language descriptions of job fields, shared by the review step, the crew list and the tracking page. */
export function useJobText() {
  const { t } = useTranslation();
  const f = useFormat();

  return useMemo(
    () => ({
      pay: ({ wageType, amount, acres }: WageLike) => {
        if (wageType === "per_day") return t("wizard.payDay", { amount: f.money(amount) });
        if (wageType === "per_acre") return t("wizard.payAcre", { amount: f.money(amount), acres: t("common.acres", { count: toNumber(acres) ?? 0 }) });
        return t("wizard.payFixed", { amount: f.money(amount) });
      },
      /** Short form for list rows: "₹450/day". */
      payShort: ({ wageType, amount }: WageLike) =>
        t(wageType === "per_day" ? "wizard.payShortDay" : wageType === "per_acre" ? "wizard.payShortAcre" : "wizard.payShortFixed", { amount: f.money(amount) }),
      /** Total if every worker is paid the stated amount. Only an estimate, so the UI labels it as one. */
      estimate: ({ wageType, amount, acres }: WageLike, workers: number, days: number) => {
        const a = toNumber(amount) ?? 0;
        if (wageType === "per_day") return a * workers * days;
        if (wageType === "per_acre") return a * (toNumber(acres) ?? 0);
        return a;
      },
      activities: (names: string[]) => names.map((n) => activityName(n, f.language)).join(", "),
      distance: (km: number | null) => (km === null ? t("wizard.anyDistance") : t("wizard.withinKm", { km })),
      gender: (g: "any" | "men" | "women") => t(g === "any" ? "wizard.anyone" : g === "men" ? "wizard.men" : "wizard.women"),
      facility: (k: "tea" | "lunch" | "transport" | "stay") => t(`wizard.${k}`),
    }),
    [t, f],
  );
}
