export type WorkshopSection = "karneval-er" | "min-oplevelse" | "sjaelen-af-karneval";
export const WORKSHOP_PAGES = [
  { slug: "karneval-er", label: "Karneval er…" },
  { slug: "min-oplevelse", label: "Min oplevelse" },
  { slug: "sjaelen-af-karneval", label: "Sjælen af Karneval" },
] as const;
export type WorkshopHeading = { id: string; group_number: number; title: string; closed: boolean; created_at: string; updated_at: string };
export type WorkshopStatement = { id: string; heading_id: string; text: string; created_at: string; updated_at: string };
export type WorkshopStory = { id: string; name: string; text: string; created_at: string; updated_at: string };
export type WorkshopSummary = { group_number: number; text: string; updated_at: string };
export type WorkshopArchive = { headings: WorkshopHeading[]; statements: WorkshopStatement[]; stories: WorkshopStory[]; summaries: WorkshopSummary[] };
export const WORKSHOP_TABLES = { headings: "workshop_headings", statements: "workshop_statements", stories: "workshop_stories", summaries: "workshop_summaries" } as const;

/** Keep original group membership and text; search only narrows the view. */
export function workshopGroups(archive: WorkshopArchive, search = "") {
  const query = search.trim().toLocaleLowerCase("da");
  return [1, 2, 3].map(number => {
    const headings = archive.headings.filter(heading => heading.group_number === number).map(heading => ({
      ...heading, statements: archive.statements.filter(statement => statement.heading_id === heading.id),
    }));
    const visible = headings.map(heading => ({ ...heading, statements: !query || heading.title.toLocaleLowerCase("da").includes(query)
      ? heading.statements : heading.statements.filter(statement => statement.text.toLocaleLowerCase("da").includes(query))
    })).filter(heading => !query || heading.statements.length || heading.title.toLocaleLowerCase("da").includes(query));
    return { number, headings: visible, totalHeadings: headings.length, totalStatements: headings.reduce((sum, heading) => sum + heading.statements.length, 0), matchedStatements: visible.reduce((sum, heading) => sum + heading.statements.length, 0) };
  });
}

/** Read every page, including when the API caps pages below the requested size. */
export async function readWorkshopArchive(request: (path: string, init?: RequestInit) => Promise<Response>): Promise<WorkshopArchive> {
  async function read(table: string, summary = false) {
    const rows: unknown[] = [];
    let expected: number | null = null;
    while (true) {
      const response = await request(`${table}?select=*&order=${summary ? "group_number.asc" : "created_at.asc,id.asc"}&offset=${rows.length}&limit=500`, { headers: { Prefer: "count=exact" } });
      if (!response.ok) throw new Error("Workshopmaterialet kunne ikke læses.");
      const batch = await response.json();
      const range = response.headers.get("content-range")?.split("/")[1];
      if (range && range !== "*") expected = Number(range);
      if (!Array.isArray(batch) || (!batch.length && expected !== null && rows.length < expected)) throw new Error("Workshoparkivet blev ikke hentet færdigt.");
      rows.push(...batch);
      if ((expected !== null && rows.length >= expected) || (!batch.length) || (expected === null && batch.length < 500)) return rows;
    }
  }
  const [headings, statements, stories, summaries] = await Promise.all(Object.entries(WORKSHOP_TABLES).map(([key, table]) => read(table, key === "summaries")));
  return { headings, statements, stories, summaries } as WorkshopArchive;
}
