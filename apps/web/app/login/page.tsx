"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "../../lib/api-client";
import { Alert } from "../../components/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconFlask,
  IconLock,
  IconMail,
  IconShield,
  IconSpark,
} from "../../components/icons";

const DEMOS = [
  { email: "student@local.test", password: "student123", role: "student" },
  { email: "mentor@local.test", password: "mentor1234", role: "mentor" },
  { email: "admin@local.test", password: "admin12345", role: "admin" },
];

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="stack mt-4" aria-hidden>
          <div className="skeleton" style={{ height: 62 }} />
          <div className="skeleton" style={{ height: 62 }} />
          <div className="skeleton" style={{ height: 40 }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/";
  const [email, setEmail] = useState("student@local.test");
  const [password, setPassword] = useState("student123");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .me()
      .then(() => {
        if (active) router.replace(next);
      })
      .catch(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [router, next]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      await api.login(email.trim(), password);
      router.push(next);
      router.refresh();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setMsg(
        /invalid credentials/i.test(raw)
          ? "Email o contraseña incorrectos."
          : raw || "No se pudo iniciar sesión",
      );
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth-copy">
        <span className="eyebrow">
          <IconSpark size={13} />
          Acceso al estudio
        </span>
        <h1>
          Tu plan full-stack, <span className="gradient-text">en orden.</span>
        </h1>
        <p className="lead">
          Retoma donde lo dejaste: tracks, lecciones con laboratorio y un registro de progreso que
          puedes auditar.
        </p>

        <div className="auth-list">
          <div className="auth-item">
            <span className="auth-check">
              <IconCheck size={13} />
            </span>
            <div>
              <strong>Ruta de 25 lecciones</strong>
              <span>Cinco tracks con teoría breve, fallo provocado y reto final.</span>
            </div>
          </div>
          <div className="auth-item">
            <span className="auth-check">
              <IconCheck size={13} />
            </span>
            <div>
              <strong>Progreso persistente</strong>
              <span>Estados, notas y repasos programados sobre PostgreSQL.</span>
            </div>
          </div>
          <div className="auth-item">
            <span className="auth-check">
              <IconShield size={13} />
            </span>
            <div>
              <strong>Seguridad verificable</strong>
              <span>Laboratorio anti-IDOR con auditoría de cada intento.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card auth-card">
        <span className="eyebrow eyebrow-violet">Iniciar sesión</span>
        <h2 className="mt-1">Bienvenido de vuelta</h2>
        <p className="tiny muted mt-1">
          Usa una cuenta demo o las credenciales que ya tengas.
        </p>

        {checking ? (
          <div className="stack mt-4" aria-hidden>
            <div className="skeleton" style={{ height: 62 }} />
            <div className="skeleton" style={{ height: 62 }} />
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {msg ? <Alert tone="danger">{msg}</Alert> : null}

            <label className="field">
              <span className="label">Email</span>
              <span className="input-wrap">
                <span className="input-icon">
                  <IconMail size={16} />
                </span>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  aria-label="Email"
                />
              </span>
            </label>

            <label className="field">
              <span className="label">Contraseña</span>
              <span className="input-wrap">
                <span className="input-icon">
                  <IconLock size={16} />
                </span>
                <input
                  className="input"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mínimo 8 caracteres"
                  aria-label="Contraseña"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="input-affix"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </span>
            </label>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar <IconArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-divider">cuentas demo</div>
        <div className="demo-chips">
          {DEMOS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className="demo-chip"
              onClick={() => {
                setEmail(demo.email);
                setPassword(demo.password);
                setMsg("");
              }}
              title={`Rellenar ${demo.role}`}
            >
              {demo.role}
            </button>
          ))}
        </div>
        <p className="tiny muted mt-2">
          Un clic rellena email y contraseña de la cuenta demo.
        </p>

        <div className="row-between mt-4">
          <Link href="/" className="row tiny" style={{ gap: 6 }}>
            <IconArrowLeft size={14} />
            Volver al dashboard
          </Link>
          <Link href="/sandbox" className="row tiny" style={{ gap: 6 }}>
            <IconFlask size={14} />
            Security lab
          </Link>
        </div>
      </section>
    </div>
  );
}
