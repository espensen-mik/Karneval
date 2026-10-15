"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnPath } from "@/lib/research-session";
import UiIcon from "./ui-icon";
export default function LoginForm() {
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
  return <div className="research-login"><a className="survey-brand" href="/login"><span className="brand-mark">K</span>Sjælen af Karneval</a><div className="login-card"><span className="eyebrow">ET FÆLLES RESEARCHRUM</span><h1>Ind til sjælen<span>.</span></h1><p>Log ind med det fælles password.</p><form onSubmit={submit}><label className="form-field">Password<input type="password" name="password" autoComplete="current-password" required autoFocus maxLength={256} /></label>{error && <p className="form-message error" role="alert">{error}</p>}<button className="submit-quote" disabled={busy}>{busy ? "Logger ind …" : "Åbn researchrummet"}<UiIcon name="arrow" /></button></form></div><a className="survey-public-link" href="/spoergeskema">Vil du dele din oplevelse af karneval? <UiIcon name="arrow" /></a></div>;
}
