export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui", margin: 0, background: "#0b0f14", color: "#e8eef4" }}>
        <header style={{ padding: 16, borderBottom: "1px solid #26303a" }}>
          <strong>Academy local</strong> · estudio diario full-stack
        </header>
        <main style={{ padding: 24, maxWidth: 900 }}>{children}</main>
      </body>
    </html>
  );
}
