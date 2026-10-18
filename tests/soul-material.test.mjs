import test from 'node:test';
import assert from 'node:assert/strict';
import { surveyContributions, readSurveyContributions } from '../lib/soul-material.ts';
import { analyzeContributions, networkEdges } from '../lib/soul-analysis.ts';
import { archiveQuery } from '../lib/survey-archive.ts';

test('each sentence field is an independent contribution, with prompt and metadata excluded', () => {
  const rows = [{ id: 'a', first_name: 'Personnavn', email: 'private@example.test', carnival_is: ['Aalborg Karneval er... fest fest', 'frihed', '', null, 'Aalborg Karneval er...'] }];
  const contributions = surveyContributions([...rows, ...rows]);
  assert.equal(contributions.length, 2);
  assert.equal(contributions[0].text, 'Aalborg Karneval er... fest fest');
  assert.equal(contributions[0].analysisText, 'fest fest');
  assert.ok(contributions.every(row => row.type === 'survey' && !('email' in row) && !('first_name' in row)));
  const result = analyzeContributions(contributions);
  assert.deepEqual(result.terms.map(term => term.label).sort(), ['fest', 'frihed']);
  assert.equal(result.terms.find(term => term.label === 'fest').count, 1);
  assert.equal(networkEdges(result.terms, [], result.aliases).documented.length, 0);
});

test('survey answers and quotes combine without identity collisions or invented connections', () => {
  const answers = surveyContributions([{ id: 'a', carnival_is: ['fest og frihed', 'fest'] }]);
  const result = analyzeContributions([...answers, { id: 'a', text: 'Fest og frihed', type: 'quote', category: 'Parade', source: null, contextHref: '/citater' }]);
  assert.equal(result.contributions.length, 3);
  assert.equal(result.terms.find(term => term.label === 'fest').count, 3);
  const words = result.terms.filter(term => !term.label.includes(' '));
  assert.equal(networkEdges(words, [], result.aliases).documented[0].count, 2);
});

test('fetches every survey page while requesting only IDs and sentence fields', async () => {
  const paths = [];
  const contributions = await readSurveyContributions(async path => {
    paths.push(path);
    const offset = Number(new URL(`https://example.test/${path}`).searchParams.get('offset'));
    return Response.json(Array.from({ length: Math.min(2, 5 - offset) }, (_, i) => ({ id: String(offset + i), carnival_is: ['fest'] })), { headers: { 'content-range': '*/5' } });
  });
  assert.equal(contributions.length, 5);
  assert.equal(paths.length, 3);
  assert.ok(paths.every(path => path.startsWith('survey_responses?select=id,carnival_is:answers->carnival_is&')));
  await assert.rejects(readSurveyContributions(async () => Response.json([], { headers: { 'content-range': '*/5' } })));
  await assert.rejects(readSurveyContributions(async () => Response.json([])));
});

test('context links target the exact response, and cannot inject database filters', () => {
  const id = '00000000-0000-0000-0000-000000000001';
  const [contribution] = surveyContributions([{ id, carnival_is: ['fest'] }]);
  const params = new URL(contribution.contextHref, 'https://example.test').searchParams;
  assert.equal(archiveQuery(params).filters, `&id=eq.${id}`);
  assert.equal(archiveQuery(new URLSearchParams('response=bad,or(id.gt.0)')).filters, '');
});
