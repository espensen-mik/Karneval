export const ARCHIVE_PAGE_SIZE = 25;
export const ARCHIVE_SORTS = {
  newest: { label: "Nyeste først", order: "created_at.desc,id.asc" },
  oldest: { label: "Ældste besvarelser først", order: "created_at.asc,id.asc" },
  youngest: { label: "Alder · yngste først", order: "age.asc,created_at.desc,id.asc" },
  eldest: { label: "Alder · ældste først", order: "age.desc,created_at.desc,id.asc" },
  name: { label: "Fornavn · A–Å", order: "first_name.asc,id.asc" },
  participations: { label: "Flest deltagelser først", order: "participations.desc,id.asc" },
} as const;
export const ARCHIVE_AGES = {
  all: { label: "Alle aldre", filter: "" },
  under25: { label: "Under 25 år", filter: "&age=lt.25" },
  from25: { label: "25–39 år", filter: "&age=gte.25&age=lte.39" },
  from40: { label: "40–59 år", filter: "&age=gte.40&age=lte.59" },
  from60: { label: "60 år og derover", filter: "&age=gte.60" },
} as const;
export function archiveQuery(params: URLSearchParams) {
  const sort = params.get("sort") || "newest";
  const age = params.get("age") || "all";
  const order = ARCHIVE_SORTS[sort as keyof typeof ARCHIVE_SORTS]?.order || ARCHIVE_SORTS.newest.order;
  const ageFilter = ARCHIVE_AGES[age as keyof typeof ARCHIVE_AGES]?.filter || "";
  // Keep PostgREST filter operators and wildcard characters out of the search term.
  const search = (params.get("q") || "").slice(0, 80).replace(/[^\p{L}\p{N}\s'’-]/gu, " ").replace(/\s+/g, " ").trim();
  const page = Math.max(0, Math.min(100000, Math.floor(Number(params.get("page")) || 0)));
  return { page, filters: `${ageFilter}${search ? `&first_name=ilike.${encodeURIComponent(`*${search}*`)}` : ""}`, order };
}
