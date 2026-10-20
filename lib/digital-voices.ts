export const VOICE_PAGE_SIZE = 24;
export const VOICE_QUESTIONS = ['invitation', 'carnival_is', 'words', 'difference', 'traditions', 'memory', 'community'] as const;
export type VoiceQuestion = (typeof VOICE_QUESTIONS)[number];
export type VoiceTheme = { id: string; name: string; count: number };
export type DigitalVoice = { id: string; response_id: string; question_id: VoiceQuestion; answer_index: number; created_at: string; first_name: string; age: number; text: string; theme_ids: string[] };
export type VoiceCollection = { entries: DigitalVoice[]; themes: VoiceTheme[]; total: number; matched: number; page: number };
export type VoiceTarget = { response_id: string; question_id: VoiceQuestion; answer_index: number; text: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function voiceTarget(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Vælg et svar.');
  const body = value as Record<string, unknown>;
  if (typeof body.response_id !== 'string' || !uuid.test(body.response_id) || !VOICE_QUESTIONS.includes(body.question_id as VoiceQuestion) || typeof body.answer_index !== 'number' || !Number.isInteger(body.answer_index) || body.answer_index < 0 || body.answer_index > 99) throw new Error('Svaret er ugyldigt. Åbn besvarelsen igen.');
  return { p_response: body.response_id, p_question: body.question_id as VoiceQuestion, p_answer: body.answer_index };
}
export function voiceSelection(value: unknown) {
  const target = voiceTarget(value);
  const themes = (value as Record<string, unknown>).theme_ids;
  if (!Array.isArray(themes) || themes.length > 20 || themes.some(id => typeof id !== 'string' || !uuid.test(id))) throw new Error('Vælg højst 20 gyldige temaer.');
  return { ...target, p_themes: [...new Set(themes as string[])] };
}
export function voiceThemeName(value: unknown) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > 80) throw new Error('Temanavnet skal indeholde 1–80 tegn.');
  return name;
}
export function voiceQuery(params: URLSearchParams) {
  const theme = params.get('theme');
  if (theme && !uuid.test(theme)) throw new Error('Temaet er ugyldigt.');
  const response = params.get('response');
  const target = response ? voiceTarget({ response_id: response, question_id: params.get('question'), answer_index: Number(params.get('answer') ?? NaN) }) : null;
  return { p_theme: theme || null, p_query: (params.get('q') || '').trim().slice(0, 100), p_page: Math.max(0, Math.min(100000, Math.floor(Number(params.get('page')) || 0))), p_response: target?.p_response || null, p_question: target?.p_question || null, p_answer: target?.p_answer ?? null };
}
export const voiceContextHref = (id: string) => `/den-digitale-sjael?response=${encodeURIComponent(id)}`;
