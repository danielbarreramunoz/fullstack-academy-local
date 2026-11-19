"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api-client";

export default function Home() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  useEffect(() => {
    api.tracks().then(setTracks).catch(() => setTracks([]));
    api.progress().then(setProgress).catch(() => setProgress([]));
  }, []);
  return (
    <div>
      <h1>Dashboard diario</h1>
      <p>Sesión 30-60 min: 1 lección → concepto + fallo + reto + checklist.</p>
      <h2>Tracks</h2>
      <ul>{tracks.map((t) => <li key={t.id}>{t.title} ({t.lessons_count} lecciones)</li>)}</ul>
      <h2>Mi progreso</h2>
      <ul>{progress.map((p) => <li key={p.id}>{p.lesson_title}: {p.status}</li>)}</ul>
      <p><a href="/sandbox" style={{ color: "#7cc4ff" }}>Abrir security-lab (IDOR)</a></p>
    </div>
  );
}
