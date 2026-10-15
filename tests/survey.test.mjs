import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE_SURVEY_QUESTIONS, emptySurvey, validateSurvey } from '../lib/survey.ts';
const valid = () => ({ ...emptySurvey(), id: '11111111-1111-4111-8111-111111111111', name: 'Testperson Efternavn', email: 'isolated@example.test', age: '32', postal_code: '9000', participations: '5', publication_permission: true, contact_permission: 'no', answers: { ...emptySurvey().answers, carnival_is: ['en fest', 'et minde'], words: ['glæde', 'god stemning'] } });
test('the current survey omits the word question and accepts responses without that retired field', () => {
  assert.equal(ACTIVE_SURVEY_QUESTIONS.some(question => question.id === 'words'), false);
  const response = valid(); delete response.answers.words;
  const result = validateSurvey(response);
  assert.equal(result.questionnaire_version, 2);
  assert.deepEqual(result.answers.words, []);
});
test('survey preserves separate answers and exposes only first name in response data', () => {
  const result = validateSurvey(valid());
  assert.equal(result.first_name, 'Testperson');
  assert.deepEqual(result.answers.carnival_is, ['en fest', 'et minde']);
  assert.deepEqual(result.answers.words, ['glæde', 'god stemning']);
  assert.equal(result.contact_permission, false);
  assert.equal(result.email, 'isolated@example.test');
});
test('survey rejects missing permission, invalid contact details, age and malformed answers', () => {
  for (const changes of [{ publication_permission: false }, { contact_permission: '' }, { age: null }, { age: '' }, { age: '121' }, { participations: false }, { email: 'bad' }, { postal_code: 'bad' }, { answers: {} }]) assert.throws(() => validateSurvey({ ...valid(), ...changes }));
  assert.throws(() => validateSurvey({ ...valid(), answers: { ...valid().answers, invitation: ['one', 'two'] } }));
});
test('survey never accepts an empty response or an excessive repeated list', () => {
  assert.throws(() => validateSurvey({ ...valid(), answers: emptySurvey().answers }));
  assert.throws(() => validateSurvey({ ...valid(), answers: { ...valid().answers, words: Array(101).fill('test') } }));
});
