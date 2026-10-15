export type SoulView = {
  category: string; query: string; kind: string; minimum: number; edgeMinimum: number;
  limit: number; moreEdges: boolean; editorialVisible: boolean; highlightCategory: string;
};
export const DEFAULT_SOUL_VIEW: SoulView = {
  category: "", query: "", kind: "all", minimum: 2, edgeMinimum: 2, limit: 20,
  moreEdges: false, editorialVisible: true, highlightCategory: "",
};
export function parseSoulView(params: Record<string, string | string[] | undefined>): SoulView {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const choice = (key: string, allowed: number[], fallback: number) => allowed.includes(Number(value(key))) ? Number(value(key)) : fallback;
  return {
    category: value("category").slice(0, 100), query: value("query").slice(0, 100),
    kind: ["all", "word", "phrase", "group"].includes(value("kind")) ? value("kind") : "all",
    minimum: choice("minimum", [1, 2, 3, 5], 2), edgeMinimum: choice("edgeMinimum", [1, 2, 3, 5], 2),
    limit: choice("limit", [20, 30, 40], 20), moreEdges: value("moreEdges") === "true",
    editorialVisible: value("editorialVisible") !== "false", highlightCategory: value("highlightCategory").slice(0, 100),
  };
}
export function soulViewHref(view: SoulView, manage = false) {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_SOUL_VIEW) as (keyof SoulView)[]) {
    if (view[key] !== DEFAULT_SOUL_VIEW[key]) params.set(key, String(view[key]));
  }
  const query = params.toString();
  return `/sjaelen${manage ? "/kuratering" : ""}${query ? `?${query}` : ""}`;
}
