const DEFAULT_API_BASE_URL = "http://103.208.183.250:5000/api/v1";

export const AUTH_STORAGE_KEYS = {
  accessToken: "adminAccessToken",
  user: "adminUser",
} as const;

export type LoginCredentials = {
  email: string;
  password: string;
};

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export function getAdminAccessToken() {
  return (
    localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

export function isAuthenticated() {
  return Boolean(getAdminAccessToken());
}

export function getStoredAdminUser<T = Record<string, unknown>>() {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as T;
  } catch {
    return null;
  }
}

export function clearAuthData() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
}

function getNestedValue(source: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((current: any, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

export function extractAccessToken(payload: any) {
  return getNestedValue(payload, [
    "accessToken",
    "access_token",
    "token",
    "data.accessToken",
    "data.access_token",
    "data.token",
    "data.tokens.accessToken",
    "data.tokens.access_token",
    "tokens.accessToken",
    "tokens.access_token",
    "result.accessToken",
    "result.token",
  ]);
}

export function extractAdminUser(payload: any) {
  return (
    getNestedValue(payload, [
      "user",
      "admin",
      "data.user",
      "data.admin",
      "result.user",
      "result.admin",
    ]) || null
  );
}

export async function loginAdmin(credentials: LoginCredentials) {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      getNestedValue(payload, ["message", "error", "errors.0.message"]) ||
      `Login failed with status ${response.status}`;
    throw new Error(String(message));
  }

  const accessToken = extractAccessToken(payload);

  if (!accessToken) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, String(accessToken));

  const adminUser = extractAdminUser(payload);
  if (adminUser) {
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(adminUser));
  }

  return payload;
}
