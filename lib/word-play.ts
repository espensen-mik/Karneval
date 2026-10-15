import type { SoulTerm } from "./soul-types.ts";

export type PlayGroup = { id: string; label: string; members: string[] };
export type WordPlay = { groups: PlayGroup[]; excluded: string[] };
export const EMPTY_WORD_PLAY: WordPlay = { groups: [], excluded: [] };
export const WORD_PLAY_STORAGE = "karneval:word-play:v1";

export function readWordPlay(value: unknown): WordPlay {
  if (!value || typeof value !== "object") return EMPTY_WORD_PLAY;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.groups) || !Array.isArray(data.excluded)) return EMPTY_WORD_PLAY;
  const validWord = (word: unknown): word is string => typeof word === "string" && word.length > 0 && word.length <= 200;
  const used = new Set<string>();
  const ids = new Set<string>();
  const groups: PlayGroup[] = [];
  for (const item of data.groups.slice(0, 500)) {
    if (!item || typeof item !== "object" || !validWord(item.id) || !validWord(item.label) || !Array.isArray(item.members) || ids.has(item.id)) continue;
    const members = [...new Set<string>(item.members.filter(validWord))];
    if (members.length < 2 || members.some((word) => used.has(word)) || !members.includes(item.id)) continue;
    groups.push({ id: item.id, label: item.label, members });
    ids.add(item.id); members.forEach((word) => used.add(word));
  }
  return { groups, excluded: [...new Set<string>(data.excluded.filter(validWord))] };
}

export function wordPlayBubbles(terms: SoulTerm[], play: WordPlay): SoulTerm[] {
  const words = terms.filter((term) => term.kind === "word");
  const byId = new Map(words.map((word) => [word.id, word]));
  const excluded = new Set(play.excluded);
  const grouped = new Set(play.groups.flatMap((group) => group.members));
  const bubbles: SoulTerm[] = words.filter((word) => !excluded.has(word.id) && !grouped.has(word.id));
  for (const group of play.groups) {
    const available = group.members.map((id) => byId.get(id)).filter((word): word is SoulTerm => Boolean(word) && !excluded.has(word!.id));
    const contributionIds = [...new Set(available.flatMap((word) => word.contributionIds))];
    if (!contributionIds.length) continue;
    bubbles.push({ id: group.id, label: group.label, kind: "group", variants: available.map((word) => word.id), contributionIds, count: contributionIds.length });
  }
  return bubbles.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "da"));
}

export function mergeWordBubbles(play: WordPlay, source: SoulTerm, target: SoulTerm): WordPlay {
  if (source.id === target.id) return play;
  const members = [...new Set([...(play.groups.find((group) => group.id === target.id)?.members || target.variants), ...(play.groups.find((group) => group.id === source.id)?.members || source.variants)])];
  const combined = new Set(members);
  return {
    groups: [...play.groups.filter((group) => !group.members.some((word) => combined.has(word))), { id: target.id, label: target.label, members }],
    excluded: play.excluded.filter((word) => !combined.has(word)),
  };
}

export function removeWordBubble(play: WordPlay, bubble: SoulTerm): WordPlay {
  const removed = new Set(play.groups.find((group) => group.id === bubble.id)?.members || bubble.variants);
  return {
    groups: play.groups.filter((group) => !group.members.some((word) => removed.has(word))),
    excluded: [...new Set([...play.excluded, ...removed])],
  };
}
