import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { demandApi } from "@/api/endpoints/demand";
import { tokenStorage } from "@/api/tokenStorage";
import { isLanguage, type Language } from "./index";

/** Current UI language plus a setter that also saves the choice on the profile (best effort, never blocks). */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language: Language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : "en";

  const setLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next);
      if (tokenStorage.getAccess()) {
        demandApi.updateMe({ preferred_language: next }).catch(() => {
          /* the local choice still applies; the profile syncs on the next change */
        });
      }
    },
    [i18n],
  );

  return { language, setLanguage };
}
