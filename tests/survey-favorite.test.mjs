import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSurveyFavorite } from '../lib/survey-favorite.ts';

test('favorite update accepts only a response identity and explicit boolean', () => {
  const id = '29f3012d-808a-4bce-8664-bd96b3cb1559';
  assert.deepEqual(validateSurveyFavorite({ id, is_favorite: true, answers: { memory: ['changed'] } }), { id, is_favorite: true });
  assert.deepEqual(validateSurveyFavorite({ id, is_favorite: false }), { id, is_favorite: false });
  for (const input of [null, {}, { id: '*', is_favorite: true }, { id, is_favorite: 'false' }, { id }]) assert.throws(() => validateSurveyFavorite(input));
});
