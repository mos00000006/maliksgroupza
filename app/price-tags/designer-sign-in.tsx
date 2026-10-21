"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { priceTagResponse } from "../lib/price-tag-response";
import styles from "./designer-sign-in.module.css";
export default function DesignerSignIn({ accessDenied = false }: { accessDenied?: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <main className={styles.page}><section className={styles.card}>
    <p className={styles.eyebrow}>PRICE TAG GENERATOR</p>
    <h1>Graphic designer sign in</h1>
    <p className={styles.intro}>{accessDenied ? "Your Hub account needs price tag manager access. Ask the Hub owner to update your access." : "Enter your username and password to open the PowerBuild and BusterBuild price tag templates."}</p>
    {!accessDenied && <form onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/price-tags/designer-session", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
        await priceTagResponse(response, "Could not sign in. Please try again.");
        setPassword(""); window.location.replace("/price-tags");
      } catch (error) { setPassword(""); setMessage(error instanceof Error ? error.message : "Could not sign in. Please try again."); setBusy(false); }
    }}>
      <label htmlFor="designer-username">Username</label>
      <input id="designer-username" name="username" autoComplete="username" autoCapitalize="words" value={username} onChange={e => setUsername(e.target.value)} maxLength={100} required disabled={busy} autoFocus />
      <label htmlFor="designer-password">Password</label>
      <input id="designer-password" name="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} maxLength={256} required disabled={busy} />
      {message && <p role="alert" className={styles.error}>{message}</p>}
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>}
    <Link href="/">Back to Hub</Link>
  </section></main>;
}
export function DesignerWorkspace({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <><div className={styles.sessionBar}><span>Graphic designer · Moses Moyana</span><button type="button" disabled={busy} onClick={async () => {
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/price-tags/designer-session", { method: "DELETE", credentials: "same-origin" }); if (!response.ok) throw new Error(); window.location.replace("/price-tags"); }
    catch { setMessage("Could not sign out. Please try again."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out of designer"}</button>{message && <span role="alert">{message}</span>}</div>{children}</>;
}
