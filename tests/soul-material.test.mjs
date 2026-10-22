import test from 'node:test';
import assert from 'node:assert/strict';
import { surveyContributions, readSurveyContributions } from '../lib/soul-material.ts';
import { analyzeContributions, networkEdges } from '../lib/soul-analysis.ts';
import { archiveQuery } from '../lib/survey-archive.ts';

test('each sentence field is an independent contribution, with prompt and metadata excluded', () => {
  const rows = [{ id: 'a', first_name: 'Personnavn', email: 'private@example.test', answers: { carnival_is: ['Aalborg Karneval er... fest fest', 'frihed', '', null, 'Aalborg Karneval er...'] } }];
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
  const answers = surveyContributions([{ id: 'a', answers: { carnival_is: ['fest og frihed', 'fest'] } }]);
  const result = analyzeContributions([...answers, { id: 'a', text: 'Fest og frihed', type: 'quote', category: 'Parade', source: null, contextHref: '/citater' }]);
  assert.equal(result.contributions.length, 3);
  assert.equal(result.terms.find(term => term.label === 'fest').count, 3);
  const words = result.terms.filter(term => !term.label.includes(' '));
  assert.equal(networkEdges(words, [], result.aliases).documented[0].count, 2);
});

test('fetches every survey page while requesting only IDs and response text', async () => {
  const paths = [];
  const contributions = await readSurveyContributions(async path => {
    paths.push(path);
    const offset = Number(new URL(`https://example.test/${path}`).searchParams.get('offset'));
    return Response.json(Array.from({ length: Math.min(2, 5 - offset) }, (_, i) => ({ id: String(offset + i), answers: { carnival_is: ['fest'] } })), { headers: { 'content-range': '*/5' } });
  });
  assert.equal(contributions.length, 5);
  assert.equal(paths.length, 3);
  assert.ok(paths.every(path => path.startsWith('survey_responses?select=id,answers&')));
  await assert.rejects(readSurveyContributions(async () => Response.json([], { headers: { 'content-range': '*/5' } })));
  await assert.rejects(readSurveyContributions(async () => Response.json([])));
});

test('context links target the exact response, and cannot inject database filters', () => {
  const id = '00000000-0000-0000-0000-000000000001';
  const [contribution] = surveyContributions([{ id, answers: { carnival_is: ['fest'] } }]);
  const params = new URL(contribution.contextHref, 'https://example.test').searchParams;
  assert.equal(archiveQuery(params).filters, `&id=eq.${id}`);
  assert.equal(archiveQuery(new URLSearchParams('response=bad,or(id.gt.0)')).filters, '');
});


test('all free-text questions contribute without counting prompts, contacts or structured no', () => {
 const [row] = [{id:'all', first_name:'Personnavn', age:99, postal_code:'9000', contact_permission:'yes', answers:{
  invitation:['Trommer'], carnival_is:['Aalborg Karneval er... frihed'], words:['Farver'], difference:['Kreativitet'], traditions:['Nej'], memory:['Venskab'], community:['Sammenhold'], email:['Privatkontakt'], unknown:['Opdigtetmetadata']
 }}];
 const contributions = surveyContributions([row]);
 assert.equal(contributions.length,6);
 assert.equal(new Set(contributions.map(c=>c.id)).size,6);
 assert.ok(contributions.some(c=>c.category==='Hvordan vil du beskrive fællesskabet til Aalborg Karneval?'));
 const result=analyzeContributions(contributions);
 assert.deepEqual(result.terms.map(t=>t.label).sort(),['farver','frihed','kreativitet','sammenhold','trommer','venskab']);
 assert.equal(networkEdges(result.terms,[],result.aliases).documented.length,0);
 const traditions=surveyContributions([{id:'yes',answers:{traditions:['Vi bygger en vogn']}}]);
 assert.equal(traditions.length,1);
});
