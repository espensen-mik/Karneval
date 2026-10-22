import test from 'node:test';
import assert from 'node:assert/strict';
import { surveyQuoteDraft, readQuoteDraft, surveyAnswerKey, parseSurveyAnswerKey } from '../lib/quote-draft.ts';

test('survey quote handoff includes attribution and only prefixes sentence completions once', () => {
  const draft = surveyQuoteDraft('  fællesskab  ', 'Anna', 32, true);
  assert.deepEqual(draft, {
    quote_text: 'Aalborg Karneval er… fællesskab',
    person_name: 'Anna (32)',
    person_title: 'Deltager i spørgeskemaundersøgelse',
    quote_source: 'Sjælen af Karneval 2026',
  });
  assert.equal(surveyQuoteDraft('Aalborg Karneval er en fest', 'Anna', 32, true).quote_text, 'Aalborg Karneval er en fest');
  assert.equal(surveyQuoteDraft('Min bedste oplevelse', 'Anna', 32, false).quote_text, 'Min bedste oplevelse');
  assert.deepEqual(readQuoteDraft(JSON.stringify(draft)), draft);
  assert.equal(readQuoteDraft('{'), null);
  assert.equal(readQuoteDraft('{"quote_text":3}'), null);
});


test('survey origin identifies each answer independently and survives edited text', () => {
  const response = '29f3012d-808a-4bce-8664-bd96b3cb1559';
  const key = surveyAnswerKey(response, 'carnival_is', 2);
  assert.deepEqual(parseSurveyAnswerKey(key), { response, question: 'carnival_is', index: 2 });
  assert.notEqual(key, surveyAnswerKey(response, 'carnival_is', 1));
  const draft = { ...surveyQuoteDraft('rettet tekst', 'Anna', 32, false), survey_answer_key: key };
  assert.equal(readQuoteDraft(JSON.stringify(draft)).survey_answer_key, key);
  for (const value of ['bad', response + ':email:0', response + ':memory:-1', response + ':memory:100']) assert.equal(parseSurveyAnswerKey(value), null);
  assert.equal(readQuoteDraft(JSON.stringify({ ...draft, survey_answer_key: 42 })), null);
});
