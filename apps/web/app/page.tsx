"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api-client";
import type { Me, ProgressRow, Track } from "../lib/types";
import {
  Alert,
  EmptyState,
  KpiSkeleton,
  Ring,
  SkeletonList,
  StatusBadge,
  TimeAgo,
} from "../components/ui";
import {
  IconArrowRight,
  IconBook,
  IconCheckCircle,
  IconClock,
  IconFlask,
  IconGrid,
  IconPlay,
  IconRefresh,
  IconShield,
  IconSpark,
  IconTarget,
} from "../components/icons";

type Phase = "loading" | "anon" | "ready" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [today, setToday] = useState("");

  async function load() {
    setPhase("loading");
    setError("");
    try {
      const res = await api.me();
      setMe(res.user);
      const [trackRows, progressRows] = await Promise.all([api.tracks(), api.progress()]);
      setTracks(trackRows);
      setProgress(progressRows);
      setPhase("ready");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setPhase("anon");
        return;
      }
      setError(e instanceof Error ? e.message : "Error inesperado");
      setPhase("error");
    }
  }

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
    void load();
  }, []);

  if (phase === "loading") {
    return (
      <div className="stack" style={{ gap: 20 }}>
        <div className="skeleton skeleton-card" style={{ height: 230 }} />
        <KpiSkeleton />
        <div className="dash-grid">
          <div className="track-grid" aria-hidden>
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
          <div className="card card-pad" aria-hidden>
            <SkeletonList rows={3} />
          </div>
        </div>
      </div>
    );
  }

  if (phase === "anon") {
    return <Landing />;
  }

  if (phase === "error") {
    return (
      <div className="card card-pad stack" style={{ maxWidth: 560, margin: "40px auto" }}>
        <span className="eyebrow">Sin conexión</span>
        <h1 style={{ fontSize: "1.4rem" }}>No se pudo cargar el dashboard</h1>
        <Alert tone="danger">{error}</Alert>
        <p className="lead">
          Arranca la API con <code className="mono">pnpm --filter @academy/api dev</code> y vuelve a
          intentar.
        </p>
        <button className="btn btn-primary" onClick={() => void load()}>
          <IconRefresh size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  const totalLessons = tracks.reduce((acc, t) => acc + (t.lessons_count ?? 0), 0);
  const completed = progress.filter((p) => p.status === "completed");
  const inProgress = progress.filter((p) => p.status === "in_progress");
  const pending = progress.filter((p) => p.status === "pending");
  const overall = totalLessons > 0 ? (completed.length / totalLessons) * 100 : 0;

  const now = Date.now();
  const reviews = completed
    .filter((p) => p.next_review_at)
    .sort((a, b) => +new Date(a.next_review_at!) - +new Date(b.next_review_at!));
  const dueReviews = reviews.filter((p) => +new Date(p.next_review_at!) <= now + 86400000);

  const todayDone = completed.filter(
    (p) => p.completed_at && new Date(p.completed_at).toDateString() === new Date().toDateString(),
  ).length;

  const continueItem = inProgress[0] ?? progress.find((p) => p.status !== "completed") ?? null;
  const recent = [...progress]
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 6);

  const firstName = me?.email?.split("@")[0] ?? "estudiante";
  const niceName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">
              <IconSpark size={13} />
              Sesión de hoy{today ? ` · ${today}` : ""}
            </span>
            <h1>
              Hola, {niceName}. <span className="gradient-text">Hoy toca avanzar.</span>
            </h1>
            <p className="lead">
              Una lección, un concepto, un fallo que provoques y un reto que resuelvas. Nada de
              tutoriales infinitos: progreso verificable en 30–60 minutos.
            </p>
            <div className="hero-actions">
              {continueItem ? (
                <Link href={`/lessons/${continueItem.lesson_id}`} className="btn btn-primary">
                  <IconPlay size={15} />
                  {continueItem.status === "in_progress" ? "Continuar lección" : "Empezar siguiente"}
                </Link>
              ) : (
                <a href="#tracks" className="btn btn-primary">
                  <IconBook size={16} />
                  Explorar tracks
                </a>
              )}
              <Link href="/sandbox" className="btn btn-ghost">
                <IconFlask size={16} />
                Security lab
              </Link>
            </div>
            <div className="hero-chips">
              <span className="pill">
                <IconTarget size={13} />
                Meta diaria: 1 lección
              </span>
              <span className="pill">
                <IconCheckCircle size={13} />
                {todayDone} completada{todayDone === 1 ? "" : "s"} hoy
              </span>
              <span className="pill">
                <IconBook size={13} />
                {completed.length}/{totalLessons} del plan
              </span>
            </div>
          </div>
          <Ring value={overall} label="Plan completado" />
        </div>
      </section>

      <div className="section" style={{ marginTop: 20 }}>
        <div className="kpi-grid">
          <div className="card card-pad kpi">
            <div className="kpi-top">
              <span>Completadas</span>
              <span className="kpi-icon green">
                <IconCheckCircle size={16} />
              </span>
            </div>
            <div className="kpi-value">{completed.length}</div>
            <div className="kpi-sub">de {totalLessons} lecciones</div>
          </div>
          <div className="card card-pad kpi">
            <div className="kpi-top">
              <span>En curso</span>
              <span className="kpi-icon amber">
                <IconClock size={16} />
              </span>
            </div>
            <div className="kpi-value">{inProgress.length}</div>
            <div className="kpi-sub">retomar sin fricción</div>
          </div>
          <div className="card card-pad kpi">
            <div className="kpi-top">
              <span>Tracks</span>
              <span className="kpi-icon">
                <IconGrid size={16} />
              </span>
            </div>
            <div className="kpi-value">{tracks.length}</div>
            <div className="kpi-sub">ruta full-stack</div>
          </div>
          <div className="card card-pad kpi">
            <div className="kpi-top">
              <span>Repasos</span>
              <span className="kpi-icon violet">
                <IconRefresh size={16} />
              </span>
            </div>
            <div className="kpi-value">{dueReviews.length}</div>
            <div className="kpi-sub">{pending.length} pendientes por empezar</div>
          </div>
        </div>
      </div>

      <div className="dash-grid section">
        <section id="tracks">
          <div className="section-head">
            <div>
              <h2>Tracks</h2>
              <p>Cinco rutas, veinticinco lecciones. Elige dónde seguir.</p>
            </div>
            <span className="pill">
              <IconBook size={13} />
              {totalLessons} lecciones
            </span>
          </div>

          {tracks.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<IconBook size={20} />}
                title="Todavía no hay tracks"
                description="Ejecuta el seed del currículo para cargar las rutas de estudio."
              />
            </div>
          ) : (
            <div className="track-grid">
              {tracks.map((track) => {
                const done = progress.filter(
                  (p) => p.track_id === track.id && p.status === "completed",
                ).length;
                const active = progress.filter(
                  (p) => p.track_id === track.id && p.status === "in_progress",
                ).length;
                const pct = track.lessons_count > 0 ? (done / track.lessons_count) * 100 : 0;
                return (
                  <Link key={track.id} href={`/tracks/${track.id}`} className="card card-hover track-card">
                    <span className="track-accent" />
                    <div className="track-top">
                      <h3>{track.title}</h3>
                      {active > 0 ? <span className="badge badge-warning">{active} en curso</span> : null}
                    </div>
                    <p className="track-desc">{track.description ?? "Track del plan de estudio."}</p>
                    <div className="bar-label">
                      <span>
                        {done} / {track.lessons_count} lecciones
                      </span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="track-foot mt-2">
                      <span>{track.lessons_count} lecciones</span>
                      <span className="row" style={{ gap: 5 }}>
                        Explorar <IconArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="stack">
          <div className="card card-pad">
            <div className="row-between">
              <h2>Continuar</h2>
              <IconPlay size={15} />
            </div>
            {continueItem ? (
              <div className="mt-2">
                <div className="list">
                  <div className="list-row">
                    <span className="lesson-index">
                      <IconPlay size={14} />
                    </span>
                    <div className="list-main">
                      <div className="list-title">{continueItem.lesson_title ?? "Lección"}</div>
                      <div className="list-sub">
                        <StatusBadge status={continueItem.status} />
                      </div>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/lessons/${continueItem.lesson_id}`}
                  className="btn btn-soft btn-sm btn-block mt-2"
                >
                  Abrir lección <IconArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={<IconPlay size={19} />}
                title="Nada en curso"
                description="Abre un track y empieza una lección para verla aquí."
              />
            )}
          </div>

          <div className="card card-pad">
            <div className="row-between">
              <h2>Repaso programado</h2>
              <span className="badge badge-neutral badge-sm">{reviews.length}</span>
            </div>
            {reviews.length === 0 ? (
              <EmptyState
                icon={<IconRefresh size={19} />}
                title="Sin repasos"
                description="Al completar lecciones se programan repasos a 3 días."
              />
            ) : (
              <div className="list mt-2">
                {reviews.slice(0, 4).map((item) => {
                  const due = +new Date(item.next_review_at!) <= now;
                  return (
                    <Link
                      key={item.id}
                      href={`/lessons/${item.lesson_id}`}
                      className="list-row"
                      style={{ color: "inherit" }}
                    >
                      <span className="lesson-index">
                        <IconRefresh size={13} />
                      </span>
                      <div className="list-main">
                        <div className="list-title">{item.lesson_title}</div>
                        <div className="list-sub">
                          {due ? "Toca repasar hoy" : "Programado"}
                        </div>
                      </div>
                      <span className={`badge ${due ? "badge-warning" : "badge-neutral"}`}>
                        {due ? "Hoy" : new Date(item.next_review_at!).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card card-pad">
            <div className="row-between">
              <h2>Security lab</h2>
              <IconShield size={16} />
            </div>
            <p className="tiny muted mt-1">
              Comprueba con tus propias manos que un <code className="mono">progressId</code> ajeno
              devuelve 403/404 y deja rastro en <code className="mono">audit_logs</code>.
            </p>
            <Link href="/sandbox" className="btn btn-ghost btn-sm btn-block mt-2">
              <IconFlask size={14} />
              Abrir laboratorio
            </Link>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Actividad reciente</h2>
            <p>Últimos cambios de progreso registrados.</p>
          </div>
          <span className="pill">
            <IconClock size={13} />
            {progress.length} registros
          </span>
        </div>
        {recent.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<IconSpark size={20} />}
              title="Aún no hay actividad"
              description="Empieza una lección: el progreso aparece aquí al instante."
              action={
                <a href="#tracks" className="btn btn-soft btn-sm">
                  Elegir un track
                </a>
              }
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lección</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: "var(--text)" }}>
                      <Link href={`/lessons/${item.lesson_id}`}>{item.lesson_title ?? "Lección"}</Link>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <TimeAgo value={item.updated_at} />
                    </td>
                    <td className="text-right">
                      <Link href={`/lessons/${item.lesson_id}`} className="btn btn-ghost btn-sm">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Landing() {
  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">
              <IconSpark size={13} />
              Academy local
            </span>
            <h1>
              Full-stack en sesiones cortas. <span className="gradient-text">Sin ruido.</span>
            </h1>
            <p className="lead">
              Una ruta guiada de cinco tracks y veinticinco lecciones. Cada sesión combina teoría,
              un fallo que provocas, un reto y una checklist de salida.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary">
                Entrar al dashboard <IconArrowRight size={15} />
              </Link>
              <Link href="/sandbox" className="btn btn-ghost">
                <IconFlask size={16} />
                Ver security lab
              </Link>
            </div>
            <div className="hero-chips">
              <span className="pill">
                <IconTarget size={13} />
                30–60 min al día
              </span>
              <span className="pill">
                <IconBook size={13} />
                5 tracks · 25 lecciones
              </span>
              <span className="pill">
                <IconShield size={13} />
                Anti-IDOR por diseño
              </span>
            </div>
          </div>
          <Ring value={0} label="Tu progreso" />
        </div>
      </section>

      <section className="section">
        <div className="feature-grid">
          <article className="card card-pad">
            <span className="kpi-icon">
              <IconBook size={17} />
            </span>
            <h3 className="mt-3">Ruta guiada</h3>
            <p className="tiny muted mt-1">
              Tracks ordenados de fundamentos a producción. Cada lección con teoría breve, laboratorio
              y checklist.
            </p>
          </article>
          <article className="card card-pad">
            <span className="kpi-icon violet">
              <IconShield size={17} />
            </span>
            <h3 className="mt-3">Seguridad real</h3>
            <p className="tiny muted mt-1">
              Laboratorio anti-IDOR con auditoría. Comprueba el bloqueo 403/404 sobre recursos ajenos.
            </p>
          </article>
          <article className="card card-pad">
            <span className="kpi-icon green">
              <IconCheckCircle size={17} />
            </span>
            <h3 className="mt-3">Progreso medible</h3>
            <p className="tiny muted mt-1">
              Estados pending, in_progress y completed, notas por lección y repasos programados.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
