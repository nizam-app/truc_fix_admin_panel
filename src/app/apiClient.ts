import { clearAdminSession, getApiBaseUrl, getStoredAdminSession, storeAdminSession } from "./auth";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type RefreshResponse = {
  status?: string;
  message?: string;
  data?: { accessToken?: string; refreshToken?: string };
};

const shouldAttemptRefresh = (response: Response) => response.status === 401;

const logoutAndRedirect = () => {
  clearAdminSession();
  if (typeof window !== "undefined") {
    // Hard redirect ensures all stale state is cleared.
    window.location.assign("/login");
  }
};

const refreshSession = async (): Promise<string | null> => {
  const session = getStoredAdminSession();
  const refreshToken = session?.refreshToken;
  if (!refreshToken) return null;

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await response.json().catch(() => null)) as RefreshResponse | null;
  if (!response.ok) return null;

  const nextAccessToken = payload?.data?.accessToken;
  const nextRefreshToken = payload?.data?.refreshToken;
  if (!nextAccessToken || !nextRefreshToken) return null;

  if (session?.user) {
    storeAdminSession({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      user: session.user,
    });
  }

  return nextAccessToken;
};

export async function adminFetch(
  path: string,
  init: RequestInit = {},
  options: { retryOnUnauthorized?: boolean } = {}
): Promise<Response> {
  const { retryOnUnauthorized = true } = options;
  const apiBaseUrl = getApiBaseUrl();
  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;

  const headers = new Headers(init.headers || undefined);
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });

  if (!retryOnUnauthorized || !shouldAttemptRefresh(response)) return response;

  const newAccessToken = await refreshSession();
  if (!newAccessToken) {
    logoutAndRedirect();
    return response;
  }

  const retryHeaders = new Headers(init.headers || undefined);
  retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

  return await fetch(`${apiBaseUrl}${path}`, { ...init, headers: retryHeaders });
}

export async function adminFetchJson<T = JsonValue>(
  path: string,
  init: RequestInit = {},
  errorMessage = "Request failed."
): Promise<T> {
  const response = await adminFetch(path, init);
  const payload = (await response.json().catch(() => null)) as any;
  if (!response.ok) {
    const message = payload?.message || errorMessage;
    throw new Error(message);
  }
  return payload as T;
}

