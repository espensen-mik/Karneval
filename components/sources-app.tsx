"use client";

import UiIcon from "./ui-icon";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { MAX_PDF_BYTES, RegisteredSource } from "@/lib/source-register";

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Forbindelsen fejlede. Prøv igen.");
  return data;
}

export default function SourcesApp() {
  const [sources, setSources] = useState<RegisteredSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState("");
  const [kind, setKind] = useState<"url" | "pdf">("url");
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<{ file: File; path: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadSources() {
    setLoading(true); setLoadError("");
    try { setSources(await readResponse(await fetch("/api/kilder", { cache: "no-store" }))); }
    catch (error) { setLoadError(error instanceof Error ? error.message : "Kilderne kunne ikke hentes."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadSources(); }, []);
  useEffect(() => {
    if (!loading && window.location.hash.startsWith("#source-")) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [loading]);

  async function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setFormError(""); setSuccess(""); setSaving(true); setStage("Gemmer kilde …");
    try {
      let filePath = "";
      if (kind === "pdf") {
        if (!file || !/\.pdf$/i.test(file.name) || file.size < 5 || file.size > MAX_PDF_BYTES || await file.slice(0, 5).text() !== "%PDF-") throw new Error("Vælg en gyldig PDF på højst 20 MB.");
        if (uploaded?.file === file) { filePath = uploaded.path; }
        else {
          setStage("Uploader PDF …");
          const ticket = await readResponse(await fetch("/api/kilder/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size }) }));
          const upload = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": "application/pdf", "x-upsert": "false" }, body: file });
          if (!upload.ok) throw new Error("PDF-filen kunne ikke uploades. Prøv igen.");
          filePath = ticket.path;
          setUploaded({ file, path: filePath });
        }
      }
      setStage("Gemmer kilde …");
      const source = await readResponse(await fetch("/api/kilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: values.get("title"), creator: values.get("creator"), source_date: values.get("source_date"), url: kind === "url" ? values.get("url") : "", file_path: filePath, file_name: kind === "pdf" ? file?.name : "" }) }));
      setSources((current) => [source, ...current]);
      form.reset(); setKind("url"); setFile(null); setUploaded(null); setSuccess("Kilden er tilføjet.");
      if (loadError) await loadSources();
    } catch (error) { setFormError(error instanceof Error ? error.message : "Kilden kunne ikke gemmes."); }
    finally { setSaving(false); setStage(""); }
  }

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Kilder</div>
        <div className="topbar-status"><span className="status-dot" />{loading ? "Henter kilder …" : loadError ? "Kilderegister" : `${sources.length} kilder`}</div>
      </header>
      <section className="subpage-hero">
        <div className="eyebrow">DOKUMENTATION & SPOR</div>
        <h1>Kilder<span className="title-period">.</span></h1>
        <p>Saml artikler, dokumenter og andre kilder. Tilføj et link eller en PDF med titel, dato og forfatter eller kilde.</p>
      </section>
      <div className="sources-layout">
        <section className="sources-entry" aria-labelledby="source-entry-heading">
          <h2 id="source-entry-heading">Tilføj en kilde</h2>
          <form className="sources-form" onSubmit={saveSource}>
            <fieldset disabled={saving}>
              <label className="form-field">Titel<input name="title" required maxLength={250} placeholder="Kildens titel" /></label>
              <label className="form-field">Forfatter / kilde<input name="creator" required maxLength={200} placeholder="Navn, organisation eller medie" /></label>
              <label className="form-field">Dato<input name="source_date" type="date" required /></label>
              <fieldset className="source-kind-choice">
                <legend>Link eller upload</legend>
                <label><input type="radio" name="source_kind" checked={kind === "url"} onChange={() => { setKind("url"); setFormError(""); }} />URL</label>
                <label><input type="radio" name="source_kind" checked={kind === "pdf"} onChange={() => { setKind("pdf"); setFormError(""); }} />PDF</label>
              </fieldset>
              {kind === "url" ? <label className="form-field">Link<input key="url" name="url" type="url" required maxLength={2000} placeholder="https://…" /></label> : <label className="form-field">PDF-fil<input key="pdf" ref={fileRef} type="file" accept=".pdf,application/pdf" required={!file} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setUploaded(null); setFormError(""); }} /><span>{file ? file.name : "Vælg en PDF på højst 20 MB."}</span></label>}
              <button className="submit-quote" type="submit">{saving ? stage : "Tilføj kilde"}<span aria-hidden="true"><UiIcon name="arrow" /></span></button>
            </fieldset>
            {formError && <p className="form-message error" role="alert">{formError}</p>}
            {success && <p className="form-message success" role="status">{success}</p>}
          </form>
        </section>
        <section className="sources-collection" aria-labelledby="source-collection-heading" aria-busy={loading}>
          <div className="sources-collection-top"><h2 id="source-collection-heading">Kilderegister</h2>{!loading && !loadError && <span className="result-count">{sources.length} KILDER</span>}</div>
          {loading ? <p className="sources-empty" role="status">Henter kilder …</p> : loadError ? <div className="sources-empty"><p className="form-message error" role="alert">{loadError}</p><button className="quiet-button" onClick={() => void loadSources()}>Prøv igen</button></div> : sources.length === 0 ? <div className="sources-empty"><h3>Ingen kilder endnu</h3><p>Tilføj den første kilde med et link eller en PDF.</p></div> : sources.map((source) => (
            <article className="registered-source" key={source.id} id={`source-${source.id}`}>
              <div className="source-kind">{source.file_path ? "PDF" : "URL"}</div>
              <h3>{source.title}</h3>
              <p className="source-creator">{source.creator} · <time dateTime={source.source_date}>{new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(source.source_date))}</time></p>
              {source.file_name && <p className="source-file-name">{source.file_name}</p>}
              <a href={source.url || `/api/kilder/${source.id}/pdf`} target="_blank" rel="noopener noreferrer">{source.file_path ? "Åbn PDF" : "Åbn kilde"}<span aria-hidden="true"> <UiIcon name="arrow" /></span></a>
            </article>
          ))}
        </section>
      </div>
      <footer className="page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> KILDEREGISTER</span><span>OPDATERET I TAKT MED RESEARCHEN</span></footer>
    </div>
  );
}
