import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { hi } from "./locales/hi";
import { mr } from "./locales/mr";

export const SUPPORTED_LANGUAGES = ["en", "hi", "mr"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_KEY = "lm_lang";

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, hi: { translation: hi }, mr: { translation: mr } },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], lookupLocalStorage: LANGUAGE_KEY, caches: ["localStorage"] },
    returnNull: false,
  });

const applyDocumentLanguage = (lng: string) => {
  document.documentElement.lang = lng;
};
applyDocumentLanguage(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
