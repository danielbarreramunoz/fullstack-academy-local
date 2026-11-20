"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api-client";
import type { Me } from "../lib/types";
import { IconFlask, IconGrid, IconLogo, IconLogout, IconMoon, IconSun } from "./icons";

type Theme = "dark" | "light";

const links = [
  { href: "/", label: "Dashboard", icon: IconGrid },
  { href: "/sandbox", label: "Security lab", icon: IconFlask },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((res) => {
        if (active) {
          setMe(res.user);
          setMeLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setMe(null);
          setMeLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("academy-theme", next);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await api.logout();
    } catch {
      /* la cookie puede seguir viva si la API no responde */
    }
    setMe(null);
    setBusy(false);
    router.push("/login");
    router.refresh();
  }

  const initials = me?.email?.slice(0, 2).toUpperCase() ?? "AL";

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand" aria-label="Academy, ir al dashboard">
          <span className="brand-mark">
            <IconLogo size={21} />
          </span>
          <span className="brand-text">
            <span className="brand-name">Academy</span>
            <span className="brand-sub">estudio full-stack</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Navegación principal">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/" || pathname.startsWith("/tracks") || pathname.startsWith("/lessons")
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="topbar-right">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
          >
            {mounted && theme === "light" ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>

          {pathname === "/login" ? null : !mounted || !meLoaded ? (
            <span
              className="skeleton"
              style={{ width: 108, height: 38, borderRadius: 999 }}
              aria-hidden
            />
          ) : me ? (
            <div className="row" style={{ gap: 8 }}>
              <div className="user-chip" title={`${me.email} · ${me.role}`}>
                <span className="avatar">{initials}</span>
                <span className="user-meta">
                  <span className="user-email">{me.email}</span>
                  <span className="user-role">{me.role}</span>
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={logout}
                disabled={busy}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                {busy ? <span className="spinner" /> : <IconLogout size={17} />}
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-soft btn-sm">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
