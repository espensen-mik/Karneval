// Read only ages in batches on the server; never send respondent details for statistics.
export async function readSurveySummary(request: (path: string, init?: RequestInit) => Promise<Response>, before: string) {
  let total = 0, sum = 0, expected = Infinity;
  while (total < expected) {
    const response = await request(`survey_responses?select=age&created_at=lte.${encodeURIComponent(before)}&order=id.asc&offset=${total}&limit=1000`, { headers: { Prefer: "count=exact" } });
    const rows: { age: number }[] = await response.json();
    const count = Number(response.headers.get("content-range")?.split("/")[1]);
    if (!Number.isFinite(count)) throw new Error("Antallet af besvarelser mangler.");
    expected = count;
    if (!rows.length && total < expected) throw new Error("Nøgletallene kunne ikke læses færdigt.");
    for (const row of rows) { sum += row.age; total++; }
  }
  return { total, averageAge: total ? sum / total : null };
}
