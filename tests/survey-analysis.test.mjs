import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSurvey, selectSurveyTerms, readAnalysisResponses } from '../lib/survey-analysis.ts';
const row = (id, age, participations, carnival_is) => ({ id, age, participations, carnival_is });
test('words count once per person and once per independent answer', () => {
  const result = analyzeSurvey([row('a', 17, 0, ['Fest fest FEST!', 'Fest og farver']), row('b', 65, 20, ['Fællesskab og fest'])]);
  assert.equal(result.total, 2); assert.equal(result.statements, 3); assert.equal(result.answeredPeople, 2);
  const fest = result.terms.find(item => item.label === 'fest');
  assert.equal(fest.people, 2); assert.equal(fest.answers, 3);
  assert.equal(result.terms.some(item => item.label === 'og'), false);
  assert.equal(result.ages[0].count, 1); assert.equal(result.ages.at(-1).count, 1);
  assert.equal(result.participations[0].count, 1); assert.equal(result.participations.at(-1).count, 1);
  assert.equal(result.averageAge, 41); assert.equal(result.averageParticipations, 10);
});
test('only sentence content is analyzed and the fixed opening is stripped', () => {
  const result = analyzeSurvey([{ ...row('a', 25, 1, ['Aalborg Karneval er... farverigt']), first_name: 'Personnavn', other_answer: 'koncert' }]);
  assert.deepEqual(result.terms.map(item => item.label), ['farverigt']);
});
test('phrases must recur across people, not just in multiple answers from one person', () => {
  const a = row('a', 30, 2, ['god stemning', 'god stemning']);
  assert.equal(analyzeSurvey([a]).terms.some(item => item.label === 'god stemning'), false);
  const result = analyzeSurvey([a, row('b', 40, 5, ['god stemning'])]);
  const phrase = result.terms.find(item => item.label === 'god stemning');
  assert.equal(phrase.people, 2); assert.equal(phrase.answers, 3); assert.equal(phrase.examples.length, 1);
});
test('empty responses, duplicate IDs and histogram boundaries have honest totals', () => {
  const rows = [17,18,24,25,34,35,44,45,54,55,64,65,120].map((age,i) => row(String(i),age,0,[]));
  const result = analyzeSurvey([...rows, rows[0]]);
  assert.equal(result.total, 13); assert.equal(result.ages.reduce((sum,bin) => sum+bin.count,0),13);
  assert.equal(result.statements,0); assert.equal(result.answeredPeople,0);
  assert.equal(analyzeSurvey([]).averageAge,null);
});
test('search, counting unit and minimum select actual terms deterministically', () => {
  const analysis = analyzeSurvey([row('a', 20, 1, ['Fest', 'Fest', 'Farver'])]);
  assert.equal(selectSurveyTerms(analysis,new URLSearchParams('minimum=2')).terms.length,0);
  const result = selectSurveyTerms(analysis,new URLSearchParams('minimum=2&unit=answers&q=FEST'));
  assert.equal(result.terms.length,1); assert.equal(result.terms[0].label,'fest');
});
test('analysis fetches all database pages using only the required columns', async () => {
  const paths = [];
  const result = await readAnalysisResponses(async path => {
    paths.push(path); const offset = Number(new URL(`https://example.test/${path}`).searchParams.get('offset'));
    return Response.json(Array.from({length:Math.min(500,1200-offset)},(_,i)=>row(String(offset+i),30,2,['fest'])), {headers:{'content-range':`*/1200`}});
  });
  assert.equal(result.length,1200); assert.equal(paths.length,3);
  assert.ok(paths.every(path=>path.startsWith('survey_responses?select=id,age,participations,postal_code,carnival_is:answers->carnival_is&')));
  assert.ok(paths.every(path=>!path.includes('email')&&!path.includes('first_name')));
});
