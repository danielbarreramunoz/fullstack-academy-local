"use client";

import Link from "next/link";
import { useEffect } from "react";
import { IconAlert, IconRefresh } from "../components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card card-pad" style={{ maxWidth: 560, margin: "48px auto" }}>
      <span className="eyebrow">Algo se rompió</span>
      <h1 style={{ fontSize: "1.6rem", margin: "10px 0" }}>La interfaz encontró un error</h1>
      <div className="alert alert-danger" role="alert">
        <IconAlert size={16} />
        <span>{error.message || "Error inesperado al renderizar la página."}</span>
      </div>
      <div className="row mt-3">
        <button className="btn btn-primary" onClick={reset}>
          <IconRefresh size={15} />
          Reintentar
        </button>
        <Link href="/" className="btn btn-ghost">
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
