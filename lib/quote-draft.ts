export const QUOTE_DRAFT_KEY = "sjaelen:quote-draft";
export type QuoteDraft = { quote_text: string; person_name: string; person_title: string; quote_source: string };

export function surveyQuoteDraft(text: string, firstName: string, age: number, sentence: boolean): QuoteDraft {
  const content = text.trim();
  return {
    quote_text: sentence && !/^aalborg karneval er\b/iu.test(content) ? `Aalborg Karneval er… ${content}` : content,
    person_name: `${firstName} (${age})`,
    person_title: "Deltager i spørgeskemaundersøgelse",
    quote_source: "Sjælen af Karneval 2026",
  };
}

export function readQuoteDraft(value: string): QuoteDraft | null {
  try {
    const draft = JSON.parse(value);
    return draft && ["quote_text", "person_name", "person_title", "quote_source"].every(key => typeof draft[key] === "string") ? draft : null;
  } catch { return null; }
}
