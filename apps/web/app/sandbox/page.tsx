"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api-client";
import type { AuditLog, IdorResult, ProgressRow } from "../../lib/types";
import { Alert, EmptyState, TimeAgo } from "../../components/ui";
import {
  IconArrowLeft,
  IconClipboard,
  IconFlask,
  IconInfo,
  IconLock,
  IconRefresh,
  IconSearch,
  IconShield,
  IconShieldOff,
  IconTerminal,
} from "../../components/icons";

export default function SandboxPage() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<IdorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditForbidden, setAuditForbidden] = useState(false);

  async function loadAudit() {
    setAuditLoading(true);
    try {
      const logs = await api.auditMine();
      setAudit(logs);
      setAuditForbidden(false);
    } catch (e) {
      setAudit([]);
      setAuditForbidden(e instanceof ApiError && e.status === 403);
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadContext() {
    try {
      const rows = await api.progress();
      setProgress(rows);
    } catch {
      /* sin sesión: el formulario seguirá funcionando y mostrará 401 */
    }
    await loadAudit();
  }

  useEffect(() => {
    void loadContext();
  }, []);

  async function run() {
    if (!id.trim()) {
      setError("Pega un progressId antes de probar.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.idorDemo(id.trim());
      setResult(res);
      // refresca la auditoría para ver el rastro del intento
      void loadAudit();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Sesión no válida: inicia sesión para usar el laboratorio.");
      } else {
        setError(e instanceof Error ? e.message : "Error inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  function useMine() {
    if (progress.length === 0) {
      setError("Aún no tienes progreso. Empieza una lección para generar un progressId.");
      return;
    }
    setError("");
    setId(progress[0].id);
    setResult(null);
  }

  function useRandom() {
    setError("");
    const uuid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : "00000000-0000-4000-8000-000000000000";
    setId(uuid);
    setResult(null);
  }

  const tone = result ? (result.allowed ? "success" : "danger") : "info";

  return (
    <div>
      <header className="page-head">
        <div style={{ maxWidth: 700 }}>
          <span className="eyebrow">
            <IconFlask size={13} />
            Security lab
          </span>
          <h1>Laboratorio anti-IDOR</h1>
          <p className="lead">
            Comprueba que un recurso de otro usuario devuelve 403/404, sin filtrar datos, y queda
            registrado en <code className="mono">audit_logs</code>.
          </p>
          <div className="hero-chips">
            <span className="pill">
              <IconShield size={13} />
              Scope por <code className="mono">user_id</code>
            </span>
            <span className="pill">
              <IconClipboard size={13} />
              Auditoría de cada intento
            </span>
          </div>
        </div>
        <Link href="/" className="btn btn-ghost">
          <IconArrowLeft size={15} />
          Dashboard
        </Link>
      </header>

      <div className="lab-grid">
        <section className="card card-pad">
          <div className="row-between">
            <h2>Probar el bloqueo</h2>
            <span className="badge badge-neutral badge-sm">A2 · IDOR</span>
          </div>
          <p className="tiny muted mt-1">
            Pega un <code className="mono">progressId</code> ajeno (o genera uno inexistente) y observa
            la respuesta.
          </p>

          <div className="field mt-3">
            <label className="label" htmlFor="progress-id">
              progressId
            </label>
            <div className="input-wrap">
              <span className="input-icon">
                <IconSearch size={16} />
              </span>
              <input
                id="progress-id"
                className="input mono"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setResult(null);
                }}
                placeholder="00000000-0000-4000-8000-000000000000"
                spellCheck={false}
                autoComplete="off"
                style={{ fontSize: "0.8rem" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void run();
                }}
              />
            </div>
          </div>

          <div className="row mt-2">
            <button className="btn btn-ghost btn-sm" type="button" onClick={useMine}>
              Usar el mío
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={useRandom}>
              Generar UUID ajeno
            </button>
          </div>

          <button
            className="btn btn-primary btn-block mt-3"
            type="button"
            onClick={() => void run()}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <IconTerminal size={16} />}
            {loading ? "Comprobando…" : "Probar bloqueo"}
          </button>

          {error ? (
            <div className="mt-3">
              <Alert tone="danger">{error}</Alert>
            </div>
          ) : null}

          <hr className="divider" />

          <div className="result">
            <div className="result-head">
              <span className={`result-icon ${result ? (result.allowed ? "ok" : "ko") : "idle"}`}>
                {result ? (
                  result.allowed ? (
                    <IconShield size={19} />
                  ) : (
                    <IconShieldOff size={19} />
                  )
                ) : (
                  <IconInfo size={19} />
                )}
              </span>
              <div>
                <strong style={{ fontSize: "0.9rem" }}>
                  {result
                    ? result.allowed
                      ? "Acceso permitido"
                      : "Acceso bloqueado"
                    : "Esperando una prueba"}
                </strong>
                <div className="tiny muted">
                  {result
                    ? result.reason
                    : "El resultado se mostrará aquí, sin exponer datos ajenos."}
                </div>
              </div>
            </div>
            {result ? (
              <pre>
                {JSON.stringify(
                  { allowed: result.allowed, reason: result.reason, status: result.allowed ? 200 : 403 },
                  null,
                  2,
                )}
              </pre>
            ) : null}
          </div>

          <div className={`alert alert-${tone} mt-3`} role="note">
            <IconInfo size={16} />
            <span>
              {result && !result.allowed
                ? "El intento quedó registrado con acción sandbox.idor.blocked y status 403."
                : "Todo intento denegado deja una fila en audit_logs: acción, recurso, código y fecha."}
            </span>
          </div>
        </section>

        <aside className="stack">
          <section className="card card-pad">
            <h2>Cómo funciona</h2>
            <div className="lab-steps mt-2">
              <div className="lab-step">
                <span className="lab-step-num">1</span>
                <div>
                  <strong>Elige un progressId</strong>
                  <span>El tuyo o uno generado que no exista.</span>
                </div>
              </div>
              <div className="lab-step">
                <span className="lab-step-num">2</span>
                <div>
                  <strong>La API filtra por user_id</strong>
                  <span>
                    Query parametrizada: <code className="mono">WHERE id=$1 AND user_id=$2</code>.
                  </span>
                </div>
              </div>
              <div className="lab-step">
                <span className="lab-step-num">3</span>
                <div>
                  <strong>Se registra el intento</strong>
                  <span>403/404 + fila en audit_logs, sin devolver el recurso.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="row-between">
              <h2>Mis progressId</h2>
              <span className="badge badge-neutral badge-sm">{progress.length}</span>
            </div>
            <p className="tiny muted mt-1">
              Usa uno propio para ver el caso permitido y compara con el bloqueado.
            </p>
            {progress.length === 0 ? (
              <p className="tiny muted mt-2">
                Sin progreso todavía.{" "}
                <Link href="/" className="tiny">
                  Empieza una lección
                </Link>
                .
              </p>
            ) : (
              <div className="stack mt-2" style={{ gap: 8 }}>
                {progress.slice(0, 3).map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="check-item"
                    onClick={() => {
                      setId(row.id);
                      setResult(null);
                      setError("");
                    }}
                    style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: "0.7rem" }}
                    title={row.id}
                  >
                    <span className="check-box" style={{ borderStyle: "dashed" }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Audit log</h2>
            <p>Últimos 100 eventos de tu cuenta, más recientes primero.</p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => void loadAudit()}
            disabled={auditLoading}
          >
            {auditLoading ? <span className="spinner" /> : <IconRefresh size={14} />}
            Refrescar
          </button>
        </div>

        {auditLoading ? (
          <div className="skeleton" style={{ height: 160, borderRadius: 16 }} aria-hidden />
        ) : auditForbidden ? (
          <div className="card">
            <EmptyState
              icon={<IconLock size={20} />}
              title="Auditoría restringida"
              description="Tu rol no incluye la capability audit:read. Entra como mentor o admin para inspeccionar los eventos."
            />
          </div>
        ) : audit.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<IconClipboard size={20} />}
              title="Sin eventos de auditoría"
              description="Todavía no hay registros. Prueba el laboratorio y refresca la lista."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Recurso</th>
                  <th>Estado</th>
                  <th>Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((log) => (
                  <tr key={log.id}>
                    <td className="mono" style={{ color: "var(--text)", fontSize: "0.76rem" }}>
                      {log.action}
                    </td>
                    <td>
                      <span className="badge badge-neutral badge-sm">{log.resource_type}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.status_code < 300
                            ? "badge-success"
                            : log.status_code < 500
                              ? "badge-warning"
                              : "badge-danger"
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td>
                      <TimeAgo value={log.created_at} />
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
