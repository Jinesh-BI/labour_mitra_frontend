import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "@/i18n";
import { useLanguage } from "@/i18n/useLanguage";

// Latin digits in every language (farmers read prices as 450), Indian digit grouping.
const localeFor = (lang: Language) => `${lang}-IN-u-nu-latn`;

/** "2026-10-22" -> local Date (never parsed as UTC, which would shift the day). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayInput = () => toDateInput(new Date());

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

export const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

export function formatMoney(value: string | number | null | undefined, lang: Language): string {
  const n = toNumber(value);
  if (n === null) return "";
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

export function formatDate(value: string, lang: Language, withYear = false): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(parseDate(value));
}

/** "07:00:00" -> "7:00 AM" */
export function formatTime(value: string | null | undefined, lang: Language): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m ?? 0);
  return new Intl.DateTimeFormat(localeFor(lang), { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
};

/** Formatters bound to the current language, plus a translated "3 hours ago". */
export function useFormat() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return useMemo(
    () => ({
      language,
      money: (v: string | number | null | undefined) => formatMoney(v, language),
      date: (v: string, withYear = false) => formatDate(v, language, withYear),
      time: (v: string | null | undefined) => formatTime(v, language),
      /** "Today", "Tomorrow" or the short date. */
      dayLabel: (v: string) => {
        const diff = Math.round((parseDate(v).getTime() - parseDate(todayInput()).getTime()) / 86_400_000);
        if (diff === 0) return t("common.today");
        if (diff === 1) return t("common.tomorrow");
        return formatDate(v, language);
      },
      ago: (iso: string | null | undefined) => {
        if (!iso) return "";
        const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
        if (minutes < 1) return t("common.justNow");
        if (minutes < 60) return t("common.minutesAgo", { count: minutes });
        const hours = Math.round(minutes / 60);
        if (hours < 24) return t("common.hoursAgo", { count: hours });
        return t("common.daysAgo", { count: Math.round(hours / 24) });
      },
    }),
    [language, t],
  );
}
