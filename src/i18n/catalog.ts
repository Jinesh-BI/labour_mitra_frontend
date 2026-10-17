import type { Language } from "./index";

// The API returns English names only (see the connection spec, known gaps). Until it serves translations,
// crop and activity names are translated here by their English name; unknown names fall back to English.
type Names = Record<string, { hi: string; mr: string }>;

const crops: Names = {
  Grape: { hi: "अंगूर", mr: "द्राक्षे" },
  Onion: { hi: "प्याज़", mr: "कांदा" },
  Pomegranate: { hi: "अनार", mr: "डाळिंब" },
};

const activities: Names = {
  "Bagging and loading": { hi: "बोरी भरना और लदाई", mr: "गोणी भरणे व लोडिंग" },
  "Field curing and cutting": { hi: "खेत में सुखाना और कटाई", mr: "शेतात सुकवणे व पात कापणे" },
  "Grading and sorting": { hi: "ग्रेडिंग और छँटाई", mr: "प्रतवारी व वर्गवारी" },
  Harvesting: { hi: "कटाई", mr: "काढणी" },
  "Irrigation support": { hi: "सिंचाई में मदद", mr: "पाणी देण्यास मदत" },
  Transplanting: { hi: "रोपाई", mr: "लागवड" },
  Weeding: { hi: "निराई", mr: "खुरपणी" },
  Loading: { hi: "लदाई", mr: "लोडिंग" },
  "Packing and crating": { hi: "पैकिंग और क्रेट भरना", mr: "पॅकिंग व क्रेट भरणे" },
  Pruning: { hi: "छँटाई", mr: "छाटणी" },
  "Shoot thinning": { hi: "कल्ले छाँटना", mr: "फुटी विरळणी" },
  "Spraying support": { hi: "छिड़काव में मदद", mr: "फवारणीस मदत" },
  "Packing and loading": { hi: "पैकिंग और लदाई", mr: "पॅकिंग व लोडिंग" },
  "Fruit bagging": { hi: "फल पर थैली चढ़ाना", mr: "फळांना पिशवी लावणे" },
};

const lookup = (table: Names, name: string, lang: Language) => (lang === "en" ? undefined : table[name]?.[lang]) ?? name;

export const cropName = (name: string, lang: Language) => lookup(crops, name, lang);
export const activityName = (name: string, lang: Language) => lookup(activities, name, lang);

/** Prefer the API's own translation (name_mr / name_hi); fall back to the table above, then to English. */
export const pickName = (item: { name: string; name_mr?: string; name_hi?: string }, lang: Language, kind: "crop" | "activity") => {
  if (lang === "mr" && item.name_mr) return item.name_mr;
  if (lang === "hi" && item.name_hi) return item.name_hi;
  return kind === "crop" ? cropName(item.name, lang) : activityName(item.name, lang);
};
