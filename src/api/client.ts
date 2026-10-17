import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toApiError } from "./errors";
import { tokenStorage } from "./tokenStorage";

// The API URL comes only from the environment (set at build time). There is no relative fallback and no dev proxy,
// so a missing value is a configuration error and must be loud.
const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
if (!configuredBase) throw new Error("VITE_API_BASE_URL is not set. Copy .env.example to .env and set the backend API URL.");
export const API_BASE_URL: string = configuredBase.replace(/\/+$/, "") + "/";
/** Fired when the session can no longer be refreshed; AuthProvider listens and signs the user out. */
export const AUTH_LOGOUT_EVENT = "labourmitra:logout";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

console.log("API BASE:", API_BASE_URL);
console.log("Vite DEV:", import.meta.env.DEV);

// A bare client (no interceptors) used only to refresh the access token.
const bare = axios.create({ baseURL: API_BASE_URL, timeout: 20_000 });

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const isAuthEndpoint = (url?: string) => !!url && url.replace(/^\//, "").startsWith("auth/");

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token && !config.headers.Authorization && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Several requests can hit 401 together; they must share one refresh call.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await bare.post<{ access: string; refresh?: string }>("auth/refresh/", { refresh });
    tokenStorage.setAccess(data.access);
    if (data.refresh) tokenStorage.setRefresh(data.refresh);
    return data.access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint(original.url)) {
      original._retried = true;
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const token = await refreshInFlight;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      tokenStorage.clear();
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
    return Promise.reject(toApiError(error));
  },
);
