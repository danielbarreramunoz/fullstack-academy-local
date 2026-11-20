import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "../components/app-header";

export const metadata: Metadata = {
  title: "Academy — estudio full-stack",
  description: "Estudio diario full-stack: tracks, lecciones, progreso y laboratorio anti-IDOR.",
};

export const viewport: Viewport = {
  themeColor: "#070b11",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("academy-theme");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="shell">
          <AppHeader />
          <main className="main">
            <div className="container">{children}</div>
          </main>
          <footer className="footer">
            <div className="container footer-inner">
              <span>
                <span className="footer-dot" />
                Academy local · sesión de 30–60 min
              </span>
              <span className="mono">pnpm dev · web :3000 · api :3001</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
