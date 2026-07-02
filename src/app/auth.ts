const AUTH_STORAGE_KEY = "truckfix_admin_auth";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api/v1";

export type AdminAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    _id?: string;
    email: string;
    role: string;
    status?: string;
    adminProfile?: {
      fullName?: string;
      phoneNumber?: string;
      profilePhotoUrl?: string;
    };
  };
};

/** Ensures base URL ends with `/api/v1` (Render can inject only the service origin). */
export const normalizeApiBaseUrl = (raw: string) => {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return DEFAULT_LOCAL_API_BASE_URL;
  if (trimmed.endsWith("/api/v1")) return trimmed;
  return `${trimmed}/api/v1`;
};

const getFallbackApiBaseUrl = () => {
  if (typeof window === "undefined") return DEFAULT_LOCAL_API_BASE_URL;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return DEFAULT_LOCAL_API_BASE_URL;
  }

  return `http://${host}:5000/api/v1`;
};

export const getApiBaseUrl = () => {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return normalizeApiBaseUrl(fromEnv);
  return getFallbackApiBaseUrl();
};

export const getStoredAdminSession = (): AdminAuthSession | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminAuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const storeAdminSession = (session: AdminAuthSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isAdminAuthenticated = () => {
  const session = getStoredAdminSession();
  return Boolean(session?.accessToken && session?.user?.role === "ADMIN");
};
