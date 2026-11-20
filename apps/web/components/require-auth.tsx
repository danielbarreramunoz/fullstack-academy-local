"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "../lib/session";

// Envuelve páginas privadas: sin sesión redirige a /login?next=<ruta>.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
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
