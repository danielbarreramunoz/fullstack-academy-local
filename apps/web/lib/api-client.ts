import type { AuditLog, IdorResult, Lesson, Me, ProgressRow, Track } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...rest,
      headers: { accept: "application/json", ...(headers ?? {}) },
    });
  } catch {
    throw new ApiError("No se pudo conectar con la API. ¿Está levantada en :3001?", 0);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const fallback = `${init.method ?? "GET"} ${path} respondió ${res.status}`;
    const raw = body?.message ?? body?.error?.message ?? body?.error ?? body?.detail;
    const message = Array.isArray(raw) ? raw.join(", ") : raw;
    throw new ApiError(message ? String(message) : fallback, res.status);
  }

  return body as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  login: (email: string, password: string) =>
    req<{ access_token: string; user: Me }>("/auth/login", jsonInit("POST", { email, password })),
  logout: () => req<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => req<{ user: Me }>("/auth/me"),
  tracks: () => req<Track[]>("/tracks"),
  lesson: (id: string) => req<Lesson>(`/lessons/${id}`),
  lessonsByTrack: (trackId: string) => req<Lesson[]>(`/lessons/by-track/${trackId}`),
  progress: () => req<ProgressRow[]>("/progress"),
  startProgress: (lesson_id: string) =>
    req<ProgressRow>("/progress/start", jsonInit("POST", { lesson_id })),
  updateProgress: (id: string, body: { status?: string; notes_md?: string }) =>
    req<ProgressRow>(`/progress/${id}`, jsonInit("PATCH", body)),
  auditMine: () => req<AuditLog[]>("/audit-logs/mine"),
  idorDemo: (progressId: string) =>
    req<IdorResult>(`/sandbox/idor-demo?progressId=${encodeURIComponent(progressId)}`),
};
