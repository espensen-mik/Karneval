import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSurveyDeletion } from '../lib/survey-delete.ts';
const id = '11111111-1111-4111-8111-111111111111';
test('deletion requires the exact typed confirmation and one valid ID', () => {
  assert.equal(validateSurveyDeletion({ id, confirmation: 'SLET' }), id);
  for (const confirmation of ['', undefined, true, 'slet', 'Slet', ' SLET', 'SLET ']) assert.throws(() => validateSurveyDeletion({ id, confirmation }));
  for (const invalid of ['', 'not-an-id', `${id}&id=neq.null`, '*', null]) assert.throws(() => validateSurveyDeletion({ id: invalid, confirmation: 'SLET' }));
  assert.throws(() => validateSurveyDeletion(null));
});
