import { DANISH_STOPWORDS } from './soul-stopwords.ts';
import { SURVEY_QUESTIONS } from './survey.ts';
import { sentenceContent } from './survey-analysis.ts';

export const SEARCH_SOURCES = { quote: 'Citat', survey: 'Den digitale sjæl', workshop: 'Sjælemøde', source: 'Kilde' } as const;
export type SearchSource = keyof typeof SEARCH_SOURCES;
export type SearchDocument = { id: string; source: SearchSource; title: string; text: string; context: string; href: string; wordText: string };
type Row = Record<string, unknown>;
const str = (value: unknown) => typeof value === 'string' ? value : '';
export const foldSearch = (text: string) => text.normalize('NFC').toLocaleLowerCase('da-DK');

/** Explicit columns keep contact records and email addresses out of the search index. */
export const SEARCH_TABLES = {
  quotes: 'id,quote_text,person_name,person_title,organization,quote_source,category',
  survey_responses: 'id,first_name,age,answers',
  workshop_headings: 'id,group_number,title',
  workshop_statements: 'id,heading_id,text',
  workshop_stories: 'id,name,text',
  workshop_summaries: 'group_number,text',
  sources: 'id,title,creator,file_name',
} as const;

export async function readSearchMaterial(request: (path: string, init?: RequestInit) => Promise<Response>) {
  const entries = await Promise.all(Object.entries(SEARCH_TABLES).map(async ([table, columns]) => {
    const rows: Row[] = [];
    let total = Infinity;
    while (rows.length < total) {
      const response = await request(`${table}?select=${columns}&order=${table === 'workshop_summaries' ? 'group_number' : 'id'}.asc&offset=${rows.length}&limit=500`, { headers: { Prefer: 'count=exact' } });
      if (!response.ok) throw new Error('Materialet kunne ikke læses.');
      const count = Number(response.headers.get('content-range')?.split('/')[1]);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Materialets omfang kunne ikke bekræftes.');
      total = count;
      const batch = await response.json();
      if (!Array.isArray(batch) || (!batch.length && rows.length < total)) throw new Error('Materialet kunne ikke læses færdigt.');
      rows.push(...batch);
    }
    return [table, rows] as const;
  }));
  return searchDocuments(Object.fromEntries(entries));
}

export function searchDocuments(tables: Record<string, Row[]>): SearchDocument[] {
  const documents: SearchDocument[] = [];
  const add = (document: SearchDocument) => { if (document.text.trim()) documents.push(document); };
  for (const row of tables.quotes || []) add({ id: `quote:${row.id}`, source: 'quote', title: str(row.person_name) || 'Citat', text: str(row.quote_text), wordText: str(row.quote_text), context: [row.person_title, row.organization, row.quote_source, row.category].filter(Boolean).join(' · '), href: `/citater#citat-${row.id}` });
  for (const row of tables.survey_responses || []) {
    const answers = row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers) ? row.answers as Row : {};
    for (const question of SURVEY_QUESTIONS) {
      const fields = answers[question.id];
      if (!Array.isArray(fields)) continue;
      fields.forEach((value, index) => {
        if (typeof value !== 'string') return;
        const text = value.trim();
        if (!text) return;
        const content = question.kind === 'sentences' ? sentenceContent(text) : text;
        add({ id: `survey:${row.id}:${question.id}:${index}`, source: 'survey', title: `${str(row.first_name)}${typeof row.age === 'number' ? ` · ${row.age} år` : ''}`, text: question.kind === 'sentences' ? `Aalborg Karneval er… ${content}` : text, wordText: question.id === 'traditions' && /^nej[.!]?$/iu.test(content) ? '' : content, context: question.title, href: `/den-digitale-sjael?response=${encodeURIComponent(str(row.id))}` });
      });
    }
  }
  const headings = new Map((tables.workshop_headings || []).map(row => [row.id, row]));
  for (const row of tables.workshop_headings || []) add({ id: `heading:${row.id}`, source: 'workshop', title: `Gruppe ${row.group_number}`, text: str(row.title), wordText: '', context: 'Karneval er… · Overskrift', href: `/sjaelemoede/karneval-er?gruppe=${row.group_number}#workshop-${row.id}` });
  for (const row of tables.workshop_statements || []) {
    const heading = headings.get(row.heading_id);
    add({ id: `statement:${row.id}`, source: 'workshop', title: heading ? `Gruppe ${heading.group_number} · ${str(heading.title)}` : 'Karneval er…', text: str(row.text), wordText: sentenceContent(str(row.text)), context: 'Karneval er…', href: `/sjaelemoede/karneval-er?gruppe=${heading?.group_number || 1}#workshop-${row.heading_id}` });
  }
  for (const row of tables.workshop_stories || []) add({ id: `story:${row.id}`, source: 'workshop', title: str(row.name), text: str(row.text), wordText: str(row.text), context: 'Min oplevelse', href: `/sjaelemoede/min-oplevelse#story-${row.id}` });
  for (const row of tables.workshop_summaries || []) add({ id: `summary:${row.group_number}`, source: 'workshop', title: `Gruppe ${row.group_number}`, text: str(row.text), wordText: str(row.text), context: 'Sjælen af Karneval', href: `/sjaelemoede/sjaelen-af-karneval#summary-${row.group_number}` });
  for (const row of tables.sources || []) add({ id: `source:${row.id}`, source: 'source', title: str(row.title), text: [row.title, row.creator, row.file_name].filter(Boolean).join(' · '), wordText: '', context: 'Kilderegister · Titel, forfatter og filnavn', href: `/kilder#source-${row.id}` });
  return [...new Map(documents.map(document => [document.id, document])).values()];
}

export function frequentWords(documents: SearchDocument[]) {
  const words = new Map<string, { word: string; count: number; texts: number }>();
  for (const document of documents) {
    const seen = new Set<string>();
    for (const word of foldSearch(document.wordText).match(/\p{L}+(?:[’'-]\p{L}+)*/gu) || []) {
      if (word.length < 2 || DANISH_STOPWORDS.has(word)) continue;
      const entry = words.get(word) || { word, count: 0, texts: 0 };
      entry.count++; if (!seen.has(word)) entry.texts++;
      seen.add(word); words.set(word, entry);
    }
  }
  return [...words.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'da'));
}

/** Draw from the entire eligible vocabulary, preferring words outside the last draw. */
export function randomDiscoveryWords<T extends { word: string; count: number }>(words: T[], previous: string[] = [], random = Math.random): T[] {
  const eligible = [...new Map(words.filter(word => word.count > 20).map(word => [word.word, word])).values()];
  const shuffle = (items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const seen = new Set(previous);
  const fresh = shuffle(eligible.filter(word => !seen.has(word.word)));
  const repeated = shuffle(eligible.filter(word => seen.has(word.word)));
  return shuffle([...fresh, ...repeated].slice(0, 20));
}

export function searchMaterial(documents: SearchDocument[], query: string, source = '', page = 0) {
  const normalized = foldSearch(query.trim());
  const terms = normalized.split(/\s+/u).filter(Boolean);
  const matches = terms.length ? documents.filter(document => {
    if (source && document.source !== source) return false;
    const haystack = foldSearch(`${document.text} ${document.title} ${document.context}`);
    return terms.every(term => haystack.includes(term));
  }).map(document => {
    const body = foldSearch(document.text);
    return { document, score: (body.includes(normalized) ? 4 : 0) + terms.filter(term => body.includes(term)).length };
  }).sort((a, b) => b.score - a.score || a.document.id.localeCompare(b.document.id)) : [];
  const currentPage = Math.max(0, Math.min(Math.floor(page) || 0, Math.max(0, Math.ceil(matches.length / 20) - 1)));
  return { total: matches.length, page: currentPage, pages: Math.ceil(matches.length / 20), results: matches.slice(currentPage * 20, currentPage * 20 + 20).map(({ document }) => ({ ...document, wordText: undefined, excerpt: searchExcerpt(document.text, terms) })) };
}

export function searchExcerpt(text: string, terms: string[]) {
  if (text.length <= 320) return text;
  const folded = foldSearch(text);
  const positions = terms.map(term => folded.indexOf(term)).filter(index => index >= 0);
  const position = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, position - 80);
  return `${start ? '…' : ''}${text.slice(start, start + 320)}${start + 320 < text.length ? '…' : ''}`;
}
