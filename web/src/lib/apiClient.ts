import { getAuthToken } from "./clientAuth";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const token = getAuthToken();

  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = json?.error ?? { code: "HTTP_ERROR", message: `HTTP ${res.status}` };
    return { ok: false, error: { code: String(err.code ?? "HTTP_ERROR"), message: String(err.message ?? "Error") } };
  }

  return { ok: true, data: json as T };
}
