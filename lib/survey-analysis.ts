import { termsInText } from './soul-analysis.ts';
import { surveyGeography } from './survey-geography.ts';
export function sentenceContent(text: string) { return text.replace(/^\s*(?:aalborg\s+)?karneval\s+er\b[\s.…:–-]*/iu, '').trim(); }
export type AnalysisResponse = { id: string; age: number; participations: number; postal_code?: string | null; carnival_is: string[] | null };
const AGE_BINS = [['Under 18', 0, 17], ['18–24 år', 18, 24], ['25–34 år', 25, 34], ['35–44 år', 35, 44], ['45–54 år', 45, 54], ['55–64 år', 55, 64], ['65 år +', 65, 120]] as const;
const VISIT_BINS = [['0 gange', 0, 0], ['1 gang', 1, 1], ['2–4 gange', 2, 4], ['5–9 gange', 5, 9], ['10–19 gange', 10, 19], ['20 gange +', 20, 300]] as const;
export function analyzeSurvey(input: AnalysisResponse[]) {
  const rows = [...new Map(input.map(row => [row.id, row])).values()];
  const terms = new Map<string, { people: Set<string>; answers: number; examples: Set<string> }>();
  let statements = 0, answeredPeople = 0;
  for (const row of rows) {
    const answers = (Array.isArray(row.carnival_is) ? row.carnival_is : []).filter(text => typeof text === 'string' && text.trim());
    if (answers.length) answeredPeople++;
    for (const original of answers) {
      statements++;
      // The fixed sentence opening is a prompt, rather than respondent content.
      const text = sentenceContent(original);
      for (const term of termsInText(text)) {
        if (!terms.has(term)) terms.set(term, { people: new Set(), answers: 0, examples: new Set() });
        const item = terms.get(term)!;
        item.people.add(row.id); item.answers++;
        if (item.examples.size < 5) item.examples.add(original);
      }
    }
  }
  const histogram = (bins: typeof AGE_BINS | typeof VISIT_BINS, key: 'age' | 'participations') => bins.map(([label, min, max]) => ({ label, count: rows.filter(row => row[key] >= min && row[key] <= max).length }));
  const total = rows.length;
  return {
    postalCodeCount: new Set(rows.map(row => row.postal_code?.trim()).filter(code => typeof code === "string" && /^\d{4}$/.test(code))).size,
    total, averageAge: total ? rows.reduce((sum, row) => sum + row.age, 0) / total : null,
    averageParticipations: total ? rows.reduce((sum, row) => sum + row.participations, 0) / total : null,
    ages: histogram(AGE_BINS, 'age'), participations: histogram(VISIT_BINS, 'participations'),
    places: surveyGeography(rows),
    statements, answeredPeople,
    terms: [...terms].filter(([label, item]) => !label.includes(' ') || item.people.size >= 2).map(([label, item]) => ({ label, kind: label.includes(' ') ? 'phrase' : 'word', people: item.people.size, answers: item.answers, examples: [...item.examples] })),
  };
}
export function selectSurveyTerms(analysis: ReturnType<typeof analyzeSurvey>, params: URLSearchParams) {
  const unit = params.get('unit') === 'answers' ? 'answers' : 'people';
  const kind = params.get('kind') === 'phrase' ? 'phrase' : 'word';
  const minimum = [1, 2, 3, 5].includes(Number(params.get('minimum'))) ? Number(params.get('minimum')) : 1;
  const limit = [20, 40, 80].includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 20;
  const query = (params.get('q') || '').normalize('NFC').toLocaleLowerCase('da-DK').trim().slice(0, 100);
  const matching = analysis.terms.filter(term => term.kind === kind && term[unit] >= minimum && term.label.includes(query)).sort((a, b) => b[unit] - a[unit] || a.label.localeCompare(b.label, 'da-DK'));
  return { ...analysis, terms: matching.slice(0, limit), availableTerms: matching.length, unit: unit as "answers" | "people", kind, minimum, limit };
}
export type SurveyAnalysis = ReturnType<typeof selectSurveyTerms>;

export async function readAnalysisResponses(request: (path: string, init?: RequestInit) => Promise<Response>) {
  const rows: AnalysisResponse[] = [];
  const before = encodeURIComponent(new Date().toISOString());
  let expected = Infinity;
  while (rows.length < expected) {
    const response = await request(`survey_responses?select=id,age,participations,postal_code,carnival_is:answers->carnival_is&created_at=lte.${before}&order=id.asc&offset=${rows.length}&limit=1000`, { headers: { Prefer: 'count=exact' } });
    const count = Number(response.headers.get('content-range')?.split('/')[1]);
    if (!Number.isFinite(count)) throw new Error('Antallet kunne ikke læses.');
    expected = count;
    const batch: AnalysisResponse[] = await response.json();
    if (!batch.length && rows.length < expected) throw new Error('Analysen kunne ikke læses færdig.');
    rows.push(...batch);
  }
  return rows;
}
