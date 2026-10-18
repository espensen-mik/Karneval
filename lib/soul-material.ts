import type { Contribution } from './soul-types.ts';
import { sentenceContent } from './survey-analysis.ts';

type StatementRow = { id: string; carnival_is: unknown };

export function surveyContributions(rows: StatementRow[]): Contribution[] {
  return [...new Map(rows.map(row => [row.id, row])).values()].flatMap(row =>
    (Array.isArray(row.carnival_is) ? row.carnival_is : []).flatMap((text, index) => {
      if (typeof text !== 'string' || !sentenceContent(text)) return [];
      return [{ id: `survey:${row.id}:${index}`, text: text.trim(), analysisText: sentenceContent(text), type: 'survey' as const,
        category: 'Aalborg Karneval er…', source: null, contextHref: `/den-digitale-sjael?response=${encodeURIComponent(row.id)}` }];
    })
  );
}

export async function readSurveyContributions(request: (path: string, init?: RequestInit) => Promise<Response>) {
  const rows: StatementRow[] = [];
  const before = encodeURIComponent(new Date().toISOString());
  let expected = Infinity;
  while (rows.length < expected) {
    const response = await request(`survey_responses?select=id,carnival_is:answers->carnival_is&created_at=lte.${before}&order=id.asc&offset=${rows.length}&limit=1000`, { headers: { Prefer: 'count=exact' } });
    if (!response.ok) throw new Error('Spørgeskemasvarene kunne ikke hentes.');
    const range = response.headers.get('content-range');
    const count = range ? Number(range.split('/')[1]) : NaN;
    if (!Number.isFinite(count)) throw new Error('Antallet kunne ikke læses.');
    expected = count;
    const batch: StatementRow[] = await response.json();
    if (!Array.isArray(batch) || (!batch.length && rows.length < expected)) throw new Error('Materialet kunne ikke læses færdig.');
    rows.push(...batch);
  }
  return surveyContributions(rows);
}
