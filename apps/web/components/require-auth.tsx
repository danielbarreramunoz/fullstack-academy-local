"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "../lib/session";

// Envuelve páginas privadas: sin sesión redirige a /login?next=<ruta>.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, refresh } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  // Revalida una vez: el contexto puede estar desactualizado (p. ej. login en
  // otra pestaña) y redirigir con user=null obsoleto causa bucles.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!loading && !user) await refresh();
      if (active) setVerified(true);
    })();
    return () => {
      active = false;
    };
  }, [loading, user, refresh]);

  useEffect(() => {
    if (verified && !loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
    }
  }, [verified, loading, user, pathname, router]);

  if (loading || !verified || !user) {
    return (
      <div className="stack" style={{ gap: 18 }} aria-hidden>
        <div className="skeleton" style={{ height: 34, width: "40%" }} />
        <div className="skeleton skeleton-card" style={{ height: 220 }} />
        <div className="skeleton skeleton-card" style={{ height: 160 }} />
      </div>
    );
  }

  return <>{children}</>;
}
