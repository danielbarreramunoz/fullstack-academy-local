"use client";
import { useState } from "react";
import { api } from "../../lib/api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("student@local.test");
  const [password, setPassword] = useState("student123");
  const [msg, setMsg] = useState("");
  return (
    <div>
      <h1>Login</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" style={{ display: "block", margin: 8 }} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="password" style={{ display: "block", margin: 8 }} />
      <button onClick={async () => { try { await api.login(email, password); setMsg("ok, ve al /"); } catch (e: any) { setMsg(e.message); } }}>Entrar</button>
      <p>{msg}</p>
    </div>
  );
}
