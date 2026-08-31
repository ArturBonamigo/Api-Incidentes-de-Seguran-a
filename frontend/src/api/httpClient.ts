import { env } from "../config/env";
import { ApiError } from "../types/api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken
} from "./tokenStorage";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    return null;
  }

  const response = await fetch(`${env.apiBaseUrl}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh })
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string };
  setAccessToken(data.access);
  return data.access;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  retry = true
): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;
  const token = getAccessToken();

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 401 && auth && retry) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      return apiRequest<T>(path, options, false);
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String(data.detail)
        : "Erro ao comunicar com a API.";

    throw new ApiError(
      message,
      response.status,
      typeof data === "object" && data !== null ? data : null
    );
  }

  return data as T;
}
