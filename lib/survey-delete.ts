export function validateSurveyDeletion(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Sletningen kunne ikke læses.");
  const { id, confirmation } = value as Record<string, unknown>;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Besvarelsens ID er ugyldigt.");
  if (confirmation !== "SLET") throw new Error("Skriv præcis SLET for at bekræfte.");
  return id;
}
