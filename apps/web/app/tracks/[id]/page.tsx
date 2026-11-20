"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../../lib/api-client";
import { useSession } from "../../../lib/session";
import type { Lesson, ProgressRow, Track } from "../../../lib/types";
import { RequireAuth } from "../../../components/require-auth";
import { Alert, EmptyState, SkeletonList, StatusBadge } from "../../../components/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCheckCircle,
  IconClock,
  IconPlay,
  IconRefresh,
  IconSpark,
} from "../../../components/icons";

type Phase = "loading" | "ready" | "missing" | "error";
type Filter = "all" | "pending" | "in_progress" | "completed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "in_progress", label: "En curso" },
  { id: "completed", label: "Completadas" },
];

export default function TrackPage() {
  return (
    <RequireAuth>
      <TrackDetail />
    </RequireAuth>
  );
}

function TrackDetail() {
  const params = useParams<{ id: string }>();
  const { can } = useSession();
  const canWrite = can("progress:write");
  const router = useRouter();
  const trackId = params?.id;

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [track, setTrack] = useState<Track | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId) return;
    let active = true;
    (async () => {
      try {
        const [tracks, lessonRows, progressRows] = await Promise.all([
          api.tracks(),
          api.lessonsByTrack(trackId),
          api.progress(),
        ]);
        if (!active) return;
        const found = tracks.find((t) => t.id === trackId) ?? null;
        setTrack(found);
        setLessons(lessonRows);
        setProgress(progressRows);
        setPhase(found ? "ready" : "missing");
      } catch (e) {
        if (!active) return;
        setError(
          e instanceof ApiError && e.status === 401
            ? "Necesitas iniciar sesión para ver este track."
            : e instanceof Error
              ? e.message
              : "Error inesperado",
        );
        setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [trackId]);

  const progressByLesson = useMemo(() => {
    const map = new Map<string, ProgressRow>();
    for (const p of progress) map.set(p.lesson_id, p);
    return map;
  }, [progress]);

  const done = lessons.filter((l) => progressByLesson.get(l.id)?.status === "completed").length;
  const active = lessons.filter((l) => progressByLesson.get(l.id)?.status === "in_progress").length;
  const pct = lessons.length > 0 ? (done / lessons.length) * 100 : 0;

  const visible = lessons.filter((lesson) => {
    if (filter === "all") return true;
    const status = progressByLesson.get(lesson.id)?.status ?? "pending";
    return status === filter;
  });

  async function openLesson(lesson: Lesson) {
    const existing = progressByLesson.get(lesson.id);
    if (existing || !canWrite) {
      // Solo lectura (sin progress:write) o progreso ya existente: navegar sin escribir.
      router.push(`/lessons/${lesson.id}`);
      return;
    }
    setOpening(lesson.id);
    try {
      await api.startProgress(lesson.id);
      router.push(`/lessons/${lesson.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar la lección");
      setOpening(null);
    }
  }

  if (phase === "loading") {
    return (
      <div className="stack" style={{ gap: 18 }}>
        <div className="skeleton" style={{ height: 18, width: 220 }} />
        <div className="skeleton skeleton-card" style={{ height: 200 }} />
        <div className="card card-pad" aria-hidden>
          <SkeletonList rows={5} height={64} />
        </div>
      </div>
    );
  }

  if (phase === "missing") {
    return (
      <div className="card card-pad" style={{ maxWidth: 520, margin: "40px auto" }}>
        <EmptyState
          icon={<IconBook size={20} />}
          title="Track no encontrado"
          description="Puede que el identificador no exista o ya no esté disponible."
          action={
            <Link href="/" className="btn btn-soft btn-sm">
              <IconArrowLeft size={14} /> Volver al dashboard
            </Link>
          }
        />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="card card-pad stack" style={{ maxWidth: 560, margin: "40px auto" }}>
        <span className="eyebrow">No disponible</span>
        <h1 style={{ fontSize: "1.35rem" }}>No se pudo abrir el track</h1>
        <Alert tone="danger">{error}</Alert>
        <div className="row">
          <Link href="/" className="btn btn-ghost btn-sm">
            <IconArrowLeft size={14} /> Dashboard
          </Link>
          <Link href="/login" className="btn btn-primary btn-sm">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "var(--text-soft)" }}>{track?.title}</span>
      </nav>

      <section className="hero" style={{ padding: 28 }}>
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">
              <IconBook size={13} />
              Track · {lessons.length} lecciones
            </span>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)" }}>{track?.title}</h1>
            <p className="lead">{track?.description ?? "Ruta del plan de estudio full-stack."}</p>
            <div className="hero-actions">
              {lessons.length > 0 ? (
                canWrite ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const next =
                        lessons.find((l) => {
                          const s = progressByLesson.get(l.id)?.status;
                          return s === "in_progress";
                        }) ?? lessons.find((l) => progressByLesson.get(l.id)?.status !== "completed");
                      if (next) void openLesson(next);
                    }}
                  >
                    <IconPlay size={15} />
                    {active > 0 ? "Continuar track" : done > 0 ? "Seguir con la siguiente" : "Empezar track"}
                  </button>
                ) : (
                  <a href="#lecciones" className="btn btn-primary">
                    <IconBook size={16} />
                    Ver lecciones
                  </a>
                )
              ) : null}
              <Link href="/" className="btn btn-ghost">
                <IconArrowLeft size={15} />
                Volver
              </Link>
            </div>
            <div className="hero-chips">
              <span className="pill">
                <IconCheckCircle size={13} />
                {done} completadas
              </span>
              <span className="pill">
                <IconClock size={13} />
                {active} en curso
              </span>
              <span className="pill">
                <IconRefresh size={13} />
                {lessons.length - done - active} pendientes
              </span>
            </div>
          </div>

          <div style={{ minWidth: 220, width: 240 }}>
            <div className="row-between">
              <span className="tiny muted">Progreso del track</span>
              <strong style={{ fontSize: "1.05rem" }}>{Math.round(pct)}%</strong>
            </div>
            <div className="bar mt-2" style={{ height: 8 }}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="tiny muted mt-3">
              {done} de {lessons.length} lecciones completadas
            </p>
            <div className="bar-label" style={{ marginBottom: 0 }}>
              <span>Ritmo sugerido</span>
              <span>1 lección / día</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="lecciones">
        <div className="section-head">
          <div>
            <h2>Lecciones</h2>
            <p>
              {canWrite
                ? "Teoría breve, fallo provocado, reto y checklist."
                : "Teoría breve, fallo provocado, reto y checklist. Tu rol es de solo lectura."}
            </p>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm ${filter === f.id ? "btn-soft" : "btn-ghost"}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-3">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<IconSpark size={20} />}
              title="Sin lecciones en este filtro"
              description="Cambia el filtro para ver el resto de la ruta."
              action={
                <button className="btn btn-ghost btn-sm" onClick={() => setFilter("all")}>
                  Ver todas
                </button>
              }
            />
          </div>
        ) : (
          <div className="list card card-pad" style={{ gap: 0 }}>
            {visible.map((lesson) => {
              const p = progressByLesson.get(lesson.id);
              const status = p?.status ?? null;
              const isOpening = opening === lesson.id;
              return (
                <div key={lesson.id} className="list-row" style={{ padding: "16px 0" }}>
                  <span className="lesson-index" aria-hidden>
                    {status === "completed" ? (
                      <IconCheckCircle size={15} />
                    ) : (
                      String(lesson.order_index + 1).padStart(2, "0")
                    )}
                  </span>
                  <div className="list-main">
                    <div className="list-title">{lesson.title}</div>
                    <div className="list-sub" style={{ whiteSpace: "normal" }}>
                      {lesson.summary}
                    </div>
                    <div className="row mt-1" style={{ gap: 8 }}>
                      <span className="tiny muted row" style={{ gap: 4 }}>
                        <IconClock size={12} />
                        {lesson.estimated_minutes} min
                      </span>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${status === "completed" ? "btn-ghost" : "btn-soft"}`}
                    onClick={() => void openLesson(lesson)}
                    disabled={isOpening}
                    aria-label={`${!canWrite || p ? "Abrir" : "Empezar"} ${lesson.title}`}
                  >
                    {isOpening ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        {!canWrite || p ? (status === "completed" ? "Repasar" : p ? "Continuar" : "Abrir") : "Empezar"}
                        <IconArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
