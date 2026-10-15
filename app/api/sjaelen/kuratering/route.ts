import { NextRequest, NextResponse } from "next/server";
import { normalizeTerm } from "@/lib/soul-analysis";
import { sourceConfig, sourceHeaders } from "@/lib/source-register";
import { SOUL_COLORS } from "@/lib/soul-types";
import { soulRows, SOUL_TABLES } from "@/lib/soul-server";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const [categories, synonyms, links] = await Promise.all(Object.values(SOUL_TABLES).map((table) => soulRows(table)));
    return NextResponse.json({ categories, synonyms, links }, { headers: noStore });
  } catch { return NextResponse.json({ error: "Kurateringen kunne ikke hentes. Ordnetværket kan stadig undersøges uden redaktionelle tilføjelser." }, { status: 502 }); }
}

function field(body: Record<string, unknown>, name: string, max: number, required = true) {
  const value = typeof body[name] === "string" ? body[name].trim() : "";
  if ((required && !value) || value.length > max) throw new Error(`Feltet ${name} skal udfyldes og må højst være ${max} tegn.`);
  return value;
}
function term(value: string) {
  const normalized = normalizeTerm(value);
  if (!normalized || normalized.length > 100 || normalized.split(" ").length > 4) throw new Error("Et ord eller en vending må højst indeholde fire ord og 100 tegn.");
  return normalized;
}
function terms(value: unknown, minimum = 0) {
  if (!Array.isArray(value) || value.length > 300 || value.some((v) => typeof v !== "string")) throw new Error("Ugyldig ordliste.");
  const result = [...new Set(value.map(term))];
  if (result.length < minimum) throw new Error("Vælg mindst to forskellige varianter.");
  return result;
}

async function mutate(request: NextRequest, method: "POST" | "PATCH" | "DELETE") {
  const config = sourceConfig();
  if (!config) return NextResponse.json({ error: "Kuratering er ikke sat op endnu." }, { status: 503 });
  let body: Record<string, unknown>;
  let resource: keyof typeof SOUL_TABLES;
  let data: Record<string, unknown> = {};
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || !Object.hasOwn(SOUL_TABLES, String(body.resource))) throw new Error("Vælg en gyldig kurateringstype.");
    resource = body.resource as keyof typeof SOUL_TABLES;
    if (method !== "POST" && (typeof body.id !== "string" || !uuid.test(body.id) || typeof body.updated_at !== "string" || !Number.isFinite(Date.parse(body.updated_at)))) throw new Error("Opdater siden før du redigerer igen.");
    if (method === "DELETE" && resource === "categories") throw new Error("Kategorier arkiveres i stedet for at blive slettet.");
    if (method !== "DELETE") {
      if (resource === "categories") {
        const color = field(body, "color", 7);
        if (!SOUL_COLORS.includes(color)) throw new Error("Vælg en farve fra paletten.");
        data = { name: field(body, "name", 100), description: field(body, "description", 600, false), color, terms: terms(body.terms), archived: body.archived === true };
      } else if (resource === "synonyms") {
        const members = terms(body.terms, 2);
        const label = term(field(body, "label", 100));
        if (!members.includes(label)) throw new Error("Gruppens visningsord skal være en af varianterne.");
        const existing = await soulRows(SOUL_TABLES.synonyms);
        if (existing.some((group) => group.id !== body.id && (group.terms as string[]).some((t) => members.includes(t)))) throw new Error("En variant findes allerede i en anden gruppe. Redigér den eksisterende gruppe først.");
        data = { label, terms: members };
      } else {
        const source = term(field(body, "source_term", 100)), target = term(field(body, "target_term", 100));
        if (source === target) throw new Error("Vælg to forskellige ord.");
        const example = body.example_quote_id || null;
        if (example !== null && (typeof example !== "string" || !uuid.test(example))) throw new Error("Ugyldigt kildeeksempel.");
        if (example) {
          const quotes = await soulRows("quotes", "id", { id: `eq.${example}`, publication_consent: "eq.true", status: "eq.approved" });
          if (quotes.length !== 1) throw new Error("Kildeeksemplet er ikke længere tilgængeligt.");
        }
        const [source_term, target_term] = [source, target].sort();
        data = { source_term, target_term, note: field(body, "note", 1200), example_quote_id: example };
      }
    }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kurateringen kunne ikke læses." }, { status: 400 }); }
  try {
    const url = new URL(`${config.url}/rest/v1/${SOUL_TABLES[resource]}`);
    if (method !== "POST") {
      url.searchParams.set("id", `eq.${body.id}`);
      url.searchParams.set("updated_at", `eq.${body.updated_at}`);
    }
    const response = await fetch(url, { method, headers: sourceHeaders(config.key, "return=representation"), ...(method === "DELETE" ? {} : { body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }) }), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: response.status === 409 ? "Denne forbindelse eller gruppe findes allerede." : "Kurateringen kunne ikke gemmes. Prøv igen." }, { status: response.status === 409 ? 409 : 502 });
    const rows = await response.json();
    if (!rows[0]) return NextResponse.json({ error: "En anden har ændret dette element. Genindlæs kurateringen før du prøver igen." }, { status: 409 });
    return NextResponse.json(rows[0], { status: method === "POST" ? 201 : 200, headers: noStore });
  } catch { return NextResponse.json({ error: "Forbindelsen fejlede. Dine indtastninger er bevaret; prøv igen." }, { status: 502 }); }
}
export const POST = (request: NextRequest) => mutate(request, "POST");
export const PATCH = (request: NextRequest) => mutate(request, "PATCH");
export const DELETE = (request: NextRequest) => mutate(request, "DELETE");
