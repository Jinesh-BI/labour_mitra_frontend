import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// No dev proxy: the browser calls the backend directly at VITE_API_BASE_URL (see .env.example).
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { host: "0.0.0.0", port: 5173 },
});
