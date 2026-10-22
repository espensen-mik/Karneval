import type { Contribution } from './soul-types.ts';
import { sentenceContent } from './survey-analysis.ts';
import { SURVEY_QUESTIONS } from './survey.ts';

type StatementRow = { id: string; answers: unknown };

export function surveyContributions(rows: StatementRow[]): Contribution[] {
  return [...new Map(rows.map(row => [row.id, row])).values()].flatMap(row => {
    const answers = row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers) ? row.answers as Record<string, unknown> : {};
    return SURVEY_QUESTIONS.flatMap(question => {
      const fields = answers[question.id];
      if (!Array.isArray(fields)) return [];
      return fields.flatMap((text, index) => {
        if (typeof text !== 'string') return [];
        const analysisText = question.id === 'carnival_is' ? sentenceContent(text) : text.trim();
        // A negative tradition choice is structured input, not a free-text statement.
        if (!analysisText || (question.id === 'traditions' && /^nej[.!]?$/iu.test(analysisText))) return [];
        return [{ id: `survey:${row.id}:${question.id}:${index}`, text: text.trim(), analysisText, type: 'survey' as const,
          category: question.title, source: null, contextHref: `/den-digitale-sjael?response=${encodeURIComponent(row.id)}` }];
      });
    });
  });
}

export async function readSurveyContributions(request: (path: string, init?: RequestInit) => Promise<Response>) {
  const rows: StatementRow[] = [];
  const before = encodeURIComponent(new Date().toISOString());
  let expected = Infinity;
  while (rows.length < expected) {
    const response = await request(`survey_responses?select=id,answers&created_at=lte.${before}&order=id.asc&offset=${rows.length}&limit=1000`, { headers: { Prefer: 'count=exact' } });
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
