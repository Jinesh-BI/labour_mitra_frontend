export const wizardSteps = ["/new", "/new/stage", "/new/activities", "/new/details", "/new/review"] as const;

export const wizardIndex = (pathname: string) => wizardSteps.indexOf(pathname.replace(/\/$/, "") as (typeof wizardSteps)[number]);
