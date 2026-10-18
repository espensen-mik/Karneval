import { DANISH_STOPWORDS } from "./soul-stopwords.ts";
import type { Contribution, EditorialLink, SoulEdge, SoulTerm, SynonymGroup } from "./soul-types.ts";

function lexicalText(text: string) {
  return text.normalize("NFC").toLocaleLowerCase("da-DK")
    // Do not turn a year such as 1980’erne into a made-up word node “erne”.
    .replace(/\p{N}+[’']\p{L}+/gu, ".")
    .replace(/[\p{L}\p{N}]*\p{N}[\p{L}\p{N}]*/gu, ".");
}

export function normalizeTerm(text: string): string {
  return (lexicalText(text).match(/\p{L}+/gu) || []).join(" ");
}

function contentWord(word: string) { return word.length > 1 && !DANISH_STOPWORDS.has(word); }

export function termsInText(text: string): Set<string> {
  const found = new Set<string>();
  // Phrases never bridge sentence boundaries, hyphens or punctuation.
  for (const sentence of lexicalText(text).split(/[^\p{L}\s]+|\n/gu)) {
    const words = sentence.match(/\p{L}+/gu) || [];
    for (const word of words) if (contentWord(word)) found.add(word);
    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i <= words.length - size; i++) {
        const phrase = words.slice(i, i + size);
        const start = contentWord(phrase[0]) || phrase[0] === "være";
        const end = contentWord(phrase[size - 1]) || phrase[size - 1] === "selv";
        if (start && end && phrase.some((word) => contentWord(word) || word === "selv")) found.add(phrase.join(" "));
      }
    }
  }
  return found;
}

export function analyzeContributions(input: Contribution[], synonyms: SynonymGroup[] = []) {
  // A repeated API row with the same identity is still one contribution.
  const contributions = [...new Map(input.filter((c) => c.text.trim()).map((c) => [c.id, c])).values()];
  const raw = new Map<string, Set<string>>();
  for (const contribution of contributions) {
    for (const term of termsInText(contribution.analysisText ?? contribution.text)) {
      if (!raw.has(term)) raw.set(term, new Set());
      raw.get(term)!.add(contribution.id);
    }
  }
  const aliases = new Map<string, string>();
  const groups = [...synonyms].sort((a, b) => a.id.localeCompare(b.id));
  for (const group of groups) for (const member of group.terms) {
    const term = normalizeTerm(member);
    if (!aliases.has(term)) aliases.set(term, normalizeTerm(group.label));
  }
  const accumulated = new Map<string, { variants: Set<string>; ids: Set<string> }>();
  for (const [term, ids] of raw) {
    // Multiword candidates must recur in independent contributions, unless curated.
    if (term.includes(" ") && ids.size < 2 && !aliases.has(term)) continue;
    const canonical = aliases.get(term) || term;
    if (!accumulated.has(canonical)) accumulated.set(canonical, { variants: new Set(), ids: new Set() });
    const entry = accumulated.get(canonical)!;
    entry.variants.add(term);
    for (const id of ids) entry.ids.add(id);
  }
  const terms = [...accumulated].map<SoulTerm>(([label, entry]) => ({
    id: label, label,
    kind: aliases.has(label) || groups.some((g) => normalizeTerm(g.label) === label) ? "group" : label.includes(" ") ? "phrase" : "word",
    variants: [...entry.variants].sort((a, b) => a.localeCompare(b, "da")),
    contributionIds: [...entry.ids], count: entry.ids.size,
  })).sort((a, b) => b.count - a.count || (a.kind === "phrase" ? 1 : 0) - (b.kind === "phrase" ? 1 : 0) || a.label.localeCompare(b.label, "da"));
  return { contributions, terms, aliases };
}

export function sharedContributions(a: SoulTerm, b: SoulTerm) {
  const ids = new Set(b.contributionIds);
  return a.contributionIds.filter((id) => ids.has(id));
}

export function networkEdges(terms: SoulTerm[], editorial: EditorialLink[], aliases: Map<string, string>, minEvidence = 1) {
  const documented: SoulEdge[] = [];
  for (let i = 0; i < terms.length; i++) for (let j = i + 1; j < terms.length; j++) {
    const ids = sharedContributions(terms[i], terms[j]);
    if (ids.length >= minEvidence) documented.push({ id: `d:${terms[i].id}|${terms[j].id}`, source: terms[i].id, target: terms[j].id, kind: "documented", count: ids.length, contributionIds: ids });
  }
  documented.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  const present = new Set(terms.map((term) => term.id));
  const interpreted: SoulEdge[] = editorial.flatMap((link) => {
    const source = aliases.get(link.source_term) || link.source_term;
    const target = aliases.get(link.target_term) || link.target_term;
    if (source === target || !present.has(source) || !present.has(target)) return [];
    return [{ id: `e:${link.id}`, source, target, kind: "editorial" as const, count: 0, contributionIds: [], note: link.note, exampleId: link.example_quote_id }];
  });
  return { documented, interpreted };
}

// Area = π × scale² × count. No fixed minimum radius obscuring the data ratio.
export function nodeRadius(count: number, maxCount: number) {
  return 62 * Math.sqrt(count / Math.max(1, maxCount));
}
