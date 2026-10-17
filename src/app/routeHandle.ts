import type { ParseKeys } from "i18next";

/** Per-route chrome read by AppLayout: header title, back target, wizard progress, bottom tabs. */
export type RouteHandle = {
  title?: ParseKeys;
  /** `true` = browser back; a string is a path (":id" is replaced from the URL). */
  back?: true | string;
  /** Show the 5-step progress bar and make back go to the previous step. */
  wizard?: boolean;
  /** Hide the bottom tabs (wizard, sign-in). */
  hideNav?: boolean;
};
