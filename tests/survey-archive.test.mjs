import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveQuery, ARCHIVE_PAGE_SIZE } from '../lib/survey-archive.ts';

test('archive sorting happens before pagination with a stable tie breaker', () => {
  const query = archiveQuery(new URLSearchParams('sort=youngest&page=7'));
  assert.equal(query.order, 'age.asc,created_at.desc,id.asc');
  assert.equal(query.page * ARCHIVE_PAGE_SIZE, 175);
  assert.equal(archiveQuery(new URLSearchParams('sort=eldest')).order, 'age.desc,created_at.desc,id.asc');
});
test('search and age filters apply across the complete archive', () => {
  const result = archiveQuery(new URLSearchParams({ q: '  Søren  ', age: 'from40' }));
  assert.ok(result.filters.startsWith('&age=gte.40&age=lte.59&or=(first_name.ilike.*S%C3%B8ren*,'));
  for (const key of ['invitation','carnival_is','words','difference','traditions','memory','community']) assert.ok(result.filters.includes(`answers->>${key}.ilike.*S%C3%B8ren*`));
  assert.ok(!result.filters.includes('email'));
});
test('untrusted query parameters cannot introduce PostgREST operators or orders', () => {
  const result = archiveQuery(new URLSearchParams({ sort: 'email.desc', age: 'age=gt.0', q: 'A*,(email.ilike.*)_%', page: '-1' }));
  assert.equal(result.order, 'created_at.desc,id.asc');
  assert.equal(result.page, 0);
  assert.ok(result.filters.startsWith('&or=(first_name.ilike.*A%20email%20ilike*,'));
  assert.equal(result.filters.split(',').length, 8);
  assert.ok(!result.filters.includes('email.ilike.'));
});
