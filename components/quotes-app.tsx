"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const categories = ["Generel", "Parade", "Kildeparken", "Børnekarneval", "Gløden"] as const;
type Quote = {
  id: string;
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  quote_source: string | null;
  category: string;
  created_at: string;
};
type SortOrder = "newest" | "oldest" | "name-asc" | "name-desc";

type FilterOption = { value: string; label: string };
function FilterDropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`quote-select custom-filter ${open ? "is-open" : ""}`} ref={rootRef}>
      <span className="filter-label">{label}</span>
      <button
        className="filter-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="filter-trigger-value">{selected}</span>
        <svg className="filter-trigger-chevron" aria-hidden="true" viewBox="0 0 16 16">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="filter-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              className={`filter-option ${option.value === value ? "selected" : ""}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="filter-option-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuotesApp() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle kategorier");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  async function loadQuotes() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/citater", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Citaterne kunne ikke hentes.");
      setQuotes(Array.isArray(result) ? result : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Citaterne kunne ikke hentes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadQuotes(); }, []);

  useEffect(() => {
    if (loading || !window.location.hash.startsWith("#citat-")) return;
    const id = window.location.hash.slice(1);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
  }, [loading]);

  useEffect(() => {
    if (!addModalOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAddModalOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [addModalOpen]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("da");
    const result = quotes.filter((quote) => {
      const matchesText = !term || [
        quote.quote_text, quote.person_name, quote.person_title, quote.organization, quote.quote_source, quote.category,
      ].some((value) => value?.toLocaleLowerCase("da").includes(term));
      const matchesCategory = categoryFilter === "Alle kategorier" || quote.category === categoryFilter;
      return matchesText && matchesCategory;
    });
    return result.sort((a, b) => {
      if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOrder === "name-asc") return a.person_name.localeCompare(b.person_name, "da");
      if (sortOrder === "name-desc") return b.person_name.localeCompare(a.person_name, "da");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [categoryFilter, query, quotes, sortOrder]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setSuccess("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      quote_text: String(data.get("quote_text") || ""),
      person_name: String(data.get("person_name") || ""),
      person_title: String(data.get("person_title") || ""),
      organization: String(data.get("organization") || ""),
      quote_source: String(data.get("quote_source") || ""),
      category: String(data.get("category") || "Generel"),
    };
    try {
      const response = await fetch("/api/citater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Citatet kunne ikke gemmes.");
      setQuotes((current) => [result, ...current]);
      setSuccess("Citatet er tilføjet.");
      setAddModalOpen(false);
      form.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Citatet kunne ikke gemmes.");
    } finally {
      setSaving(false);
    }
  }

  async function updateQuote(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setActionSaving(true);
    setActionError(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      quote_text: String(data.get("quote_text") || ""),
      person_name: String(data.get("person_name") || ""),
      person_title: String(data.get("person_title") || ""),
      organization: String(data.get("organization") || ""),
      quote_source: String(data.get("quote_source") || ""),
      category: String(data.get("category") || "Generel"),
    };
    try {
      const response = await fetch("/api/citater", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Citatet kunne ikke opdateres.");
      setQuotes((current) => current.map((quote) => quote.id === id ? result : quote));
      setEditingId(null);
    } catch (error) {
      setActionError({ id, message: error instanceof Error ? error.message : "Citatet kunne ikke opdateres." });
    } finally {
      setActionSaving(false);
    }
  }

  async function deleteQuote(id: string) {
    if (!window.confirm("Slet citatet permanent? Denne handling kan ikke fortrydes.")) return;
    setActionSaving(true);
    setActionError(null);
    try {
      const response = await fetch("/api/citater?id=" + encodeURIComponent(id), { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Citatet kunne ikke slettes.");
      setQuotes((current) => current.filter((quote) => quote.id !== id));
    } catch (error) {
      setActionError({ id, message: error instanceof Error ? error.message : "Citatet kunne ikke slettes." });
    } finally {
      setActionSaving(false);
    }
  }

  function editForm(quote: Quote) {
    return (
      <form className="quote-edit-form" onSubmit={(event) => void updateQuote(event, quote.id)}>
        <label className="form-field form-wide">Citat<textarea name="quote_text" rows={4} maxLength={3000} required defaultValue={quote.quote_text} /></label>
        <label className="form-field">Navn<input name="person_name" maxLength={160} required defaultValue={quote.person_name} /></label>
        <label className="form-field">Titel<input name="person_title" maxLength={200} required defaultValue={quote.person_title} /></label>
        <label className="form-field">Firma eller organisation<input name="organization" maxLength={200} defaultValue={quote.organization || ""} /></label>
        <label className="form-field">Kilde eller anledning<input name="quote_source" maxLength={500} defaultValue={quote.quote_source || ""} /></label>
        <label className="form-field">Kategori<select name="category" defaultValue={quote.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        {actionError?.id === quote.id && <p className="form-message error form-wide" role="alert">{actionError.message}</p>}
        <div className="quote-actions form-wide">
          <button className="quote-action-save" type="submit" disabled={actionSaving}>{actionSaving ? "Gemmer…" : "Gem ændringer"}</button>
          <button className="quote-action-cancel" type="button" onClick={() => { setEditingId(null); setActionError(null); }}>Annuller</button>
        </div>
      </form>
    );
  }

  return (
    <div className="page-wrap quotes-page">
      <header className="quotes-page-header">
        <div>
          <div className="eyebrow">STEMMER FRA KARNEVAL</div>
          <h1>Citater<span className="title-period">.</span></h1>
          <p>Oplevelser, holdninger og øjeblikke fra Aalborg Karneval.</p>
        </div>
        <button className="add-quote-button" type="button" onClick={() => { setFormError(""); setAddModalOpen(true); }}>
          <span aria-hidden="true">＋</span> Tilføj citat
        </button>
      </header>

      {success && <p className="quote-success" role="status">{success}</p>}

      <section className="quotes-collection quotes-collection-wide" aria-label="Citatsamling">
        <div className="quotes-collection-top">
          <h2>Stemmer fra karneval</h2>
          <span className="result-count">{filtered.length} {filtered.length === 1 ? "citat" : "citater"}</span>
        </div>
        <div className="quote-filter-bar">
          <label className="quote-search">
            <span className="filter-label">Søg i citater</span>
            <span className="quote-search-icon" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Søg efter citat, person, kilde…" />
          </label>
          <FilterDropdown
            label="Kategori"
            value={categoryFilter}
            options={[{ value: "Alle kategorier", label: "Alle kategorier" }, ...categories.map((category) => ({ value: category, label: category }))]}
            onChange={setCategoryFilter}
          />
          <FilterDropdown
            label="Sortér"
            value={sortOrder}
            options={[
              { value: "newest", label: "Nyeste først" },
              { value: "oldest", label: "Ældste først" },
              { value: "name-asc", label: "Navn A–Å" },
              { value: "name-desc", label: "Navn Å–A" },
            ]}
            onChange={(value) => setSortOrder(value as SortOrder)}
          />
        </div>

        {loading && <div className="quotes-empty">Henter citater…</div>}
        {!loading && loadError && <div className="quotes-empty error">{loadError} <button type="button" onClick={() => void loadQuotes()}>Prøv igen</button></div>}
        {!loading && !loadError && filtered.length === 0 && <div className="quotes-empty">{query || categoryFilter !== "Alle kategorier" ? "Ingen citater matcher dine filtre." : "Her er plads til de første stemmer."}</div>}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="quote-list">
            {filtered.map((quote) => (
              <article className="quote-card quote-row" id={`citat-${quote.id}`} key={quote.id}>
                {editingId === quote.id ? editForm(quote) : (
                  <>
                    <div className="quote-row-main">
                      <span className="quote-category">{quote.category}</span>
                      <blockquote>{quote.quote_text}</blockquote>
                      {quote.quote_source && <div className="quote-source">Kilde · {quote.quote_source}</div>}
                    </div>
                    <div className="quote-row-side">
                      <div className="quote-attribution"><strong>{quote.person_name}</strong><span>{quote.person_title}{quote.organization ? " · " + quote.organization : ""}</span></div>
                      <div className="quote-actions">
                        {actionError?.id === quote.id && <span className="form-message error" role="alert">{actionError.message}</span>}
                        <button className="quote-action-cancel" type="button" onClick={() => { setEditingId(quote.id); setActionError(null); }}>Redigér</button>
                        <button className="quote-action-delete" type="button" disabled={actionSaving} onClick={() => void deleteQuote(quote.id)}>Slet</button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="page-footer quotes-page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> CITATSAMLING</span><span>ALLE INDSENDTE CITATER SYNLIGE</span></footer>

      {addModalOpen && (
        <div className="quote-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddModalOpen(false); }}>
          <section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="add-quote-title">
            <header className="quote-modal-header">
              <div><div className="eyebrow muted">NYT BIDRAG</div><h2 id="add-quote-title">Tilføj et citat</h2><p>Giv citatet en stemme og en sammenhæng.</p></div>
              <button className="quote-modal-close" type="button" aria-label="Luk" onClick={() => setAddModalOpen(false)}>×</button>
            </header>
            <form className="quotes-form" onSubmit={submit}>
              <label className="form-field form-wide">Citat
                <textarea name="quote_text" rows={4} maxLength={3000} required placeholder="Skriv citatet her…" />
              </label>
              <label className="form-field">Navn<input name="person_name" maxLength={160} required placeholder="Personens navn" /></label>
              <label className="form-field">Titel<input name="person_title" maxLength={200} required placeholder="Fx arrangør" /></label>
              <label className="form-field">Firma eller organisation <span>(valgfrit)</span><input name="organization" maxLength={200} placeholder="Organisation" /></label>
              <label className="form-field">Kilde eller anledning <span>(valgfrit)</span><input name="quote_source" maxLength={500} placeholder="Fx interview, workshop eller spørgeskema" /></label>
              <label className="form-field form-wide">Kategori
                <select name="category" defaultValue="Generel">{categories.map((category) => <option key={category}>{category}</option>)}</select>
              </label>
              {formError && <p className="form-message error form-wide" role="alert">{formError}</p>}
              <div className="quote-modal-actions form-wide">
                <button className="quote-action-cancel" type="button" onClick={() => setAddModalOpen(false)}>Annuller</button>
                <button className="submit-quote" type="submit" disabled={saving}>{saving ? "Gemmer…" : "Gem citat"} <span aria-hidden="true">↗</span></button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
