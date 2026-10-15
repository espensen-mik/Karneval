"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnPath } from "@/lib/research-session";
import UiIcon from "./ui-icon";
import Image from "next/image";
import KarmanautCredit from "./karmanaut-credit";
export default function LoginForm({ background }: { background: string | null }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter(), search = useSearchParams();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: data.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login fejlede.");
      router.replace(safeReturnPath(search.get("next"))); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Prøv igen."); setBusy(false); }
  }
  return <div className="research-login">
    {background && <Image className="login-background" src={background} alt="" fill priority sizes="100vw" />}
    <div className="login-shade" />
    <div className="login-card">
      <h1>Sjælen af Karneval</h1>
      <p>Her får du adgang til Sjælen af Aalborg Karneval... hvis du altså har det rigtige password</p>
      <form onSubmit={submit}>
        <label className="form-field"><span className="survey-sr-only">Password</span><input type="password" name="password" placeholder="Password" autoComplete="current-password" required maxLength={256} /></label>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="submit-quote" disabled={busy}>{busy ? "Åbner …" : "Åbn Sjælen"}<UiIcon name="arrow" /></button>
      </form>
    </div>
    <footer className="login-footer"><KarmanautCredit className="login-credit" /></footer>
  </div>;
}
