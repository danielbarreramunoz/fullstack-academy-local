export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function req(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}`);
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    req("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }),
  me: () => req("/auth/me"),
  tracks: () => req("/tracks"),
  lesson: (id: string) => req(`/lessons/${id}`),
  progress: () => req("/progress"),
  startProgress: (lesson_id: string) =>
    req("/progress/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lesson_id }) }),
  updateProgress: (id: string, body: unknown) =>
    req(`/progress/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  auditMine: () => req("/audit-logs/mine"),
  idorDemo: (progressId: string) => req(`/sandbox/idor-demo?progressId=${progressId}`),
};
