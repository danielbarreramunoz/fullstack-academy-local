"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../../lib/api-client";
import type { Lesson, ProgressRow, Track } from "../../../lib/types";
import { Alert, EmptyState, Markdown, StatusBadge, TimeAgo } from "../../../components/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconClipboard,
  IconNotes,
  IconPlay,
  IconRefresh,
  IconSpark,
  IconTerminal,
} from "../../../components/icons";

type Phase = "loading" | "ready" | "missing" | "error";

function checklistItems(checklist: Lesson["checklist_json"]): string[] {
  if (!checklist) return [];
  if (Array.isArray(checklist)) return checklist.filter((i): i is string => typeof i === "string");
  if (Array.isArray(checklist.items)) return checklist.items;
  return [];
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const lessonId = params?.id;

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [progress, setProgress] = useState<ProgressRow | null>(null);
  const [siblings, setSiblings] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<"" | "start" | "complete" | "reopen" | "notes">("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    (async () => {
      try {
        const found = await api.lesson(lessonId);
        if (!active) return;
        if (!found) {
          setPhase("missing");
          return;
        }
        setLesson(found);
        const [progressRows, tracks, siblingRows] = await Promise.all([
          api.progress(),
          api.tracks(),
          api.lessonsByTrack(found.track_id),
        ]);
        if (!active) return;
        const mine = progressRows.find((p) => p.lesson_id === found.id) ?? null;
        setProgress(mine);
        setNotes(mine?.notes_md ?? "");
        setSavedNotes(mine?.notes_md ?? "");
        setTrack(tracks.find((t) => t.id === found.track_id) ?? null);
        setSiblings(siblingRows);
        setPhase("ready");
      } catch (e) {
        if (!active) return;
        setError(
          e instanceof ApiError && e.status === 401
            ? "Necesitas iniciar sesión para abrir esta lección."
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
  }, [lessonId]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const position = useMemo(() => {
    if (!lesson) return { index: -1, total: siblings.length };
    return { index: siblings.findIndex((l) => l.id === lesson.id), total: siblings.length };
  }, [lesson, siblings]);

  const prev = position.index > 0 ? siblings[position.index - 1] : null;
  const next =
    position.index >= 0 && position.index < siblings.length - 1 ? siblings[position.index + 1] : null;

  const items = lesson ? checklistItems(lesson.checklist_json) : [];
  const checkedCount = items.filter((_, i) => checked[i]).length;
  const dirty = notes !== savedNotes;

  async function start() {
    if (!lesson) return;
    setBusy("start");
    setActionError("");
    try {
      const row = await api.startProgress(lesson.id);
      setProgress(row);
      setNotice("Lección iniciada. ¡A por ella!");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No se pudo iniciar la lección");
    } finally {
      setBusy("");
    }
  }

  async function complete() {
    if (!lesson) return;
    setBusy("complete");
    setActionError("");
    try {
      let row = progress;
      if (!row) {
        row = await api.startProgress(lesson.id);
      }
      const updated = await api.updateProgress(row.id, { status: "completed" });
      setProgress(updated);
      setNotice("Lección completada. Repaso programado en 3 días.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No se pudo completar la lección");
    } finally {
      setBusy("");
    }
  }

  async function reopen() {
    if (!progress) return;
    setBusy("reopen");
    setActionError("");
    try {
      const updated = await api.updateProgress(progress.id, { status: "in_progress" });
      setProgress(updated);
      setNotice("Lección reabierta como en curso.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No se pudo actualizar la lección");
    } finally {
      setBusy("");
    }
  }

  async function saveNotes() {
    if (!lesson) return;
    setBusy("notes");
    setActionError("");
    try {
      let row = progress;
      if (!row) {
        row = await api.startProgress(lesson.id);
      }
      const updated = await api.updateProgress(row.id, { notes_md: notes });
      setProgress(updated);
      setSavedNotes(notes);
      setNotice("Notas guardadas.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No se pudieron guardar las notas");
    } finally {
      setBusy("");
    }
  }

  if (phase === "loading") {
    return (
      <div className="stack" style={{ gap: 18 }}>
        <div className="skeleton" style={{ height: 16, width: 260 }} />
        <div className="skeleton" style={{ height: 34, width: "62%" }} />
        <div className="detail-grid">
          <div className="skeleton" style={{ height: 420, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (phase === "missing") {
    return (
      <div className="card card-pad" style={{ maxWidth: 520, margin: "40px auto" }}>
        <EmptyState
          icon={<IconBook size={20} />}
          title="Lección no encontrada"
          description="El identificador no corresponde a ninguna lección del currículo."
          action={
            <Link href="/" className="btn btn-soft btn-sm">
              <IconArrowLeft size={14} /> Volver al dashboard
            </Link>
          }
        />
      </div>
    );
  }

  if (phase === "error" || !lesson) {
    return (
      <div className="card card-pad stack" style={{ maxWidth: 560, margin: "40px auto" }}>
        <span className="eyebrow">No disponible</span>
        <h1 style={{ fontSize: "1.35rem" }}>No se pudo abrir la lección</h1>
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

  const status = progress?.status ?? null;

  return (
    <div>
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Dashboard</Link>
        <span>/</span>
        {track ? <Link href={`/tracks/${track.id}`}>{track.title}</Link> : <span>Track</span>}
        <span>/</span>
        <span style={{ color: "var(--text-soft)" }}>Lección {position.index + 1}</span>
      </nav>

      <header className="page-head">
        <div style={{ maxWidth: 720 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="eyebrow">
              <IconBook size={13} />
              Lección {position.index >= 0 ? position.index + 1 : "—"} de {position.total || "—"}
            </span>
            <StatusBadge status={status} />
          </div>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
          <div className="hero-chips">
            <span className="pill">
              <IconClock size={13} />
              {lesson.estimated_minutes} min
            </span>
            {progress?.updated_at ? (
              <span className="pill">
                <IconRefresh size={13} />
                Actualizada <TimeAgo value={progress.updated_at} />
              </span>
            ) : (
              <span className="pill">
                <IconSpark size={13} />
                Sin empezar
              </span>
            )}
            {progress?.next_review_at ? (
              <span className="pill">
                <IconRefresh size={13} />
                Repaso {formatDate(progress.next_review_at)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="row">
          {status === "completed" ? (
            <button className="btn btn-ghost" onClick={reopen} disabled={busy !== ""}>
              {busy === "reopen" ? <span className="spinner" /> : <IconRefresh size={15} />}
              Reabrir
            </button>
          ) : status ? (
            <button className="btn btn-primary" onClick={complete} disabled={busy !== ""}>
              {busy === "complete" ? <span className="spinner" /> : <IconCheck size={16} />}
              Marcar completada
            </button>
          ) : (
            <button className="btn btn-primary" onClick={start} disabled={busy !== ""}>
              {busy === "start" ? <span className="spinner" /> : <IconPlay size={15} />}
              Empezar lección
            </button>
          )}
        </div>
      </header>

      {notice ? (
        <div className="mb-3">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-3">
          <Alert tone="danger">{actionError}</Alert>
        </div>
      ) : null}

      <div className="detail-grid">
        <article className="card article">
          <Markdown source={lesson.theory_md} />

          {lesson.lab_prompt ? (
            <section className="mt-4">
              <hr className="divider" />
              <div className="row" style={{ gap: 8 }}>
                <span className="kpi-icon">
                  <IconTerminal size={16} />
                </span>
                <h2 style={{ fontSize: "1.02rem" }}>Laboratorio</h2>
              </div>
              <p className="soft tiny mt-1" style={{ lineHeight: 1.7 }}>
                {lesson.lab_prompt}
              </p>
            </section>
          ) : null}

          <div className="row-between mt-4" style={{ paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            {prev ? (
              <Link href={`/lessons/${prev.id}`} className="btn btn-ghost btn-sm">
                <IconArrowLeft size={14} />
                Anterior
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/lessons/${next.id}`} className="btn btn-soft btn-sm">
                Siguiente
                <IconArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </article>

        <aside className="stack">
          <section className="card card-pad">
            <div className="row-between">
              <h2>Tu progreso</h2>
              <StatusBadge status={status} />
            </div>
            <div className="list mt-2">
              <div className="list-row">
                <span className="lesson-index">
                  <IconCheckCircle size={14} />
                </span>
                <div className="list-main">
                  <div className="list-sub">Estado</div>
                  <div className="list-title" style={{ textTransform: "capitalize" }}>
                    {status === "in_progress" ? "En curso" : status === "completed" ? "Completada" : "Sin empezar"}
                  </div>
                </div>
              </div>
              <div className="list-row">
                <span className="lesson-index">
                  <IconClock size={14} />
                </span>
                <div className="list-main">
                  <div className="list-sub">Completada</div>
                  <div className="list-title">{formatDate(progress?.completed_at ?? null)}</div>
                </div>
              </div>
              <div className="list-row">
                <span className="lesson-index">
                  <IconRefresh size={14} />
                </span>
                <div className="list-main">
                  <div className="list-sub">Próximo repaso</div>
                  <div className="list-title">{formatDate(progress?.next_review_at ?? null)}</div>
                </div>
              </div>
            </div>

            <div className="mt-2">
              {status === "completed" ? (
                <button className="btn btn-ghost btn-block" onClick={reopen} disabled={busy !== ""}>
                  <IconRefresh size={15} /> Volver a practicar
                </button>
              ) : status ? (
                <button className="btn btn-primary btn-block" onClick={complete} disabled={busy !== ""}>
                  {busy === "complete" ? <span className="spinner" /> : <IconCheck size={16} />}
                  Marcar completada
                </button>
              ) : (
                <button className="btn btn-primary btn-block" onClick={start} disabled={busy !== ""}>
                  {busy === "start" ? <span className="spinner" /> : <IconPlay size={15} />}
                  Empezar lección
                </button>
              )}
            </div>
          </section>

          <section className="card card-pad">
            <div className="row-between">
              <h2 className="row" style={{ gap: 8 }}>
                <IconClipboard size={16} />
                Checklist
              </h2>
              <span className="badge badge-neutral badge-sm">
                {checkedCount}/{items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="tiny muted mt-2">Esta lección no tiene checklist.</p>
            ) : (
              <>
                <div className="bar mt-2">
                  <span style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }} />
                </div>
                <div className="checklist mt-2">
                  {items.map((item, i) => (
                    <label key={i} className="check-item" data-done={Boolean(checked[i])}>
                      <span className="check-box">
                        <IconCheck size={11} />
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(checked[i])}
                        onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                <p className="tiny muted mt-2">
                  Marca la checklist al terminar el laboratorio. Es tu propio control de salida.
                </p>
              </>
            )}
          </section>

          <section className="card card-pad">
            <div className="row-between">
              <h2 className="row" style={{ gap: 8 }}>
                <IconNotes size={16} />
                Notas
              </h2>
              {dirty ? <span className="badge badge-warning badge-sm">sin guardar</span> : null}
            </div>
            <textarea
              className="textarea mt-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={"Qué aprendí, qué fallo provoqué, qué me falta…"}
              aria-label="Notas de la lección"
            />
            <button
              className="btn btn-soft btn-sm btn-block mt-2"
              onClick={saveNotes}
              disabled={busy !== "" || !dirty}
            >
              {busy === "notes" ? <span className="spinner" /> : <IconNotes size={14} />}
              Guardar notas
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
