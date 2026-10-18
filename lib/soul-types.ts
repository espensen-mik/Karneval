export type Contribution = {
  id: string;
  text: string;
  type: "quote" | "survey";
  analysisText?: string;
  category: string;
  contextHref: string;
  source: string | null;
};

export type SoulCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  terms: string[];
  archived: boolean;
  updated_at: string;
};
export type SynonymGroup = { id: string; label: string; terms: string[]; updated_at: string };
export type EditorialLink = {
  id: string;
  source_term: string;
  target_term: string;
  note: string;
  example_quote_id: string | null;
  updated_at: string;
};
export type Curation = { categories: SoulCategory[]; synonyms: SynonymGroup[]; links: EditorialLink[] };
export const EMPTY_CURATION: Curation = { categories: [], synonyms: [], links: [] };
export const SOUL_COLORS = ["#c25148", "#42636c", "#9a754b", "#827286", "#687a59"];

export type SoulTerm = {
  id: string;
  label: string;
  kind: "word" | "phrase" | "group";
  variants: string[];
  contributionIds: string[];
  count: number;
};
export type SoulEdge = {
  id: string;
  source: string;
  target: string;
  kind: "documented" | "editorial";
  count: number;
  contributionIds: string[];
  note?: string;
  exampleId?: string | null;
};
