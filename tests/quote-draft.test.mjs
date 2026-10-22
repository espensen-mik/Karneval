import test from 'node:test';
import assert from 'node:assert/strict';
import { surveyQuoteDraft, readQuoteDraft } from '../lib/quote-draft.ts';

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
