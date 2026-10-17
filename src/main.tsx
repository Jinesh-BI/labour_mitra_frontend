import "@fontsource/mukta/400.css";
import "@fontsource/mukta/500.css";
import "@fontsource/mukta/600.css";
import "@fontsource/mukta/700.css";
import "@fontsource/mukta/800.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Providers } from "./app/Providers";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);

// Installable PWA: register the service worker in production builds only (it would fight Vite's dev server).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* the app works without it; only offline start and install are lost */
    });
  });
}
