import { sourceConfig, sourceHeaders } from "./source-register";

export const SOUL_TABLES = { categories: "soul_categories", synonyms: "soul_synonyms", links: "soul_links" } as const;

export async function soulRows(table: string, select = "*", filters: Record<string, string> = {}) {
  const config = sourceConfig();
  if (!config) throw new Error("Supabase er ikke konfigureret.");
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const url = new URL(`${config.url}/rest/v1/${table}`);
    url.searchParams.set("select", select);
    url.searchParams.set("order", "id.asc");
    for (const [name, value] of Object.entries(filters)) url.searchParams.set(name, value);
    const response = await fetch(url, { headers: { ...sourceHeaders(config.key), Range: `${offset}-${offset + 499}` }, cache: "no-store" });
    // PostgREST can return 416 for the first page beyond an exact multiple of 500.
    if (response.status === 416 && offset > 0) return rows;
    if (!response.ok) throw new Error(`Materialet kunne ikke hentes (HTTP ${response.status}).`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("Ugyldigt svar fra arkivet.");
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}
