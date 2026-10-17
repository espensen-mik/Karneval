export const SURVEY_VERSION = 2;
export const SURVEY_QUESTIONS = [
  { id: "invitation", title: "Du sidder overfor en person, som aldrig har hørt om Aalborg Karneval!", help: "Hvad fortæller du for at overbevise dem om, at de skal deltage næste år?", kind: "text" },
  { id: "carnival_is", title: "Fuldfør sætningen: Aalborg Karneval er…", help: "Skriv lige hvad der falder dig ind - både enkelte ord og hele sætninger. Og tilføj så mange svar som muligt - jo flere du tilføjer, des klogere bliver vi.", kind: "sentences" },
  { id: "words", title: "Hvilke ord vil du bruge til at beskrive Aalborg Karneval?", help: "Jo flere jo bedre — vi samler på ord til et helt nyt sprog om vores karneval. Du må også skrive korte vendinger.", kind: "words" },
  { id: "difference", title: "Hvad gør Aalborg Karneval til noget særligt for dig?", help: "", kind: "text" },
  { id: "traditions", title: "Har du nogen traditioner omkring Aalborg Karneval?", help: "Hvis ja — hvilke?", kind: "text" },
  { id: "memory", title: "Hvad er din allerbedste oplevelse til Aalborg Karneval?", help: "Vær gerne konkret: et særligt godt karnevalsår, en koncert eller en sjov episode.", kind: "text" },
  { id: "community", title: "Hvordan vil du beskrive fællesskabet til Aalborg Karneval?", help: "Fortæl med dine egne ord.", kind: "text" },
] as const;
// Keep the retired word question for validation and reading older responses.
export const ACTIVE_SURVEY_QUESTIONS = SURVEY_QUESTIONS.filter(question => question.kind !== "words");
export type SurveyAnswers = Record<(typeof SURVEY_QUESTIONS)[number]["id"], string[]>;
export type SurveyDraft = { name: string; email: string; age: string; postal_code: string; participations: string; answers: SurveyAnswers; publication_permission: boolean; contact_permission: "" | "yes" | "no" };
export function emptySurvey(): SurveyDraft { return { name: "", email: "", age: "", postal_code: "", participations: "", answers: Object.fromEntries(SURVEY_QUESTIONS.map(q => [q.id, [] as string[]])) as SurveyAnswers, publication_permission: false, contact_permission: "" }; }
function text(value: unknown, max: number) { if (typeof value !== "string" || value.trim().length > max) throw new Error("Et felt er ugyldigt eller for langt."); return value.trim(); }
export function validateSurvey(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Besvarelsen kunne ikke læses.");
  const body = value as Record<string, unknown>;
  if (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) throw new Error("Besvarelsens ID er ugyldigt.");
  const name = text(body.name, 160), email = text(body.email, 254), postal_code = text(body.postal_code, 4);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Udfyld navn og en gyldig mailadresse.");
  if (!/^\d{4}$/.test(postal_code)) throw new Error("Skriv et firecifret postnummer.");
  const age = Number(body.age), participations = Number(body.participations);
  if (body.age === "" || !Number.isInteger(age) || age < 0 || age > 120 || !["string", "number"].includes(typeof body.age)) throw new Error("Skriv en gyldig alder mellem 0 og 120.");
  if (body.participations === "" || !Number.isInteger(participations) || participations < 0 || participations > 300 || !["string", "number"].includes(typeof body.participations)) throw new Error("Skriv et gyldigt antal deltagelser.");
  if (body.publication_permission !== true) throw new Error("Tag stilling til brugen af dine ord, før du sender.");
  if (body.contact_permission !== "yes" && body.contact_permission !== "no") throw new Error("Vælg, om vi må kontakte dig senere.");
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) throw new Error("Svarene kunne ikke læses.");
  const input = body.answers as Record<string, unknown>;
  const answers = Object.fromEntries(SURVEY_QUESTIONS.map(q => {
    const items = q.kind === "words" ? (input[q.id] ?? []) : input[q.id];
    if (!Array.isArray(items) || items.length > (q.kind === "text" ? 1 : 100)) throw new Error("Der er for mange svar i et spørgsmål.");
    return [q.id, items.map(item => text(item, q.kind === "words" ? 120 : 3000)).filter(Boolean)];
  })) as SurveyAnswers;
  if (ACTIVE_SURVEY_QUESTIONS.some(question => !answers[question.id].length)) throw new Error("Besvar alle spørgsmål, før du sender.");
  if (JSON.stringify(answers).length > 40_000) throw new Error("Besvarelsen er for lang. Forkort nogle af dine svar.");
  return { id: body.id, name, email, first_name: name.split(/\s+/u)[0], age, postal_code, participations, answers, publication_permission: true, contact_permission: body.contact_permission === "yes", questionnaire_version: SURVEY_VERSION };
}
export type SurveyResponse = { id: string; first_name: string; age: number; postal_code: string; participations: number; created_at: string; answers: SurveyAnswers; publication_permission: boolean; contact_permission: boolean };
