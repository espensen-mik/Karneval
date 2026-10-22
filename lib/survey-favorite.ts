export function validateSurveyFavorite(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Ugyldig favorit.");
  const body = value as Record<string, unknown>;
  if (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id) || typeof body.is_favorite !== "boolean") throw new Error("Vælg en gyldig besvarelse og favoritstatus.");
  return { id: body.id, is_favorite: body.is_favorite };
}
