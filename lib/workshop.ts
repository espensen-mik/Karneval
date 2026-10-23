export type WorkshopSection = "karneval-er" | "min-oplevelse" | "sjaelen-af-karneval";
export const WORKSHOP_PAGES = [
  { slug: "karneval-er", label: "Karneval er…" },
  { slug: "min-oplevelse", label: "Min oplevelse" },
  { slug: "sjaelen-af-karneval", label: "Sjælen af Karneval" },
] as const;
export type WorkshopHeading = { id: string; group_number: number; title: string; closed: boolean; created_at: string; updated_at: string; statements: { count: number }[] };
export type WorkshopStatement = { id: string; heading_id: string; text: string; created_at: string; updated_at: string };
export type WorkshopStory = { id: string; name: string; text: string; created_at: string; updated_at: string };
export type WorkshopSummary = { group_number: number; text: string; updated_at: string };
export const WORKSHOP_TABLES = { headings: "workshop_headings", statements: "workshop_statements", stories: "workshop_stories", summaries: "workshop_summaries" } as const;
export type WorkshopResource = keyof typeof WORKSHOP_TABLES;
export function workshopId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error("Ugyldigt id. Genindlæs siden.");
  return value;
}
export function workshopGroup(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 3) throw new Error("Vælg gruppe 1, 2 eller 3.");
  return value;
}
function field(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${label} skal udfyldes og må højst være ${max} tegn.`);
  return value.trim();
}
export function workshopMutation(value: unknown, method: "POST" | "PATCH") {
  if (!value || typeof value !== "object") throw new Error("Indtastningen kunne ikke læses.");
  const body = value as Record<string, unknown>;
  if (!Object.hasOwn(WORKSHOP_TABLES, String(body.resource))) throw new Error("Vælg en gyldig materialetype.");
  const resource = body.resource as WorkshopResource;
  const data: Record<string, unknown> = {};
  if (resource === "summaries") data.group_number = workshopGroup(body.group_number);
  else data.id = workshopId(body.id);
  if (resource === "headings") {
    if (method === "POST") { data.group_number = workshopGroup(body.group_number); data.title = field(body.title, "Overskriften", 200); }
    else {
      if (body.title !== undefined) data.title = field(body.title, "Overskriften", 200);
      if (typeof body.closed === "boolean") data.closed = body.closed;
      if (!('title' in data) && !('closed' in data)) throw new Error("Vælg en ændring.");
    }
  } else {
    data.text = field(body.text, "Teksten", resource === "statements" ? 3000 : 12000);
    if (resource === "statements" && method === "POST") data.heading_id = workshopId(body.heading_id);
    if (resource === "stories") data.name = field(body.name, "Navnet", 160);
  }
  const expected = body.updated_at;
  if (method === "PATCH" && (typeof expected !== "string" || !Number.isFinite(Date.parse(expected)))) throw new Error("Genindlæs materialet før du redigerer.");
  return { resource, data, expected: method === "PATCH" ? expected as string : null };
}
