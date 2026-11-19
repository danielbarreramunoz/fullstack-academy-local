"use client";
import { useState } from "react";
import { api } from "../../lib/api-client";

export default function SandboxPage() {
  const [id, setId] = useState("");
  const [out, setOut] = useState("");
  return (
    <div>
      <h1>Security lab — anti-IDOR</h1>
      <p>Pega un <code>progressId</code> de otro usuario (DevTools) y verifica el bloqueo 403/404 + audit_logs.</p>
      <input value={id} onChange={(e) => setId(e.target.value)} placeholder="progressId" style={{ width: 360 }} />
      <button onClick={async () => { try { setOut(JSON.stringify(await api.idorDemo(id))); } catch (e: any) { setOut(e.message); } }}>Probar</button>
      <pre>{out}</pre>
    </div>
  );
}
