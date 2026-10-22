export const QUOTE_DRAFT_KEY = "sjaelen:quote-draft";
export type QuoteDraft = { quote_text: string; person_name: string; person_title: string; quote_source: string; survey_answer_key?: string };

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
    return draft && (draft.survey_answer_key == null || parseSurveyAnswerKey(draft.survey_answer_key)) && ["quote_text", "person_name", "person_title", "quote_source"].every(key => typeof draft[key] === "string") ? draft : null;
  } catch { return null; }
}

export function surveyAnswerKey(response: string, question: string, index: number) {
  return `${response}:${question}:${index}`;
}

export function parseSurveyAnswerKey(value: unknown) {
  if (typeof value !== "string") return null;
  const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(invitation|carnival_is|words|difference|traditions|memory|community):([0-9]{1,2})$/i.exec(value);
  return match ? { response: match[1], question: match[2], index: Number(match[3]) } : null;
}
