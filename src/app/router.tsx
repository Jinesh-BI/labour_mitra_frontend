import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "@/auth/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListSkeleton } from "@/components/common/Skeletons";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RegisterPage } from "@/pages/RegisterPage";
import type { RouteHandle } from "./routeHandle";

const handle = (h: RouteHandle) => h;

// Home, login and registration load up front (first paint); everything behind sign-in is split per route.
export const router = createBrowserRouter([
  // WhatsApp-style chat webview: its own full-screen shell, outside AppLayout so no existing screen is affected.
  { path: "bot", lazy: async () => ({ Component: (await import("@/features/bot/BotPage")).BotPage }) },
  {
    element: <AppLayout />,
    hydrateFallbackElement: <ListSkeleton count={2} />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage />, handle: handle({ hideNav: true, back: "/register" }) },
      { path: "register", element: <RegisterPage />, handle: handle({ hideNav: true }) },
      {
        element: <RequireAuth />,
        children: [
          { path: "requests", handle: handle({ title: "requests.title" }), lazy: async () => ({ Component: (await import("@/pages/RequestsPage")).RequestsPage }) },
          { path: "profile", handle: handle({ title: "profile.title" }), lazy: async () => ({ Component: (await import("@/pages/ProfilePage")).ProfilePage }) },
          { path: "jobs/:id", handle: handle({ title: "job.title", back: "/requests", hideNav: true }), lazy: async () => ({ Component: (await import("@/pages/JobDetailPage")).JobDetailPage }) },
          { path: "jobs/:id/crews", handle: handle({ title: "crews.title", back: "/jobs/:id", hideNav: true }), lazy: async () => ({ Component: (await import("@/pages/CandidatesPage")).CandidatesPage }) },
          {
            path: "new",
            handle: handle({ wizard: true, hideNav: true, back: true, title: "home.agri" }),
            lazy: async () => ({ Component: (await import("@/features/wizard/WizardLayout")).WizardLayout }),
            children: [
              { index: true, lazy: async () => ({ Component: (await import("@/features/wizard/CropStep")).CropStep }) },
              { path: "stage", lazy: async () => ({ Component: (await import("@/features/wizard/StageStep")).StageStep }) },
              { path: "activities", lazy: async () => ({ Component: (await import("@/features/wizard/ActivitiesStep")).ActivitiesStep }) },
              { path: "details", lazy: async () => ({ Component: (await import("@/features/wizard/DetailsStep")).DetailsStep }) },
              { path: "review", lazy: async () => ({ Component: (await import("@/features/wizard/ReviewStep")).ReviewStep }) },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
